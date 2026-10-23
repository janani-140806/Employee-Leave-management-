import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  CalendarPlus, 
  ArrowRight,
  Loader2,
  Calendar
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import StatCard from '../../components/StatCard';
import LeaveBalanceCard from '../../components/LeaveBalanceCard';
import StatusBadge from '../../components/StatusBadge';
import ApplyLeaveModal from '../../components/ApplyLeaveModal';
import Toast from '../../components/Toast';

export default function EmployeeDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    stats: { total: 0, pending: 0, approved: 0, rejected: 0 },
    balances: [],
    recentRequests: []
  });

  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'info' });

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/employee/dashboard');
      if (response.data.success) {
        setData(response.data.data);
      }
    } catch (error) {
      console.error('Failed to load employee dashboard:', error);
      setToast({
        show: true,
        message: 'Failed to load dashboard data. Please refresh.',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleApplySuccess = (message) => {
    setToast({
      show: true,
      message: message || 'Leave application submitted successfully!',
      type: 'success'
    });
    fetchDashboardData();
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <Loader2 size={36} color="#2563eb" className="spin-icon" />
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Welcome Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #1e40af 0%, #2563eb 100%)',
        borderRadius: '16px',
        padding: '2rem',
        color: '#ffffff',
        marginBottom: '2rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1.5rem',
        boxShadow: '0 10px 15px -3px rgba(37, 99, 235, 0.25)'
      }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'rgba(255, 255, 255, 0.15)', padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.75rem' }}>
            <span>Employee ID: {user?.employee_id}</span>
            <span>•</span>
            <span>{user?.department}</span>
          </div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '0.375rem' }}>
            Welcome back, {user?.name}! 👋
          </h2>
          <p style={{ fontSize: '0.9375rem', color: '#dbeafe', maxWidth: '600px' }}>
            Track your remaining vacation days, view active requests status, or submit a new leave application in just a few clicks.
          </p>
        </div>

        <button
          className="btn"
          style={{
            backgroundColor: '#ffffff',
            color: '#1e40af',
            fontWeight: 700,
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
          }}
          onClick={() => setIsApplyModalOpen(true)}
        >
          <CalendarPlus size={18} />
          <span>Apply for Leave</span>
        </button>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid-cols-4" style={{ marginBottom: '2rem' }}>
        <StatCard
          title="Total Requests"
          value={data.stats.total}
          icon={FileText}
          color="blue"
          subtitle="All-time submitted requests"
        />
        <StatCard
          title="Pending Approval"
          value={data.stats.pending}
          icon={Clock}
          color="amber"
          subtitle="Awaiting HR / Admin review"
        />
        <StatCard
          title="Approved Leaves"
          value={data.stats.approved}
          icon={CheckCircle2}
          color="emerald"
          subtitle="Successfully approved requests"
        />
        <StatCard
          title="Rejected Leaves"
          value={data.stats.rejected}
          icon={XCircle}
          color="rose"
          subtitle="Declined leave requests"
        />
      </div>

      {/* Leave Quota Overview */}
      <div style={{ marginBottom: '2rem' }}>
        <LeaveBalanceCard balances={data.balances} />
      </div>

      {/* Recent Leave Applications Table */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">
            <Clock size={18} color="#2563eb" />
            Recent Leave Applications
          </h3>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => navigate('/employee/leaves')}
          >
            <span>View Full History</span>
            <ArrowRight size={14} />
          </button>
        </div>

        {data.recentRequests.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
            <Calendar size={40} color="#cbd5e1" style={{ marginBottom: '0.75rem' }} />
            <p style={{ fontWeight: 600, fontSize: '0.9375rem' }}>No leave requests found yet</p>
            <p style={{ fontSize: '0.8125rem', marginTop: '0.25rem' }}>When you apply for time off, your requests will appear here.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Leave Type</th>
                  <th>Dates Requested</th>
                  <th>Duration</th>
                  <th>Reason</th>
                  <th>Status</th>
                  <th>Admin Remarks</th>
                </tr>
              </thead>
              <tbody>
                {data.recentRequests.map((req) => (
                  <tr key={req.id}>
                    <td>
                      <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>
                        {req.leave_type}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.8125rem' }}>
                        <span style={{ fontWeight: 600 }}>{req.start_date}</span> to <span style={{ fontWeight: 600 }}>{req.end_date}</span>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontWeight: 700, color: '#2563eb' }}>
                        {req.days_count} {req.days_count === 1 ? 'day' : 'days'}
                      </span>
                    </td>
                    <td>
                      <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', maxWidth: '280px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {req.reason}
                      </p>
                    </td>
                    <td>
                      <StatusBadge status={req.status} />
                    </td>
                    <td>
                      <span style={{ fontSize: '0.8125rem', color: req.admin_comment ? 'var(--text-main)' : 'var(--text-light)', fontStyle: req.admin_comment ? 'normal' : 'italic' }}>
                        {req.admin_comment || '—'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Apply Leave Modal */}
      <ApplyLeaveModal
        isOpen={isApplyModalOpen}
        onClose={() => setIsApplyModalOpen(false)}
        onSuccess={handleApplySuccess}
        balances={data.balances}
      />

      {/* Toast notifications */}
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
