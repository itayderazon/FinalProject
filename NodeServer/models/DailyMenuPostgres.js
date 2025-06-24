const pool = require('../config/database');

class DailyMenu {
  constructor(data) {
    this.id = data.id;
    this.user_id = data.user_id;
    this.menu_date = data.menu_date;
    this.name = data.name;
    this.description = data.description;
    this.total_calories = data.total_calories;
    this.total_protein = data.total_protein;
    this.total_carbs = data.total_carbs;
    this.total_fat = data.total_fat;
    this.is_template = data.is_template;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  // Create a new daily menu
  static async create(userId, menuData) {
    try {
      const result = await pool.query(`
        INSERT INTO daily_menus (user_id, menu_date, name, description, is_template)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `, [
        userId,
        menuData.menu_date,
        menuData.name,
        menuData.description || null,
        menuData.is_template || false
      ]);

      return new DailyMenu(result.rows[0]);
    } catch (error) {
      console.error('Error creating daily menu:', error);
      throw error;
    }
  }

  // Find daily menu by ID
  static async findById(menuId) {
    try {
      const result = await pool.query(`
        SELECT * FROM daily_menus WHERE id = $1
      `, [menuId]);

      return result.rows[0] ? new DailyMenu(result.rows[0]) : null;
    } catch (error) {
      console.error('Error finding daily menu:', error);
      throw error;
    }
  }

  // Get user's daily menus for a date range
  static async getUserMenus(userId, startDate, endDate, includeTemplates = false, limit = 50, offset = 0) {
    try {
      let query = `
        SELECT * FROM daily_menus 
        WHERE user_id = $1 
        AND menu_date BETWEEN $2 AND $3
      `;
      
      const params = [userId, startDate, endDate];

      if (!includeTemplates) {
        query += ' AND is_template = false';
      }

      query += ' ORDER BY menu_date DESC, created_at DESC LIMIT $4 OFFSET $5';
      params.push(limit, offset);

      const result = await pool.query(query, params);
      return result.rows.map(row => new DailyMenu(row));
    } catch (error) {
      console.error('Error getting user daily menus:', error);
      throw error;
    }
  }

  // Get user's menu templates
  static async getUserTemplates(userId, limit = 20, offset = 0) {
    try {
      const result = await pool.query(`
        SELECT * FROM daily_menus 
        WHERE user_id = $1 AND is_template = true
        ORDER BY created_at DESC 
        LIMIT $2 OFFSET $3
      `, [userId, limit, offset]);

      return result.rows.map(row => new DailyMenu(row));
    } catch (error) {
      console.error('Error getting user menu templates:', error);
      throw error;
    }
  }

  // Get menu for specific user and date
  static async findByUserAndDate(userId, menuDate, menuName = null) {
    try {
      let query = `
        SELECT * FROM daily_menus 
        WHERE user_id = $1 AND menu_date = $2
      `;
      const params = [userId, menuDate];

      if (menuName) {
        query += ' AND name = $3';
        params.push(menuName);
      }

      query += ' ORDER BY created_at DESC LIMIT 1';

      const result = await pool.query(query, params);
      return result.rows[0] ? new DailyMenu(result.rows[0]) : null;
    } catch (error) {
      console.error('Error finding menu by user and date:', error);
      throw error;
    }
  }

  // Get meals for this daily menu
  async getMeals() {
    try {
      const result = await pool.query(`
        SELECT * FROM daily_menu_meals 
        WHERE daily_menu_id = $1 
        ORDER BY 
          CASE meal_type 
            WHEN 'breakfast' THEN 1 
            WHEN 'lunch' THEN 2 
            WHEN 'dinner' THEN 3 
            WHEN 'snack' THEN 4 
            ELSE 5 
          END,
          meal_order ASC
      `, [this.id]);

      // Get items for each meal
      for (const meal of result.rows) {
        const itemsResult = await pool.query(`
          SELECT dmi.*, p.name as product_name, p.item_code
          FROM daily_menu_items dmi
          LEFT JOIN products p ON dmi.product_id = p.id
          WHERE dmi.daily_menu_meal_id = $1
          ORDER BY dmi.display_order
        `, [meal.id]);

        // Structure items with proper nutrition object to match frontend expectations
        meal.items = itemsResult.rows.map(item => ({
          id: item.id,
          product_id: item.product_id,
          product_name: item.product_name,
          custom_food_name: item.custom_food_name,
          name: item.product_name || item.custom_food_name,
          quantity: item.quantity,
          unit: item.unit,
          nutrition: {
            calories: item.calories,
            protein: item.protein,
            carbs: item.carbs,
            fat: item.fat
          },
          source_type: item.source_type,
          source_menu_id: item.source_menu_id,
          display_order: item.display_order
        }));
      }

      return result.rows;
    } catch (error) {
      console.error('Error getting daily menu meals:', error);
      throw error;
    }
  }

  // Add a meal to this daily menu
  async addMeal(mealData, items = []) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Create meal
      const mealResult = await client.query(`
        INSERT INTO daily_menu_meals (
          daily_menu_id, meal_type, meal_order, name, description,
          target_calories, target_protein, target_carbs, target_fat
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
      `, [
        this.id,
        mealData.meal_type,
        mealData.meal_order || 1,
        mealData.name || null,
        mealData.description || null,
        mealData.target_calories || 0,
        mealData.target_protein || 0,
        mealData.target_carbs || 0,
        mealData.target_fat || 0
      ]);

      const meal = mealResult.rows[0];

      // Add items to meal
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        
        // Debug logging to see what's being saved
        console.log('Saving item to database:', {
          custom_food_name: item.custom_food_name,
          quantity: item.quantity,
          unit: item.unit,
          calories: item.calories,
          protein: item.protein,
          carbs: item.carbs,
          fat: item.fat
        });
        
        await client.query(`
          INSERT INTO daily_menu_items (
            daily_menu_meal_id, product_id, custom_food_name, quantity, unit,
            calories, protein, carbs, fat, source_type, source_menu_id, display_order
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        `, [
          meal.id,
          item.product_id || null,
          item.custom_food_name || null,
          item.quantity,
          item.unit || 'grams',
          item.calories,
          item.protein || 0,
          item.carbs || 0,
          item.fat || 0,
          item.source_type || 'manual',
          item.source_menu_id || null,
          i + 1
        ]);
      }

