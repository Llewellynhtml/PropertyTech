import React, { useState, useEffect } from 'react';
import { 
  Home, 
  Target, 
  PlusSquare, 
  Sparkles, 
  TrendingUp, 
  Users, 
  FileText, 
  ArrowRight,
  Plus
} from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import { Property, Lead, Schedule } from '../../types';

export default function AgentDashboard({ onAddProperty, refreshTrigger }: any) {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    properties: 0,
    leads: 0,
    posts: 0
  });
  const [recentLeads, setRecentLeads] = useState<Lead[]>([]);
  const [recentSchedules, setRecentSchedules] = useState<Schedule[]>([]);

  useEffect(() => {
    fetchStats();
  }, [refreshTrigger]);

  const fetchStats = async () => {
    try {
      const [propsRes, leadsRes, schedulesRes] = await Promise.all([
        supabase.from('properties').select('id', { count: 'exact' }),
        supabase.from('leads').select('*').order('created_at', { ascending: false }).limit(5),
        supabase.from('scheduled_posts').select('*').order('scheduled_at', { ascending: true }).limit(5)
      ]);

      setStats({
        properties: propsRes.count || 0,
        leads: leadsRes.count || 0,
        posts: schedulesRes.count || 0
      });

      if (leadsRes.data) setRecentLeads(leadsRes.data as any);
      if (schedulesRes.data) setRecentSchedules(schedulesRes.data as any);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight">
            Welcome back, <span className="text-indigo-600">{user?.name}</span>
          </h1>
          <p className="text-gray-500 font-medium mt-1">Here's what's happening with your listings today</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={onAddProperty}
            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold text-sm shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all"
          >
            <Plus className="w-5 h-5" />
            Add Property
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Active Listings', value: stats.properties, icon: Home, color: 'bg-blue-50 text-blue-600' },
          { label: 'Total Leads', value: stats.leads, icon: Target, color: 'bg-emerald-50 text-emerald-600' },
          { label: 'Scheduled Posts', value: stats.posts, icon: PlusSquare, color: 'bg-purple-50 text-purple-600' }
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm flex items-center gap-6"
          >
            <div className={`p-4 rounded-2xl ${stat.color}`}>
              <stat.icon className="w-8 h-8" />
            </div>
            <div>
              <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">{stat.label}</p>
              <p className="text-3xl font-black text-gray-900">{stat.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Leads */}
        <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-8 border-b border-gray-50 flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Recent Leads</h2>
            <button className="text-indigo-600 font-bold text-xs flex items-center gap-1 hover:gap-2 transition-all">
              View All <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <div className="p-2">
            {recentLeads.length > 0 ? (
              <div className="space-y-1">
                {recentLeads.map((lead) => (
                  <div key={lead.id} className="p-4 flex items-center justify-between hover:bg-gray-50 rounded-2xl transition-colors cursor-pointer group">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center font-bold text-gray-400">
                        {lead.contact_name?.[0] || 'L'}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors uppercase tracking-tight text-sm">{lead.contact_name}</p>
                        <p className="text-xs text-gray-500 font-medium">{lead.contact_email}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest">
                        {lead.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-20 text-center">
                <Target className="w-12 h-12 text-gray-100 mx-auto mb-4" />
                <p className="text-sm text-gray-400 font-medium">No recent leads found</p>
              </div>
            )}
          </div>
        </div>

        {/* Action Center */}
        <div className="grid grid-cols-1 gap-6">
          <div className="bg-indigo-600 p-8 rounded-[2.5rem] shadow-xl shadow-indigo-100 text-white overflow-hidden relative group">
            <Sparkles className="absolute -right-8 -top-8 w-40 h-40 text-white/10 rotate-12 group-hover:rotate-45 transition-transform duration-700" />
            <div className="relative z-10">
              <h3 className="text-2xl font-black mb-2">Create New Post</h3>
              <p className="text-indigo-100 mb-6 font-medium">Use AI to generate and schedule social media content for your properties.</p>
              <button className="px-6 py-3 bg-white text-indigo-600 rounded-xl font-black text-sm shadow-lg hover:shadow-xl transition-all">
                Launch Builder
              </button>
            </div>
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Upcoming Schedule</h2>
            <div className="space-y-4">
              {recentSchedules.length > 0 ? (
                recentSchedules.map((post) => (
                  <div key={post.id} className="flex items-center gap-4 p-4 border border-gray-50 rounded-2xl hover:border-indigo-100 transition-all">
                    <div className="w-2 h-10 bg-indigo-600 rounded-full" />
                    <div className="flex-1">
                      <p className="font-bold text-gray-900 text-sm line-clamp-1">{post.caption}</p>
                      <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-1">
                        {post.platforms?.[0] || 'Social'} • {new Date(post.scheduled_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-10 grayscale opacity-30">
                  <PlusSquare className="w-10 h-10 mx-auto mb-3" />
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">No posts scheduled</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
