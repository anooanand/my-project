import React, { useState } from 'react';
import { BookOpen, Lightbulb, CheckCircle, XCircle, ChevronDown, ChevronUp, X } from 'lucide-react';
import { getTextTypeStructure, type TextTypeStructure, type TextTypePhase } from '../lib/textTypeStructures';

interface TipsModalProps {
  isOpen: boolean;
  onClose: () => void;
  textType?: string;
}

export const TipsModal: React.FC<TipsModalProps> = ({ isOpen, onClose, textType = 'narrative' }) => {
  const [expandedPhases, setExpandedPhases] = useState<{ [key: string]: boolean }>({});

  if (!isOpen) return null;

  const structure: TextTypeStructure = getTextTypeStructure(textType);

  const togglePhase = (phaseId: string) => {
    setExpandedPhases(prev => ({
      ...prev,
      [phaseId]: !prev[phaseId]
    }));
  };

  const renderPhaseContent = (phase: TextTypePhase) => (
    <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
      <p className="text-gray-700 dark:text-gray-300 mb-4 text-sm leading-relaxed">
        {phase.description}
      </p>
      
      <div className="grid md:grid-cols-2 gap-4">
        {/* Sentence Starters */}
        <div className="bg-blue-50 dark:bg-blue-900/30 p-3 rounded-lg border border-blue-200 dark:border-blue-700">
          <h4 className="font-semibold text-blue-800 dark:text-blue-300 mb-2 text-sm flex items-center">
            <Lightbulb className="h-4 w-4 mr-1" />
            Sentence Starters
          </h4>
          <ul className="space-y-1">
            {phase.sentenceStarters.map((starter, idx) => (
              <li key={idx} className="text-xs text-blue-700 dark:text-blue-300 bg-white dark:bg-gray-700 p-2 rounded border border-gray-200 dark:border-gray-600">
                "{starter}"
              </li>
            ))}
          </ul>
        </div>

        {/* Power Words */}
        <div className="bg-purple-50 dark:bg-purple-900/30 p-3 rounded-lg border border-purple-200 dark:border-purple-700">
          <h4 className="font-semibold text-purple-800 dark:text-purple-300 mb-2 text-sm flex items-center">
            <CheckCircle className="h-4 w-4 mr-1" />
            Power Words
          </h4>
          <div className="flex flex-wrap gap-1">
            {phase.powerWords.map((word, idx) => (
              <span key={idx} className="text-xs bg-purple-200 dark:bg-purple-800 text-purple-800 dark:text-purple-200 px-2 py-1 rounded-full">
                {word}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Sensory Details (for narrative and descriptive) */}
      {phase.sensoryDetails && (
        <div className="mt-4 bg-yellow-50 dark:bg-yellow-900/30 p-3 rounded-lg border border-yellow-200 dark:border-yellow-700">
          <h4 className="font-semibold text-yellow-800 dark:text-yellow-300 mb-2 text-sm">
            🌟 Sensory Details to Bring Your Writing to Life
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
            {Object.entries(phase.sensoryDetails).map(([sense, details]) => (
              <div key={sense} className="bg-white dark:bg-slate-700 p-2 rounded border border-gray-200 dark:border-slate-600">
                <div className="font-medium text-yellow-800 dark:text-yellow-300 capitalize mb-1">{sense}:</div>
                <div className="space-y-1">
                  {details.slice(0, 3).map((detail, idx) => (
                    <div key={idx} className="text-yellow-700 dark:text-yellow-300">{detail}</div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Key Elements (for non-narrative types) */}
      {phase.keyElements && (
        <div className="mt-4 bg-green-50 dark:bg-green-900/30 p-3 rounded-lg border border-green-200 dark:border-green-700">
          <h4 className="font-semibold text-green-800 dark:text-green-300 mb-2 text-sm">
            🎯 Key Elements to Include
          </h4>
          <ul className="space-y-1">
            {phase.keyElements.map((element, idx) => (
              <li key={idx} className="text-xs text-green-700 dark:text-green-300 bg-white dark:bg-gray-700 p-2 rounded border border-gray-200 dark:border-gray-600 flex items-center">
                <CheckCircle className="h-3 w-3 mr-2 text-green-600" />
                {element}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Transition Words (for structured writing types) */}
      {phase.transitionWords && (
        <div className="mt-4 bg-orange-50 dark:bg-orange-900/30 p-3 rounded-lg border border-orange-200 dark:border-orange-700">
          <h4 className="font-semibold text-orange-800 dark:text-orange-300 mb-2 text-sm">
            🔗 Transition Words
          </h4>
          <div className="flex flex-wrap gap-1">
            {phase.transitionWords.map((word, idx) => (
              <span key={idx} className="text-xs bg-orange-200 dark:bg-orange-800 text-orange-800 dark:text-orange-200 px-2 py-1 rounded-full">
                {word}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 bg-gray-600 dark:bg-gray-900 bg-opacity-50 dark:bg-opacity-80 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border border-gray-200 dark:border-gray-700 w-11/12 md:w-4/5 lg:w-3/4 xl:w-2/3 shadow-lg rounded-md bg-white dark:bg-gray-800 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center pb-3 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <BookOpen className="h-6 w-6 text-green-600" />
            <h3 className="text-xl font-bold text-green-800 dark:text-green-300">{structure.title}</h3>
          </div>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="mt-4">
          <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/30 dark:to-blue-900/30 border border-green-200 dark:border-green-700 rounded-lg">
            <p className="text-gray-700 dark:text-gray-300 text-sm">
              {structure.description}
            </p>
          </div>

          <div className="space-y-4">
            {structure.phases.map((phase, index) => (
              <div key={phase.id} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                <button
                  onClick={() => togglePhase(phase.id)}
                  className="w-full p-4 text-left bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-700 hover:from-gray-100 hover:to-gray-200 dark:hover:from-gray-600 dark:hover:to-gray-600 transition-colors duration-200 flex justify-between items-center"
                >
                  <span className="font-semibold text-gray-800 dark:text-gray-200">{phase.title}</span>
                  {expandedPhases[phase.id] ? 
                    <ChevronUp className="h-5 w-5 text-gray-600 dark:text-gray-400" /> : 
                    <ChevronDown className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                  }
                </button>
                
                {expandedPhases[phase.id] && renderPhaseContent(phase)}
              </div>
            ))}
          </div>

          {/* Pro Tip */}
          <div className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/30 border border-purple-200 dark:border-purple-700 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <Lightbulb className="h-5 w-5 text-purple-600" />
              <span className="font-semibold text-purple-800 dark:text-purple-300">💡 Pro Writing Tip</span>
            </div>
            <p className="text-sm text-purple-700 dark:text-purple-300">
              {structure.proTip}
            </p>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="w-full px-4 py-3 bg-green-600 dark:bg-green-700 text-white text-base font-medium rounded-lg shadow-sm hover:bg-green-700 dark:hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-300 transition-colors"
          >
            Start Writing Your {textType.charAt(0).toUpperCase() + textType.slice(1)}! 🚀
          </button>
        </div>
      </div>
    </div>
  );
};