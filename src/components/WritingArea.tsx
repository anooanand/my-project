import React from 'react';
import { Target } from 'lucide-react';

interface Props {
  content?: string;
  onChange?: (content: string) => void;
  placeholder?: string;
  focusMode?: boolean;
  onSubmit?: () => void;
  evaluationStatus?: "idle" | "loading" | "success" | "error";
  wordCount?: number;
}

function WritingArea({ 
  content = '', 
  onChange, 
  placeholder = 'Start writing...', 
  focusMode = false,
  onSubmit,
  evaluationStatus = "idle",
  wordCount = 0
}: Props) {
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange?.(e.target.value);
  };

  const handleSubmitForEvaluation = async () => {
    if (onSubmit) {
      await onSubmit();
    }
  };

  return (
    <div className="relative w-full h-full" style={{ minHeight: '400px' }}>
      <textarea
        className={`w-full h-full p-3 pr-12 pb-20 rounded-lg border resize-none outline-none transition-all duration-300 ${
          focusMode ? 'bg-gray-800 text-white text-lg border-gray-600' : 'bg-white text-gray-700'
        }`}
        placeholder={placeholder}
        value={content}
        onChange={handleChange}
        style={{ minHeight: '400px' }}
      />
      
      {/* Submit for Evaluation Button - positioned prominently at the bottom center */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-white via-white to-transparent dark:from-gray-800 dark:via-gray-800 dark:to-transparent">
        <button
          onClick={handleSubmitForEvaluation}
          disabled={evaluationStatus === "loading" || wordCount < 10}
          className={`w-full inline-flex items-center justify-center px-6 py-3 text-base font-semibold rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 ${
            evaluationStatus === "loading" 
              ? 'bg-gray-400 text-white cursor-not-allowed' 
              : wordCount < 10
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-gradient-to-r from-green-600 to-blue-600 text-white hover:from-green-700 hover:to-blue-700'
          }`}
          title="Submit your writing for evaluation and feedback"
        >
          {evaluationStatus === "loading" ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-3"></div>
              Analyzing Your Writing...
            </>
          ) : (
            <>
              <Target className="h-5 w-5 mr-3" />
              Submit for Evaluation
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export default WritingArea;
