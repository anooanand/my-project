import React from 'react';
import { TrendingUp, Sparkles, CheckCircle } from 'lucide-react';

export function SuccessMetricsSection() {
  return (
    <section className="py-16 bg-gradient-to-b from-indigo-50 to-white dark:from-slate-900 dark:to-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-slate-100 mb-4">
            How Writing Mate Helps Students Succeed in Writing
          </h2>
          <p className="text-lg text-gray-600 dark:text-slate-400 max-w-4xl mx-auto">
            Our AI-powered platform guides students step-by-step, helping them master key writing formats required for NSW Selective School exams and school assignments.
          </p>
        </div>

        {/* Success Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          {/* Writing Score Improvement */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 border-2 border-indigo-200 dark:border-indigo-800 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-slate-100">
                =� Writing Score Improvement
              </h3>
              <TrendingUp className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="mb-4">
              <div className="text-6xl font-bold text-indigo-600 dark:text-indigo-400 mb-2">82%</div>
              <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-4">
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 h-4 rounded-full" style={{ width: '82%' }}></div>
              </div>
            </div>
            <p className="text-gray-600 dark:text-slate-400 text-sm">
              Average improvement in writing scores after 4 weeks of consistent practice
            </p>
          </div>

          {/* Student Confidence */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 border-2 border-purple-200 dark:border-purple-800 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-slate-100">
                =� Student Confidence
              </h3>
              <Sparkles className="w-8 h-8 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="mb-4">
              <div className="text-6xl font-bold text-purple-600 dark:text-purple-400 mb-2">94%</div>
              <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-4">
                <div className="bg-gradient-to-r from-purple-600 to-pink-600 h-4 rounded-full" style={{ width: '94%' }}></div>
              </div>
            </div>
            <p className="text-gray-600 dark:text-slate-400 text-sm">
              Of students report feeling more confident in their writing abilities
            </p>
          </div>
        </div>

        {/* How It Works Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {/* Step-by-Step Writing Support */}
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-2xl p-8 border border-indigo-200 dark:border-indigo-800">
            <div className="text-3xl mb-4">=�</div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-slate-100 mb-4">
              Step-by-Step Writing Support
            </h3>
            <p className="text-gray-700 dark:text-slate-300 mb-6 leading-relaxed">
              The AI guides students through each section using an interactive, structured approach based on NSW syllabus expectations.
            </p>
            <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border-l-4 border-indigo-500">
              <p className="text-gray-800 dark:text-slate-200 italic">
                Example: "What is your main argument? Why do you believe this is true?"
              </p>
            </div>
          </div>

          {/* Real-Time AI Feedback */}
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl p-8 border border-purple-200 dark:border-purple-800">
            <div className="text-3xl mb-4">(</div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-slate-100 mb-4">
              Real-Time AI Feedback
            </h3>
            <div className="space-y-3">
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mr-3 flex-shrink-0" />
                <span className="text-gray-700 dark:text-slate-300">Grammar & spelling corrections</span>
              </div>
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mr-3 flex-shrink-0" />
                <span className="text-gray-700 dark:text-slate-300">Sentence structure improvements</span>
              </div>
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mr-3 flex-shrink-0" />
                <span className="text-gray-700 dark:text-slate-300">Persuasive & narrative techniques</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
