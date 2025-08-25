import { createClient } from '@supabase/supabase-js';

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
});

// Export default for compatibility
export default supabase;

