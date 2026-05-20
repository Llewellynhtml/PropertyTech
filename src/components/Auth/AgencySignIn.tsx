import React, { useState, useEffect } from 'react';
import { Mail, Lock, Building2, Check, X, Loader2, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'sonner';
import { cn } from '../../lib/utils';

interface AgencySignInProps {
  onToggle: () => void;
}

export default function AgencySignIn({ onToggle }: AgencySignInProps) {
  const [email, setEmail] = useState('');
  const [domain, setDomain] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isForgotLoading, setIsForgotLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [isDomainValid, setIsDomainValid] = useState<boolean | null>(null);
  const { signIn, resetPassword } = useAuth();

  const handleForgotPassword = async () => {
    if (!email) {
      toast.error('Enter your work email above first');
      return;
    }
    setIsForgotLoading(true);
    try {
      await resetPassword(email);
      toast.success('Password reset email sent! Check your inbox.');
    } catch (error: any) {
      toast.error(error.message || 'Failed to send reset email');
    } finally {
      setIsForgotLoading(false);
    }
  };

  // Mock domain validation
  useEffect(() => {
    if (!domain) {
      setIsDomainValid(null);
      return;
    }

    const timer = setTimeout(() => {
      setIsValidating(true);
      // Simulate API call
      setTimeout(() => {
        setIsValidating(false);
        setIsDomainValid(domain.length > 3);
      }, 500);
    }, 300);

    return () => clearTimeout(timer);
  }, [domain]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (domain && !isDomainValid) {
      toast.error('Please enter a valid agency domain');
      return;
    }
    setIsLoading(true);
    try {
      await signIn(email, password);
      toast.success('Welcome back to your workspace!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to sign in');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-brand-muted uppercase tracking-[0.2em] ml-1">Work Email</label>
          <div className="relative group">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-muted group-focus-within:text-brand-teal transition-colors" size={18} />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-12 pr-6 py-4 bg-brand-surface border border-brand-border rounded-2xl text-brand-charcoal focus:ring-4 focus:ring-brand-teal/5 focus:border-brand-teal outline-none transition-all font-medium"
              placeholder="agency@company.com"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-bold text-brand-muted uppercase tracking-[0.2em] ml-1">Agency Domain</label>
          <div className="relative group">
            <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-muted group-focus-within:text-brand-teal transition-colors" size={18} />
            <input
              type="text"
              required
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              className={cn(
                "w-full pl-12 pr-12 py-4 bg-brand-surface border border-brand-border rounded-2xl text-brand-charcoal focus:ring-4 focus:ring-brand-teal/5 focus:border-brand-teal outline-none transition-all font-medium",
                isDomainValid === true && "border-brand-green focus:border-brand-green focus:ring-brand-green/5",
                isDomainValid === false && "border-red-500 focus:border-red-500 focus:ring-red-500/5"
              )}
              placeholder="e.g., acme-realty"
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              {isValidating ? (
                <Loader2 className="w-4 h-4 animate-spin text-brand-muted" />
              ) : isDomainValid === true ? (
                <Check className="w-4 h-4 text-brand-green" strokeWidth={3} />
              ) : isDomainValid === false ? (
                <X className="w-4 h-4 text-red-500" strokeWidth={3} />
              ) : null}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-bold text-brand-muted uppercase tracking-[0.2em] ml-1">Password</label>
            <button type="button" onClick={handleForgotPassword} disabled={isForgotLoading} className="text-[10px] font-bold text-brand-teal hover:underline uppercase tracking-widest disabled:opacity-60">
              {isForgotLoading ? 'Sending...' : 'Forgot password?'}
            </button>
          </div>
          <div className="relative group">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-muted group-focus-within:text-brand-teal transition-colors" size={18} />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-12 pr-6 py-4 bg-brand-surface border border-brand-border rounded-2xl text-brand-charcoal focus:ring-4 focus:ring-brand-teal/5 focus:border-brand-teal outline-none transition-all font-medium"
              placeholder="••••••••"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading || isValidating}
          className="w-full py-4 bg-brand-charcoal text-white rounded-2xl font-bold shadow-xl hover:bg-black hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 group disabled:opacity-70"
        >
          {isLoading ? (
            <Loader2 className="animate-spin" size={20} />
          ) : (
            <>
              Access Workspace
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </>
          )}
        </button>

        <div className="text-center pt-2">
          <button 
            type="button"
            onClick={onToggle}
            className="text-xs font-bold text-brand-muted hover:text-brand-teal transition-colors"
          >
            New agency? <span className="text-brand-teal">Register your business</span>
          </button>
        </div>
      </form>
    </div>
  );
}