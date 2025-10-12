import React, { useState, useEffect } from 'react';
import { NSWEvaluationReportGenerator } from './NSWEvaluationReportGenerator'; // Re-add this import

interface NSWStandaloneSubmitSystemProps {
  content: string;
  textType: string;
  onComplete: (report: any) => void;
  onClose: () => void;
}

export function NSWStandaloneSubmitSystem({
  content,
  textType,
  onComplete,
  onClose,
}: NSWStandaloneSubmitSystemProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // The useEffect hook should not trigger submission automatically if a button is expected.
  // Instead, the submission logic should be triggered by a user action (e.g., button click).
  // For now, we'll keep the useEffect for demonstration, but a button would call this function.
  const submitEvaluation = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      // Retrieve prompt and word count from localStorage or other sources if needed
      const prompt = localStorage.getItem("generatedPrompt") || localStorage.getItem(`${textType.toLowerCase()}_prompt`) || "";
      const essayData = JSON.parse(localStorage.getItem("currentEssayData") || "{}");
      const wordCount = essayData.wordCount || content.trim().split(/\s+/).filter(word => word.length > 0).length;

      // Define target word counts (these might come from props or a config)
      const targetWordCountMin = 100; // Example value
      const targetWordCountMax = 500; // Example value

      if (!content || content.trim().length === 0) {
        throw new Error("Essay content cannot be empty.");
      }

      console.log("NSWStandaloneSubmitSystem: Generating report...");
      
      // Revert to direct report generation using NSWEvaluationReportGenerator
      const report = NSWEvaluationReportGenerator.generateReport({
        essayContent: content,
        textType: textType,
        prompt: prompt,
        wordCount: wordCount,
        targetWordCountMin: targetWordCountMin,
        targetWordCountMax: targetWordCountMax,
      });

      console.log("NSWStandaloneSubmitSystem: Report generated successfully:", report);
      onComplete(report);
    } catch (err: any) {
      console.error("NSWStandaloneSubmitSystem: Submission error:", err);
      setError(err.message || "Failed to generate analysis report. Please try again.");
      onComplete(null); // Indicate failure
    } finally {
      setIsSubmitting(false);
    }
  };

  // This useEffect will still trigger the submission on mount/content change.
  // If a button is desired, this useEffect should be removed, and submitEvaluation
  // should be called by an onClick handler on a button in the parent component.
  useEffect(() => {
    submitEvaluation();
  }, [content, textType]); // Removed onComplete, onClose from dependencies to prevent re-triggering

  return null; // This component still doesn't render UI directly, it's a logic component.
}
