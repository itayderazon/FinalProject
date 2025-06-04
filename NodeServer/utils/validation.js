const Joi = require('joi');

class ValidationUtils {
  // User validation schemas
  static userRegistrationSchema = Joi.object({
    name: Joi.string().trim().min(2).max(100).required(),
    display_name: Joi.string().trim().min(2).max(50).required(),
    email: Joi.string().email().lowercase().required(),
    password: Joi.string().min(8).pattern(/^(?=.*[A-Za-z])(?=.*\d)/).required()
      .messages({
        'string.pattern.base': 'Password must contain both letters and numbers'
      })
  });

  static nutritionProfileSchema = Joi.object({
    height: Joi.number().min(100).max(250),
    weight: Joi.number().min(30).max(300),
    age: Joi.number().integer().min(13).max(120),
    gender: Joi.string().valid('male', 'female', 'other'),
    activityLevel: Joi.string().valid('sedentary', 'lightly_active', 'moderately_active', 'very_active', 'extremely_active'),
    dietaryGoal: Joi.string().valid('maintain', 'lose', 'gain'),
    dailyCalorieGoal: Joi.number().min(800).max(5000),
    macroGoals: Joi.object({
      protein: Joi.number().min(0).max(500),
      carbs: Joi.number().min(0).max(1000),
      fat: Joi.number().min(0).max(300)
    })
  });

  // Food validation schema
  static foodSchema = Joi.object({
    name: Joi.string().required(),
    quantity: Joi.number().positive().required(),
    unit: Joi.string().required(),
    calories: Joi.number().min(0).required(),
    macros: Joi.object({
      protein: Joi.number().min(0).required(),
      carbs: Joi.number().min(0).required(),
      fat: Joi.number().min(0).required()
    }).required()
  });

  // Meal validation schema
  static mealSchema = Joi.object({
    type: Joi.string().valid('breakfast', 'lunch', 'dinner', 'snack').required(),
    foods: Joi.array().items(this.foodSchema).min(1).required()
  });

  // Validation helper methods
  static validateUserId(id) {
    const schema = Joi.number().integer().positive();
    return schema.validate(id);
  }

  static validateEmail(email) {
    const schema = Joi.string().email();
    return schema.validate(email);
  }

  static validatePassword(password) {
    const schema = Joi.string().min(8).pattern(/^(?=.*[A-Za-z])(?=.*\d)/);
    return schema.validate(password);
  }

  static validateDateRange(startDate, endDate) {
    const schema = Joi.object({
      startDate: Joi.date().iso(),
      endDate: Joi.date().iso().min(Joi.ref('startDate'))
    });
    return schema.validate({ startDate, endDate });
  }
}

module.exports = ValidationUtils;