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

  const fetchUserProfile = async (userId: string) => {
    try {
      // Check agencies first
      const { data: agencyData } = await supabase
        .from('agencies')
        .select('*')
        .eq('id', userId)
        .single();

      if (agencyData) {
        return {
          id: agencyData.id,
          name: agencyData.agency_name,
          email: agencyData.email,
          role: 'agency' as UserRole,
          agency_name: agencyData.agency_name,
          agency_id: agencyData.id
        };
      }

      // Then check agents
      const { data: agentData } = await supabase
        .from('agents')
        .select('*')
        .eq('id', userId)
        .single();

      if (agentData) {
        return {
          id: agentData.id,
          name: agentData.full_name,
          email: agentData.email,
          role: 'agent' as UserRole,
          agency_id: agentData.agency_id
        };
      }

      return null;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  };

  useEffect(() => {
    // Initial session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setToken(session?.access_token || null);
      if (session?.user) {
        fetchUserProfile(session.user.id).then(profile => {
          setUser(profile);
          setIsLoading(false);
        });
      } else {
        setIsLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setToken(session?.access_token || null);
      if (session?.user) {
        const profile = await fetchUserProfile(session.user.id);
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
      return supabase.auth.signInWithPassword({ email, password });
    }
    return supabase.auth.signInWithOtp({ email });
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
        data: signUpData
      }
    });
    
    if (signUpError) {
      console.error('Supabase Auth SignUp detailed error:', signUpError);
      const errorMsg = signUpError.message.toLowerCase();
      
      if (errorMsg.includes('user already registered') || errorMsg.includes('email already in use')) {
        throw new Error('This email is already registered. If you forgot your password, please use the reset option or try signing in.');
      }
      
      // If it's a database error, it might be the trigger. 
      // We'll provide a more helpful message.
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
