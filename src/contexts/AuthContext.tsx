import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase, getSafeUser, getSafeUserSession } from '../lib/supabase';
import type { User, Session } from '@supabase/supabase-js';

// Define the AuthContext interface
interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  emailVerified: boolean;
  paymentCompleted: boolean;
  isAdmin: boolean;
  userRole: string | null;
  authError: string | null;
  authSignIn: (email: string, password: string) => Promise<{ data: any; error: any }>;
  authSignUp: (email: string, password: string) => Promise<{ data: any; error: any }>;
  authSignOut: () => Promise<void>;
  forceRefreshVerification: () => void;
  checkAdminStatus: () => Promise<boolean>;
  clearAuthError: () => void;
}

// Create the AuthContext
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [emailVerified, setEmailVerified] = useState(false);
  const [paymentCompleted, setPaymentCompleted] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  // Clear auth error
  const clearAuthError = useCallback(() => {
    setAuthError(null);
  }, []);

  // IMPROVED: Helper function to create user profile with proper schema
  const ensureUserProfile = async (user: User) => {
    try {
      // Check if profile exists by email (matches webhook behavior)
      const { data: existingProfile, error: fetchError } = await supabase
        .from('user_profiles')
        .select('id, email, payment_verified, payment_status, role')
        .eq('email', user.email)
        .single();

      if (fetchError && fetchError.code === 'PGRST116') {
        // Profile doesn't exist, create it
        console.log('Creating user profile for:', user.email);
        
        // Check if this should be an admin user
        const adminEmails = [
          'admin@aiinstachat.com',
          'support@aiinstachat.com',
          'developer@aiinstachat.com'
        ];
        
        const defaultRole = adminEmails.includes(user.email.toLowerCase()) ? 'admin' : 'user';
        
        const { error: createError } = await supabase
          .from('user_profiles')
          .insert({
            id: user.id, // Use auth user ID
            email: user.email,
            payment_verified: false,
            payment_status: 'pending',
            subscription_status: 'free',
            role: defaultRole,
            created_at: new Date().toISOString()
          });

        if (createError) {
          console.error('Error creating user profile:', createError);
        } else {
          console.log('✅ User profile created successfully with role:', defaultRole);
          setUserRole(defaultRole);
          setIsAdmin(defaultRole === 'admin' || defaultRole === 'super_admin');
        }
      } else if (existingProfile) {
        console.log('✅ User profile already exists');
        setUserRole(existingProfile.role || 'user');
        setIsAdmin(existingProfile.role === 'admin' || existingProfile.role === 'super_admin');
        
        // Update the profile with the correct user ID if it's missing or different
        if (existingProfile.id !== user.id) {
          console.log('Updating user profile ID mapping...');
          const { error: updateError } = await supabase
            .from('user_profiles')
            .update({ 
              id: user.id, 
              updated_at: new Date().toISOString() 
            })
            .eq('email', user.email);
          
          if (updateError) {
            console.error('Error updating user profile ID:', updateError);
          } else {
            console.log('✅ Updated user profile ID mapping');
          }
        }
      }

      // IMPROVED: Handle user_access_status more carefully (might be a view)
      try {
        const { data: existingAccess, error: accessFetchError } = await supabase
          .from('user_access_status')
          .select('id, email, email_verified')
          .eq('email', user.email)
          .single();

        if (accessFetchError && accessFetchError.code === 'PGRST116') {
          // Try to create access status record (only if it's a real table)
          console.log('Attempting to create user access status for:', user.email);
          const { error: createAccessError } = await supabase
            .from('user_access_status')
            .insert({
              id: user.id,
              email: user.email,
              email_verified: !!user.email_confirmed_at,
              payment_verified: false,
              has_access: false,
              access_type: 'No access',
              created_at: new Date().toISOString()
            });

          if (createAccessError) {
            console.warn('Could not create user_access_status (might be a view):', createAccessError);
          } else {
            console.log('✅ User access status created successfully');
          }
        }
      } catch (accessError) {
        console.warn('user_access_status might be a view, skipping insert:', accessError);
      }

    } catch (error) {
      console.error('Error in ensureUserProfile:', error);
    }
  };

  // Check admin status function
  const checkAdminStatus = useCallback(async (): Promise<boolean> => {
    if (!user?.email) {
      setIsAdmin(false);
      setUserRole(null);
      return false;
    }

    try {
      // Check user role from user_profiles table
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('role, email')
        .eq('email', user.email)
        .single();

      if (error) {
        console.warn('Error checking admin role:', error);
        setIsAdmin(false);
        setUserRole('user');
        return false;
      } else if (profile) {
        const role = profile.role || 'user';
        const adminStatus = role === 'admin' || role === 'super_admin';
        
        setUserRole(role);
        setIsAdmin(adminStatus);
        
        // Also check for specific admin emails as fallback
        const adminEmails = [
          'admin@aiinstachat.com',
          'support@aiinstachat.com',
          'developer@aiinstachat.com'
        ];
        
        if (!adminStatus && adminEmails.includes(user.email.toLowerCase())) {
          setIsAdmin(true);
          setUserRole('admin');
          
          // Update the role in database
          await supabase
            .from('user_profiles')
            .update({ role: 'admin' })
            .eq('email', user.email);
          
          return true;
        }
        
        return adminStatus;
      } else {
        setIsAdmin(false);
        setUserRole('user');
        return false;
      }
    } catch (error) {
      console.error('Error checking admin status:', error);
      setIsAdmin(false);
      setUserRole('user');
      return false;
    }
  }, [user]);

  // Helper function to check if payment is completed
  const isPaymentCompleted = (profile: any): boolean => {
    if (!profile) return false;
    
    // Check payment_verified flag
    if (profile.payment_verified === true) {
      return true;
    }
    
    // Check subscription status
    if (profile.subscription_status === 'active' || profile.subscription_status === 'trialing') {
      return true;
    }
    
    // Check if current period is still valid
    if (profile.current_period_end) {
      const endDate = new Date(profile.current_period_end);
      const now = new Date();
      if (endDate > now) {
        return true;
      }
    }
    
    return false;
  };

  // ENHANCED: Main function to check user authentication and status with better error handling
  const checkUserAndStatus = useCallback(async () => {
    try {
      setLoading(true);
      setAuthError(null);
      
      // First, try to get the session
      const { session: currentSession, error: sessionError } = await getSafeUserSession();
      
      if (sessionError) {
        console.error('Session error:', sessionError);
        setAuthError(`Session error: ${sessionError.message}`);
      }
      
      setSession(currentSession);
      
      // Then try to get the user
      const { user: supabaseUser, error: userError } = await getSafeUser();
      
      if (userError) {
        console.error('User error:', userError);
        setAuthError(`User error: ${userError.message}`);
        setUser(null);
        setEmailVerified(false);
        setPaymentCompleted(false);
        setIsAdmin(false);
        setUserRole(null);
        return;
      }

      setUser(supabaseUser);

      if (supabaseUser) {
        // Ensure user profile exists
        await ensureUserProfile(supabaseUser);
        
        // Check email verification
        const verified = !!supabaseUser.email_confirmed_at;
        setEmailVerified(verified);
        console.log(`Email verification status: ${verified ? '✅ Verified' : '❌ Not verified'}`);

        // Check admin status
        await checkAdminStatus();

        // Check payment status
        try {
          const { data: profile, error: profileError } = await supabase
            .from('user_profiles')
            .select(`
              payment_verified,
              subscription_status,
              payment_status,
              plan_type,
              current_period_end,
              role
            `)
            .eq("email", supabaseUser.email)
            .single();

          if (profileError && profileError.code === 'PGRST116') {
            // Profile not found, treat as no payment completed
            console.warn('User profile not found by email:', supabaseUser.email);
            setPaymentCompleted(false);
          } else if (profileError) {
            console.warn('Error fetching user profile:', profileError);
            setPaymentCompleted(false);
          } else if (profile) {
            const completed = isPaymentCompleted(profile);
            setPaymentCompleted(completed);
            console.log(`Payment status: ${completed ? '✅ Completed' : '❌ Not completed'}`);
            console.log('Profile data:', profile);
            
            // Update role information if available
            if (profile.role) {
              setUserRole(profile.role);
              setIsAdmin(profile.role === 'admin' || profile.role === 'super_admin');
            }
          } else {
            setPaymentCompleted(false);
            console.log('❌ User profile not found.');
          }

          // Secondary check: user_access_status (if available)
          if (!paymentCompleted) {
            try {
              const { data: accessStatus, error: accessError } = await supabase
                .from('user_access_status')
                .select('has_access, payment_verified, temp_access_until')
                .eq('email', supabaseUser.email)
                .single();
              
              if (!accessError && accessStatus) {
                const hasAccessViaStatus = accessStatus.has_access || 
                  accessStatus.payment_verified ||
                  (accessStatus.temp_access_until && new Date(accessStatus.temp_access_until) > new Date());
                
                if (hasAccessViaStatus) {
                  setPaymentCompleted(true);
                  console.log('✅ Payment verified via user_access_status');
                }
              }
            } catch (accessError) {
              console.warn('Could not check user_access_status for payment:', accessError);
            }
          }

        } catch (profileError) {
          console.error('Error checking payment status:', profileError);
          setPaymentCompleted(false);
        }
      } else {
        setEmailVerified(false);
        setPaymentCompleted(false);
        setIsAdmin(false);
        setUserRole(null);
      }
    } catch (error) {
      console.error('Error in checkUserAndStatus:', error);
      setAuthError(`Authentication error: ${error.message}`);
      setUser(null);
      setSession(null);
      setEmailVerified(false);
      setPaymentCompleted(false);
      setIsAdmin(false);
      setUserRole(null);
    } finally {
      setLoading(false);
    }
  }, [checkAdminStatus, paymentCompleted]);

  useEffect(() => {
    let mounted = true;
    
    const initializeAuth = async () => {
      if (mounted) {
        await checkUserAndStatus();
      }
    };

    initializeAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state change:', event, session?.user?.email);
      
      if (mounted) {
        setSession(session);
        
        // Add a small delay to ensure session is properly set
        setTimeout(() => {
          if (mounted) {
            checkUserAndStatus();
          }
        }, 100);
      }
    });

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, [checkUserAndStatus]);

  const forceRefreshVerification = useCallback(() => {
    console.log('Force refreshing verification status...');
    checkUserAndStatus();
  }, [checkUserAndStatus]);

  const authSignIn = async (email: string, password: string) => {
    try {
      setAuthError(null);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        setAuthError(error.message);
        return { data: null, error };
      }
      
      return { data, error: null };
    } catch (error) {
      console.error('Sign in error:', error);
      setAuthError(error.message);
      return { data: null, error };
    }
  };

  const authSignUp = async (email: string, password: string) => {
    try {
      setAuthError(null);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });
      
      if (error) {
        setAuthError(error.message);
        return { data: null, error };
      }
      
      return { data, error: null };
    } catch (error) {
      console.error('Sign up error:', error);
      setAuthError(error.message);
      return { data: null, error };
    }
  };

  const authSignOut = async () => {
    try {
      console.log('🔄 AuthContext: Starting sign out...');
      setAuthError(null);
      
      // Reset local state first
      setUser(null);
      setSession(null);
      setEmailVerified(false);
      setPaymentCompleted(false);
      setIsAdmin(false);
      setUserRole(null);
      
      console.log('✅ AuthContext: Local state reset');
      
      // Then sign out from Supabase
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('AuthContext: Supabase sign out error:', error);
        setAuthError(error.message);
        throw error;
      }
      
      console.log('✅ AuthContext: Supabase sign out completed');
      
    } catch (error) {
      console.error('AuthContext: Sign out error:', error);
      setAuthError(error.message);
      
      // Force reset state even if sign out fails
      setUser(null);
      setSession(null);
      setEmailVerified(false);
      setPaymentCompleted(false);
      setIsAdmin(false);
      setUserRole(null);
      
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    session,
    loading,
    emailVerified,
    paymentCompleted,
    isAdmin,
    userRole,
    authError,
    authSignIn,
    authSignUp,
    authSignOut,
    forceRefreshVerification,
    checkAdminStatus,
    clearAuthError
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the AuthContext
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};