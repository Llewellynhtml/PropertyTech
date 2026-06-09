import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import Dashboard from './components/Dashboard';
import Properties from './components/Properties';
import Leads from './components/Leads';
import Analytics from './components/Analytics';
import Marketing from './components/Marketing';
import ScheduledPosts from './components/ScheduledPosts';
import Agents from './components/Agents';
import Settings from './components/Settings';
import Onboarding from './components/Onboarding';
import { UserRole, Agent } from './types';
import { useAuth } from './contexts/AuthContext';
import { supabase } from './lib/supabaseClient';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import ProtectedRoute from './components/ProtectedRoute';

import AgencyDashboard from './components/agency/AgencyDashboard';
import AgencyAgents from './components/agency/AgencyAgents';
import AgencyProperties from './components/agency/AgencyProperties';
import AgencyLeads from './components/agency/AgencyLeads';
import AgencyAnalytics from './components/agency/AgencyAnalytics';
import AgencySettings from './components/agency/AgencySettings';

import AgentDashboard from './components/agent/AgentDashboard';
import AgentProperties from './components/agent/AgentProperties';
import AgentLeads from './components/agent/AgentLeads';
import AgentAnalytics from './components/agent/AgentAnalytics';
import AgentProfile from './components/agent/AgentProfile';
import AddPropertyModal from './components/shared/AddPropertyModal';

import SocialMediaTemplates from './components/SocialMediaTemplates';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Login />} />
        
        {/* Agent Routes */}
        <Route path="/agent-dashboard/*" element={
          <ProtectedRoute allowedRoles={['agent']}>
            <DashboardLayout role="agent" />
          </ProtectedRoute>
        } />

        {/* Agency Routes */}
        <Route path="/agency-dashboard/*" element={
          <ProtectedRoute allowedRoles={['agency']}>
            <DashboardLayout role="agency" />
          </ProtectedRoute>
        } />

        {/* Root Redirect */}
        <Route path="/" element={<RootRedirect />} />
        
        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

function RootRedirect() {
  const { user, isLoading, session } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-brand-surface flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-brand-teal border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-bold text-brand-muted uppercase tracking-widest">Loading workspace...</p>
        </div>
      </div>
    );
  }
  
  if (!session) return <Navigate to="/login" replace />;

  // Session exists but profile not loaded yet — wait for onAuthStateChange to
  // finish fetchUserProfile rather than bouncing the user back to /login.
  if (!user) {
    return (
      <div className="min-h-screen bg-brand-surface flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-brand-teal border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-bold text-brand-muted uppercase tracking-widest">Loading workspace...</p>
        </div>
      </div>
    );
  }

  if (user.role === 'agency') return <Navigate to="/agency-dashboard" replace />;
  return <Navigate to="/agent-dashboard" replace />;
}

