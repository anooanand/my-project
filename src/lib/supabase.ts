import { createClient } from '@supabase/supabase-js';
import type { User } from '@supabase/supabase-js';

// Supabase project configuration using environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://rvlotczavccreigdzczo.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ2bG90Y3phdmNjcmVpZ2R6Y3pvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ5NzI2MzQsImV4cCI6MjA1MDU0ODYzNH0.YOUR_ACTUAL_ANON_KEY_HERE';

// Validate required environment variables
if (!supabaseUrl) {
  throw new Error('Missing VITE_SUPABASE_URL environment variable');
}

if (!supabaseAnonKey) {
  throw new Error('Missing VITE_SUPABASE_ANON_KEY environment variable');
}

// Create and export the Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// Utility function to check if email is verified
export const isEmailVerified = (user?: User | null): boolean => {
  if (!user) return false;
  return !!user.email_confirmed_at;
};

// Utility function to check if user has any access
export const hasAnyAccess = async (userId: string): Promise<boolean> => {
  try {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('payment_verified, payment_status, subscription_status, manual_override, temp_access_until')
      .eq('id', userId)
      .single();

    if (!profile) return false;

    // Check multiple indicators of access
    const hasVerifiedPayment = profile.payment_verified === true;
    const hasVerifiedStatus = profile.payment_status === 'verified';
    const hasActiveSubscription = profile.subscription_status === 'active';
    const hasManualOverride = profile.manual_override === true;
    const hasTempAccess = profile.temp_access_until && 
      new Date(profile.temp_access_until) > new Date();

    return hasVerifiedPayment || hasVerifiedStatus || hasActiveSubscription || 
           hasManualOverride || hasTempAccess;
  } catch (error) {
    console.error('Error checking access:', error);
    return false;
  }
};

// Utility function to get user access status
export const getUserAccessStatus = async (userId: string) => {
  try {
    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select(`
        payment_verified, 
        payment_status, 
        manual_override, 
        subscription_status, 
        temp_access_until,
        plan_type,
        current_period_end
      `)
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching user access status:', error);
      return null;
    }

    return profile;
  } catch (error) {
    console.error('Error in getUserAccessStatus:', error);
    return null;
  }
};

// Export default for compatibility
export default supabase;
