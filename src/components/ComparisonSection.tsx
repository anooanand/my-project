import { CheckCircle, XCircle, Zap, BookOpen, Brain, Target } from 'lucide-react';

export function ComparisonSection() {
  return (
    <section className="py-16 bg-gray-50 dark:bg-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900 dark:text-white">
            How Writing Mate Stands Out
          </h2>
          <p className="text-lg text-gray-700 dark:text-gray-300 max-w-3xl mx-auto">
            Unlike generic AI chatbots, Writing Mate teaches students how to write better, rather than just generating answers.
          </p>
        </div>

        {/* Comparison Table */}
        <div className="overflow-x-auto mb-12">
          <table className="w-full bg-white dark:bg-gray-900 rounded-lg overflow-hidden shadow-lg">
            <thead>
              <tr className="bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-700 dark:to-purple-700">
                <th className="px-6 py-4 text-left text-white font-semibold">Feature</th>
                <th className="px-6 py-4 text-center text-white font-semibold">Writing Mate</th>
                <th className="px-6 py-4 text-center text-white font-semibold">Generic AI Chatbots</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              <ComparisonRow
                feature="Step-by-step writing guidance"
                writingMate={true}
                generic={false}
              />
              <ComparisonRow
                feature="Follows NSW writing criteria"
                writingMate={true}
                generic={false}
              />
              <ComparisonRow
                feature="NSW exam-style feedback"
                writingMate={true}
                generic={false}
              />
              <ComparisonRow
                feature="Real-time grammar & sentence corrections"
                writingMate={true}
                generic={true}
              />
              <ComparisonRow
                feature="Adaptive learning based on skill level"
                writingMate={true}
                generic={false}
              />
              <ComparisonRow
                feature="Interactive AI coaching"
                writingMate={true}
                generic={false}
              />
              <ComparisonRow
                feature="Generates complete essays"
                writingMate={false}
                generic={true}
              />
            </tbody>
          </table>
        </div>

        {/* Key Strengths */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StrengthCard
            icon={<BookOpen className="w-8 h-8" />}
            title="Narrative Writing"
            description="Uses Story Mountain framework for engaging storytelling"
            features={["Character development", "Plot structure", "Descriptive language"]}
            color="blue"
          />

          <StrengthCard
            icon={<Target className="w-8 h-8" />}
            title="Persuasive Writing"
            description="Follows PEEEL structure for compelling arguments"
            features={["Strong thesis statements", "Evidence-based arguments", "Logical reasoning"]}
            color="purple"
          />

          <StrengthCard
            icon={<Brain className="w-8 h-8" />}
            title="NSW Exam Alignment"
            description="Built specifically for NSW writing standards"
            features={["Selective School criteria", "NAPLAN alignment", "HSC preparation"]}
            color="green"
          />

          <StrengthCard
            icon={<Zap className="w-8 h-8" />}
            title="Real-Time Feedback"
            description="Instant analysis and personalized suggestions"
            features={["Grammar corrections", "Style improvements", "Technique coaching"]}
            color="orange"
          />
        </div>

        {/* Call to Action */}
        <div className="mt-12 bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-700 dark:to-purple-700 rounded-2xl p-8 md:p-12 text-center text-white">
          <h3 className="text-3xl font-bold mb-4">Ready to Transform Your Writing?</h3>
          <p className="text-lg text-blue-100 mb-8 max-w-2xl mx-auto">
            Join thousands of NSW students who have improved their writing skills with Writing Mate.
          </p>
          <button className="inline-flex items-center px-8 py-4 bg-white text-blue-600 dark:text-blue-700 font-semibold rounded-lg hover:bg-blue-50 transition-colors duration-200">
            Start Your Free Trial Today
            <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </button>
        </div>
      </div>
    </section>
  );
}

interface ComparisonRowProps {
  feature: string;
  writingMate: boolean;
  generic: boolean;
}

function ComparisonRow({ feature, writingMate, generic }: ComparisonRowProps) {
  return (
    <tr className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
      <td className="px-6 py-4 text-gray-900 dark:text-white font-medium">{feature}</td>
      <td className="px-6 py-4 text-center">
        {writingMate ? (
          <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400 mx-auto" />
        ) : (
          <XCircle className="w-6 h-6 text-gray-400 dark:text-gray-600 mx-auto" />
        )}
      </td>
      <td className="px-6 py-4 text-center">
        {generic ? (
          <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400 mx-auto" />
        ) : (
          <XCircle className="w-6 h-6 text-gray-400 dark:text-gray-600 mx-auto" />
        )}
      </td>
    </tr>
  );
}

interface StrengthCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  features: string[];
  color: 'blue' | 'purple' | 'green' | 'orange';
}

function StrengthCard({ icon, title, description, features, color }: StrengthCardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300',
    purple: 'bg-purple-50 dark:bg-purple-900/30 border-purple-300 dark:border-purple-700 text-purple-700 dark:text-purple-300',
    green: 'bg-green-50 dark:bg-green-900/30 border-green-300 dark:border-green-700 text-green-700 dark:text-green-300',
    orange: 'bg-orange-50 dark:bg-orange-900/30 border-orange-300 dark:border-orange-700 text-orange-700 dark:text-orange-300'
  };

  return (
    <div className={`border-2 rounded-xl p-6 ${colorClasses[color]}`}>
      <div className="mb-4">{icon}</div>
      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{title}</h3>
      <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">{description}</p>
      <ul className="space-y-2">
        {features.map((feature, index) => (
          <li key={index} className="flex items-center gap-2 text-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
            {feature}
          </li>
        ))}
      </ul>
    </div>
  );
}