function DashboardLayout({ role }: { role: 'agent' | 'agency' }) {
  const { session, signOut, user } = useAuth();
  const [activePage, setActivePage] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isAddPropertyModalOpen, setIsAddPropertyModalOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [initialPostConfig, setInitialPostConfig] = useState<{
    platformId?: string;
    formatId?: string;
    designId?: string;
    timestamp: number;
  } | null>(null);

  const handleCreatePostFromTemplate = (platformId: string, formatId: string, designId: string) => {
    setInitialPostConfig({ platformId, formatId, designId, timestamp: Date.now() });
    setActivePage(role === 'agency' ? 'social-templates' : 'post-builder');
    // If agency, we might need a different target, but currently marketing is for agents
    // Actually, social-templates is available for both.
    if (role === 'agent') setActivePage('post-builder');
  };

  const fetchAgents = async () => {
    if (!session) return;
    try {
      const { data, error } = await supabase
        .from('agents')
        .select('*')
        .order('full_name', { ascending: true });

      if (error) throw error;
      if (data) {
        setAgents(data);
      }
    } catch (error) {
      console.error('Error fetching agents:', error);
    }
  };

  useEffect(() => {
    if (session) {
      fetchAgents();
    }
  }, [session]);

  const handleOnboardingComplete = (role: UserRole) => {
    setUserRole(role);
    setShowOnboarding(false);
  };

  const handleQuickAction = (action: string) => {
    console.log('Quick Action:', action);
    if (action === 'add-property') {
      setIsAddPropertyModalOpen(true);
    }
    if (action === 'create-post') setActivePage('post-builder');
    if (action === 'add-lead') setActivePage('leads');
    if (action === 'add-agent') setActivePage('agents');
  };

  const renderPage = () => {
    if (role === 'agency') {
      switch (activePage) {
        case 'dashboard': return <AgencyDashboard onAddProperty={() => setIsAddPropertyModalOpen(true)} refreshTrigger={refreshTrigger} />;
        case 'agents': return <AgencyAgents />;
        case 'properties': return <AgencyProperties onAddProperty={() => setIsAddPropertyModalOpen(true)} refreshTrigger={refreshTrigger} />;
        case 'leads': return <AgencyLeads />;
        case 'analytics': return <AgencyAnalytics />;
        case 'social-templates': return (
          <SocialMediaTemplates 
            onCreatePost={(p, f, d) => {
              setInitialPostConfig({ platformId: p, formatId: f, designId: d, timestamp: Date.now() });
              setActivePage('post-builder');
            }} 
          />
        );
        case 'post-builder': return (
          <Marketing 
            key={initialPostConfig?.timestamp || 'default'}
            initialPlatformId={initialPostConfig?.platformId}
            initialFormatId={initialPostConfig?.formatId}
            initialDesignId={initialPostConfig?.designId}
          />
        );
        case 'branding': return <AgencySettings />;
        case 'settings': return <AgencySettings />;
        default: return <AgencyDashboard onAddProperty={() => setIsAddPropertyModalOpen(true)} refreshTrigger={refreshTrigger} />;
      }
    }

    switch (activePage) {
      case 'dashboard': return <AgentDashboard onAddProperty={() => setIsAddPropertyModalOpen(true)} refreshTrigger={refreshTrigger} />;
      case 'properties': return <AgentProperties onAddProperty={() => setIsAddPropertyModalOpen(true)} refreshTrigger={refreshTrigger} />;
      case 'leads': return <AgentLeads />;
      case 'analytics': return <AgentAnalytics />;
      case 'social-templates': return (
        <SocialMediaTemplates 
          onCreatePost={(p, f, d) => {
            setInitialPostConfig({ platformId: p, formatId: f, designId: d, timestamp: Date.now() });
            setActivePage('post-builder');
          }} 
        />
      );
      case 'post-builder': return (
        <Marketing 
          initialPlatformId={initialPostConfig?.platformId}
          initialFormatId={initialPostConfig?.formatId}
          initialDesignId={initialPostConfig?.designId}
        />
      );
      case 'scheduled-posts': return <ScheduledPosts />;
      case 'profile': return <AgentProfile />;
      case 'settings': return <AgentProfile />;
      default: return <AgentDashboard onAddProperty={() => setIsAddPropertyModalOpen(true)} refreshTrigger={refreshTrigger} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-[#f9fafb]">
      <AnimatePresence>
        {showOnboarding && (
          <Onboarding onComplete={handleOnboardingComplete} />
        )}
      </AnimatePresence>

      <Sidebar 
        activePage={activePage} 
        setActivePage={(page) => {
          if (page !== 'post-builder') setInitialPostConfig(null);
          setActivePage(page);
          setIsSidebarOpen(false);
        }} 
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
        role={role}
      />

      <main className="flex-1 flex flex-col min-w-0 w-full">
        <TopBar 
          activePage={activePage} 
          onAction={handleQuickAction} 
          toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        />
        
        <div className="flex-1 overflow-y-auto scrollbar-hide">
          <AnimatePresence mode="wait">
            <motion.div
              key={activePage}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="p-4 md:p-8"
            >
              {renderPage()}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      <AddPropertyModal 
        isOpen={isAddPropertyModalOpen} 
        onClose={() => setIsAddPropertyModalOpen(false)} 
        onSuccess={() => {
          setRefreshTrigger(prev => prev + 1);
          setIsAddPropertyModalOpen(false);
        }} 
      />
    </div>
  );
}
