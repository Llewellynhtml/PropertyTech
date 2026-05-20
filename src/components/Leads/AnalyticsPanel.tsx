import React from 'react';

export default function AnalyticsPanel({ leadsData }: any) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
        <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Total Leads</p>
        <p className="text-3xl font-black text-indigo-600">{leadsData.totalLeads}</p>
      </div>
      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
        <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">New Leads</p>
        <p className="text-3xl font-black text-purple-600">{leadsData.newLeadsCount}</p>
      </div>
      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
        <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Conversion</p>
        <p className="text-3xl font-black text-emerald-600">{leadsData.conversionRate}%</p>
      </div>
    </div>
  );
}
