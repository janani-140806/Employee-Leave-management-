import React, { useState, useEffect } from 'react';
import { X, Calendar, AlertCircle, Info, Loader2 } from 'lucide-react';
import api from '../services/api';

export default function ApplyLeaveModal({ isOpen, onClose, onSuccess, balances = [] }) {
  const [leaveType, setLeaveType] = useState('Casual Leave');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [daysCount, setDaysCount] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      const today = new Date().toISOString().split('T')[0];
      setStartDate(today);
      setEndDate(today);
      setReason('');
      setError('');
      setLeaveType('Casual Leave');
    }
  }, [isOpen]);

  // Calculate days whenever start or end dates change
  useEffect(() => {
    if (!startDate || !endDate) {
      setDaysCount(0);
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start > end) {
      setDaysCount(0);
      return;
    }

    const utcStart = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate());
    const utcEnd = Date.UTC(end.getFullYear(), end.getMonth(), end.getDate());
    const msPerDay = 1000 * 60 * 60 * 24;
    const diff = Math.floor((utcEnd - utcStart) / msPerDay) + 1;
    setDaysCount(diff > 0 ? diff : 0);
  }, [startDate, endDate]);

  if (!isOpen) return null;

  // Find remaining quota for selected leave type
  const selectedQuota = balances.find(b => b.leave_type === leaveType);
  const remainingDays = selectedQuota ? (selectedQuota.remaining_leaves !== undefined ? selectedQuota.remaining_leaves : (selectedQuota.total_leaves - selectedQuota.used_leaves)) : 0;
  const isBalanceExceeded = daysCount > remainingDays;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!startDate || !endDate) {
      setError('Please select both start and end dates.');
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      setError('End date cannot be earlier than start date.');
      return;
    }

    if (daysCount <= 0) {
      setError('Leave duration must be at least 1 day.');
      return;
    }

    if (isBalanceExceeded) {
      setError(`Insufficient leave quota. You have ${remainingDays} day(s) remaining for ${leaveType}, but requested ${daysCount} day(s).`);
      return;
    }

    if (!reason.trim() || reason.trim().length < 5) {
      setError('Please provide a descriptive reason for your leave (minimum 5 characters).');
      return;
    }

    setSubmitting(true);

    try {
      const response = await api.post('/employee/leaves', {
        leave_type: leaveType,
        start_date: startDate,
        end_date: endDate,
        reason: reason.trim()
      });

      if (response.data.success) {
        onSuccess(response.data.message || 'Leave application submitted successfully!');
        onClose();
      }
    } catch (err) {
      console.error('Leave application submission error:', err);
      const message = err.response?.data?.message || 'Failed to submit leave application. Please check your inputs.';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Calendar size={20} color="#2563eb" />
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-main)' }}>
              Apply for Leave
            </h3>
          </div>
          <button 
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1rem',
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '8px',
                color: '#b91c1c',
                fontSize: '0.8125rem',
                marginBottom: '1.25rem'
              }}>
                <AlertCircle size={18} />
                <span>{error}</span>
              </div>
            )}

            {/* Leave Type */}
            <div className="form-group">
              <label className="form-label">
                Leave Type <span className="required">*</span>
              </label>
              <select
                className="form-select"
                value={leaveType}
                onChange={(e) => setLeaveType(e.target.value)}
              >
                <option value="Casual Leave">Casual Leave</option>
                <option value="Sick Leave">Sick Leave</option>
                <option value="Earned Leave">Earned Leave</option>
              </select>
              <div className="form-hint" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>Available balance for {leaveType}:</span>
                <span style={{ fontWeight: 700, color: remainingDays > 0 ? '#059669' : '#dc2626' }}>
                  {remainingDays} day(s) remaining
                </span>
              </div>
            </div>

            {/* Date Selection */}
            <div className="grid-cols-2">
              <div className="form-group">
                <label className="form-label">
                  Start Date <span className="required">*</span>
                </label>
                <input
                  type="date"
                  className="form-input"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  End Date <span className="required">*</span>
                </label>
                <input
                  type="date"
                  className="form-input"
                  value={endDate}
                  min={startDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Calculation summary info box */}
            {daysCount > 0 && (
              <div style={{
                backgroundColor: isBalanceExceeded ? '#fff1f2' : '#eff6ff',
                border: `1px solid ${isBalanceExceeded ? '#fecdd3' : '#bfdbfe'}`,
                borderRadius: '8px',
                padding: '0.75rem 1rem',
                marginBottom: '1.25rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '0.8125rem'
              }}>
                <span style={{ color: isBalanceExceeded ? '#e11d48' : '#1e40af', fontWeight: 600 }}>
                  Total Requested Duration:
                </span>
                <span style={{
                  fontWeight: 800,
                  fontSize: '0.9375rem',
                  color: isBalanceExceeded ? '#be123c' : '#1d4ed8'
                }}>
                  {daysCount} {daysCount === 1 ? 'Day' : 'Days'}
                </span>
              </div>
            )}

            {/* Reason */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">
                Reason for Leave <span className="required">*</span>
              </label>
              <textarea
                className="form-textarea"
                rows="3"
                placeholder="Please state the purpose of your leave request..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                maxLength={500}
                required
              />
              <div className="form-hint" style={{ textAlign: 'right' }}>
                {reason.length}/500 characters
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting || isBalanceExceeded || daysCount <= 0}
            >
              {submitting ? (
                <>
                  <Loader2 size={16} className="spin-icon" />
                  Submitting...
                </>
              ) : (
                'Submit Application'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
