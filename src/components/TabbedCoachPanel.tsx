import React, { useState } from "react";
import { CoachProvider } from "./CoachProvider";
import { RubricPanel } from "./RubricPanel";
import { VocabCoach } from "./VocabCoach";
import { ReportModal } from "./ReportModal";
import { VocabSuggestionPanel } from "./VocabSuggestionPanel";
import { NarrativeStructureGuide } from "./NarrativeStructureGuide";
import { SentenceImprovementPanel } from "./SentenceImprovementPanel";
import type { DetailedFeedback, LintFix } from "../types/feedback";
import { ExternalLink, FileText, MessageSquare, BarChart3, BookOpen, TrendingUp } from 'lucide-react';

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
  content = "",
  textType = "narrative",
  onWordSelect = () => {}
}: Props) {
  const [tab, setTab] = useState<"coach" | "analysis" | "vocab" | "progress">("coach");
  const [showFullReport, setShowFullReport] = useState(false);

  const handleWordReplace = (oldWord: string, newWord: string, position: number) => {
    console.log(`Replace "${oldWord}" with "${newWord}" at position ${position}`);
    // In a real app, this would update the content state in the parent component
  };

  const handleAddToPersonalList = (word: string) => {
    console.log(`Added "${word}" to personal word list`);
    // In a real app, this would save to a personal word list
  };

  const handleSentenceImprovement = (original: string, improved: string) => {
    console.log(`Improve sentence: "${original}" -> "${improved}"`);
    // In a real app, this would update the content state in the parent component
  };

  const handleContentChange = (newContent: string) => {
    console.log(`Content updated: ${newContent.length} characters`);
    // In a real app, this would update the content state in the parent component
  };
  
  const Tab = ({ id, label, icon: Icon }:{ 
    id: "coach"|"analysis"|"vocab"|"progress"; 
    label: string;
    icon: React.ComponentType<any>;
  }) => (
    <button
      className={`flex items-center space-x-1 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
        tab === id 
          ? "bg-white text-purple-600 shadow-sm" 
          : "bg-purple-500/20 text-white/90 hover:bg-purple-500/30"
      }`}
      onClick={() => setTab(id)}
    >
      <Icon className="w-3 h-3" />
      <span>{label}</span>
    </button>
  );

  return (
    <>
      <div className="h-full flex flex-col rounded-2xl bg-gradient-to-br from-purple-600 via-purple-700 to-fuchsia-600 text-white shadow-xl">
        {/* Tab Navigation - Horizontal Layout */}
        <div className="p-3 border-b border-white/20">
          <div className="flex gap-1 justify-between">
            <Tab id="coach" label="Coach" icon={MessageSquare} />
            <Tab id="analysis" label="Analysis" icon={BarChart3} />
            <Tab id="vocab" label="Vocab" icon={BookOpen} />
            <Tab id="progress" label="Progress" icon={TrendingUp} />
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 p-4 overflow-hidden">
          <div className="h-full rounded-xl bg-white text-gray-900 shadow-inner">
            {tab === "coach" && (
              <div className="h-full overflow-auto p-4 space-y-4">
                {/* NSW Narrative Structure Guide */}
                {textType === 'narrative' && (
                  <NarrativeStructureGuide
                    content={content}
                    onContentUpdate={handleContentChange}
                    className="border-0 shadow-none bg-transparent"
                  />
                )}
                
                {/* Sentence Improvement Panel */}
                <SentenceImprovementPanel
                  content={content}
                  textType={textType}
                  onApplyImprovement={handleSentenceImprovement}
                  className="border-0 shadow-none bg-transparent"
                />
                
                {/* Original Coach Provider for backward compatibility */}
                <div className="border-t pt-4">
                  <CoachProvider content={content} />
                </div>
              </div>
            )}
            
            {tab === "analysis" && (
              <div className="h-full overflow-auto p-4">
                {analysis ? (
                  <div className="space-y-4">
                    {/* NSW Assessment Header */}
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border border-blue-200">
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="font-bold text-lg text-purple-700">NSW Selective Writing Assessment</h3>
                        <div className="text-right">
                          <div className="text-3xl font-bold text-blue-600">{analysis.overallScore}/100</div>
                          <div className="text-sm text-gray-600 font-medium">Overall Score</div>
                        </div>
                      </div>
                      
                      {/* Assessment ID */}
                      <div className="text-xs text-gray-500 mb-3">
                        Assessment ID: {analysis.assessmentId || 'NSW-' + Date.now().toString().slice(-6)}
                      </div>
                      
                      {/* Criteria Grid */}
                      <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                        <div className="bg-white p-3 rounded-lg border">
                          <div className="flex justify-between items-center">
                            <span className="font-medium">Ideas & Content</span>
                            <span className="font-bold text-blue-600">{analysis.criteria.ideasContent.score}/5</span>
                          </div>
                          <div className="text-xs text-gray-500 mt-1">30%</div>
                        </div>
                        <div className="bg-white p-3 rounded-lg border">
                          <div className="flex justify-between items-center">
                            <span className="font-medium">Structure & Organization</span>
                            <span className="font-bold text-blue-600">{analysis.criteria.structureOrganization.score}/5</span>
                          </div>
                          <div className="text-xs text-gray-500 mt-1">25%</div>
                        </div>
                        <div className="bg-white p-3 rounded-lg border">
                          <div className="flex justify-between items-center">
                            <span className="font-medium">Language & Vocabulary</span>
                            <span className="font-bold text-blue-600">{analysis.criteria.languageVocab.score}/5</span>
                          </div>
                          <div className="text-xs text-gray-500 mt-1">25%</div>
                        </div>
                        <div className="bg-white p-3 rounded-lg border">
                          <div className="flex justify-between items-center">
                            <span className="font-medium">Spelling, Punctuation & Grammar</span>
                            <span className="font-bold text-blue-600">{analysis.criteria.spellingPunctuationGrammar.score}/5</span>
                          </div>
                          <div className="text-xs text-gray-500 mt-1">20%</div>
                        </div>
                      </div>

                      {/* View Full Report Button */}
                      <button
                        onClick={() => setShowFullReport(true)}
                        className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2 font-medium"
                      >
                        <FileText className="w-4 h-4" />
                        <span>View Full Report</span>
                        <ExternalLink className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Quick Fixes Section */}
                    {(analysis.grammarCorrections.length > 0 || analysis.vocabularyEnhancements.length > 0) && (
                      <div className="border rounded-lg p-4 bg-yellow-50 border-yellow-200">
                        <h4 className="font-semibold mb-3 text-yellow-800">Quick Fixes Available</h4>
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                          {[...analysis.grammarCorrections, ...analysis.vocabularyEnhancements].slice(0, 5).map((fix, index) => (
                            <div key={index} className="bg-white p-3 rounded border border-yellow-200">
                              <div className="text-sm mb-2">
                                <span className="font-medium text-red-600">"{fix.original}"</span>
                                <span className="mx-2">→</span>
                                <span className="font-medium text-green-600">"{fix.replacement}"</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-xs text-gray-600">{fix.explanation}</span>
                                <button
                                  className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
                                  onClick={() => onApplyFix(fix)}
                                >
                                  Apply Fix
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Compact Rubric Panel */}
                    <div className="border rounded-lg overflow-hidden">
                      <div className="bg-gray-50 p-3 border-b">
                        <h4 className="font-semibold text-gray-800">Assessment Criteria</h4>
                      </div>
                      <div className="max-h-60 overflow-auto">
                        <RubricPanel data={analysis} onApplyFix={onApplyFix} />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center text-center">
                    <div>
                      <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                      <h4 className="font-semibold text-gray-600 mb-2">No Analysis Yet</h4>
                      <p className="text-sm text-gray-500 max-w-xs">
                        Submit your writing for evaluation to see your NSW Selective Writing Assessment report here.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {tab === "vocab" && (
              <div className="h-full overflow-auto p-4 space-y-4">
                {/* Enhanced Vocab Suggestion Panel */}
                <VocabSuggestionPanel
                  content={content}
                  textType={textType}
                  onWordReplace={handleWordReplace}
                  onAddToPersonalList={handleAddToPersonalList}
                  className="border-0 shadow-none bg-transparent"
                />
                
                {/* Original Vocab Coach for backward compatibility */}
                <div className="border-t pt-4">
                  <VocabCoach 
                    content={content}
                    textType={textType}
                    onWordSelect={onWordSelect}
                    className="border-0 shadow-none bg-transparent"
                  />
                </div>
              </div>
            )}
            
            {tab === "progress" && (
              <div className="h-full overflow-auto p-4">
                <div className="text-center py-8">
                  <TrendingUp className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <h4 className="font-semibold text-gray-600 mb-2">Progress Tracking</h4>
                  <div className="text-sm text-gray-500 space-y-2 max-w-xs mx-auto">
                    <p>• Track your writing improvement over time</p>
                    <p>• View score trends across assessments</p>
                    <p>• Monitor weekly writing goals</p>
                    <p>• See total words written</p>
                  </div>
                  <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm text-blue-700">
                      Progress tracking will be available after your first assessment.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Full Report Modal */}
      {analysis && (
        <ReportModal
          isOpen={showFullReport}
          onClose={() => setShowFullReport(false)}
          data={analysis}
          onApplyFix={onApplyFix}
          studentName="Student"
          essayText={content}
        />
      )}
    </>
  );
}