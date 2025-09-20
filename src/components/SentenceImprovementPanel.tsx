import React, { useState, useEffect } from 'react';
import { BookOpen, Lightbulb, CheckCircle, XCircle, ChevronDown, ChevronUp } from 'lucide-react';

interface NarrativeStructureGuideProps {
  content: string;
  onContentUpdate?: (newContent: string) => void;
  className?: string;
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
  },
];

export const NarrativeStructureGuide: React.FC<NarrativeStructureGuideProps> = ({
  content,
  onContentUpdate,
  className = ""
}) => {
  const [activePhase, setActivePhase] = useState<string | null>(null);

  return (
    <div className={`bg-white rounded-lg border shadow-sm ${className}`}>
      <div className="p-4 border-b bg-gradient-to-r from-blue-50 to-green-50">
        <div className="flex items-center space-x-2">
          <BookOpen className="h-5 w-5 text-green-600" />
          <h3 className={
            'font-semibold text-gray-800 text-xl'
          }>
            Story Adventure Mission: Narrative Structure
          </h3>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {NARRATIVE_PHASES.map((phase) => (
          <div key={phase.id} className="border rounded-lg overflow-hidden">
            <button
              className={
                'flex justify-between items-center w-full p-3 font-medium text-left bg-gray-100 text-gray-800 text-base'
              }
              onClick={() => setActivePhase(activePhase === phase.id ? null : phase.id)}
            >
              <span>{phase.title}</span>
              {activePhase === phase.id ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </button>
            {activePhase === phase.id && (
              <div className="p-3 space-y-3 bg-white">
                <p className={'text-gray-700 text-sm'}>{phase.description}</p>

                <div>
                  <h5 className={'font-semibold mb-1 text-sm'}>Sentence Starters:</h5>
                  <div className="flex flex-wrap gap-2">
                    {phase.sentenceStarters.map((starter, i) => (
                      <span key={i} className={'px-2 py-1 rounded-full bg-green-50 text-green-700 text-xs'}>
                        {starter}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h5 className={'font-semibold mb-1 text-sm'}>Power Words:</h5>
                  <div className="flex flex-wrap gap-2">
                    {phase.powerWords.map((word, i) => (
                      <span key={i} className={'px-2 py-1 rounded-full bg-purple-50 text-purple-700 text-xs'}>
                        {word}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h5 className={'font-semibold mb-1 text-sm'}>Sensory Details:</h5>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {Object.entries(phase.sensoryDetails).map(([type, details], i) => (
                      <div key={i} className="bg-gray-50 p-2 rounded">
                        <p className="font-medium text-gray-700 capitalize">{type}:</p>
                        <p className="text-gray-600 text-xs">{details.join(', ')}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default NarrativeStructureGuide;
