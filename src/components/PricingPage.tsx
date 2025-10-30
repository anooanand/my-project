import React, { useState, useEffect } from 'react';
import { ArrowRight, Check, Star, Home } from 'lucide-react';
import { supabase } from '../lib/supabase'; // Removed isEmailVerified import
import { createCheckoutSession } from '../lib/stripe';
import { products } from '../stripe-config';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet'; // Import Helmet for the script tag

export function PricingPage() {
  const { user, emailVerified, paymentCompleted, forceRefreshVerification } = useAuth(); // Get emailVerified and paymentCompleted from AuthContext
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isCheckingVerification, setIsCheckingVerification] = useState(false);

  // Local function to check payment status (can be removed if AuthContext handles all)
// The handleSubscribe function is no longer needed as we are using the Stripe Buy Button.
// The buy button handles the checkout process.
  const checkPaymentStatus = async (userId: string): Promise<boolean> => {
    try {
      // Check for temporary access first
      const tempAccess = localStorage.getItem('temp_access_granted');
      const tempUntil = localStorage.getItem('temp_access_until');
      
      if (tempAccess === 'true' && tempUntil) {
        const tempDate = new Date(tempUntil);
        if (tempDate > new Date()) {
          console.log('✅ User has valid 24-hour temporary access');
          return true; // Has valid temporary access
        }
      }
      
      // Check database for payment verification
      const { data } = await supabase
        .from('user_profiles')
        .select('payment_verified, subscription_status, manual_override')
        .eq('id', userId) // Use 'id' consistently
        .single();
      
      return data?.payment_verified === true || 
             data?.subscription_status === 'active' ||
             data?.manual_override === true;
    } catch (error) {
      console.error('Error checking payment status:', error);
      return false;
    }
  };

  useEffect(() => {
    window.scrollTo(0, 0); // Scroll to the top of the page on mount
    // No need to re-check email verification here, it's handled by AuthContext
    // Just set loading state based on AuthContext's loading
    if (!user) {
      setIsLoading(false);
      return;
    }

    // If AuthContext is still loading, keep PricingPage loading
    if (typeof emailVerified === 'undefined' || typeof paymentCompleted === 'undefined') {
      setIsLoading(true);
    } else {
      setIsLoading(false);
    }

  }, [user, emailVerified, paymentCompleted]); // Depend on AuthContext states

  

  const getVerificationStatus = () => {
    if (!user) {
      return { message: 'Please sign in to continue', color: 'text-gray-600', bgColor: 'bg-gray-100' };
    }
    
    if (!emailVerified) {
      return { 
        message: 'Please verify your email address before subscribing', 
        color: 'text-blue-600', 
        bgColor: 'bg-blue-50' 
      };
    }
    
    if (paymentCompleted) {
      return { 
        message: '✅ Email verified and payment completed!', 
        color: 'text-green-600', 
        bgColor: 'bg-green-50' 
      };
    }
    
    return { 
      message: '✅ Email verified - Ready to subscribe!', 
      color: 'text-green-600', 
      bgColor: 'bg-green-50' 
    };
  };

  const status = getVerificationStatus();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-300">Loading pricing information...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      <Helmet>
        <script async src="https://js.stripe.com/v3/buy-button.js"></script>
      </Helmet>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back to Home Button */}
        <div className="mb-6">
          <button
            onClick={( ) => navigate('/')}
            className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 border border-gray-300 rounded-lg shadow-sm transition-all hover:shadow-md text-gray-700 font-medium"
          >
            <Home className="w-5 h-5" />
            Back to Home
          </button>
        </div>

        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Choose Your <span className="bg-gradient-to-r from-blue-600 to-purple-700 bg-clip-text text-transparent">Plan</span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Unlock your writing potential with comprehensive AI-powered writing tools
          </p>
        </div>

        {/* User Status */}
        {user && (
          <div className="max-w-2xl mx-auto mb-8">
            <div className={`${status.bgColor} border border-gray-200 rounded-lg p-4 text-center`}>
              <p className={`${status.color} font-medium`}>
                Signed in as: {user.email}
              </p>
              <p className={`${status.color} text-sm mt-1`}>
                {status.message}
              </p>
              {!emailVerified && (
                <button
                  onClick={forceRefreshVerification} // Use forceRefreshVerification from AuthContext
                  disabled={isCheckingVerification}
                  className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 text-sm"
                >
                  {isCheckingVerification ? 'Checking...' : 'Recheck Status'}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Pricing Card - Single Centered Plan */}
        <div className="max-w-lg mx-auto">
          {/* Map removed to show only one block. We use the first product for display. */}
		          {products.slice(0, 1).map((product) => (
            <div
              key={product.id}
              className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden border-4 border-blue-500"
            >
              <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-center py-3 text-base font-semibold">
                Most Popular
              </div>

              <div className="p-10 pt-16">
                <div className="text-center mb-8">
                  <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
                    {product.name}
                  </h3>
                  <div className="flex items-baseline justify-center mb-4">
                    <span className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-700 bg-clip-text text-transparent">
                      $25.00
                    </span>
                    <span className="text-gray-500 dark:text-gray-400 ml-2 text-lg">
                      /{product.interval || 'month'}
                    </span>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 text-lg">
                    {product.description}
                  </p>
                </div>

                <ul className="space-y-3 mb-8">
                  {product.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start">
                      <Check className="h-5 w-5 text-green-500 mt-1 mr-3 flex-shrink-0" />
                      <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* Stripe Buy Button Implementation */}
                <div className="w-full">
	<stripe-buy-button
		                    buy-button-id="buy_btn_1SN8blRq1JXLPYBD5pPclBAr"
		                    publishable-key="pk_test_51QuwqnRq1JXLPYBDxEWg3Us1FtE5tfm4FAXW7Aw2CHCwY7bvGkIgRIDBBlGWg61ooSB5xAC8bHuhGcUNR9AA5d8J00kRpp5TyC"
		                    client-reference-id={user?.id}
		                    customer-email={user?.email}
		                    className="w-full"
		                  >
	                  </stripe-buy-button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Features Grid */}
        <div className="mt-20">
          <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">
            Everything You Need to Succeed
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: '📝', title: 'AI Writing Coach', desc: 'Get instant feedback on your essays' },
              { icon: '📊', title: 'Progress Tracking', desc: 'Monitor your improvement over time' },
              { icon: '🎯', title: 'Targeted Practice', desc: 'Focus on your weak areas' },
              { icon: '⭐', title: 'Expert Tips', desc: 'Learn from IELTS professionals' }
            ].map((feature, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Also export as PricingPageWithFixedVerification for backward compatibility
export const PricingPageWithFixedVerification = PricingPage;