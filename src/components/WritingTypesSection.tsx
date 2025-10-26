import { BookOpen, Clock, Brain, Sparkles, ArrowRight, BarChart2, Zap, Target, PenTool, Award, Lightbulb, MessageCircle, Feather, Heart } from 'lucide-react';

interface WritingTypesSectionProps {
  onSignInClick: () => void;
}

export function WritingTypesSection({ onSignInClick }: WritingTypesSectionProps) {
  return (
    <section className="py-16 bg-white dark:bg-gray-900" id="writing-types">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900 dark:text-white">
            <span className="bg-gradient-to-r from-indigo-700 via-purple-700 to-pink-700 dark:from-indigo-300 dark:via-purple-300 dark:to-pink-300 bg-clip-text text-transparent">
              Writing Types for NSW Selective Exam
            </span>
          </h2>
          <p className="text-lg text-gray-700 dark:text-gray-300 max-w-3xl mx-auto">
            Choose from our comprehensive range of writing styles with AI-powered guidance
          </p>
        </div>

        {/* Main Writing Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {/* Storytelling & Creative Writing */}
          <WritingCategoryCard
            icon={<PenTool className="w-6 h-6" />}
            title="Storytelling & Creative Writing"
            description="Master the art of creative storytelling and narrative techniques"
            color="blue"
            items={[
              "Narrative Writing",
              "Recount Writing",
              "Descriptive Writing",
              "Imaginative Writing",
            ]}
            borderColor="border-blue-300 dark:border-blue-700"
            bgColor="bg-blue-50 dark:bg-blue-900/30"
            onSignInClick={onSignInClick}
          />

          {/* Argument & Debate Writing */}
          <WritingCategoryCard
            icon={<Target className="w-6 h-6" />}
            title="Argument & Debate Writing"
            description="Learn to craft compelling arguments and balanced discussions"
            color="purple"
            items={[
              "Persuasive Writing",
              "Discursive Writing",
              "Discussion Writing",
              "Speech",
            ]}
            borderColor="border-purple-300 dark:border-purple-700"
            bgColor="bg-purple-50 dark:bg-purple-900/30"
            onSignInClick={onSignInClick}
          />

          {/* Informative & Reflective Writing */}
          <WritingCategoryCard
            icon={<Lightbulb className="w-6 h-6" />}
            title="Informative & Reflective Writing"
            description="Develop clear explanations and thoughtful reflections"
            color="teal"
            items={[
              "Expository Writing",
              "Reflective Writing",
              "Advice Sheet",
              "Guide",
            ]}
            borderColor="border-teal-300 dark:border-teal-700"
            bgColor="bg-teal-50 dark:bg-teal-900/30"
            onSignInClick={onSignInClick}
          />

          {/* Functional & Expressive Writing (New Category Focus) */}
          <WritingCategoryCard
            icon={<Heart className="w-6 h-6" />}
            title="Functional & Expressive Writing"
            description="Practice writing for real-world scenarios and personal expression"
            color="green"
            items={[
              "Diary Entry",
              "Letter Writing",
              "Advertisement",
              "News Report",
              "Review Writing"
            ]}
            borderColor="border-green-300 dark:border-green-700"
            bgColor="bg-green-50 dark:bg-green-900/30"
            onSignInClick={onSignInClick}
          />
        </div>

        {/* Essay Scorer - Full Width */}
        <div className="mb-12">
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 rounded-2xl border-2 border-green-300 dark:border-green-700 p-8 md:p-10">
            <div className="flex items-start gap-6">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-14 w-14 rounded-xl bg-green-600 dark:bg-green-500">
                  <Award className="h-7 w-7 text-white" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Essay Scorer</h3>
                <p className="text-gray-700 dark:text-gray-300 mb-6">
                  Get detailed feedback and scores based on NSW marking criteria
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="flex items-start gap-3">
                    <CheckIcon />
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">Detailed Analysis</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Comprehensive feedback on content, structure, and language</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckIcon />
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">NSW Criteria</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Aligned with Selective School marking standards</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckIcon />
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">Improvement Tips</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Actionable suggestions for better scores</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckIcon />
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">Score Tracking</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Monitor your progress over time</p>
                    </div>
                  </div>
                </div>
                <button
                  onClick={onSignInClick}
                  className="inline-flex items-center px-6 py-3 bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 text-white font-semibold rounded-lg transition-colors duration-200"
                >
                  Sign In to Score Essays
                  <ArrowRight className="ml-2 w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Pro Tip Section */}
        <div className="bg-blue-50 dark:bg-blue-900/30 border-l-4 border-blue-600 dark:border-blue-400 rounded-lg p-6 mb-12">
          <div className="flex gap-4">
            <Lightbulb className="w-6 h-6 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-1" />
            <div>
              <h4 className="font-bold text-gray-900 dark:text-white mb-2">Pro Tip:</h4>
              <p className="text-gray-700 dark:text-gray-300">
                Submit your completed essays for instant feedback and scoring based on actual NSW Selective exam criteria. All essay types are aligned with NSW Selective exam requirements.
              </p>
            </div>
          </div>
        </div>

        {/* Master Every Writing Style Section */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-700 dark:to-pink-700 rounded-2xl p-8 md:p-12 text-white">
          <h3 className="text-3xl md:text-4xl font-bold mb-4">Master Every Writing Style for Selective Success</h3>
          <p className="text-lg text-purple-100 mb-8 max-w-2xl">
            Practice under exam conditions and get feedback to improve your writing skills
          </p>
          <button
            onClick={onSignInClick}
            className="inline-flex items-center px-8 py-4 bg-white text-purple-600 font-semibold rounded-lg hover:bg-purple-50 transition-colors duration-200"
          >
            Sign In to Start Writing
            <ArrowRight className="ml-2 w-5 h-5" />
          </button>
        </div>
      </div>
    </section>
  );
}

interface WritingCategoryCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
  items: string[];
  borderColor: string;
  bgColor: string;
  onSignInClick: () => void;
}

