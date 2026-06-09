import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Session, User } from '@supabase/supabase-js';
import { UserProfile, UserRole } from '../types';

interface AuthContextType {
  user: UserProfile | null;
  session: Session | null;
  token: string | null;
  isLoading: boolean;
  signIn: (email: string, password?: string) => Promise<any>;
  signOut: () => Promise<void>;
  signUp: (email: string, role: UserRole, metadata: any) => Promise<any>;
  resetPassword: (email: string) => Promise<any>;
  resendVerification: (email: string) => Promise<any>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUserProfile = async (userId: string, sessionUser?: User | null): Promise<UserProfile | null> => {
    try {
      // Query both tables in parallel — cuts initial load time in half vs
      // sequential awaits.
      const [
        { data: agencyData, error: agencyErr },
        { data: agentData,  error: agentErr  },
      ] = await Promise.all([
        supabase.from('agencies').select('id, agency_name, email').eq('id', userId).maybeSingle(),
        supabase.from('agents').select('id, full_name, email, agency_id').eq('id', userId).maybeSingle(),
      ]);

      if (agencyErr) console.error('[Auth] agencies lookup failed:', agencyErr);
      if (agentErr)  console.error('[Auth] agents lookup failed:',  agentErr);

      if (agencyData) {
        return {
          id: agencyData.id,
          name: agencyData.agency_name,
          email: agencyData.email,
          role: 'agency' as UserRole,
          agency_name: agencyData.agency_name,
          agency_id: agencyData.id,
        };
      }

      if (agentData) {
        return {
          id: agentData.id,
          name: agentData.full_name,
          email: agentData.email,
          role: 'agent' as UserRole,
          agency_id: agentData.agency_id,
        };
      }

      // Self-healing path:
      // Session exists but no profile row in either table. This happens when
      // the handle_new_user trigger silently failed during signup (its
      // EXCEPTION block swallows errors so it doesn't block auth). We
      // reconstruct the profile from the metadata stored on auth.users.
      const meta = sessionUser?.user_metadata as Record<string, any> | undefined;
      const role = meta?.role as UserRole | undefined;

      if (role === 'agent' && sessionUser) {
        console.warn('[Auth] No agents row found for verified user, self-healing from metadata');
        const { error: insertErr } = await supabase.from('agents').insert({
          id: sessionUser.id,
          full_name: meta?.fullName || meta?.name || meta?.full_name || 'Agent',
          email: sessionUser.email,
          cellphone: meta?.cellphone,
          whatsapp_number: meta?.whatsapp_number || meta?.whatsappNumber,
          job_title: meta?.job_title || meta?.jobTitle,
          ppra_number: meta?.ppra_number || meta?.ppraNumber,
          bio: meta?.bio,
          specialisation: meta?.specialisation,
          areas: meta?.areas || [],
          instagram_url: meta?.instagram_url || meta?.instagramUrl,
          agency_id: meta?.agency_id || meta?.agencyId || null,
          status: meta?.status || 'active',
        });
        if (insertErr) {
          // DB insert failed (e.g. RLS not yet set up, column mismatch) but the
          // user IS authenticated — return a profile from metadata so they can
          // reach the dashboard. The DB record will be created on next sign-in
          // once the underlying issue is resolved.
          console.error('[Auth] Self-heal insert (agents) failed, falling back to metadata profile:', insertErr);
        }
        return {
          id: sessionUser.id,
          name: meta?.fullName || meta?.name || sessionUser.email || 'Agent',
          email: sessionUser.email || '',
          role: 'agent' as UserRole,
          agency_id: meta?.agency_id || meta?.agencyId || undefined,
        };
      }

      if (role === 'agency' && sessionUser) {
        console.warn('[Auth] No agencies row found for verified user, self-healing from metadata');
        const joinCode = meta?.joinCode || meta?.join_code ||
          Math.random().toString(36).substring(2, 8).toUpperCase();
        const { error: insertErr } = await supabase.from('agencies').insert({
          id: sessionUser.id,
          agency_name: meta?.agencyName || meta?.agency_name || 'New Agency',
          email: sessionUser.email,
          join_code: joinCode,
          plan: meta?.plan || 'free',
        });
        if (insertErr) {
          console.error('[Auth] Self-heal insert (agencies) failed, falling back to metadata profile:', insertErr);
        }
        return {
          id: sessionUser.id,
          name: meta?.agencyName || meta?.agency_name || 'New Agency',
          email: sessionUser.email || '',
          role: 'agency' as UserRole,
          agency_name: meta?.agencyName || meta?.agency_name,
          agency_id: sessionUser.id,
        };
      }

      console.warn('[Auth] No profile found and no role in metadata. User cannot be routed.', {
        userId,
        hasMeta: !!meta,
        role,
      });
      return null;
    } catch (error) {
      console.error('[Auth] fetchUserProfile threw unexpectedly:', error);
      return null;
    }
  };

