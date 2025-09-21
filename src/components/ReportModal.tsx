import React, { useState } from 'react';
import { X, Download, FileText, Printer, Share2, Heart, Lightbulb, Star, Target } from 'lucide-react';
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

  // ADDED: Child-friendly explanation generator
  const generateChildFriendlyExplanation = (domain: string, score: number): string => {
    switch (domain) {
      case "Ideas & Content":
        if (score >= 4) return "Your ideas are super creative and interesting, making your story really stand out!";
        if (score >= 3) return "You have some great, thoughtful ideas that make your writing engaging.";
        if (score >= 2) return "Your ideas are good, but you could add more unique thoughts to make them even better.";
        if (score >= 1) return "Your ideas are a bit simple and could use more imagination to make them exciting.";
        return "Your ideas are hard to find or don't quite fit the topic. Let's work on making them clearer and more imaginative!";
      case "Structure & Organization":
        if (score >= 4) return "Your writing flows perfectly, like a well-told story, with a clear beginning, middle, and end!";
        if (score >= 3) return "Your writing is well-organized, making it easy for the reader to follow your ideas.";
        if (score >= 2) return "Your writing has a clear plan, but sometimes the parts don't connect smoothly.";
        if (score >= 1) return "Your writing is a bit jumbled, and it's hard to see how your ideas fit together.";
        return "Your writing is hard to follow because it doesn't have a clear order. Let's practice organizing your thoughts!";
      case "Language & Vocabulary":
        if (score >= 4) return "You use amazing words and clever writing tricks that make your writing shine!";
        if (score >= 3) return "You use good words and some literary devices to make your writing interesting.";
        if (score >= 2) return "You use appropriate words, but trying out new words and phrases could make your writing even better.";
        if (score >= 1) return "Your words are simple, and you could try using more exciting language to express yourself.";
        return "Your vocabulary is very basic, and you don't use many literary devices. Let's discover new words and ways to write!";
      case "Spelling, Punctuation & Grammar":
        if (score >= 4) return "Your writing is almost perfect with spelling, punctuation, and grammar – fantastic!";
        if (score >= 3) return "You make very few mistakes in spelling, punctuation, and grammar. Great job!";
        if (score >= 2) return "You have some mistakes in spelling, punctuation, or grammar, but your writing is still easy to understand.";
        if (score >= 1) return "You make several mistakes in spelling, punctuation, and grammar, which sometimes makes your writing hard to read.";
        return "You have many mistakes in spelling, punctuation, and grammar, making your writing difficult to understand. Let's focus on the basics!";
      default:
        return "No specific explanation available for this domain.";
    }
  };

  // ADDED: Generate personalized recommendations
  const generatePersonalizedRecommendations = (): string[] => {
    const recommendations: string[] = [];
    const domains = [
      { name: "Ideas & Content", score: data.criteria.ideasContent.score, suggestions: [
        "Brainstorm more creative and original ideas using mind maps or freewriting.",
        "Develop your ideas with more details and examples to make them engaging.",
        "Ensure your writing directly addresses all parts of the prompt."
      ]},
      { name: "Structure & Organization", score: data.criteria.structureOrganization.score, suggestions: [
        "Practice organizing your thoughts with a clear introduction, body, and conclusion.",
        "Use topic sentences and transition words to improve paragraph flow.",
        "Plan your essay structure before you start writing."
      ]},
      { name: "Language & Vocabulary", score: data.criteria.languageVocab.score, suggestions: [
        "Expand your vocabulary by learning new words and their synonyms.",
        "Experiment with different literary devices like metaphors, similes, and personification.",
        "Vary your sentence structures to make your writing more interesting to read."
      ]},
      { name: "Spelling, Punctuation & Grammar", score: data.criteria.spellingPunctuationGrammar.score, suggestions: [
        "Review basic grammar rules, especially subject-verb agreement and tense consistency.",
        "Pay close attention to punctuation, particularly commas and apostrophes.",
        "Proofread your work carefully for spelling errors, perhaps reading it aloud."
      ]}
    ];

    // Sort domains by score to prioritize the lowest scoring areas
    domains.sort((a, b) => a.score - b.score);

    // Add personalized recommendations based on the lowest scoring domains
    for (const domain of domains) {
      if (domain.score <= 3) { // Consider scores 3 and below as needing improvement (out of 5)
        recommendations.push(`For ${domain.name}: ${domain.suggestions[0]}`);
        if (domain.score <= 2) { // For very low scores, add more specific suggestions
          recommendations.push(`For ${domain.name}: ${domain.suggestions[1]}`);
          recommendations.push(`For ${domain.name}: ${domain.suggestions[2]}`);
        }
      }
    }

    // Ensure there are at least a few general recommendations if all scores are high
    if (recommendations.length === 0) {
      recommendations.push("Keep up the great work! Continue to read widely and practice writing regularly to further hone your skills.");
      recommendations.push("Challenge yourself by experimenting with new writing styles or more complex prompts.");
    }

    return recommendations;
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
                  .child-friendly { background: #fce7f3; padding: 10px; margin: 10px 0; border-left: 4px solid #ec4899; }
                  .essay-content { background: #f8fafc; padding: 15px; margin: 10px 0; border: 1px solid #e2e8f0; }
                  .recommendations { background: #f3e8ff; padding: 10px; margin: 10px 0; }
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
    const personalizedRecommendations = generatePersonalizedRecommendations();
    
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
Child-Friendly Explanation:
${generateChildFriendlyExplanation("Ideas & Content", data.criteria.ideasContent.score)}

Strengths:
${data.criteria.ideasContent.strengths.map(s => `- ${s.text}`).join('\n')}

Areas for Improvement:
${data.criteria.ideasContent.improvements.map(i => `- ${i.issue}: ${i.suggestion}`).join('\n')}

STRUCTURE & ORGANIZATION:
Child-Friendly Explanation:
${generateChildFriendlyExplanation("Structure & Organization", data.criteria.structureOrganization.score)}

Strengths:
${data.criteria.structureOrganization.strengths.map(s => `- ${s.text}`).join('\n')}

Areas for Improvement:
${data.criteria.structureOrganization.improvements.map(i => `- ${i.issue}: ${i.suggestion}`).join('\n')}

LANGUAGE & VOCABULARY:
Child-Friendly Explanation:
${generateChildFriendlyExplanation("Language & Vocabulary", data.criteria.languageVocab.score)}

Strengths:
${data.criteria.languageVocab.strengths.map(s => `- ${s.text}`).join('\n')}

Areas for Improvement:
${data.criteria.languageVocab.improvements.map(i => `- ${i.issue}: ${i.suggestion}`).join('\n')}

SPELLING, PUNCTUATION & GRAMMAR:
Child-Friendly Explanation:
${generateChildFriendlyExplanation("Spelling, Punctuation & Grammar", data.criteria.spellingPunctuationGrammar.score)}

Strengths:
${data.criteria.spellingPunctuationGrammar.strengths.map(s => `- ${s.text}`).join('\n')}

Areas for Improvement:
${data.criteria.spellingPunctuationGrammar.improvements.map(i => `- ${i.issue}: ${i.suggestion}`).join('\n')}

PERSONALIZED LEARNING RECOMMENDATIONS:
${personalizedRecommendations.map((rec, index) => `${index + 1}. ${rec}`).join('\n')}

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

            {/* ADDED: Student's Original Essay Section */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-xl font-bold text-blue-800 mb-4 flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                Your Original Essay
              </h3>
              <div className="bg-white rounded-lg p-4 border">
                <pre className="whitespace-pre-wrap text-sm text-gray-700 font-mono leading-relaxed">
                  {essayText}
                </pre>
              </div>
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

                  {/* ADDED: Child-friendly explanation */}
                  <div className="bg-pink-50 border border-pink-200 rounded-lg p-4 mb-4">
                    <div className="flex items-start">
                      <Heart className="w-5 h-5 mr-2 mt-0.5 text-pink-500 flex-shrink-0" />
                      <div>
                        <h5 className="font-medium text-pink-800 mb-1">What this means for you:</h5>
                        <p className="text-sm text-pink-700">
                          {generateChildFriendlyExplanation(titles[key as keyof typeof titles], criterion.score)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {criterion.strengths.length > 0 && (
                    <div className="mb-4">
                      <h5 className="font-medium text-green-700 mb-2 flex items-center">
                        <Star className="w-4 h-4 mr-1" />
                        Strengths
                      </h5>
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
                      <h5 className="font-medium text-orange-700 mb-2 flex items-center">
                        <Target className="w-4 h-4 mr-1" />
                        Areas for Growth
                      </h5>
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

            {/* ADDED: Personalized Learning Recommendations */}
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
              <h3 className="text-xl font-bold text-purple-800 mb-4 flex items-center">
                <Lightbulb className="w-5 h-5 mr-2" />
                Personalized Learning Recommendations
              </h3>
              <div className="space-y-4">
                {generatePersonalizedRecommendations().map((recommendation, index) => (
                  <div key={index} className="flex items-start bg-white rounded-lg p-4 border border-purple-100">
                    <div className="bg-purple-100 rounded-full p-2 mr-4 flex-shrink-0">
                      <span className="text-purple-600 font-bold text-sm">
                        {index + 1}
                      </span>
                    </div>
                    <span className="text-purple-700 leading-relaxed">{recommendation}</span>
                  </div>
                ))}
              </div>
            </div>

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