import { ArrowRight, Star, Zap, BookOpen, Target, Sparkles } from 'lucide-react';

interface HeroSectionProps {
  onGetStarted: () => void;
}

export function HeroSectionEnhanced({ onGetStarted }: HeroSectionProps) {
  const handleTryDemo = () => {
    document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 pt-20 pb-32">
      {/* Background grid */}
      <div className="absolute inset-0 bg-grid opacity-30"></div>
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-50/30 to-white/80 dark:via-gray-800/50 dark:to-gray-900/90"></div>
      
      {/* Decorative elements */}
      <div className="absolute top-20 left-10 w-16 h-16 bg-yellow-300 rounded-full opacity-20 animate-float"></div>
      <div className="absolute top-40 right-20 w-24 h-24 bg-purple-300 rounded-full opacity-20 animate-float" style={{animationDelay: '1s'}}></div>
      <div className="absolute bottom-20 left-1/4 w-20 h-20 bg-blue-300 rounded-full opacity-20 animate-float" style={{animationDelay: '2s'}}></div>
      <div className="absolute bottom-40 right-1/3 w-12 h-12 bg-green-300 rounded-full opacity-20 animate-float" style={{animationDelay: '1.5s'}}></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-4xl mx-auto">
          {/* Trust Badge - Inspired by InstaChat AI */}
          <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-50 to-purple-50 rounded-full mb-8 border border-blue-100 dark:border-blue-700 dark:bg-blue-900/30">
            <Star className="w-4 h-4 text-yellow-500 fill-current mr-2" />
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">AI-Powered Writing Coach for NSW Students</span>
          </div>

          {/* Main Headline - Inspired by InstaChat AI's approach */}
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
            <span className="block">Boost Your Child's</span>
            <span className="block">
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                Selective Exam Score
              </span>
            </span>
            <span className="block text-gray-900 dark:text-white mt-2">with AI-Powered Writing Practice</span>
          </h1>

          {/* Subheading */}
          <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-10 leading-relaxed max-w-3xl mx-auto font-medium">
            Master narrative, persuasive, and creative writing with personalized AI guidance. Join students preparing for NSW Selective exams.
          </p>

          {/* CTA Buttons - Inspired by InstaChat AI */}
          <div className="flex flex-col sm:flex-row justify-center gap-4 mb-12">
            <button
              onClick={onGetStarted}
              className="group inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white bg-gradient-to-r from-blue-600 to-purple-700 rounded-xl hover:shadow-xl transform hover:scale-105 transition-all duration-200"
            >
              Start Free Trial
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              onClick={handleTryDemo}
              className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-600 rounded-xl hover:border-purple-300 dark:hover:border-purple-500 hover:shadow-lg transition-all duration-200"
            >
              Watch Quick Start Demo
              <Zap className="ml-2 w-5 h-5" />
            </button>
          </div>

          {/* Key Features Grid - Inspired by InstaChat AI */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto">
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
              <Zap className="w-8 h-8 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
              <div className="text-sm font-semibold text-gray-900 dark:text-white mb-1">Instant Feedback</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Real-time AI analysis</div>
            </div>
            
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
              <BookOpen className="w-8 h-8 text-purple-600 dark:text-purple-400 mx-auto mb-2" />
              <div className="text-sm font-semibold text-gray-900 dark:text-white mb-1">NSW Aligned</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Official NSW criteria</div>
            </div>
            
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
              <Target className="w-8 h-8 text-green-600 dark:text-green-400 mx-auto mb-2" />
              <div className="text-sm font-semibold text-gray-900 dark:text-white mb-1">Personalized</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Adapts to your level</div>
            </div>
          </div>

          {/* Social Proof */}
          <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-6 text-gray-800 dark:text-gray-200">
            <div className="flex items-center bg-white/90 dark:bg-gray-800/90 px-4 py-2 rounded-full shadow-md">
              <Zap className="w-5 h-5 text-purple-600 dark:text-purple-400 mr-2" />
              <span className="font-bold text-gray-900 dark:text-gray-100">10,000+ students</span>
            </div>
            <span className="hidden sm:inline-block text-gray-400">•</span>
            <div className="flex items-center bg-white/90 dark:bg-gray-800/90 px-4 py-2 rounded-full shadow-md">
              <span className="font-bold text-gray-900 dark:text-gray-100">3-day free trial</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
