import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import EmployeeDashboard from './pages/employee/EmployeeDashboard';
import MyLeaves from './pages/employee/MyLeaves';
import AdminDashboard from './pages/admin/AdminDashboard';
import LeaveRequests from './pages/admin/LeaveRequests';
import Employees from './pages/admin/Employees';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import ApplyLeaveModal from './components/ApplyLeaveModal';
import Toast from './components/Toast';
import { Loader2 } from 'lucide-react';

/**
 * Route guard for authenticated users with role restrictions
 */
function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', backgroundColor: '#f8fafc' }}>
        <Loader2 size={40} color="#2563eb" className="spin-icon" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to proper dashboard based on existing role
    return <Navigate to={user.role === 'admin' ? '/admin/dashboard' : '/employee/dashboard'} replace />;
  }

  return children;
}

/**
 * Main Layout Shell wrapping authenticated pages
 */
function MainLayout({ children, title, subtitle }) {
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'info' });

  return (
    <div className="app-layout">
      <Sidebar onOpenApplyModal={() => setIsApplyModalOpen(true)} />
      <div className="main-content-wrapper">
        <Navbar 
          title={title} 
          subtitle={subtitle} 
          onOpenApplyModal={() => setIsApplyModalOpen(true)} 
        />
        <main>{children}</main>
      </div>

      <ApplyLeaveModal
        isOpen={isApplyModalOpen}
        onClose={() => setIsApplyModalOpen(false)}
        onSuccess={(msg) => {
          setToast({ show: true, message: msg, type: 'success' });
          // Optional window reload or trigger refetch
          window.location.reload();
        }}
      />

      {toast.show && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast({ show: false, message: '', type: 'info' })}
        />
      )}
    </div>
  );
}

/**
 * Root Router Component
 */
export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Login Route */}
          <Route path="/login" element={<Login />} />

          {/* Root Redirect */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Navigate to="/employee/dashboard" replace />
              </ProtectedRoute>
            }
          />

          {/* Employee Protected Routes */}
          <Route
            path="/employee/dashboard"
            element={
              <ProtectedRoute allowedRoles={['employee']}>
                <MainLayout title="Employee Portal" subtitle="Leave Overview & Status">
                  <EmployeeDashboard />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/employee/leaves"
            element={
              <ProtectedRoute allowedRoles={['employee']}>
                <MainLayout title="Leave Applications" subtitle="History & Status Tracking">
                  <MyLeaves />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          {/* Admin Protected Routes */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <MainLayout title="HR Executive Console" subtitle="Organization Overview & Metrics">
                  <AdminDashboard />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/leaves"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <MainLayout title="Leave Management" subtitle="Review & Approve Applications">
                  <LeaveRequests />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/employees"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <MainLayout title="Workforce Management" subtitle="Staff Directory & Leave Quotas">
                  <Employees />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          {/* Catch-all Fallback */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
