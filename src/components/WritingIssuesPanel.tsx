import React from 'react';
import { AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { AnalysisStats } from '../lib/realtimeTextAnalyzer';

interface WritingIssuesPanelProps {
  stats: AnalysisStats;
  darkMode?: boolean;
  compact?: boolean;
}

export function WritingIssuesPanel({ stats, darkMode = false, compact = false }: WritingIssuesPanelProps) {
  const issues = [
    {
      label: 'Grammar',
      count: stats.grammar,
      color: '#ff4444',
      bgColor: 'rgba(255, 68, 68, 0.1)',
      icon: AlertCircle,
      severity: 'error'
    },
    {
      label: 'Weak Words',
      count: stats.weakWords,
      color: '#ff8c00',
      bgColor: 'rgba(255, 140, 0, 0.1)',
      icon: AlertTriangle,
      severity: 'warning'
    },
    {
      label: 'Passive Voice',
      count: stats.passiveVoice,
      color: '#4169e1',
      bgColor: 'rgba(65, 105, 225, 0.1)',
      icon: Info,
      severity: 'info'
    },
    {
      label: 'Adjectives',
      count: stats.excessiveAdjectives,
      color: '#32cd32',
      bgColor: 'rgba(50, 205, 50, 0.1)',
      icon: AlertTriangle,
      severity: 'warning'
    },
    {
      label: 'Sentence Issues',
      count: stats.sentenceIssues,
      color: '#9370db',
      bgColor: 'rgba(147, 112, 219, 0.1)',
      icon: AlertTriangle,
      severity: 'warning'
    },
    {
      label: 'Spelling',
      count: stats.spelling,
      color: '#ffd700',
      bgColor: 'rgba(255, 215, 0, 0.1)',
      icon: AlertCircle,
      severity: 'error'
    }
  ];

  const totalIssues = Object.values(stats).reduce((sum, count) => sum + count, 0);

  if (compact) {
    return (
      <div className={`flex items-center space-x-4 px-4 py-2 ${
        darkMode ? 'bg-slate-800 text-gray-100' : 'bg-gray-50 text-gray-900'
      }`}>
        <span className="text-sm font-medium">Writing Issues:</span>
        <div className="flex items-center space-x-3">
          {issues.map((issue) => (
            <div key={issue.label} className="flex items-center space-x-1">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: issue.color }}
              />
              <span className="text-xs font-medium">{issue.count}</span>
            </div>
          ))}
        </div>
        <div className={`ml-auto text-sm font-semibold ${
          totalIssues === 0 ? 'text-green-600' :
          totalIssues < 5 ? 'text-blue-600' :
          totalIssues < 10 ? 'text-orange-600' :
          'text-red-600'
        }`}>
          {totalIssues === 0 ? '✓ Perfect!' : `${totalIssues} total`}
        </div>
      </div>
    );
  }

  return (
    <div className={`p-4 space-y-3 ${
      darkMode ? 'bg-slate-800 text-gray-100' : 'bg-white text-gray-900'
    }`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold uppercase tracking-wider">
          Writing Issues
        </h3>
        <div className={`text-lg font-bold ${
          totalIssues === 0 ? 'text-green-600' :
          totalIssues < 5 ? 'text-blue-600' :
          totalIssues < 10 ? 'text-orange-600' :
          'text-red-600'
        }`}>
          {totalIssues}
        </div>
      </div>

      <div className="space-y-2">
        {issues.map((issue) => {
          const Icon = issue.icon;
          return (
            <div
              key={issue.label}
              className="flex items-center justify-between p-2 rounded-lg transition-colors hover:bg-opacity-50"
              style={{ backgroundColor: issue.bgColor }}
            >
              <div className="flex items-center space-x-2">
                <Icon
                  className="w-4 h-4"
                  style={{ color: issue.color }}
                />
                <span className="text-sm font-medium">{issue.label}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span
                  className="text-lg font-bold tabular-nums"
                  style={{ color: issue.color }}
                >
                  {issue.count}
                </span>
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: issue.color }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {totalIssues === 0 && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center space-x-2 text-green-700">
            <span className="text-2xl">✓</span>
            <span className="text-sm font-medium">
              Great job! No issues detected.
            </span>
          </div>
        </div>
      )}

      {totalIssues > 0 && (
        <div className={`mt-4 p-3 rounded-lg border ${
          totalIssues < 5
            ? 'bg-blue-50 border-blue-200'
            : totalIssues < 10
            ? 'bg-orange-50 border-orange-200'
            : 'bg-red-50 border-red-200'
        }`}>
          <p className={`text-xs ${
            totalIssues < 5
              ? 'text-blue-700'
              : totalIssues < 10
              ? 'text-orange-700'
              : 'text-red-700'
          }`}>
            {totalIssues < 5
              ? 'Good work! Just a few minor issues to address.'
              : totalIssues < 10
              ? 'Several issues found. Review the highlights to improve your writing.'
              : 'Many issues detected. Take time to revise and strengthen your writing.'}
          </p>
        </div>
      )}

      {/* Legend */}
      <div className={`mt-4 pt-3 border-t ${
        darkMode ? 'border-gray-700' : 'border-gray-200'
      }`}>
        <p className="text-xs font-medium mb-2">Color Key:</p>
        <div className="grid grid-cols-2 gap-2">
          {issues.map((issue) => (
            <div key={issue.label} className="flex items-center space-x-2">
              <div
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: issue.color }}
              />
              <span className="text-xs truncate">{issue.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
