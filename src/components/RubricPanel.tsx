/**
 * Renders rubric-aligned feedback and hooks up Apply Fix to the editor handle.
 * Copy to: src/components/RubricPanel.tsx
 */
import React from "react";
import type { DetailedFeedback, LintFix } from "../types/feedback";

interface Props {
  data: DetailedFeedback;
  onApplyFix: (fix: LintFix) => void;
}

function ScoreChip({ label, value }: { label: string; value: number }) {
  return <div className="px-2 py-1 rounded-lg bg-gray-100 text-sm">{label}: {value}</div>;
}

export function RubricPanel({ data, onApplyFix }: Props) {
  const c = data.criteria;
  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <ScoreChip label="Overall" value={data.overallScore} />
        <ScoreChip label="Ideas" value={c.ideasContent.score} />
        <ScoreChip label="Structure" value={c.structureOrganization.score} />
        <ScoreChip label="Vocab" value={c.languageVocab.score} />
        <ScoreChip label="SPaG" value={c.spellingPunctuationGrammar.score} />
      </div>

      <section>
        <h3 className="font-semibold">Strengths</h3>
        <ul className="list-disc pl-5">
          {[...c.ideasContent.strengths, ...c.structureOrganization.strengths, ...c.languageVocab.strengths, ...c.spellingPunctuationGrammar.strengths]
            .slice(0,6)
            .map((s, i) => <li key={i}><em>“{s.text}”</em></li>)}
        </ul>
      </section>

      <section>
        <h3 className="font-semibold">Grammar & Vocabulary Fixes</h3>
        <div className="space-y-2">
          {[...data.grammarCorrections, ...data.vocabularyEnhancements].map((f, i) => (
            <div key={i} className="rounded-lg border p-2">
              <div className="text-sm"><strong>Fix:</strong> {f.replacement}</div>
              <div className="text-xs opacity-70 mt-1">Was: “{f.original}” — {f.explanation}</div>
              <button
                className="mt-2 px-3 py-1 rounded-lg bg-blue-600 text-white text-sm"
                onClick={() => onApplyFix(f)}
              >Apply</button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
