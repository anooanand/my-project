/**
 * Minimal runtime guards to validate AI JSON payloads without external dependencies.
 * Copy to: src/types/feedback.validate.ts
 */
import type { DetailedFeedback } from "./feedback";

export function isNumber(n: any): n is number { return typeof n === "number" && !Number.isNaN(n); }
export function isString(s: any): s is string { return typeof s === "string"; }
export function isArray(a: any): a is any[] { return Array.isArray(a); }
export function isObj(o: any): o is Record<string, any> { return o && typeof o === "object"; }

export function validateEvidence(e: any): e is { text: string; start: number; end: number } {
  return isObj(e) && isString(e.text) && isNumber(e.start) && isNumber(e.end);
}

export function validateLintFix(f: any): f is {
  original: string; replacement: string; explanation: string; start: number; end: number;
} {
  return isObj(f) && isString(f.original) && isString(f.replacement) && isString(f.explanation)
    && isNumber(f.start) && isNumber(f.end);
}

export function validateCriterionBlock(c: any): boolean {
  if (!isObj(c)) return false;
  if (!isNumber(c.score)) return false;
  if (!isNumber(c.weight)) return false;
  if (!isArray(c.strengths) || !c.strengths.every(validateEvidence)) return false;
  if (!isArray(c.improvements)) return false;
  for (const imp of c.improvements) {
    if (!isObj(imp)) return false;
    if (!isString(imp.issue) || !isString(imp.suggestion)) return false;
    if (!validateEvidence(imp.evidence)) return false;
  }
  return true;
}

export function validateDetailedFeedback(x: any): x is DetailedFeedback {
  if (!isObj(x)) return false;
  if (!isNumber(x.overallScore)) return false;
  const cs = x.criteria;
  if (!isObj(cs)) return false;
  const req = ["ideasContent","structureOrganization","languageVocab","spellingPunctuationGrammar"];
  for (const k of req) {
    if (!validateCriterionBlock(cs[k])) return false;
  }
  if (!isArray(x.grammarCorrections) || !x.grammarCorrections.every(validateLintFix)) return false;
  if (!isArray(x.vocabularyEnhancements) || !x.vocabularyEnhancements.every(validateLintFix)) return false;
  if (!isString(x.id)) return false;
  return true;
}
