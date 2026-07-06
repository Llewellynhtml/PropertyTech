import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import AuthHero from '../components/Auth/AuthHero';
import RoleSwitcher from '../components/Auth/RoleSwitcher';
import AgentSignIn from '../components/Auth/AgentSignIn';
import AgencySignIn from '../components/Auth/AgencySignIn';
import AgentSignUp from '../components/Auth/AgentSignUp';
import AgencySignUp from '../components/Auth/AgencySignUp';
import Logo from '../components/shared/Logo';
import { supabase } from '../lib/supabaseClient';

export default function Login() {
  const location = useLocation();
  const [isSignIn, setIsSignIn] = useState(() => {
    if (location.pathname === '/signup') return false;
    if (location.pathname === '/login') return true;
    return localStorage.getItem('proppost_auth_mode') !== 'signup';
  });
  const [activeRole, setActiveRole] = useState<'agent' | 'agency'>(() => {
    return (localStorage.getItem('proppost_auth_role') as 'agent' | 'agency') || 'agent';
  });
  const { session, user } = useAuth();
  const navigate = useNavigate();

  // When the link has ?invite=TOKEN, force the agent signup form regardless of
  // who is currently logged in — the recipient of the invite needs to register.
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('invite')) {
      setIsSignIn(false);
      setActiveRole('agent');
    }
  }, [location.search]);

  useEffect(() => {
    if (!session) return;

    // Never redirect away when an invite token is present — the invitee must
    // complete signup even if another user is already signed in on this device.
    const params = new URLSearchParams(location.search);
    if (params.get('invite')) return;

    // Email confirmation callback: Supabase auto-signs the user in when they
    // click the verification link. Sign them back out so they land on the
    // sign-in form instead of being silently pushed to the dashboard.
    const hashParams = new URLSearchParams(window.location.hash.slice(1));
    if (hashParams.get('type') === 'signup') {
      const role = (session.user?.user_metadata as Record<string, any> | undefined)?.role as 'agency' | 'agent' | undefined;
      supabase.auth.signOut().then(() => {
        window.history.replaceState(null, '', window.location.pathname);
        setIsSignIn(true);
        if (role) setActiveRole(role);
        toast.success('Email confirmed! Sign in to access your account.');
      });
      return;
    }

    if (user) {
      navigate(user.role === 'agency' ? '/agency-dashboard' : '/agent-dashboard');
      return;
    }

    // Session exists but profile fetch returned null. The self-healing in
    // AuthContext should have recovered this. If it didn't, fall back to the
    // role stored in auth metadata so we at least route somewhere sensible.
    const role = (session.user?.user_metadata as Record<string, any> | undefined)?.role;
    if (role === 'agency') {
      navigate('/agency-dashboard');
    } else if (role === 'agent') {
      navigate('/agent-dashboard');
    }
    // Otherwise stay on /login; the console will show why fetchUserProfile failed.
  }, [session, user, navigate, location.search]);

  useEffect(() => {
    localStorage.setItem('proppost_auth_role', activeRole);
  }, [activeRole]);

  useEffect(() => {
    localStorage.setItem('proppost_auth_mode', isSignIn ? 'signin' : 'signup');
  }, [isSignIn]);

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-brand-surface">
      {/* Left Panel - Hero */}
      <AuthHero />

      {/* Right Panel - Form */}
      <div className="flex flex-col items-center justify-center p-6 lg:p-12 overflow-y-auto">
        {/* Mobile Logo Bar */}
        <div className="lg:hidden flex items-center justify-center mb-10 overflow-hidden rounded-3xl shadow-xl border border-white/5 w-full max-w-sm">
          <Logo className="aspect-[1784/968] w-full" variant="light" src="/proppost-logo-mobile.png" />
        </div>

        <div className="w-full max-w-md">
          <div className="flex flex-col items-center mb-8">
            <RoleSwitcher activeRole={activeRole} onRoleChange={setActiveRole} />
            
            <h2 className="text-3xl font-black text-gray-900 tracking-tighter mb-2">
              {isSignIn ? 'Welcome Back' : 'Join PropPost'}
            </h2>
            <p className="text-gray-500 font-medium text-center">
              {isSignIn 
                ? `Sign in to your ${activeRole} workspace` 
                : activeRole === 'agent' 
                  ? 'Join the elite network of SA real estate agents'
                  : 'Register your organisation and start scaling'}
            </p>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={`${activeRole}-${isSignIn}`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {isSignIn ? (
                activeRole === 'agent' ? (
                  <AgentSignIn onToggle={() => setIsSignIn(false)} />
                ) : (
                  <AgencySignIn onToggle={() => setIsSignIn(false)} />
                )
              ) : (
                activeRole === 'agent' ? (
                  <AgentSignUp onToggle={() => setIsSignIn(true)} />
                ) : (
                  <AgencySignUp onToggle={() => setIsSignIn(true)} />
                )
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer */}
        <p className="mt-12 text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">
          &copy; 2026 PropPost Real Estate Network
        </p>
      </div>
    </div>
  );
}
