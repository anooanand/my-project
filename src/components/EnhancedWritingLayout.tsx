// src/components/EnhancedWritingLayout.tsx
import React, { useState, useEffect, useRef } from 'react';
import { WritingArea } from './WritingArea';
import { PlanningToolModal } from './PlanningToolModal';
import { StructureGuideModal } from './StructureGuideModal';
import { TipsModal } from './TipsModal';
import { TabbedCoachPanel } from './TabbedCoachPanel';
import { NSWStandaloneSubmitSystem } from './NSWStandaloneSubmitSystem';
import { ReportModal } from './ReportModal';
import type { DetailedFeedback, LintFix } from '../types/feedback';
import { eventBus } from '../lib/eventBus';
import { detectNewParagraphs } from '../lib/paragraphDetection';
import {
  PenTool,
  Play,
  BookOpen,
  Lightbulb as LightbulbIcon,
  Target,
  Eye,
  EyeOff,
  ArrowLeft,
  FileText,
  Clock,
  AlertCircle,
  Award,
  TrendingUp,
  Type,
  Minus,
  Plus,
  Moon,
  Sun,
  Maximize2,
  Minimize2,
  Settings,
  ChevronDown,
  ChevronUp,
  Info,
  PlayCircle,
  PauseCircle,
  RotateCcw,
  X
} from 'lucide-react';
import { NSWEvaluationReportGenerator } from './NSWEvaluationReportGenerator';

export const EnhancedWritingLayout: React.FC = () => {
  const [localContent, setLocalContent] = useState("");
  const [textType, setTextType] = useState("Essay");
  const [evaluationStatus, setEvaluationStatus] = useState<"idle" | "loading" | "error" | "done">("idle");
  const [evaluationProgress, setEvaluationProgress] = useState("");
  const [showNSWEvaluation, setShowNSWEvaluation] = useState(false);
  const [reportData, setReportData] = useState<any>(null);

  const handleNSWEvaluationComplete = (report: any) => {
    setEvaluationStatus("done");
    setEvaluationProgress("");
    setReportData(report);
  };

  // Enhanced NSW Evaluation Submit Handler
  const handleNSWSubmit = async (submittedContent?: string, submittedTextType?: string) => {
    const contentToEvaluate = submittedContent || localContent;
    const typeToEvaluate = submittedTextType || textType;

    setEvaluationStatus("loading");
    setShowNSWEvaluation(true);
    setEvaluationProgress("Generating your personalized report...");

    try {
      if (!contentToEvaluate || contentToEvaluate.trim().length === 0) {
        throw new Error("Please write some content before submitting for evaluation");
      }

      const prompt =
        localStorage.getItem("generatedPrompt") ||
        localStorage.getItem(`${typeToEvaluate.toLowerCase()}_prompt`) ||
        "";

      const wordCount = contentToEvaluate
        .trim()
        .split(/\s+/)
        .filter(word => word.length > 0).length;

      // Directly generate the report without artificial delays
      const generatedReport = await NSWEvaluationReportGenerator.generateReport({
        essayContent: contentToEvaluate,
        textType: typeToEvaluate,
        prompt: prompt,
        wordCount: wordCount,
        targetWordCountMin: 100, // Example value
        targetWordCountMax: 500, // Example value
      });

      handleNSWEvaluationComplete(generatedReport);

    } catch (e: any) {
      console.error("NSW Submit error:", e);
      setEvaluationStatus("error");
      setShowNSWEvaluation(false);
      setEvaluationProgress("");
    }
  };

  return (
    <div className="enhanced-writing-layout">
      <WritingArea
        content={localContent}
        setContent={setLocalContent}
        textType={textType}
        setTextType={setTextType}
      />

      <NSWStandaloneSubmitSystem
        onSubmit={handleNSWSubmit}
        evaluationStatus={evaluationStatus}
        evaluationProgress={evaluationProgress}
      />

      {showNSWEvaluation && reportData && (
        <ReportModal
          report={reportData}
          onClose={() => {
            setShowNSWEvaluation(false);
            setReportData(null);
            setEvaluationStatus("idle");
          }}
        />
      )}

      {/* Other modals and panels */}
      <PlanningToolModal />
      <StructureGuideModal />
      <TipsModal />
      <TabbedCoachPanel />
    </div>
  );
};
