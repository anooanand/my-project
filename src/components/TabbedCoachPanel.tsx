import React, { useState } from "react";
import { CoachProvider } from "./CoachProvider";
import { RubricPanel } from "./RubricPanel";
import { VocabCoach } from "./VocabCoach";
import { ReportModal } from "./ReportModal";
import type { DetailedFeedback, LintFix } from "../types/feedback";
import { ExternalLink, FileText } from 'lucide-react';

type Props = { 
  analysis: DetailedFeedback | null; 
  onApplyFix: (fix: LintFix) => void;
  content?: string;
  textType?: string;
  onWordSelect?: (word: string) => void;
};

export function TabbedCoachPanel({ 
  analysis, 
  onApplyFix, 
  content = '', 
  textType = 'narrative',
  onWordSelect = () => {}
}: Props) {
  const [tab, setTab] = useState<"coach" | "analysis" | "vocab" | "progress">("coach");
  const [showFullReport, setShowFullReport] = useState(false);
  
  const Tab = ({ id, label }:{ id: "coach"|"analysis"|"vocab"|"progress"; label: string }) => (
    <button
      className={`px-3 py-1 rounded-lg text-sm ${tab === id ? "bg-white text-black" : "bg-black/20 text-white/80"}`}
      onClick={() => setTab(id)}
    >
      {label}
    </button>
  );

  return (
    <>
      <div className="rounded-2xl p-3 bg-gradient-to-b from-purple-600 to-fuchsia-600 text-white">
        <div className="flex gap-2 mb-3">
          <Tab id="coach" label="Coach" />
          <Tab id="analysis" label="Analysis" />
          <Tab id="vocab" label="Vocab" />
          <Tab id="progress" label="Progress" />
        </div>

        <div className="rounded-xl bg-white p-3 text-black">
          {tab === "coach" && (
            <div className="max-h-[60vh] overflow-auto">
              <CoachProvider />
            </div>
          )}
          {tab === "analysis" && (
            analysis ? (
              <div className="space-y-4">
                {/* Quick Summary */}
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-semibold text-lg">NSW Assessment Summary</h3>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-blue-600">{analysis.overallScore}/100</div>
                      <div className="text-sm text-gray-600">Overall Score</div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-sm mb-4">
                    <div className="flex justify-between">
                      <span>Ideas:</span>
                      <span className="font-medium">{analysis.criteria.ideasContent.score}/5</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Structure:</span>
                      <span className="font-medium">{analysis.criteria.structureOrganization.score}/5</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Language:</span>
                      <span className="font-medium">{analysis.criteria.languageVocab.score}/5</span>
                    </div>
                    <div className="flex justify-between">
                      <span>SPaG:</span>
                      <span className="font-medium">{analysis.criteria.spellingPunctuationGrammar.score}/5</span>
                    </div>
                  </div>

                  <button
                    onClick={() => setShowFullReport(true)}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
                  >
                    <FileText className="w-4 h-4" />
                    <span>View Full Report</span>
                    <ExternalLink className="w-4 h-4" />
                  </button>
                </div>

                {/* Quick Fixes */}
                {(analysis.grammarCorrections.length > 0 || analysis.vocabularyEnhancements.length > 0) && (
                  <div className="border rounded-lg p-3">
                    <h4 className="font-medium mb-2">Quick Fixes Available</h4>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {[...analysis.grammarCorrections, ...analysis.vocabularyEnhancements].slice(0, 3).map((fix, index) => (
                        <div key={index} className="bg-blue-50 p-2 rounded text-sm">
                          <div className="font-medium">"{fix.original}" → "{fix.replacement}"</div>
                          <button
                            className="mt-1 px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                            onClick={() => onApplyFix(fix)}
                          >
                            Apply
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Compact Rubric Panel for sidebar */}
                <div className="max-h-[40vh] overflow-auto">
                  <RubricPanel data={analysis} onApplyFix={onApplyFix} />
                </div>
              </div>
            ) : (
              <div className="text-sm opacity-70 text-center py-8">
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Submit your writing to see your NSW Selective Writing Assessment report here.</p>
              </div>
            )
          )}
          {tab === "vocab" && (
            <div className="max-h-[60vh] overflow-auto">
              <VocabCoach 
                content={content}
                textType={textType}
                onWordSelect={onWordSelect}
                className="border-0 shadow-none bg-transparent"
              />
            </div>
          )}
          {tab === "progress" && (
            <div className="text-sm opacity-80">
              <p className="mb-2">Progress (placeholder)</p>
              <ul className="list-disc pl-5">
                <li>Trend of per-criterion scores</li>
                <li>Weekly streaks and goals</li>
                <li>Words written total</li>
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Full Report Modal */}
      {analysis && (
        <ReportModal
          isOpen={showFullReport}
          onClose={() => setShowFullReport(false)}
          data={analysis}
          onApplyFix={onApplyFix}
          studentName="Student" // You can make this dynamic
          essayText={content}
        />
      )}
    </>
  );
}
