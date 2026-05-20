import React from 'react';
import { Lead } from '../../types';

export default function LeadsTable({ leads, onLeadClick }: any) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-gray-100">
            <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Name</th>
            <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Status</th>
            <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Email</th>
          </tr>
        </thead>
        <tbody>
          {leads.map((lead: Lead) => (
            <tr 
              key={lead.id} 
              onClick={() => onLeadClick(lead)}
              className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors"
            >
              <td className="px-6 py-4 text-sm font-bold text-gray-900">{lead.contactName || lead.contact_name}</td>
              <td className="px-6 py-4">
                <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest">
                  {lead.status}
                </span>
              </td>
              <td className="px-6 py-4 text-sm text-gray-500 font-medium">{lead.contactEmail || lead.contact_email}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
