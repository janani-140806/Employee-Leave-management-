import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  Search, 
  Mail, 
  Phone, 
  Calendar, 
  Building2, 
  RefreshCw, 
  Loader2,
  ShieldCheck,
  UserCheck
} from 'lucide-react';
import api from '../../services/api';
import AddEmployeeModal from '../../components/AddEmployeeModal';
import Toast from '../../components/Toast';

export default function Employees() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('ALL');

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'info' });

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/employees');
      if (response.data.success) {
        setEmployees(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching employees list:', error);
      setToast({
        show: true,
        message: 'Failed to load employee list. Please refresh.',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleAddSuccess = (message) => {
    setToast({
      show: true,
      message: message || 'Employee registered successfully!',
      type: 'success'
    });
    fetchEmployees();
  };

  // Filtered employees
  const filteredEmployees = employees.filter((emp) => {
    const matchesDept = departmentFilter === 'ALL' || emp.department === departmentFilter;
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch = !query || 
      emp.name.toLowerCase().includes(query) ||
      emp.email.toLowerCase().includes(query) ||
      emp.employee_id.toLowerCase().includes(query) ||
      emp.designation.toLowerCase().includes(query);

    return matchesDept && matchesSearch;
  });

  return (
    <div className="page-container">
      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
            Employees Directory & Quotas
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Manage staff accounts, departments, designations, and track remaining leave quotas.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button 
            className="btn btn-secondary"
            onClick={fetchEmployees}
            disabled={loading}
          >
            <RefreshCw size={16} className={loading ? 'spin-icon' : ''} />
            <span>Refresh</span>
          </button>
          <button 
            className="btn btn-primary"
            onClick={() => setIsAddModalOpen(true)}
          >
            <UserPlus size={16} />
            <span>Add New Employee</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem 1.25rem' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Search Box */}
          <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
            <input
              type="text"
              className="form-input"
              placeholder="Search by name, email, employee ID, designation..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '2.5rem' }}
            />
            <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)' }} />
          </div>

          {/* Department Filter */}
          <div style={{ minWidth: '200px' }}>
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
        </div>
      </div>

      {/* Employees Directory Table */}
      <div className="card">
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4rem 1rem' }}>
            <Loader2 size={32} color="#2563eb" className="spin-icon" />
          </div>
        ) : filteredEmployees.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3.5rem 1rem', color: 'var(--text-muted)' }}>
            <Users size={44} color="#cbd5e1" style={{ marginBottom: '0.75rem' }} />
            <p style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-main)' }}>No employees found</p>
            <p style={{ fontSize: '0.8125rem', marginTop: '0.25rem' }}>Try clearing your search query or add a new employee.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Employee Info</th>
                  <th>Role</th>
                  <th>Department & Designation</th>
                  <th>Contact Info</th>
                  <th>Joining Date</th>
                  <th>Leave Balances (Remaining / Total)</th>
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.map((emp) => {
                  const isAdmin = emp.role === 'admin';
                  const casual = emp.balances?.find(b => b.leave_type === 'Casual Leave');
                  const sick = emp.balances?.find(b => b.leave_type === 'Sick Leave');
                  const earned = emp.balances?.find(b => b.leave_type === 'Earned Leave');

                  return (
                    <tr key={emp.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '50%',
                            backgroundColor: isAdmin ? '#f3e8ff' : '#eff6ff',
                            color: isAdmin ? '#7c3aed' : '#2563eb',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            fontSize: '0.875rem',
                            border: `1px solid ${isAdmin ? '#e9d5ff' : '#bfdbfe'}`
                          }}>
                            {emp.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span style={{ fontWeight: 700, color: 'var(--text-main)', display: 'block' }}>
                              {emp.name}
                            </span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                              {emp.employee_id}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${isAdmin ? 'badge-admin' : 'badge-role'}`}>
                          {isAdmin ? <ShieldCheck size={12} /> : <UserCheck size={12} />}
                          {isAdmin ? 'Admin' : 'Employee'}
                        </span>
                      </td>
                      <td>
                        <div>
                          <span style={{ fontWeight: 600, color: 'var(--text-main)', display: 'block', fontSize: '0.8125rem' }}>
                            {emp.department}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {emp.designation}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div style={{ fontSize: '0.8125rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: 'var(--text-main)' }}>
                            <Mail size={13} color="#94a3b8" />
                            <span>{emp.email}</span>
                          </div>
                          {emp.phone && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: 'var(--text-muted)', marginTop: '2px', fontSize: '0.75rem' }}>
                              <Phone size={12} color="#94a3b8" />
                              <span>{emp.phone}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                          {emp.joining_date}
                        </span>
                      </td>
                      <td>
                        {isAdmin ? (
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-light)', fontStyle: 'italic' }}>
                            Administrator (Exempt)
                          </span>
                        ) : (
                          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                            <span style={{
                              fontSize: '0.75rem',
                              padding: '2px 8px',
                              borderRadius: '6px',
                              backgroundColor: '#eff6ff',
                              border: '1px solid #bfdbfe',
                              color: '#1e40af'
                            }}>
                              <strong>CL:</strong> {casual ? `${casual.remaining_leaves}/${casual.total_leaves}` : '—'}
                            </span>
                            <span style={{
                              fontSize: '0.75rem',
                              padding: '2px 8px',
                              borderRadius: '6px',
                              backgroundColor: '#fef2f2',
                              border: '1px solid #fecaca',
                              color: '#991b1b'
                            }}>
                              <strong>SL:</strong> {sick ? `${sick.remaining_leaves}/${sick.total_leaves}` : '—'}
                            </span>
                            <span style={{
                              fontSize: '0.75rem',
                              padding: '2px 8px',
                              borderRadius: '6px',
                              backgroundColor: '#f5f3ff',
                              border: '1px solid #ddd6fe',
                              color: '#5b21b6'
                            }}>
                              <strong>EL:</strong> {earned ? `${earned.remaining_leaves}/${earned.total_leaves}` : '—'}
                            </span>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Employee Modal */}
      <AddEmployeeModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={handleAddSuccess}
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
