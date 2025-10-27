import React, { useState, useEffect } from 'react';
import { Sun, Moon, Menu, X, PenTool } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';

interface HomeNavigationProps {
  onNavigate: (page: string) => void;
  onSignInClick: () => void;
  onSignUpClick?: () => void;
}

export const HomeNavigation: React.FC<HomeNavigationProps> = ({ onNavigate, onSignInClick, onSignUpClick }) => {
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { label: 'Features', href: '#features' },
    { label: 'How It Works', href: '#how-it-works' },
    { label: 'Learning', onClick: () => onNavigate('learning') },
    { label: 'Pricing', href: '#pricing' },
    { label: 'About', href: '#about' }
  ];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg shadow-lg border-b border-gray-200 dark:border-slate-700'
          : 'bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-b border-gray-200/50 dark:border-slate-800/50'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 py-4">
          {/* Logo */}
          <button
            onClick={() => onNavigate('home')}
            className="flex items-center space-x-2 group"
          >
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center transform group-hover:scale-105 transition-transform">
              <PenTool className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900 dark:text-slate-100">
              Writing Mate
            </span>
          </button>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              item.onClick ? (
                <button
                  key={item.label}
                  onClick={item.onClick}
                  className="text-gray-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium transition-colors"
                >
                  {item.label}
                </button>
              ) : (
                <a
                  key={item.label}
                  href={item.href}
                  className="text-gray-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium transition-colors"
                >
                  {item.label}
                </a>
              )
            ))}
          </div>

          {/* Right Side - Desktop */}
          <div className="hidden md:flex items-center space-x-4">
            {/* Dark Mode Toggle */}
            <button
              onClick={toggleTheme}
              className="w-10 h-10 rounded-full flex items-center justify-center bg-gray-200 dark:bg-slate-700 hover:bg-gray-300 dark:hover:bg-slate-600 transition-all"
              aria-label="Toggle dark mode"
            >
              {theme === 'dark' ? (
                <Sun className="w-5 h-5 text-yellow-500 transition-transform duration-300 rotate-0 hover:rotate-180" />
              ) : (
                <Moon className="w-5 h-5 text-slate-700 transition-transform duration-300 rotate-0 hover:rotate-12" />
              )}
            </button>

            {/* Sign In Button */}
            {!user && (
              <button
                onClick={onSignInClick}
                className="px-4 py-2 text-gray-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium transition-colors"
              >
                Sign In
              </button>
            )}

            {/* CTA Button */}
            <button
              onClick={user ? () => onNavigate('dashboard') : (onSignUpClick || (() => onNavigate('auth')))}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white font-semibold rounded-xl transition-all hover:shadow-lg hover:scale-105"
            >
              {user ? 'Go to Dashboard' : 'Start Free Trial'}
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center space-x-2">
            {/* Dark Mode Toggle Mobile */}
            <button
              onClick={toggleTheme}
              className="w-10 h-10 rounded-full flex items-center justify-center bg-gray-200 dark:bg-slate-700 hover:bg-gray-300 dark:hover:bg-slate-600 transition-all"
              aria-label="Toggle dark mode"
            >
              {theme === 'dark' ? (
                <Sun className="w-5 h-5 text-yellow-500" />
              ) : (
                <Moon className="w-5 h-5 text-slate-700" />
              )}
            </button>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="w-10 h-10 rounded-lg flex items-center justify-center bg-gray-200 dark:bg-slate-700 hover:bg-gray-300 dark:hover:bg-slate-600 transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6 text-gray-700 dark:text-slate-300" />
              ) : (
                <Menu className="w-6 h-6 text-gray-700 dark:text-slate-300" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900">
          <div className="px-4 py-6 space-y-4">
            {navItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className="block text-gray-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium py-2"
              >
                {item.label}
              </a>
            ))}

            <div className="pt-4 space-y-3 border-t border-gray-200 dark:border-slate-700">
              {!user && (
                <button
                  onClick={() => {
                    onSignInClick();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full px-6 py-3 text-gray-700 dark:text-slate-300 bg-gray-100 dark:bg-slate-800 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
                >
                  Sign In
                </button>
              )}

              <button
                onClick={() => {
                  if (user) {
                    onNavigate('dashboard');
                  } else if (onSignUpClick) {
                    onSignUpClick();
                  } else {
                    onNavigate('auth');
                  }
                  setMobileMenuOpen(false);
                }}
                className="w-full px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-colors"
              >
                {user ? 'Go to Dashboard' : 'Start Free Trial'}
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};
