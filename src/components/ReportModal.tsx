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
        return "🗺️ Your writing is hard to follow because it doesn't have a clear order. Let\'s practice organizing your thoughts with a simple plan first!";
      case "Language & Vocabulary":
        if (score >= 8) return "🎨 You use amazing words and clever writing tricks that make your writing shine like a diamond! Your vocabulary is impressive.";
        if (score >= 6) return "📖 You use good words and some literary devices to make your writing interesting and engaging to read.";
        if (score >= 4) return "🔤 You use appropriate words, but trying out new words and phrases could make your writing even more colorful and exciting.";
        if (score >= 2) return "📝 Your words are simple, and you could try using more exciting language to express yourself. Let\"s explore some new vocabulary together!";     case "Spelling, Punctuation & Grammar":
        if (score >= 8) return "🎯 Your writing is almost perfect with spelling, punctuation, and grammar – fantastic work! You\'re a careful editor.";
        if (score >= 6) return "✅ You make very few mistakes in spelling, punctuation, and grammar. Great job being careful with your writing!";
        if (score >= 4) return "⚠️ You have some mistakes in spelling, punctuation, or grammar, but your writing is still easy to understand. A little more proofreading will help!";
        if (score >= 2) return "🔍 You make several mistakes in spelling, punctuation, and grammar, which sometimes makes your writing hard to read. Let\'s focus on one area at a time.";
        return "📚 You have many mistakes in spelling, punctuation, and grammar, making your writing difficult to understand. Let\'s start with the basics and build up your skills!";
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
            description: "Make your ideas come alive by adding specific details that help readers picture what\'s happening.",
            examples: [
              "Instead of \'The door was old,\' try \'The wooden door creaked and groaned, its rusty hinges protesting with every movement.\'",
              "Instead of \'I was scared,\' try \'My heart pounded like a drum as goosebumps crawled up my arms.\'"
            ]
          },
          {
            title: "Develop Your Ideas Further",
            description: "Take your good ideas and expand on them with more explanation and examples.",
            examples: [
              "If you mention a character, tell us what they look like, how they act, and why they\'re important.",
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
              "Start with an exciting opening that grabs attention: \'The mysterious package arrived on the rainiest day of the year.\'",
              "Use connecting words like \'First,\' \'Then,\' \'Meanwhile,\' \'Finally\' to link your ideas together."
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
              "Instead of \'big,\' try \'enormous,\' \'gigantic,\' or \'massive.\'",
              "Instead of \'said,\' try \'whispered,\' \'shouted,\' \'mumbled,\' or \'declared.\'"
            ]
          },
          {
            title: "Add Literary Devices",
            description: "Use special writing techniques to make your writing more interesting and fun to read.",
            examples: [
              "Similes: \'The cat moved like a shadow in the night.\'",
              "Personification: \'The wind whispered secrets through the trees.\'"
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
              "After introductory phrases: \'After the storm passed, the sun came out.\'",
              "In lists: \'I packed sandwiches, apples, and cookies for the picnic.\'"
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
        description: "Since you\'re doing so well, try experimenting with new writing styles or more complex prompts.",
        examples: [
          "Write from a different character\'s point of view.",
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
        description: "Your writing has a clear structure that\'s easy to follow.",
        example: paragraphCount > 1 ? `You\'ve organized your ideas into ${paragraphCount} clear paragraphs.` : undefined
      });
    }
    
    if (data.criteria.languageVocab.score >= 6) {
      strengths.push({
        area: "Vocabulary",
        description: "You use interesting and appropriate words to express your ideas.",
        example: "Your word choices help create vivid pictures in the reader\'s mind."
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
        example: "Instead of saying \'The place was nice,\' describe what made it special: the colors, sounds, or feelings it gave you."
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
        example: "Instead of \'walked,\' try \'strolled,\' \'marched,\' \'tiptoed,\' or \'wandered\' depending on how the character moved."
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
          example: "In the sentence \'One rainy afternoon you stumble upon...\', add a comma after \'afternoon\': \'One rainy afternoon, you stumble upon...\'"
        });
      }
      
      if (hasCapitalizationIssues) {
        improvements.push({
          area: "Capitalization",
          issue: "The word \'I\' should always be capitalized.",
          suggestion: "Always write \'I\' as a capital letter, even in the middle of sentences.",
          example: "Change \'i think\' to \'I think\' and \'when i saw\' to \'when I saw.\'"
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
                  /* Basic Print Styles */
                  body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; color: #333; }
                  .modal-content { width: 100%; max-width: 800px; margin: 0 auto; padding: 0; }
                  .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #3b82f6; padding-bottom: 20px; }
                  .header h1 { color: #3b82f6; font-size: 2.5em; margin-bottom: 5px; }
                  .header p { color: #6b7280; font-size: 0.9em; }
                  .section-title { font-size: 1.8em; color: #1f2937; margin-top: 30px; margin-bottom: 15px; border-bottom: 1px solid #e5e7eb; padding-bottom: 10px; }
                  .subsection-title { font-size: 1.4em; color: #374151; margin-top: 20px; margin-bottom: 10px; }
                  .score-card { background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 15px; text-align: center; margin-bottom: 15px; }
                  .score-card h3 { color: #1e40af; margin-bottom: 5px; }
                  .score-card p { font-size: 0.9em; color: #4b5563; }
                  .score-display { font-size: 2.5em; font-weight: bold; color: #3b82f6; margin-top: 10px; }
                  .explanation-card { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 15px; margin-bottom: 15px; }
                  .explanation-card p { font-size: 0.95em; line-height: 1.5; color: #4b5563; }
                  .strengths, .improvements, .child-friendly, .recommendations { padding: 15px; margin: 10px 0; border-radius: 8px; }
                  .strengths { background: #f0fdf4; border-left: 4px solid #10b981; }
                  .improvements { background: #fef3c7; border-left: 4px solid #f59e0b; }
                  .child-friendly { background: #fce7f3; border-left: 4px solid #ec4899; }
                  .recommendations { background: #f3e8ff; border-left: 4px solid #8b5cf6; }
                  .icon { display: inline-block; margin-right: 8px; vertical-align: middle; }
                  .essay-content { background: #f8fafc; padding: 20px; margin: 15px 0; border: 1px solid #e2e8f0; border-radius: 8px; white-space: pre-wrap; word-wrap: break-word; }
                  h1, h2, h3 { color: #1f2937; }
                  .lint-fix-item { background: #fff; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px; margin-bottom: 10px; display: flex; align-items: center; }
                  .lint-fix-item .suggestion { flex-grow: 1; margin-right: 10px; }
                  .lint-fix-item button { background: #3b82f6; color: white; border: none; padding: 8px 12px; border-radius: 5px; cursor: pointer; font-size: 0.9em; }
                  .lint-fix-item button:hover { background: #2563eb; }
                  @media print {
                    body { margin: 0; }
                    .no-print { display: none; }
                  }
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
      console.error("Error exporting to PDF:", error);
      alert("Failed to export report to PDF. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  const overallScore = Math.round(
    (data.criteria.ideasContent.score +
      data.criteria.structureOrganization.score +
      data.criteria.languageVocab.score +
      data.criteria.spellingPunctuationGrammar.score) / 4
  );

  const overallGrade = getGrade(overallScore * 10);
  const overallGradeColor = getGradeColor(overallScore * 10);

  const specificStrengths = generateSpecificStrengths();
  const specificImprovements = generateSpecificImprovements();
  const personalizedRecommendations = generatePersonalizedRecommendations();

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 ${isOpen ? '' : 'hidden'}`}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex justify-between items-center p-4 border-b border-gray-200 no-print">
          <h2 className="text-2xl font-bold text-gray-800">Writing Assessment Report</h2>
          <div className="flex space-x-2">
            <button
              onClick={exportToPDF}
              className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
              disabled={isExporting}
            >
              {isExporting ? 'Exporting...' : <><Download className="mr-2 h-5 w-5" /> Export PDF</>}
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300"
            >
              <X className="h-6 w-6 text-gray-600" />
            </button>
          </div>
        </div>

        <div id="report-content" className="flex-grow overflow-y-auto p-6 text-gray-700 leading-relaxed">
          <div className="header mb-8 text-center">
            <h1 className="text-4xl font-extrabold text-blue-700 mb-2">Writing Assessment Report</h1>
            <p className="text-lg text-gray-600">For: <span className="font-semibold">{studentName}</span></p>
            <p className="text-sm text-gray-500">Date: {new Date(data.timestamp).toLocaleDateString()}</p>
          </div>

          <div className="mb-8">
            <h3 className="section-title flex items-center"><BarChart3 className="mr-2" /> Overall Performance</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="score-card bg-blue-50 border-blue-200">
                <h3 className="text-blue-800">Overall Score</h3>
                <p className="text-5xl font-extrabold text-blue-600 mt-2">{overallScore}<span className="text-3xl">/10</span></p>
              </div>
              <div className="score-card bg-green-50 border-green-200">
                <h3 className="text-green-800">Overall Grade</h3>
                <p className={`text-5xl font-extrabold ${overallGradeColor} mt-2`}>{overallGrade}</p>
              </div>
            </div>
          </div>

          <div className="mb-8">
            <h3 className="section-title flex items-center"><FileText className="mr-2" /> Essay Content</h3>
            <div className="essay-content">
              <p>{essayText}</p>
            </div>
          </div>

          <div className="mb-8">
            <h3 className="section-title flex items-center"><Award className="mr-2" /> Detailed Criteria Breakdown</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="explanation-card">
                <h4 className="subsection-title flex items-center"><Lightbulb className="mr-2" /> Ideas & Content ({data.criteria.ideasContent.score}/10)</h4>
                <p>{generateChildFriendlyExplanation("Ideas & Content", data.criteria.ideasContent.score)}</p>
                <div className="score-bar"><div className={`score-fill ${getGradeColor(data.criteria.ideasContent.score * 10)}`} style={{ width: `${data.criteria.ideasContent.score * 10}%` }}></div></div>
              </div>
              <div className="explanation-card">
                <h4 className="subsection-title flex items-center"><Target className="mr-2" /> Structure & Organization ({data.criteria.structureOrganization.score}/10)</h4>
                <p>{generateChildFriendlyExplanation("Structure & Organization", data.criteria.structureOrganization.score)}</p>
                <div className="score-bar"><div className={`score-fill ${getGradeColor(data.criteria.structureOrganization.score * 10)}`} style={{ width: `${data.criteria.structureOrganization.score * 10}%` }}></div></div>
              </div>
              <div className="explanation-card">
                <h4 className="subsection-title flex items-center"><BookOpen className="mr-2" /> Language & Vocabulary ({data.criteria.languageVocab.score}/10)</h4>
                <p>{generateChildFriendlyExplanation("Language & Vocabulary", data.criteria.languageVocab.score)}</p>
                <div className="score-bar"><div className={`score-fill ${getGradeColor(data.criteria.languageVocab.score * 10)}`} style={{ width: `${data.criteria.languageVocab.score * 10}%` }}></div></div>
              </div>
              <div className="explanation-card">
                <h4 className="subsection-title flex items-center"><CheckCircle className="mr-2" /> Spelling, Punctuation & Grammar ({data.criteria.spellingPunctuationGrammar.score}/10)</h4>
                <p>{generateChildFriendlyExplanation("Spelling, Punctuation & Grammar", data.criteria.spellingPunctuationGrammar.score)}</p>
                <div className="score-bar"><div className={`score-fill ${getGradeColor(data.criteria.spellingPunctuationGrammar.score * 10)}`} style={{ width: `${data.criteria.spellingPunctuationGrammar.score * 10}%` }}></div></div>
              </div>
            </div>
          </div>

          <div className="mb-8">
            <h3 className="section-title flex items-center"><Heart className="mr-2" /> Strengths</h3>
            <div className="strengths">
              {specificStrengths.length > 0 ? (
                specificStrengths.map((strength, index) => (
                  <div key={index} className="mb-4 last:mb-0">
                    <h4 className="font-semibold text-green-800 flex items-center"><Star className="mr-2 h-5 w-5" />{strength.area}</h4>
                    <p className="text-green-700 ml-7">{strength.description}</p>
                    {strength.example && <p className="text-green-600 text-sm italic ml-7">Example: {strength.example}</p>}
                  </div>
                ))
              ) : (
                <p className="text-green-700">No specific strengths identified at this time, but keep up the great work!</p>
              )}
            </div>
          </div>

          <div className="mb-8">
            <h3 className="section-title flex items-center"><AlertCircle className="mr-2" /> Areas for Improvement</h3>
            <div className="improvements">
              {specificImprovements.length > 0 ? (
                specificImprovements.map((improvement, index) => (
                  <div key={index} className="mb-4 last:mb-0">
                    <h4 className="font-semibold text-yellow-800 flex items-center"><TrendingUp className="mr-2 h-5 w-5" />{improvement.area} - {improvement.issue}</h4>
                    <p className="text-yellow-700 ml-7">Suggestion: {improvement.suggestion}</p>
                    {improvement.example && <p className="text-yellow-600 text-sm italic ml-7">Example: {improvement.example}</p>}
                  </div>
                ))
              ) : (
                <p className="text-yellow-700">Great job! No major areas for improvement identified. Keep refining your skills!</p>
              )}
            </div>
          </div>

          <div className="mb-8">
            <h3 className="section-title flex items-center"><Lightbulb className="mr-2" /> Personalized Recommendations</h3>
            <div className="recommendations">
              {personalizedRecommendations.length > 0 ? (
                personalizedRecommendations.map((rec, index) => (
                  <div key={index} className="mb-4 last:mb-0">
                    <h4 className="font-semibold text-purple-800 flex items-center"><Star className="mr-2 h-5 w-5" />{rec.title}</h4>
                    <p className="text-purple-700 ml-7">{rec.description}</p>
                    {rec.examples && rec.examples.length > 0 && (
                      <ul className="list-disc list-inside text-purple-600 text-sm italic ml-7">
                        {rec.examples.map((example, exIndex) => (
                          <li key={exIndex}>{example}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-purple-700">No specific recommendations at this time. Keep exploring and practicing!</p>
              )}
            </div>
          </div>

          {data.lint_fixes && data.lint_fixes.length > 0 && (
            <div className="mb-8 no-print">
              <h3 className="section-title flex items-center"><X className="mr-2" /> Suggested Fixes</h3>
              <p className="mb-4 text-gray-600">Here are some suggested fixes for common writing issues:</p>
              <div className="space-y-4">
                {data.lint_fixes.map((fix, index) => (
                  <div key={index} className="lint-fix-item">
                    <div className="suggestion">
                      <p className="font-semibold text-gray-800">Issue: {fix.issue}</p>
                      <p className="text-gray-600">Suggestion: {fix.suggestion}</p>
                      {fix.example && <p className="text-gray-500 text-sm italic">Example: {fix.example}</p>}
                    </div>
                    <button onClick={() => onApplyFix(fix)}>Apply Fix</button>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

