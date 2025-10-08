// src/components/InlineTextHighlighter.tsx
import React, { useMemo } from 'react';

interface HighlightRule {
  pattern: RegExp;
  className: string;
  tooltip: string;
}

interface InlineTextHighlighterProps {
  text: string;
  darkMode?: boolean;
}

export const InlineTextHighlighter: React.FC<InlineTextHighlighterProps> = ({ text, darkMode = false }) => {
  // Define weak words and grammar patterns
  const highlightRules: HighlightRule[] = useMemo(() => [
    // Weak verbs
    {
      pattern: /\b(is|are|was|were|be|been|being)\b/gi,
      className: 'weak-verb',
      tooltip: 'Consider using a stronger verb'
    },
    // Overused words
    {
      pattern: /\b(very|really|just|actually|basically|literally)\b/gi,
      className: 'overused',
      tooltip: 'This word is often unnecessary'
    },
    // Passive voice indicators
    {
      pattern: /\b(was|were|been)\s+\w+ed\b/gi,
      className: 'passive',
      tooltip: 'Consider active voice'
    },
    // Weak adjectives
    {
      pattern: /\b(good|bad|nice|big|small)\b/gi,
      className: 'weak-adjective',
      tooltip: 'Consider a more specific adjective'
    }
  ], []);

  const highlightedText = useMemo(() => {
    if (!text) return [];

    const words = text.split(/(\s+)/);
    return words.map((word, index) => {
      if (/^\s+$/.test(word)) {
        return { text: word, type: 'space', key: `space-${index}` };
      }

      for (const rule of highlightRules) {
        if (rule.pattern.test(word)) {
          return {
            text: word,
            type: rule.className,
            tooltip: rule.tooltip,
            key: `highlight-${index}`
          };
        }
      }

      return { text: word, type: 'normal', key: `word-${index}` };
    });
  }, [text, highlightRules]);

  if (!text) return null;

  return (
    <div className={`absolute inset-0 pointer-events-none p-4 font-mono whitespace-pre-wrap break-words ${
      darkMode ? 'text-transparent' : 'text-transparent'
    }`} style={{ zIndex: 1 }}>
      {highlightedText.map((item) => {
        if (item.type === 'space') {
          return <span key={item.key}>{item.text}</span>;
        }

        if (item.type === 'normal') {
          return <span key={item.key} className="text-transparent">{item.text}</span>;
        }

        // Highlighted words
        const colorClass =
          item.type === 'weak-verb' ? 'bg-yellow-200 dark:bg-yellow-900/40 text-transparent' :
          item.type === 'overused' ? 'bg-orange-200 dark:bg-orange-900/40 text-transparent' :
          item.type === 'passive' ? 'bg-blue-200 dark:bg-blue-900/40 text-transparent' :
          item.type === 'weak-adjective' ? 'bg-purple-200 dark:bg-purple-900/40 text-transparent' :
          'text-transparent';

        return (
          <span
            key={item.key}
            className={`${colorClass} rounded-sm relative group`}
            title={item.tooltip}
          >
            {item.text}
            <span className="absolute bottom-full left-0 mb-1 hidden group-hover:block bg-gray-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap z-10">
              {item.tooltip}
            </span>
          </span>
        );
      })}
    </div>
  );
};
