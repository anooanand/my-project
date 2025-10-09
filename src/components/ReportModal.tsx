import React, { useState } from 'react';
import { X, Download, FileText, Printer, Share2, Heart, Lightbulb, Star, Target, CheckCircle, AlertCircle, TrendingUp, BookOpen, Award, BarChart3 } from 'lucide-react';
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

  // ENHANCED: Child-friendly explanation generator with more detailed and encouraging language
  const generateChildFriendlyExplanation = (domain: string, score: number): string => {
    switch (domain) {
      case "Ideas & Content":
        if (score >= 8) return "🌟 Wow! Your ideas are super creative and interesting, making your story really stand out! You have a wonderful imagination that brings your writing to life.";
        if (score >= 6) return "✨ You have some great, thoughtful ideas that make your writing engaging. Your creativity is shining through!";
        if (score >= 4) return "💡 Your ideas are good, but you could add more unique thoughts and details to make them even more exciting and interesting.";
        if (score >= 2) return "🌱 Your ideas are starting to form, but they need more imagination and details to truly come alive. Think about adding more descriptions or unexpected twists!";
        return "🎯 Your ideas are hard to find or don't quite fit the topic. Let's work together on making them clearer and more imaginative! Remember, every great writer started somewhere.";
      case "Structure & Organization":
        if (score >= 8) return "🏗️ Your writing flows perfectly, like a well-told story, with a clear beginning, middle, and end! You\'ve mastered the art of organization.";
        if (score >= 6) return "📚 Your writing is well-organized, making it easy for the reader to follow your ideas from start to finish.";
        if (score >= 4) return "🔗 Your writing has a clear plan, but sometimes the parts don\'t connect as smoothly as they could. Try using more connecting words!";
        if (score >= 2) return "🧩 Your writing is a bit jumbled, and it\'s hard to see how your ideas fit together. Let\'s practice organizing your thoughts step by step.";
        return "🗺️ Your writing is hard to follow because it doesn't have a clear order. Let's practice organizing your thoughts with a simple plan first!";
      case "Language & Vocabulary":
        if (score >= 8) return "🎨 You use amazing words and clever writing tricks that make your writing shine like a diamond! Your vocabulary is impressive.";
        if (score >= 6) return "📖 You use good words and some literary devices to make your writing interesting and engaging to read.";
        if (score >= 4) return "🔤 You use appropriate words, but trying out new words and phrases could make your writing even more colorful and exciting.";
        if (score >= 2) return "📝 Your words are simple, and you could try using more exciting language to express yourself. Let\"s explore some new vocabulary together!";     case "Spelling, Punctuation & Grammar":
        if (score >= 8) return "🎯 Your writing is almost perfect with spelling, punctuation, and grammar – fantastic work! You're a careful editor.";
        if (score >= 6) return "✅ You make very few mistakes in spelling, punctuation, and grammar. Great job being careful with your writing!";
        if (score >= 4) return "⚠️ You have some mistakes in spelling, punctuation, or grammar, but your writing is still easy to understand. A little more proofreading will help!";
        if (score >= 2) return "🔍 You make several mistakes in spelling, punctuation, and grammar, which sometimes makes your writing hard to read. Let's focus on one area at a time.";
        return "📚 You have many mistakes in spelling, punctuation, and grammar, making your writing difficult to understand. Let's start with the basics and build up your skills!";
      default:
        return "No specific explanation available for this domain.";
    }
  };

  // ENHANCED: Generate specific, actionable recommendations with concrete examples
  const generatePersonalizedRecommendations = (): Array<{title: string, description: string, examples: string[]}> => {
    const recommendations: Array<{title: string, description: string, examples: string[]}> = [];
    const domains = [
      { 
        name: "Ideas & Content", 
        score: data.criteria.ideasContent.score, 
        suggestions: [
          {
            title: "Add More Creative Details",
            description: "Make your ideas come alive by adding specific details that help readers picture what's happening.",
            examples: [
              "Instead of 'The door was old,' try 'The wooden door creaked and groaned, its rusty hinges protesting with every movement.'",
              "Instead of 'I was scared,' try 'My heart pounded like a drum as goosebumps crawled up my arms.'"
            ]
          },
          {
            title: "Develop Your Ideas Further",
            description: "Take your good ideas and expand on them with more explanation and examples.",
            examples: [
              "If you mention a character, tell us what they look like, how they act, and why they're important.",
              "If you describe a place, use your five senses: what do you see, hear, smell, feel, and taste?"
            ]
          }
        ]
      },
      { 
        name: "Structure & Organization", 
        score: data.criteria.structureOrganization.score, 
        suggestions: [
          {
            title: "Improve Your Story Flow",
            description: "Help your readers follow your story by organizing your ideas in a logical order.",
            examples: [
              "Start with an exciting opening that grabs attention: 'The mysterious package arrived on the rainiest day of the year.'",
              "Use connecting words like 'First,' 'Then,' 'Meanwhile,' 'Finally' to link your ideas together."
            ]
          },
          {
            title: "Create Stronger Paragraphs",
            description: "Each paragraph should focus on one main idea and connect smoothly to the next.",
            examples: [
              "Start each paragraph with a topic sentence that tells the main idea.",
              "End paragraphs with a sentence that leads into the next part of your story."
            ]
          }
        ]
      },
      { 
        name: "Language & Vocabulary", 
        score: data.criteria.languageVocab.score, 
        suggestions: [
          {
            title: "Use More Exciting Words",
            description: "Replace simple words with more interesting ones to make your writing more engaging.",
            examples: [
              "Instead of 'big,' try 'enormous,' 'gigantic,' or 'massive.'",
              "Instead of 'said,' try 'whispered,' 'shouted,' 'mumbled,' or 'declared.'"
            ]
          },
          {
            title: "Add Literary Devices",
            description: "Use special writing techniques to make your writing more interesting and fun to read.",
            examples: [
              "Similes: 'The cat moved like a shadow in the night.'",
              "Personification: 'The wind whispered secrets through the trees.'"
            ]
          }
        ]
      },
      { 
        name: "Spelling, Punctuation & Grammar", 
        score: data.criteria.spellingPunctuationGrammar.score, 
        suggestions: [
          {
            title: "Master Comma Usage",
            description: "Learn when and where to use commas to make your sentences clearer and easier to read.",
            examples: [
              "After introductory phrases: 'After the storm passed, the sun came out.'",
              "In lists: 'I packed sandwiches, apples, and cookies for the picnic.'"
            ]
          },
          {
            title: "Proofread Carefully",
            description: "Always check your work for spelling and grammar mistakes before finishing.",
            examples: [
              "Read your work out loud to catch mistakes your eyes might miss.",
              "Check that every sentence starts with a capital letter and ends with proper punctuation."
            ]
          }
        ]
      }
    ];

    // Sort domains by score to prioritize the lowest scoring areas
    domains.sort((a, b) => a.score - b.score);

    // Add personalized recommendations based on the lowest scoring domains
    for (const domain of domains) {
      if (domain.score <= 6) { // Consider scores 6 and below as needing improvement (out of 10) 
        recommendations.push(domain.suggestions[0]);
        if (domain.score <= 4) { // For very low scores, add more specific suggestions
          recommendations.push(domain.suggestions[1]);
        }
      }
    }

    // Ensure there are at least a few general recommendations if all scores are high
    if (recommendations.length === 0) {
      recommendations.push({
        title: "Keep Up the Great Work!",
        description: "Your writing is already strong. Continue to read widely and practice writing regularly to further hone your skills.",
        examples: [
          "Try writing in different genres like mystery, adventure, or fantasy.",
          "Read books by your favorite authors and notice how they use language."
        ]
      });
      recommendations.push({
        title: "Challenge Yourself",
        description: "Since you're doing so well, try experimenting with new writing styles or more complex prompts.",
        examples: [
          "Write from a different character's point of view.",
          "Try writing a story that takes place in a completely different time period."
        ]
      });
    }

    return recommendations.slice(0, 3); // Limit to top 3 recommendations
  };

  // ENHANCED: Generate specific strengths with concrete examples from the text
  const generateSpecificStrengths = (): Array<{area: string, description: string, example?: string}> => {
    const strengths: Array<{area: string, description: string, example?: string}> = [];
    
    if (data.criteria.ideasContent.score >= 6) {
      const firstSentence = essayText.split(/[.!?]+/)[0]?.trim();
      strengths.push({
        area: "Creative Ideas",
        description: "You show great imagination and creativity in your writing.",
        example: firstSentence ? `Your opening "${firstSentence}..." immediately draws the reader in.` : undefined
      });
    }
    
    if (data.criteria.structureOrganization.score >= 6) {
      const paragraphCount = essayText.split(/\n\s*\n/).filter(p => p.trim().length > 0).length;
      strengths.push({
        area: "Organization",
        description: "Your writing has a clear structure that's easy to follow.",
        example: paragraphCount > 1 ? `You've organized your ideas into ${paragraphCount} clear paragraphs.` : undefined
      });
    }
    
    if (data.criteria.languageVocab.score >= 6) {
      strengths.push({
        area: "Vocabulary",
        description: "You use interesting and appropriate words to express your ideas.",
        example: "Your word choices help create vivid pictures in the reader's mind."
      });
    }
    
    if (data.criteria.spellingPunctuationGrammar.score >= 6) {
      strengths.push({
        area: "Technical Skills",
        description: "You show good control of spelling, punctuation, and grammar.",
        example: "Your careful attention to detail makes your writing easy to read and understand."
      });
    }

    return strengths;
  };

  // ENHANCED: Generate specific areas for improvement with concrete examples
  const generateSpecificImprovements = (): Array<{area: string, issue: string, suggestion: string, example?: string}> => {
    const improvements: Array<{area: string, issue: string, suggestion: string, example?: string}> = [];
    
    if (data.criteria.ideasContent.score < 6) {
      improvements.push({
        area: "Ideas & Content",
        issue: "Your ideas need more development and detail.",
        suggestion: "Add more specific descriptions and examples to bring your ideas to life.",
        example: "Instead of saying 'The place was nice,' describe what made it special: the colors, sounds, or feelings it gave you."
      });
    }
    
    if (data.criteria.structureOrganization.score < 6) {
      improvements.push({
        area: "Structure & Organization",
        issue: "Your writing could be better organized.",
        suggestion: "Plan your writing with a clear beginning, middle, and end before you start.",
        example: "Try making an outline: Introduction (hook the reader) → Body (main events) → Conclusion (wrap up the story)."
      });
    }
    
    if (data.criteria.languageVocab.score < 6) {
      improvements.push({
        area: "Language & Vocabulary",
        issue: "Your vocabulary could be more varied and interesting.",
        suggestion: "Try using more descriptive and exciting words instead of simple ones.",
        example: "Instead of 'walked,' try 'strolled,' 'marched,' 'tiptoed,' or 'wandered' depending on how the character moved."
      });
    }
    
    if (data.criteria.spellingPunctuationGrammar.score < 6) {
      // Look for specific issues in the text
      const hasCommaIssues = essayText.includes('afternoon you') || essayText.includes('However you') || essayText.includes('Finally you');
      const hasCapitalizationIssues = /\bi\s/.test(essayText);
      
      if (hasCommaIssues) {
        improvements.push({
          area: "Punctuation",
          issue: "Missing commas after introductory phrases.",
          suggestion: "Remember to use a comma after introductory words or phrases.",
          example: "In the sentence 'One rainy afternoon you stumble upon...', add a comma after 'afternoon': 'One rainy afternoon, you stumble upon...'"
        });
      }
      
      if (hasCapitalizationIssues) {
        improvements.push({
          area: "Capitalization",
          issue: "The word 'I' should always be capitalized.",
          suggestion: "Always write 'I' as a capital letter, even in the middle of sentences.",
          example: "Change 'i think' to 'I think' and 'when i saw' to 'when I saw.'"
        });
      }
      
      if (!hasCommaIssues && !hasCapitalizationIssues) {
        improvements.push({
          area: "Spelling & Grammar",
          issue: "There are some spelling or grammar mistakes that make your writing harder to read.",
          suggestion: "Read your work out loud and check each sentence carefully.",
          example: "Try reading your work backwards, sentence by sentence, to catch mistakes you might miss when reading normally."
        });
      }
    }

    return improvements;
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
                  body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
                  .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #3b82f6; padding-bottom: 20px; }
                  .score-section { margin: 20px 0; }
                  .criterion { margin: 15px 0; padding: 15px; border: 1px solid #ddd; border-radius: 8px; }
                  .score-bar { height: 20px; background: #f0f0f0; border-radius: 10px; margin: 5px 0; }
                  .score-fill { height: 100%; border-radius: 10px; }
                  .green { background: #10b981; }
                  .yellow { background: #f59e0b; }
                  .red { background: #ef4444; }
                  .strengths { background: #f0fdf4; padding: 15px; margin: 10px 0; border-radius: 8px; border-left: 4px solid #10b981; }
                  .improvements { background: #fef3c7; padding: 15px; margin: 10px 0; border-radius: 8px; border-left: 4px solid #f59e0b; }
                  .child-friendly { background: #fce7f3; padding: 15px; margin: 10px 0; border-left: 4px solid #ec4899; border-radius: 8px; }
                  .essay-content { background: #f8fafc; padding: 20px; margin: 15px 0; border: 1px solid #e2e8f0; border-radius: 8px; }
                  .recommendations { background: #f3e8ff; padding: 15px; margin: 10px 0; border-radius: 8px; border-left: 4px solid #8b5cf6; }
                  .icon { display: inline-block; margin-right: 8px; }
                  h1, h2, h3 { color: #1f2937; }
                  .score-display { font-size: 2em; font-weight: bold; color: #3b82f6; }
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
    const specificStrengths = generateSpecificStrengths();
    const specificImprovements = generateSpecificImprovements();
    
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

CHILD-FRIENDLY EXPLANATIONS:

IDEAS & CONTENT:
${generateChildFriendlyExplanation("Ideas & Content", data.criteria.ideasContent.score)}

STRUCTURE & ORGANIZATION:
${generateChildFriendlyExplanation("Structure & Organization", data.criteria.structureOrganization.score)}

LANGUAGE & VOCABULARY:
${generateChildFriendlyExplanation("Language & Vocabulary", data.criteria.languageVocab.score)}

SPELLING, PUNCTUATION & GRAMMAR:
${generateChildFriendlyExplanation("Spelling, Punctuation & Grammar", data.criteria.spellingPunctuationGrammar.score)}

YOUR STRENGTHS:
${specificStrengths.map((strength, index) => `${index + 1}. ${strength.area}: ${strength.description}${strength.example ? '\n   Example: ' + strength.example : ''}`).join('\n')}

AREAS FOR IMPROVEMENT:
${specificImprovements.map((improvement, index) => `${index + 1}. ${improvement.area}: ${improvement.issue}\n   Suggestion: ${improvement.suggestion}${improvement.example ? '\n   Example: ' + improvement.example : ''}`).join('\n')}

YOUR NEXT STEPS FOR IMPROVEMENT:
${personalizedRecommendations.map((rec, index) => `${index + 1}. ${rec.title}: ${rec.description}\n   Examples:\n   ${rec.examples.map(ex => `   • ${ex}`).join('\n')}`).join('\n')}

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
    const actualScorePercentage = (score / maxScore) * 100;
    const barWidthPercentage = Math.min(100, Math.max(0, actualScorePercentage)); // Ensure bar width is between 0 and 100%

    const getColor = (percentage: number) => {
      if (percentage >= 80) return 'bg-green-500';
      if (percentage >= 60) return 'bg-yellow-500';
      return 'bg-red-500';
    };

    const getScoreDescription = (percentage: number) => {
      if (percentage >= 80) return "Excellent";
      if (percentage >= 60) return "Good";
      if (percentage >= 40) return "Developing";
      return "Needs Practice";
    };

    return (
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex justify-between items-center mb-3">
          <span className="font-medium text-lg">{label}</span>
          <div className="flex items-center space-x-3">
            <span className="text-lg font-bold">{score}/{maxScore}</span>
            <span className="text-sm text-gray-600">({weight}%)</span>
            <span className={`text-sm font-medium px-2 py-1 rounded ${
              actualScorePercentage >= 80 ? 'bg-green-100 text-green-800' :
              actualScorePercentage >= 60 ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'
            }`}>
              {getScoreDescription(actualScorePercentage)}
            </span>
          </div>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-4">
          <div
            className={`h-4 rounded-full transition-all duration-500 ${getColor(actualScorePercentage)}`}
            style={{ width: `${barWidthPercentage}%` }}
          />
        </div>
      </div>
    );
  };

  const personalizedRecommendations = generatePersonalizedRecommendations();
  const specificStrengths = generateSpecificStrengths();
  const specificImprovements = generateSpecificImprovements();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold mb-2 flex items-center">
                <Award className="w-8 h-8 mr-3" />
                NSW Writing Assessment Report
              </h1>
              <p className="text-blue-100">Your Personal Writing Journey Report</p>
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
          
          <div className="mt-6 flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div>
                <p className="text-blue-100 text-sm">Overall Score</p>
                <div className="flex items-center space-x-3">
                  <span className="text-5xl font-bold">{data.overallScore}</span>
                  <span className="text-blue-200 text-2xl">/100</span>
                  <span className={`text-4xl font-bold px-3 py-1 rounded-lg bg-white/20 ${getGradeColor(data.overallScore)}`}>
                    {getGrade(data.overallScore)}
                  </span>
                </div>
              </div>
              <div className="text-center">
                <Star className="w-12 h-12 mx-auto mb-2 text-yellow-300" />
                <p className="text-blue-100 text-sm">Great Job!</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-blue-100 text-lg font-medium">Student: {studentName}</p>
              <p className="text-blue-100 text-sm">Date: {new Date().toLocaleDateString()}</p>
              <p className="text-xs text-blue-200">Report ID: {data.id}</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-200px)]" id="report-content">
          <div className="p-6 space-y-8">
            
            {/* Child-Friendly Score Explanations */}
            <div className="bg-gradient-to-r from-pink-50 to-purple-50 p-6 rounded-lg border border-pink-200">
              <h3 className="font-bold mb-4 text-xl flex items-center text-purple-800">
                <Heart className="w-6 h-6 mr-2" />
                What Your Scores Mean
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-lg border border-pink-100">
                  <h4 className="font-semibold text-purple-700 mb-2">Ideas & Content ({data.criteria.ideasContent.score}/10) </h4>
                  <p className="text-sm text-gray-700">{generateChildFriendlyExplanation("Ideas & Content", data.criteria.ideasContent.score)}</p>
                </div>
                <div className="bg-white p-4 rounded-lg border border-pink-100">
                  <h4 className="font-semibold text-purple-700 mb-2">Structure & Organization ({data.criteria.structureOrganization.score}/10) </h4>
                  <p className="text-sm text-gray-700">{generateChildFriendlyExplanation("Structure & Organization", data.criteria.structureOrganization.score)}</p>
                </div>
                <div className="bg-white p-4 rounded-lg border border-pink-100">
                  <h4 className="font-semibold text-purple-700 mb-2">Language & Vocabulary ({data.criteria.languageVocab.score}/10) </h4>
                  <p className="text-sm text-gray-700">{generateChildFriendlyExplanation("Language & Vocabulary", data.criteria.languageVocab.score)}</p>
                </div>
                <div className="bg-white p-4 rounded-lg border border-pink-100">
                  <h4 className="font-semibold text-purple-700 mb-2">Spelling & Grammar ({data.criteria.spellingPunctuationGrammar.score}/10) </h4>
                  <p className="text-sm text-gray-700">{generateChildFriendlyExplanation("Spelling, Punctuation & Grammar", data.criteria.spellingPunctuationGrammar.score)}</p>
                </div>
              </div>
            </div>

            {/* Criteria Overview with Enhanced Visuals */}
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="font-bold mb-6 text-xl flex items-center">
                <BarChart3 className="w-6 h-6 mr-2 text-blue-600" />
                Your Writing Skills Breakdown
              </h3>
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

            {/* Enhanced Strengths Section */}
            {specificStrengths.length > 0 && (
              <div className="bg-green-50 p-6 rounded-lg border border-green-200">
                <h3 className="font-bold mb-4 text-xl flex items-center text-green-800">
                  <CheckCircle className="w-6 h-6 mr-2" />
                  Your Amazing Strengths! 🌟
                </h3>
                <div className="space-y-4">
                  {specificStrengths.map((strength, index) => (
                    <div key={index} className="bg-white p-4 rounded-lg border border-green-100">
                      <h4 className="font-semibold text-green-700 mb-2">{strength.area}</h4>
                      <p className="text-gray-700 mb-2">{strength.description}</p>
                      {strength.example && (
                        <p className="text-sm text-green-600 italic bg-green-50 p-2 rounded">
                          💡 {strength.example}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Enhanced Areas for Improvement Section */}
            {specificImprovements.length > 0 && (
              <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-200">
                <h3 className="font-bold mb-4 text-xl flex items-center text-yellow-800">
                  <Target className="w-6 h-6 mr-2" />
                  Areas to Make Even Better! 🎯
                </h3>
                <div className="space-y-4">
                  {specificImprovements.map((improvement, index) => (
                    <div key={index} className="bg-white p-4 rounded-lg border border-yellow-100">
                      <h4 className="font-semibold text-yellow-700 mb-2">{improvement.area}</h4>
                      <p className="text-gray-700 mb-2"><strong>What to work on:</strong> {improvement.issue}</p>
                      <p className="text-gray-700 mb-2"><strong>How to improve:</strong> {improvement.suggestion}</p>
                      {improvement.example && (
                        <div className="bg-yellow-50 p-3 rounded border-l-4 border-yellow-400">
                          <p className="text-sm text-yellow-700">
                            <strong>Example:</strong> {improvement.example}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Enhanced Personalized Recommendations Section */}
            <div className="bg-purple-50 p-6 rounded-lg border border-purple-200">
              <h3 className="font-bold mb-4 text-xl flex items-center text-purple-800">
                <TrendingUp className="w-6 h-6 mr-2" />
                Your Next Steps to Level Up! 🚀
              </h3>
              <p className="text-purple-700 mb-4">Here are some specific things you can practice to make your writing even more amazing:</p>
              <div className="space-y-6">
                {personalizedRecommendations.map((rec, index) => (
                  <div key={index} className="bg-white p-5 rounded-lg border border-purple-100">
                    <h4 className="font-semibold text-purple-700 mb-3 flex items-center">
                      <span className="bg-purple-100 text-purple-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-2">
                        {index + 1}
                      </span>
                      {rec.title}
                    </h4>
                    <p className="text-gray-700 mb-3">{rec.description}</p>
                    <div className="bg-purple-50 p-3 rounded">
                      <p className="text-sm font-medium text-purple-700 mb-2">Try these examples:</p>
                      <ul className="space-y-1">
                        {rec.examples.map((example, exIndex) => (
                          <li key={exIndex} className="text-sm text-purple-600 flex items-start">
                            <span className="mr-2">•</span>
                            <span>{example}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Original Essay Section - FIXED: Now shows actual essay */}
            <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
              <h3 className="font-bold mb-4 text-xl flex items-center text-blue-800">
                <BookOpen className="w-6 h-6 mr-2" />
                Your Original Essay
              </h3>
              <div className="bg-white p-4 rounded-lg border border-blue-100 max-h-96 overflow-y-auto">
                <pre className="whitespace-pre-wrap text-gray-700 font-sans leading-relaxed">
                  {essayText || "No essay content available."}
                </pre>
              </div>
            </div>

            {/* Encouragement Footer */}
            <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-lg border border-green-200 text-center">
              <h3 className="font-bold text-xl text-green-800 mb-2">Keep Writing and Growing! 🌱</h3>
              <p className="text-green-700">
                Remember, every great writer started as a beginner. You're on an amazing journey of discovery and creativity. 
                Keep practicing, keep dreaming, and most importantly, keep writing! Your unique voice and imagination are what make your stories special.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}