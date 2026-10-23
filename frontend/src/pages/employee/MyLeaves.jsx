import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Trash2, 
  CalendarPlus, 
  Calendar, 
  Loader2, 
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import api from '../../services/api';
import StatusBadge from '../../components/StatusBadge';
import ApplyLeaveModal from '../../components/ApplyLeaveModal';
import Toast from '../../components/Toast';

export default function MyLeaves() {
  const [leaves, setLeaves] = useState([]);
  const [balances, setBalances] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [cancellingId, setCancellingId] = useState(null);
  const [toast, setToast] = useState({ show: false, message: '', type: 'info' });

  const fetchLeaves = async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter !== 'ALL') params.status = statusFilter;
      if (typeFilter !== 'ALL') params.leave_type = typeFilter;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const [leavesRes, balancesRes] = await Promise.all([
        api.get('/employee/leaves', { params }),
        api.get('/employee/balances')
      ]);

      if (leavesRes.data.success) {
        setLeaves(leavesRes.data.data);
      }
      if (balancesRes.data.success) {
        setBalances(balancesRes.data.data);
      }
    } catch (error) {
      console.error('Error fetching employee leaves:', error);
      setToast({
        show: true,
        message: 'Failed to load leave records. Please refresh.',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, [statusFilter, typeFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchLeaves();
  };

  const handleCancelLeave = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this pending leave request?')) {
      return;
    }

    try {
      setCancellingId(id);
      const response = await api.delete(`/employee/leaves/${id}`);
      if (response.data.success) {
        setToast({
          show: true,
          message: response.data.message || 'Leave request cancelled successfully.',
          type: 'success'
        });
        fetchLeaves();
      }
    } catch (error) {
      console.error('Error cancelling leave:', error);
      const msg = error.response?.data?.message || 'Failed to cancel leave request.';
      setToast({
        show: true,
        message: msg,
        type: 'error'
      });
    } finally {
      setCancellingId(null);
    }
  };

  const handleApplySuccess = (message) => {
    setToast({
      show: true,
      message: message || 'Leave request submitted successfully!',
      type: 'success'
    });
    fetchLeaves();
  };

  return (
    <div className="page-container">
      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
            My Leave Request History
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Search, filter, and track all your submitted leave applications.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button 
            className="btn btn-secondary"
            onClick={fetchLeaves}
            disabled={loading}
          >
            <RefreshCw size={16} className={loading ? 'spin-icon' : ''} />
            <span>Refresh</span>
          </button>
          <button 
            className="btn btn-primary"
            onClick={() => setIsApplyModalOpen(true)}
          >
            <CalendarPlus size={16} />
            <span>Apply for Leave</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem 1.25rem' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Search Box */}
          <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
            <input
              type="text"
              className="form-input"
              placeholder="Search by reason or remarks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '2.5rem' }}
            />
            <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)' }} />
          </div>

          {/* Status Filter */}
          <div style={{ minWidth: '160px' }}>
            <select
              className="form-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          {/* Type Filter */}
          <div style={{ minWidth: '170px' }}>
            <select
              className="form-select"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="ALL">All Leave Types</option>
              <option value="Casual Leave">Casual Leave</option>
              <option value="Sick Leave">Sick Leave</option>
              <option value="Earned Leave">Earned Leave</option>
            </select>
          </div>

          <button type="submit" className="btn btn-secondary">
            <span>Filter</span>
          </button>
        </form>
      </div>

      {/* Main Leave Table */}
      <div className="card">
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4rem 1rem' }}>
            <Loader2 size={32} color="#2563eb" className="spin-icon" />
          </div>
        ) : leaves.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3.5rem 1rem', color: 'var(--text-muted)' }}>
            <Calendar size={44} color="#cbd5e1" style={{ marginBottom: '0.75rem' }} />
            <p style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-main)' }}>No matching leave records found</p>
            <p style={{ fontSize: '0.8125rem', marginTop: '0.25rem' }}>Try adjusting your search criteria or apply for a new leave request.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Request ID</th>
                  <th>Leave Type</th>
                  <th>Date Range</th>
                  <th>Duration</th>
                  <th>Reason</th>
                  <th>Submitted On</th>
                  <th>Status</th>
                  <th>Admin Remarks</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {leaves.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                        #REQ-{String(item.id).padStart(4, '0')}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>
                        {item.leave_type}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.8125rem' }}>
                        <span style={{ fontWeight: 600 }}>{item.start_date}</span>
                        <span style={{ color: 'var(--text-muted)', margin: '0 4px' }}>to</span>
                        <span style={{ fontWeight: 600 }}>{item.end_date}</span>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontWeight: 700, color: '#2563eb' }}>
                        {item.days_count} {item.days_count === 1 ? 'day' : 'days'}
                      </span>
                    </td>
                    <td>
                      <p style={{ fontSize: '0.8125rem', maxWidth: '240px', lineHeight: 1.4 }} title={item.reason}>
                        {item.reason}
                      </p>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {new Date(item.created_at).toLocaleDateString()}
                      </span>
                    </td>
                    <td>
                      <StatusBadge status={item.status} />
                    </td>
                    <td>
                      {item.admin_comment ? (
                        <span style={{ fontSize: '0.8125rem', color: 'var(--text-main)' }}>
                          {item.admin_comment}
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.8125rem', color: 'var(--text-light)', fontStyle: 'italic' }}>
                          —
                        </span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {item.status === 'PENDING' ? (
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleCancelLeave(item.id)}
                          disabled={cancellingId === item.id}
                          title="Cancel this pending leave application"
                        >
                          <Trash2 size={13} />
                          <span>Cancel</span>
                        </button>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>
                          Locked
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

      {/* Apply Leave Modal */}
      <ApplyLeaveModal
        isOpen={isApplyModalOpen}
        onClose={() => setIsApplyModalOpen(false)}
        onSuccess={handleApplySuccess}
        balances={balances}
      />

      {/* Toast Notification */}
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