      // Update daily totals
      await this.updateTotals(client);

      await client.query('COMMIT');
      return meal;
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error adding meal to daily menu:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  // Add generated menu to a specific meal slot
  async addGeneratedMenuToMeal(mealType, generatedMenu, mealOrder = 1) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Create meal from generated menu
      const mealData = {
        meal_type: mealType,
        meal_order: mealOrder,
        name: generatedMenu.name || `Generated ${mealType}`,
        description: generatedMenu.description || null,
        target_calories: generatedMenu.total_nutrition?.calories || 0,
        target_protein: generatedMenu.total_nutrition?.protein || 0,
        target_carbs: generatedMenu.total_nutrition?.carbs || 0,
        target_fat: generatedMenu.total_nutrition?.fat || 0
      };

      const mealResult = await client.query(`
        INSERT INTO daily_menu_meals (
          daily_menu_id, meal_type, meal_order, name, description,
          target_calories, target_protein, target_carbs, target_fat
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
      `, [
        this.id,
        mealData.meal_type,
        mealData.meal_order,
        mealData.name,
        mealData.description,
        mealData.target_calories,
        mealData.target_protein,
        mealData.target_carbs,
        mealData.target_fat
      ]);

      const meal = mealResult.rows[0];

      // Add items from generated menu
      if (generatedMenu.items) {
        for (let i = 0; i < generatedMenu.items.length; i++) {
          const item = generatedMenu.items[i];
          await client.query(`
            INSERT INTO daily_menu_items (
              daily_menu_meal_id, custom_food_name, quantity, unit,
              calories, protein, carbs, fat, source_type, display_order
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          `, [
            meal.id,
            item.name,
            item.portion_grams || 100,
            'grams',
            item.nutrition?.calories || 0,
            item.nutrition?.protein || 0,
            item.nutrition?.carbs || 0,
            item.nutrition?.fat || 0,
            'generated',
            i + 1
          ]);
        }
      }

      // Update daily totals
      await this.updateTotals(client);

