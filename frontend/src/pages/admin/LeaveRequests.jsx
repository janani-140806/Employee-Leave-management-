import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Search, 
  Check, 
  X, 
  RefreshCw, 
  Loader2, 
  CheckSquare, 
  MessageSquare,
  Building,
  Calendar
} from 'lucide-react';
import api from '../../services/api';
import StatusBadge from '../../components/StatusBadge';
import ActionModal from '../../components/ActionModal';
import Toast from '../../components/Toast';

export default function LeaveRequests() {
  const [searchParams] = useSearchParams();
  const initialStatus = searchParams.get('status') || 'ALL';

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [departmentFilter, setDepartmentFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const [selectedRequest, setSelectedRequest] = useState(null);
  const [actionType, setActionType] = useState(null);
  const [toast, setToast] = useState({ show: false, message: '', type: 'info' });

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter !== 'ALL') params.status = statusFilter;
      if (departmentFilter !== 'ALL') params.department = departmentFilter;
      if (typeFilter !== 'ALL') params.leave_type = typeFilter;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const response = await api.get('/admin/leaves', { params });
      if (response.data.success) {
        setRequests(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching admin leave requests:', error);
      setToast({
        show: true,
        message: 'Failed to load leave requests. Please refresh.',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [statusFilter, departmentFilter, typeFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchRequests();
  };

  const handleActionClick = (req, type) => {
    setSelectedRequest(req);
    setActionType(type);
  };

  const handleActionSuccess = (message) => {
    setToast({
      show: true,
      message,
      type: 'success'
    });
    fetchRequests();
  };

  return (
    <div className="page-container">
      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
            Leave Applications & Approvals
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Review, approve, or reject company-wide employee leave requests.
          </p>
        </div>

        <button 
          className="btn btn-secondary"
          onClick={fetchRequests}
          disabled={loading}
        >
          <RefreshCw size={16} className={loading ? 'spin-icon' : ''} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem 1.25rem' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Search Box */}
          <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
            <input
              type="text"
              className="form-input"
              placeholder="Search employee name, ID, or reason..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '2.5rem' }}
            />
            <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)' }} />
          </div>

          {/* Department Filter */}
          <div style={{ minWidth: '170px' }}>
            <select
              className="form-select"
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
            >
              <option value="ALL">All Departments</option>
              <option value="Engineering">Engineering</option>
              <option value="Design">Design</option>
              <option value="Marketing">Marketing</option>
              <option value="Human Resources">Human Resources</option>
              <option value="Finance">Finance</option>
              <option value="Operations">Operations</option>
            </select>
          </div>

          {/* Status Filter */}
          <div style={{ minWidth: '150px' }}>
            <select
              className="form-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING">Pending Only</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          {/* Type Filter */}
          <div style={{ minWidth: '160px' }}>
            <select
              className="form-select"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="ALL">All Types</option>
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

      {/* Requests Table */}
      <div className="card">
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4rem 1rem' }}>
            <Loader2 size={32} color="#2563eb" className="spin-icon" />
          </div>
        ) : requests.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3.5rem 1rem', color: 'var(--text-muted)' }}>
            <CheckSquare size={44} color="#cbd5e1" style={{ marginBottom: '0.75rem' }} />
            <p style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-main)' }}>No matching leave applications found</p>
            <p style={{ fontSize: '0.8125rem', marginTop: '0.25rem' }}>Try clearing filters or changing search terms.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Employee Info</th>
                  <th>Department</th>
                  <th>Leave Type</th>
                  <th>Duration & Dates</th>
                  <th>Reason</th>
                  <th>Submitted</th>
                  <th>Status</th>
                  <th>Reviewer Remarks</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div>
                        <span style={{ fontWeight: 700, color: 'var(--text-main)', display: 'block' }}>
                          {item.employee_name}
                        </span>
                        <div style={{ display: 'flex', gap: '0.375rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          <span style={{ fontFamily: 'var(--font-mono)' }}>{item.employee_id}</span>
                          <span>•</span>
                          <span>{item.designation}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontWeight: 500 }}>{item.department}</span>
                    </td>
                    <td>
                      <span style={{ fontWeight: 700, color: '#2563eb' }}>
                        {item.leave_type}
                      </span>
                    </td>
                    <td>
                      <div>
                        <span style={{ fontWeight: 700, display: 'block' }}>
                          {item.days_count} {item.days_count === 1 ? 'day' : 'days'}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {item.start_date} to {item.end_date}
                        </span>
                      </div>
                    </td>
                    <td>
                      <p style={{ fontSize: '0.8125rem', maxWidth: '200px', lineHeight: 1.4 }} title={item.reason}>
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
                        <div style={{ fontSize: '0.8125rem', color: 'var(--text-main)' }}>
                          <p>{item.admin_comment}</p>
                          {item.reviewer_name && (
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                              by {item.reviewer_name}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span style={{ fontSize: '0.8125rem', color: 'var(--text-light)', fontStyle: 'italic' }}>
                          —
                        </span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {item.status === 'PENDING' ? (
                        <div style={{ display: 'inline-flex', gap: '0.375rem' }}>
                          <button
                            className="btn btn-success btn-sm"
                            onClick={() => handleActionClick(item, 'APPROVE')}
                            title="Approve leave request"
                          >
                            <Check size={14} />
                            <span>Approve</span>
                          </button>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => handleActionClick(item, 'REJECT')}
                            title="Reject leave request"
                          >
                            <X size={14} />
                            <span>Reject</span>
                          </button>
                        </div>
                      ) : (
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleActionClick(item, item.status === 'APPROVED' ? 'REJECT' : 'APPROVE')}
                          title="Change status"
                        >
                          <span>Modify</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Action Review Modal */}
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
