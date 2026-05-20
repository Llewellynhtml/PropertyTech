import React from 'react';

interface RoleSwitcherProps {
  activeRole: 'agent' | 'agency';
  onRoleChange: (role: 'agent' | 'agency') => void;
}

export default function RoleSwitcher({ activeRole, onRoleChange }: RoleSwitcherProps) {
  return (
    <div className="flex bg-gray-100 p-1 rounded-xl mb-6">
      <button
        onClick={() => onRoleChange('agent')}
        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
          activeRole === 'agent' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500'
        }`}
      >
        Agent
      </button>
      <button
        onClick={() => onRoleChange('agency')}
        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
          activeRole === 'agency' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500'
        }`}
      >
        Agency
      </button>
    </div>
  );
}
