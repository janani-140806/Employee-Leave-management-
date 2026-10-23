const bcrypt = require('bcryptjs');
const pool = require('../config/db');

/**
 * Get Admin dashboard metrics and organizational overview
 */
async function getAdminDashboardSummary(req, res) {
  try {
    // 1. Overall counts
    const [counts] = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM users WHERE role = 'employee') AS total_employees,
        COUNT(*) AS total_requests,
        SUM(CASE WHEN status = 'PENDING' THEN 1 ELSE 0 END) AS pending_requests,
        SUM(CASE WHEN status = 'APPROVED' THEN 1 ELSE 0 END) AS approved_requests,
        SUM(CASE WHEN status = 'REJECTED' THEN 1 ELSE 0 END) AS rejected_requests
      FROM leave_requests
    `);

    // 2. Breakdown by Leave Type
    const [leaveTypeStats] = await pool.query(`
      SELECT 
        leave_type,
        COUNT(*) AS request_count,
        SUM(days_count) AS total_days
      FROM leave_requests
      WHERE status = 'APPROVED'
      GROUP BY leave_type
    `);

    // 3. Breakdown by Department
    const [departmentStats] = await pool.query(`
      SELECT 
        u.department,
        COUNT(r.id) AS total_requests,
        SUM(CASE WHEN r.status = 'APPROVED' THEN 1 ELSE 0 END) AS approved_requests,
        SUM(CASE WHEN r.status = 'PENDING' THEN 1 ELSE 0 END) AS pending_requests
      FROM users u
      LEFT JOIN leave_requests r ON u.id = r.user_id
      WHERE u.role = 'employee'
      GROUP BY u.department
    `);

    // 4. Recent 6 leave requests with employee details
    const [recentRequests] = await pool.query(`
      SELECT 
        r.id,
        r.user_id,
        u.employee_id,
        u.name AS employee_name,
        u.email AS employee_email,
        u.department,
        u.designation,
        r.leave_type,
        DATE_FORMAT(r.start_date, '%Y-%m-%d') AS start_date,
        DATE_FORMAT(r.end_date, '%Y-%m-%d') AS end_date,
        r.days_count,
        r.reason,
        r.status,
        r.admin_comment,
        r.created_at
      FROM leave_requests r
      JOIN users u ON r.user_id = u.id
      ORDER BY r.created_at DESC
      LIMIT 6
    `);

    return res.status(200).json({
      success: true,
      data: {
        stats: {
          totalEmployees: counts[0].total_employees || 0,
          totalRequests: counts[0].total_requests || 0,
          pendingRequests: counts[0].pending_requests || 0,
          approvedRequests: counts[0].approved_requests || 0,
          rejectedRequests: counts[0].rejected_requests || 0
        },
        leaveTypeStats,
        departmentStats,
        recentRequests
      }
    });
  } catch (error) {
    console.error('Error fetching admin dashboard:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to load admin dashboard metrics.'
    });
  }
}

/**
 * Get all leave requests with advanced filtering
 */
async function getAllLeaveRequests(req, res) {
  const { status, department, leave_type, search, start_date, end_date } = req.query;

  try {
    let query = `
      SELECT 
        r.id,
        r.user_id,
        u.employee_id,
        u.name AS employee_name,
        u.email AS employee_email,
        u.department,
        u.designation,
        r.leave_type,
        DATE_FORMAT(r.start_date, '%Y-%m-%d') AS start_date,
        DATE_FORMAT(r.end_date, '%Y-%m-%d') AS end_date,
        r.days_count,
        r.reason,
        r.status,
        r.admin_comment,
        r.reviewed_at,
        r.created_at,
        reviewer.name AS reviewer_name
      FROM leave_requests r
      JOIN users u ON r.user_id = u.id
      LEFT JOIN users reviewer ON r.reviewed_by = reviewer.id
      WHERE 1=1
    `;

    const queryParams = [];

    if (status && status !== 'ALL') {
      query += ` AND r.status = ?`;
      queryParams.push(status.toUpperCase());
    }

    if (department && department !== 'ALL') {
      query += ` AND u.department = ?`;
      queryParams.push(department);
    }

    if (leave_type && leave_type !== 'ALL') {
      query += ` AND r.leave_type = ?`;
      queryParams.push(leave_type);
    }

    if (search) {
      query += ` AND (u.name LIKE ? OR u.employee_id LIKE ? OR u.email LIKE ? OR r.reason LIKE ?)`;
      const searchWildcard = `%${search.trim()}%`;
      queryParams.push(searchWildcard, searchWildcard, searchWildcard, searchWildcard);
    }

    if (start_date) {
      query += ` AND r.start_date >= ?`;
      queryParams.push(start_date);
    }

    if (end_date) {
      query += ` AND r.end_date <= ?`;
      queryParams.push(end_date);
    }

    query += ` ORDER BY FIELD(r.status, 'PENDING') DESC, r.created_at DESC`;

    const [requests] = await pool.query(query, queryParams);

    return res.status(200).json({
      success: true,
      data: requests
    });
  } catch (error) {
    console.error('Error fetching all leave requests:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch leave requests.'
    });
  }
}

/**
 * Update leave request status (Approve or Reject) with transactional consistency
 */
async function updateLeaveStatus(req, res) {
  const adminId = req.user.id;
  const requestId = parseInt(req.params.id, 10);
  const { status, admin_comment } = req.body;

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // 1. Fetch current leave request with lock
    const [rows] = await connection.query(
      `SELECT * FROM leave_requests WHERE id = ? FOR UPDATE`,
      [requestId]
    );

    if (rows.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: 'Leave request not found.'
      });
    }

    const request = rows[0];
    const previousStatus = request.status;
    const leaveYear = new Date(request.start_date).getFullYear();

    // 2. Adjust leave balances if status is transitioning
    if (status === 'APPROVED' && previousStatus !== 'APPROVED') {
      // Check if employee still has sufficient balance
      const [balanceRows] = await connection.query(
        `SELECT total_leaves, used_leaves, (total_leaves - used_leaves) AS remaining_leaves 
         FROM leave_balances 
         WHERE user_id = ? AND leave_type = ? AND year = ? 
         FOR UPDATE`,
        [request.user_id, request.leave_type, leaveYear]
      );

      if (balanceRows.length === 0) {
        await connection.rollback();
        return res.status(400).json({
          success: false,
          message: `Employee does not have a ${request.leave_type} balance record for ${leaveYear}.`
        });
      }

      const balance = balanceRows[0];
      if (balance.remaining_leaves < request.days_count) {
        await connection.rollback();
        return res.status(400).json({
          success: false,
          message: `Cannot approve: Employee only has ${balance.remaining_leaves} days remaining, but request is for ${request.days_count} days.`
        });
      }

      // Deduct leaves by increasing used_leaves
      await connection.query(
        `UPDATE leave_balances 
         SET used_leaves = used_leaves + ? 
         WHERE user_id = ? AND leave_type = ? AND year = ?`,
        [request.days_count, request.user_id, request.leave_type, leaveYear]
      );
    } else if (previousStatus === 'APPROVED' && status === 'REJECTED') {
      // Revert previously deducted leaves
      await connection.query(
        `UPDATE leave_balances 
         SET used_leaves = GREATEST(0, used_leaves - ?) 
         WHERE user_id = ? AND leave_type = ? AND year = ?`,
        [request.days_count, request.user_id, request.leave_type, leaveYear]
      );
    }

    // 3. Update the leave request record
    await connection.query(
      `UPDATE leave_requests 
       SET status = ?, 
           admin_comment = ?, 
           reviewed_by = ?, 
           reviewed_at = NOW() 
       WHERE id = ?`,
      [status, admin_comment ? admin_comment.trim() : null, adminId, requestId]
    );

    await connection.commit();

    return res.status(200).json({
      success: true,
      message: `Leave request has been ${status.toLowerCase()} successfully.`
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error updating leave status:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update leave request status.'
    });
  } finally {
    connection.release();
  }
}

/**
 * Get all employees with their profile details and current year leave balances
 */
async function getAllEmployees(req, res) {
  const currentYear = new Date().getFullYear();

  try {
    // 1. Fetch all users
    const [employees] = await pool.query(`
      SELECT 
        id,
        employee_id,
        name,
        email,
        role,
        department,
        designation,
        phone,
        DATE_FORMAT(joining_date, '%Y-%m-%d') AS joining_date,
        created_at
      FROM users
      ORDER BY role ASC, name ASC
    `);

    // 2. Fetch all balances for current year
    const [balances] = await pool.query(`
      SELECT 
        user_id,
        leave_type,
        total_leaves,
        used_leaves,
        (total_leaves - used_leaves) AS remaining_leaves,
        year
      FROM leave_balances
      WHERE year = ?
    `, [currentYear]);

    // 3. Map balances to each employee
    const employeesWithBalances = employees.map(emp => {
      const empBalances = balances.filter(b => b.user_id === emp.id);
      return {
        ...emp,
        balances: empBalances
      };
    });

    return res.status(200).json({
      success: true,
      data: employeesWithBalances
    });
  } catch (error) {
    console.error('Error fetching employees:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch employee list.'
    });
  }
}

/**
 * Create a new employee and allocate default annual leave balances
 */
async function createEmployee(req, res) {
  const {
    name,
    email,
    password,
    department,
    designation,
    role = 'employee',
    phone,
    joining_date,
    casual_leave = 12,
    sick_leave = 10,
    earned_leave = 15
  } = req.body;

  const currentYear = new Date(joining_date || Date.now()).getFullYear();
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // 1. Check if email already exists
    const [existingUsers] = await connection.query(
      'SELECT id FROM users WHERE email = ?',
      [email.toLowerCase().trim()]
    );

    if (existingUsers.length > 0) {
      await connection.rollback();
      return res.status(409).json({
        success: false,
        message: 'An employee account with this email address already exists.'
      });
    }

    // 2. Generate unique Employee ID (e.g., EMP005)
    const [countResult] = await connection.query('SELECT COUNT(*) AS total FROM users');
    const totalUsers = countResult[0].total + 1;
    const employeeId = `EMP${String(totalUsers).padStart(3, '0')}`;

    // 3. Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 4. Insert user
    const [insertResult] = await connection.query(
      `INSERT INTO users (employee_id, name, email, password, role, department, designation, phone, joining_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        employeeId,
        name.trim(),
        email.toLowerCase().trim(),
        hashedPassword,
        role,
        department.trim(),
        designation.trim(),
        phone ? phone.trim() : null,
        joining_date
      ]
    );

    const newUserId = insertResult.insertId;

    // 5. Initialize leave balances for employee
    if (role === 'employee') {
      const balanceEntries = [
        [newUserId, 'Casual Leave', parseInt(casual_leave, 10) || 12, 0, currentYear],
        [newUserId, 'Sick Leave', parseInt(sick_leave, 10) || 10, 0, currentYear],
        [newUserId, 'Earned Leave', parseInt(earned_leave, 10) || 15, 0, currentYear]
      ];

      await connection.query(
        `INSERT INTO leave_balances (user_id, leave_type, total_leaves, used_leaves, year) VALUES ?`,
        [balanceEntries]
      );
    }

    await connection.commit();

    return res.status(201).json({
      success: true,
      message: `Employee ${name} (${employeeId}) registered successfully.`,
      data: {
        id: newUserId,
        employee_id: employeeId,
        name,
        email,
        role,
        department,
        designation
      }
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error creating employee:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create employee account. Please try again.'
    });
  } finally {
    connection.release();
  }
}

/**
 * Adjust employee leave balances manually
 */
async function updateEmployeeBalances(req, res) {
  const employeeId = parseInt(req.params.id, 10);
  const { balances, year = new Date().getFullYear() } = req.body;

  if (!Array.isArray(balances)) {
    return res.status(400).json({
      success: false,
      message: 'Balances must be an array of objects.'
    });
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    for (const b of balances) {
      await connection.query(
        `INSERT INTO leave_balances (user_id, leave_type, total_leaves, used_leaves, year)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE total_leaves = VALUES(total_leaves), used_leaves = VALUES(used_leaves)`,
        [employeeId, b.leave_type, b.total_leaves, b.used_leaves || 0, year]
      );
    }

    await connection.commit();

    return res.status(200).json({
      success: true,
      message: 'Leave balances updated successfully.'
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error updating balances:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update leave balances.'
    });
  } finally {
    connection.release();
  }
}

module.exports = {
  getAdminDashboardSummary,
  getAllLeaveRequests,
  updateLeaveStatus,
  getAllEmployees,
  createEmployee,
  updateEmployeeBalances
};
