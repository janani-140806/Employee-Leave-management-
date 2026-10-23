import React from 'react';
import { Clock, CheckCircle2, XCircle, Slash } from 'lucide-react';

export default function StatusBadge({ status }) {
  const normalized = (status || 'PENDING').toUpperCase();

  switch (normalized) {
    case 'PENDING':
      return (
        <span className="badge badge-pending">
          <Clock size={12} />
          Pending
        </span>
      );
    case 'APPROVED':
      return (
        <span className="badge badge-approved">
          <CheckCircle2 size={12} />
          Approved
        </span>
      );
    case 'REJECTED':
      return (
        <span className="badge badge-rejected">
          <XCircle size={12} />
          Rejected
        </span>
      );
    case 'CANCELLED':
      return (
        <span className="badge badge-cancelled">
          <Slash size={12} />
          Cancelled
        </span>
      );
    default:
      return <span className="badge badge-cancelled">{status}</span>;
  }
}
