import React, { useState } from 'react';
import { NSWEnhancedWritingInterface } from './NSWEnhancedWritingInterface';
import { NSWMarkingRubric } from './NSWMarkingRubric';
import { WritingTechniqueModules } from './WritingTechniqueModules';
import { GamificationSystem } from './GamificationSystem';
import { Play, BookOpen, Target, Award, Zap, BarChart3 } from 'lucide-react';

export function NSWDemoPage() {
  const [activeDemo, setActiveDemo] = useState('interface');

  // Sample essay for demonstration
  const sampleEssay = `The old attic was Leo's secret kingdom. Dust motes danced in the single sunbeam slanting from the grimy window, illuminating forgotten treasures. One sweltering afternoon, while rummaging through a dusty trunk, his fingers brushed against something smooth and cool.

It was a stone, no bigger than his palm, but it pulsed with a soft, inner light. As he picked it up, the light flared, and a voice, ancient and melodic, echoed in his mind. "At last," it whispered, "a new guardian."

Leo, a boy who usually blended into the background, was now the keeper of a secret that hummed with untold power. The stone, which he named 'Lumin,' would whisper stories of forgotten constellations and teach him the language of the rustling leaves. His world, once confined to the four walls of his room and the pages of his books, expanded to encompass the universe.

"You see now, don't you?" Lumin's voice was a gentle hum in his mind.

"I do," Leo would whisper back, his heart swelling with a strange new joy.

His newfound perception, however, came with a price. He could feel the loneliness of the forgotten teddy bear in the attic, the fear of the fledgling that had fallen from its nest, and the silent pain of the wilting flower in the garden. It was a heavy burden for a ten-year-old.

One evening, as he sat by his window, the moon casting long shadows across his room, he clutched Lumin tightly. "I don't know if I can do this," he confessed, his voice trembling. "It's too much."

Lumin's light softened, and the voice was full of a gentle understanding. "You are not alone, Leo. You have the heart of a guardian. You feel deeply, and that is your strength. Now, you must learn to channel it."

From that day on, Leo didn't just see the world; he started to change it. He rescued the fledgling, building it a new nest and feeding it until it was strong enough to fly. He replanted the wilting flower, watering it daily and whispering words of encouragement. He even brought the forgotten teddy bear down from the attic, giving it a place of honor on his bed.

The stone had not just given him a magical gift; it had shown him the magic within himself. He was no longer just Leo, the quiet boy. He was Leo, the guardian, and his life, once a simple story, had become an epic adventure.`;

  // Sample analysis data
  const sampleAnalysisData = {
    ideasAndContent: {
      name: "Ideas and Content",
      weight: 30,
      score: 8,
      maxScore: 10,
      strengths: [
        "Excellent creative concept with the magical stone 'Lumin'",
        "Strong character development showing Leo's transformation",
        "Engaging plot with clear emotional journey",
        "Good use of fantasy elements grounded in reality"
      ],
      improvements: [
        "Could develop the backstory of why Leo was in the attic",
        "The magical system could be explained more clearly",
        "Consider adding more sensory details to enhance immersion"
      ],
      specificExamples: [
        "\"The old attic was Leo's secret kingdom\" - Great opening that immediately establishes setting and character",
        "\"You have the heart of a guardian\" - Powerful dialogue that drives character development"
      ],
      suggestions: [
        "Add a brief scene showing Leo's life before finding the stone to create stronger contrast",
        "Include more specific details about how the stone's power manifests in the real world"
      ]
    },
    textStructure: {
      name: "Text Structure and Organization",
      weight: 25,
      score: 7,
      maxScore: 10,
      strengths: [
        "Clear narrative arc with beginning, middle, and end",
        "Good use of paragraphs to organize different story beats",
        "Effective transitions between scenes",
        "Strong opening and closing"
      ],
      improvements: [
        "The middle section could be better paced",
        "Some paragraphs could be split for better flow",
        "The resolution feels slightly rushed"
      ],
      specificExamples: [
        "Paragraph 1: Excellent scene-setting",
        "Paragraph 4: Good transition showing the burden of power",
        "Final paragraph: Strong circular structure returning to Leo's identity"
      ],
      suggestions: [
        "Consider breaking the longer paragraphs (especially paragraph 6) into smaller chunks",
        "Add a transitional sentence between the discovery and Leo's first use of his powers"
      ]
    },
    languageFeatures: {
      name: "Language Features and Vocabulary",
      weight: 25,
      score: 9,
      maxScore: 10,
      strengths: [
        "Sophisticated vocabulary appropriate for the genre",
        "Excellent use of imagery and sensory details",
        "Strong metaphors and personification",
        "Varied and engaging sentence structures"
      ],
      improvements: [
        "Some word choices could be more precise",
        "Could use more varied dialogue tags",
        "Opportunity for more complex literary devices"
      ],
      specificExamples: [
        "\"Dust motes danced\" - Excellent personification",
        "\"ancient and melodic\" - Great adjective choice for the voice",
        "\"swelling with a strange new joy\" - Effective emotional description"
      ],
      suggestions: [
        "Instead of 'said' repeatedly, try 'whispered', 'murmured', or 'confessed'",
        "Consider adding more similes to complement your metaphors"
      ]
    },
    grammarAndPunctuation: {
      name: "Spelling, Punctuation, and Grammar",
      weight: 20,
      score: 8,
      maxScore: 10,
      strengths: [
        "Generally accurate spelling throughout",
        "Good use of punctuation for dialogue",
        "Consistent tense usage",
        "Proper paragraph structure"
      ],
      improvements: [
        "Some comma splices could be corrected",
        "Apostrophe usage could be more consistent",
        "A few run-on sentences need breaking up"
      ],
      specificExamples: [
        "Correct: \"Leo's secret kingdom\" - proper possessive",
        "Correct: \"'At last,' it whispered\" - proper dialogue punctuation"
      ],
      suggestions: [
        "In 'It was a stone, no bigger than his palm, but it pulsed...' - consider using a semicolon instead of comma before 'but'",
        "Check for consistency in contractions throughout the piece"
      ]
    },
    overallScore: 80,
    narrativeStructure: {
      orientation: true,
      complication: true,
      risingAction: true,
      climax: true,
      resolution: true,
      coda: true
    },
    showDontTellAnalysis: {
      tellingInstances: [
        {
          text: "It was a heavy burden for a ten-year-old.",
          suggestion: "Instead of telling us it was heavy, show Leo's physical reaction: 'Leo's shoulders sagged as if carrying an invisible weight. His usual quick steps became slow and deliberate, each footfall echoing the weight of his new responsibility.'"
        },
        {
          text: "He was no longer just Leo, the quiet boy.",
          suggestion: "Show this transformation through actions: 'Where once Leo would have hurried past the injured bird, now he knelt beside it, his hands steady and sure as he crafted a makeshift nest.'"
        }
      ],
      showingInstances: [
        "Dust motes danced in the single sunbeam slanting from the grimy window",
        "his fingers brushed against something smooth and cool",
        "the light flared, and a voice, ancient and melodic, echoed in his mind",
        "his heart swelling with a strange new joy"
      ]
    },
    literaryDevices: {
      identified: [
        "Metaphor: 'The old attic was Leo's secret kingdom'",
        "Personification: 'Dust motes danced'",
        "Imagery: 'smooth and cool', 'pulsed with a soft, inner light'",
        "Dialogue: Direct speech between Leo and Lumin"
      ],
      suggestions: [
        "Try adding a simile to describe Leo's transformation: 'Like a butterfly emerging from its chrysalis...'",
        "Consider using alliteration for the stone's power: 'pulsing, powerful presence'",
        "Add symbolism: the attic could represent Leo's hidden potential"
      ]
    },
    sentenceVariety: {
      simple: 12,
      compound: 8,
      complex: 11,
      suggestions: [
        "Try combining some simple sentences with conjunctions",
        "Use more subordinate clauses to create complex sentences",
        "Vary sentence beginnings - not all need to start with 'He' or 'Leo'"
      ]
    }
  };

  const sampleUserProgress = {
    totalPoints: 450,
    level: 5,
    essaysWritten: 8,
    averageScore: 78,
    badges: ['first-essay', 'show-master'],
    achievements: ['first-feedback', 'structure-architect'],
    streakDays: 5,
    wordsWritten: 2340,
    literaryDevicesUsed: 4,
    showDontTellRatio: 72
  };

  const demoSections = [
    {
      id: 'interface',
      title: 'Complete Writing Interface',
      description: 'Full NSW Selective writing practice with timer, word count, and real-time analysis',
      icon: Play,
      component: () => (
        <NSWEnhancedWritingInterface
          textType="Narrative"
          prompt="Write an engaging story about a character who discovers something unexpected that changes their life forever. Include vivid descriptions, realistic dialogue, and show the character's emotional journey."
          examDurationMinutes={30}
          targetWordCountMin={100}
          targetWordCountMax={500}
          onSubmit={(content, analysis) => console.log('Submitted:', { content, analysis })}
        />
      )
    },
    {
      id: 'feedback',
      title: 'NSW Marking Rubric',
      description: 'Detailed feedback based on official NSW Selective writing criteria',
      icon: BarChart3,
      component: () => (
        <NSWMarkingRubric essay={sampleEssay} feedbackData={sampleAnalysisData} />
      )
    },
    {
      id: 'techniques',
      title: 'Writing Technique Modules',
      description: 'Advanced tools for Show/Don\'t Tell, Literary Devices, and Sentence Variety',
      icon: Zap,
      component: () => (
        <WritingTechniqueModules essay={sampleEssay} />
      )
    },
    {
      id: 'gamification',
      title: 'Progress & Gamification',
      description: 'Badges, achievements, and progress tracking to keep students engaged',
      icon: Award,
      component: () => (
        <GamificationSystem userProgress={sampleUserProgress} />
      )
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <h1 className="text-4xl font-bold mb-4">
            Enhanced NSW Selective Writing Buddy
          </h1>
          <p className="text-xl text-blue-100 mb-6">
            Implementing all recommendations from the analysis report
          </p>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white/10 rounded-lg p-4">
              <Target className="w-8 h-8 mb-2" />
              <h3 className="font-semibold">NSW Criteria Based</h3>
              <p className="text-sm text-blue-100">Aligned with official marking rubric</p>
            </div>
            <div className="bg-white/10 rounded-lg p-4">
              <BookOpen className="w-8 h-8 mb-2" />
              <h3 className="font-semibold">Specific Feedback</h3>
              <p className="text-sm text-blue-100">Actionable suggestions with examples</p>
            </div>
            <div className="bg-white/10 rounded-lg p-4">
              <Zap className="w-8 h-8 mb-2" />
              <h3 className="font-semibold">Advanced Tools</h3>
              <p className="text-sm text-blue-100">Show/Tell meter, literary devices</p>
            </div>
            <div className="bg-white/10 rounded-lg p-4">
              <Award className="w-8 h-8 mb-2" />
              <h3 className="font-semibold">Gamification</h3>
              <p className="text-sm text-blue-100">Badges and progress tracking</p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex space-x-1 py-4">
            {demoSections.map((section) => {
              const Icon = section.icon;
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveDemo(section.id)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                    activeDemo === section.id
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{section.title}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Section Description */}
        <div className="mb-8">
          {demoSections.map((section) => {
            if (section.id === activeDemo) {
              return (
                <div key={section.id} className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center space-x-3 mb-3">
                    <section.icon className="w-6 h-6 text-blue-600" />
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {section.title}
                    </h2>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400">
                    {section.description}
                  </p>
                </div>
              );
            }
            return null;
          })}
        </div>

        {/* Demo Component */}
        <div>
          {demoSections.find(section => section.id === activeDemo)?.component()}
        </div>
      </div>

      {/* Implementation Notes */}
      <div className="bg-gray-100 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Implementation Notes
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-700 rounded-lg p-6">
              <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">
                Key Improvements Implemented
              </h4>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li>• NSW marking rubric integration with weighted criteria</li>
                <li>• Specific, actionable feedback with examples from student writing</li>
                <li>• Narrative structure analyzer for story components</li>
                <li>• Show, Don't Tell meter with improvement suggestions</li>
                <li>• Literary devices scanner and recommendations</li>
                <li>• Sentence variety analyzer with balance scoring</li>
                <li>• Gamification system with badges and achievements</li>
                <li>• Enhanced grammar and punctuation feedback</li>
              </ul>
            </div>
            <div className="bg-white dark:bg-gray-700 rounded-lg p-6">
              <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">
                Technical Features
              </h4>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li>• Real-time analysis as students write</li>
                <li>• Responsive design for all devices</li>
                <li>• Dark mode support</li>
                <li>• Progress tracking and data persistence</li>
                <li>• Modular component architecture</li>
                <li>• TypeScript for type safety</li>
                <li>• Tailwind CSS for consistent styling</li>
                <li>• Accessible UI components</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
