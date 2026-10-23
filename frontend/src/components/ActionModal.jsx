import React, { useState } from 'react';
import { X, CheckCircle2, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import api from '../services/api';

export default function ActionModal({ isOpen, onClose, onSuccess, request, actionType }) {
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !request) return null;

  const isApproval = actionType === 'APPROVE';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    const targetStatus = isApproval ? 'APPROVED' : 'REJECTED';

    try {
      const response = await api.patch(`/admin/leaves/${request.id}/status`, {
        status: targetStatus,
        admin_comment: comment.trim()
      });

      if (response.data.success) {
        onSuccess(response.data.message || `Leave request ${targetStatus.toLowerCase()} successfully.`);
        onClose();
      }
    } catch (err) {
      console.error('Action modal status update error:', err);
      const message = err.response?.data?.message || 'Failed to update leave request status.';
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
            {isApproval ? (
              <CheckCircle2 size={22} color="#059669" />
            ) : (
              <XCircle size={22} color="#dc2626" />
            )}
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-main)' }}>
              {isApproval ? 'Approve Leave Request' : 'Reject Leave Request'}
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

            {/* Request Summary Box */}
            <div style={{
              backgroundColor: '#f8fafc',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              padding: '1rem',
              marginBottom: '1.25rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Employee:</span>
                <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-main)' }}>
                  {request.employee_name} ({request.employee_id})
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Department:</span>
                <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-main)' }}>
                  {request.department}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Leave Type & Duration:</span>
                <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#2563eb' }}>
                  {request.leave_type} ({request.days_count} {request.days_count === 1 ? 'day' : 'days'})
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Dates:</span>
                <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-main)' }}>
                  {request.start_date} to {request.end_date}
                </span>
              </div>
              <div style={{ borderTop: '1px dashed var(--border-color)', paddingTop: '0.5rem', marginTop: '0.5rem' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Reason:</span>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-main)', fontStyle: 'italic' }}>
                  "{request.reason}"
                </p>
              </div>
            </div>

            {/* Admin Comment Input */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">
                HR / Admin Remarks <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>(Optional)</span>
              </label>
              <textarea
                className="form-textarea"
                rows="3"
                placeholder={isApproval ? "e.g., Approved. Please coordinate handover before departing." : "e.g., Rejected due to critical release sprint overlap."}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                maxLength={500}
              />
              <div className="form-hint" style={{ textAlign: 'right' }}>
                {comment.length}/500 characters
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
              className={isApproval ? 'btn btn-success' : 'btn btn-danger'}
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader2 size={16} className="spin-icon" />
                  Processing...
                </>
              ) : isApproval ? (
                'Confirm Approval'
              ) : (
                'Confirm Rejection'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
