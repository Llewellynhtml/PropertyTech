import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  Instagram, 
  Facebook, 
  Twitter, 
  MoreVertical,
  CheckCircle2,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function ScheduledPosts() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('scheduled_posts')
        .select(`
          *,
          property:properties(title, image_urls)
        `)
        .order('scheduled_at', { ascending: true });
      
      if (data) setPosts(data);
    } catch (error) {
      console.error('Error fetching scheduled posts:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-4xl font-black text-gray-900 tracking-tight">Queue</h1>
        <p className="text-gray-500 font-medium mt-1">Manage your upcoming social media content</p>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 bg-gray-100 rounded-[2rem] animate-pulse" />
          ))}
        </div>
      ) : posts.length > 0 ? (
        <div className="space-y-6">
          {posts.map((post) => (
            <div key={post.id} className="group bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-500 flex items-center gap-6">
              <div className="relative w-24 h-24 rounded-2xl overflow-hidden flex-shrink-0">
                <img 
                  src={post.property?.image_urls?.[0] || 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&q=80&w=200'} 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors" />
                <div className="absolute top-1 right-1 p-1 bg-white/90 backdrop-blur-md rounded-lg scale-75">
                  {post.platform === 'Instagram' ? <Instagram className="w-4 h-4 text-pink-600" /> : <Facebook className="w-4 h-4 text-blue-600" />}
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <span className={cn(
                    "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest",
                    post.status === 'scheduled' ? "bg-indigo-50 text-indigo-600" : "bg-emerald-50 text-emerald-600"
                  )}>
                    {post.status}
                  </span>
                  <div className="flex items-center gap-1 text-gray-400">
                    <Calendar className="w-3 h-3" />
                    <span className="text-[10px] font-bold">{new Date(post.scheduled_at).toLocaleDateString()}</span>
                  </div>
                </div>
                <h3 className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors truncate">{post.property?.title}</h3>
                <p className="text-xs text-gray-500 mt-1 line-clamp-1 italic text-serif">"{post.caption}"</p>
              </div>

              <div className="flex items-center gap-2">
                <button className="p-3 bg-gray-50 text-gray-400 rounded-xl hover:bg-gray-100 hover:text-gray-600 transition-all">
                  <MoreVertical className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-[3rem] py-32 flex flex-col items-center justify-center text-center border border-dashed border-gray-200">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
            <Clock className="w-8 h-8 text-gray-300" />
          </div>
          <h3 className="text-2xl font-black text-gray-900 mb-2">Queue is empty</h3>
          <p className="text-gray-500 font-medium max-w-sm mx-auto mb-8">You haven't scheduled any posts yet. Start by using the Post Builder!</p>
          <button 
            className="px-10 py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all"
          >
            Go to Post Builder
          </button>
        </div>
      )}
    </div>
  );
}
