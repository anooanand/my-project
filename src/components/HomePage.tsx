import React, { useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ArrowRight, CheckCircle, Star, Users, Zap, BookOpen, Award, Target, Play, Pen, MessageSquare, Trophy, Lightbulb, Search, X } from 'lucide-react';

interface HomePageProps {
  onNavigate: (page: string, type?: string) => void;
  onSignInClick: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate, onSignInClick }) => {
  const { user } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isVideoPlaying, setIsVideoPlaying] = React.useState(false);

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isVideoPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsVideoPlaying(!isVideoPlaying);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-white pt-16 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
              <span className="text-blue-600">Boost Your Child's Selective Exam Score</span>
              <br />
              <span className="text-black">with AI-Powered Writing Practice</span>
            </h1>

            <p className="text-lg md:text-xl text-gray-700 mb-12 leading-relaxed max-w-3xl mx-auto">
              Master narrative, persuasive, and creative writing with personalized AI guidance. Join thousands of students preparing for NSW Selective exams.
            </p>

            <div className="flex flex-col sm:flex-row justify-center gap-4 mb-16">
              <button
                onClick={() => onNavigate(user ? 'dashboard' : 'pricing')}
                className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white bg-gradient-to-r from-purple-600 to-purple-700 rounded-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
              >
                View Pricing
                <span className="ml-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">10</span>
              </button>

              <button
                onClick={() => onNavigate('demo')}
                className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-blue-600 bg-white border-2 border-blue-400 rounded-lg hover:shadow-lg transition-all duration-200"
              >
                See How It Works
                <span className="ml-2 bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded">11</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* How Writing Mate Helps Students Succeed Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold">
              <span className="text-blue-600">How Writing Mate</span>
              <span className="text-purple-600"> Helps Students Succeed</span>
              <span className="text-red-600"> in Writing</span>
            </h2>
            <p className="text-lg text-gray-700 mt-6">
              Our AI-powered platform guides students step-by-step, helping them master key writing formats required for NSW Selective School exams and school assignments.
            </p>
          </div>

          {/* Two Column Layout */}
          <div className="grid md:grid-cols-2 gap-12">
            {/* Left Column - How It Works */}
            <div>
              <div className="flex items-center mb-8">
                <span className="text-3xl mr-3">🚀</span>
                <h3 className="text-2xl font-bold text-gray-900">How Writing Mate Works</h3>
              </div>

              <div className="space-y-8">
                {/* Step 1 */}
                <div>
                  <div className="flex items-start">
                    <span className="text-2xl mr-3">🧠</span>
                    <div>
                      <h4 className="text-xl font-bold text-gray-900 mb-2">Step-by-Step Writing Support</h4>
                      <p className="text-gray-700 mb-3">The AI guides students through each section using an interactive, structured approach based on NSW syllabus expectations.</p>
                      <div className="bg-blue-50 border-l-4 border-blue-600 p-4 rounded">
                        <p className="text-blue-700 italic">Example: "What is your main argument? Why do you believe this is true?"</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Step 2 */}
                <div>
                  <div className="flex items-start">
                    <span className="text-2xl mr-3">🎯</span>
                    <div>
                      <h4 className="text-xl font-bold text-gray-900 mb-2">Real-Time AI Feedback</h4>
                      <ul className="space-y-2">
                        <li className="flex items-center text-gray-700">
                          <CheckCircle className="w-5 h-5 text-green-600 mr-2 flex-shrink-0" />
                          Grammar & spelling corrections
                        </li>
                        <li className="flex items-center text-gray-700">
                          <CheckCircle className="w-5 h-5 text-green-600 mr-2 flex-shrink-0" />
                          Sentence structure improvements
                        </li>
                        <li className="flex items-center text-gray-700">
                          <CheckCircle className="w-5 h-5 text-green-600 mr-2 flex-shrink-0" />
                          Persuasive & narrative techniques
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Student Success Data */}
            <div>
              <div className="flex items-center mb-8">
                <span className="text-3xl mr-3">📈</span>
                <h3 className="text-2xl font-bold text-gray-900">Student Success Data</h3>
              </div>

              <div className="space-y-8">
                {/* Writing Score Improvement */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-700 font-semibold">Writing Score Improvement</span>
                    <span className="text-2xl font-bold text-blue-600">82%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full" style={{ width: '82%' }}></div>
                  </div>
                </div>

                {/* Student Confidence */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-700 font-semibold">Student Confidence</span>
                    <span className="text-2xl font-bold text-blue-600">94%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full" style={{ width: '94%' }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How Writing Mate Stands Out Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
              <span className="text-yellow-500">💡</span> How Writing Mate Stands Out from Other AI Writing Tools
            </h2>
          </div>

          {/* Feature Comparison */}
          <div className="bg-white rounded-xl p-8 mb-8 border border-gray-200">
            <div className="flex items-center mb-6">
              <Search className="w-6 h-6 text-blue-600 mr-2" />
              <h3 className="text-xl font-bold text-gray-900">Feature Comparison</h3>
            </div>

            {/* Comparison Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-gray-300">
                    <th className="text-left px-4 py-3 font-bold text-gray-900">Feature</th>
                    <th className="text-center px-4 py-3 font-bold text-gray-900">Writing Mate</th>
                    <th className="text-center px-4 py-3 font-bold text-gray-900">Generic AI Chatbots</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-200">
                    <td className="px-4 py-3 text-gray-700">Step-by-step writing guidance</td>
                    <td className="text-center px-4 py-3"><CheckCircle className="w-6 h-6 text-green-500 mx-auto" /></td>
                    <td className="text-center px-4 py-3"><X className="w-6 h-6 text-red-500 mx-auto" /></td>
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="px-4 py-3 text-gray-700">Follows NSW writing criteria</td>
                    <td className="text-center px-4 py-3"><CheckCircle className="w-6 h-6 text-green-500 mx-auto" /></td>
                    <td className="text-center px-4 py-3"><X className="w-6 h-6 text-red-500 mx-auto" /></td>
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="px-4 py-3 text-gray-700">NSW exam-style feedback</td>
                    <td className="text-center px-4 py-3"><CheckCircle className="w-6 h-6 text-green-500 mx-auto" /></td>
                    <td className="text-center px-4 py-3"><X className="w-6 h-6 text-red-500 mx-auto" /></td>
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="px-4 py-3 text-gray-700">Real-time grammar & sentence corrections</td>
                    <td className="text-center px-4 py-3"><CheckCircle className="w-6 h-6 text-green-500 mx-auto" /></td>
                    <td className="text-center px-4 py-3"><CheckCircle className="w-6 h-6 text-green-500 mx-auto" /></td>
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="px-4 py-3 text-gray-700">Adaptive learning based on skill level</td>
                    <td className="text-center px-4 py-3"><CheckCircle className="w-6 h-6 text-green-500 mx-auto" /></td>
                    <td className="text-center px-4 py-3"><X className="w-6 h-6 text-red-500 mx-auto" /></td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-gray-700">Interactive AI coaching</td>
                    <td className="text-center px-4 py-3"><CheckCircle className="w-6 h-6 text-green-500 mx-auto" /></td>
                    <td className="text-center px-4 py-3"><X className="w-6 h-6 text-red-500 mx-auto" /></td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Key Message */}
            <div className="mt-6 bg-blue-50 border-l-4 border-blue-600 p-4 rounded">
              <p className="text-gray-800">
                <span className="text-red-500 mr-2">🚀</span>
                <span className="font-semibold">Unlike generic AI chatbots, Writing Mate teaches students how to write better, rather than just generating answers.</span>
              </p>
            </div>
          </div>

          {/* Key Strengths Grid */}
          <div className="grid md:grid-cols-3 gap-8">
            {/* Narrative Writing */}
            <div className="bg-white rounded-xl p-8 border border-gray-200">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Narrative Writing</h3>
              <p className="text-gray-700 mb-4">Uses Story Mountain framework for engaging storytelling</p>
              <ul className="space-y-2">
                <li className="flex items-center text-gray-700">
                  <span className="text-blue-600 mr-2">•</span>
                  Character development
                </li>
                <li className="flex items-center text-gray-700">
                  <span className="text-blue-600 mr-2">•</span>
                  Plot structure
                </li>
                <li className="flex items-center text-gray-700">
                  <span className="text-blue-600 mr-2">•</span>
                  Descriptive language
                </li>
              </ul>
            </div>

            {/* Persuasive Writing */}
            <div className="bg-white rounded-xl p-8 border border-gray-200">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Persuasive Writing</h3>
              <p className="text-gray-700 mb-4">Follows PEEEL structure for compelling arguments</p>
              <ul className="space-y-2">
                <li className="flex items-center text-gray-700">
                  <span className="text-purple-600 mr-2">•</span>
                  Strong thesis statements
                </li>
                <li className="flex items-center text-gray-700">
                  <span className="text-purple-600 mr-2">•</span>
                  Evidence-based arguments
                </li>
                <li className="flex items-center text-gray-700">
                  <span className="text-purple-600 mr-2">•</span>
                  Logical reasoning
                </li>
              </ul>
            </div>

            {/* NSW Exam Alignment */}
            <div className="bg-white rounded-xl p-8 border border-gray-200">
              <h3 className="text-xl font-bold text-gray-900 mb-4">NSW Exam Alignment</h3>
              <p className="text-gray-700 mb-4">Built specifically for NSW writing standards</p>
              <ul className="space-y-2">
                <li className="flex items-center text-gray-700">
                  <span className="text-green-600 mr-2">•</span>
                  Selective School criteria
                </li>
                <li className="flex items-center text-gray-700">
                  <span className="text-green-600 mr-2">•</span>
                  NAPLAN alignment
                </li>
                <li className="flex items-center text-gray-700">
                  <span className="text-green-600 mr-2">•</span>
                  HSC preparation
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <button
            onClick={() => onNavigate(user ? 'dashboard' : 'auth')}
            className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors"
          >
            Sign In to Start Writing
            <ArrowRight className="ml-2 w-5 h-5" />
          </button>
        </div>
      </section>
    </div>
  );
};
