import React, { useState } from 'react';
import { Mail, Lock, AlertCircle, Loader2, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'sonner';
import { cn } from '../../lib/utils';

interface AgentSignInProps {
  onToggle: () => void;
}

export default function AgentSignIn({ onToggle }: AgentSignInProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [isForgotLoading, setIsForgotLoading] = useState(false);
  const [showResend, setShowResend] = useState(false);
  const { signIn, resendVerification, resetPassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setShowResend(false);
    try {
      await signIn(email, password);
      toast.success('Welcome back!');
    } catch (error: any) {
      const message = error.message || 'Failed to sign in';
      toast.error(message);
      
      if (message.toLowerCase().includes('email not confirmed') || error.status === 400) {
        setShowResend(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) {
      toast.error('Please enter your email address first');
      return;
    }
    setIsResending(true);
    try {
      await resendVerification(email);
      toast.success('Verification email resent! Please check your inbox.');
      setShowResend(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to resend verification email');
    } finally {
      setIsResending(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      toast.error('Enter your email address above first');
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

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        {showResend && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-amber-50 border border-amber-100 rounded-2xl flex items-start gap-3"
          >
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-2">
              <p className="text-xs font-bold text-amber-900">Email not verified</p>
              <p className="text-xs text-amber-800 leading-relaxed">
                You need to confirm your email before you can sign in.
              </p>
              <button
                type="button"
                onClick={handleResend}
                disabled={isResending}
                className="text-xs font-black text-brand-teal hover:underline flex items-center gap-2"
              >
                {isResending ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Resend verification email'}
              </button>
            </div>
          </motion.div>
        )}

        <div className="space-y-2">
          <label className="text-[10px] font-bold text-brand-muted uppercase tracking-[0.2em] ml-1">Email Address</label>
          <div className="relative group">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-muted group-focus-within:text-brand-teal transition-colors" size={18} />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-12 pr-6 py-4 bg-brand-surface border border-brand-border rounded-2xl text-brand-charcoal focus:ring-4 focus:ring-brand-teal/5 focus:border-brand-teal outline-none transition-all font-medium"
              placeholder="name@company.com"
            />
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

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-xs font-bold text-brand-slate cursor-pointer group">
            <div className="relative flex items-center justify-center">
              <input type="checkbox" className="peer sr-only" />
              <div className="w-5 h-5 border-2 border-brand-border rounded-md bg-brand-surface peer-checked:bg-brand-teal peer-checked:border-brand-teal transition-all" />
              <CheckCircle2 className="absolute w-3 h-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity" />
            </div>
            Remember me
          </label>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-4 bg-brand-charcoal text-white rounded-2xl font-bold shadow-xl hover:bg-black hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 group disabled:opacity-70"
        >
          {isLoading ? (
            <Loader2 className="animate-spin" size={20} />
          ) : (
            <>
              Sign In to Dashboard
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
            Don't have an agent account? <span className="text-brand-teal">Register now</span>
          </button>
        </div>
      </form>
    </div>
  );
}

const CheckCircle2 = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);