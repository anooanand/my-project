import React from 'react';
import { Send, Sparkles } from 'lucide-react';

interface NSWSubmitButtonProps {
  content: string;
  wordCount: number;
  isSubmitting: boolean;
  onSubmit: () => void;
  darkMode?: boolean;
  minWords?: number;
}

export function NSWSubmitButton({
  content,
  wordCount,
  isSubmitting,
  onSubmit,
  darkMode = false,
  minWords = 50
}: NSWSubmitButtonProps) {
  const hasEnoughWords = wordCount >= minWords;
  const hasContent = content.trim().length > 0;
  const canSubmit = hasContent && hasEnoughWords && !isSubmitting;

  return (
    <div className="w-full">
      <button
        onClick={onSubmit}
        disabled={!canSubmit}
        className={`
          w-full py-4 px-6 rounded-lg font-semibold text-white
          transition-all duration-200 flex items-center justify-center gap-3
          ${canSubmit
            ? darkMode
              ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-lg hover:shadow-xl'
              : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-lg hover:shadow-xl'
            : darkMode
            ? 'bg-gray-700 cursor-not-allowed opacity-50'
            : 'bg-gray-300 cursor-not-allowed opacity-50'
          }
        `}
      >
        {isSubmitting ? (
          <>
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            <span>Analyzing with AI...</span>
          </>
        ) : (
          <>
            <Sparkles className="w-5 h-5" />
            <span>
              {!hasContent
                ? 'Write something to submit'
                : !hasEnoughWords
                ? `Need ${minWords - wordCount} more words`
                : `Submit for AI Evaluation (${wordCount} words)`}
            </span>
            <Send className="w-5 h-5" />
          </>
        )}
      </button>

      {hasContent && !hasEnoughWords && (
        <p className={`text-sm text-center mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          Minimum {minWords} words required
        </p>
      )}
    </div>
  );
}
