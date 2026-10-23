const express = require('express');
const router = express.Router();
const {
  getDashboardSummary,
  getLeaveBalances,
  getLeaveHistory,
  applyLeave,
  cancelLeaveRequest
} = require('../controllers/employeeController');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');
const { validateLeaveApplication } = require('../middleware/validateMiddleware');

// All employee routes require authentication and employee role
router.use(authenticateToken, requireRole('employee'));

// GET /api/employee/dashboard - Summary stats and recent requests
router.get('/dashboard', getDashboardSummary);

// GET /api/employee/balances - Leave quota details
router.get('/balances', getLeaveBalances);

// GET /api/employee/leaves - Leave history with search and filter
router.get('/leaves', getLeaveHistory);

// POST /api/employee/leaves - Apply for a new leave
router.post('/leaves', validateLeaveApplication, applyLeave);

// DELETE /api/employee/leaves/:id - Cancel a pending leave
router.delete('/leaves/:id', cancelLeaveRequest);

module.exports = router;
