const pool = require('../config/db');
const { calculateDays, isValidDateRange } = require('../utils/dateUtils');

/**
 * Get employee dashboard summary (metrics, balances, recent activity)
 */
async function getDashboardSummary(req, res) {
  const userId = req.user.id;
  const currentYear = new Date().getFullYear();

  try {
    // 1. Leave counts by status
    const [counts] = await pool.query(
      `SELECT 
        COUNT(*) AS total,
        SUM(CASE WHEN status = 'PENDING' THEN 1 ELSE 0 END) AS pending,
        SUM(CASE WHEN status = 'APPROVED' THEN 1 ELSE 0 END) AS approved,
        SUM(CASE WHEN status = 'REJECTED' THEN 1 ELSE 0 END) AS rejected
       FROM leave_requests 
       WHERE user_id = ?`,
      [userId]
    );

    // 2. Leave balances for current year
    const [balances] = await pool.query(
      `SELECT 
        leave_type,
        total_leaves,
        used_leaves,
        (total_leaves - used_leaves) AS remaining_leaves,
        year
       FROM leave_balances 
       WHERE user_id = ? AND year = ?
       ORDER BY leave_type ASC`,
      [userId, currentYear]
    );

    // 3. Recent 5 leave requests
    const [recentRequests] = await pool.query(
      `SELECT 
        id,
        leave_type,
        DATE_FORMAT(start_date, '%Y-%m-%d') AS start_date,
        DATE_FORMAT(end_date, '%Y-%m-%d') AS end_date,
        days_count,
        reason,
        status,
        admin_comment,
        created_at
       FROM leave_requests 
       WHERE user_id = ?
       ORDER BY created_at DESC 
       LIMIT 5`,
      [userId]
    );

    return res.status(200).json({
      success: true,
      data: {
        stats: {
          total: counts[0].total || 0,
          pending: counts[0].pending || 0,
          approved: counts[0].approved || 0,
          rejected: counts[0].rejected || 0
        },
        balances,
        recentRequests
      }
    });
  } catch (error) {
    console.error('Error fetching employee dashboard:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to load dashboard data.'
    });
  }
}

/**
 * Get employee leave balances for a specific year (default: current year)
 */
async function getLeaveBalances(req, res) {
  const userId = req.user.id;
  const year = parseInt(req.query.year, 10) || new Date().getFullYear();

  try {
    const [balances] = await pool.query(
      `SELECT 
        id,
        leave_type,
        total_leaves,
        used_leaves,
        (total_leaves - used_leaves) AS remaining_leaves,
        year
       FROM leave_balances 
       WHERE user_id = ? AND year = ?
       ORDER BY leave_type ASC`,
      [userId, year]
    );

    return res.status(200).json({
      success: true,
      data: balances
    });
  } catch (error) {
    console.error('Error fetching leave balances:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to load leave balances.'
    });
  }
}

/**
 * Get leave history with search and filtering
 */
async function getLeaveHistory(req, res) {
  const userId = req.user.id;
  const { status, leave_type, search, start_date, end_date } = req.query;

  try {
    let query = `
      SELECT 
        r.id,
        r.leave_type,
        DATE_FORMAT(r.start_date, '%Y-%m-%d') AS start_date,
        DATE_FORMAT(r.end_date, '%Y-%m-%d') AS end_date,
        r.days_count,
        r.reason,
        r.status,
        r.admin_comment,
        r.reviewed_at,
        r.created_at,
        u.name AS reviewer_name
      FROM leave_requests r
      LEFT JOIN users u ON r.reviewed_by = u.id
      WHERE r.user_id = ?
    `;

    const queryParams = [userId];

    if (status && status !== 'ALL') {
      query += ` AND r.status = ?`;
      queryParams.push(status.toUpperCase());
    }

    if (leave_type && leave_type !== 'ALL') {
      query += ` AND r.leave_type = ?`;
      queryParams.push(leave_type);
    }

    if (search) {
      query += ` AND (r.reason LIKE ? OR r.admin_comment LIKE ?)`;
      const searchWildcard = `%${search.trim()}%`;
      queryParams.push(searchWildcard, searchWildcard);
    }

    if (start_date) {
      query += ` AND r.start_date >= ?`;
      queryParams.push(start_date);
    }

    if (end_date) {
      query += ` AND r.end_date <= ?`;
      queryParams.push(end_date);
    }

    query += ` ORDER BY r.created_at DESC`;

    const [requests] = await pool.query(query, queryParams);

    return res.status(200).json({
      success: true,
      data: requests
    });
  } catch (error) {
    console.error('Error fetching leave history:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch leave history.'
    });
  }
}

