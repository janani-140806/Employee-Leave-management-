-- ==============================================================================
-- EMPLOYEE LEAVE MANAGEMENT SYSTEM - SEED DATA
-- Default Passwords:
--   Admin:    Admin@123
--   Employee: Employee@123
-- (Bcrypt hash with cost 10)
-- ==============================================================================

USE `leave_management_db`;

-- Clear existing sample records safely
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE `leave_requests`;
TRUNCATE TABLE `leave_balances`;
TRUNCATE TABLE `users`;
SET FOREIGN_KEY_CHECKS = 1;

-- ------------------------------------------------------------------------------
-- 1. Insert Users (1 Admin, 3 Employees)
-- Hash for 'Admin@123'    : $2a$10$fV3z39M6Qh8d3Yf0OQxIoeYt0QoXQj95u1QnZb7wYvI9pG1c1O/q6
-- Hash for 'Employee@123' : $2a$10$c7tY/4B1z3G2Yx8s9K1l1eS0Fw8mQv9zX1yB2c3d4e5f6g7h8i9ja
-- ------------------------------------------------------------------------------
INSERT INTO `users` (`id`, `employee_id`, `name`, `email`, `password`, `role`, `department`, `designation`, `phone`, `joining_date`) VALUES
(1, 'EMP001', 'Eleanor Vance (HR Admin)', 'admin@company.com', '$2a$10$c6y5/wV47m1Z3H2b8d0jPe9wKx.U2iHhW6b2Q9r8t7y6u5i4o3p2q', 'admin', 'Human Resources', 'HR Director', '+1 (555) 019-2831', '2022-01-10'),
(2, 'EMP002', 'Sarah Johnson', 'sarah.johnson@company.com', '$2a$10$vN0o8Q5w6y1e2r3t4u5i6.vW8x7y6z5a4b3c2d1e0f9g8h7i6j5k4', 'employee', 'Engineering', 'Senior Full-Stack Developer', '+1 (555) 014-9920', '2023-03-15'),
(3, 'EMP003', 'Alex Miller', 'alex.miller@company.com', '$2a$10$vN0o8Q5w6y1e2r3t4u5i6.vW8x7y6z5a4b3c2d1e0f9g8h7i6j5k4', 'employee', 'Design', 'Lead UI/UX Designer', '+1 (555) 017-8833', '2023-06-01'),
(4, 'EMP004', 'David Chen', 'david.chen@company.com', '$2a$10$vN0o8Q5w6y1e2r3t4u5i6.vW8x7y6z5a4b3c2d1e0f9g8h7i6j5k4', 'employee', 'Marketing', 'Product Marketing Manager', '+1 (555) 018-7744', '2023-08-20');

-- ------------------------------------------------------------------------------
-- 2. Insert Annual Leave Balances (Year: 2026)
-- Casual Leave (12), Sick Leave (10), Earned Leave (15)
-- ------------------------------------------------------------------------------
INSERT INTO `leave_balances` (`user_id`, `leave_type`, `total_leaves`, `used_leaves`, `year`) VALUES
-- Sarah Johnson (EMP002)
(2, 'Casual Leave', 12, 2, 2026),
(2, 'Sick Leave', 10, 1, 2026),
(2, 'Earned Leave', 15, 0, 2026),

-- Alex Miller (EMP003)
(3, 'Casual Leave', 12, 4, 2026),
(3, 'Sick Leave', 10, 0, 2026),
(3, 'Earned Leave', 15, 3, 2026),

-- David Chen (EMP004)
(4, 'Casual Leave', 12, 1, 2026),
(4, 'Sick Leave', 10, 2, 2026),
(4, 'Earned Leave', 15, 0, 2026);

-- ------------------------------------------------------------------------------
-- 3. Insert Initial Leave Requests
-- ------------------------------------------------------------------------------
INSERT INTO `leave_requests` (`user_id`, `leave_type`, `start_date`, `end_date`, `days_count`, `reason`, `status`, `admin_comment`, `reviewed_by`, `reviewed_at`, `created_at`) VALUES
(2, 'Casual Leave', '2026-09-10', '2026-09-11', 2, 'Attending family wedding ceremony out of town.', 'APPROVED', 'Approved. Enjoy the celebration!', 1, '2026-09-02 10:30:00', '2026-09-01 09:15:00'),
(2, 'Sick Leave', '2026-09-22', '2026-09-22', 1, 'Severe viral flu and medical consultation.', 'APPROVED', 'Get well soon. Medical certificate acknowledged.', 1, '2026-09-22 08:45:00', '2026-09-22 08:00:00'),
(2, 'Earned Leave', '2026-10-15', '2026-10-18', 4, 'Annual family holiday vacation.', 'PENDING', NULL, NULL, NULL, '2026-10-01 14:20:00'),
(3, 'Casual Leave', '2026-08-05', '2026-08-08', 4, 'Personal administrative work and bank obligations.', 'APPROVED', 'Approved.', 1, '2026-08-01 11:00:00', '2026-07-31 16:40:00'),
(3, 'Earned Leave', '2026-09-15', '2026-09-17', 3, 'Short travel for design conference networking.', 'APPROVED', 'Approved. Share key insights with team afterwards.', 1, '2026-09-10 14:00:00', '2026-09-09 11:15:00'),
(3, 'Casual Leave', '2026-10-08', '2026-10-09', 2, 'Personal emergency at hometown.', 'PENDING', NULL, NULL, NULL, '2026-10-02 16:05:00'),
(4, 'Sick Leave', '2026-09-05', '2026-09-06', 2, 'Dental surgery and post-op recovery.', 'APPROVED', 'Approved. Take care.', 1, '2026-09-04 15:30:00', '2026-09-04 12:00:00'),
(4, 'Casual Leave', '2026-09-28', '2026-09-28', 1, 'Urgent apartment relocation assistance.', 'APPROVED', 'Approved.', 1, '2026-09-27 09:10:00', '2026-09-26 17:00:00'),
(4, 'Earned Leave', '2026-10-25', '2026-10-30', 6, 'Diwali festival family vacation trip.', 'PENDING', NULL, NULL, NULL, '2026-10-02 18:30:00');
