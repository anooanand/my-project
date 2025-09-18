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
        className={`w-full h-full p-3 pr-12 pb-16 rounded-lg border resize-none outline-none transition-all duration-300 ${
          focusMode ? 'bg-gray-800 text-white text-lg border-gray-600' : 'bg-white text-gray-700'
        }`}
        placeholder={placeholder}
        value={content}
        onChange={handleChange}
        style={{ minHeight: '400px' }}
      />
      
      {/* Submit for Evaluation Button - positioned at bottom right */}
      <button
        onClick={handleSubmitForEvaluation}
        disabled={evaluationStatus === "loading" || wordCount < 10}
        className={`absolute bottom-3 right-3 inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-200 shadow-lg ${
          evaluationStatus === "loading" 
            ? 'bg-gray-400 text-white cursor-not-allowed' 
            : wordCount < 10
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-green-600 text-white hover:bg-green-700'
        }`}
        title="Submit your writing for evaluation and feedback"
      >
        {evaluationStatus === "loading" ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
            Analyzing...
          </>
        ) : (
          <>
            <Target className="h-4 w-4 mr-2" />
            Submit for Evaluation
          </>
        )}
      </button>
    </div>
  );
}

export default WritingArea;
