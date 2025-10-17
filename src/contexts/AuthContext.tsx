import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';

// Define the AuthContext interface
interface AuthContextType {
  user: User | null;
  loading: boolean;
  emailVerified: boolean;
  paymentCompleted: boolean;
  isPaidUser: boolean;
  authSignIn: (email: string, password: string) => Promise<{ data: any; error: any }>;
  authSignUp: (email: string, password: string) => Promise<{ data: any; error: any }>;
  authSignOut: () => Promise<void>;
  forceRefreshVerification: () => void;
}

// Create the AuthContext
const AuthContext = createContext<AuthContextType | undefined>(undefined);
const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export { useAuth };

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [emailVerified, setEmailVerified] = useState(false);
  const [paymentCompleted, setPaymentCompleted] = useState(false);

  // IMPROVED: Helper function to create user profile with proper schema
  const ensureUserProfile = async (user: User) => {
    try {
      // Check if profile exists by email (matches webhook behavior)
      const { data: existingProfile, error: fetchError } = await supabase
        .from('user_profiles')
        .select('id, email, payment_verified, payment_status')
        .eq('email', user.email)
        .single();

      if (fetchError && fetchError.code === 'PGRST116') {
        // Profile doesn't exist, create it
        console.log('Creating user profile for:', user.email);
        const { error: createError } = await supabase
          .from('user_profiles')
          .insert({
            id: user.id, // Use auth user ID
            email: user.email,
            payment_verified: false,
            payment_status: 'pending',
            subscription_status: 'free',
            role: 'user',
          });
        if (createError) {
          console.error('Error creating user profile:', createError);
        }
      }
    } catch (e) {
      console.error('Unexpected error in ensureUserProfile:', e);
    }
  };

  const checkPaymentStatus = useCallback(async (userId: string) => {
    // NOTE: This function is a placeholder and should contain your actual logic 
    // to check payment status based on the user ID.
    return { paymentCompleted: false, isPaidUser: false };
  }, []);

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setLoading(true);
        if (session?.user) {
          setUser(session.user);
          // Check if email is verified (e.g., via metadata or a custom check)
          setEmailVerified(session.user.email_confirmed_at !== undefined);
          await ensureUserProfile(session.user);
          const { paymentCompleted: paid, isPaidUser: paidUser } = await checkPaymentStatus(session.user.id);
          setPaymentCompleted(paid);
          setPaymentCompleted(paidUser);
        } else {
          setUser(null);
          setEmailVerified(false);
          setPaymentCompleted(false);
        }
        setLoading(false);
      }
    );

    // Initial check
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        setEmailVerified(session.user.email_confirmed_at !== undefined);
        ensureUserProfile(session.user);
        checkPaymentStatus(session.user.id).then(({ paymentCompleted: paid, isPaidUser: paidUser }) => {
          setPaymentCompleted(paid);
          setPaymentCompleted(paidUser);
        });
      }
      setLoading(false);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [checkPaymentStatus]);

  const authSignIn = async (email: string, password: string) => {
    // NOTE: Replace with your actual implementation
    return { data: null, error: null };
  };

  const authSignUp = async (email: string, password: string) => {
    // NOTE: Replace with your actual implementation
    return { data: null, error: null };
  };

  const authSignOut = async () => {
    // NOTE: Replace with your actual implementation
  };

  const forceRefreshVerification = () => {
    // NOTE: Replace with your actual implementation
  };

  const isPaidUser = paymentCompleted; // Simplified for this context

  const value = {
    user,
    loading,
    emailVerified,
    paymentCompleted,
    isPaidUser,
    authSignIn,
    authSignUp,
    authSignOut,
    forceRefreshVerification,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
