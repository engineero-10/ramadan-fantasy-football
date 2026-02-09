/**
 * Validation Middleware
 * Handles express-validator errors
 */

const { validationResult } = require('express-validator');

/**
 * Check validation results and return errors if any
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map(err => ({
      field: err.path,
      message: err.msg
    }));
    
    return res.status(400).json({
      status: 'error',
      message: 'خطأ في التحقق من البيانات',
      errors: formattedErrors
    });
  }
  
  next();
};

module.exports = validate;
