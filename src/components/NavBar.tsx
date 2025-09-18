import React, { useState, useRef } from 'react';
import { User } from '@supabase/supabase-js';
import { useLearning } from '../contexts/LearningContext';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { LogOut, Menu, X, ChevronDown, Home, Sparkles, Users, HelpCircle, BookOpen, Star, Brain, Target } from 'lucide-react';

interface NavBarProps {
  activePage: string;
  onNavigate: (page: string) => void;
  user: User | null;
  onSignInClick: () => void;
  onSignUpClick: () => void;
  onForceSignOut: () => void;
}

export function NavBar({ 
  activePage, 
  onNavigate, 
  user, 
  onSignInClick, 
  onSignUpClick, 
  onForceSignOut 
}: NavBarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLearningMenuOpen, setIsLearningMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const { progress } = useLearning();
  
  // Use ref to prevent multiple simultaneous sign out attempts
  const isSigningOut = useRef(false);

  const navigationItems = [
    { id: 'home', name: 'Home', href: '/', icon: Home },
    { id: 'features', name: 'Features', href: '/features', icon: Sparkles },
    { id: 'about', name: 'About', href: '/about', icon: Users },
    { id: 'faq', name: 'FAQ', href: '/faq', icon: HelpCircle }
  ];

  const learningItems = [
    { id: 'learning', name: 'Learning Journey', description: 'Your learning progress', icon: BookOpen },
    { id: 'progress-dashboard', name: 'Progress Dashboard', description: 'Track your achievements', icon: Star },
    { id: 'quiz-demo', name: 'Practice Quiz', description: 'Test your knowledge', icon: Brain }
  ];

  const handleSignOut = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Prevent multiple simultaneous sign out attempts
    if (isSigningOut.current) {
      console.log('Sign out already in progress, ignoring click...');
      return;
    }
    
    try {
      isSigningOut.current = true;
      console.log('NavBar: Sign out clicked');
      
      // Close all menus immediately
      setIsUserMenuOpen(false);
      setIsMenuOpen(false);
      setIsLearningMenuOpen(false);
      
      // Call the sign out function
      await onForceSignOut();
      
    } catch (error) {
      console.error('Error during sign out:', error);
    } finally {
      // Reset the flag after a delay to prevent rapid clicks
      setTimeout(() => {
        isSigningOut.current = false;
      }, 2000);
    }
  };

  // Helper function to get navigation item classes with consistent styling
  const getNavItemClasses = (itemId: string, isActive: boolean) => {
    const baseClasses = "px-4 py-2 rounded-lg font-medium transition-all duration-300 flex items-center space-x-2 text-sm";
    
    if (isActive) {
      return `${baseClasses} bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg transform scale-105`;
    }
    
    return `${baseClasses} text-gray-700 hover:text-indigo-600 hover:bg-indigo-50 hover:shadow-md hover:transform hover:scale-102 border border-transparent hover:border-indigo-200`;
  };

  // Helper function to get button classes with consistent styling
  const getButtonClasses = (variant: 'primary' | 'secondary' = 'primary') => {
    const baseClasses = "px-4 py-2 rounded-lg font-medium transition-all duration-300 flex items-center space-x-2 text-sm";
    
    if (variant === 'primary') {
      return `${baseClasses} bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg hover:shadow-xl hover:transform hover:scale-105`;
    }
    
    return `${baseClasses} bg-white text-indigo-600 border border-indigo-200 hover:bg-indigo-50 hover:shadow-md hover:transform hover:scale-102`;
  };

  // Helper function for user avatar
  const getUserAvatar = () => {
    if (!user?.email) return null;
    
    const initial = user.email.charAt(0).toUpperCase();
    return (
      <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-medium text-sm">
        {initial}
      </div>
    );
  };

  return (
    <nav className="bg-white/90 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <button
              onClick={() => onNavigate('home')}
              className="flex items-center space-x-2 text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent hover:scale-105 transition-transform duration-300"
            >
              <div className="w-8 h-8 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                AI
              </div>
              <span>InstaChat AI</span>
            </button>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = activePage === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={getNavItemClasses(item.id, isActive)}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </button>
              );
            })}

            {/* Learning Dropdown */}
            {user && (
              <div className="relative">
                <button
                  onClick={() => setIsLearningMenuOpen(!isLearningMenuOpen)}
                  className={getNavItemClasses('learning', activePage.includes('learning') || activePage.includes('progress') || activePage.includes('quiz'))}
                >
                  <BookOpen className="w-4 h-4" />
                  <span>Learning</span>
                  <ChevronDown className="w-3 h-3" />
                </button>

                {isLearningMenuOpen && (
                  <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-50">
                    {learningItems.map((item) => {
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.id}
                          onClick={() => {
                            onNavigate(item.id);
                            setIsLearningMenuOpen(false);
                          }}
                          className="w-full px-4 py-3 text-left hover:bg-indigo-50 flex items-start space-x-3 transition-colors duration-200"
                        >
                          <Icon className="w-5 h-5 text-indigo-600 mt-0.5" />
                          <div>
                            <div className="font-medium text-gray-900">{item.name}</div>
                            <div className="text-sm text-gray-500">{item.description}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Dashboard Button - Moved to top navigation */}
            {user && (
              <button
                onClick={() => onNavigate('dashboard')}
                className={getNavItemClasses('dashboard', activePage === 'dashboard')}
              >
                <Target className="w-4 h-4" />
                <span>Dashboard</span>
              </button>
            )}
          </div>

          {/* Auth Buttons */}
          <div className="hidden md:flex items-center space-x-3">
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-indigo-50 transition-colors duration-200"
                >
                  {getUserAvatar()}
                  <span className="text-sm font-medium text-gray-700 max-w-32 truncate">
                    {user.email}
                  </span>
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                </button>

                {isUserMenuOpen && (
                  <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-50">
                    <button
                      onClick={() => {
                        onNavigate('settings');
                        setIsUserMenuOpen(false);
                      }}
                      className="w-full px-4 py-2 text-left hover:bg-indigo-50 flex items-center space-x-2 transition-colors duration-200"
                    >
                      <Target className="w-4 h-4 text-indigo-600" />
                      <span className="text-gray-700">Settings</span>
                    </button>
                    <hr className="my-2 border-gray-200" />
                    <button
                      onClick={handleSignOut}
                      className="w-full px-4 py-2 text-left hover:bg-red-50 flex items-center space-x-2 transition-colors duration-200 text-red-600"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <button
                  onClick={onSignInClick}
                  className={getButtonClasses('secondary')}
                >
                  Sign In
                </button>
                <button
                  onClick={onSignUpClick}
                  className={getButtonClasses('primary')}
                >
                  Get Started
                </button>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-lg text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 transition-colors duration-200"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200 bg-white/95 backdrop-blur-md">
            <div className="space-y-2">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = activePage === item.id;
                
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onNavigate(item.id);
                      setIsMenuOpen(false);
                    }}
                    className={`w-full ${getNavItemClasses(item.id, isActive)} justify-start`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.name}</span>
                  </button>
                );
              })}

              {user && (
                <>
                  {/* Dashboard Button - Also moved to mobile navigation */}
                  <button
                    onClick={() => {
                      onNavigate('dashboard');
                      setIsMenuOpen(false);
                    }}
                    className={`w-full ${getNavItemClasses('dashboard', activePage === 'dashboard')} justify-start`}
                  >
                    <Target className="w-4 h-4" />
                    <span>Dashboard</span>
                  </button>

                  <div className="pt-2 border-t border-gray-200">
                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-2">
                      Learning
                    </div>
                    {learningItems.map((item) => {
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.id}
                          onClick={() => {
                            onNavigate(item.id);
                            setIsMenuOpen(false);
                          }}
                          className="w-full px-4 py-3 text-left hover:bg-indigo-50 flex items-start space-x-3 transition-colors duration-200"
                        >
                          <Icon className="w-5 h-5 text-indigo-600 mt-0.5" />
                          <div>
                            <div className="font-medium text-gray-900">{item.name}</div>
                            <div className="text-sm text-gray-500">{item.description}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <div className="pt-2 border-t border-gray-200">
                    <button
                      onClick={() => {
                        onNavigate('settings');
                        setIsMenuOpen(false);
                      }}
                      className="w-full px-4 py-2 text-left hover:bg-indigo-50 flex items-center space-x-2 transition-colors duration-200"
                    >
                      <Target className="w-4 h-4 text-indigo-600" />
                      <span className="text-gray-700">Settings</span>
                    </button>
                    <button
                      onClick={handleSignOut}
                      className="w-full px-4 py-2 text-left hover:bg-red-50 flex items-center space-x-2 transition-colors duration-200 text-red-600"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </>
              )}

              {!user && (
                <div className="pt-2 border-t border-gray-200 space-y-2">
                  <button
                    onClick={() => {
                      onSignInClick();
                      setIsMenuOpen(false);
                    }}
                    className={`w-full ${getButtonClasses('secondary')} justify-center`}
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => {
                      onSignUpClick();
                      setIsMenuOpen(false);
                    }}
                    className={`w-full ${getButtonClasses('primary')} justify-center`}
                  >
                    Get Started
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
