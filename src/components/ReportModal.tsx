import React, { useState } from 'react';
import { X, Download, FileText, Printer, Share2 } from 'lucide-react';
import type { DetailedFeedback, LintFix } from "../types/feedback";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  data: DetailedFeedback;
  onApplyFix: (fix: LintFix) => void;
  studentName?: string;
  essayText?: string;
}

export function ReportModal({ isOpen, onClose, data, onApplyFix, studentName = "Student", essayText = "" }: Props) {
  const [isExporting, setIsExporting] = useState(false);

  if (!isOpen) return null;

  const getGrade = (score: number) => {
    if (score >= 90) return 'A+';
    if (score >= 85) return 'A';
    if (score >= 80) return 'A-';
    if (score >= 75) return 'B+';
    if (score >= 70) return 'B';
    if (score >= 65) return 'B-';
    if (score >= 60) return 'C+';
    if (score >= 55) return 'C';
    if (score >= 50) return 'C-';
    return 'D';
  };

  const getGradeColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 65) return 'text-yellow-600';
    return 'text-red-600';
  };

  const exportToPDF = async () => {
    setIsExporting(true);
    try {
      // Create a printable version
      const printContent = document.getElementById('report-content');
      if (printContent) {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(`
            <html>
              <head>
                <title>NSW Selective Writing Assessment Report</title>
                <style>
                  body { font-family: Arial, sans-serif; margin: 20px; }
                  .header { text-align: center; margin-bottom: 30px; }
                  .score-section { margin: 20px 0; }
                  .criterion { margin: 15px 0; padding: 10px; border: 1px solid #ddd; }
                  .score-bar { height: 20px; background: #f0f0f0; border-radius: 10px; margin: 5px 0; }
                  .score-fill { height: 100%; border-radius: 10px; }
                  .green { background: #10b981; }
                  .yellow { background: #f59e0b; }
                  .red { background: #ef4444; }
                  .strengths { background: #f0fdf4; padding: 10px; margin: 10px 0; }
                  .improvements { background: #fef3c7; padding: 10px; margin: 10px 0; }
                  @media print { body { margin: 0; } }
                </style>
              </head>
              <body>
                ${printContent.innerHTML}
              </body>
            </html>
          `);
          printWindow.document.close();
          printWindow.print();
        }
      }
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const downloadAsText = () => {
    const reportText = `
NSW SELECTIVE WRITING ASSESSMENT REPORT
=====================================

Student: ${studentName}
Date: ${new Date().toLocaleDateString()}
Assessment ID: ${data.id}

OVERALL SCORE: ${data.overallScore}/100 (Grade: ${getGrade(data.overallScore)})

CRITERIA BREAKDOWN:
- Ideas & Content: ${data.criteria.ideasContent.score}/5 (${data.criteria.ideasContent.weight}%)
- Structure & Organization: ${data.criteria.structureOrganization.score}/5 (${data.criteria.structureOrganization.weight}%)
- Language & Vocabulary: ${data.criteria.languageVocab.score}/5 (${data.criteria.languageVocab.weight}%)
- Spelling, Punctuation & Grammar: ${data.criteria.spellingPunctuationGrammar.score}/5 (${data.criteria.spellingPunctuationGrammar.weight}%)

DETAILED FEEDBACK:

IDEAS & CONTENT:
Strengths:
${data.criteria.ideasContent.strengths.map(s => `- ${s.text}`).join('\n')}

Areas for Improvement:
${data.criteria.ideasContent.improvements.map(i => `- ${i.issue}: ${i.suggestion}`).join('\n')}

STRUCTURE & ORGANIZATION:
Strengths:
${data.criteria.structureOrganization.strengths.map(s => `- ${s.text}`).join('\n')}

Areas for Improvement:
${data.criteria.structureOrganization.improvements.map(i => `- ${i.issue}: ${i.suggestion}`).join('\n')}

LANGUAGE & VOCABULARY:
Strengths:
${data.criteria.languageVocab.strengths.map(s => `- ${s.text}`).join('\n')}

Areas for Improvement:
${data.criteria.languageVocab.improvements.map(i => `- ${i.issue}: ${i.suggestion}`).join('\n')}

SPELLING, PUNCTUATION & GRAMMAR:
Strengths:
${data.criteria.spellingPunctuationGrammar.strengths.map(s => `- ${s.text}`).join('\n')}

Areas for Improvement:
${data.criteria.spellingPunctuationGrammar.improvements.map(i => `- ${i.issue}: ${i.suggestion}`).join('\n')}

${data.narrativeStructure ? `
NARRATIVE STRUCTURE:
- Orientation: ${data.narrativeStructure.orientationPresent ? 'Present' : 'Missing'}
- Complication: ${data.narrativeStructure.complicationPresent ? 'Present' : 'Missing'}
- Climax: ${data.narrativeStructure.climaxPresent ? 'Present' : 'Missing'}
- Resolution: ${data.narrativeStructure.resolutionPresent ? 'Present' : 'Missing'}
Notes: ${data.narrativeStructure.notes || 'None'}
` : ''}

ORIGINAL ESSAY:
${essayText}

Report generated on ${new Date().toLocaleString()}
    `;

    const blob = new Blob([reportText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `NSW_Writing_Assessment_${studentName}_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const ScoreBar = ({ label, score, maxScore = 5, weight }: { label: string; score: number; maxScore?: number; weight: number }) => {
    const percentage = (score / maxScore) * 100;
    const getColor = (score: number, max: number) => {
      const ratio = score / max;
      if (ratio >= 0.8) return 'bg-green-500';
      if (ratio >= 0.6) return 'bg-yellow-500';
      return 'bg-red-500';
    };

    return (
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="font-medium text-sm">{label}</span>
          <div className="flex items-center space-x-2">
            <span className="text-sm font-semibold">{score}/{maxScore}</span>
            <span className="text-xs text-gray-600">({weight}%)</span>
          </div>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className={`h-3 rounded-full transition-all duration-500 ${getColor(score, maxScore)}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold mb-2">NSW Selective Writing Assessment</h1>
              <p className="text-blue-100">Comprehensive Writing Evaluation Report</p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={exportToPDF}
                disabled={isExporting}
                className="bg-white/20 hover:bg-white/30 p-2 rounded-lg transition-colors"
                title="Print Report"
              >
                <Printer className="w-5 h-5" />
              </button>
              <button
                onClick={downloadAsText}
                className="bg-white/20 hover:bg-white/30 p-2 rounded-lg transition-colors"
                title="Download as Text"
              >
                <Download className="w-5 h-5" />
              </button>
              <button
                onClick={onClose}
                className="bg-white/20 hover:bg-white/30 p-2 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          <div className="mt-4 flex items-center justify-between">
            <div>
              <p className="text-blue-100">Overall Score</p>
              <div className="flex items-center space-x-3">
                <span className="text-4xl font-bold">{data.overallScore}</span>
                <span className="text-blue-200">/100</span>
                <span className={`text-3xl font-bold ${getGradeColor(data.overallScore)}`}>
                  {getGrade(data.overallScore)}
                </span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-blue-100 text-sm">Student: {studentName}</p>
              <p className="text-blue-100 text-sm">Date: {new Date().toLocaleDateString()}</p>
              <p className="text-xs text-blue-200">ID: {data.id}</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-200px)]" id="report-content">
          <div className="p-6 space-y-6">
            {/* Criteria Overview */}
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="font-semibold mb-4 text-lg">Assessment Criteria</h3>
              <ScoreBar 
                label="Ideas & Content" 
                score={data.criteria.ideasContent.score} 
                weight={data.criteria.ideasContent.weight}
              />
              <ScoreBar 
                label="Structure & Organization" 
                score={data.criteria.structureOrganization.score} 
                weight={data.criteria.structureOrganization.weight}
              />
              <ScoreBar 
                label="Language & Vocabulary" 
                score={data.criteria.languageVocab.score} 
                weight={data.criteria.languageVocab.weight}
              />
              <ScoreBar 
                label="Spelling, Punctuation & Grammar" 
                score={data.criteria.spellingPunctuationGrammar.score} 
                weight={data.criteria.spellingPunctuationGrammar.weight}
              />
            </div>

            {/* Detailed Feedback */}
            {Object.entries(data.criteria).map(([key, criterion]) => {
              const titles = {
                ideasContent: "Ideas & Content",
                structureOrganization: "Structure & Organization", 
                languageVocab: "Language & Vocabulary",
                spellingPunctuationGrammar: "Spelling, Punctuation & Grammar"
              };
              
              return (
                <div key={key} className="border rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-lg">{titles[key as keyof typeof titles]}</h4>
                    <div className="flex items-center space-x-2">
                      <span className="text-3xl font-bold text-blue-600">{criterion.score}</span>
                      <span className="text-gray-500">/5</span>
                    </div>
                  </div>

                  {criterion.strengths.length > 0 && (
                    <div className="mb-4">
                      <h5 className="font-medium text-green-700 mb-2">✓ Strengths</h5>
                      <div className="space-y-2">
                        {criterion.strengths.map((strength: any, index: number) => (
                          <div key={index} className="bg-green-50 p-3 rounded border-l-4 border-green-400">
                            <p className="text-green-800">{strength.text}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {criterion.improvements.length > 0 && (
                    <div>
                      <h5 className="font-medium text-orange-700 mb-2">→ Areas for Improvement</h5>
                      <div className="space-y-3">
                        {criterion.improvements.map((improvement: any, index: number) => (
                          <div key={index} className="bg-orange-50 p-4 rounded border-l-4 border-orange-400">
                            <p className="font-medium text-orange-800 mb-1">{improvement.issue}</p>
                            <p className="text-orange-700">{improvement.suggestion}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Narrative Structure */}
            {data.narrativeStructure && (
              <div className="border rounded-lg p-6">
                <h4 className="font-semibold text-lg mb-4">Narrative Structure Analysis</h4>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  {[
                    { label: 'Orientation', present: data.narrativeStructure.orientationPresent },
                    { label: 'Complication', present: data.narrativeStructure.complicationPresent },
                    { label: 'Climax', present: data.narrativeStructure.climaxPresent },
                    { label: 'Resolution', present: data.narrativeStructure.resolutionPresent }
                  ].map(({ label, present }) => (
                    <div key={label} className={`p-3 rounded ${present ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                      <span className="font-medium">{label}:</span> {present ? '✓ Present' : '✗ Missing'}
                    </div>
                  ))}
                </div>
                {data.narrativeStructure.notes && (
                  <p className="text-gray-700 bg-gray-50 p-3 rounded">
                    <strong>Notes:</strong> {data.narrativeStructure.notes}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 p-4 border-t">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600">
              Report generated on {new Date().toLocaleString()}
            </p>
            <div className="flex space-x-2">
              <button
                onClick={downloadAsText}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Download Report</span>
              </button>
              <button
                onClick={onClose}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
