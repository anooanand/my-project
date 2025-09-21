import React, { useState, useEffect } from 'react';
import { Lightbulb, Sparkles, ArrowRight, RefreshCcw } from 'lucide-react';

interface SentenceImprovementPanelProps {
  content: string;
  textType: string;
  onApplyImprovement?: (original: string, improved: string) => void;
  className?: string;
}

interface SentenceExample {
  original: string;
  improved: string;
  explanation: string;
  type: 'clarity' | 'conciseness' | 'vocabulary' | 'structure';
}

// Examples are now focused on NSW Selective Test level
const SAMPLE_SENTENCE_EXAMPLES: SentenceExample[] = [
  {
    original: 'The student wrote a good essay.',
    improved: 'The diligent student crafted a compelling essay.',
    explanation: 'Replaced \'good\' with \'compelling\' and added \'diligent\' to describe the student, enhancing vocabulary and impact.',
    type: 'vocabulary',
  },
  {
    original: 'Because of the fact that it was raining, we stayed inside.',
    improved: 'As it was raining, we stayed inside.',
    explanation: 'Simplified the phrase \'Because of the fact that\' to \'As\', making the sentence more concise.',
    type: 'conciseness',
  },
  {
    original: 'He was very sad when his pet died.',
    improved: 'A profound sorrow enveloped him upon the demise of his beloved pet.',
    explanation: 'Used more sophisticated vocabulary (profound sorrow, enveloped, demise) and a more formal structure.',
    type: 'vocabulary',
  },
  {
    original: 'The book was interesting to read.',
    improved: 'The book offered a captivating narrative, engaging readers from the very first page.',
    explanation: 'Provided more specific details about why the book was interesting and improved sentence structure.',
    type: 'structure',
  },
];

export const SentenceImprovementPanel: React.FC<SentenceImprovementPanelProps> = ({
  content,
  textType,
  onApplyImprovement,
  className = ""
}) => {
  const [examples, setExamples] = useState<SentenceExample[]>([]);

  useEffect(() => {
    // All examples are now geared towards the selective test level
    setExamples(SAMPLE_SENTENCE_EXAMPLES);
  }, []);

  return (
    <div className={`bg-white rounded-lg border shadow-sm ${className}`}>
      <div className="p-4 border-b bg-gradient-to-r from-yellow-50 to-orange-50">
        <div className="flex items-center space-x-2">
          <Sparkles className="h-5 w-5 text-orange-600" />
          <h3 className={'font-semibold text-gray-800 text-xl'}>
            Sentence Improvement Lab
          </h3>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <p className={'text-gray-700 text-sm'}>
          See how you can transform simple sentences into more impactful and sophisticated ones.
        </p>

        {examples.map((example, index) => (
          <div key={index} className="border rounded-lg p-3 bg-gray-50">
            <div className="mb-2">
              <p className={'font-medium text-gray-700 text-sm'}>Original:</p>
              <p className={'text-red-600 italic text-sm'}>"{example.original}"</p>
            </div>
            <div className="mb-2 flex items-center space-x-2">
              <p className={'font-medium text-gray-700 text-sm'}>Improved:</p>
              <ArrowRight className="h-4 w-4 text-green-600" />
              <p className={'text-green-600 italic text-sm'}>"{example.improved}"</p>
            </div>
            <div className="mb-2">
              <p className={'font-medium text-gray-700 text-sm'}>Explanation:</p>
              <p className={'text-gray-600 text-xs'}>{example.explanation}</p>
            </div>
            {onApplyImprovement && (
              <div className="mt-3 flex justify-end">
                <button
                  onClick={() => onApplyImprovement(example.original, example.improved)}
                  className="px-3 py-1 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition-colors flex items-center space-x-1"
                >
                  <RefreshCcw className="h-3 w-3" />
                  <span>Apply Suggestion</span>
                </button>
              </div>
            )}
          </div>
        ))}

        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <div className="flex items-start space-x-2">
            <Lightbulb className="flex-shrink-0 h-5 w-5 text-blue-600" />
            <p className="text-sm text-blue-700">
              <strong>Pro Tip:</strong> Try to identify sentences in your writing that could be improved using these techniques!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SentenceImprovementPanel;
