import React from "react";
import { InteractiveTextEditor, EditorHandle } from "../components/InteractiveTextEditor";
import { FixedEnhancedTabbedCoachPanel } from "../components/EnhancedTabbedCoachPanel";
import { CoachProvider } from "../components/CoachProvider";
import { WritingStatusBar } from "../components/WritingStatusBar";
import { NSWStandaloneSubmitSystem } from "../components/NSWStandaloneSubmitSystem";
import ProgressCoach from "../components/ProgressCoach";
import type { DetailedFeedback, LintFix } from "../types/feedback";
import { evaluateEssay, saveDraft } from "../lib/api";
import { validateDetailedFeedback } from "../types/feedback.validate";
import { eventBus } from "../lib/eventBus";
import { detectNewParagraphs } from "../lib/paragraphDetection";
import DynamicPromptDisplay from "../components/DynamicPromptDisplay";
import {
  Play,
  Pause,
  RotateCcw,
  Eye,
  EyeOff,
  Clock,
} from 'lucide-react';

export default function WritingWorkspaceFixed() {
  const editorRef = React.useRef<EditorHandle>(null);
  const [analysis, setAnalysis] = React.useState<DetailedFeedback | null>(null);
  const [nswReport, setNswReport] = React.useState<any>(null);
  const [status, setStatus] = React.useState<"idle"|"loading"|"success"|"error">("idle");
  const [err, setErr] = React.useState<string|undefined>(undefined);
  const [currentText, setCurrentText] = React.useState<string>("");
  const [textType, setTextType] = React.useState<
    "narrative" | "persuasive" | "informative"
  >("narrative");
  const [targetWordCount, setTargetWordCount] = React.useState<number>(300);
  const [wordCount, setWordCount] = React.useState<number>(0);
  const [showNSWEvaluation, setShowNSWEvaluation] = React.useState<boolean>(
    false
  );
  const prevTextRef = React.useRef<string>("");

  // Timer states
  const [isTimerRunning, setIsTimerRunning] = React.useState(false);
  const [elapsedTime, setElapsedTime] = React.useState(0);
  const [startTime, setStartTime] = React.useState<number | null>(null);
  const timerRef = React.useRef<NodeJS.Timeout | null>(null);

  // Focus mode state
  const [focusMode, setFocusMode] = React.useState(false);

  const draftId = React.useRef<string>(
    `draft-${
      globalThis.crypto && typeof globalThis.crypto.randomUUID === "function"
        ? globalThis.crypto.randomUUID()
        : Date.now().toString(36) + Math.random().toString(36).slice(2)
    }`
  );
  const [version, setVersion] = React.useState(0);

  // Listen for submit events from AppContent
  React.useEffect(() => {
    const handleSubmitEvent = (event: CustomEvent) => {
      console.log("📨 WritingWorkspace: Received submit event:", event.detail);
      onNSWSubmit();
    };

    window.addEventListener(
      "submitForEvaluation",
      handleSubmitEvent as EventListener
    );

    return () => {
      window.removeEventListener(
        "submitForEvaluation",
        handleSubmitEvent as EventListener
      );
    };
  }, []);

  // Track text changes for progress monitoring AND coach feedback
  React.useEffect(() => {
    const interval = setInterval(() => {
      const text = editorRef.current?.getText() || "";
      if (text !== currentText) {
        setCurrentText(text);

        // Update word count
        const words = text
          .trim()
          .split(/\s+/)
          .filter((word) => word.length > 0);
        setWordCount(words.length);

        // Trigger coach feedback for new paragraphs
        const events = detectNewParagraphs(prevTextRef.current, text);
        if (events.length) {
          console.log(
            "Emitting paragraph.ready event:",
            events[events.length - 1]
          );
          eventBus.emit("paragraph.ready", events[events.length - 1]);
        }
        prevTextRef.current = text;
      }
    }, 500);

    return () => clearInterval(interval);
  }, [currentText]);

  // Timer functions
  const startTimer = React.useCallback(() => {
    if (!isTimerRunning) {
      const now = Date.now();
      setStartTime(now - elapsedTime * 1000);
      setIsTimerRunning(true);
    }
  }, [isTimerRunning, elapsedTime]);

  const pauseTimer = React.useCallback(() => {
    setIsTimerRunning(false);
  }, []);

  const resetTimer = React.useCallback(() => {
    setIsTimerRunning(false);
    setElapsedTime(0);
    setStartTime(null);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Timer effect
  React.useEffect(() => {
    if (isTimerRunning && startTime) {
      timerRef.current = setInterval(() => {
        const now = Date.now();
        const elapsed = Math.floor((now - startTime) / 1000);
        setElapsedTime(elapsed);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isTimerRunning, startTime]);

  // NSW Evaluation Submit Handler
  async function onNSWSubmit() {
    console.log("🎯 NSW Submit triggered");
    setStatus("loading");
    setErr(undefined);
    setShowNSWEvaluation(true);

    try {
      const text = editorRef.current?.getText() || currentText || "";
      if (!text.trim()) {
        throw new Error(
          "Please write some content before submitting for evaluation"
        );
      }

      console.log("NSW Evaluation initiated for:", {
        text: text.substring(0, 100) + "...",
        textType,
        wordCount: text
          .trim()
          .split(/\s+/)
          .filter((w) => w.length > 0).length,
      });
    } catch (e: any) {
      console.error("NSW Submit error:", e);
      setStatus("error");
      setErr(e?.message || "Failed to initiate NSW evaluation");
      setShowNSWEvaluation(false);
    }
  }

  // Handle NSW evaluation completion
  function onNSWEvaluationComplete(report: any) {
    console.log("NSW Evaluation completed:", report);
    setNswReport(report);
    setStatus("success");

    // Convert NSW report to DetailedFeedback format for compatibility
    const convertedAnalysis: DetailedFeedback = {
      overallScore: report.overallScore || 0,
      criteria: {
        ideasContent: {
          score: Math.round((report.domains?.contentAndIdeas?.score || 0) / 5),
          weight: 30,
          strengths: [
            report.domains?.contentAndIdeas?.feedback ||
              "Good content development",
          ],
          improvements: report.domains?.contentAndIdeas?.improvements || [],
        },
        structureOrganization: {
          score: Math.round((report.domains?.textStructure?.score || 0) / 5),
          weight: 25,
          strengths: [
            report.domains?.textStructure?.feedback || "Clear structure",
          ],
          improvements: report.domains?.textStructure?.improvements || [],
        },
        languageVocab: {
          score: Math.round((report.domains?.languageFeatures?.score || 0) / 5),
          weight: 25,
          strengths: [
            report.domains?.languageFeatures?.feedback || "Good language use",
          ],
          improvements: report.domains?.languageFeatures?.improvements || [],
        },
        spellingPunctuationGrammar: {
          score: Math.round((report.domains?.conventions?.score || 0) / 5),
          weight: 20,
          strengths: [
            report.domains?.conventions?.feedback || "Accurate conventions",
          ],
          improvements: report.domains?.conventions?.improvements || [],
        },
      },
      grammarCorrections: report.grammarCorrections || [],
      vocabularyEnhancements: report.vocabularyEnhancements || [],
      id: report.id || `nsw-${Date.now()}`,
      assessmentId: report.assessmentId,
    };

    setAnalysis(convertedAnalysis);
  }

  async function onApplyFix(fix: LintFix) {
    editorRef.current?.applyFix(fix.start, fix.end, fix.replacement);
  }

  function onProgressUpdate(metrics: any) {
    console.log("Progress updated:", metrics);
  }

  // Simple autosave
  React.useEffect(() => {
    const int = setInterval(async () => {
      const text = editorRef.current?.getText() || "";
      localStorage.setItem(draftId.current, JSON.stringify({ text, version }));
      try {
        await saveDraft(draftId.current, text, version);
      } catch (e) {
        console.warn("Autosave failed:", e);
      }
    }, 10000);
    return () => clearInterval(int);
  }, [version]);

  // Load saved draft on mount
  React.useEffect(() => {
    const saved = localStorage.getItem(draftId.current);
    if (saved) {
      try {
        const { text } = JSON.parse(saved);
        editorRef.current?.setText(text);
        setCurrentText(text);
      } catch (e) {
        console.warn("Failed to load draft:", e);
      }
    }
  }, []);

  const prompt =
    "The Secret Door in the Library: During a rainy afternoon, you decide to explore the dusty old library in your town that you\\\"ve never visited before. As you wander through the aisles, you discover a hidden door behind a bookshelf. It\\\"s slightly ajar, and a faint, warm light spills out from the crack. What happens when you push the door open? Describe the world you enter and the adventures that await you inside. Who do you meet, and what challenges do you face? How does this experience change you by the time you return to the library? Let your imagination run wild as you take your reader on a journey through this mysterious door!";

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-gray-900">NSW Selective Writing</h1>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Text Type:</span>
              <select 
                value={textType} 
                onChange={(e) => setTextType(e.target.value as any)}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="narrative">Narrative</option>
                <option value="persuasive">Persuasive</option>
                <option value="informative">Informative</option>
              </select>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <WritingStatusBar 
              wordCount={wordCount}
              targetWordCount={targetWordCount}
              status={status}
            />
            {/* Timer Controls */}
            <div className="flex items-center space-x-2 text-gray-600">
              <Clock size={18} />
              <span className="text-sm font-mono">{formatTime(elapsedTime)}</span>
              {!isTimerRunning ? (
                <button 
                  onClick={startTimer}
                  className="p-1 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
                  title="Start Timer"
                >
                  <Play size={18} />
                </button>
              ) : (
                <button 
                  onClick={pauseTimer}
                  className="p-1 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
                  title="Pause Timer"
                >
                  <Pause size={18} />
                </button>
              )}
              <button 
                onClick={resetTimer}
                className="p-1 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
                title="Reset Timer"
              >
                <RotateCcw size={18} />
              </button>
            </div>
            {/* Focus Mode Toggle */}
            <button
              onClick={() => setFocusMode(!focusMode)}
              className="p-1 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
              title="Toggle Focus Mode"
            >
              {focusMode ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Writing Area */}
        <div className="flex-1 flex flex-col">
          <DynamicPromptDisplay prompt={prompt} />

          {/* Writing Area */}
          <div className="flex-1 p-6">
            <div className="h-full bg-white rounded-lg border border-gray-200 shadow-sm relative">
              <InteractiveTextEditor
                ref={editorRef}
                onTextChange={setCurrentText}
                onProgressUpdate={onProgressUpdate}
                className="h-full"
              />
            </div>
          </div>

          {/* Submit for NSW Evaluation Button - Placed at the bottom of the left panel */}
          <div className="p-6 pt-0">
            <button
              onClick={onNSWSubmit}
              disabled={status === "loading" || wordCount < 50}
              className={`w-full py-3 px-6 rounded-lg font-semibold text-white transition-all duration-200 ${
                status === "loading" 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : wordCount < 50
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-lg hover:shadow-xl'
              }`}
            >
              {status === "loading" ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-3"></div>
                  Generating NSW Assessment Report...
                </div>
              ) : (
                `Submit for NSW Evaluation (${wordCount} words)`
              )}
            </button>
          </div>
        </div>

        {/* Right Panel - Coach & Analysis */}
        <div className="w-96 border-l border-gray-200 bg-white flex flex-col">
          {showNSWEvaluation ? (
            /* NSW Evaluation System */
            <div className="h-full p-4">
              <div className="h-full bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg border border-purple-200">
                <div className="p-4 border-b border-purple-200">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-purple-800">NSW Assessment</h3>
                    <button
                      onClick={() => setShowNSWEvaluation(false)}
                      className="text-purple-600 hover:text-purple-800 text-sm"
                    >
                      ← Back to Coach
                    </button>
                  </div>
                </div>
                <div className="h-full overflow-auto">
                  <NSWStandaloneSubmitSystem
                    content={currentText}
                    wordCount={wordCount}
                    targetWordCountMin={100}
                    targetWordCountMax={400}
                    textType={textType}
                    prompt={prompt}
                    onSubmissionComplete={onNSWEvaluationComplete}
                  />
                </div>
              </div>
            </div>
          ) : (
            /* Coach Panel */
            <div className="h-full">
              <CoachProvider>
                <FixedEnhancedTabbedCoachPanel 
                  analysis={analysis}
                  onApplyFix={onApplyFix}
                  content={currentText}
                  textType={textType}
                />
              </CoachProvider>
            </div>
          )}
        </div>
      </div>

      {/* Error Display */}
      {err && (
        <div className="bg-red-50 border-t border-red-200 px-6 py-3">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-800">{err}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
