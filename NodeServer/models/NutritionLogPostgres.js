const pool = require('../config/database');

class NutritionLog {
  constructor(data) {
    this.id = data.id;
    this.user_id = data.user_id;
    this.log_date = data.log_date;
    this.total_calories = data.total_calories;
    this.total_protein = data.total_protein;
    this.carbs = data.carbs;
    this.fat = data.fat;
    this.water_intake = data.water_intake;
    this.notes = data.notes;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  // Create a new nutrition log for a specific date
  static async create(userId, logDate) {
    try {
      const result = await pool.query(`
        INSERT INTO nutrition_logs (user_id, log_date)
        VALUES ($1, $2)
        ON CONFLICT (user_id, log_date) DO UPDATE SET
          updated_at = NOW()
        RETURNING *
      `, [userId, logDate]);

      return new NutritionLog(result.rows[0]);
    } catch (error) {
      console.error('Error creating nutrition log:', error);
      throw error;
    }
  }

  // Find nutrition log by user and date
  static async findByUserAndDate(userId, date) {
    try {
      const result = await pool.query(`
        SELECT * FROM nutrition_logs 
        WHERE user_id = $1 AND log_date = $2
      `, [userId, date]);

      return result.rows[0] ? new NutritionLog(result.rows[0]) : null;
    } catch (error) {
      console.error('Error finding nutrition log:', error);
      throw error;
    }
  }

  // Get user's nutrition logs for a date range
  static async getUserLogs(userId, startDate, endDate, limit = 30, offset = 0) {
    try {
      const result = await pool.query(`
        SELECT * FROM nutrition_logs 
        WHERE user_id = $1 
        AND log_date BETWEEN $2 AND $3
        ORDER BY log_date DESC 
        LIMIT $4 OFFSET $5
      `, [userId, startDate, endDate, limit, offset]);

      return result.rows.map(row => new NutritionLog(row));
    } catch (error) {
      console.error('Error getting user nutrition logs:', error);
      throw error;
    }
  }

  // Get meals for this nutrition log
  async getMeals() {
    try {
      const result = await pool.query(`
        SELECT * FROM nutrition_log_meals 
        WHERE nutrition_log_id = $1 
        ORDER BY meal_time ASC
      `, [this.id]);

      // Get items for each meal
      for (const meal of result.rows) {
        const itemsResult = await pool.query(`
          SELECT nli.*, p.name as product_name, p.item_code
          FROM nutrition_log_items nli
          LEFT JOIN products p ON nli.product_id = p.id
          WHERE nli.meal_id = $1
          ORDER BY nli.id
        `, [meal.id]);

        meal.items = itemsResult.rows;
      }

      return result.rows;
    } catch (error) {
      console.error('Error getting meals:', error);
      throw error;
    }
  }

  // Add a meal to this nutrition log
  async addMeal(mealType, items = [], mealTime = null) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Create meal
      const mealResult = await client.query(`
        INSERT INTO nutrition_log_meals (nutrition_log_id, meal_type, meal_time)
        VALUES ($1, $2, $3)
        RETURNING *
      `, [this.id, mealType, mealTime || new Date()]);

      const meal = mealResult.rows[0];

      // Add items to meal
      let totalCalories = 0;
      let totalProtein = 0;
      let totalCarbs = 0;
      let totalFat = 0;

      for (const item of items) {
        await client.query(`
          INSERT INTO nutrition_log_items (
            meal_id, product_id, custom_food_name, quantity, unit, 
            calories, protein, carbs, fat
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `, [
          meal.id,
          item.product_id || null,
          item.custom_food_name || null,
          item.quantity,
          item.unit || 'grams',
          item.calories,
          item.protein || 0,
          item.carbs || 0,
          item.fat || 0
        ]);

        totalCalories += item.calories;
        totalProtein += item.protein || 0;
        totalCarbs += item.carbs || 0;
        totalFat += item.fat || 0;
      }

      // Update daily totals
      await this.updateTotals(client);

      await client.query('COMMIT');
      return meal;
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error adding meal:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  // Update daily totals by recalculating from all meals
  async updateTotals(client = null) {
    const conn = client || pool;
    
    try {
      const result = await conn.query(`
        SELECT 
          COALESCE(SUM(nli.calories), 0) as total_calories,
          COALESCE(SUM(nli.protein), 0) as total_protein,
          COALESCE(SUM(nli.carbs), 0) as carbs,
          COALESCE(SUM(nli.fat), 0) as fat
        FROM nutrition_log_meals nlm
        JOIN nutrition_log_items nli ON nlm.id = nli.meal_id
        WHERE nlm.nutrition_log_id = $1
      `, [this.id]);

      const totals = result.rows[0];

      const updateResult = await conn.query(`
        UPDATE nutrition_logs 
        SET 
          total_calories = $1,
          total_protein = $2,
          carbs = $3,
          fat = $4,
          updated_at = NOW()
        WHERE id = $5
        RETURNING *
      `, [
        Math.round(totals.total_calories),
        Math.round(totals.total_protein * 100) / 100,
        Math.round(totals.carbs * 100) / 100,
        Math.round(totals.fat * 100) / 100,
        this.id
      ]);

      const updated = updateResult.rows[0];
      this.total_calories = updated.total_calories;
      this.total_protein = updated.total_protein;
      this.carbs = updated.carbs;
      this.fat = updated.fat;
      this.updated_at = updated.updated_at;

      return true;
    } catch (error) {
      console.error('Error updating totals:', error);
      throw error;
    }
  }

  // Update water intake
  async updateWaterIntake(waterIntake) {
    try {
      const result = await pool.query(`
        UPDATE nutrition_logs 
        SET water_intake = $1, updated_at = NOW()
        WHERE id = $2
        RETURNING *
      `, [waterIntake, this.id]);

      this.water_intake = result.rows[0].water_intake;
      this.updated_at = result.rows[0].updated_at;
      return true;
    } catch (error) {
      console.error('Error updating water intake:', error);
      throw error;
    }
  }

  // Remove a meal and update totals
  async removeMeal(mealId) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Delete meal items first
      await client.query(`
        DELETE FROM nutrition_log_items 
        WHERE meal_id = $1
      `, [mealId]);

      // Delete meal
      await client.query(`
        DELETE FROM nutrition_log_meals 
        WHERE id = $1 AND nutrition_log_id = $2
      `, [mealId, this.id]);

      // Update totals
      await this.updateTotals(client);

      await client.query('COMMIT');
      return true;
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error removing meal:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  // Get nutrition summary for a date range
  static async getSummary(userId, startDate, endDate) {
    try {
      const result = await pool.query(`
        SELECT 
          COUNT(*) as log_days,
          AVG(total_calories) as avg_calories,
          AVG(total_protein) as avg_protein,
          AVG(carbs) as avg_carbs,
          AVG(fat) as avg_fat,
          AVG(water_intake) as avg_water,
          SUM(total_calories) as total_calories,
          MIN(log_date) as first_date,
          MAX(log_date) as last_date
        FROM nutrition_logs 
        WHERE user_id = $1 
        AND log_date BETWEEN $2 AND $3
      `, [userId, startDate, endDate]);

      const summary = result.rows[0];

      // Round averages
      return {
        log_days: parseInt(summary.log_days),
        avg_calories: Math.round(summary.avg_calories || 0),
        avg_protein: Math.round((summary.avg_protein || 0) * 100) / 100,
        avg_carbs: Math.round((summary.avg_carbs || 0) * 100) / 100,
        avg_fat: Math.round((summary.avg_fat || 0) * 100) / 100,
        avg_water: Math.round(summary.avg_water || 0),
        total_calories: Math.round(summary.total_calories || 0),
        date_range: {
          start: summary.first_date,
          end: summary.last_date
        }
      };
    } catch (error) {
      console.error('Error getting nutrition summary:', error);
      throw error;
    }
  }

  // Get detailed nutrition log with meals and items
  async getDetailedLog() {
    try {
      const meals = await this.getMeals();
      
      return {
        ...this.toJSON(),
        meals
      };
    } catch (error) {
      console.error('Error getting detailed log:', error);
      throw error;
    }
  }

  // Get macro breakdown percentages
  getMacroBreakdown() {
    if (!this.total_calories || this.total_calories === 0) {
      return { protein: 0, carbs: 0, fat: 0 };
    }

    const proteinCalories = this.total_protein * 4;
    const carbCalories = this.carbs * 4;
    const fatCalories = this.fat * 9;

    return {
      protein: Math.round((proteinCalories / this.total_calories) * 100),
      carbs: Math.round((carbCalories / this.total_calories) * 100),
      fat: Math.round((fatCalories / this.total_calories) * 100)
    };
  }

  // Convert to JSON
  toJSON() {
    return {
      id: this.id,
      user_id: this.user_id,
      log_date: this.log_date,
      total_calories: this.total_calories,
      total_protein: this.total_protein,
      carbs: this.carbs,
      fat: this.fat,
      water_intake: this.water_intake,
      notes: this.notes,
      macro_breakdown: this.getMacroBreakdown(),
      created_at: this.created_at,
      updated_at: this.updated_at
    };
  }
}

module.exports = NutritionLog; 