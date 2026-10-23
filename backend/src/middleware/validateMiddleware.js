const { body, validationResult } = require('express-validator');

/**
 * Helper to check validation results and return formatted error response
 */
function handleValidationErrors(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const extractedErrors = errors.array().map(err => ({
      field: err.path || err.param,
      message: err.msg
    }));

    return res.status(400).json({
      success: false,
      message: extractedErrors[0]?.message || 'Validation failed.',
      errors: extractedErrors
    });
  }
  next();
}

/**
 * Validation rules for user login
 */
const validateLogin = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email address.')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required.'),
  handleValidationErrors
];

/**
 * Validation rules for applying for a leave request
 */
const validateLeaveApplication = [
  body('leave_type')
    .isIn(['Casual Leave', 'Sick Leave', 'Earned Leave'])
    .withMessage('Leave type must be Casual Leave, Sick Leave, or Earned Leave.'),
  body('start_date')
    .isISO8601({ strict: true, strictSeparator: true })
    .withMessage('Start date must be a valid date format (YYYY-MM-DD).'),
  body('end_date')
    .isISO8601({ strict: true, strictSeparator: true })
    .withMessage('End date must be a valid date format (YYYY-MM-DD).')
    .custom((endDate, { req }) => {
      if (new Date(endDate) < new Date(req.body.start_date)) {
        throw new Error('End date cannot be earlier than start date.');
      }
      return true;
    }),
  body('reason')
    .trim()
    .isLength({ min: 5, max: 500 })
    .withMessage('Reason must be between 5 and 500 characters.'),
  handleValidationErrors
];

/**
 * Validation rules for admin approving or rejecting a leave request
 */
const validateLeaveStatusUpdate = [
  body('status')
    .isIn(['APPROVED', 'REJECTED'])
    .withMessage('Status must be either APPROVED or REJECTED.'),
  body('admin_comment')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 500 })
    .withMessage('Admin comment must not exceed 500 characters.'),
  handleValidationErrors
];

/**
 * Validation rules for admin adding a new employee
 */
const validateCreateEmployee = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Employee name must be between 2 and 100 characters.'),
  body('email')
    .trim()
    .isEmail()
    .withMessage('A valid email address is required.')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long.'),
  body('department')
    .trim()
    .notEmpty()
    .withMessage('Department is required.'),
  body('designation')
    .trim()
    .notEmpty()
    .withMessage('Designation is required.'),
  body('role')
    .optional()
    .isIn(['admin', 'employee'])
    .withMessage('Role must be either admin or employee.'),
  body('phone')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 20 })
    .withMessage('Phone number must not exceed 20 characters.'),
  body('joining_date')
    .isISO8601({ strict: true })
    .withMessage('Joining date must be a valid date format (YYYY-MM-DD).'),
  handleValidationErrors
];

module.exports = {
  validateLogin,
  validateLeaveApplication,
  validateLeaveStatusUpdate,
  validateCreateEmployee
};
