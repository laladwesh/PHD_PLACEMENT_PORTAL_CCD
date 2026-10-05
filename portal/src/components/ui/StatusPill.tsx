import React from 'react';

export default function StatusPill({ status }: { status: 'Incomplete' | 'Unapproved' | 'Approved' }) {
  const colors = {
    Incomplete: 'bg-gray-100 text-gray-800',
    Unapproved: 'bg-yellow-100 text-yellow-800',
    Approved: 'bg-green-100 text-green-800',
  };

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${colors[status] || 'bg-gray-100 text-gray-800'}`}>
      {status}
    </span>
  );
}