  useEffect(() => {
    // Fast path: if there is no cached session, clear loading immediately so
    // the login page renders without waiting for onAuthStateChange to fire.
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) setIsLoading(false);
    });

    // onAuthStateChange handles all subsequent events (INITIAL_SESSION,
    // SIGNED_IN, SIGNED_OUT, TOKEN_REFRESHED, EMAIL_CONFIRMED) and is the
    // single place that runs fetchUserProfile.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setToken(session?.access_token || null);
      if (session?.user) {
        const profile = await fetchUserProfile(session.user.id, session.user);
        setUser(profile);
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password?: string) => {
    if (password) {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      return data;
    }
    const { data, error } = await supabase.auth.signInWithOtp({ email });
    if (error) throw error;
    return data;
  };

  const signUp = async (email: string, role: UserRole, metadata: any) => {
    // Ensure metadata includes the role for the trigger
    // Also ensure numeric fields are correctly typed and handle potential nulls
    const signUpData: any = {
      role,
      ...metadata,
      // Map common field names to ensure trigger picks them up regardless of form field names
      fullName: metadata.fullName || metadata.name || metadata.full_name,
      agencyName: metadata.agencyName || metadata.agency_name,
    };

    // For agencies, ensure a join code exists if not provided
    if (role === 'agency' && !signUpData.join_code && !signUpData.joinCode) {
      signUpData.join_code = Math.random().toString(36).substring(2, 8).toUpperCase();
      signUpData.joinCode = signUpData.join_code;
    }

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password: metadata.password || 'temporary-password',
      options: {
        data: signUpData,
        // After clicking the verification link, redirect back to /login so
        // the Login page's session-watcher can route them to the dashboard.
        emailRedirectTo: `${window.location.origin}/login`,
      }
    });

    if (signUpError) {
      console.error('Supabase Auth SignUp detailed error:', signUpError);
      const errorMsg = signUpError.message.toLowerCase();

      if (errorMsg.includes('user already registered') || errorMsg.includes('email already in use')) {
        throw new Error('This email is already registered. If you forgot your password, please use the reset option or try signing in.');
      }

      if (errorMsg.includes('rate limit') || errorMsg.includes('over email send rate limit')) {
        throw new Error('Too many sign-up attempts. Please wait a few minutes and try again, or use a different email address.');
      }

      if (errorMsg.includes('database') || errorMsg.includes('server')) {
        throw new Error('There was a database error while creating your profile. This often happens if the email is already in use or if the system is busy. Please try again or contact support.');
      }

      throw signUpError;
    }

    if (data.user) {
      try {
        // We still try to insert client-side as a fallback,
        // but we ignore "already exists" errors because the trigger might have done it already.
        if (role === 'agency') {
          const { error: insertError } = await supabase.from('agencies').insert({
            id: data.user.id,
            agency_name: signUpData.agency_name || signUpData.agencyName || 'New Agency',
            email: email,
            join_code: signUpData.join_code || signUpData.joinCode,
            trading_name: signUpData.trading_name || signUpData.tradingName,
            office_number: signUpData.office_number || signUpData.officeNumber,
            province: signUpData.province,
            city: signUpData.city,
            address: signUpData.address,
            website_url: signUpData.website || signUpData.website_url,
            agent_count_range: signUpData.agent_count || signUpData.agentCountRange,
            plan: signUpData.plan || 'free',
            plan_agent_limit: signUpData.plan_agent_limit,
            plan_post_limit: signUpData.plan_post_limit,
            plan_platform_limit: signUpData.plan_platform_limit,
            trial_ends_at: signUpData.trial_ends_at
          });

          if (insertError) {
            const errLower = insertError.message.toLowerCase();
            if (!errLower.includes('unique') && !errLower.includes('already exists') && !errLower.includes('duplicate')) {
              console.warn('Non-fatal agency insert error (trigger may have handled it):', insertError);
            }
          }
        } else if (role === 'agent') {
          const { error: insertError } = await supabase.from('agents').insert({
            id: data.user.id,
            full_name: signUpData.name || signUpData.fullName || signUpData.full_name || 'New Agent',
            email: email,
            cellphone: signUpData.cellphone,
            whatsapp_number: signUpData.whatsapp_number || signUpData.whatsappNumber,
            job_title: signUpData.job_title || signUpData.jobTitle,
            ppra_number: signUpData.ppra_number || signUpData.ppraNumber,
            bio: signUpData.bio,
            specialisation: signUpData.specialisation,
            areas: signUpData.areas || [],
            instagram_url: signUpData.instagram_url || signUpData.instagramUrl,
            agency_id: signUpData.agency_id || signUpData.agencyId,
            status: signUpData.status || 'active'
          });

          if (insertError) {
            const errLower = insertError.message.toLowerCase();
            if (!errLower.includes('unique') && !errLower.includes('already exists') && !errLower.includes('duplicate')) {
              console.warn('Non-fatal agent insert error (trigger may have handled it):', insertError);
            }
          }
        }
      } catch (dbError) {
        // Log but don't fail, as the Auth part succeeded and trigger likely worked
        console.warn('Background database insert failed, trigger may handle it:', dbError);
      }
    }

    return data;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const resetPassword = async (email: string) => {
    return supabase.auth.resetPasswordForEmail(email);
  };

  const resendVerification = async (email: string) => {
    return supabase.auth.resend({ email, type: 'signup' });
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      token,
      isLoading,
      signIn,
      signOut,
      signUp,
      resetPassword,
      resendVerification
    }}>
      {children}
    </AuthContext.Provider>
  );
};


export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
