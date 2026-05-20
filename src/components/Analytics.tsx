import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Target, 
  Users, 
  MousePointer2, 
  ArrowUpRight, 
  ArrowDownRight,
  Filter,
  Download,
  Activity
} from 'lucide-react';
import { motion } from 'motion/react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area 
} from 'recharts';

const data = [
  { name: 'Mon', leads: 40, reach: 2400, clicks: 240 },
  { name: 'Tue', leads: 30, reach: 1398, clicks: 139 },
  { name: 'Wed', leads: 200, reach: 9800, clicks: 980 },
  { name: 'Thu', leads: 278, reach: 3908, clicks: 390 },
  { name: 'Fri', leads: 189, reach: 4800, clicks: 480 },
  { name: 'Sat', leads: 239, reach: 3800, clicks: 380 },
  { name: 'Sun', leads: 349, reach: 4300, clicks: 430 },
];

const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function Analytics() {
  const [period, setPeriod] = useState('Last 7 Days');

  return (
    <div className="space-y-10 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">Analytics</h1>
          <p className="text-gray-500 font-medium mt-1">Deep insights into your marketing performance</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-white p-1.5 rounded-2xl border border-gray-100 shadow-sm">
            {['7D', '30D', '90D', '1Y'].map((p) => (
              <button
                key={p}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  p === '7D' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
          <button className="p-3 bg-white border border-gray-100 rounded-2xl text-gray-400 hover:text-indigo-600 transition-all shadow-sm">
            <Download className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Hero Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Reach', value: '142.8K', trend: '+12.5%', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Engagements', value: '12,402', trend: '+8.2%', icon: MousePointer2, color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: 'Leads Gen', value: '482', trend: '+24.1%', icon: Target, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Conversion', value: '3.8%', trend: '-1.4%', icon: TrendingUp, color: 'text-orange-600', bg: 'bg-orange-50' }
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm relative overflow-hidden"
          >
            <div className={`w-12 h-12 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center mb-6`}>
              <stat.icon className="w-6 h-6" />
            </div>
            <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">{stat.label}</p>
            <div className="flex items-end gap-3">
              <p className="text-3xl font-black text-gray-900">{stat.value}</p>
              <div className={`flex items-center gap-1 text-[10px] font-black pb-1.5 ${stat.trend.startsWith('+') ? 'text-emerald-600' : 'text-rose-600'}`}>
                {stat.trend.startsWith('+') ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {stat.trend}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Growth Chart */}
        <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-bold font-black text-gray-900 uppercase tracking-tight">Growth Trends</h2>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-indigo-600" />
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Reach</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-600" />
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Leads</span>
              </div>
            </div>
          </div>
          <div className="h-96 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorReach" x1="0" y1="0" x2="0" y2="1">
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
                    borderRadius: '24px', 
                    border: 'none', 
                    boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
                    padding: '20px'
                  }}
                />
                <Area type="monotone" dataKey="reach" stroke="#4f46e5" strokeWidth={4} fillOpacity={1} fill="url(#colorReach)" />
                <Area type="monotone" dataKey="leads" stroke="#10b981" strokeWidth={4} fillOpacity={0} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Channel Breakdown */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col">
          <h2 className="text-xl font-bold font-black text-gray-900 uppercase tracking-tight mb-8">Channel Mix</h2>
          <div className="flex-1 min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: 'Instagram', value: 45 },
                    { name: 'Facebook', value: 30 },
                    { name: 'WhatsApp', value: 15 },
                    { name: 'Direct', value: 10 },
                  ]}
                  innerRadius={80}
                  outerRadius={120}
                  paddingAngle={8}
                  dataKey="value"
                  cornerRadius={10}
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-4">
            {[
              { label: 'Instagram', value: '45%', color: 'bg-indigo-600' },
              { label: 'Facebook', value: '30%', color: 'bg-emerald-500' },
              { label: 'WhatsApp', value: '15%', color: 'bg-amber-500' },
              { label: 'Direct', value: '10%', color: 'bg-rose-500' }
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${item.color}`} />
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{item.label}</span>
                <span className="text-[10px] font-black text-gray-900 ml-auto">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