      await client.query('COMMIT');
      return meal;
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error adding generated menu to daily menu:', error);
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
          COALESCE(SUM(dmi.calories), 0) as total_calories,
          COALESCE(SUM(dmi.protein), 0) as total_protein,
          COALESCE(SUM(dmi.carbs), 0) as total_carbs,
          COALESCE(SUM(dmi.fat), 0) as total_fat
        FROM daily_menu_meals dmm
        JOIN daily_menu_items dmi ON dmm.id = dmi.daily_menu_meal_id
        WHERE dmm.daily_menu_id = $1
      `, [this.id]);

      const totals = result.rows[0];

      const updateResult = await conn.query(`
        UPDATE daily_menus 
        SET 
          total_calories = $1,
          total_protein = $2,
          total_carbs = $3,
          total_fat = $4,
          updated_at = NOW()
        WHERE id = $5
        RETURNING *
      `, [
        Math.round(totals.total_calories),
        Math.round(totals.total_protein * 100) / 100,
        Math.round(totals.total_carbs * 100) / 100,
        Math.round(totals.total_fat * 100) / 100,
        this.id
      ]);

      const updated = updateResult.rows[0];
      this.total_calories = updated.total_calories;
      this.total_protein = updated.total_protein;
      this.total_carbs = updated.total_carbs;
      this.total_fat = updated.total_fat;
      this.updated_at = updated.updated_at;

      return this;
    } catch (error) {
      console.error('Error updating daily menu totals:', error);
      throw error;
    }
  }

  // Remove a meal from this daily menu
  async removeMeal(mealId) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Delete meal items first (cascade should handle this, but being explicit)
      await client.query(`
        DELETE FROM daily_menu_items WHERE daily_menu_meal_id = $1
      `, [mealId]);

      // Delete meal
      await client.query(`
        DELETE FROM daily_menu_meals WHERE id = $1 AND daily_menu_id = $2
      `, [mealId, this.id]);

      // Update daily totals
      await this.updateTotals(client);

      await client.query('COMMIT');
      return true;
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error removing meal from daily menu:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  // Update daily menu details
  async update(updateData) {
    try {
      const setClause = [];
      const values = [];
      let paramCount = 1;

      if (updateData.name !== undefined) {
        setClause.push(`name = $${paramCount++}`);
        values.push(updateData.name);
      }
      if (updateData.description !== undefined) {
        setClause.push(`description = $${paramCount++}`);
        values.push(updateData.description);
      }
      if (updateData.menu_date !== undefined) {
        setClause.push(`menu_date = $${paramCount++}`);
        values.push(updateData.menu_date);
      }
      if (updateData.is_template !== undefined) {
        setClause.push(`is_template = $${paramCount++}`);
        values.push(updateData.is_template);
      }

      setClause.push(`updated_at = NOW()`);
      values.push(this.id);

      const result = await pool.query(`
        UPDATE daily_menus 
        SET ${setClause.join(', ')}
        WHERE id = $${paramCount}
        RETURNING *
      `, values);

      const updated = result.rows[0];
      Object.assign(this, updated);
      return this;
    } catch (error) {
      console.error('Error updating daily menu:', error);
      throw error;
    }
  }

  // Delete daily menu
  async delete() {
    try {
      await pool.query(`DELETE FROM daily_menus WHERE id = $1`, [this.id]);
      return true;
    } catch (error) {
      console.error('Error deleting daily menu:', error);
      throw error;
    }
  }

  // Get detailed menu with all meals and items
  async getDetailedMenu() {
    try {
      const meals = await this.getMeals();
      
      return {
        ...this.toJSON(),
        meals: meals.map(meal => ({
          id: meal.id,
          meal_type: meal.meal_type,
          meal_order: meal.meal_order,
          name: meal.name,
          description: meal.description,
          target_nutrition: {
            calories: meal.target_calories,
            protein: meal.target_protein,
            carbs: meal.target_carbs,
            fat: meal.target_fat
          },
          items: meal.items.map(item => ({
            id: item.id,
            product_id: item.product_id,
            product_name: item.product_name,
            custom_food_name: item.custom_food_name,
            name: item.product_name || item.custom_food_name,
            quantity: item.quantity,
            unit: item.unit,
            nutrition: {
              calories: item.calories,
              protein: item.protein,
              carbs: item.carbs,
              fat: item.fat
            },
            source_type: item.source_type,
            source_menu_id: item.source_menu_id,
            display_order: item.display_order
          }))
        }))
      };
    } catch (error) {
      console.error('Error getting detailed daily menu:', error);
      throw error;
    }
  }

  // Convert to JSON
  toJSON() {
    return {
      id: this.id,
      user_id: this.user_id,
      menu_date: this.menu_date,
      name: this.name,
      description: this.description,
      total_nutrition: {
        calories: this.total_calories,
        protein: this.total_protein,
        carbs: this.total_carbs,
        fat: this.total_fat
      },
      is_template: this.is_template,
      created_at: this.created_at,
      updated_at: this.updated_at
    };
  }
}

module.exports = DailyMenu; 