import React, { useState } from 'react';
import { BookOpen, Lightbulb, CheckCircle, XCircle, ChevronDown, ChevronUp, X } from 'lucide-react';

interface TipsModalProps {
  isOpen: boolean;
  onClose: () => void;
  textType?: string;
}

interface StoryPhase {
  id: string;
  title: string;
  description: string;
  sentenceStarters: string[];
  powerWords: string[];
  sensoryDetails: {
    sight: string[];
    sound: string[];
    touch: string[];
    smell: string[];
    feelings: string[];
  };
}

const NARRATIVE_PHASES: StoryPhase[] = [
  {
    id: 'introduction',
    title: '1. Introduction: Setting the Scene',
    description: 'Introduce your main character, the setting (where and when the story takes place), and a hint of the problem or adventure to come.',
    sentenceStarters: [
      'One [adjective] morning/afternoon/evening...', 
      'In a place where [description of setting]...', 
      'Meet [character name], a [adjective] [noun] who...', 
      'Little did [character name] know that today would be different...'
    ],
    powerWords: ['suddenly', 'unexpectedly', 'curiously', 'peculiar', 'ancient', 'mysterious', 'eerie', 'sparkling', 'whispering'],
    sensoryDetails: {
      sight: ['gloomy shadows', 'flickering candlelight', 'dusty corners', 'gleaming object', 'cobweb-draped'],
      sound: ['creaking floorboards', 'distant rumble', 'soft rustle', 'heart pounding', 'silence'],
      touch: ['cold metal', 'rough wood', 'soft velvet', 'prickly bush', 'smooth stone'],
      smell: ['musty air', 'sweet scent', 'earthy aroma', 'faint perfume', 'smoky haze'],
      feelings: ['nervous', 'excited', 'curious', 'apprehensive', 'calm']
    }
  },
  {
    id: 'rising-action',
    title: '2. Rising Action: The Adventure Begins',
    description: 'The main character faces challenges, makes discoveries, and the plot thickens. Build suspense and show, don\'t just tell, what happens.',
    sentenceStarters: [
      'As [character name] ventured deeper...', 
      'Suddenly, a [event] occurred...', 
      'With a [sound/action], [character name] discovered...', 
      'The journey was fraught with [challenge]...'
    ],
    powerWords: ['bravely', 'cautiously', 'desperately', 'intense', 'perilous', 'shimmering', 'enormous', 'terrifying', 'courageous'],
    sensoryDetails: {
      sight: ['towering trees', 'winding path', 'glittering treasure', 'dark abyss', 'blinding light'],
      sound: ['howling wind', 'crashing waves', 'distant roar', 'footsteps echoing', 'gasp of surprise'],
      touch: ['sharp thorns', 'slippery rocks', 'warm embrace', 'chilling breeze', 'rough rope'],
      smell: ['fresh pine', 'salty air', 'foul odor', 'sweet blossoms', 'burning wood'],
      feelings: ['determined', 'fearful', 'hopeful', 'confused', 'exhausted']
    }
  },
  {
    id: 'climax',
    title: '3. Climax: The Turning Point',
    description: 'This is the most exciting part of your story where the main character confronts the biggest challenge or makes a crucial decision. The tension is at its peak!',
    sentenceStarters: [
      'Finally, [character name] stood before...', 
      'With a surge of [emotion], [character name]...', 
      'This was it. The moment of truth...', 
      'All at once, [event]...'
    ],
    powerWords: ['decisive', 'critical', 'momentous', 'shattering', 'overwhelming', 'triumphant', 'despair', 'furious', 'relentless'],
    sensoryDetails: {
      sight: ['blinding flash', 'crumbling walls', 'fierce glare', 'desperate struggle', 'victory in sight'],
      sound: ['deafening crash', 'piercing scream', 'triumphant shout', 'ominous silence', 'rapid heartbeat'],
      touch: ['burning heat', 'icy grip', 'shaking ground', 'painful blow', 'gentle touch'],
      smell: ['acrid smoke', 'sweet victory', 'metallic tang', 'fresh rain', 'fear in the air'],
      feelings: ['terrified', 'exhilarated', 'resolved', 'defeated', 'victorious']
    }
  },
  {
    id: 'resolution',
    title: '4. Resolution: Tying Up Loose Ends',
    description: 'Show how the character has changed and what happens after the main problem is solved. Conclude your story by reflecting on the adventure.',
    sentenceStarters: [
      'After the dust settled...', 
      'With a newfound sense of [emotion]...', 
      'Life in [setting] was never the same...', 
      'From that day forward, [character name]...'
    ],
    powerWords: ['transformed', 'reflecting', 'peaceful', 'content', 'grateful', 'wiser', 'haunting', 'cherished', 'legacy'],
    sensoryDetails: {
      sight: ['calm waters', 'setting sun', 'familiar faces', 'new beginnings', 'scarred landscape'],
      sound: ['gentle breeze', 'birds chirping', 'laughter echoing', 'soft whispers', 'peaceful quiet'],
      touch: ['warm sunlight', 'comforting hug', 'soft grass', 'cool breeze', 'gentle rain'],
      smell: ['fresh baked bread', 'clean air', 'fragrant flowers', 'old memories', 'new hope'],
      feelings: ['relieved', 'satisfied', 'changed', 'thoughtful', 'hopeful']
    }
  }
];