function WritingCategoryCard({
  icon,
  title,
  description,
  color,
  items,
  borderColor,
  bgColor,
  onSignInClick
}: WritingCategoryCardProps) {
  const colorMap: Record<string, { icon: string; text: string }> = {
    blue: { icon: 'text-blue-700 dark:text-blue-300', text: 'text-blue-800 dark:text-blue-200' },
    purple: { icon: 'text-purple-700 dark:text-purple-300', text: 'text-purple-800 dark:text-purple-200' },
    teal: { icon: 'text-teal-700 dark:text-teal-300', text: 'text-teal-800 dark:text-teal-200' },
    green: { icon: 'text-green-700 dark:text-green-300', text: 'text-green-800 dark:text-green-200' }
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl border-2 ${borderColor} overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col`}>
      {/* Header */}
      <div className={`${bgColor} p-5 border-b border-gray-200 dark:border-gray-700`}>
        <div className="flex items-start gap-3 mb-3">
          <div className={colorMap[color]?.icon}>
            {icon}
          </div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">{title}</h3>
        </div>
        <p className="text-sm text-gray-700 dark:text-gray-300">{description}</p>
      </div>

      {/* Content */}
      <div className="p-5 flex-1 flex flex-col">
        <div className="space-y-3 mb-5 flex-1">
          {items.map((item, index) => (
            <div key={index} className="flex items-start gap-2">
              <div className="mt-1 flex-shrink-0">
                <LockIcon />
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900 dark:text-white text-sm">{item}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Button */}
        <button
          onClick={onSignInClick}
          className={`w-full py-2 px-4 rounded-lg font-semibold text-white transition-all duration-200 flex items-center justify-center gap-2 ${
            color === 'blue' ? 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600' :
            color === 'purple' ? 'bg-purple-600 hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600' :
            color === 'teal' ? 'bg-teal-600 hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600' :
            'bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600'
          }`}
        >
          Sign In to Start
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function CheckIcon() {
  return (
    <svg className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
    </svg>
  );
}
