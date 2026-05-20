import React from 'react';
import { X } from 'lucide-react';
import { motion } from 'motion/react';

export default function LeadDetailPane({ lead, onClose }: any) {
  return (
    <motion.div 
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-50 p-8 overflow-y-auto"
    >
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-black">Lead Details</h2>
        <button onClick={onClose}><X className="w-6 h-6" /></button>
      </div>
      <div>
        <h3 className="text-sm font-black uppercase text-gray-400 mb-4 tracking-widest">Contact Information</h3>
        <p className="text-lg font-bold">{lead.contactName || lead.contact_name}</p>
        <p className="text-gray-500">{lead.contactEmail || lead.contact_email}</p>
      </div>
    </motion.div>
  );
}
