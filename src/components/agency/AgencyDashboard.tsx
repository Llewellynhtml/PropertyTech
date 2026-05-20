import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Home, 
  Target, 
  TrendingUp, 
  Activity, 
  Briefcase,
  ArrowUpRight,
  Plus,
  UserPlus
} from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
  { name: 'Mon', leads: 40, posts: 24 },
  { name: 'Tue', leads: 30, posts: 13 },
  { name: 'Wed', leads: 20, posts: 98 },
  { name: 'Thu', leads: 27, posts: 39 },
  { name: 'Fri', leads: 18, posts: 48 },
  { name: 'Sat', leads: 23, posts: 38 },
  { name: 'Sun', leads: 34, posts: 43 },
];

export default function AgencyDashboard({ onAddProperty, refreshTrigger }: any) {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    agents: 0,
    properties: 0,
    leads: 0,
    activeCampaigns: 0
  });

  useEffect(() => {
    fetchAgencyStats();
  }, []);

  const fetchAgencyStats = async () => {
    try {
      const [agentsRes, propsRes, leadsRes] = await Promise.all([
        supabase.from('agents').select('id', { count: 'exact' }),
        supabase.from('properties').select('id', { count: 'exact' }),
        supabase.from('leads').select('id', { count: 'exact' })
      ]);

      setStats({
        agents: agentsRes.count || 0,
        properties: propsRes.count || 0,
        leads: leadsRes.count || 0,
        activeCampaigns: 12 // Mocked for now
      });
    } catch (error) {
      console.error('Error fetching agency stats:', error);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight">Agency Overview</h1>
          <p className="text-gray-500 font-medium mt-1">Managing {stats.agents} agents and {stats.properties} active listings</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-100 text-gray-900 rounded-2xl font-bold text-sm shadow-sm hover:bg-gray-50 transition-all">
            <UserPlus className="w-5 h-5" />
            Invite Agent
          </button>
          <button className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold text-sm shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all">
            <Plus className="w-5 h-5" />
            New Campaign
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Agents', value: stats.agents, icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: 'Listed Props', value: stats.properties, icon: Home, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Network Leads', value: stats.leads, icon: Target, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Growth', value: '+12%', icon: TrendingUp, color: 'text-orange-600', bg: 'bg-orange-50' }
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm"
          >
            <div className={`w-12 h-12 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center mb-4`}>
              <stat.icon className="w-6 h-6" />
            </div>
            <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">{stat.label}</p>
            <p className="text-2xl font-black text-gray-900">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-bold text-gray-900">Performance Over Time</h2>
            <div className="flex gap-2">
              <span className="flex items-center gap-2 text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-full">
                <div className="w-2 h-2 rounded-full bg-indigo-600" /> Leads
              </span>
              <span className="flex items-center gap-2 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full">
                <div className="w-2 h-2 rounded-full bg-emerald-600" /> Posts
              </span>
            </div>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fontWeight: 700, fill: '#9ca3af' }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fontWeight: 700, fill: '#9ca3af' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '20px', 
                    border: 'none', 
                    boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
                    fontWeight: 900,
                    textTransform: 'uppercase',
                    fontSize: '10px'
                  }}
                />
                <Area type="monotone" dataKey="leads" stroke="#4f46e5" strokeWidth={4} fillOpacity={1} fill="url(#colorLeads)" />
                <Area type="monotone" dataKey="posts" stroke="#10b981" strokeWidth={4} fillOpacity={0} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Top Performing Agents</h2>
          <div className="space-y-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center justify-between group cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center font-bold text-gray-400 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                    {String.fromCharCode(64 + i)}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors uppercase tracking-tight text-sm">Agent Name {i}</p>
                    <p className="text-xs text-gray-400 font-medium">{10 + i * 5} Active Listings</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-black text-gray-900">R {2.5 + i}M</p>
                  <p className="text-[10px] font-black text-emerald-600 text-right">VOLUME</p>
                </div>
              </div>
            ))}
          </div>
          <button className="w-full mt-10 py-4 bg-gray-50 text-gray-400 font-black text-[10px] uppercase tracking-widest rounded-2xl hover:bg-gray-100 hover:text-gray-600 transition-all">
            See All Agent Stats
          </button>
        </div>
      </div>
    </div>
  );
}
