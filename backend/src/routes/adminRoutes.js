const express = require('express');
const router = express.Router();
const {
  getAdminDashboardSummary,
  getAllLeaveRequests,
  updateLeaveStatus,
  getAllEmployees,
  createEmployee,
  updateEmployeeBalances
} = require('../controllers/adminController');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');
const {
  validateLeaveStatusUpdate,
  validateCreateEmployee
} = require('../middleware/validateMiddleware');

// All admin routes require authentication and admin role
router.use(authenticateToken, requireRole('admin'));

// GET /api/admin/dashboard - Org metrics & recent requests
router.get('/dashboard', getAdminDashboardSummary);

// GET /api/admin/leaves - All leave requests with filters
router.get('/leaves', getAllLeaveRequests);

// PATCH /api/admin/leaves/:id/status - Approve or reject leave
router.patch('/leaves/:id/status', validateLeaveStatusUpdate, updateLeaveStatus);

// GET /api/admin/employees - Directory of all employees & their balances
router.get('/employees', getAllEmployees);

// POST /api/admin/employees - Register new employee account
router.post('/employees', validateCreateEmployee, createEmployee);

// PUT /api/admin/employees/:id/balances - Update employee leave quota
router.put('/employees/:id/balances', updateEmployeeBalances);

module.exports = router;
