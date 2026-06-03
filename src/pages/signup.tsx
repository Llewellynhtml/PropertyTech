import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Mail, Lock, User, Building2, KeyRound, Loader2, AlertCircle, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';

export default function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'create' | 'join'>('create');
  const [agencyName, setAgencyName] = useState('');
  const [agencyCode, setAgencyCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { login, user } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (user) navigate('/');
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (mode === 'join' && !agencyCode.trim()) {
      setError('Please enter the agency code to join.');
      return;
    }

    setIsLoading(true);
    try {
      const payload: Record<string, string> = { name, email, password };
      if (mode === 'join') {
        payload.agency_code = agencyCode.trim();
      } else {
        payload.agency_name = agencyName.trim() || `${name}'s Agency`;
      }

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const contentType = response.headers.get('content-type') || '';
      const data = contentType.includes('application/json')
        ? await response.json()
        : { error: `Unexpected server response (${response.status}).` };

      if (!response.ok) {
        throw new Error(data.error || 'Sign up failed');
      }

      // Registration returns a token + user, same shape as login — log straight in.
      login(data.token, data.user);
      navigate('/');
    } catch (err: any) {
      console.error('Signup error:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex font-sans overflow-hidden">
      {/* Left Panel: Branded Content */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#0A0A0B] relative overflow-hidden flex-col justify-between p-16">
        <div className="absolute inset-0">
          <div className="absolute top-[-10%] left-[-10%] w-[70%] h-[70%] bg-brand-teal/20 rounded-full blur-[120px]"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-brand-dark-teal/10 rounded-full blur-[120px]"></div>
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-12">
            <div className="w-12 h-12 bg-brand-teal rounded-2xl flex items-center justify-center font-bold text-2xl shadow-[0_8px_30px_rgba(30,151,171,0.4)]">
              <span className="text-white">G</span>
            </div>
            <span className="text-2xl font-bold text-white tracking-tight">PropPost</span>
          </div>
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
            <h1 className="text-6xl font-bold text-white tracking-tight leading-tight mb-8">
              Create your <br />
              <span className="text-brand-teal">PropPost</span> <br />
              account.
            </h1>
            <p className="text-white/40 text-lg max-w-md leading-relaxed">
              Start a new agency or join your team. Generate branded content, manage listings, and capture leads.
            </p>
          </motion.div>
        </div>
        <div className="relative z-10 text-white/30 text-xs font-bold uppercase tracking-[0.2em]">
          One account, one login.
        </div>
      </div>

      {/* Right Panel: Signup Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-[#F8FAFC]">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 tracking-tight mb-2">Create account</h2>
            <p className="text-gray-400 text-sm font-medium">Set up your login to access the dashboard</p>
          </div>

          {error && (
            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
              className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 text-sm">
              <AlertCircle size={18} />
              <span>{error}</span>
            </motion.div>
          )}

          {/* Mode toggle */}
          <div className="flex gap-2 mb-6 p-1 bg-gray-100 rounded-2xl">
            <button type="button" onClick={() => setMode('create')}
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${mode === 'create' ? 'bg-white text-gray-900 shadow' : 'text-gray-500'}`}>
              Start an agency
            </button>
            <button type="button" onClick={() => setMode('join')}
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${mode === 'join' ? 'bg-white text-gray-900 shadow' : 'text-gray-500'}`}>
              Join an agency
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Full Name</label>
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-brand-teal transition-colors" size={18} />
                <input type="text" required value={name} onChange={(e) => setName(e.target.value)}
                  className="w-full pl-12 pr-6 py-4 bg-white border border-gray-200 rounded-2xl text-gray-900 focus:ring-4 focus:ring-brand-teal/5 focus:border-brand-teal outline-none transition-all"
                  placeholder="Jane Smith" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Email Address</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-brand-teal transition-colors" size={18} />
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-6 py-4 bg-white border border-gray-200 rounded-2xl text-gray-900 focus:ring-4 focus:ring-brand-teal/5 focus:border-brand-teal outline-none transition-all"
                  placeholder="name@company.com" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Password</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-brand-teal transition-colors" size={18} />
                <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-6 py-4 bg-white border border-gray-200 rounded-2xl text-gray-900 focus:ring-4 focus:ring-brand-teal/5 focus:border-brand-teal outline-none transition-all"
                  placeholder="At least 8 characters" />
              </div>
            </div>

            {mode === 'create' ? (
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Agency Name</label>
                <div className="relative group">
                  <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-brand-teal transition-colors" size={18} />
                  <input type="text" value={agencyName} onChange={(e) => setAgencyName(e.target.value)}
                    className="w-full pl-12 pr-6 py-4 bg-white border border-gray-200 rounded-2xl text-gray-900 focus:ring-4 focus:ring-brand-teal/5 focus:border-brand-teal outline-none transition-all"
                    placeholder="Your agency (optional)" />
                </div>
                <p className="text-[11px] text-gray-400 ml-1">You'll be the admin. Share your agency code afterwards so your team can join.</p>
              </div>
            ) : (
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Agency Code</label>
                <div className="relative group">
                  <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-brand-teal transition-colors" size={18} />
                  <input type="text" value={agencyCode} onChange={(e) => setAgencyCode(e.target.value)}
                    className="w-full pl-12 pr-6 py-4 bg-white border border-gray-200 rounded-2xl text-gray-900 focus:ring-4 focus:ring-brand-teal/5 focus:border-brand-teal outline-none transition-all"
                    placeholder="Paste the code from your admin" />
                </div>
                <p className="text-[11px] text-gray-400 ml-1">Ask your agency admin for the code (it's the agency ID).</p>
              </div>
            )}

            <button type="submit" disabled={isLoading}
              className="w-full py-4 bg-gray-900 text-white rounded-2xl font-bold shadow-xl hover:bg-black hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 group disabled:opacity-70">
              {isLoading ? <Loader2 className="animate-spin" size={20} /> : (
                <>Create account<ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" /></>
              )}
            </button>
          </form>

          <p className="text-center mt-8 text-gray-500 text-sm">
            Already have an account?{' '}
            <Link to="/login" className="text-brand-teal font-bold hover:underline">Sign in</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
