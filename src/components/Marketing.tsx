import React, { useState, useEffect } from 'react';
import { 
  PlusSquare, 
  Sparkles, 
  Instagram, 
  Facebook, 
  Twitter, 
  Send,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Calendar
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { Property, Agent } from '../types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function Marketing({ initialPlatformId, initialFormatId, initialDesignId }: any) {
  const { user } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [platform, setPlatform] = useState(initialPlatformId || 'Instagram');
  const [tone, setTone] = useState('Professional & Exciting');
  const [generatedPost, setGeneratedPost] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [step, setStep] = useState(1);
  const [isScheduling, setIsScheduling] = useState(false);
  const [scheduledDate, setScheduledDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    try {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .order('created_at', { ascending: false });
      if (data) setProperties(data);
    } catch (error) {
      console.error('Error fetching properties:', error);
    }
  };

  const handleGenerate = async () => {
    if (!selectedProperty) return;
    setIsGenerating(true);
    try {
      const response = await fetch('/api/generate-post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          property: selectedProperty,
          agent: { full_name: user?.name, email: user?.email },
          platform,
          tone
        })
      });
      const data = await response.json();
      setGeneratedPost(data);
      setStep(3);
    } catch (error) {
      console.error('Generation failed:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSchedule = async () => {
    setIsScheduling(true);
    try {
      const { error } = await supabase.from('scheduled_posts').insert({
        property_id: selectedProperty?.id,
        agent_id: user?.role === 'agent' ? user.id : null,
        agency_id: selectedProperty?.agency_id || user?.agency_id || (user?.role === 'agency' ? user.id : null),
        property_title: selectedProperty?.title,
        agent_name: user?.name,
        platform,
        platforms: [platform],
        caption: generatedPost.body,
        scheduled_at: scheduledDate,
        status: 'scheduled'
      });
      if (error) throw error;
      setStep(4);
    } catch (error) {
      console.error('Scheduling failed:', error);
    } finally {
      setIsScheduling(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">Post Builder</h1>
          <p className="text-gray-500 font-medium mt-1">Create stunning social media content in seconds</p>
        </div>
        <div className="flex items-center gap-2">
          {[1, 2, 3, 4].map((s) => (
            <div 
              key={s} 
              className={cn(
                "h-1.5 rounded-full transition-all duration-500",
                step >= s ? "w-8 bg-indigo-600" : "w-4 bg-gray-200"
              )}
            />
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div 
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-xl shadow-indigo-500/5">
              <h2 className="text-xl font-bold mb-6">1. Select a Property</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {properties.map(p => (
                  <button
                    key={p.id}
                    onClick={() => setSelectedProperty(p)}
                    className={cn(
                      "text-left group relative rounded-[2rem] overflow-hidden border-2 transition-all duration-300",
                      selectedProperty?.id === p.id 
                        ? "border-indigo-600 ring-4 ring-indigo-50 shadow-xl" 
                        : "border-gray-100 hover:border-indigo-200"
                    )}
                  >
                    <div className="aspect-[4/3] overflow-hidden">
                      <img 
                        src={p.image_urls?.[0] || 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&q=80&w=800'} 
                        alt={p.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors truncate">{p.title}</h3>
                      <p className="text-xs text-gray-500 mt-1">{p.area}, {p.city}</p>
                    </div>
                    {selectedProperty?.id === p.id && (
                      <div className="absolute top-4 right-4 bg-indigo-600 text-white p-1.5 rounded-full shadow-lg">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="flex justify-end">
              <button 
                disabled={!selectedProperty}
                onClick={() => setStep(2)}
                className="px-10 py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                Next Step
              </button>
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div 
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-xl shadow-indigo-500/5 space-y-8">
              <div>
                <h2 className="text-xl font-bold mb-6">2. Configure Post Details</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Platform</label>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { id: 'Instagram', icon: Instagram },
                        { id: 'Facebook', icon: Facebook },
                        { id: 'Twitter', icon: Twitter }
                      ].map(p => (
                        <button
                          key={p.id}
                          onClick={() => setPlatform(p.id)}
                          className={cn(
                            "flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all",
                            platform === p.id 
                              ? "border-indigo-600 bg-indigo-50 text-indigo-600 shadow-md" 
                              : "border-gray-50 hover:border-gray-200 text-gray-400"
                          )}
                        >
                          <p.icon className="w-6 h-6" />
                          <span className="text-[10px] font-black uppercase tracking-wider">{p.id}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Tone of Voice</label>
                    <select 
                      value={tone}
                      onChange={(e) => setTone(e.target.value)}
                      className="w-full p-4 bg-gray-50 border-none rounded-2xl font-bold text-gray-700 focus:ring-2 focus:ring-indigo-500"
                    >
                      <option>Professional & Exciting</option>
                      <option>Casual & Friendly</option>
                      <option>Luxury & Minimal</option>
                      <option>Urgent & Direct</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-indigo-50/50 rounded-3xl border border-indigo-100 flex items-start gap-4">
                <div className="bg-indigo-600 p-2 rounded-xl text-white">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-indigo-900">AI Magic is Ready</h4>
                  <p className="text-sm text-indigo-600 mt-1 font-medium">Gemini will generate a caption optimized for {platform} using your property's best features.</p>
                </div>
              </div>
            </div>
            
            <div className="flex justify-between">
              <button 
                onClick={() => setStep(1)}
                className="px-8 py-4 text-gray-400 font-bold hover:text-gray-600 transition-colors"
              >
                Back
              </button>
              <button 
                onClick={handleGenerate}
                disabled={isGenerating}
                className="px-10 py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center gap-3"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Generate Content
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div 
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-xl shadow-indigo-500/5 space-y-6">
                <h2 className="text-xl font-bold mb-4">Edit Your Post</h2>
                <div className="space-y-4">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Headline</label>
                  <input 
                    type="text" 
                    value={generatedPost?.headline}
                    onChange={(e) => setGeneratedPost({ ...generatedPost, headline: e.target.value })}
                    className="w-full p-4 bg-gray-50 border-none rounded-2xl font-bold text-gray-700 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="space-y-4">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Body Text</label>
                  <textarea 
                    rows={6}
                    value={generatedPost?.body}
                    onChange={(e) => setGeneratedPost({ ...generatedPost, body: e.target.value })}
                    className="w-full p-4 bg-gray-50 border-none rounded-2xl font-bold text-gray-700 focus:ring-2 focus:ring-indigo-500 resize-none"
                  />
                </div>
                <div className="space-y-4">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Schedule For</label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input 
                      type="date"
                      value={scheduledDate}
                      onChange={(e) => setScheduledDate(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 bg-gray-50 border-none rounded-2xl font-bold text-gray-700 focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest">Preview</h2>
                <div className="bg-[#f0f2f5] p-8 rounded-[2.5rem] flex justify-center">
                  <div className="bg-white w-full max-w-[340px] rounded-[1.5rem] shadow-2xl overflow-hidden border border-gray-100">
                    <div className="p-3 flex items-center justify-between border-b border-gray-50">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-yellow-400 to-purple-600 p-[2px]">
                          <div className="w-full h-full rounded-full bg-white p-[1.5px]">
                            <div className="w-full h-full rounded-full bg-indigo-100 flex items-center justify-center">
                              <span className="text-[10px] font-black text-indigo-600">PP</span>
                            </div>
                          </div>
                        </div>
                        <p className="text-xs font-bold text-gray-900 truncate max-w-[120px]">{user?.name || "PropPost Agent"}</p>
                      </div>
                      <div className={cn(
                        "p-1.5 rounded-full",
                        platform === 'Instagram' ? "text-pink-600" : platform === 'Facebook' ? "text-blue-600" : "text-sky-500"
                      )}>
                        {platform === 'Instagram' ? <Instagram className="w-4 h-4" /> : platform === 'Facebook' ? <Facebook className="w-4 h-4" /> : <Twitter className="w-4 h-4" />}
                      </div>
                    </div>
                    <div className="aspect-square bg-gray-100 overflow-hidden">
                      <img 
                        src={selectedProperty?.image_urls?.[0] || 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&q=80&w=800'} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-4 space-y-2">
                      <p className="text-xs font-black text-gray-900 uppercase tracking-widest">{generatedPost?.headline}</p>
                      <p className="text-[11px] text-gray-600 leading-relaxed line-clamp-4">{generatedPost?.body}</p>
                      <p className="text-[10px] font-bold text-indigo-600 italic">
                        {generatedPost?.hashtags?.map((t: string) => `#${t}`).join(' ')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-between">
              <button 
                onClick={() => setStep(2)}
                className="px-8 py-4 text-gray-400 font-bold hover:text-gray-600 transition-colors"
              >
                Back
              </button>
              <button 
                onClick={handleSchedule}
                disabled={isScheduling}
                className="px-10 py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center gap-3"
              >
                {isScheduling ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                Schedule Post
              </button>
            </div>
          </motion.div>
        )}

        {step === 4 && (
          <motion.div 
            key="step4"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-20 text-center"
          >
            <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-8 animate-bounce">
              <CheckCircle2 className="w-12 h-12" />
            </div>
            <h2 className="text-3xl font-black text-gray-900 mb-2">Successfully Scheduled!</h2>
            <p className="text-gray-500 max-w-md mx-auto mb-8 font-medium">Your post has been queued and will be published on {platform} as scheduled.</p>
            <div className="flex gap-4">
              <button 
                onClick={() => {
                  setStep(1);
                  setSelectedProperty(null);
                  setGeneratedPost(null);
                }}
                className="px-8 py-4 bg-gray-100 text-gray-900 rounded-2xl font-bold text-sm hover:bg-gray-200 transition-all"
              >
                Create Another
              </button>
              <button 
                className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all"
              >
                View Schedule
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
