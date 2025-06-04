const pool = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
  constructor(data) {
    this.id = data.id;
    this.email = data.email;
    this.password_hash = data.password_hash;
    this.name = data.name;
    this.display_name = data.display_name;
    this.profile_picture = data.profile_picture;
    this.role = data.role;
    this.is_active = data.is_active;
    this.email_verified = data.email_verified;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  // Create a new user
  static async create(userData) {
    try {
      // Hash password
      const salt = await bcrypt.genSalt(12);
      const passwordHash = await bcrypt.hash(userData.password, salt);

      const result = await pool.query(`
        INSERT INTO users (email, password_hash, name, display_name, profile_picture, role)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `, [
        userData.email.toLowerCase().trim(),
        passwordHash,
        userData.name.trim(),
        userData.display_name.trim(),
        userData.profile_picture || null,
        userData.role || 'user'
      ]);

      return new User(result.rows[0]);
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  // Find user by ID
  static async findById(id) {
    try {
      const result = await pool.query(`
        SELECT u.*, unp.height, unp.weight, unp.age, unp.gender, 
               unp.dietary_goal, unp.daily_calorie_goal, unp.macro_goals,
               al.code as activity_level_code, al.name as activity_level_name
        FROM users u
        LEFT JOIN user_nutrition_profiles unp ON u.id = unp.user_id
        LEFT JOIN activity_levels al ON unp.activity_level_id = al.id
        WHERE u.id = $1 AND u.is_active = true
      `, [id]);

      if (!result.rows[0]) return null;

      const user = new User(result.rows[0]);
      user.nutrition_profile = {
        height: result.rows[0].height,
        weight: result.rows[0].weight,
        age: result.rows[0].age,
        gender: result.rows[0].gender,
        activity_level: result.rows[0].activity_level_code,
        dietary_goal: result.rows[0].dietary_goal,
        daily_calorie_goal: result.rows[0].daily_calorie_goal,
        macro_goals: result.rows[0].macro_goals
      };

      return user;
    } catch (error) {
      console.error('Error finding user by ID:', error);
      throw error;
    }
  }

  // Find user by email
  static async findByEmail(email) {
    try {
      console.log('🔍 UserModel: findByEmail called with:', email);
      const cleanEmail = email.toLowerCase().trim();
      console.log('🧹 UserModel: cleaned email:', cleanEmail);
      
      const result = await pool.query(`
        SELECT * FROM users WHERE email = $1
      `, [cleanEmail]);

      console.log('📊 UserModel: Query result rows count:', result.rows.length);
      if (result.rows.length > 0) {
        console.log('👤 UserModel: User data found:', {
          id: result.rows[0].id,
          email: result.rows[0].email,
          name: result.rows[0].name,
          display_name: result.rows[0].display_name
        });
      }

      return result.rows[0] ? new User(result.rows[0]) : null;
    } catch (error) {
      console.error('💥 UserModel: Error finding user by email:', error);
      throw error;
    }
  }

  // Verify password
  async comparePassword(candidatePassword) {
    try {
      console.log('🔑 UserModel: comparePassword called');
      console.log('🔐 UserModel: candidate password length:', candidatePassword.length);
      console.log('🔒 UserModel: stored hash exists:', !!this.password_hash);
      console.log('🔒 UserModel: stored hash length:', this.password_hash?.length);
      
      const result = await bcrypt.compare(candidatePassword, this.password_hash);
      console.log('✅ UserModel: password comparison result:', result);
      return result;
    } catch (error) {
      console.error('💥 UserModel: Error comparing password:', error);
      throw error;
    }
  }

  // Update user profile
  async updateProfile(updates) {
    try {
      const allowedFields = ['name', 'display_name', 'profile_picture'];
      const updateFields = [];
      const values = [];
      let paramCount = 1;

      for (const [key, value] of Object.entries(updates)) {
        if (allowedFields.includes(key) && value !== undefined) {
          updateFields.push(`${key} = $${paramCount}`);
          values.push(value);
          paramCount++;
        }
      }

      if (updateFields.length === 0) {
        return this;
      }

      values.push(this.id);
      const result = await pool.query(`
        UPDATE users 
        SET ${updateFields.join(', ')}, updated_at = NOW()
        WHERE id = $${paramCount}
        RETURNING *
      `, values);

      return new User(result.rows[0]);
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  }

  // Update or create nutrition profile
  async updateNutritionProfile(profileData) {
    try {
      // Find activity level ID
      let activityLevelId = null;
      if (profileData.activity_level) {
        const activityResult = await pool.query(
          'SELECT id FROM activity_levels WHERE code = $1',
          [profileData.activity_level]
        );
        activityLevelId = activityResult.rows[0]?.id;
      }

      const result = await pool.query(`
        INSERT INTO user_nutrition_profiles (
          user_id, height, weight, age, gender, activity_level_id,
          dietary_goal, daily_calorie_goal, macro_goals
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (user_id) DO UPDATE SET
          height = EXCLUDED.height,
          weight = EXCLUDED.weight,
          age = EXCLUDED.age,
          gender = EXCLUDED.gender,
          activity_level_id = EXCLUDED.activity_level_id,
          dietary_goal = EXCLUDED.dietary_goal,
          daily_calorie_goal = EXCLUDED.daily_calorie_goal,
          macro_goals = EXCLUDED.macro_goals,
          updated_at = NOW()
        RETURNING *
      `, [
        this.id,
        profileData.height,
        profileData.weight,
        profileData.age,
        profileData.gender,
        activityLevelId,
        profileData.dietary_goal,
        profileData.daily_calorie_goal,
        JSON.stringify(profileData.macro_goals || {})
      ]);

      return result.rows[0];
    } catch (error) {
      console.error('Error updating nutrition profile:', error);
      throw error;
    }
  }

  // Update password
  async updatePassword(newPassword) {
    try {
      const salt = await bcrypt.genSalt(12);
      const passwordHash = await bcrypt.hash(newPassword, salt);

      await pool.query(`
        UPDATE users 
        SET password_hash = $1, updated_at = NOW()
        WHERE id = $2
      `, [passwordHash, this.id]);

      this.password_hash = passwordHash;
      return true;
    } catch (error) {
      console.error('Error updating password:', error);
      throw error;
    }
  }

  // Get user's nutrition logs
  async getNutritionLogs(limit = 30, offset = 0) {
    try {
      const result = await pool.query(`
        SELECT * FROM nutrition_logs 
        WHERE user_id = $1 
        ORDER BY log_date DESC 
        LIMIT $2 OFFSET $3
      `, [this.id, limit, offset]);

      return result.rows;
    } catch (error) {
      console.error('Error getting nutrition logs:', error);
      throw error;
    }
  }

  // Calculate BMR (Basal Metabolic Rate)
  calculateBMR() {
    if (!this.nutrition_profile || !this.nutrition_profile.weight || 
        !this.nutrition_profile.height || !this.nutrition_profile.age) {
      return null;
    }

    const { weight, height, age, gender } = this.nutrition_profile;
    
    if (gender === 'male') {
      return 88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age);
    } else {
      return 447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age);
    }
  }

  // Calculate TDEE (Total Daily Energy Expenditure)
  calculateTDEE() {
    const bmr = this.calculateBMR();
    if (!bmr || !this.nutrition_profile?.activity_level) {
      return null;
    }

    const activityMultipliers = {
      'sedentary': 1.2,
      'lightly_active': 1.375,
      'moderately_active': 1.55,
      'very_active': 1.725,
      'extremely_active': 1.9
    };

    const multiplier = activityMultipliers[this.nutrition_profile.activity_level] || 1.2;
    return Math.round(bmr * multiplier);
  }

  // Deactivate user (soft delete)
  async deactivate() {
    try {
      await pool.query(`
        UPDATE users 
        SET is_active = false, updated_at = NOW()
        WHERE id = $1
      `, [this.id]);

      this.is_active = false;
      return true;
    } catch (error) {
      console.error('Error deactivating user:', error);
      throw error;
    }
  }

  // Get JSON representation (exclude sensitive data)
  toJSON() {
    const userData = {
      id: this.id,
      email: this.email,
      name: this.name,
      display_name: this.display_name,
      profile_picture: this.profile_picture,
      role: this.role,
      is_active: this.is_active,
      email_verified: this.email_verified,
      created_at: this.created_at,
      updated_at: this.updated_at
    };

    // Add nutrition profile if available
    if (this.nutrition_profile) {
      userData.nutrition_profile = this.nutrition_profile;
      userData.bmr = this.calculateBMR();
      userData.tdee = this.calculateTDEE();
    }

    return userData;
  }

  // Static method to get all users (admin only)
  static async getAll(limit = 50, offset = 0) {
    try {
      const result = await pool.query(`
        SELECT * FROM users 
        ORDER BY created_at DESC 
        LIMIT $1 OFFSET $2
      `, [limit, offset]);

      return result.rows.map(row => new User(row));
    } catch (error) {
      console.error('Error getting all users:', error);
      throw error;
    }
  }

  // Static method to count users
  static async count() {
    try {
      const result = await pool.query('SELECT COUNT(*) FROM users WHERE is_active = true');
      return parseInt(result.rows[0].count);
    } catch (error) {
      console.error('Error counting users:', error);
      throw error;
    }
  }
}

module.exports = User; 