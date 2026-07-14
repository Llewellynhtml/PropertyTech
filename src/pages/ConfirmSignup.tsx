import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '../lib/supabaseClient';

export default function ConfirmSignup() {
  const navigate = useNavigate();
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let active = true;

    const finishConfirmation = async () => {
      const hashParams = new URLSearchParams(window.location.hash.slice(1));
      const callbackError = hashParams.get('error_description');
      if (callbackError) {
        if (active) setErrorMessage(callbackError.replace(/\+/g, ' '));
        return;
      }

      const { data, error } = await supabase.auth.getSession();
      if (error) {
        if (active) setErrorMessage(error.message);
        return;
      }

      const role = data.session?.user?.user_metadata?.role as 'agency' | 'agent' | undefined;
      if (role) localStorage.setItem('proppost_auth_role', role);
      localStorage.setItem('proppost_auth_mode', 'signin');

      if (data.session) {
        const { error: signOutError } = await supabase.auth.signOut({ scope: 'local' });
        if (signOutError) {
          if (active) setErrorMessage(signOutError.message);
          return;
        }
      }

      if (!active) return;
      toast.success('Email confirmed! Sign in to access your account.');
      navigate('/login', { replace: true });
    };

    void finishConfirmation();
    return () => { active = false; };
  }, [navigate]);

  if (errorMessage) {
    return (
      <div className="min-h-screen bg-brand-surface flex items-center justify-center p-6">
        <div className="w-full max-w-md rounded-2xl border border-red-100 bg-white p-8 text-center shadow-sm">
          <h1 className="text-xl font-bold text-brand-charcoal">Confirmation link could not be completed</h1>
          <p className="mt-3 text-sm leading-6 text-brand-slate">{errorMessage}</p>
          <button
            type="button"
            onClick={() => navigate('/login', { replace: true })}
            className="mt-6 rounded-xl bg-brand-teal px-5 py-3 text-sm font-bold text-white"
          >
            Return to sign in
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-surface flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-brand-teal border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-bold text-brand-muted uppercase tracking-widest">Confirming your email...</p>
      </div>
    </div>
  );
}
