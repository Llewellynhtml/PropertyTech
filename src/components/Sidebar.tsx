import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  LayoutDashboard, 
  Home, 
  Users, 
  Target,
  BarChart3,
  PlusSquare,
  Clock, 
  Settings2, 
  ChevronLeft, 
  ChevronRight,
  LogOut,
  Palette,
  Megaphone,
  User,
  Layout
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Logo from './shared/Logo';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface SidebarProps {
  activePage: string;
  setActivePage: (page: string) => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  role?: 'agent' | 'agency';
}

const navItems = [
  { id: 'dashboard', label: 'Overview', icon: LayoutDashboard, section: 'Overview' },
  { id: 'agents', label: 'Agents', icon: Users, section: 'Management', roles: ['agency'] },
  { id: 'properties', label: 'My Properties', icon: Home, section: 'Management' },
  { id: 'leads', label: 'My Leads', icon: Target, section: 'Management' },
  { id: 'analytics', label: 'Analytics', icon: BarChart3, section: 'Insights' },
  { id: 'post-builder', label: 'Post Builder', icon: PlusSquare, section: 'Marketing', roles: ['agent'] },
  { id: 'social-templates', label: 'Social Templates', icon: Layout, section: 'Marketing' },
  { id: 'scheduled-posts', label: 'Scheduled Posts', icon: Clock, section: 'Marketing', roles: ['agent'] },
  { id: 'profile', label: 'Profile', icon: User, section: 'System', roles: ['agent'] },
  { id: 'branding', label: 'Branding', icon: Palette, section: 'System', roles: ['agency'] },
  { id: 'settings', label: 'Settings', icon: Settings2, section: 'System' },
];

const sections = ['Overview', 'Management', 'Insights', 'Marketing', 'System'];

export default function Sidebar({ activePage, setActivePage, isCollapsed, setIsCollapsed, isOpen, setIsOpen, role }: SidebarProps) {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const filteredNavItems = navItems.filter(item => {
    if (item.roles && !item.roles.includes(role || 'agent')) return false;
    return true;
  });

  const filteredSections = sections.filter(section => 
    filteredNavItems.some(item => item.section === section)
  );

  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/50 z-[60] lg:hidden backdrop-blur-sm"
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      <motion.aside
        initial={false}
        animate={{ 
          width: isCollapsed ? 80 : 260,
          x: isOpen ? 0 : (typeof window !== 'undefined' && window.innerWidth < 1024 ? -260 : 0)
        }}
        className={cn(
          "h-screen bg-white border-r border-gray-100 flex flex-col fixed lg:sticky top-0 z-[70] transition-all duration-500 ease-in-out shadow-[1px_0_10px_rgba(0,0,0,0.02)]",
          !isOpen && "max-lg:-translate-x-full"
        )}
        role="navigation"
        aria-label="Main Navigation"
      >
        <div className="p-4 flex items-center justify-between bg-brand-charcoal border-b border-white/5 h-[80px]">
          <motion.div
            initial={false}
            animate={{ opacity: isCollapsed ? 0 : 1 }}
            className={cn("flex items-center gap-3", isCollapsed && "hidden")}
          >
            <Logo className="h-14 w-auto" variant="light" />
          </motion.div>
          
          {isCollapsed && (
            <div className="flex-1 flex justify-center">
              <Logo className="h-8 w-8" variant="light" showText={false} />
            </div>
          )}

          <button 
            onClick={() => setIsOpen(false)}
            className="lg:hidden p-2 text-white/60 hover:text-white focus-visible:ring-2 focus-visible:ring-brand-teal rounded-lg outline-none"
            aria-label="Close Sidebar"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-8 overflow-y-auto scrollbar-hide">
          {filteredSections.map((section) => (
            <div key={section} className="space-y-1" role="group" aria-labelledby={`section-${section}`}>
              {!isCollapsed && (
                <h3 id={`section-${section}`} className="px-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3">
                  {section}
                </h3>
              )}
              {filteredNavItems
                .filter((item) => item.section === section)
                .map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActivePage(item.id)}
                    aria-current={activePage === item.id ? 'page' : undefined}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 group relative outline-none focus-visible:ring-2 focus-visible:ring-indigo-500",
                      activePage === item.id
                        ? "bg-indigo-50/50 text-indigo-600 shadow-[0_4px_12px_rgba(79,70,229,0.08)]"
                        : "text-gray-500 hover:bg-gray-50/80 hover:text-gray-900"
                    )}
                  >
                    <item.icon className={cn(
                      "w-5 h-5 shrink-0 transition-transform duration-300 group-hover:scale-110",
                      activePage === item.id ? "text-indigo-600" : "text-gray-400 group-hover:text-gray-900"
                    )} strokeWidth={1.5} aria-hidden="true" />
                    {!isCollapsed && (
                      <div className="flex items-center justify-between flex-1">
                        <span className="font-bold text-sm tracking-tight">{item.label}</span>
                      </div>
                    )}
                    {activePage === item.id && (
                      <motion.div 
                        layoutId="active-pill"
                        className="absolute left-0 w-1 h-6 bg-indigo-600 rounded-r-full"
                      />
                    )}
                    {isCollapsed && (
                      <div className="absolute left-full ml-4 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                        {item.label}
                      </div>
                    )}
                  </button>
                ))}
            </div>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-100">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="w-full lg:flex hidden items-center justify-center p-2 rounded-lg hover:bg-gray-50 text-gray-400 hover:text-gray-600 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            aria-label={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </button>
          <button
            onClick={async () => { await signOut(); navigate('/login'); }}
            className="w-full flex items-center gap-3 px-3 py-2.5 mt-2 rounded-xl text-gray-500 hover:bg-red-50 hover:text-red-600 transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-red-500"
            aria-label="Logout"
          >
            <LogOut className="w-5 h-5 shrink-0" aria-hidden="true" />
            {!isCollapsed && <span className="font-medium text-sm">Logout</span>}
          </button>
        </div>
      </motion.aside>
    </>
  );
}