/**
 * Apply for a new leave request
 */
async function applyLeave(req, res) {
  const userId = req.user.id;
  const { leave_type, start_date, end_date, reason } = req.body;

  try {
    // 1. Date Range Validation
    if (!isValidDateRange(start_date, end_date)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date range. Start date must be before or equal to end date.'
      });
    }

    const daysCount = calculateDays(start_date, end_date);
    if (daysCount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Leave duration must be at least 1 day.'
      });
    }

    const applicationYear = new Date(start_date).getFullYear();

    // 2. Check Overlapping Pending or Approved Leaves
    const [overlapping] = await pool.query(
      `SELECT id, leave_type, 
              DATE_FORMAT(start_date, '%Y-%m-%d') AS start_date, 
              DATE_FORMAT(end_date, '%Y-%m-%d') AS end_date, 
              status 
       FROM leave_requests 
       WHERE user_id = ? 
         AND status IN ('PENDING', 'APPROVED')
         AND NOT (end_date < ? OR start_date > ?)`,
      [userId, start_date, end_date]
    );

    if (overlapping.length > 0) {
      const conflict = overlapping[0];
      return res.status(409).json({
        success: false,
        message: `You already have an active (${conflict.status}) ${conflict.leave_type} from ${conflict.start_date} to ${conflict.end_date} that overlaps with this date range.`
      });
    }

    // 3. Check Available Leave Balance for the corresponding year & type
    const [balanceRows] = await pool.query(
      `SELECT total_leaves, used_leaves, (total_leaves - used_leaves) AS remaining_leaves 
       FROM leave_balances 
       WHERE user_id = ? AND leave_type = ? AND year = ?`,
      [userId, leave_type, applicationYear]
    );

    if (balanceRows.length === 0) {
      return res.status(400).json({
        success: false,
        message: `No leave quota found for ${leave_type} in year ${applicationYear}. Please contact HR administrator.`
      });
    }

    const balance = balanceRows[0];
    if (balance.remaining_leaves < daysCount) {
      return res.status(400).json({
        success: false,
        message: `Insufficient leave balance. You requested ${daysCount} day(s), but only have ${balance.remaining_leaves} ${leave_type} day(s) remaining.`
      });
    }

    // 4. Insert Leave Request
    const [insertResult] = await pool.query(
      `INSERT INTO leave_requests (user_id, leave_type, start_date, end_date, days_count, reason, status) 
       VALUES (?, ?, ?, ?, ?, ?, 'PENDING')`,
      [userId, leave_type, start_date, end_date, daysCount, reason.trim()]
    );

    return res.status(201).json({
      success: true,
      message: `Leave application for ${daysCount} day(s) submitted successfully. Waiting for admin approval.`,
      data: {
        requestId: insertResult.insertId,
        leave_type,
        start_date,
        end_date,
        days_count: daysCount,
        status: 'PENDING'
      }
    });
  } catch (error) {
    console.error('Error applying for leave:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to submit leave application. Please try again.'
    });
  }
}

/**
 * Cancel a pending leave request
 */
async function cancelLeaveRequest(req, res) {
  const userId = req.user.id;
  const requestId = parseInt(req.params.id, 10);

  try {
    // 1. Verify that the request exists and belongs to the user
    const [requests] = await pool.query(
      `SELECT id, status FROM leave_requests WHERE id = ? AND user_id = ?`,
      [requestId, userId]
    );

    if (requests.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Leave request not found or you do not have permission to cancel it.'
      });
    }

    const request = requests[0];
    if (request.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: `Only PENDING leave requests can be cancelled. Current status is ${request.status}.`
      });
    }

    // 2. Update status to CANCELLED
    await pool.query(
      `UPDATE leave_requests SET status = 'CANCELLED' WHERE id = ?`,
      [requestId]
    );

    return res.status(200).json({
      success: true,
      message: 'Leave request cancelled successfully.'
    });
  } catch (error) {
    console.error('Error cancelling leave request:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to cancel leave request.'
    });
  }
}

module.exports = {
  getDashboardSummary,
  getLeaveBalances,
  getLeaveHistory,
  applyLeave,
  cancelLeaveRequest
};
