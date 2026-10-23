const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

/**
 * Handle user login (both Admin and Employee)
 */
async function login(req, res) {
  const { email, password } = req.body;

  try {
    // 1. Query user by email
    const [users] = await pool.query(
      'SELECT * FROM users WHERE email = ?',
      [email.toLowerCase().trim()]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    const user = users[0];

    // 2. Compare bcrypt password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    // 3. Generate JWT Token
    const payload = {
      id: user.id,
      employee_id: user.employee_id,
      email: user.email,
      role: user.role
    };

    const token = jwt.sign(
      payload,
      process.env.JWT_SECRET || 'super_secure_jwt_secret_key_leave_portal_2026_dev',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    // 4. Return safe user data without password
    const { password: _, ...safeUserData } = user;

    return res.status(200).json({
      success: true,
      message: `Welcome back, ${user.name}!`,
      token,
      user: safeUserData
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred during login. Please try again later.'
    });
  }
}

/**
 * Get currently authenticated user details
 */
async function getMe(req, res) {
  try {
    const userId = req.user.id;
    const currentYear = new Date().getFullYear();

    const [users] = await pool.query(
      'SELECT id, employee_id, name, email, role, department, designation, phone, joining_date, created_at FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found.'
      });
    }

    const user = users[0];

    // Fetch leave balances for the user if employee
    let balances = [];
    if (user.role === 'employee') {
      const [userBalances] = await pool.query(
        'SELECT leave_type, total_leaves, used_leaves, (total_leaves - used_leaves) AS remaining_leaves, year FROM leave_balances WHERE user_id = ? AND year = ?',
        [userId, currentYear]
      );
      balances = userBalances;
    }

    return res.status(200).json({
      success: true,
      user,
      balances
    });
  } catch (error) {
    console.error('getMe error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch user profile.'
    });
  }
}

module.exports = {
  login,
  getMe
};
