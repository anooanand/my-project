import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Ensure that the environment variables are defined
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables:', {
    url: !!supabaseUrl,
    key: !!supabaseAnonKey
  });
  throw new Error('Supabase URL and Anon Key are required!');
}

// Enhanced client configuration with better session handling
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Enhanced session configuration
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    // Storage configuration for better session persistence
    storage: {
      getItem: (key: string) => {
        try {
          return localStorage.getItem(key);
        } catch (error) {
          console.warn('Error accessing localStorage:', error);
          return null;
        }
      },
      setItem: (key: string, value: string) => {
        try {
          localStorage.setItem(key, value);
        } catch (error) {
          console.warn('Error setting localStorage:', error);
        }
      },
      removeItem: (key: string) => {
        try {
          localStorage.removeItem(key);
        } catch (error) {
          console.warn('Error removing from localStorage:', error);
        }
      }
    }
  },
  // Remove WebContainer proxy logic that might interfere with auth
  global: {
    headers: {
      'X-Client-Info': 'supabase-js-web'
    }
  }
});

// Helper function to check if email is verified
export function isEmailVerified(user: any): boolean {
  return user?.email_confirmed_at !== undefined && user?.email_confirmed_at !== null;
}

// Enhanced function to safely get user session
export async function getSafeUserSession() {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Error getting session:', error);
      return { session: null, error };
    }
    
    return { session, error: null };
  } catch (error) {
    console.error('Exception getting session:', error);
    return { session: null, error };
  }
}

// Enhanced function to safely get user
export async function getSafeUser() {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      console.error('Error getting user:', error);
      return { user: null, error };
    }
    
    return { user, error: null };
  } catch (error) {
    console.error('Exception getting user:', error);
    return { user: null, error };
  }
}

// FIXED: Updated function to properly check user access from database
export async function hasAnyAccess(userId: string): Promise<boolean> {
  try {
    // Query the user_access_status table to check payment verification
    const { data, error } = await supabase
      .from('user_access_status')
      .select('payment_verified, has_access, temp_access_until, manual_override')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error checking user access:', error);
      return false;
    }

    if (!data) {
      return false;
    }

    // Check if user has permanent access (payment verified or manual override)
    if (data.payment_verified || data.manual_override || data.has_access) {
      return true;
    }

    // Check if user has valid temporary access
    if (data.temp_access_until) {
      const tempAccessDate = new Date(data.temp_access_until);
      const now = new Date();
      return tempAccessDate > now;
    }

    return false;
  } catch (error) {
    console.error('Error in hasAnyAccess:', error);
    return false;
  }
}

// FIXED: New function to get detailed user access status
export async function getUserAccessStatus(userId: string) {
  try {
    const { data, error } = await supabase
      .from('user_access_status')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error getting user access status:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in getUserAccessStatus:', error);
    return null;
  }
}
