import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { EssayCategories } from './EssayCategories';
import { NSWEssayTypes } from './NSWEssayTypes';
import { AdaptiveAI } from './AdaptiveAI';
import { HowItWorks } from './HowItWorks';
import { ReferralBanner } from './ReferralBanner';
import { StudentSuccessSection } from './StudentSuccessSection';
import { AdaptiveLearning } from './AdaptiveLearning';
import { WritingTypesGrid } from './WritingTypesGrid';
import { ExamPracticeSimulator } from './ExamPracticeSimulator';
import { FeatureComparison } from './FeatureComparison';
import { TestComponent } from './TestComponent';

interface HomePageProps {
  onNavigate: (page: string, type?: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {user && <ReferralBanner onNavigate={onNavigate} />}

      {/* Hero Section */}
      <div className="hero-section max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 relative">
        <div className="bg-grid absolute inset-0 opacity-30"></div>
        <div className="text-center relative z-10">
          <h1 className="heading-display">
            <span className="text-gradient">
              Boost Your Child's Selective Exam Score
            </span>
            <br />
            <span className="text-gray-900 dark:text-white">
              with AI-Powered Writing Practice
            </span>
          </h1>
          <p className="text-body-xl max-w-3xl mx-auto mt-6">
            Master narrative, persuasive, and creative writing with personalized AI guidance. Join thousands of students preparing for NSW Selective exams.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4">
            {!user && (
              <button
                onClick={() => onNavigate('pricing')}
                className="btn-primary-xl shadow-2xl"
              >
                View Pricing
              </button>
            )}
            <a
              href="#how-it-works"
              className="btn-secondary-xl"
            >
              See How It Works
            </a>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main>
        <TestComponent />
        
        {/* Writing Types for NSW Selective Exam */}
        <div id="get-started">
          <EssayCategories onNavigate={onNavigate} />
        </div>
        
        {/* NSW Essay Types */}
        <NSWEssayTypes onNavigate={onNavigate} />
        
        {/* Writing Types Grid */}
        <WritingTypesGrid onNavigate={onNavigate} />
        
        {/* NSW Selective Exam Practice Simulator */}
        <ExamPracticeSimulator onNavigate={onNavigate} />
        
        {/* AI That Adapts to Your Level */}
        <AdaptiveLearning />
        
        {/* How InstaChat AI Helps Students Succeed */}
        <StudentSuccessSection />
        
        {/* Feature Comparison */}
        <FeatureComparison />
        
        {/* How It Works */}
        <div id="how-it-works">
          <AdaptiveAI />
        </div>
        <HowItWorks />
      </main>
    </div>
  );
};
