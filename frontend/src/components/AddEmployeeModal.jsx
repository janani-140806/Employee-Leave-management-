import React, { useState } from 'react';
import { X, UserPlus, AlertCircle, Loader2 } from 'lucide-react';
import api from '../services/api';

export default function AddEmployeeModal({ isOpen, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'employee',
    department: 'Engineering',
    designation: '',
    phone: '',
    joining_date: new Date().toISOString().split('T')[0],
    casual_leave: 12,
    sick_leave: 10,
    earned_leave: 15
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setSubmitting(true);

    try {
      const response = await api.post('/admin/employees', formData);
      if (response.data.success) {
        onSuccess(response.data.message || 'Employee registered successfully!');
        onClose();
      }
    } catch (err) {
      console.error('Add employee error:', err);
      const message = err.response?.data?.message || 'Failed to add employee. Please check your inputs.';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '650px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <UserPlus size={20} color="#2563eb" />
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-main)' }}>
              Add New Employee Account
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

            {/* Basic Info */}
            <div className="grid-cols-2">
              <div className="form-group">
                <label className="form-label">Full Name <span className="required">*</span></label>
                <input
                  type="text"
                  name="name"
                  className="form-input"
                  placeholder="e.g. Johnathan Doe"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Corporate Email <span className="required">*</span></label>
                <input
                  type="email"
                  name="email"
                  className="form-input"
                  placeholder="e.g. johnathan.doe@company.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="grid-cols-2">
              <div className="form-group">
                <label className="form-label">Initial Password <span className="required">*</span></label>
                <input
                  type="password"
                  name="password"
                  className="form-input"
                  placeholder="Minimum 6 characters"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">System Role <span className="required">*</span></label>
                <select
                  name="role"
                  className="form-select"
                  value={formData.role}
                  onChange={handleChange}
                >
                  <option value="employee">Employee</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>
            </div>

            {/* Department & Designation */}
            <div className="grid-cols-2">
              <div className="form-group">
                <label className="form-label">Department <span className="required">*</span></label>
                <select
                  name="department"
                  className="form-select"
                  value={formData.department}
                  onChange={handleChange}
                >
                  <option value="Engineering">Engineering</option>
                  <option value="Design">Design</option>
                  <option value="Product">Product</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Human Resources">Human Resources</option>
                  <option value="Finance">Finance</option>
                  <option value="Operations">Operations</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Designation / Title <span className="required">*</span></label>
                <input
                  type="text"
                  name="designation"
                  className="form-input"
                  placeholder="e.g. Software Engineer II"
                  value={formData.designation}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {/* Phone & Joining Date */}
            <div className="grid-cols-2">
              <div className="form-group">
                <label className="form-label">Contact Phone</label>
                <input
                  type="text"
                  name="phone"
                  className="form-input"
                  placeholder="e.g. +1 (555) 019-2831"
                  value={formData.phone}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Joining Date <span className="required">*</span></label>
                <input
                  type="date"
                  name="joining_date"
                  className="form-input"
                  value={formData.joining_date}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {/* Initial Leave Quotas Allocation */}
            {formData.role === 'employee' && (
              <div style={{
                marginTop: '0.5rem',
                padding: '1rem',
                backgroundColor: '#f8fafc',
                border: '1px solid var(--border-color)',
                borderRadius: '8px'
              }}>
                <p style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.75rem' }}>
                  Annual Leave Quotas Allocation ({new Date(formData.joining_date).getFullYear()})
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
                  <div>
                    <label className="form-label" style={{ fontSize: '0.75rem' }}>Casual Leave (Days)</label>
                    <input
                      type="number"
                      name="casual_leave"
                      className="form-input"
                      value={formData.casual_leave}
                      onChange={handleChange}
                      min="0"
                      max="50"
                    />
                  </div>
                  <div>
                    <label className="form-label" style={{ fontSize: '0.75rem' }}>Sick Leave (Days)</label>
                    <input
                      type="number"
                      name="sick_leave"
                      className="form-input"
                      value={formData.sick_leave}
                      onChange={handleChange}
                      min="0"
                      max="50"
                    />
                  </div>
                  <div>
                    <label className="form-label" style={{ fontSize: '0.75rem' }}>Earned Leave (Days)</label>
                    <input
                      type="number"
                      name="earned_leave"
                      className="form-input"
                      value={formData.earned_leave}
                      onChange={handleChange}
                      min="0"
                      max="50"
                    />
                  </div>
                </div>
              </div>
            )}
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
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader2 size={16} className="spin-icon" />
                  Creating Account...
                </>
              ) : (
                'Create Employee Account'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
