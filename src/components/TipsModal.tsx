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
    <div className="p-4 bg-white border-t">
      <p className="text-gray-700 mb-4 text-sm leading-relaxed">
        {phase.description}
      </p>
      
      <div className="grid md:grid-cols-2 gap-4">
        {/* Sentence Starters */}
        <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
          <h4 className="font-semibold text-blue-800 mb-2 text-sm flex items-center">
            <Lightbulb className="h-4 w-4 mr-1" />
            Sentence Starters
          </h4>
          <ul className="space-y-1">
            {phase.sentenceStarters.map((starter, idx) => (
              <li key={idx} className="text-xs text-blue-700 bg-white p-2 rounded border">
                "{starter}"
              </li>
            ))}
          </ul>
        </div>

        {/* Power Words */}
        <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
          <h4 className="font-semibold text-purple-800 mb-2 text-sm flex items-center">
            <CheckCircle className="h-4 w-4 mr-1" />
            Power Words
          </h4>
          <div className="flex flex-wrap gap-1">
            {phase.powerWords.map((word, idx) => (
              <span key={idx} className="text-xs bg-purple-200 text-purple-800 px-2 py-1 rounded-full">
                {word}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Sensory Details (for narrative and descriptive) */}
      {phase.sensoryDetails && (
        <div className="mt-4 bg-yellow-50 p-3 rounded-lg border border-yellow-200">
          <h4 className="font-semibold text-yellow-800 mb-2 text-sm">
            🌟 Sensory Details to Bring Your Writing to Life
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
            {Object.entries(phase.sensoryDetails).map(([sense, details]) => (
              <div key={sense} className="bg-white p-2 rounded border">
                <div className="font-medium text-yellow-800 capitalize mb-1">{sense}:</div>
                <div className="space-y-1">
                  {details.slice(0, 3).map((detail, idx) => (
                    <div key={idx} className="text-yellow-700">{detail}</div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Key Elements (for non-narrative types) */}
      {phase.keyElements && (
        <div className="mt-4 bg-green-50 p-3 rounded-lg border border-green-200">
          <h4 className="font-semibold text-green-800 mb-2 text-sm">
            🎯 Key Elements to Include
          </h4>
          <ul className="space-y-1">
            {phase.keyElements.map((element, idx) => (
              <li key={idx} className="text-xs text-green-700 bg-white p-2 rounded border flex items-center">
                <CheckCircle className="h-3 w-3 mr-2 text-green-600" />
                {element}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Transition Words (for structured writing types) */}
      {phase.transitionWords && (
        <div className="mt-4 bg-orange-50 p-3 rounded-lg border border-orange-200">
          <h4 className="font-semibold text-orange-800 mb-2 text-sm">
            🔗 Transition Words
          </h4>
          <div className="flex flex-wrap gap-1">
            {phase.transitionWords.map((word, idx) => (
              <span key={idx} className="text-xs bg-orange-200 text-orange-800 px-2 py-1 rounded-full">
                {word}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-11/12 md:w-4/5 lg:w-3/4 xl:w-2/3 shadow-lg rounded-md bg-white max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center pb-3 border-b">
          <div className="flex items-center space-x-2">
            <BookOpen className="h-6 w-6 text-green-600" />
            <h3 className="text-xl font-bold text-green-800">{structure.title}</h3>
          </div>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="mt-4">
          <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg">
            <p className="text-gray-700 text-sm">
              {structure.description}
            </p>
          </div>

          <div className="space-y-4">
            {structure.phases.map((phase, index) => (
              <div key={phase.id} className="border rounded-lg overflow-hidden">
                <button
                  onClick={() => togglePhase(phase.id)}
                  className="w-full p-4 text-left bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 transition-colors duration-200 flex justify-between items-center"
                >
                  <span className="font-semibold text-gray-800">{phase.title}</span>
                  {expandedPhases[phase.id] ? 
                    <ChevronUp className="h-5 w-5 text-gray-600" /> : 
                    <ChevronDown className="h-5 w-5 text-gray-600" />
                  }
                </button>
                
                {expandedPhases[phase.id] && renderPhaseContent(phase)}
              </div>
            ))}
          </div>

          {/* Pro Tip */}
          <div className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <Lightbulb className="h-5 w-5 text-purple-600" />
              <span className="font-semibold text-purple-800">💡 Pro Writing Tip</span>
            </div>
            <p className="text-sm text-purple-700">
              {structure.proTip}
            </p>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t">
          <button
            onClick={onClose}
            className="w-full px-4 py-3 bg-green-600 text-white text-base font-medium rounded-lg shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-300 transition-colors"
          >
            Start Writing Your {textType.charAt(0).toUpperCase() + textType.slice(1)}! 🚀
          </button>
        </div>
      </div>
    </div>
  );
};