import React from 'react';

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-black text-gray-900 tracking-tight">Dashboard Overview</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm h-32 animate-pulse" />
        ))}
      </div>
    </div>
  );
}
