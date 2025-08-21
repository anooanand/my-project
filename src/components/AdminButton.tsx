import React, { useState, useEffect } from 'react';
import { Shield } from 'lucide-react';
import { AdminTools } from './AdminTools';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface UserProfile {
  role: string;
  email: string;
}

export function AdminButton() {
  const { user } = useAuth();
  const [showAdminTools, setShowAdminTools] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user has admin role
  useEffect(() => {
    const checkAdminRole = async () => {
      if (!user?.email) {
        setIsAdmin(false);
        setIsLoading(false);
        return;
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
        } else if (profile) {
          // Check if user has admin role
          const adminRole = profile.role === 'admin' || profile.role === 'super_admin';
          setIsAdmin(adminRole);
          
          // Also check for specific admin emails as fallback
          const adminEmails = [
            'admin@aiinstachat.com',
            'support@aiinstachat.com',
            'developer@aiinstachat.com'
          ];
          
          if (!adminRole && adminEmails.includes(user.email.toLowerCase())) {
            setIsAdmin(true);
            // Update the role in database if needed
            await supabase
              .from('user_profiles')
              .update({ role: 'admin' })
              .eq('email', user.email);
          }
        } else {
          setIsAdmin(false);
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAdminRole();
  }, [user]);

  // Don't render anything if not admin or still loading
  if (isLoading || !isAdmin || !user) {
    return null;
  }

  return (
    <>
      <button
        onClick={() => setShowAdminTools(true)}
        className="fixed bottom-4 right-4 p-3 bg-red-600 text-white rounded-full shadow-lg hover:bg-red-700 transition-colors z-50 group"
        title="Admin Tools"
        aria-label="Open Admin Tools"
      >
        <Shield className="h-5 w-5" />
        <span className="absolute bottom-full right-0 mb-2 px-2 py-1 text-xs text-white bg-gray-900 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
          Admin Tools
        </span>
      </button>
      
      {showAdminTools && (
        <AdminTools 
          onClose={() => setShowAdminTools(false)} 
          userEmail={user.email}
          isAdmin={isAdmin}
        />
      )}
    </>
  );
}
