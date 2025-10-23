import React from 'react';
import { ArrowRight, BookOpen, Edit, Lightbulb, MessageSquare, PenTool, Search, Users } from 'lucide-react';

interface NewWritingTypesSectionProps {
  onSignInClick: () => void;
}

export const NewWritingTypesSection: React.FC<NewWritingTypesSectionProps> = ({ onSignInClick }) => {
  const writingTypes = [
    {
      title: "Narrative Writing",
      description: "Craft compelling stories with vivid descriptions and engaging plots.",
      icon: <BookOpen className="w-8 h-8 text-blue-600" />,
      color: "bg-blue-100",
      hoverColor: "hover:border-blue-400",
      gradient: "from-blue-500 to-blue-600"
    },
    {
      title: "Persuasive Writing",
      description: "Develop strong arguments and convince your audience with clear, concise language.",
      icon: <Lightbulb className="w-8 h-8 text-green-600" />,
      color: "bg-green-100",
      hoverColor: "hover:border-green-400",
      gradient: "from-green-500 to-green-600"
    },
    {
      title: "Discursive Writing",
      description: "Explore complex topics from multiple perspectives, presenting balanced views.",
      icon: <MessageSquare className="w-8 h-8 text-purple-600" />,
      color: "bg-purple-100",
      hoverColor: "hover:border-purple-400",
      gradient: "from-purple-500 to-purple-600"
    },
    {
      title: "Poetic Writing",
      description: "Express emotions and ideas through rhythm, imagery, and figurative language.",
      icon: <PenTool className="w-8 h-8 text-red-600" />,
      color: "bg-red-100",
      hoverColor: "hover:border-red-400",
      gradient: "from-red-500 to-red-600"
    },
    {
      title: "Expository Writing",
      description: "Inform and explain subjects clearly and comprehensively with factual details.",
      icon: <Search className="w-8 h-8 text-yellow-600" />,
      color: "bg-yellow-100",
      hoverColor: "hover:border-yellow-400",
      gradient: "from-yellow-500 to-yellow-600"
    },
    {
      title: "Reflective Writing",
      description: "Analyze personal experiences and insights, fostering self-awareness and growth.",
      icon: <Edit className="w-8 h-8 text-indigo-600" />,
      color: "bg-indigo-100",
      hoverColor: "hover:border-indigo-400",
      gradient: "from-indigo-500 to-indigo-600"
    },
  ];

  return (
    <section className="py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Master Every Type of Writing for NSW Exams
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Our AI-powered coach provides tailored feedback for all major writing styles, ensuring you're prepared for any task.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {writingTypes.map((type, index) => (
            <div
              key={index}
              className={`bg-white rounded-2xl p-8 border border-gray-200 shadow-lg ${type.hoverColor} transition-all duration-300 ease-in-out transform hover:-translate-y-2`}
            >
              <div className={`w-16 h-16 ${type.color} rounded-full flex items-center justify-center mb-6 mx-auto`}>
                {type.icon}
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3 text-center">{type.title}</h3>
              <p className="text-gray-600 text-center mb-6">{type.description}</p>
              <div className="text-center">
                <button
                  onClick={onSignInClick}
                  className={`inline-flex items-center justify-center px-6 py-3 text-base font-semibold text-white bg-gradient-to-r ${type.gradient} rounded-xl hover:shadow-xl transition-all duration-200`}
                >
                  Start Practicing
                  <ArrowRight className="ml-2 w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-16">
          <p className="text-xl text-gray-700 mb-6">
            Not sure where to start? Our intelligent system can guide you.
          </p>
          <button
            onClick={onSignInClick}
            className="inline-flex items-center justify-center px-10 py-4 text-lg font-semibold text-white bg-gradient-to-r from-blue-600 to-purple-700 rounded-xl hover:shadow-xl transform hover:scale-105 transition-all duration-200"
          >
            Discover Your Writing Path
            <ArrowRight className="ml-2 w-5 h-5" />
          </button>
        </div>
      </div>
    </section>
  );
};
