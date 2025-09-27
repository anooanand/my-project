import React, { useState, useEffect } from 'react';
import { NSWEvaluationReportGenerator } from './NSWEvaluationReportGenerator';

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

  useEffect(() => {
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
        
        // OPTIMIZED: Generate report immediately without artificial delays
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
        // onClose(); // Removed to allow report display
      }
    };

    submitEvaluation();
  }, [content, textType, onComplete, onClose]);

  return null; // This component no longer renders UI directly
}
