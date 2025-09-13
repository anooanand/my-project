import React, { useState } from "react";
import { CoachProvider } from "./CoachProvider";
import { RubricPanel } from "./RubricPanel";
import { VocabCoach } from "./VocabCoach";
import type { DetailedFeedback, LintFix } from "../types/feedback";

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
  
  const Tab = ({ id, label }:{ id: "coach"|"analysis"|"vocab"|"progress"; label: string }) => (
    <button
      className={`px-3 py-1 rounded-lg text-sm ${tab === id ? "bg-white text-black" : "bg-black/20 text-white/80"}`}
      onClick={() => setTab(id)}
    >
      {label}
    </button>
  );

  return (
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
          analysis ? <RubricPanel data={analysis} onApplyFix={onApplyFix} /> :
          <div className="text-sm opacity-70">Submit your writing to see rubric-based feedback here.</div>
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
  );
}
