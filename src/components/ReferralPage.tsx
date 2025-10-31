import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Link2, Trophy, Copy, CheckCircle } from 'lucide-react';

interface UserProfile {
  id: string;
  email: string;
  paid_referrals_count: number;
  // Add other necessary fields
}

const ReferralPage: React.FC = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  // The base URL for the referral link
  const referralBaseUrl = 'https://writingmate.co/signup'; 
  const referralLink = user ? `${referralBaseUrl}?ref=${user.id}` : 'Loading...';

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('user_profiles')
        .select('id, email, paid_referrals_count')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
      } else {
        setProfile(data as UserProfile);
      }
      setLoading(false);
    };

    fetchProfile();
  }, [user]);

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const tiers = [
    { count: 1, reward: '1 Free Month', description: 'After your first paid referral.' },
    { count: 2, reward: '$5 Off for 3 Months', description: 'After your second paid referral.' },
    { count: 3, reward: '$10 Off for 5 Months', description: 'After your fifth paid referral.' },
  ];

  const currentCount = profile?.paid_referrals_count || 0;

  if (loading) {
    return <div className="p-8 text-center">Loading referral details...</div>;
  }

  if (!user) {
    return <div className="p-8 text-center text-red-500">Please sign in to view your referral status.</div>;
  }

  return (
    <div className="container mx-auto p-4 sm:p-8">
      <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">Refer & Earn Rewards</h1>
      <p className="mb-8 text-lg text-gray-600 dark:text-gray-400">
        Share your unique link with friends. When they sign up and make their first payment, you earn rewards!
      </p>

      {/* Referral Link Card */}
      <div className="bg-white dark:bg-gray-800 shadow-xl rounded-lg p-6 mb-10 border border-indigo-200 dark:border-indigo-700">
        <h2 className="text-xl font-semibold mb-4 flex items-center text-indigo-600 dark:text-indigo-400">
          <Link2 className="w-5 h-5 mr-2" /> Your Unique Referral Link
        </h2>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
          <input
            type="text"
            readOnly
            value={referralLink}
            className="flex-grow p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-sm truncate"
          />
          <button
            onClick={handleCopy}
            className="flex-shrink-0 px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition duration-150 ease-in-out flex items-center justify-center"
          >
            {copied ? (
              <>
                <CheckCircle className="w-5 h-5 mr-2" /> Copied!
              </>
            ) : (
              <>
                <Copy className="w-5 h-5 mr-2" /> Copy Link
              </>
            )}
          </button>
        </div>
      </div>

      {/* Progress Tracker */}
      <div className="mb-10">
        <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white flex items-center">
          <Trophy className="w-6 h-6 mr-2 text-yellow-500" /> Your Progress
        </h2>
        <div className="text-xl font-medium mb-4 text-gray-700 dark:text-gray-300">
          Paid Referrals: <span className="text-indigo-600 dark:text-indigo-400 font-extrabold">{currentCount}</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {tiers.map((tier, index) => {
            const isAchieved = currentCount >= tier.count;
            const isNext = !isAchieved && (currentCount < (tiers[index - 1]?.count || 0) || index === 0);
            const statusClass = isAchieved
              ? 'bg-green-50 border-green-500 dark:bg-green-900/20'
              : isNext
              ? 'bg-yellow-50 border-yellow-500 dark:bg-yellow-900/20'
              : 'bg-gray-50 border-gray-300 dark:bg-gray-700';

            return (
              <div
                key={tier.count}
                className={`p-5 rounded-xl shadow-md transition-all duration-300 border-2 ${statusClass}`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-2xl font-bold text-gray-900 dark:text-white">
                    {tier.count} {tier.count === 1 ? 'Referral' : 'Referrals'}
                  </span>
                  {isAchieved && <CheckCircle className="w-6 h-6 text-green-500" />}
                </div>
                <p className="text-xl font-semibold mb-2 text-indigo-600 dark:text-indigo-400">{tier.reward}</p>
                <p className="text-gray-600 dark:text-gray-400 text-sm">{tier.description}</p>
                
                <div className="mt-4">
                  {isAchieved ? (
                    <span className="text-sm font-medium text-green-600 dark:text-green-400">Reward Achieved!</span>
                  ) : (
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      {tier.count - currentCount > 0 ? `${tier.count - currentCount} more to go` : 'Next Tier'}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* How it Works Section */}
      <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
        <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">How it Works</h2>
        <ol className="space-y-4 text-gray-700 dark:text-gray-300 list-decimal list-inside">
          <li>Share your unique referral link with a friend, family member, or colleague.</li>
          <li>They sign up for WritingMate using your link.</li>
          <li>They subscribe to a paid plan.</li>
          <li>Your referral count increases, and you automatically receive your reward based on the tiers above!</li>
        </ol>
      </div>
    </div>
  );
};

export default ReferralPage;
