import React from 'react';
import { useAuth } from '../contexts/AuthContext';

export const AuthDebug: React.FC = () => {
  const { user, session, loading, authError, emailVerified, paymentCompleted } = useAuth();

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black bg-opacity-75 text-white p-4 rounded-lg text-xs max-w-sm z-50">
      <h3 className="font-bold mb-2">Auth Debug</h3>
      <div>Loading: {loading ? 'Yes' : 'No'}</div>
      <div>User: {user ? user.email : 'None'}</div>
      <div>Session: {session ? 'Active' : 'None'}</div>
      <div>Email Verified: {emailVerified ? 'Yes' : 'No'}</div>
      <div>Payment: {paymentCompleted ? 'Yes' : 'No'}</div>
      {authError && <div className="text-red-300">Error: {authError}</div>}
      <div>Env URL: {import.meta.env.VITE_SUPABASE_URL ? 'Set' : 'Missing'}</div>
      <div>Env Key: {import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Set' : 'Missing'}</div>
    </div>
  );
};
