import React from 'react';

export default function StatCard({ title, value, icon: Icon, color = 'blue', subtitle, onClick }) {
  const colorMap = {
    blue: {
      bg: '#eff6ff',
      text: '#2563eb',
      border: '#bfdbfe'
    },
    amber: {
      bg: '#fef3c7',
      text: '#d97706',
      border: '#fde68a'
    },
    emerald: {
      bg: '#ecfdf5',
      text: '#059669',
      border: '#a7f3d0'
    },
    rose: {
      bg: '#fef2f2',
      text: '#dc2626',
      border: '#fecaca'
    },
    purple: {
      bg: '#f5f3ff',
      text: '#7c3aed',
      border: '#ddd6fe'
    }
  };

  const scheme = colorMap[color] || colorMap.blue;

  return (
    <div 
      className="card" 
      onClick={onClick}
      style={{
        cursor: onClick ? 'pointer' : 'default',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.375rem' }}>
            {title}
          </p>
          <h3 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
            {value}
          </h3>
          {subtitle && (
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              {subtitle}
            </p>
          )}
        </div>
        <div style={{
          width: '46px',
          height: '46px',
          borderRadius: '12px',
          backgroundColor: scheme.bg,
          color: scheme.text,
          border: `1px solid ${scheme.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Icon size={24} />
        </div>
      </div>
    </div>
  );
}
