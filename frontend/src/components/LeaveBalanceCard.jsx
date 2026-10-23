import React from 'react';
import { Calendar, HeartPulse, Sparkles } from 'lucide-react';

export default function LeaveBalanceCard({ balances = [] }) {
  const getIcon = (type) => {
    switch (type) {
      case 'Casual Leave':
        return <Calendar size={18} color="#2563eb" />;
      case 'Sick Leave':
        return <HeartPulse size={18} color="#ef4444" />;
      case 'Earned Leave':
        return <Sparkles size={18} color="#8b5cf6" />;
      default:
        return <Calendar size={18} color="#2563eb" />;
    }
  };

  const getGradient = (type) => {
    switch (type) {
      case 'Casual Leave':
        return 'linear-gradient(135deg, #2563eb, #3b82f6)';
      case 'Sick Leave':
        return 'linear-gradient(135deg, #ef4444, #f87171)';
      case 'Earned Leave':
        return 'linear-gradient(135deg, #8b5cf6, #a855f7)';
      default:
        return 'linear-gradient(135deg, #2563eb, #3b82f6)';
    }
  };

  return (
    <div className="card">
      <div className="card-header" style={{ marginBottom: '1rem' }}>
        <h3 className="card-title">
          <Calendar size={18} color="#2563eb" />
          Leave Quota Overview
        </h3>
        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
          Year {new Date().getFullYear()}
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        {balances.map((item) => {
          const remaining = item.remaining_leaves !== undefined ? item.remaining_leaves : (item.total_leaves - item.used_leaves);
          const percentUsed = Math.min(100, Math.round((item.used_leaves / item.total_leaves) * 100)) || 0;

          return (
            <div 
              key={item.leave_type}
              style={{
                background: '#f8fafc',
                borderRadius: '12px',
                padding: '1.125rem',
                border: '1px solid var(--border-color)',
                position: 'relative'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {getIcon(item.leave_type)}
                  <span style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-main)' }}>
                    {item.leave_type}
                  </span>
                </div>
                <span style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '10px',
                  backgroundColor: remaining > 3 ? '#ecfdf5' : '#fef2f2',
                  color: remaining > 3 ? '#059669' : '#dc2626'
                }}>
                  {remaining} Left
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.375rem', marginBottom: '0.625rem' }}>
                <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)' }}>
                  {remaining}
                </span>
                <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                  / {item.total_leaves} days total
                </span>
              </div>

              {/* Progress Bar */}
              <div style={{
                height: '6px',
                width: '100%',
                backgroundColor: '#e2e8f0',
                borderRadius: '999px',
                overflow: 'hidden'
              }}>
                <div style={{
                  height: '100%',
                  width: `${percentUsed}%`,
                  background: getGradient(item.leave_type),
                  borderRadius: '999px',
                  transition: 'width 0.4s ease'
                }} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.375rem' }}>
                <span>Used: {item.used_leaves}</span>
                <span>{percentUsed}% consumed</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
