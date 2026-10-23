# 🏢 Employee Leave Management System (ELMS)

A full-stack, enterprise-grade **Employee Leave Management System** built with **React (Vite)**, **Node.js/Express.js**, **MySQL**, and **JWT Authentication**. Designed as a high-impact resume project showcasing role-based access control (RBAC), robust date range validation, overlapping request prevention, transactional balance deduction, and responsive UI design with a blue-and-white theme.

---

## 🌟 Key Features

### 👤 Employee Portal
* **Dashboard Overview:** Real-time KPI counters for Total, Pending, Approved, and Rejected requests.
* **Leave Quota Tracking:** Visual progress bars displaying remaining and consumed balances for **Casual Leave (CL)**, **Sick Leave (SL)**, and **Earned Leave (EL)**.
* **Apply for Leave:** Interactive modal with automatic duration calculation, balance checks, date validity tests, and reason input.
* **Overlap Prevention:** Blocks overlapping leave requests for dates that are already active (Pending or Approved).
* **Leave Request History:** Searchable and filterable history table (by status, leave type, and keyword search).
* **Self-Service Cancellation:** Ability to cancel pending leave requests prior to administrator review.

### 👑 HR / Admin Console
* **Executive Dashboard:** Organization-wide metrics, workforce count, pending review queue, and departmental statistics.
* **Review & Approvals:** Single-click approval/rejection modal with optional administrative remarks/comments.
* **Atomic Balance Reconciliation:** Database transactions (`BEGIN TRANSACTION` / `COMMIT`) automatically deduct leave quota upon approval and safely revert balances if rejected.
* **Employee Directory:** Complete staff directory displaying contact info, department, designation, and current leave quotas.
* **Staff Onboarding:** Register new employee accounts with automated annual leave quota allocation and bcrypt password hashing.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, Vite, React Router DOM v6, Axios, Lucide React Icons |
| **Styling** | Custom HR Design System with CSS Variables, Flexbox/Grid, Responsive Glassmorphism |
| **Backend** | Node.js, Express.js, `express-validator`, `helmet`, `cors`, `morgan` |
| **Database** | MySQL 8.0 with `mysql2/promise`, Foreign Key Constraints & Cascades |
| **Security** | JWT (JSON Web Tokens), `bcryptjs` password hashing (cost 10), Parameterized SQL Queries |

---

## 📂 Project Architecture

```
mwp mini/
├── database/
│   ├── schema.sql           # Database tables (users, leave_balances, leave_requests)
│   └── seed.sql             # Demo accounts, leave quotas, and realistic request records
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js        # MySQL connection pool configuration
│   │   ├── controllers/
│   │   │   ├── authController.js       # Login and session verification
│   │   │   ├── employeeController.js   # Employee dashboard, leave apply & history
│   │   │   └── adminController.js      # Admin approvals, stats & employee directory
│   │   ├── middleware/
│   │   │   ├── authMiddleware.js       # JWT validation & role authorization
│   │   │   └── validateMiddleware.js   # Express-validator input schemas
│   │   ├── routes/
│   │   │   ├── authRoutes.js           # /api/auth endpoints
│   │   │   ├── employeeRoutes.js       # /api/employee endpoints
│   │   │   └── adminRoutes.js          # /api/admin endpoints
│   │   ├── scripts/
│   │   │   └── setupDb.js              # Automated database setup & seed runner
│   │   └── utils/
│   │       └── dateUtils.js            # Date diff and range validation utilities
│   ├── .env.example
│   ├── .env
│   ├── package.json
│   └── server.js            # Express server entry point
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Sidebar.jsx             # Role-based collapsible navigation
│   │   │   ├── Navbar.jsx              # Header with user badge and date indicator
│   │   │   ├── StatCard.jsx            # Metric KPI card
│   │   │   ├── StatusBadge.jsx         # Status pills (Pending, Approved, etc.)
│   │   │   ├── LeaveBalanceCard.jsx    # Visual leave quota progress cards
│   │   │   ├── ApplyLeaveModal.jsx     # Leave application modal form
│   │   │   ├── ActionModal.jsx         # Admin approval / rejection modal
│   │   │   ├── AddEmployeeModal.jsx    # Staff onboarding modal
│   │   │   └── Toast.jsx               # Floating feedback alerts
│   │   ├── context/
│   │   │   └── AuthContext.jsx         # Global auth state & token persistence
│   │   ├── pages/
│   │   │   ├── Login.jsx               # Login page with 1-click demo autofill
│   │   │   ├── employee/
│   │   │   │   ├── EmployeeDashboard.jsx
│   │   │   │   └── MyLeaves.jsx
│   │   │   └── admin/
│   │   │       ├── AdminDashboard.jsx
│   │   │       ├── LeaveRequests.jsx
│   │   │       └── Employees.jsx
│   │   ├── services/
│   │   │   └── api.js                  # Axios interceptor instance
│   │   ├── App.jsx
│   │   ├── index.css                   # Modern blue-and-white theme design system
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
└── README.md
```

---

## 🚀 Quick Start Guide

### Step 1: Configure MySQL Database Credentials
Open `backend/.env` and update your MySQL password (and username/port if customized):

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=YOUR_MYSQL_ROOT_PASSWORD
DB_NAME=leave_management_db

PORT=5000
JWT_SECRET=super_secure_jwt_secret_key_leave_portal_2026_dev
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
```

### Step 2: Initialize Database & Seed Demo Data
Run the automated migration and seed script from the `backend` directory:

```bash
cd backend
npm run db:setup
```

*(Alternatively, you can import `database/schema.sql` followed by `database/seed.sql` inside MySQL Workbench / MySQL CLI).*

### Step 3: Start the Backend API Server
```bash
cd backend
npm start
# Server will run on http://localhost:5000
```

### Step 4: Start the Frontend Client
In a new terminal window:
```bash
cd frontend
npm run dev
# Vite dev server will start on http://localhost:5173
```

---

## 🔑 Demo Login Accounts

For easy testing and presentation, the login screen includes **1-Click Autofill buttons**:

| Role | Email | Password | Description |
| :--- | :--- | :--- | :--- |
| **👑 HR Admin** | `admin@company.com` | `Admin@123` | Full access to approvals, metrics, and staff directory |
| **👤 Employee 1** | `sarah.johnson@company.com` | `Employee@123` | Senior Developer (Engineering) |
| **👤 Employee 2** | `alex.miller@company.com` | `Employee@123` | Lead UI/UX Designer (Design) |
| **👤 Employee 3** | `david.chen@company.com` | `Employee@123` | Product Marketing Manager (Marketing) |

---

## 🔒 Security & Data Integrity

1. **SQL Injection Prevention:** Every query utilizes parameterized inputs with `mysql2/promise`.
2. **Password Hashing:** Passwords are encrypted using `bcryptjs` with cost 10 before saving to MySQL.
3. **JWT Authentication & RBAC:** Protected routes require a valid `Bearer <token>` and verify role claims (`admin` vs `employee`).
4. **Leave Integrity Constraints:**
   - Prevents booking in past/invalid date ranges.
   - Rejects overlapping active leave requests.
   - Prevents applying for more days than the remaining quota.
   - Uses SQL transactions to guarantee atomic balance deduction upon approval.
