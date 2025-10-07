import React from "react";
import { InteractiveTextEditor, EditorHandle } from "../components/InteractiveTextEditor";
import { EnhancedCoachPanel } from "../components/EnhancedCoachPanel";
import { CoachProvider } from "../components/CoachProvider";
import { WritingStatusBar } from "../components/WritingStatusBar";
import { NSWStandaloneSubmitSystem } from "../components/NSWStandaloneSubmitSystem";
import ProgressCoach from "../components/ProgressCoach";
import type { DetailedFeedback, LintFix } from "../types/feedback";
import { evaluateEssay, saveDraft } from "../lib/api";
import { validateDetailedFeedback } from "../types/feedback.validate";
import { eventBus } from "../lib/eventBus";
import { detectNewParagraphs } from "../lib/paragraphDetection";

import React from "react";
import { EnhancedWritingLayoutNSW } from "../components/EnhancedWritingLayoutNSW";
import type { DetailedFeedback } from "../types/feedback";
import { eventBus } from "../lib/eventBus";
import { detectNewParagraphs } from "../lib/paragraphDetection";

export default function WritingWorkspaceFixed() {
  const [analysis, setAnalysis] = React.useState<DetailedFeedback | null>(null);
  const [nswReport, setNswReport] = React.useState<any>(null);
  const [status, setStatus] = React.useState<"idle"|"loading"|"success"|"error">("idle");
  const [err, setErr] = React.useState<string|undefined>(undefined);
  const [currentText, setCurrentText] = React.useState<string>("");
  const [textType, setTextType] = React.useState<'narrative' | 'persuasive' | 'informative'>('narrative');
  const [wordCount, setWordCount] = React.useState<number>(0);
  const [showNSWEvaluation, setShowNSWEvaluation] = React.useState<boolean>(false);
  const [prompt, setPrompt] = React.useState<string>("The Secret Door in the Library: During a rainy afternoon, you decide to explore the dusty old library in your town that you've never visited before. As you wander through the aisles, you discover a hidden door behind a bookshelf. It's slightly ajar, and a faint, warm light spills out from the crack. What happens when you push the door open? Describe the world you enter and the adventures that await you inside. Who do you meet, and what challenges do you face? How does this experience change you by the time you return to the library? Let your imagination run wild as you take your reader on a journey through this mysterious door!");

  const handleContentChange = (newContent: string) => {
    setCurrentText(newContent);
    const words = newContent.trim().split(/\s+/).filter(word => word.length > 0);
    setWordCount(words.length);

    // Simplified paragraph detection for event bus
    // This would ideally be handled within EnhancedWritingLayoutNSW if it fully controls the editor
    const prevText = localStorage.getItem('writingDraft') || ''; // Placeholder for previous text
    if (newContent !== prevText) {
      const newParagraphs = detectNewParagraphs(prevText, newContent);
      if (newParagraphs.length > 0) {
        eventBus.emit('newParagraphsDetected', { paragraphs: newParagraphs, textType });
      }
      localStorage.setItem('writingDraft', newContent);
    }
  };

  const handleSubmitForEvaluation = async (contentToSubmit: string) => {
    console.log('🎯 NSW Submit triggered from WritingWorkspaceFixed');
    setStatus("loading");
    setErr(undefined);
    setShowNSWEvaluation(true);

    try {
      if (!contentToSubmit.trim()) {
        throw new Error("Please write some content before submitting for evaluation");
      }
      // In a real scenario, you'd call an API here to get the report
      // For now, we'll simulate it or rely on EnhancedWritingLayoutNSW's internal logic
      console.log("Simulating NSW Evaluation for:", { 
        text: contentToSubmit.substring(0, 100) + "...", 
        textType, 
        wordCount: contentToSubmit.trim().split(/\s+/).filter(w => w.length > 0).length 
      });
      // This part would ideally be handled by the EnhancedWritingLayoutNSW component
      // and its internal NSWEvaluationReportGenerator
      // For now, we'll just set a dummy report or wait for the child component to handle it

    } catch (e: any) {
      console.error('NSW Submit error:', e);
      setStatus("error");
      setErr(e?.message || "Failed to initiate NSW evaluation");
      setShowNSWEvaluation(false);
    }
  };

  const onNSWEvaluationComplete = (report: any) => {
    console.log("NSW Evaluation completed in WritingWorkspaceFixed:", report);
    setNswReport(report);
    setStatus("success");
    // Convert NSW report to DetailedFeedback format if needed here, or let the layout component handle it
    setAnalysis(report); // Assuming report is already in DetailedFeedback format or compatible
    setShowNSWEvaluation(false);
  };

  return (
    <EnhancedWritingLayoutNSW
      content={currentText}
      onChange={handleContentChange}
      textType={textType}
      onTextTypeChange={setTextType}
      initialPrompt={prompt}
      setPrompt={setPrompt}
      wordCount={wordCount}
      onWordCountChange={setWordCount}
      onSubmit={handleSubmitForEvaluation}
      analysis={analysis}
      onAnalysisChange={setAnalysis}
      nswReport={nswReport}
      onNSWEvaluationComplete={onNSWEvaluationComplete}
      showNSWEvaluation={showNSWEvaluation}
      setShowNSWEvaluation={setShowNSWEvaluation}
      evaluationStatus={status}
      setEvaluationStatus={setStatus}
      error={err}
    />
  );
}