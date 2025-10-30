import React, { useState, useEffect } from 'react';
import { Mail, Lock, Loader, User } from 'lucide-react';
import { signUp } from '../lib/supabase';

interface SimpleSignUpProps {
  onSignInClick: () => void;
  onSignUpSuccess?: (user: any) => void;
}

// Changed from "export default function" to "export function" to match import style
export function SignUpForm({ onSignInClick, onSignUpSuccess }: SimpleSignUpProps) {
  const [studentName, setStudentName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Password validation
  const [passwordValidation, setPasswordValidation] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false
  });

  useEffect(() => {
    setPasswordValidation({
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    });
  }, [password]);

  const isPasswordValid = Object.values(passwordValidation).every(Boolean);
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (studentName.trim() === '') {
      setError('Please enter the Student Name');
      return;
    }

    if (!isPasswordValid) {
      setError('Please ensure your password meets all requirements');
      return;
    }

    if (!passwordsMatch) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const result = await signUp(email, password, studentName);
      
      if (result.success) {
        setSuccess(true);
        if (onSignUpSuccess && result.user) {
          onSignUpSuccess(result.user);
        }
      } else if (result.emailExists) {
        setError('An account with this email already exists. Please sign in instead.');
      } else {
        setError(result.error?.message || 'Sign up failed. Please try again.');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
          <Mail className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Check Your Email!</h2>
        <p className="text-gray-600">
          We've sent a confirmation link to <strong>{email}</strong>
        </p>
        <p className="text-sm text-gray-500">
          Please check your email and click the confirmation link to activate your account.
        </p>
        <button
          onClick={onSignInClick}
          className="text-indigo-600 hover:text-indigo-500 font-medium"
        >
          Back to Sign In
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">Join the Adventure!</h2>
        <p className="mt-2 text-sm text-gray-600">
          Create your account and start writing amazing stories
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* NEW FIELD: Student Name */}
        <div>
          <label htmlFor="signup-name" className="block text-sm font-medium text-gray-700 mb-2">
            🧑 Student Name
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              id="signup-name"
              type="text"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="e.g., Alex Smith"
              required
            />
          </div>
        </div>

        {/* EXISTING FIELD: Email */}
        <div>
          <label htmlFor="signup-email" className="block text-sm font-medium text-gray-700 mb-2">
            📧 Your Email Address
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              id="signup-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="your.email@example.com"
              required
            />
          </div>
        </div>

        {/* EXISTING FIELD: Password */}
        <div>
          <label htmlFor="signup-password" className="block text-sm font-medium text-gray-700 mb-2">
            🔐 Create a Strong Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              id="signup-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Make it super secure!"
              required
            />
          </div>
          
          {password && (
            <div className="mt-2 space-y-1">
              <div className="text-xs text-gray-600">Password requirements:</div>
              <div className="grid grid-cols-2 gap-1 text-xs">
                <div className={`flex items-center space-x-1 ${passwordValidation.length ? 'text-green-600' : 'text-gray-400'}`}>
                  <span>{passwordValidation.length ? '✓' : '○'}</span>
                  <span>8+ characters</span>
                </div>
                <div className={`flex items-center space-x-1 ${passwordValidation.uppercase ? 'text-green-600' : 'text-gray-400'}`}>
                  <span>{passwordValidation.uppercase ? '✓' : '○'}</span>
                  <span>Uppercase letter</span>
                </div>
                <div className={`flex items-center space-x-1 ${passwordValidation.lowercase ? 'text-green-600' : 'text-gray-400'}`}>
                  <span>{passwordValidation.lowercase ? '✓' : '○'}</span>
                  <span>Lowercase letter</span>
                </div>
                <div className={`flex items-center space-x-1 ${passwordValidation.number ? 'text-green-600' : 'text-gray-400'}`}>
                  <span>{passwordValidation.number ? '✓' : '○'}</span>
                  <span>Number</span>
                </div>
                <div className={`flex items-center space-x-1 ${passwordValidation.special ? 'text-green-600' : 'text-gray-400'} col-span-2`}>
                  <span>{passwordValidation.special ? '✓' : '○'}</span>
                  <span>Special character (!@#$%^&*)</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* EXISTING FIELD: Confirm Password */}
        <div>
          <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 mb-2">
            🔐 Confirm Your Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                confirmPassword && !passwordsMatch ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Type it again to be sure!"
              required
            />
          </div>
          {confirmPassword && !passwordsMatch && (
            <p className="mt-1 text-xs text-red-600">Passwords do not match</p>
          )}
          {confirmPassword && passwordsMatch && (
            <p className="mt-1 text-xs text-green-600">✓ Passwords match</p>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading || !isPasswordValid || !passwordsMatch}
          className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 px-4 rounded-lg font-medium hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center space-x-2"
        >
          {isLoading ? (
            <>
              <Loader className="w-5 h-5 animate-spin" />
              <span>Creating account...</span>
            </>
          ) : (
            <span>🚀 Start My Journey!</span>
          )}
        </button>

        <p className="text-center text-sm text-gray-600">
          Already have an account?{' '}
          <button
            type="button"
            onClick={onSignInClick}
            className="text-indigo-600 hover:text-indigo-500 font-medium"
          >
            Sign in here
          </button>
        </p>
      </form>
    </div>
  );
}
