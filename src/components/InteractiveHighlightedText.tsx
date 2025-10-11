import React, { useState } from 'react';
import { CheckCircle, AlertTriangle, Lightbulb, X, ArrowRight } from 'lucide-react';

interface Highlight {
  type: 'strength' | 'improvement' | 'suggestion';
  color: 'green' | 'amber' | 'blue';
  text: string;
  startIndex: number;
  endIndex: number;
  title: string;
  explanation: string;
  beforeAfter?: {
    before: string;
    after: string;
  };
}

interface InteractiveHighlightedTextProps {
  originalText: string;
  highlights: Highlight[];
}

export function InteractiveHighlightedText({ originalText, highlights }: InteractiveHighlightedTextProps) {
  const [selectedHighlight, setSelectedHighlight] = useState<Highlight | null>(null);
  const [popupPosition, setPopupPosition] = useState({ top: 0, left: 0 });

  // Sort highlights by startIndex to process them in order
  const sortedHighlights = [...highlights].sort((a, b) => a.startIndex - b.startIndex);

  // Build segments with highlighting
  const segments: Array<{ text: string; highlight?: Highlight }> = [];
  let currentIndex = 0;

  sortedHighlights.forEach((highlight) => {
    // Add text before highlight
    if (currentIndex < highlight.startIndex) {
      segments.push({
        text: originalText.substring(currentIndex, highlight.startIndex),
      });
    }

    // Add highlighted text
    segments.push({
      text: originalText.substring(highlight.startIndex, highlight.endIndex),
      highlight: highlight,
    });

    currentIndex = highlight.endIndex;
  });

  // Add remaining text
  if (currentIndex < originalText.length) {
    segments.push({
      text: originalText.substring(currentIndex),
    });
  }

  const handleHighlightClick = (highlight: Highlight, event: React.MouseEvent) => {
    const rect = (event.target as HTMLElement).getBoundingClientRect();
    setPopupPosition({
      top: rect.bottom + window.scrollY + 5,
      left: rect.left + window.scrollX,
    });
    setSelectedHighlight(highlight);
  };

  const getHighlightStyle = (color: string) => {
    const styles = {
      green: 'bg-green-100 border-b-2 border-green-400 hover:bg-green-200 cursor-pointer',
      amber: 'bg-amber-100 border-b-2 border-amber-400 hover:bg-amber-200 cursor-pointer',
      blue: 'bg-blue-100 border-b-2 border-blue-400 hover:bg-blue-200 cursor-pointer',
    };
    return styles[color as keyof typeof styles] || styles.blue;
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'strength':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'improvement':
        return <AlertTriangle className="w-5 h-5 text-amber-600" />;
      case 'suggestion':
        return <Lightbulb className="w-5 h-5 text-blue-600" />;
      default:
        return null;
    }
  };

  const getPopupBorderColor = (color: string) => {
    const colors = {
      green: 'border-green-400',
      amber: 'border-amber-400',
      blue: 'border-blue-400',
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  return (
    <div className="relative">
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="mb-4 flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="inline-block w-4 h-4 bg-green-100 border-b-2 border-green-400"></span>
            <span className="text-gray-600">Strengths</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block w-4 h-4 bg-amber-100 border-b-2 border-amber-400"></span>
            <span className="text-gray-600">Improvements</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block w-4 h-4 bg-blue-100 border-b-2 border-blue-400"></span>
            <span className="text-gray-600">Suggestions</span>
          </div>
        </div>

        <div className="text-base leading-relaxed text-gray-800">
          {segments.map((segment, index) => {
            if (segment.highlight) {
              return (
                <span
                  key={index}
                  className={`${getHighlightStyle(segment.highlight.color)} transition-colors duration-150`}
                  onClick={(e) => handleHighlightClick(segment.highlight!, e)}
                >
                  {segment.text}
                </span>
              );
            }
            return <span key={index}>{segment.text}</span>;
          })}
        </div>
      </div>

      {/* Pop-up explanation modal */}
      {selectedHighlight && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black bg-opacity-20 z-40"
            onClick={() => setSelectedHighlight(null)}
          />

          {/* Popup */}
          <div
            className={`fixed z-50 bg-white rounded-lg shadow-2xl border-2 ${getPopupBorderColor(
              selectedHighlight.color
            )} max-w-md w-full`}
            style={{
              top: `${popupPosition.top}px`,
              left: `${popupPosition.left}px`,
              maxHeight: '400px',
              overflowY: 'auto',
            }}
          >
            <div className="p-4">
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  {getIcon(selectedHighlight.type)}
                  <h3 className="font-semibold text-gray-900">{selectedHighlight.title}</h3>
                </div>
                <button
                  onClick={() => setSelectedHighlight(null)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Selected text */}
              <div className={`p-3 rounded-md mb-3 ${getHighlightStyle(selectedHighlight.color).split(' ')[0]}`}>
                <p className="text-sm italic text-gray-700">"{selectedHighlight.text}"</p>
              </div>

              {/* Explanation */}
              <div className="mb-3">
                <p className="text-sm text-gray-700 leading-relaxed">{selectedHighlight.explanation}</p>
              </div>

              {/* Before/After comparison */}
              {selectedHighlight.beforeAfter && (
                <div className="space-y-2">
                  <div className="border-t pt-3">
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-2">
                      How to improve:
                    </p>

                    <div className="bg-red-50 border border-red-200 rounded-md p-2 mb-2">
                      <p className="text-xs font-medium text-red-600 mb-1">Before:</p>
                      <p className="text-sm text-gray-700">{selectedHighlight.beforeAfter.before}</p>
                    </div>

                    <div className="flex justify-center my-1">
                      <ArrowRight className="w-4 h-4 text-gray-400" />
                    </div>

                    <div className="bg-green-50 border border-green-200 rounded-md p-2">
                      <p className="text-xs font-medium text-green-600 mb-1">After:</p>
                      <p className="text-sm text-gray-700">{selectedHighlight.beforeAfter.after}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