export const TipsModal: React.FC<TipsModalProps> = ({ isOpen, onClose, textType = 'narrative' }) => {
  const [expandedPhases, setExpandedPhases] = useState<{ [key: string]: boolean }>({});

  if (!isOpen) return null;

  const togglePhase = (phaseId: string) => {
    setExpandedPhases(prev => ({
      ...prev,
      [phaseId]: !prev[phaseId]
    }));
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-11/12 md:w-4/5 lg:w-3/4 xl:w-2/3 shadow-lg rounded-md bg-white max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center pb-3 border-b">
          <div className="flex items-center space-x-2">
            <BookOpen className="h-6 w-6 text-green-600" />
            <h3 className="text-xl font-bold text-green-800">📚 Story Adventure Mission: Narrative Structure</h3>
          </div>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="mt-4">
          <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg">
            <p className="text-gray-700 text-sm">
              Master the art of storytelling with this interactive narrative structure guide! Each section will help you craft an engaging story from beginning to end.
            </p>
          </div>

          <div className="space-y-4">
            {NARRATIVE_PHASES.map((phase, index) => (
              <div key={phase.id} className="border rounded-lg overflow-hidden">
                <button
                  onClick={() => togglePhase(phase.id)}
                  className="w-full p-4 text-left bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 transition-colors duration-200 flex justify-between items-center"
                >
                  <span className="font-semibold text-gray-800">{phase.title}</span>
                  {expandedPhases[phase.id] ? 
                    <ChevronUp className="h-5 w-5 text-gray-600" /> : 
                    <ChevronDown className="h-5 w-5 text-gray-600" />
                  }
                </button>
                
                {expandedPhases[phase.id] && (
                  <div className="p-4 bg-white border-t">
                    <p className="text-gray-700 mb-4 text-sm leading-relaxed">
                      {phase.description}
                    </p>
                    
                    <div className="grid md:grid-cols-2 gap-4">
                      {/* Sentence Starters */}
                      <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                        <h4 className="font-semibold text-blue-800 mb-2 text-sm flex items-center">
                          <Lightbulb className="h-4 w-4 mr-1" />
                          Sentence Starters
                        </h4>
                        <ul className="space-y-1">
                          {phase.sentenceStarters.map((starter, idx) => (
                            <li key={idx} className="text-xs text-blue-700 bg-white p-2 rounded border">
                              "{starter}"
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Power Words */}
                      <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
                        <h4 className="font-semibold text-purple-800 mb-2 text-sm flex items-center">
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Power Words
                        </h4>
                        <div className="flex flex-wrap gap-1">
                          {phase.powerWords.map((word, idx) => (
                            <span key={idx} className="text-xs bg-purple-200 text-purple-800 px-2 py-1 rounded-full">
                              {word}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Sensory Details */}
                    <div className="mt-4 bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                      <h4 className="font-semibold text-yellow-800 mb-2 text-sm">
                        🌟 Sensory Details to Bring Your Story to Life
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
                        {Object.entries(phase.sensoryDetails).map(([sense, details]) => (
                          <div key={sense} className="bg-white p-2 rounded border">
                            <div className="font-medium text-yellow-800 capitalize mb-1">{sense}:</div>
                            <div className="space-y-1">
                              {details.slice(0, 3).map((detail, idx) => (
                                <div key={idx} className="text-yellow-700">{detail}</div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Pro Tip */}
          <div className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <Lightbulb className="h-5 w-5 text-purple-600" />
              <span className="font-semibold text-purple-800">💡 Pro Writing Tip</span>
            </div>
            <p className="text-sm text-purple-700">
              Use this structure as your roadmap, but don't be afraid to be creative! The best stories come alive when you add your unique voice and imagination to each section. Remember: show, don't tell, and always engage your reader's senses!
            </p>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t">
          <button
            onClick={onClose}
            className="w-full px-4 py-3 bg-green-600 text-white text-base font-medium rounded-lg shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-300 transition-colors"
          >
            Start Writing Your Adventure! 🚀
          </button>
        </div>
      </div>
    </div>
  );
};