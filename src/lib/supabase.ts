import { createClient } from '@supabase/supabase-js';
import type { User } from '@supabase/supabase-js';

// Supabase project configuration
const supabaseUrl = 'https://bcrzbrbkhpnzsmqfljty.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjcnpicmJraHBuenNtcWZsanR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTc0MzE4MTcsImV4cCI6MjAzMjkxNjgxN30.iH-4_1S-3Uv_i_V8h1v1OIyv-1_1S-3Uv_i_V8h1v1OI';

// Create and export the Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
} );

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
