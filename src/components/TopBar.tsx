import React, { useState, useRef, useEffect } from 'react';
import {
  Bell,
  Search,
  Menu,
  Plus,
  LogOut,
  ChevronDown,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface TopBarProps {
  activePage: string;
  onAction: (action: string) => void;
  toggleSidebar: () => void;
}

export default function TopBar({ activePage, onAction, toggleSidebar }: TopBarProps) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSignOut = async () => {
    setMenuOpen(false);
    await signOut();
    navigate('/login');
  };

  return (
    <header className="h-[80px] bg-white border-b border-gray-100 px-4 md:px-8 flex items-center justify-between sticky top-0 z-50">
      <div className="flex items-center gap-4 flex-1">
        <button 
          onClick={toggleSidebar}
          className="lg:hidden p-2 text-gray-500 hover:bg-gray-50 rounded-xl outline-none"
        >
          <Menu className="w-6 h-6" />
        </button>
        
        <div className="hidden md:flex items-center gap-3 bg-gray-50 px-4 py-2.5 rounded-2xl border border-gray-100 w-full max-w-md group focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all">
          <Search className="w-5 h-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
          <input 
            type="text" 
            placeholder="Search properties, leads, or agents..." 
            className="bg-transparent border-none outline-none text-sm font-medium w-full placeholder:text-gray-400"
          />
        </div>
      </div>

      <div className="flex items-center gap-3 md:gap-6">
        <button 
          onClick={() => onAction('add-property')}
          className="hidden md:flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-2xl font-bold text-sm hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          Quick Add
        </button>

        <div className="flex items-center gap-2">
          <button className="relative p-2.5 text-gray-400 hover:bg-gray-50 rounded-xl transition-colors">
            <Bell className="w-6 h-6" />
            <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 border-2 border-white rounded-full"></span>
          </button>
        </div>

        <div className="relative pl-2 md:pl-6 border-l border-gray-100" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(o => !o)}
            className="flex items-center gap-3 rounded-2xl hover:bg-gray-50 p-1.5 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            type="button"
            aria-haspopup="true"
            aria-expanded={menuOpen ? 'true' : 'false'}
          >
            <div className="text-right hidden sm:block">
              <p className="text-sm font-black text-gray-900 leading-tight tracking-tight uppercase">{user?.name || 'User'}</p>
              <p className="text-[10px] font-bold text-brand-muted uppercase tracking-widest leading-none mt-1">{user?.role || 'Guest'}</p>
            </div>
            <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-white font-black text-lg shadow-lg border-2 border-white">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform hidden sm:block ${menuOpen ? 'rotate-180' : ''}`} />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 py-1 z-50">
              <div className="px-4 py-3 border-b border-gray-50">
                <p className="text-sm font-bold text-gray-900 truncate">{user?.name || 'User'}</p>
                <p className="text-xs text-gray-400 capitalize mt-0.5">{user?.role || 'Guest'}</p>
              </div>
              <button
                type="button"
                onClick={handleSignOut}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
