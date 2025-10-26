// Text Type Structures Library
// Define writing structures for each text type

export interface TextTypePhase {
  id: string;
  title: string;
  description: string;
  sentenceStarters: string[];
  powerWords: string[];
  sensoryDetails?: {
    sight: string[];
    sound: string[];
    touch: string[];
    smell: string[];
    feelings: string[];
  };
  keyElements?: string[];
  transitionWords?: string[];
}

export interface TextTypeStructure {
  title: string;
  description: string;
  phases: TextTypePhase[];
  proTip: string;
}

export const TEXT_TYPE_STRUCTURES: { [key: string]: TextTypeStructure } = {
  // ----------------------------------------------------------------------
  // NARRATIVE: Corrected to Story Mountain (Exposition, Rising Action, Climax, Falling Action, Resolution)
  // ----------------------------------------------------------------------
  narrative: {
    title: "⛰️ Story Mountain Mission: Narrative Structure",
    description: "Master the art of storytelling with this interactive Story Mountain guide! Each section will help you craft an engaging story from beginning to end.",
    proTip: "Use this structure as your roadmap, but don't be afraid to be creative! The best stories come alive when you add your unique voice and imagination to each section. Remember: show, don't tell, and always engage your reader's senses!",
    phases: [
      {
        id: 'exposition',
        title: '1. Exposition: Setting the Scene',
        description: 'Introduce your main character, the setting (where and when the story takes place), and the initial situation. This is the base of your mountain.',
        sentenceStarters: [
          'One [adjective] morning/afternoon/evening...',
          'In a place where [description of setting]...',
          'Meet [character name], a [adjective] [noun] who...',
          'Life was [adjective] until...'
        ],
        powerWords: ['suddenly', 'unexpectedly', 'curiously', 'peculiar', 'ancient', 'mysterious', 'eerie', 'sparkling', 'whispering'],
        sensoryDetails: {
          sight: ['gloomy shadows', 'flickering candlelight', 'dusty corners', 'gleaming object', 'cobweb-draped'],
          sound: ['creaking floorboards', 'distant rumble', 'soft rustle', 'heart pounding', 'silence'],
          touch: ['cold metal', 'rough wood', 'soft velvet', 'prickly bush', 'smooth stone'],
          smell: ['musty air', 'sweet scent', 'earthy aroma', 'faint perfume', 'smoky haze'],
          feelings: ['nervous', 'excited', 'curious', 'apprehensive', 'calm']
        },
        keyElements: ['Character introduction', 'Setting (time and place)', 'Initial conflict or inciting incident']
      },
      {
        id: 'rising-action',
        title: '2. Rising Action: Climbing the Mountain',
        description: 'The main character faces a series of challenges and complications that build tension and lead toward the climax. The conflict intensifies.',
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
        },
        keyElements: ['Complications', 'Discoveries', 'Obstacles', 'Building suspense']
      },
      {
        id: 'climax',
        title: '3. Climax: The Peak Moment',
        description: 'This is the highest point of tension and the turning point of the story. The main character confronts the biggest challenge or makes a crucial decision.',
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
        },
        keyElements: ['Highest point of tension', 'Major confrontation', 'Crucial decision', 'The problem is faced head-on']
      },
      {
        id: 'falling-action',
        title: '4. Falling Action: Descending the Mountain',
        description: 'The immediate consequences of the climax are shown. The tension begins to ease, and the story moves toward its conclusion.',
        sentenceStarters: [
          'After the dust settled...',
          'With a newfound sense of [emotion]...',
          'The villain/problem was [resolved/defeated]...',
          'The immediate danger had passed, and...'
        ],
        powerWords: ['calmly', 'slowly', 'peacefully', 'reflecting', 'easing', 'unraveling', 'gradually', 'eventually', 'finally'],
        sensoryDetails: {
          sight: ['calm waters', 'setting sun', 'familiar faces', 'new beginnings', 'scarred landscape'],
          sound: ['gentle breeze', 'birds chirping', 'laughter echoing', 'soft whispers', 'peaceful quiet'],
          touch: ['warm sunlight', 'comforting hug', 'soft grass', 'cool breeze', 'gentle rain'],
          smell: ['fresh baked bread', 'clean air', 'fragrant flowers', 'old memories', 'new hope'],
          feelings: ['relieved', 'satisfied', 'changed', 'thoughtful', 'hopeful']
        },
        keyElements: ['Immediate aftermath of the climax', 'Loose ends are tied up', 'Tension decreases']
      },
      {
        id: 'resolution',
        title: '5. Resolution: Back on Flat Ground',
        description: 'The final outcome of the story. Show how the character has changed and what the new normal is. The main conflict is fully resolved.',
        sentenceStarters: [
          'Life in [setting] was never the same...',
          'From that day forward, [character name]...',
          'The story ended with...',
          'Everything was finally...'
        ],
        powerWords: ['transformed', 'reflecting', 'peaceful', 'content', 'grateful', 'wiser', 'haunting', 'cherished', 'legacy'],
        keyElements: ['Final outcome', 'Theme revealed', 'Character change/growth', 'The new normal']
      }
    ]
  },

  // ----------------------------------------------------------------------
  // PERSUASIVE: Corrected to PEEEL Structure
  // ----------------------------------------------------------------------
  persuasive: {
    title: "🎯 Persuasive Power: PEEEL Argument Structure",
    description: "Master the art of persuasion! Learn how to build compelling arguments that convince your reader to see your point of view using the PEEEL method.",
    proTip: "Strong persuasive writing combines logical reasoning (Logos) with emotional appeal (Pathos) and credibility (Ethos). Use facts and evidence, but don't forget to connect with your reader's values and feelings!",
    phases: [
      {
        id: 'introduction',
        title: '1. Introduction: Hook & Thesis',
        description: 'Start with a compelling hook to grab your reader\'s attention, provide brief background information, and clearly state your position in a strong thesis statement.',
        sentenceStarters: [
          'Imagine a world where...',
          'In a society that values... it is shocking to find that...',
          'The time has come to address the urgent issue of...',
          'While some may believe..., the reality is that...'
        ],
        powerWords: ['crucial', 'essential', 'urgent', 'compelling', 'undeniable', 'vital', 'critical', 'unacceptable', 'imperative'],
        keyElements: ['Hook (question, shocking statistic, anecdote)', 'Background context', 'Strong thesis statement', 'Outline of main points']
      },
      {
        id: 'body-paragraph-1',
        title: '2. Body Paragraph (PEEEL): Point 1',
        description: 'POINT: State your first argument. EVIDENCE: Provide evidence (facts, statistics, examples). EXPLAIN: Explain how the evidence supports your point. EVALUATE: Broaden the explanation with further analysis. LINK: Link this point back to your main thesis.',
        sentenceStarters: [
          'Firstly, it is clear that...',
          'The primary reason for this is...',
          'For instance, research from [source] shows...',
          'This demonstrates that...',
          'Therefore, it is evident that...'
        ],
        powerWords: ['evidence', 'statistics', 'expert', 'demonstrates', 'proves', 'consequently', 'furthermore', 'significantly', 'clearly'],
        keyElements: ['Point', 'Evidence', 'Explanation', 'Evaluation', 'Link']
      },
      {
        id: 'body-paragraph-2',
        title: '3. Body Paragraph (PEEEL): Point 2',
        description: 'POINT: State your second argument. EVIDENCE: Provide new evidence. EXPLAIN: Explain this evidence. EVALUATE: Analyze its implications. LINK: Connect it back to your thesis.',
        sentenceStarters: [
          'Furthermore, another compelling reason is...',
          'Additionally, consider the fact that...',
          'A clear example of this can be seen in...',
          'This highlights the importance of...',
          'As such, it reinforces the argument that...'
        ],
        powerWords: ['additionally', 'moreover', 'likewise', 'similarly', 'another', 'compelling', 'substantiates', 'validates', 'reinforces'],
        keyElements: ['Point', 'Evidence', 'Explanation', 'Evaluation', 'Link']
      },
      {
        id: 'counter-argument',
        title: '4. Counter-Argument & Rebuttal',
        description: 'Acknowledge a potential opposing viewpoint and then refute it. This shows you have considered other perspectives and strengthens your own argument.',
        sentenceStarters: [
          'Some may argue that... however, this view is flawed because...',
          'While it is true that..., it does not negate the fact that...',
          'Opponents might claim that..., but they fail to consider...',
          'A common misconception is that...; in reality,...'
        ],
        powerWords: ['admittedly', 'however', 'nevertheless', 'despite', 'conversely', 'unconvincing', 'flawed', 'misguided', 'outweighs'],
        keyElements: ['Acknowledge opposition', 'Provide counter-evidence', 'Explain why your position is stronger', 'Strengthen thesis']
      },
      {
        id: 'conclusion',
        title: '5. Conclusion: Call to Action',
        description: 'Summarize your main arguments, restate your thesis in a new way, and end with a powerful and memorable call to action that motivates your reader.',
        sentenceStarters: [
          'In conclusion, the evidence overwhelmingly shows...',
          'Therefore, it is imperative that we...',
          'The choice is clear: we must act now to...',
          'Let us work together to create a future where...'
        ],
        powerWords: ['imperative', 'necessary', 'act now', 'transformative', 'decisive', 'unite', 'demand', 'advocate', 'support'],
        keyElements: ['Restate thesis', 'Summarize main arguments', 'Powerful call to action', 'Final compelling thought']
      }
    ]
  },

  // ----------------------------------------------------------------------
  // EXPOSITORY: Corrected to Standard Five-Paragraph Essay Structure
  // ----------------------------------------------------------------------
  expository: {
    title: "📖 Information Explorer: Expository Essay Structure",
    description: "Master the art of explanation! Learn how to inform and educate your reader with clear, well-organized information in a standard essay format.",
    proTip: "Great expository writing is like being a tour guide for your reader's mind. Lead them through complex information step by step, using clear examples and logical organization!",
    phases: [
      {
        id: 'introduction',
        title: '1. Introduction: Thesis & Overview',
        description: 'Introduce your topic with a hook, provide necessary background information, and present a clear thesis statement that outlines what you will explain.',
        sentenceStarters: [
          'Have you ever wondered about...',
          '[Topic] is a fascinating and complex subject that...',
          'To fully understand [concept], it is essential to examine...',
          'This essay will explore the key aspects of...'
        ],
        powerWords: ['explain', 'clarify', 'define', 'illustrate', 'analyze', 'examine', 'explore', 'reveal', 'demonstrate'],
        keyElements: ['Hook (question, fact, definition)', 'Background context', 'Clear thesis statement', 'Preview of main points']
      },
      {
        id: 'body-paragraph-1',
        title: '2. Body Paragraph 1: Main Point A',
        description: 'Present your first main point with a clear topic sentence. Support it with facts, details, and examples to explain it thoroughly.',
        sentenceStarters: [
          'The first key aspect of [topic] is...',
          'To begin, it is important to understand...',
          'For example, consider...',
          'This shows that...'
        ],
        powerWords: ['firstly', 'initially', 'primarily', 'fundamentally', 'aspect', 'component', 'factor', 'element', 'characteristic'],
        keyElements: ['Topic sentence', 'Supporting details', 'Examples/Evidence', 'Explanation']
      },
      {
        id: 'body-paragraph-2',
        title: '3. Body Paragraph 2: Main Point B',
        description: 'Present your second main point. Ensure it logically follows the first and is supported by its own set of details and examples.',
        sentenceStarters: [
          'Another significant factor is...',
          'In addition to [Point A], it is also crucial to note...',
          'For instance, ...',
          'This illustrates how...'
        ],
        powerWords: ['secondly', 'additionally', 'furthermore', 'moreover', 'another', 'significant', 'notably', 'equally important', 'also'],
        keyElements: ['Topic sentence', 'Supporting details', 'Examples/Evidence', 'Explanation']
      },
      {
        id: 'body-paragraph-3',
        title: '4. Body Paragraph 3: Main Point C',
        description: 'Present your third main point, complete with supporting evidence and explanation, to round out the body of your essay.',
        sentenceStarters: [
          'Finally, the third aspect to consider is...',
          'Lastly, one must also examine...',
          'A clear illustration of this is...',
          'Consequently, this leads to...'
        ],
        powerWords: ['finally', 'lastly', 'thirdly', 'concluding', 'completing', 'critical', 'essential', 'vital', 'key'],
        keyElements: ['Topic sentence', 'Supporting details', 'Examples/Evidence', 'Explanation']
      },
      {
        id: 'conclusion',
        title: '5. Conclusion: Summary & Final Thought',
        description: 'Summarize your main points (A, B, and C), restate your thesis in a new way, and leave the reader with a final, insightful thought on the topic.',
        sentenceStarters: [
          'In summary, the key aspects of [topic] are...',
          'To conclude, by examining..., it becomes clear that...',
          'Ultimately, understanding [topic] is important because...',
          'The information presented demonstrates that...'
        ],
        powerWords: ['summary', 'conclusion', 'ultimately', 'overall', 'comprehensive', 'enlightening', 'valuable', 'essential', 'significant'],
        keyElements: ['Restate thesis', 'Summary of main points', 'Final insightful thought', 'Closing statement']
      }
    ]
  },

  // ----------------------------------------------------------------------
  // REFLECTIVE: Corrected to Gibbs' Reflective Cycle
  // ----------------------------------------------------------------------
  reflective: {
    title: "🧠 Reflective Cycle: Personal Growth Structure",
    description: "Use Gibbs' Reflective Cycle to turn your experiences into valuable learning opportunities. This structure guides you through a deep, meaningful reflection process.",
    proTip: "Reflection is a powerful tool for growth. Be honest about your feelings and critically evaluate your actions—this is how you truly learn and improve!",
    phases: [
      {
        id: 'description',
        title: '1. Description: What Happened?',
        description: 'Describe the event or experience in detail. Focus on the facts: who was involved, where it took place, and what happened objectively.',
        sentenceStarters: [
          'The situation I am reflecting on is...',
          'The event took place at... on [date/time]...',
          'The main people involved were...',
          'The sequence of events was as follows: first...'
        ],
        powerWords: ['situation', 'event', 'context', 'facts', 'details', 'setting', 'participants', 'chronology', 'objective'],
        keyElements: ['Objective account of the event', 'Who, what, where, when']
      },
      {
        id: 'feelings',
        title: '2. Feelings: What Were You Thinking and Feeling?',
        description: 'Explore your emotions and thoughts before, during, and after the event. Be honest about your internal experience.',
        sentenceStarters: [
          'Before the event, I felt...',
          'During the experience, my thoughts were...',
          'My immediate reaction was one of...',
          'Afterward, I realized I was feeling... because...'
        ],
        powerWords: ['anxious', 'confident', 'frustrated', 'surprised', 'relieved', 'confused', 'determined', 'overwhelmed', 'satisfied'],
        keyElements: ['Emotions before, during, and after', 'Thoughts and internal dialogue']
      },
      {
        id: 'evaluation',
        title: '3. Evaluation: What Was Good and Bad?',
        description: 'Judge the experience. What went well, and what did not go so well? Be balanced and critical in your assessment.',
        sentenceStarters: [
          'The most positive aspect of the experience was...',
          'What went well was... because...',
          'However, the most negative aspect was...',
          'The main challenge I faced was...'
        ],
        powerWords: ['successful', 'challenging', 'effective', 'ineffective', 'positive', 'negative', 'beneficial', 'detrimental', 'valuable'],
        keyElements: ['Identification of positive outcomes', 'Identification of negative outcomes', 'Balanced perspective']
      },
      {
        id: 'analysis',
        title: '4. Analysis: What Sense Can You Make of It?',
        description: 'Analyze the situation to understand why things happened as they did. Connect your experience to broader concepts, theories, or prior knowledge.',
        sentenceStarters: [
          'The main reason for this outcome was likely...',
          'This situation can be understood in the context of...',
          'I now understand that my actions led to... because...',
          'This experience highlights the importance of...'
        ],
        powerWords: ['reason', 'cause', 'effect', 'theory', 'concept', 'insight', 'understanding', 'implication', 'relationship'],
        keyElements: ['Explanation of cause and effect', 'Linking to external knowledge', 'Deeper understanding of the event']
      },
      {
        id: 'conclusion',
        title: '5. Conclusion: What Else Could You Have Done?',
        description: 'Summarize your key learning points. What are the main takeaways from this reflection? What would you do differently if faced with a similar situation again?',
        sentenceStarters: [
          'In conclusion, the most important lesson I learned was...',
          'If I were in this situation again, I would...',
          'I should have considered...',
          'This experience has taught me the value of...'
        ],
        powerWords: ['lesson', 'takeaway', 'improvement', 'alternative', 'strategy', 'future', 'change', 'growth', 'realization'],
        keyElements: ['Summary of key learning', 'Identification of alternative actions']
      },
      {
        id: 'action-plan',
        title: '6. Action Plan: What Will You Do Next?',
        description: 'Develop a concrete, specific plan for how you will apply your learning in the future. This turns reflection into tangible action.',
        sentenceStarters: [
          'My concrete plan for the future is to...',
          'To improve my skills in this area, I will...',
          'The first step I will take is to... by [date]...',
          'I will commit to practicing... in order to...'
        ],
        powerWords: ['plan', 'strategy', 'commit', 'implement', 'develop', 'practice', 'goal', 'step', 'actionable'],
        keyElements: ['Specific, measurable future actions', 'Commitment to change and growth']
      }
    ]
  },

  // ----------------------------------------------------------------------
  // RECOUNT: Corrected to Chronological Order (Orientation, Sequence of Events, Reorientation)
  // ----------------------------------------------------------------------
  recount: {
    title: "🕰️ Time Traveler's Log: Recount Structure",
    description: "Learn how to write a clear, chronological account of an event or experience. A recount tells the reader what happened, when it happened, and who was involved.",
    proTip: "Use strong time-order words (first, next, then, finally) to guide your reader through the sequence of events. Focus on the facts and keep your tenses consistent!",
    phases: [
      {
        id: 'orientation',
        title: '1. Orientation: Who, What, Where, When',
        description: 'Set the scene. Introduce the main event, the people involved, the setting (where), and the time (when) it all took place.',
        sentenceStarters: [
          'Last [day/week/year], I had a memorable experience when...',
          'The event began on a [adjective] [day] at [location]...',
          '[Name] and I were at... when...',
          'I will never forget the day that...'
        ],
        powerWords: ['memorable', 'significant', 'historic', 'eventful', 'unforgettable', 'initial', 'primary', 'first', 'opening'],
        keyElements: ['Clear statement of the event', 'Inclusion of participants', 'Setting (place and time) established']
      },
      {
        id: 'sequence-of-events',
        title: '2. Sequence of Events: Chronological Order',
        description: 'Detail the events in the exact order they happened. Use time-order words (e.g., next, then, after that) to link your ideas and make the sequence clear for your reader.',
        sentenceStarters: [
          'First, we decided to...',
          'After that, an unexpected thing happened...',
          'Next, I remember feeling... when...',
          'Following this, [person] said...'
        ],
        powerWords: ['then', 'next', 'suddenly', 'meanwhile', 'afterward', 'subsequently', 'finally', 'eventually', 'later'],
        keyElements: ['Events described in chronological order', 'Use of time-order connectives', 'Focus on actions and observations']
      },
      {
        id: 'reorientation',
        title: '3. Reorientation: Concluding Thoughts',
        description: 'Conclude the recount by summarizing the event and sharing a final personal thought, feeling, or reflection on its significance.',
        sentenceStarters: [
          'In the end, the experience was...',
          'Overall, I felt... because...',
          'Looking back, the most important part was...',
          'From this experience, I learned that...'
        ],
        powerWords: ['finally', 'overall', 'conclusion', 'reflecting', 'memorable', 'valuable', 'realized', 'understood', 'lesson'],
        keyElements: ['Summary of the experience', 'Personal reflection or feeling', 'Closing statement']
      }
    ]
  }
};

/**
 * Retrieves the TextTypeStructure for a given text type key.
 * @param key The key of the text type (e.g., 'narrative', 'persuasive').
 * @returns The TextTypeStructure object.
 */
export function getTextTypeStructure(key: keyof typeof TEXT_TYPE_STRUCTURES): TextTypeStructure {
  return TEXT_TYPE_STRUCTURES[key];
}