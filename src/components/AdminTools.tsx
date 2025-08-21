import React, { useState, useEffect } from 'react';
import { ManualVerificationTool } from './ManualVerificationTool';
import { Shield, Users, Key, Database, AlertTriangle, User, Mail, Calendar } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface AdminToolsProps {
  onClose: () => void;
  userEmail?: string;
  isAdmin: boolean;
}

interface AdminStats {
  totalUsers: number;
  verifiedUsers: number;
  paidUsers: number;
  recentSignups: number;
}

export function AdminTools({ onClose, userEmail, isAdmin }: AdminToolsProps) {
  const [activeTab, setActiveTab] = useState<'users' | 'verification' | 'payments' | 'system'>('verification');
  const [showVerificationTool, setShowVerificationTool] = useState(false);
  const [adminStats, setAdminStats] = useState<AdminStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  // Security check - don't render if not admin
  if (!isAdmin) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
          <div className="flex items-center justify-center mb-4">
            <AlertTriangle className="h-12 w-12 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white text-center mb-4">
            Access Denied
          </h2>
          <p className="text-gray-600 dark:text-gray-300 text-center mb-6">
            You don't have permission to access admin tools.
          </p>
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  // Fetch admin statistics
  useEffect(() => {
    const fetchAdminStats = async () => {
      try {
        setIsLoadingStats(true);
        
        // Get total users count
        const { count: totalUsers } = await supabase
          .from('user_profiles')
          .select('*', { count: 'exact', head: true });

        // Get verified users count
        const { count: verifiedUsers } = await supabase
          .from('user_access_status')
          .select('*', { count: 'exact', head: true })
          .eq('email_verified', true);

        // Get paid users count
        const { count: paidUsers } = await supabase
          .from('user_profiles')
          .select('*', { count: 'exact', head: true })
          .eq('payment_verified', true);

        // Get recent signups (last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        
        const { count: recentSignups } = await supabase
          .from('user_profiles')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', sevenDaysAgo.toISOString());

        setAdminStats({
          totalUsers: totalUsers || 0,
          verifiedUsers: verifiedUsers || 0,
          paidUsers: paidUsers || 0,
          recentSignups: recentSignups || 0
        });
      } catch (error) {
        console.error('Error fetching admin stats:', error);
        setAdminStats({
          totalUsers: 0,
          verifiedUsers: 0,
          paidUsers: 0,
          recentSignups: 0
        });
      } finally {
        setIsLoadingStats(false);
      }
    };

    fetchAdminStats();
  }, []);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
              <Shield className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Admin Tools</h2>
              <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                <User className="h-4 w-4" />
                <span>{userEmail}</span>
                <span>•</span>
                <Calendar className="h-4 w-4" />
                <span>{new Date().toLocaleDateString()}</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            aria-label="Close Admin Tools"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Stats Overview */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">System Overview</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Users</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {isLoadingStats ? '...' : adminStats?.totalUsers || 0}
                  </p>
                </div>
                <Users className="h-8 w-8 text-blue-500" />
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Verified</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {isLoadingStats ? '...' : adminStats?.verifiedUsers || 0}
                  </p>
                </div>
                <Mail className="h-8 w-8 text-green-500" />
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Paid Users</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {isLoadingStats ? '...' : adminStats?.paidUsers || 0}
                  </p>
                </div>
                <Database className="h-8 w-8 text-purple-500" />
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Recent (7d)</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {isLoadingStats ? '...' : adminStats?.recentSignups || 0}
                  </p>
                </div>
                <Calendar className="h-8 w-8 text-orange-500" />
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button
            className={`px-6 py-3 font-medium text-sm transition-colors ${
              activeTab === 'users'
                ? 'border-b-2 border-blue-500 text-blue-600 bg-blue-50 dark:bg-blue-900/20'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
            onClick={() => setActiveTab('users')}
          >
            <Users className="inline-block h-4 w-4 mr-2" />
            Users
          </button>
          <button
            className={`px-6 py-3 font-medium text-sm transition-colors ${
              activeTab === 'verification'
                ? 'border-b-2 border-blue-500 text-blue-600 bg-blue-50 dark:bg-blue-900/20'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
            onClick={() => setActiveTab('verification')}
          >
            <Key className="inline-block h-4 w-4 mr-2" />
            Verification
          </button>
          <button
            className={`px-6 py-3 font-medium text-sm transition-colors ${
              activeTab === 'payments'
                ? 'border-b-2 border-blue-500 text-blue-600 bg-blue-50 dark:bg-blue-900/20'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
            onClick={() => setActiveTab('payments')}
          >
            <svg className="inline-block h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Payments
          </button>
          <button
            className={`px-6 py-3 font-medium text-sm transition-colors ${
              activeTab === 'system'
                ? 'border-b-2 border-blue-500 text-blue-600 bg-blue-50 dark:bg-blue-900/20'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
            onClick={() => setActiveTab('system')}
          >
            <Database className="inline-block h-4 w-4 mr-2" />
            System
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'verification' && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">User Verification Tools</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-gray-700 p-6 rounded-lg border border-gray-200 dark:border-gray-600 shadow-sm">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center">
                    <Key className="h-5 w-5 mr-2 text-blue-500" />
                    Manual Email Verification
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                    Manually verify a user's email address and grant them access to the platform. Use this only when the automatic verification process fails.
                  </p>
                  <button
                    onClick={() => setShowVerificationTool(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
                  >
                    Open Verification Tool
                  </button>
                </div>
                
                <div className="bg-white dark:bg-gray-700 p-6 rounded-lg border border-gray-200 dark:border-gray-600 shadow-sm">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center">
                    <Mail className="h-5 w-5 mr-2 text-green-500" />
                    Resend Verification Email
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                    Resend verification email to users who haven't verified their email address. This will trigger a new verification email.
                  </p>
                  <button
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors font-medium"
                    onClick={() => {
                      // TODO: Implement resend verification email functionality
                      alert('Resend verification email functionality will be implemented here');
                    }}
                  >
                    Resend Verification Email
                  </button>
                </div>
              </div>
              
              <div className="mt-6 bg-yellow-50 dark:bg-yellow-900/30 p-4 rounded-lg border border-yellow-200 dark:border-yellow-700">
                <h4 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2 flex items-center">
                  <AlertTriangle className="h-5 w-5 mr-2" />
                  Important Security Notice
                </h4>
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  Manual verification should only be used in exceptional cases when the normal verification process fails.
                  Always verify the user's identity through alternative means before manually verifying their account.
                  All admin actions are logged for security purposes.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">User Management</h3>
              <div className="bg-white dark:bg-gray-700 p-6 rounded-lg border border-gray-200 dark:border-gray-600">
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  User management tools will be available here. This section will include:
                </p>
                <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-300 space-y-2">
                  <li>View and search user accounts</li>
                  <li>Manage user roles and permissions</li>
                  <li>View user activity and login history</li>
                  <li>Suspend or activate user accounts</li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'payments' && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Payment Management</h3>
              <div className="bg-white dark:bg-gray-700 p-6 rounded-lg border border-gray-200 dark:border-gray-600">
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  Payment management tools will be available here. This section will include:
                </p>
                <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-300 space-y-2">
                  <li>View payment history and transactions</li>
                  <li>Manage subscription statuses</li>
                  <li>Process refunds and adjustments</li>
                  <li>View payment analytics and reports</li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'system' && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">System Management</h3>
              <div className="bg-white dark:bg-gray-700 p-6 rounded-lg border border-gray-200 dark:border-gray-600">
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  System management tools will be available here. This section will include:
                </p>
                <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-300 space-y-2">
                  <li>System health monitoring</li>
                  <li>Database maintenance tools</li>
                  <li>API usage statistics</li>
                  <li>Error logs and debugging tools</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <div className="flex justify-between items-center">
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Admin session: {userEmail} • {new Date().toLocaleString()}
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {showVerificationTool && (
        <ManualVerificationTool onClose={() => setShowVerificationTool(false)} />
      )}
    </div>
  );
}
