const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

async function setupDatabase() {
  console.log('🔄 Initializing Employee Leave Management System Database...');
  
  const host = process.env.DB_HOST || 'localhost';
  const port = parseInt(process.env.DB_PORT || '3306', 10);
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || 'root';
  const database = process.env.DB_NAME || 'leave_management_db';

  let connection;

  try {
    // 1. Connect to MySQL without specifying database first
    connection = await mysql.createConnection({
      host,
      port,
      user,
      password
    });

    console.log(`🔌 Connected to MySQL server at ${host}:${port}`);

    // 2. Create database if it does not exist
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
    console.log(`📁 Database \`${database}\` created/verified.`);

    // 3. Switch to database
    await connection.changeUser({ database });

    // 4. Create Tables
    console.log('🔨 Creating tables...');

    await connection.query(`
      CREATE TABLE IF NOT EXISTS \`users\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`employee_id\` VARCHAR(30) NOT NULL UNIQUE,
        \`name\` VARCHAR(100) NOT NULL,
        \`email\` VARCHAR(100) NOT NULL UNIQUE,
        \`password\` VARCHAR(255) NOT NULL,
        \`role\` ENUM('admin', 'employee') NOT NULL DEFAULT 'employee',
        \`department\` VARCHAR(50) NOT NULL,
        \`designation\` VARCHAR(50) NOT NULL,
        \`phone\` VARCHAR(20) DEFAULT NULL,
        \`joining_date\` DATE NOT NULL,
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX \`idx_users_role\` (\`role\`),
        INDEX \`idx_users_department\` (\`department\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS \`leave_balances\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`user_id\` INT NOT NULL,
        \`leave_type\` ENUM('Casual Leave', 'Sick Leave', 'Earned Leave') NOT NULL,
        \`total_leaves\` INT NOT NULL DEFAULT 12,
        \`used_leaves\` INT NOT NULL DEFAULT 0,
        \`year\` INT NOT NULL,
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT \`fk_leave_balances_user\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE,
        CONSTRAINT \`uq_user_type_year\` UNIQUE (\`user_id\`, \`leave_type\`, \`year\`),
        INDEX \`idx_balances_user_year\` (\`user_id\`, \`year\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS \`leave_requests\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`user_id\` INT NOT NULL,
        \`leave_type\` ENUM('Casual Leave', 'Sick Leave', 'Earned Leave') NOT NULL,
        \`start_date\` DATE NOT NULL,
        \`end_date\` DATE NOT NULL,
        \`days_count\` INT NOT NULL,
        \`reason\` TEXT NOT NULL,
        \`status\` ENUM('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
        \`admin_comment\` TEXT DEFAULT NULL,
        \`reviewed_by\` INT DEFAULT NULL,
        \`reviewed_at\` DATETIME DEFAULT NULL,
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT \`fk_leave_requests_user\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE,
        CONSTRAINT \`fk_leave_requests_reviewer\` FOREIGN KEY (\`reviewed_by\`) REFERENCES \`users\` (\`id\`) ON DELETE SET NULL,
        INDEX \`idx_requests_user\` (\`user_id\`),
        INDEX \`idx_requests_status\` (\`status\`),
        INDEX \`idx_requests_dates\` (\`start_date\`, \`end_date\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    console.log('✅ Tables created successfully: users, leave_balances, leave_requests');

    // 5. Seed Demo Data
    console.log('🌱 Generating secure bcrypt hashes and seeding demo accounts...');

    // Clear existing records safely
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');
    await connection.query('TRUNCATE TABLE `leave_requests`');
    await connection.query('TRUNCATE TABLE `leave_balances`');
    await connection.query('TRUNCATE TABLE `users`');
    await connection.query('SET FOREIGN_KEY_CHECKS = 1');

    const adminHash = await bcrypt.hash('Admin@123', 10);
    const empHash = await bcrypt.hash('Employee@123', 10);

    const usersData = [
      [1, 'EMP001', 'Eleanor Vance (HR Admin)', 'admin@company.com', adminHash, 'admin', 'Human Resources', 'HR Director', '+1 (555) 019-2831', '2022-01-10'],
      [2, 'EMP002', 'Sarah Johnson', 'sarah.johnson@company.com', empHash, 'employee', 'Engineering', 'Senior Full-Stack Developer', '+1 (555) 014-9920', '2023-03-15'],
      [3, 'EMP003', 'Alex Miller', 'alex.miller@company.com', empHash, 'employee', 'Design', 'Lead UI/UX Designer', '+1 (555) 017-8833', '2023-06-01'],
      [4, 'EMP004', 'David Chen', 'david.chen@company.com', empHash, 'employee', 'Marketing', 'Product Marketing Manager', '+1 (555) 018-7744', '2023-08-20']
    ];

    await connection.query(
      `INSERT INTO users (id, employee_id, name, email, password, role, department, designation, phone, joining_date) VALUES ?`,
      [usersData]
    );

    const currentYear = new Date().getFullYear();
    const balancesData = [
      // Sarah Johnson (EMP002)
      [2, 'Casual Leave', 12, 2, currentYear],
      [2, 'Sick Leave', 10, 1, currentYear],
      [2, 'Earned Leave', 15, 0, currentYear],
      // Alex Miller (EMP003)
      [3, 'Casual Leave', 12, 4, currentYear],
      [3, 'Sick Leave', 10, 0, currentYear],
      [3, 'Earned Leave', 15, 3, currentYear],
      // David Chen (EMP004)
      [4, 'Casual Leave', 12, 1, currentYear],
      [4, 'Sick Leave', 10, 2, currentYear],
      [4, 'Earned Leave', 15, 0, currentYear]
    ];

    await connection.query(
      `INSERT INTO leave_balances (user_id, leave_type, total_leaves, used_leaves, year) VALUES ?`,
      [balancesData]
    );

    const requestsData = [
      [2, 'Casual Leave', '2026-09-10', '2026-09-11', 2, 'Attending family wedding ceremony out of town.', 'APPROVED', 'Approved. Enjoy the celebration!', 1, '2026-09-02 10:30:00'],
      [2, 'Sick Leave', '2026-09-22', '2026-09-22', 1, 'Severe viral flu and medical consultation.', 'APPROVED', 'Get well soon. Medical certificate acknowledged.', 1, '2026-09-22 08:45:00'],
      [2, 'Earned Leave', '2026-10-15', '2026-10-18', 4, 'Annual family holiday vacation.', 'PENDING', null, null, null],
      [3, 'Casual Leave', '2026-08-05', '2026-08-08', 4, 'Personal administrative work and bank obligations.', 'APPROVED', 'Approved.', 1, '2026-08-01 11:00:00'],
      [3, 'Earned Leave', '2026-09-15', '2026-09-17', 3, 'Short travel for design conference networking.', 'APPROVED', 'Approved. Share key insights with team afterwards.', 1, '2026-09-10 14:00:00'],
      [3, 'Casual Leave', '2026-10-08', '2026-10-09', 2, 'Personal emergency at hometown.', 'PENDING', null, null, null],
      [4, 'Sick Leave', '2026-09-05', '2026-09-06', 2, 'Dental surgery and post-op recovery.', 'APPROVED', 'Approved. Take care.', 1, '2026-09-04 15:30:00'],
      [4, 'Casual Leave', '2026-09-28', '2026-09-28', 1, 'Urgent apartment relocation assistance.', 'APPROVED', 'Approved.', 1, '2026-09-27 09:10:00'],
      [4, 'Earned Leave', '2026-10-25', '2026-10-30', 6, 'Diwali festival family vacation trip.', 'PENDING', null, null, null]
    ];

    await connection.query(
      `INSERT INTO leave_requests (user_id, leave_type, start_date, end_date, days_count, reason, status, admin_comment, reviewed_by, reviewed_at) VALUES ?`,
      [requestsData]
    );

    console.log('✅ Demo accounts and leave records seeded successfully.');
    console.log('\n=============================================');
    console.log('🎉 DATABASE SETUP COMPLETE!');
    console.log('=============================================');
    console.log('🔑 Demo Credentials:');
    console.log('  👑 Admin:');
    console.log('     Email:    admin@company.com');
    console.log('     Password: Admin@123');
    console.log('  👤 Employee (Sarah Johnson):');
    console.log('     Email:    sarah.johnson@company.com');
    console.log('     Password: Employee@123');
    console.log('  👤 Employee (Alex Miller):');
    console.log('     Email:    alex.miller@company.com');
    console.log('     Password: Employee@123');
    console.log('=============================================\n');

  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    process.exit(1);
  } finally {
    if (connection) await connection.end();
  }
}

setupDatabase();
