import React, { useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ArrowRight, CheckCircle, Star, Users, Zap, BookOpen, Award, Target, Play, Pen, MessageSquare, Trophy } from 'lucide-react';

interface HomePageProps {
  onNavigate: (page: string, type?: string) => void;
  onSignInClick: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate, onSignInClick }) => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section - Exactly matching instachatai.co */}
      <section className="relative overflow-hidden bg-white pt-16 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            {/* Main Heading */}
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
              <span className="text-blue-600">Boost Your Child's Selective Exam Score</span>
              <br />
              <span className="text-black">with AI-Powered Writing Practice</span>
            </h1>

            {/* Subheading */}
            <p className="text-lg md:text-xl text-gray-700 mb-12 leading-relaxed max-w-3xl mx-auto">
              Master narrative, persuasive, and creative writing with personalized AI guidance. Join thousands of students preparing for NSW Selective exams.
            </p>

            {/* CTA Buttons */}
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

      {/* Writing Types Section - Matching instachatai.co */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-purple-600 mb-4">
              Writing Types for NSW Selective Exam
            </h2>
            <p className="text-lg text-gray-700">
              Choose from our comprehensive range of writing styles with AI-powered guidance
            </p>
          </div>

          {/* Writing Types Grid */}
          <div className="grid md:grid-cols-3 gap-8">
            {/* Card 1: Storytelling & Creative Writing */}
            <div className="bg-white rounded-xl p-8 border-t-4 border-blue-500 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center mb-4">
                <Pen className="w-6 h-6 text-blue-600 mr-3" />
                <h3 className="text-xl font-bold text-gray-900">Storytelling & Creative Writing</h3>
              </div>
              <p className="text-gray-600 mb-6">Master the art of creative storytelling and narrative techniques</p>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Narrative Writing</h4>
                  <p className="text-sm text-gray-600 mb-3">Write engaging stories with compelling plots and characters</p>
                  <button className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors">
                    Sign In to Start
                  </button>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Imaginative Writing</h4>
                  <p className="text-sm text-gray-600 mb-3">Create fantastical stories and unique worlds</p>
                  <button className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors">
                    Sign In to Start
                  </button>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Recount Writing</h4>
                  <p className="text-sm text-gray-600 mb-3">Share personal or historical experiences effectively</p>
                  <button className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors">
                    Sign In to Start
                  </button>
                </div>
              </div>
            </div>

            {/* Card 2: Argument & Debate Writing */}
            <div className="bg-white rounded-xl p-8 border-t-4 border-purple-500 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center mb-4">
                <MessageSquare className="w-6 h-6 text-purple-600 mr-3" />
                <h3 className="text-xl font-bold text-gray-900">Argument & Debate Writing</h3>
              </div>
              <p className="text-gray-600 mb-6">Learn to craft compelling arguments and balanced discussions</p>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Persuasive Writing</h4>
                  <p className="text-sm text-gray-600 mb-3">Convince readers with strong arguments and evidence</p>
                  <button className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors">
                    Sign In to Start
                  </button>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Discursive Writing</h4>
                  <p className="text-sm text-gray-600 mb-3">Explore different viewpoints on complex topics</p>
                  <button className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors">
                    Sign In to Start
                  </button>
                </div>
              </div>
            </div>

            {/* Card 3: Essay Scorer */}
            <div className="bg-white rounded-xl p-8 border-t-4 border-green-500 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center mb-4">
                <Trophy className="w-6 h-6 text-green-600 mr-3" />
                <h3 className="text-xl font-bold text-gray-900">Essay Scorer</h3>
              </div>
              <p className="text-gray-600 mb-6">Get detailed feedback and scores based on NSW marking criteria</p>
              
              <div className="space-y-3 mb-6">
                <div className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-gray-900">Detailed Analysis</h4>
                    <p className="text-sm text-gray-600">Comprehensive feedback on content, structure, and language</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-gray-900">NSW Criteria</h4>
                    <p className="text-sm text-gray-600">Aligned with Selective School marking standards</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-gray-900">Improvement Tips</h4>
                    <p className="text-sm text-gray-600">Actionable suggestions for better scores</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-gray-900">Score Tracking</h4>
                    <p className="text-sm text-gray-600">Monitor your progress over time</p>
                  </div>
                </div>
              </div>

              <button className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors">
                Sign In to Score Essays
              </button>
            </div>
          </div>

          {/* Pro Tip */}
          <div className="mt-12 bg-blue-50 border-l-4 border-blue-600 p-6 rounded">
            <p className="text-gray-800">
              <span className="font-bold text-blue-600">Pro Tip:</span> Submit your completed essays for instant feedback and scoring based on actual NSW Selective exam criteria.
            </p>
            <p className="text-sm text-gray-600 mt-2">All essay types are aligned with NSW Selective exam requirements</p>
          </div>

          {/* CTA Button */}
          <div className="text-center mt-12">
            <button
              onClick={() => onNavigate(user ? 'dashboard' : 'auth')}
              className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors"
            >
              Sign In to Start Writing
              <ArrowRight className="ml-2 w-5 h-5" />
            </button>
          </div>
        </div>
      </section>

      {/* Master Every Writing Style Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Master Every Writing Style for Selective Success
            </h2>
            <p className="text-lg text-gray-700">
              Practice under exam conditions and get feedback to improve your writing skills
            </p>
          </div>

          {/* Writing Styles Grid */}
          <div className="grid md:grid-cols-2 gap-8">
            {/* Narrative Writing */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Narrative Writing</h3>
              <p className="text-gray-700 mb-4">Create engaging stories with strong plots, vivid descriptions, and memorable characters.</p>
              <ul className="space-y-2">
                <li className="flex items-center text-gray-700">
                  <CheckCircle className="w-5 h-5 text-blue-600 mr-2" />
                  Story Mountain framework
                </li>
                <li className="flex items-center text-gray-700">
                  <CheckCircle className="w-5 h-5 text-blue-600 mr-2" />
                  Character development
                </li>
                <li className="flex items-center text-gray-700">
                  <CheckCircle className="w-5 h-5 text-blue-600 mr-2" />
                  Descriptive techniques
                </li>
              </ul>
            </div>

            {/* Persuasive Writing */}
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Persuasive Writing</h3>
              <p className="text-gray-700 mb-4">Master the PEEL method to construct powerful arguments that convince your readers.</p>
              <ul className="space-y-2">
                <li className="flex items-center text-gray-700">
                  <CheckCircle className="w-5 h-5 text-purple-600 mr-2" />
                  Strong thesis statements
                </li>
                <li className="flex items-center text-gray-700">
                  <CheckCircle className="w-5 h-5 text-purple-600 mr-2" />
                  Evidence-based arguments
                </li>
                <li className="flex items-center text-gray-700">
                  <CheckCircle className="w-5 h-5 text-purple-600 mr-2" />
                  Persuasive techniques
                </li>
              </ul>
            </div>

            {/* Informative Writing */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Informative Writing</h3>
              <p className="text-gray-700 mb-4">Explain complex topics clearly and effectively with structured information.</p>
              <ul className="space-y-2">
                <li className="flex items-center text-gray-700">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                  Clear explanations
                </li>
                <li className="flex items-center text-gray-700">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                  Logical organization
                </li>
                <li className="flex items-center text-gray-700">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                  Supporting examples
                </li>
              </ul>
            </div>

            {/* Reflective Writing */}
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Reflective Writing</h3>
              <p className="text-gray-700 mb-4">Share personal experiences and insights with meaningful reflection.</p>
              <ul className="space-y-2">
                <li className="flex items-center text-gray-700">
                  <CheckCircle className="w-5 h-5 text-orange-600 mr-2" />
                  Personal insights
                </li>
                <li className="flex items-center text-gray-700">
                  <CheckCircle className="w-5 h-5 text-orange-600 mr-2" />
                  Critical thinking
                </li>
                <li className="flex items-center text-gray-700">
                  <CheckCircle className="w-5 h-5 text-orange-600 mr-2" />
                  Learning outcomes
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Practice Tips Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Practice Tips
            </h2>
            <p className="text-lg text-gray-700">
              Follow these tips to make the most of your practice sessions
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl p-8 text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Time Management</h3>
              <p className="text-gray-600">Practice with the timer to improve your speed</p>
            </div>

            <div className="bg-white rounded-xl p-8 text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Target className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Regular Practice</h3>
              <p className="text-gray-600">Set a consistent practice schedule</p>
            </div>

            <div className="bg-white rounded-xl p-8 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Self-Review</h3>
              <p className="text-gray-600">Review your work after each session</p>
            </div>
          </div>
        </div>
      </section>

      {/* AI Adaptation Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              AI That Adapts to Your Level
            </h2>
            <p className="text-lg text-gray-700">
              Our AI writing coach dynamically adjusts feedback and guidance based on your skill level
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Beginner Level */}
            <div className="bg-blue-50 rounded-xl p-8 border-l-4 border-blue-600">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Beginner Level</h3>
              <p className="text-gray-700 mb-4">Clear guidance and foundational support for new writers</p>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">•</span>
                  <span>Basic writing structure explanations</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">•</span>
                  <span>Step-by-step guidance for each section</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">•</span>
                  <span>Simple, clear feedback on improvements</span>
                </li>
              </ul>
            </div>

            {/* Intermediate Level */}
            <div className="bg-purple-50 rounded-xl p-8 border-l-4 border-purple-600">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Intermediate Level</h3>
              <p className="text-gray-700 mb-4">Advanced techniques and style enhancement</p>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start">
                  <span className="text-purple-600 mr-2">•</span>
                  <span>Vocabulary and style suggestions</span>
                </li>
                <li className="flex items-start">
                  <span className="text-purple-600 mr-2">•</span>
                  <span>Detailed feedback on argument structure</span>
                </li>
                <li className="flex items-start">
                  <span className="text-purple-600 mr-2">•</span>
                  <span>Advanced writing techniques coaching</span>
                </li>
              </ul>
            </div>

            {/* Advanced Level */}
            <div className="bg-green-50 rounded-xl p-8 border-l-4 border-green-600">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Advanced Level</h3>
              <p className="text-gray-700 mb-4">Sophisticated writing mastery and exam excellence</p>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">•</span>
                  <span>Complex argument development</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">•</span>
                  <span>Exam-specific strategies and tips</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">•</span>
                  <span>High-level literary techniques</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Continuous Learning */}
          <div className="mt-12 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-8 border border-blue-200">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Continuous Learning & Adaptation</h3>
            <p className="text-gray-700">
              Our AI continuously analyzes your writing patterns and progress to provide personalized recommendations and challenges appropriate for your skill level. As you improve, the AI adjusts its feedback to help you reach the next level of writing excellence.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              How Writing Mate Helps Students Succeed
            </h2>
            <p className="text-lg text-gray-700">
              Our AI-powered platform guides students step-by-step, helping them master key writing formats required for NSW Selective School exams
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12">
            {/* Left Column */}
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-8">How Writing Mate Works</h3>
              
              <div className="space-y-8">
                <div>
                  <h4 className="text-xl font-bold text-gray-900 mb-3">Step-by-Step Writing Support</h4>
                  <p className="text-gray-700 mb-3">The AI guides students through each section using an interactive, structured approach based on NSW syllabus expectations.</p>
                  <p className="text-gray-600 italic">Example: "What is your main argument? Why do you believe this is true?"</p>
                </div>

                <div>
                  <h4 className="text-xl font-bold text-gray-900 mb-3">Real-Time AI Feedback</h4>
                  <ul className="space-y-2 text-gray-700">
                    <li className="flex items-center">
                      <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                      Grammar & spelling corrections
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                      Sentence structure improvements
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                      Persuasive & narrative techniques
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-8">Student Success Data</h3>
              
              <div className="space-y-8">
                <div className="bg-white rounded-xl p-8 border-2 border-blue-200">
                  <div className="text-4xl font-bold text-blue-600 mb-2">82%</div>
                  <p className="text-gray-700 font-semibold">Writing Score Improvement</p>
                </div>

                <div className="bg-white rounded-xl p-8 border-2 border-purple-200">
                  <div className="text-4xl font-bold text-purple-600 mb-2">94%</div>
                  <p className="text-gray-700 font-semibold">Student Confidence</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Comparison Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              How Writing Mate Stands Out
            </h2>
            <p className="text-lg text-gray-700">
              Unlike generic AI chatbots, Writing Mate teaches students how to write better
            </p>
          </div>

          {/* Comparison Table */}
          <div className="overflow-x-auto mb-12">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100 border-b-2 border-gray-300">
                  <th className="text-left px-6 py-4 font-bold text-gray-900">Feature</th>
                  <th className="text-center px-6 py-4 font-bold text-gray-900">Writing Mate</th>
                  <th className="text-center px-6 py-4 font-bold text-gray-900">Generic AI Chatbots</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-200">
                  <td className="px-6 py-4 text-gray-700">Step-by-step writing guidance</td>
                  <td className="text-center px-6 py-4"><CheckCircle className="w-6 h-6 text-green-600 mx-auto" /></td>
                  <td className="text-center px-6 py-4"><span className="text-gray-400">✗</span></td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="px-6 py-4 text-gray-700">Follows NSW writing criteria</td>
                  <td className="text-center px-6 py-4"><CheckCircle className="w-6 h-6 text-green-600 mx-auto" /></td>
                  <td className="text-center px-6 py-4"><span className="text-gray-400">✗</span></td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="px-6 py-4 text-gray-700">NSW exam-style feedback</td>
                  <td className="text-center px-6 py-4"><CheckCircle className="w-6 h-6 text-green-600 mx-auto" /></td>
                  <td className="text-center px-6 py-4"><span className="text-gray-400">✗</span></td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="px-6 py-4 text-gray-700">Real-time grammar & sentence corrections</td>
                  <td className="text-center px-6 py-4"><CheckCircle className="w-6 h-6 text-green-600 mx-auto" /></td>
                  <td className="text-center px-6 py-4"><span className="text-gray-400">✗</span></td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="px-6 py-4 text-gray-700">Adaptive learning based on skill level</td>
                  <td className="text-center px-6 py-4"><CheckCircle className="w-6 h-6 text-green-600 mx-auto" /></td>
                  <td className="text-center px-6 py-4"><span className="text-gray-400">✗</span></td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-gray-700">Interactive AI coaching</td>
                  <td className="text-center px-6 py-4"><CheckCircle className="w-6 h-6 text-green-600 mx-auto" /></td>
                  <td className="text-center px-6 py-4"><span className="text-gray-400">✗</span></td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Key Strengths */}
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-blue-50 rounded-xl p-8">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Narrative Writing</h3>
              <p className="text-gray-700 mb-4">Uses Story Mountain framework for engaging storytelling</p>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-center">
                  <span className="text-blue-600 mr-2">•</span>
                  Character development
                </li>
                <li className="flex items-center">
                  <span className="text-blue-600 mr-2">•</span>
                  Plot structure
                </li>
                <li className="flex items-center">
                  <span className="text-blue-600 mr-2">•</span>
                  Descriptive language
                </li>
              </ul>
            </div>

            <div className="bg-purple-50 rounded-xl p-8">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Persuasive Writing</h3>
              <p className="text-gray-700 mb-4">Follows PEEEL structure for compelling arguments</p>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-center">
                  <span className="text-purple-600 mr-2">•</span>
                  Strong thesis statements
                </li>
                <li className="flex items-center">
                  <span className="text-purple-600 mr-2">•</span>
                  Evidence-based arguments
                </li>
                <li className="flex items-center">
                  <span className="text-purple-600 mr-2">•</span>
                  Logical reasoning
                </li>
              </ul>
            </div>

            <div className="bg-green-50 rounded-xl p-8">
              <h3 className="text-xl font-bold text-gray-900 mb-4">NSW Exam Alignment</h3>
              <p className="text-gray-700 mb-4">Built specifically for NSW writing standards</p>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-center">
                  <span className="text-green-600 mr-2">•</span>
                  Selective School criteria
                </li>
                <li className="flex items-center">
                  <span className="text-green-600 mr-2">•</span>
                  NAPLAN alignment
                </li>
                <li className="flex items-center">
                  <span className="text-green-600 mr-2">•</span>
                  HSC preparation
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};