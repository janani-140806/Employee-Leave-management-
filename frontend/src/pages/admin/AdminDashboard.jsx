import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  FileText, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  ArrowRight, 
  Building2, 
  Check, 
  X, 
  Loader2,
  Calendar,
  Layers
} from 'lucide-react';
import api from '../../services/api';
import StatCard from '../../components/StatCard';
import StatusBadge from '../../components/StatusBadge';
import ActionModal from '../../components/ActionModal';
import Toast from '../../components/Toast';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    stats: {
      totalEmployees: 0,
      totalRequests: 0,
      pendingRequests: 0,
      approvedRequests: 0,
      rejectedRequests: 0
    },
    leaveTypeStats: [],
    departmentStats: [],
    recentRequests: []
  });

  const [selectedRequest, setSelectedRequest] = useState(null);
  const [actionType, setActionType] = useState(null); // 'APPROVE' | 'REJECT'
  const [toast, setToast] = useState({ show: false, message: '', type: 'info' });

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/dashboard');
      if (response.data.success) {
        setData(response.data.data);
      }
    } catch (error) {
      console.error('Failed to load admin dashboard:', error);
      setToast({
        show: true,
        message: 'Failed to load admin metrics. Please refresh.',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleActionClick = (request, type) => {
    setSelectedRequest(request);
    setActionType(type);
  };

  const handleActionSuccess = (message) => {
    setToast({
      show: true,
      message,
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
      {/* Page Header */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
              HR Executive Dashboard
            </h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              Real-time employee leave management, approvals, and departmental statistics.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              className="btn btn-secondary"
              onClick={() => navigate('/admin/employees')}
            >
              <Users size={16} />
              <span>Manage Employees</span>
            </button>
            <button
              className="btn btn-primary"
              onClick={() => navigate('/admin/leaves')}
            >
              <FileText size={16} />
              <span>All Leave Applications</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid-cols-4" style={{ marginBottom: '2rem' }}>
        <StatCard
          title="Total Workforce"
          value={data.stats.totalEmployees}
          icon={Users}
          color="blue"
          subtitle="Active registered employees"
          onClick={() => navigate('/admin/employees')}
        />
        <StatCard
          title="Pending Approval"
          value={data.stats.pendingRequests}
          icon={Clock}
          color="amber"
          subtitle="Requests requiring action"
          onClick={() => navigate('/admin/leaves?status=PENDING')}
        />
        <StatCard
          title="Approved Leaves"
          value={data.stats.approvedRequests}
          icon={CheckCircle2}
          color="emerald"
          subtitle="Total approved time-off"
        />
        <StatCard
          title="Total Submissions"
          value={data.stats.totalRequests}
          icon={Layers}
          color="purple"
          subtitle="All leave applications"
        />
      </div>

      {/* Secondary Metrics: Department & Leave Type Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        {/* Department Distribution */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              <Building2 size={18} color="#2563eb" />
              Department Leave Activity
            </h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {data.departmentStats.length === 0 ? (
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', textAlign: 'center', padding: '1rem' }}>No department data available</p>
            ) : (
              data.departmentStats.map((dept) => (
                <div key={dept.department} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <div>
                    <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-main)' }}>{dept.department}</span>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{dept.total_requests} total request(s)</p>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {dept.pending_requests > 0 && (
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '2px 8px', borderRadius: '6px', backgroundColor: '#fef3c7', color: '#b45309' }}>
                        {dept.pending_requests} pending
                      </span>
                    )}
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '2px 8px', borderRadius: '6px', backgroundColor: '#ecfdf5', color: '#059669' }}>
                      {dept.approved_requests} approved
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Leave Type Consumption */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              <Calendar size={18} color="#2563eb" />
              Approved Leaves by Type
            </h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {data.leaveTypeStats.length === 0 ? (
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', textAlign: 'center', padding: '1rem' }}>No approved leave requests yet</p>
            ) : (
              data.leaveTypeStats.map((type) => (
                <div key={type.leave_type} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-main)' }}>{type.leave_type}</span>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '0.9375rem', fontWeight: 800, color: '#2563eb' }}>{type.total_days || 0} Days</span>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{type.request_count} approved request(s)</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Recent Applications & Approvals Queue */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">
            <Clock size={18} color="#2563eb" />
            Recent Applications & Review Queue
          </h3>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => navigate('/admin/leaves')}
          >
            <span>View All Applications</span>
            <ArrowRight size={14} />
          </button>
        </div>

        {data.recentRequests.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
            <FileText size={40} color="#cbd5e1" style={{ marginBottom: '0.75rem' }} />
            <p style={{ fontWeight: 600 }}>No recent leave requests found</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Department</th>
                  <th>Leave Type</th>
                  <th>Dates</th>
                  <th>Duration</th>
                  <th>Reason</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {data.recentRequests.map((req) => (
                  <tr key={req.id}>
                    <td>
                      <div>
                        <span style={{ fontWeight: 700, color: 'var(--text-main)', display: 'block' }}>
                          {req.employee_name}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                          {req.employee_id}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-main)' }}>
                        {req.department}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontWeight: 600, color: '#2563eb' }}>
                        {req.leave_type}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.8125rem' }}>
                        <span>{req.start_date}</span> to <span>{req.end_date}</span>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontWeight: 700 }}>
                        {req.days_count} {req.days_count === 1 ? 'day' : 'days'}
                      </span>
                    </td>
                    <td>
                      <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {req.reason}
                      </p>
                    </td>
                    <td>
                      <StatusBadge status={req.status} />
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {req.status === 'PENDING' ? (
                        <div style={{ display: 'inline-flex', gap: '0.375rem' }}>
                          <button
                            className="btn btn-success btn-sm"
                            onClick={() => handleActionClick(req, 'APPROVE')}
                            title="Approve leave request"
                          >
                            <Check size={14} />
                            <span>Approve</span>
                          </button>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => handleActionClick(req, 'REJECT')}
                            title="Reject leave request"
                          >
                            <X size={14} />
                            <span>Reject</span>
                          </button>
                        </div>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          Reviewed
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Action Review Modal (Approve / Reject) */}
      <ActionModal
        isOpen={!!selectedRequest}
        onClose={() => { setSelectedRequest(null); setActionType(null); }}
        onSuccess={handleActionSuccess}
        request={selectedRequest}
        actionType={actionType}
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
