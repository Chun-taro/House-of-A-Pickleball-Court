import React from 'react';

export default function StatusBadge({ status }) {
  const getBadgeStyle = (st) => {
    switch (st?.toLowerCase()) {
      case 'approved':
      case 'confirmed':
      case 'completed':
      case 'paid':
      case 'active':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'partially_paid':
      case 'partially paid':
        return 'bg-teal-100 text-teal-900 border-teal-400 font-extrabold';
      case 'pending':
      case 'unpaid':
      case 'pending_verification':
      case 'partial payment - pending verification':
        return 'bg-amber-100 text-amber-900 border-amber-300';
      case 'checked_in':
        return 'bg-indigo-100 text-indigo-800 border-indigo-300';
      case 'cancelled':
      case 'rejected':
      case 'failed':
      case 'inactive':
        return 'bg-rose-100 text-rose-800 border-rose-300';
      case 'refunded':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-300';
    }
  };

  const getLabel = (st) => {
    if (!st) return '';
    if (st.toLowerCase() === 'partially_paid') return 'Partially Paid';
    if (st.toLowerCase() === 'pending_verification') return 'Pending Verification';
    return st.replace(/_/g, ' ');
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border uppercase tracking-wider ${getBadgeStyle(
        status
      )}`}
    >
      {getLabel(status)}
    </span>
  );
}
