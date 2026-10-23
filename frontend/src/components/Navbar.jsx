import React from 'react';
import { ShieldCheck, UserCheck, CalendarDays, Bell } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar({ title, subtitle, onOpenApplyModal }) {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const todayStr = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <header style={{
      backgroundColor: '#ffffff',
      borderBottom: '1px solid var(--border-color)',
      padding: '1rem 2rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.03)'
    }}>
      <div>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
          {title}
        </h1>
        {subtitle && (
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
            {subtitle}
          </p>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {/* Date Display */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.375rem',
          fontSize: '0.8125rem',
          color: 'var(--text-muted)',
          backgroundColor: '#f8fafc',
          padding: '0.375rem 0.75rem',
          borderRadius: '8px',
          border: '1px solid var(--border-color)'
        }}>
          <CalendarDays size={15} color="#64748b" />
          <span>{todayStr}</span>
        </div>

        {/* User Role Badge */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.375rem',
          padding: '0.375rem 0.75rem',
          borderRadius: '8px',
          fontSize: '0.75rem',
          fontWeight: 700,
          backgroundColor: isAdmin ? '#f3e8ff' : '#eff6ff',
          color: isAdmin ? '#7c3aed' : '#2563eb',
          border: `1px solid ${isAdmin ? '#e9d5ff' : '#bfdbfe'}`
        }}>
          {isAdmin ? <ShieldCheck size={15} /> : <UserCheck size={15} />}
          <span>{isAdmin ? 'HR Administrator' : user?.designation || 'Employee'}</span>
        </div>

        {/* Quick Apply Leave Button for Employee */}
        {!isAdmin && onOpenApplyModal && (
          <button 
            className="btn btn-primary btn-sm"
            onClick={onOpenApplyModal}
          >
            Apply Leave
          </button>
        )}
      </div>
    </header>
  );
}
