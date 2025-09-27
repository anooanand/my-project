import React, { useState } from 'react';
import { 
  AlertCircle, 
  Check, 
  Eye, 
  EyeOff, 
  ChevronDown, 
  ChevronRight,
  TrendingUp,
  Award,
  Target,
  Zap,
  BookOpen,
  Lightbulb,
  X
} from 'lucide-react';
import { GrammarError, GrammarCheckResult } from '../types/grammarChecker';
import { ERROR_LEGEND } from '../lib/grammarCheckerConfig';

interface ErrorSummaryPanelProps {
  checkResult: GrammarCheckResult | null;
  ignoredErrors: Set<string>;
  onErrorClick: (error: GrammarError) => void;
  onIgnoreError: (errorId: string) => void;
  onFixError: (error: GrammarError, suggestion: string) => void;
  darkMode?: boolean;
  className?: string;
}

export const ErrorSummaryPanel: React.FC<ErrorSummaryPanelProps> = ({
  checkResult,
  ignoredErrors,
  onErrorClick,
  onIgnoreError,
  onFixError,
  darkMode = false,
  className = ""
}) => {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['spelling', 'grammar']));
  const [showIgnored, setShowIgnored] = useState(false);

  if (!checkResult) {
    return (
      <div className={`${className} p-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
        <div className="text-center">
          <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Start writing to see grammar suggestions</p>
        </div>
      </div>
    );
  }

  const activeErrors = checkResult.errors.filter(error => !ignoredErrors.has(error.id));
  const ignoredErrorsList = checkResult.errors.filter(error => ignoredErrors.has(error.id));

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  const getErrorsByCategory = (errors: GrammarError[]) => {
    const categorized: Record<string, GrammarError[]> = {};
    
    ERROR_LEGEND.forEach(category => {
      categorized[category.type] = errors.filter(error => error.type === category.type);
    });
    
    return categorized;
  };

  const activeErrorsByCategory = getErrorsByCategory(activeErrors);
  const ignoredErrorsByCategory = getErrorsByCategory(ignoredErrorsList);

  return (
    <div className={`${className} flex flex-col h-full ${
      darkMode ? 'bg-gray-800 text-gray-200' : 'bg-white text-gray-800'
    }`}>
      {/* Header */}
      <div className={`p-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold flex items-center">
            <Target className="w-5 h-5 mr-2 text-purple-500" />
            Writing Analysis
          </h3>
          <div className={`px-2 py-1 rounded-full text-xs font-medium ${
            checkResult.overallScore >= 90 ? 'bg-green-100 text-green-800' :
            checkResult.overallScore >= 70 ? 'bg-yellow-100 text-yellow-800' :
            'bg-red-100 text-red-800'
          }`}>
            {checkResult.overallScore}%
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className={`p-2 rounded-lg ${
            darkMode ? 'bg-gray-700' : 'bg-gray-50'
          }`}>
            <div className="flex items-center space-x-2">
              {activeErrors.length === 0 ? (
                <Check className="w-4 h-4 text-green-500" />
              ) : (
                <AlertCircle className="w-4 h-4 text-orange-500" />
              )}
              <span className="font-medium">
                {activeErrors.length} Issues
              </span>
            </div>
          </div>
          
          <div className={`p-2 rounded-lg ${
            darkMode ? 'bg-gray-700' : 'bg-gray-50'
          }`}>
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-blue-500" />
              <span className="font-medium">
                Score: {checkResult.overallScore}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Achievements */}
      {checkResult.achievements && checkResult.achievements.length > 0 && (
        <div className={`p-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <h4 className="text-sm font-semibold mb-2 flex items-center text-yellow-600">
            <Award className="w-4 h-4 mr-2" />
            🏆 Achievements
          </h4>
          <div className="space-y-1">
            {checkResult.achievements.map((achievement, index) => (
              <div key={index} className={`flex items-center space-x-2 p-2 rounded-md ${
                darkMode ? 'bg-yellow-900/20' : 'bg-yellow-50'
              }`}>
                <Zap className="w-3 h-3 text-yellow-500" />
                <span className="text-xs text-yellow-700 dark:text-yellow-300">
                  {achievement}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error Categories */}
      <div className="flex-1 overflow-y-auto">
        {ERROR_LEGEND.map(category => {
          const categoryErrors = activeErrorsByCategory[category.type] || [];
          const isExpanded = expandedCategories.has(category.type);
          
          if (categoryErrors.length === 0) return null;

          return (
            <div key={category.type} className={`border-b ${
              darkMode ? 'border-gray-700' : 'border-gray-200'
            }`}>
              <button
                onClick={() => toggleCategory(category.type)}
                className={`w-full p-3 flex items-center justify-between hover:bg-opacity-50 transition-colors ${
                  darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <span className="text-lg">{category.icon}</span>
                  <div className="text-left">
                    <div className="font-medium text-sm">{category.name}</div>
                    <div className="text-xs opacity-75">
                      {categoryErrors.length} issue{categoryErrors.length !== 1 ? 's' : ''}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                    style={{ backgroundColor: category.color }}
                  >
                    {categoryErrors.length}
                  </div>
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </div>
              </button>

              {isExpanded && (
                <div className="pb-2">
                  {categoryErrors.map(error => (
                    <div
                      key={error.id}
                      className={`mx-3 mb-2 p-3 rounded-lg border cursor-pointer transition-colors ${
                        darkMode 
                          ? 'bg-gray-700 border-gray-600 hover:bg-gray-600' 
                          : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                      }`}
                      onClick={() => onErrorClick(error)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="text-sm font-medium mb-1">
                            {error.message}
                          </div>
                          <div className="text-xs opacity-75 mb-2">
                            "{error.originalText}"
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onIgnoreError(error.id);
                          }}
                          className={`p-1 rounded-full hover:bg-opacity-20 transition-colors ${
                            darkMode ? 'hover:bg-gray-500' : 'hover:bg-gray-400'
                          }`}
                          title="Ignore this error"
                        >
                          <EyeOff className="w-3 h-3" />
                        </button>
                      </div>

                      {error.suggestions.length > 0 && (
                        <div className="space-y-1">
                          <div className="text-xs font-medium opacity-75">Suggestions:</div>
                          {error.suggestions.slice(0, 2).map((suggestion, index) => (
                            <button
                              key={index}
                              onClick={(e) => {
                                e.stopPropagation();
                                onFixError(error, suggestion);
                              }}
                              className={`block w-full text-left px-2 py-1 text-xs rounded transition-colors ${
                                darkMode 
                                  ? 'bg-blue-900/30 text-blue-300 hover:bg-blue-900/50' 
                                  : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                              }`}
                            >
                              ✓ {suggestion}
                            </button>
                          ))}
                        </div>
                      )}

                      {error.nswSpecific && (
                        <div className={`mt-2 px-2 py-1 rounded text-xs ${
                          darkMode ? 'bg-purple-900/30 text-purple-300' : 'bg-purple-100 text-purple-700'
                        }`}>
                          🎯 NSW Selective Test Specific
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {activeErrors.length === 0 && (
          <div className="p-6 text-center">
            <Check className="w-12 h-12 mx-auto mb-3 text-green-500" />
            <h4 className="font-semibold text-green-600 mb-2">Excellent Work!</h4>
            <p className="text-sm opacity-75">
              No grammar or style issues detected. Keep up the great writing!
            </p>
          </div>
        )}
      </div>

      {/* Suggestions */}
      {checkResult.suggestions && checkResult.suggestions.length > 0 && (
        <div className={`p-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <h4 className="text-sm font-semibold mb-2 flex items-center">
            <Lightbulb className="w-4 h-4 mr-2 text-yellow-500" />
            💡 Writing Tips
          </h4>
          <div className="space-y-2">
            {checkResult.suggestions.slice(0, 3).map((suggestion, index) => (
              <div key={index} className={`p-2 rounded-md text-xs ${
                darkMode ? 'bg-blue-900/20 text-blue-300' : 'bg-blue-50 text-blue-700'
              }`}>
                {suggestion}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Ignored Errors Toggle */}
      {ignoredErrorsList.length > 0 && (
        <div className={`p-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <button
            onClick={() => setShowIgnored(!showIgnored)}
            className={`w-full flex items-center justify-between text-sm ${
              darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-700'
            }`}
          >
            <span className="flex items-center space-x-2">
              <EyeOff className="w-4 h-4" />
              <span>Ignored Issues ({ignoredErrorsList.length})</span>
            </span>
            {showIgnored ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>

          {showIgnored && (
            <div className="mt-2 space-y-1">
              {ignoredErrorsList.slice(0, 5).map(error => (
                <div
                  key={error.id}
                  className={`p-2 rounded text-xs opacity-60 ${
                    darkMode ? 'bg-gray-700' : 'bg-gray-100'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>"{error.originalText}"</span>
                    <button
                      onClick={() => {
                        // Remove from ignored list (un-ignore)
                        const newIgnored = new Set(ignoredErrors);
                        newIgnored.delete(error.id);
                        // This would need to be handled by parent component
                      }}
                      className="text-blue-500 hover:text-blue-400"
                      title="Show this error again"
                    >
                      <Eye className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};