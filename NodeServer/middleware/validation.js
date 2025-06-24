const { body, param, query, validationResult } = require('express-validator');
const { ValidationError } = require('../utils/errorTypes');

// Validation result handler
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const firstError = errors.array()[0];
    throw new ValidationError(firstError.msg, firstError.param);
  }
  next();
};

// Common validation rules
const emailValidation = body('email')
  .isEmail()
  .normalizeEmail()
  .withMessage('Please provide a valid email address');

const passwordValidation = body('password')
  .isLength({ min: 8 })
  .withMessage('Password must be at least 8 characters long')
  .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
  .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character');

const nameValidation = body('name')
  .trim()
  .isLength({ min: 2, max: 50 })
  .withMessage('Name must be between 2 and 50 characters')
  .matches(/^[a-zA-Z\s\u0590-\u05FF]+$/)
  .withMessage('Name can only contain letters and spaces');

const itemCodeValidation = param('itemCode')
  .trim()
  .isLength({ min: 1, max: 50 })
  .withMessage('Item code is required and must be less than 50 characters');

const paginationValidation = [
  query('page')
    .optional()
    .isInt({ min: 1, max: 1000 })
    .withMessage('Page must be a positive integer (max 1000)'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('offset')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Offset must be 0 or greater')
];

const nutritionValidation = [
  body('calories')
    .optional()
    .isFloat({ min: 0, max: 10000 })
    .withMessage('Calories must be between 0 and 10000'),
  body('protein')
    .optional()
    .isFloat({ min: 0, max: 1000 })
    .withMessage('Protein must be between 0 and 1000g'),
  body('carbs')
    .optional()
    .isFloat({ min: 0, max: 1000 })
    .withMessage('Carbs must be between 0 and 1000g'),
  body('fat')
    .optional()
    .isFloat({ min: 0, max: 1000 })
    .withMessage('Fat must be between 0 and 1000g')
];

// Validation rule sets
const registerValidation = [
  emailValidation,
  passwordValidation,
  nameValidation,
  body('display_name')
    .trim()
    .isLength({ min: 2, max: 30 })
    .withMessage('Display name must be between 2 and 30 characters'),
  handleValidationErrors
];

const loginValidation = [
  emailValidation,
  body('password').notEmpty().withMessage('Password is required'),
  handleValidationErrors
];

const updateProfileValidation = [
  body('name').optional().custom((value) => {
    if (value) {
      return nameValidation.run({ body: { name: value } });
    }
    return true;
  }),
  body('display_name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 30 })
    .withMessage('Display name must be between 2 and 30 characters'),
  handleValidationErrors
];

const menuValidation = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Menu name is required and must be less than 255 characters'),
  body('menu_date')
    .isISO8601()
    .withMessage('Menu date must be a valid date'),
  body('target_calories')
    .optional()
    .isInt({ min: 0, max: 10000 })
    .withMessage('Target calories must be between 0 and 10000'),
  handleValidationErrors
];

module.exports = {
  handleValidationErrors,
  registerValidation,
  loginValidation,
  updateProfileValidation,
  menuValidation,
  nutritionValidation,
  paginationValidation,
  itemCodeValidation
}; 