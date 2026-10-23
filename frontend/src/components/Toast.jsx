import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export default function Toast({ type = 'info', message, onClose, duration = 4000 }) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [message, duration, onClose]);

  if (!message) return null;

  const getToastStyles = () => {
    switch (type) {
      case 'success':
        return {
          bg: '#ecfdf5',
          border: '#a7f3d0',
          text: '#065f46',
          icon: <CheckCircle2 size={20} color="#059669" />
        };
      case 'error':
        return {
          bg: '#fef2f2',
          border: '#fecaca',
          text: '#991b1b',
          icon: <AlertCircle size={20} color="#dc2626" />
        };
      default:
        return {
          bg: '#eff6ff',
          border: '#bfdbfe',
          text: '#1e40af',
          icon: <Info size={20} color="#2563eb" />
        };
    }
  };

  const style = getToastStyles();

  return (
    <div style={{
      position: 'fixed',
      bottom: '24px',
      right: '24px',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '12px 18px',
      backgroundColor: style.bg,
      border: `1px solid ${style.border}`,
      borderRadius: '10px',
      color: style.text,
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
      maxWidth: '450px',
      animation: 'fadeIn 0.2s ease-out'
    }}>
      {style.icon}
      <span style={{ fontSize: '0.875rem', fontWeight: 500, flex: 1 }}>{message}</span>
      <button 
        onClick={onClose}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: style.text,
          padding: '2px',
          display: 'flex'
        }}
      >
        <X size={16} />
      </button>
    </div>
  );
}
