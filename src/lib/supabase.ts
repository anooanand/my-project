import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Ensure that the environment variables are defined
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL and Anon Key are required!');
}

// Create and export the Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Authentication functions that use Netlify proxy
export const signIn = async (email: string, password: string) => {
  try {
    console.log('Attempting sign in via Netlify proxy...');
    
    const response = await fetch('/.netlify/functions/auth-proxy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'signin',
        email,
        password
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('Sign in failed:', data);
      return { 
        error: { 
          message: data.error || data.message || 'Sign in failed' 
        }, 
        user: null 
      };
    }

    // If we have an access token, the sign in was successful
    if (data.access_token && data.user) {
      console.log('Sign in successful');
      
      // Set the session in the Supabase client
      await supabase.auth.setSession({
        access_token: data.access_token,
        refresh_token: data.refresh_token
      });
      
      return { error: null, user: data.user };
    } else {
      return { 
        error: { 
          message: 'Invalid credentials' 
        }, 
        user: null 
      };
    }
  } catch (error) {
    console.error('Sign in error:', error);
    return { 
      error: { 
        message: error.message || 'Network error' 
      }, 
      user: null 
    };
  }
};

export const signUp = async (email: string, password: string) => {
  try {
    console.log('Attempting sign up via Netlify proxy...');
    
    const response = await fetch('/.netlify/functions/auth-proxy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'signup',
        email,
        password
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('Sign up failed:', data);
      
      // Check if email already exists
      const isEmailExists = data.error?.includes('already registered') || 
                           data.message?.includes('already registered') ||
                           data.error?.includes('already exists') ||
                           data.message?.includes('already exists');
      
      return { 
        success: false, 
        emailExists: isEmailExists,
        error: { 
          message: data.error || data.message || 'Sign up failed' 
        }, 
        user: null 
      };
    }

    // Sign up successful
    console.log('Sign up successful');
    return { 
      success: true, 
      emailExists: false, 
      error: null, 
      user: data.user 
    };
  } catch (error) {
    console.error('Sign up error:', error);
    return { 
      success: false, 
      emailExists: false, 
      error: { 
        message: error.message || 'Network error' 
      }, 
      user: null 
    };
  }
};

export const requestPasswordReset = async (email: string) => {
  try {
    console.log('Requesting password reset via Netlify proxy...');
    
    const response = await fetch('/.netlify/functions/auth-proxy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'reset-password',
        email
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('Password reset failed:', data);
      return { 
        success: false, 
        error: { 
          message: data.error || data.message || 'Password reset failed' 
        } 
      };
    }

    console.log('Password reset email sent');
    return { success: true, error: null };
  } catch (error) {
    console.error('Password reset error:', error);
    return { 
      success: false, 
      error: { 
        message: error.message || 'Network error' 
      } 
    };
  }
};

// Helper function to check if email is verified
export function isEmailVerified(user: any): boolean {
  return user?.email_confirmed_at !== undefined && user?.email_confirmed_at !== null;
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

// Export default for compatibility
export default supabase;