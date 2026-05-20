import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  Plus, 
  Download, 
  LayoutGrid, 
  List, 
  Bell, 
  X,
  RefreshCcw,
  ChevronDown,
  Tag
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Lead, Agent, Property, LeadStatus, LeadTask } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import LeadsTable from './Leads/LeadsTable';
import LeadDetailPane from './Leads/LeadDetailPane';
import AnalyticsPanel from './Leads/AnalyticsPanel';
import Skeleton from './Skeleton';
import { formatDate } from '../utils/format';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function Leads() {
  const { user } = useAuth();
  const [view, setView] = useState<'list' | 'analytics'>('list');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<LeadStatus | 'All'>('All');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  // Fetch data
  const fetchData = async () => {
    setLoading(true);
    try {
      const [leadsRes, agentsRes, propsRes] = await Promise.all([
        supabase.from('leads').select('*').order('created_at', { ascending: false }),
        supabase.from('agents').select('*').order('full_name', { ascending: true }),
        supabase.from('properties').select('*').order('created_at', { ascending: false })
      ]);

      if (leadsRes.data) setLeads(leadsRes.data as any);
      if (agentsRes.data) setAgents(agentsRes.data as any);
      if (propsRes.data) setProperties(propsRes.data as any);

      if (leadsRes.error) throw leadsRes.error;
      if (agentsRes.error) throw agentsRes.error;
      if (propsRes.error) throw propsRes.error;

    } catch (error) {
      console.error('Error fetching leads data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filtered leads
  const filteredLeads = useMemo(() => {
    return leads.filter(lead => {
      const matchesSearch = 
        lead.contactName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.contactEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.propertyTitle?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'All' || lead.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [leads, searchTerm, statusFilter]);

  // Analytics data
  const analyticsData = useMemo(() => {
    const totalLeads = leads.length;
    const closedLeads = leads.filter(l => l.status === 'Closed').length;
    const conversionRate = totalLeads > 0 ? Math.round((closedLeads / totalLeads) * 100) : 0;
    const newLeadsCount = leads.filter(l => l.status === 'New').length;

    const platformCounts: Record<string, number> = {};
    leads.forEach(l => {
      platformCounts[l.source] = (platformCounts[l.source] || 0) + 1;
    });
    const platformData = Object.entries(platformCounts).map(([name, value]) => ({ name, value }));

    const agentCounts: Record<string, number> = {};
    leads.forEach(l => {
      if (l.agentName) {
        agentCounts[l.agentName] = (agentCounts[l.agentName] || 0) + 1;
      }
    });
    const agentLoadData = Object.entries(agentCounts).map(([name, leads]) => ({ name, leads }));

    const funnelStages = ['New', 'Contacted', 'Qualified', 'Closed'];
    const funnelData = funnelStages.map(stage => ({
      name: stage,
      value: leads.filter(l => l.status === stage).length,
      fill: stage === 'New' ? '#818cf8' : stage === 'Contacted' ? '#6366f1' : stage === 'Qualified' ? '#4f46e5' : '#4338ca'
    }));

    return {
      stats: { totalLeads, conversionRate, newLeadsCount },
      platformData,
      agentLoadData,
      funnelData
    };
  }, [leads]);

  const handleUpdateLead = async (leadId: string, updates: Partial<Lead>) => {
    try {
      const { data, error } = await supabase
        .from('leads')
        .update(updates)
        .eq('id', leadId)
        .select()
        .single();

      if (error) throw error;
      if (data) {
        setLeads(prev => prev.map(l => l.id === leadId ? { ...l, ...data } : l));
        if (selectedLead?.id === leadId) {
          setSelectedLead(prev => prev ? { ...prev, ...data } : null);
        }
      }
    } catch (error) {
      console.error('Error updating lead:', error);
    }
  };

  const handleAddNote = async (leadId: string, content: string) => {
    try {
      const lead = leads.find(l => l.id === leadId);
      if (!lead) return;

      const newNote = {
        id: crypto.randomUUID(),
        content,
        createdAt: new Date().toISOString(),
        agentName: user?.name || 'Unknown'
      };

      const notes = [newNote, ...(lead.notes || [])];

      const { data, error } = await supabase
        .from('leads')
        .update({ notes })
        .eq('id', leadId)
        .select()
        .single();

      if (error) throw error;
      if (data) {
        setLeads(prev => prev.map(l => l.id === leadId ? { ...l, ...data } : l));
        if (selectedLead?.id === leadId) {
          setSelectedLead(prev => prev ? { ...prev, ...data } : null);
        }
      }
    } catch (error) {
      console.error('Error adding note:', error);
    }
  };

  const handleAddTask = async (leadId: string, task: Partial<LeadTask>) => {
    try {
      const lead = leads.find(l => l.id === leadId);
      if (!lead) return;

      const newTask = {
        id: crypto.randomUUID(),
        title: task.title || '',
        dueDate: task.dueDate || new Date().toISOString(),
        completed: false,
        ...task
      };

      const tasks = [newTask, ...(lead.tasks || [])];

      const { data, error } = await supabase
        .from('leads')
        .update({ tasks })
        .eq('id', leadId)
        .select()
        .single();

      if (error) throw error;
      if (data) {
        setLeads(prev => prev.map(l => l.id === leadId ? { ...l, ...data } : l));
        if (selectedLead?.id === leadId) {
          setSelectedLead(prev => prev ? { ...prev, ...data } : null);
        }
      }
    } catch (error) {
      console.error('Error adding task:', error);
    }
  };

  const handleToggleTask = async (leadId: string, taskId: string, completed: boolean) => {
    try {
      const lead = leads.find(l => l.id === leadId);
      if (!lead) return;

      const tasks = (lead.tasks || []).map(t => 
        t.id === taskId ? { ...t, completed } : t
      );

      const { data, error } = await supabase
        .from('leads')
        .update({ tasks })
        .eq('id', leadId)
        .select()
        .single();

      if (error) throw error;
      if (data) {
        setLeads(prev => prev.map(l => l.id === leadId ? { ...l, ...data } : l));
        if (selectedLead?.id === leadId) {
          setSelectedLead(prev => prev ? { ...prev, ...data } : null);
        }
      }
    } catch (error) {
      console.error('Error toggling task:', error);
    }
  };

  const handleLeadClick = async (lead: Lead) => {
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('id', lead.id)
        .single();
      
      if (error) throw error;
      if (data) {
        setSelectedLead(data as any);
        setLeads(prev => prev.map(l => l.id === lead.id ? { ...l, ...data } : l));
      } else {
        setSelectedLead(lead);
      }
    } catch (error) {
      console.error('Error fetching lead details:', error);
      setSelectedLead(lead);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50 p-4 lg:p-8">
      <div className="max-w-[1600px] mx-auto space-y-8">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl lg:text-4xl font-black text-gray-900 tracking-tight">Leads Management</h1>
            <p className="text-sm lg:text-base text-gray-500 mt-1 font-medium">Capture, track and nurture your property prospects</p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                aria-expanded={showNotifications}
                aria-haspopup="true"
                aria-label={`Notifications ${notifications.length > 0 ? `(${notifications.length} new)` : ''}`}
                className="p-3 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-all relative group outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              >
                <Bell className="w-5 h-5 text-gray-400 group-hover:text-indigo-600 transition-colors" aria-hidden="true" />
                {notifications.length > 0 && (
                  <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-rose-500 border-2 border-white rounded-full" />
                )}
              </button>
              
              <AnimatePresence>
                {showNotifications && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-3 w-80 bg-white rounded-3xl shadow-2xl border border-gray-100 z-50 overflow-hidden"
                    role="dialog"
                    aria-label="Notifications panel"
                  >
                    <div className="p-4 border-b border-gray-50 flex items-center justify-between bg-gray-50/30">
                      <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest">Notifications</h3>
                      <button 
                        onClick={() => setShowNotifications(false)} 
                        className="text-gray-400 hover:text-gray-600 outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-lg p-1"
                        aria-label="Close notifications"
                      >
                        <X className="w-4 h-4" aria-hidden="true" />
                      </button>
                    </div>
                    <div className="max-h-96 overflow-y-auto p-2" role="list">
                      {notifications.length > 0 ? (
                        notifications.map((n, i) => (
                          <div key={i} role="listitem" className="p-3 hover:bg-gray-50 rounded-2xl transition-colors cursor-pointer outline-none focus-visible:bg-gray-50">
                            <p className="text-sm font-bold text-gray-900">{n.title}</p>
                            <p className="text-xs text-gray-500 mt-1">{n.message}</p>
                            <p className="text-[10px] text-gray-400 font-bold mt-2 uppercase tracking-wider">{n.time}</p>
                          </div>
                        ))
                      ) : (
                        <div className="py-12 text-center">
                          <Bell className="w-12 h-12 text-gray-100 mx-auto mb-3" aria-hidden="true" />
                          <p className="text-sm text-gray-400 font-medium">No new notifications</p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button 
              onClick={fetchData}
              aria-label="Refresh leads data"
              className="p-3 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-all group outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              <RefreshCcw className={cn("w-5 h-5 text-gray-400 group-hover:text-indigo-600 transition-all", loading && "animate-spin")} aria-hidden="true" />
            </button>

            <button className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold text-sm shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2">
              <Plus className="w-5 h-5" aria-hidden="true" />
              Add New Lead
            </button>
          </div>
        </div>

        {/* View Toggle & Filters */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white p-4 rounded-[2rem] border border-gray-100 shadow-sm">
          <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-2xl" role="tablist" aria-label="View selection">
            <button 
              role="tab"
              aria-selected={view === 'list'}
              onClick={() => setView('list')}
              className={cn(
                "flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold transition-all outline-none focus-visible:ring-2 focus-visible:ring-indigo-500",
                view === 'list' ? "bg-white text-indigo-600 shadow-sm" : "text-gray-400 hover:text-gray-600"
              )}
            >
              <List className="w-4 h-4" aria-hidden="true" />
              Lead List
            </button>
            <button 
              role="tab"
              aria-selected={view === 'analytics'}
              onClick={() => setView('analytics')}
              className={cn(
                "flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold transition-all outline-none focus-visible:ring-2 focus-visible:ring-indigo-500",
                view === 'analytics' ? "bg-white text-indigo-600 shadow-sm" : "text-gray-400 hover:text-gray-600"
              )}
            >
              <LayoutGrid className="w-4 h-4" aria-hidden="true" />
              Analytics
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 lg:w-80">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" aria-hidden="true" />
              <input 
                type="text"
                placeholder="Search leads, properties, emails..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                aria-label="Search leads"
                className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-transparent rounded-2xl text-sm focus:bg-white focus:border-indigo-600 outline-none transition-all focus-visible:ring-2 focus-visible:ring-indigo-500"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <FilterDropdown 
                label="Status" 
                value={statusFilter} 
                options={['All', 'New', 'Contacted', 'Qualified', 'Closed', 'Archived']} 
                onChange={(val) => setStatusFilter(val as any)}
                icon={Tag}
              />
              <FilterDropdown 
                label="Source" 
                value="All Sources" 
                options={['All Sources', 'Web Form', 'Facebook', 'Instagram', 'WhatsApp']} 
                onChange={() => {}}
                icon={Filter}
              />
              <button 
                className="p-3 bg-gray-50 text-gray-400 hover:text-indigo-600 rounded-2xl transition-colors outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                aria-label="Download leads data"
              >
                <Download className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <AnimatePresence mode="wait">
          {loading ? (
            <div className="grid grid-cols-1 gap-6 bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-xl" aria-hidden="true">
              <div className="space-y-4">
                <Skeleton className="h-12 w-full rounded-xl" />
                <Skeleton className="h-12 w-full rounded-xl" />
                <Skeleton className="h-12 w-full rounded-xl" />
                <Skeleton className="h-12 w-full rounded-xl" />
                <Skeleton className="h-12 w-full rounded-xl" />
              </div>
            </div>
          ) : view === 'list' ? (
            <motion.div
              key="list"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white rounded-[2.5rem] border border-gray-100 shadow-xl shadow-gray-200/20 overflow-hidden"
            >
              <LeadsTable 
                leads={filteredLeads}
                agents={agents}
                properties={properties}
                onLeadClick={handleLeadClick}
                onUpdateLead={handleUpdateLead}
              />
            </motion.div>
          ) : (
            <motion.div
              key="analytics"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <AnalyticsPanel 
                leadsData={analyticsData.stats}
                platformData={analyticsData.platformData}
                agentLoadData={analyticsData.agentLoadData}
                funnelData={analyticsData.funnelData}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Lead Detail Side Pane */}
      <AnimatePresence>
        {selectedLead && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedLead(null)}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
            />
            <LeadDetailPane 
              lead={selectedLead}
              agents={agents}
              properties={properties}
              onClose={() => setSelectedLead(null)}
              onUpdateStatus={(status) => handleUpdateLead(selectedLead.id, { status })}
              onAddNote={(content) => handleAddNote(selectedLead.id, content)}
              onAddTask={(task) => handleAddTask(selectedLead.id, task)}
              onToggleTask={(taskId, completed) => handleToggleTask(selectedLead.id, taskId, completed)}
            />
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function FilterDropdown({ label, value, options, onChange, icon: Icon }: { 
  label: string, 
  value: string, 
  options: string[], 
  onChange: (val: string) => void,
  icon: any
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label={`Filter by ${label}: ${value}`}
        className="flex items-center gap-2 px-4 py-3 bg-gray-50 text-gray-600 rounded-2xl text-xs font-bold hover:bg-gray-100 transition-all border border-transparent focus:border-indigo-200 outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
      >
        <Icon className="w-4 h-4 text-gray-400" aria-hidden="true" />
        <span className="text-gray-400 font-medium">{label}:</span>
        {value}
        <ChevronDown className={cn("w-4 h-4 text-gray-400 transition-transform", isOpen && "rotate-180")} aria-hidden="true" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute top-full mt-2 right-0 w-48 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden p-2"
            role="listbox"
          >
            {options.map(opt => (
              <button
                key={opt}
                role="option"
                aria-selected={value === opt}
                onClick={() => {
                  onChange(opt);
                  setIsOpen(false);
                }}
                className={cn(
                  "w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold transition-all outline-none focus-visible:bg-indigo-50 focus-visible:text-indigo-600",
                  value === opt ? "bg-indigo-50 text-indigo-600" : "text-gray-500 hover:bg-gray-50"
                )}
              >
                {opt}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
