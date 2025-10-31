import React, { useState, useEffect } from 'react';
import { Home, Check, Twitter, Linkedin, MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

export function PricingPageNew() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isDark } = useTheme();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-black text-white font-sans overflow-x-hidden">
      {/* Back to Home Button */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 px-4 py-2 bg-white text-black hover:bg-gray-200 border border-white rounded-full transition-all hover:shadow-lg font-medium"
        >
          <Home className="w-5 h-5" />
          Back to Home
        </button>
      </div>

      {/* Hero Section */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <div className="mb-6">
          <h1 className="text-5xl md:text-6xl font-bold mb-4 text-white">
            The Essential Plan
          </h1>
          {/* Pinkish-purple underline below the text */}
          <div className="h-1 w-48 bg-gradient-to-r from-pink-500 to-purple-600 mx-auto"></div>
        </div>
        <p className="text-lg text-gray-400 max-w-2xl mx-auto leading-relaxed">
          Unlock your writing potential with comprehensive AI-powered writing tools
        </p>
      </div>

      {/* Plan Card */}
      <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="relative bg-gradient-to-br from-blue-600/20 to-purple-600/20 border border-purple-500/30 rounded-3xl p-8 backdrop-blur-sm">
          {/* Most Popular Badge */}
          <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
            <div className="bg-purple-600 text-white px-6 py-2 rounded-full text-sm font-semibold">
              Most Popular
            </div>
          </div>

          <div className="pt-8">
            {/* Plan Title */}
            <h2 className="text-3xl font-bold text-white text-center mb-4">
              Essential Plan
            </h2>

            {/* Price */}
            <div className="text-center mb-6">
              <div className="text-5xl font-bold text-purple-400 mb-2">
                $20.00
              </div>
              <p className="text-gray-400">/month</p>
              <p className="text-gray-500 text-sm mt-3">
                First 7 days free • Cancel anytime
              </p>
            </div>

            {/* Package Description */}
            <p className="text-center text-white mb-8">
              Complete writing preparation package
            </p>

            {/* Features List */}
            <ul className="space-y-4 mb-10">
              {[
                'Access to basic writing tools',
                'Limited AI feedback',
                'Basic text type templates',
                'Email support',
                'Unlimited AI feedback',
                'All text type templates',
                'Unlimited Practice Essays',
                'Advanced writing analysis',
                'Practice exam simulations',
                'Priority support',
                'Progress tracking'
              ].map((feature, index) => (
                <li key={index} className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-300">{feature}</span>
                </li>
              ))}
            </ul>

            {/* CTA Button - White outlined with gray text */}
            <button
              onClick={() => navigate('/auth')}
              className="w-full bg-transparent border-2 border-white text-gray-300 font-bold py-3 px-6 rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/50 active:scale-95 hover:bg-purple-600 hover:text-white hover:border-purple-600"
            >
              Start trial
            </button>
          </div>
        </div>
      </div>

      {/* Referral Teaser Section - Improved */}
      <div className="max-w-sm mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="bg-gradient-to-r from-yellow-500/10 to-amber-500/10 border border-yellow-500/30 rounded-2xl p-6 backdrop-blur-sm animate-fadeIn">
          {/* Centered Trophy Icon */}
          <div className="text-center mb-4">
            <div className="text-5xl">🏆</div>
          </div>
          
          {/* Centered Heading */}
          <h3 className="text-purple-400 font-bold text-lg text-center mb-4">
            🎁 Refer & Earn Rewards
          </h3>
          
          {/* Improved Centered Subtitle with Better Alignment */}
          <div className="text-center mb-6">
            <p className="text-gray-400 text-sm leading-relaxed mb-3">
              Share Writing Mate with friends after signup—earn FREE months!
            </p>
            
            {/* Referral Tiers - Centered Multi-line List */}
            <div className="space-y-2 text-sm text-gray-300">
              <div className="flex justify-center items-center gap-2">
                <span className="text-yellow-400 font-semibold">1 Referral</span>
                <span className="text-gray-500">=</span>
                <span>1 Free Month</span>
              </div>
              <div className="flex justify-center items-center gap-2">
                <span className="text-yellow-400 font-semibold">2 Referrals</span>
                <span className="text-gray-500">=</span>
                <span>$5 Off for 6 Months</span>
              </div>
              <div className="flex justify-center items-center gap-2">
                <span className="text-yellow-400 font-semibold">3 Referrals</span>
                <span className="text-gray-500">=</span>
                <span>$10 Off for 6 Months</span>
              </div>
            </div>
          </div>

          {/* CTA Button - Centered */}
          <div className="flex justify-center">
            <button
              onClick={() => navigate('/auth')}
              className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-6 rounded-lg transition-all text-sm"
            >
              Sign Up to Refer & Earn
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-950 border-t border-gray-800 py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Footer Content Grid */}
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            {/* Logo & Tagline */}
            <div className="md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-purple-600 rounded-lg"></div>
                <span className="text-white font-bold text-lg">Writing Mate</span>
              </div>
              <p className="text-gray-500 text-sm leading-relaxed">
                AI-powered writing coach for NSW Selective School exam preparation. Master essay writing with personalized feedback and guidance.
              </p>
              {/* Social Icons */}
              <div className="flex gap-4 mt-6">
                <a href="https://twitter.com" className="text-gray-500 hover:text-purple-400 transition-colors">
                  <Twitter className="w-5 h-5" />
                </a>
                <a href="https://discord.com" className="text-gray-500 hover:text-purple-400 transition-colors">
                  <MessageCircle className="w-5 h-5" />
                </a>
                <a href="https://linkedin.com" className="text-gray-500 hover:text-purple-400 transition-colors">
                  <Linkedin className="w-5 h-5" />
                </a>
              </div>
            </div>

            {/* Product Column */}
            <div>
              <h4 className="text-white font-semibold mb-4">PRODUCT</h4>
              <ul className="space-y-2">
                <li>
                  <a href="#features" className="text-gray-500 hover:text-purple-400 transition-colors">
                    Features
                  </a>
                </li>
                <li>
                  <a href="/writing" className="text-gray-500 hover:text-purple-400 transition-colors">
                    Start Writing
                  </a>
                </li>
              </ul>
            </div>

            {/* Support Column */}
            <div>
              <h4 className="text-white font-semibold mb-4">SUPPORT</h4>
              <ul className="space-y-2">
                <li>
                  <a href="/faq" className="text-gray-500 hover:text-purple-400 transition-colors">
                    FAQ
                  </a>
                </li>
                <li>
                  <a href="mailto:support@writingmate.com" className="text-gray-500 hover:text-purple-400 transition-colors flex items-center gap-2">
                    <span>Contact Support</span>
                  </a>
                </li>
                <li>
                  <a href="#help" className="text-gray-500 hover:text-purple-400 transition-colors">
                    Help Center
                  </a>
                </li>
              </ul>
            </div>

            {/* Company Column (Only About Us) */}
            <div>
              <h4 className="text-white font-semibold mb-4">COMPANY</h4>
              <ul className="space-y-2">
                <li>
                  <a href="/about" className="text-gray-500 hover:text-purple-400 transition-colors">
                    About Us
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Horizontal Links */}
          <div className="border-t border-gray-800 pt-8 mb-8">
            <div className="flex flex-wrap gap-4 justify-center text-sm">
              <a href="/privacy" className="text-gray-500 hover:text-purple-400 transition-colors">
                Privacy Policy
              </a>
              <span className="text-gray-700">•</span>
              <a href="/terms" className="text-gray-500 hover:text-purple-400 transition-colors">
                Terms of Service
              </a>
              <span className="text-gray-700">•</span>
              <a href="/cookies" className="text-gray-500 hover:text-purple-400 transition-colors">
                Cookie Policy
              </a>
              <span className="text-gray-700">•</span>
              <a href="/accessibility" className="text-gray-500 hover:text-purple-400 transition-colors">
                Accessibility
              </a>
            </div>
          </div>

          {/* Copyright */}
          <div className="text-center text-gray-600 text-sm">
            © 2025 Writing Mate. All rights reserved.
          </div>
        </div>
      </footer>

      {/* Bottom CTA */}
      <div className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 border-t border-purple-500/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-gradient-to-br from-blue-600/10 to-purple-600/10 border border-purple-500/20 rounded-2xl p-8 text-center">
            <p className="text-gray-300 text-lg mb-6">
              Ready to improve your writing? Start your NSW Selective School exam preparation today.
            </p>
            <button
              onClick={() => navigate('/auth')}
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-8 rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/50 active:scale-95"
            >
              Get Started
            </button>
          </div>
        </div>
      </div>

      {/* Animations */}
      <style>{`
        @keyframes pulse {
          0%, 100% { box-shadow: 0 0 10px rgba(139, 0, 255, 0.5), 0 0 20px rgba(139, 0, 255, 0.3); }
          50% { box-shadow: 0 0 5px rgba(139, 0, 255, 0.2), 0 0 10px rgba(139, 0, 255, 0.1); }
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .animate-fadeIn {
          animation: fadeIn 0.6s ease-out;
        }

        button:hover {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }

        @media (max-width: 640px) {
          h1 {
            font-size: 2.5rem;
          }
          
          .grid {
            grid-template-columns: 1fr;
          }

          .max-w-sm {
            max-width: 100%;
          }

          .flex.justify-center.items-center.gap-2 {
            flex-direction: column;
            gap: 0.5rem;
          }
        }
      `}</style>
    </div>
  );
}

export default PricingPageNew;
