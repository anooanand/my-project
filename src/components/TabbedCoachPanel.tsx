import React, { useState } from "react";
import { CoachProvider } from "./CoachProvider";
import { RubricPanel } from "./RubricPanel";
import type { DetailedFeedback, LintFix } from "../types/feedback";

/**
 * Minimal, dependency-free tabs so the panel always "does something":
 * - Coach: live paragraph tips (via CoachProvider)
 * - Analysis: NSW rubric + Apply buttons (shows after you press Submit)
 * - Vocab/Progress: placeholder sections (keep or wire your existing ones)
 */

type Props = {
  analysis: DetailedFeedback | null;
  onApplyFix: (fix: LintFix) => void;
};

export function TabbedCoachPanel({ analysis, onApplyFix }: Props) {
  const [tab, setTab] = useState<"coach" | "analysis" | "vocab" | "progress">("coach");

  const TabButton = ({ id, children }:{ id: PropsOfTab["tab"], children: React.ReactNode }) => (
    <button
      className={`px-3 py-1 rounded-lg text-sm ${tab === id ? "bg-white text-black" : "bg-black/20 text-white/80"}`}
      onClick={() => setTab(id)}
    >
      {children}
    </button>
  );

  return (
    <div className="rounded-2xl p-3 bg-gradient-to-b from-purple-600 to-fuchsia-600 text-white">
      <div className="flex gap-2 mb-3">
        <TabButton id="coach">Coach</TabButton>
        <TabButton id="analysis">Analysis</TabButton>
        <TabButton id="vocab">Vocab</TabButton>
        <TabButton id="progress">Progress</TabButton>
      </div>

      <div className="rounded-xl bg-white p-3 text-black">
        {tab === "coach" && (
          <div className="max-h-[60vh] overflow-auto">
            <CoachProvider />
          </div>
        )}

        {tab === "analysis" && (
          analysis ? (
            <RubricPanel data={analysis} onApplyFix={onApplyFix} />
          ) : (
            <div className="text-sm opacity-70">
              Submit your writing to see rubric-based feedback here.
            </div>
          )
        )}

        {tab === "vocab" && (
          <div className="text-sm opacity-80">
            <p className="mb-2">Vocab Coach (placeholder)</p>
            <ul className="list-disc pl-5">
              <li>Highlight complex/overused words</li>
              <li>Suggest context-appropriate synonyms</li>
              <li>Build a personal word list</li>
            </ul>
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
  );
}
type PropsOfTab = { tab: "coach" | "analysis" | "vocab" | "progress" };
