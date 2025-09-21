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
  narrative: {
    title: "📚 Story Adventure Mission: Narrative Structure",
    description: "Master the art of storytelling with this interactive narrative structure guide! Each section will help you craft an engaging story from beginning to end.",
    proTip: "Use this structure as your roadmap, but don't be afraid to be creative! The best stories come alive when you add your unique voice and imagination to each section. Remember: show, don't tell, and always engage your reader's senses!",
    phases: [
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
    ]
  },

  persuasive: {
    title: "🎯 Persuasive Power: Argument Structure",
    description: "Master the art of persuasion! Learn how to build compelling arguments that convince your reader to see your point of view.",
    proTip: "Strong persuasive writing combines logical reasoning with emotional appeal. Use facts and evidence, but don't forget to connect with your reader's values and feelings!",
    phases: [
      {
        id: 'introduction',
        title: '1. Hook & Position: Grab Attention',
        description: 'Start with a compelling hook, provide background information, and clearly state your position or thesis.',
        sentenceStarters: [
          'Imagine a world where...',
          'Did you know that [statistic]...',
          'Every day, millions of people...',
          'The time has come to...'
        ],
        powerWords: ['crucial', 'essential', 'urgent', 'compelling', 'undeniable', 'revolutionary', 'significant', 'vital', 'critical'],
        keyElements: ['Hook (question, statistic, scenario)', 'Background context', 'Clear thesis statement', 'Preview of main arguments'],
        transitionWords: ['first', 'to begin with', 'initially', 'furthermore']
      },
      {
        id: 'arguments',
        title: '2. Main Arguments: Build Your Case',
        description: 'Present your strongest arguments with evidence, examples, and logical reasoning. Address each main point in separate paragraphs.',
        sentenceStarters: [
          'The primary reason is...',
          'Evidence clearly shows that...',
          'Research demonstrates...',
          'Consider the fact that...'
        ],
        powerWords: ['proven', 'documented', 'verified', 'substantial', 'overwhelming', 'conclusive', 'irrefutable', 'compelling', 'decisive'],
        keyElements: ['Topic sentence for each argument', 'Supporting evidence', 'Examples and statistics', 'Expert opinions or quotes'],
        transitionWords: ['moreover', 'additionally', 'furthermore', 'in addition', 'similarly', 'likewise']
      },
      {
        id: 'counterarguments',
        title: '3. Address Opposition: Strengthen Your Position',
        description: 'Acknowledge opposing viewpoints and explain why your position is stronger. This shows you understand the complexity of the issue.',
        sentenceStarters: [
          'Some might argue that...',
          'Critics often claim...',
          'While it\'s true that...',
          'Although opponents suggest...'
        ],
        powerWords: ['however', 'nevertheless', 'despite', 'although', 'admittedly', 'granted', 'nonetheless', 'conversely', 'alternatively'],
        keyElements: ['Acknowledge opposing views', 'Explain why they are less valid', 'Provide counter-evidence', 'Reinforce your position'],
        transitionWords: ['however', 'on the other hand', 'conversely', 'nevertheless', 'despite this']
      },
      {
        id: 'conclusion',
        title: '4. Call to Action: Seal the Deal',
        description: 'Summarize your main points, restate your position, and end with a powerful call to action that motivates your reader.',
        sentenceStarters: [
          'In conclusion, the evidence clearly shows...',
          'The time for action is now...',
          'We must act before...',
          'The choice is clear...'
        ],
        powerWords: ['imperative', 'necessary', 'inevitable', 'transformative', 'groundbreaking', 'historic', 'momentous', 'decisive', 'urgent'],
        keyElements: ['Restate thesis', 'Summarize main arguments', 'Call to action', 'Final compelling thought'],
        transitionWords: ['in conclusion', 'therefore', 'thus', 'consequently', 'as a result']
      }
    ]
  },

  expository: {
    title: "📖 Information Explorer: Expository Structure",
    description: "Master the art of explanation! Learn how to inform and educate your reader with clear, well-organized information.",
    proTip: "Great expository writing is like being a tour guide for your reader's mind. Lead them through complex information step by step, using clear examples and logical organization!",
    phases: [
      {
        id: 'introduction',
        title: '1. Introduction: Set the Stage',
        description: 'Introduce your topic, provide necessary background information, and present a clear thesis that outlines what you will explain.',
        sentenceStarters: [
          'Have you ever wondered...',
          '[Topic] is a complex process that...',
          'Understanding [topic] requires...',
          'To fully grasp [concept]...'
        ],
        powerWords: ['complex', 'fascinating', 'intricate', 'essential', 'fundamental', 'comprehensive', 'detailed', 'systematic', 'thorough'],
        keyElements: ['Topic introduction', 'Background context', 'Clear thesis statement', 'Preview of main points'],
        transitionWords: ['first', 'to begin', 'initially', 'primarily']
      },
      {
        id: 'body-paragraphs',
        title: '2. Body Paragraphs: Explain and Elaborate',
        description: 'Present your information in logical order. Each paragraph should focus on one main idea with supporting details, examples, and explanations.',
        sentenceStarters: [
          'The first aspect to consider is...',
          'Another important factor is...',
          'This process involves...',
          'For example...'
        ],
        powerWords: ['specifically', 'particularly', 'notably', 'significantly', 'consequently', 'therefore', 'furthermore', 'additionally', 'moreover'],
        keyElements: ['Clear topic sentences', 'Supporting details', 'Examples and illustrations', 'Logical organization'],
        transitionWords: ['next', 'then', 'additionally', 'furthermore', 'moreover', 'also', 'similarly']
      },
      {
        id: 'analysis',
        title: '3. Analysis: Dig Deeper',
        description: 'Analyze the information you\'ve presented. Explain relationships, causes and effects, or significance of the information.',
        sentenceStarters: [
          'This information reveals that...',
          'The significance of this is...',
          'As a result of [cause]...',
          'This leads to...'
        ],
        powerWords: ['reveals', 'demonstrates', 'indicates', 'suggests', 'implies', 'confirms', 'establishes', 'proves', 'illustrates'],
        keyElements: ['Cause and effect relationships', 'Significance of information', 'Connections between ideas', 'Deeper understanding'],
        transitionWords: ['because', 'since', 'as a result', 'therefore', 'consequently', 'thus']
      },
      {
        id: 'conclusion',
        title: '4. Conclusion: Wrap It Up',
        description: 'Summarize the key information, restate the importance of your topic, and leave the reader with a clear understanding.',
        sentenceStarters: [
          'In summary...',
          'To conclude...',
          'Understanding [topic] helps us...',
          'This information shows that...'
        ],
        powerWords: ['ultimately', 'overall', 'comprehensive', 'complete', 'thorough', 'enlightening', 'informative', 'valuable', 'essential'],
        keyElements: ['Summary of main points', 'Restatement of importance', 'Final insights', 'Clear conclusion'],
        transitionWords: ['in conclusion', 'to summarize', 'overall', 'in summary', 'finally']
      }
    ]
  },

  descriptive: {
    title: "🎨 Sensory Painter: Descriptive Structure",
    description: "Master the art of description! Learn how to paint vivid pictures with words that make your reader feel like they're experiencing what you describe.",
    proTip: "Great descriptive writing engages all five senses and uses specific, concrete details rather than general statements. Show your reader the world through your eyes!",
    phases: [
      {
        id: 'introduction',
        title: '1. First Impression: Set the Scene',
        description: 'Introduce what you\'re describing and create an overall impression. Give your reader a sense of what they\'re about to experience.',
        sentenceStarters: [
          'Picture this...',
          'Imagine standing before...',
          'The first thing you notice about...',
          'Step into a world where...'
        ],
        powerWords: ['vivid', 'striking', 'remarkable', 'extraordinary', 'captivating', 'mesmerizing', 'breathtaking', 'stunning', 'magnificent'],
        sensoryDetails: {
          sight: ['vibrant colors', 'intricate patterns', 'dramatic shadows', 'gleaming surfaces', 'weathered textures'],
          sound: ['gentle murmur', 'rhythmic beating', 'melodic harmony', 'sharp contrast', 'peaceful silence'],
          touch: ['smooth surface', 'rough texture', 'gentle warmth', 'cool breeze', 'soft embrace'],
          smell: ['fragrant aroma', 'crisp freshness', 'rich scent', 'subtle perfume', 'earthy essence'],
          feelings: ['overwhelming', 'peaceful', 'energizing', 'comforting', 'inspiring']
        }
      },
      {
        id: 'detailed-description',
        title: '2. Detailed Description: Paint the Picture',
        description: 'Use specific sensory details to describe your subject. Move systematically through different aspects, engaging all five senses.',
        sentenceStarters: [
          'Looking closer, you can see...',
          'The texture feels like...',
          'A distinctive scent of...',
          'The sound of... fills the air...'
        ],
        powerWords: ['intricate', 'delicate', 'robust', 'subtle', 'intense', 'graceful', 'rugged', 'elegant', 'pristine'],
        sensoryDetails: {
          sight: ['dappled sunlight', 'rich burgundy', 'crystalline clarity', 'weathered bronze', 'iridescent shimmer'],
          sound: ['whispered secrets', 'thunderous applause', 'gentle lapping', 'crisp footsteps', 'melodious laughter'],
          touch: ['velvety petals', 'coarse sandpaper', 'silky fabric', 'jagged edges', 'cushioned softness'],
          smell: ['pine needles', 'fresh bread', 'ocean spray', 'blooming jasmine', 'old leather'],
          feelings: ['nostalgic', 'invigorated', 'serene', 'excited', 'contemplative']
        }
      },
      {
        id: 'emotional-connection',
        title: '3. Emotional Connection: Share the Feeling',
        description: 'Explain how this subject makes you feel and why it\'s significant. Help your reader understand the emotional impact.',
        sentenceStarters: [
          'This place makes me feel...',
          'Standing here, I am reminded of...',
          'The significance of this moment...',
          'What strikes me most is...'
        ],
        powerWords: ['profound', 'meaningful', 'touching', 'inspiring', 'overwhelming', 'peaceful', 'energizing', 'transformative', 'memorable'],
        keyElements: ['Personal response', 'Emotional significance', 'Memories or associations', 'Why it matters'],
        transitionWords: ['as I reflect', 'this reminds me', 'I feel', 'what moves me']
      },
      {
        id: 'conclusion',
        title: '4. Lasting Impression: Final Image',
        description: 'End with a powerful final image or reflection that captures the essence of what you\'ve described.',
        sentenceStarters: [
          'As I take one last look...',
          'The memory that will stay with me...',
          'In the end, what defines this place...',
          'Long after leaving...'
        ],
        powerWords: ['unforgettable', 'timeless', 'eternal', 'haunting', 'beautiful', 'perfect', 'complete', 'whole', 'lasting'],
        keyElements: ['Final vivid image', 'Lasting impression', 'Overall significance', 'Memorable conclusion'],
        transitionWords: ['finally', 'ultimately', 'in the end', 'as I conclude']
      }
    ]
  },

  reflective: {
    title: "🪞 Inner Journey: Reflective Structure",
    description: "Master the art of reflection! Learn how to explore your thoughts, experiences, and growth in a meaningful way.",
    proTip: "Great reflective writing is honest and thoughtful. Don't just describe what happened—explore what it meant and how it changed you!",
    phases: [
      {
        id: 'experience',
        title: '1. The Experience: What Happened',
        description: 'Describe the experience, event, or situation you\'re reflecting on. Set the scene and provide necessary context.',
        sentenceStarters: [
          'Looking back on...',
          'I remember when...',
          'The experience that changed me...',
          'It all started when...'
        ],
        powerWords: ['significant', 'memorable', 'pivotal', 'transformative', 'challenging', 'unexpected', 'profound', 'meaningful', 'impactful'],
        keyElements: ['Context and setting', 'Key events', 'People involved', 'Initial feelings']
      },
      {
        id: 'reflection',
        title: '2. Deep Reflection: What It Meant',
        description: 'Analyze your thoughts and feelings about the experience. Explore different perspectives and consider the deeper meaning.',
        sentenceStarters: [
          'At first, I thought...',
          'Now I realize that...',
          'What surprised me was...',
          'I began to understand...'
        ],
        powerWords: ['realized', 'discovered', 'understood', 'recognized', 'appreciated', 'acknowledged', 'comprehended', 'grasped', 'perceived'],
        keyElements: ['Initial thoughts vs. current understanding', 'Different perspectives', 'Deeper meanings', 'Emotional responses']
      },
      {
        id: 'learning',
        title: '3. Learning: What I Gained',
        description: 'Identify the lessons learned, skills gained, or insights discovered. Explain how this experience contributed to your growth.',
        sentenceStarters: [
          'This experience taught me...',
          'I learned that...',
          'The most important lesson was...',
          'I gained a new understanding of...'
        ],
        powerWords: ['valuable', 'insightful', 'enlightening', 'educational', 'eye-opening', 'revealing', 'instructive', 'beneficial', 'enriching'],
        keyElements: ['Specific lessons learned', 'Skills developed', 'New perspectives gained', 'Personal growth']
      },
      {
        id: 'application',
        title: '4. Moving Forward: How I\'ll Apply This',
        description: 'Explain how this learning will influence your future actions, decisions, or perspective. Connect past experience to future growth.',
        sentenceStarters: [
          'Moving forward, I will...',
          'This experience will help me...',
          'In the future, I plan to...',
          'I am committed to...'
        ],
        powerWords: ['committed', 'determined', 'motivated', 'inspired', 'prepared', 'equipped', 'ready', 'confident', 'empowered'],
        keyElements: ['Future applications', 'Changed behaviors', 'New goals', 'Continued growth plans']
      }
    ]
  },

  recount: {
    title: "📅 Story Teller: Recount Structure",
    description: "Master the art of retelling! Learn how to share events and experiences in a clear, engaging chronological order.",
    proTip: "Great recounts feel like you're taking your reader on a journey through time. Use time connectors and vivid details to make events come alive!",
    phases: [
      {
        id: 'orientation',
        title: '1. Orientation: Set the Scene',
        description: 'Introduce the who, what, when, and where of your recount. Give your reader the essential background information.',
        sentenceStarters: [
          'Last [time period], I...',
          'It was [time] when...',
          'The event took place at...',
          'On [date/day], my [family/friends/class] and I...'
        ],
        powerWords: ['memorable', 'exciting', 'unexpected', 'special', 'important', 'significant', 'remarkable', 'unforgettable', 'extraordinary'],
        keyElements: ['Who was involved', 'What happened', 'When it occurred', 'Where it took place', 'Why it was significant'],
        transitionWords: ['first', 'initially', 'to begin with', 'at the start']
      },
      {
        id: 'events',
        title: '2. Sequence of Events: What Happened Next',
        description: 'Describe the events in chronological order. Use time connectors to help your reader follow the sequence clearly.',
        sentenceStarters: [
          'First, we...',
          'After that...',
          'Next, something unexpected happened...',
          'Then, we discovered...'
        ],
        powerWords: ['suddenly', 'immediately', 'gradually', 'eventually', 'simultaneously', 'meanwhile', 'subsequently', 'consequently', 'finally'],
        keyElements: ['Chronological order', 'Key events and activities', 'People\'s reactions', 'Important details'],
        transitionWords: ['then', 'next', 'after that', 'later', 'meanwhile', 'during', 'while', 'subsequently']
      },
      {
        id: 'climax',
        title: '3. Highlight: The Most Important Part',
        description: 'Focus on the most significant, exciting, or memorable part of the experience. This is where you add the most detail.',
        sentenceStarters: [
          'The most exciting part was when...',
          'The highlight of the day occurred when...',
          'What I\'ll never forget is...',
          'The moment that stood out was...'
        ],
        powerWords: ['thrilling', 'amazing', 'incredible', 'spectacular', 'breathtaking', 'astonishing', 'wonderful', 'fantastic', 'outstanding'],
        keyElements: ['Most significant moment', 'Detailed description', 'Emotional responses', 'Why it was important'],
        transitionWords: ['most importantly', 'the highlight was', 'what stood out', 'particularly memorable']
      },
      {
        id: 'conclusion',
        title: '4. Conclusion: Wrapping Up',
        description: 'End your recount by reflecting on the overall experience and its significance. Share your final thoughts or feelings.',
        sentenceStarters: [
          'Overall, it was...',
          'Looking back, I feel...',
          'The experience was...',
          'I will always remember...'
        ],
        powerWords: ['memorable', 'worthwhile', 'valuable', 'enjoyable', 'meaningful', 'special', 'important', 'unforgettable', 'significant'],
        keyElements: ['Overall evaluation', 'Personal reflection', 'Lasting impact', 'Final thoughts'],
        transitionWords: ['in conclusion', 'overall', 'in the end', 'finally', 'to sum up']
      }
    ]
  },

  technical: {
    title: "🔧 Instruction Master: Technical Structure",
    description: "Master the art of instruction! Learn how to write clear, step-by-step guides that help others accomplish tasks successfully.",
    proTip: "Great technical writing is like being a helpful teacher. Be clear, be specific, and always think about what your reader needs to know to succeed!",
    phases: [
      {
        id: 'overview',
        title: '1. Overview: What We\'re Doing',
        description: 'Introduce the task or process, explain its purpose, and provide an overview of what will be accomplished.',
        sentenceStarters: [
          'This guide will teach you how to...',
          'By following these steps, you will...',
          'The purpose of this process is to...',
          'You will learn to...'
        ],
        powerWords: ['essential', 'important', 'necessary', 'required', 'fundamental', 'basic', 'key', 'critical', 'vital'],
        keyElements: ['Clear objective', 'Purpose explanation', 'Expected outcome', 'Skill level required'],
        transitionWords: ['to begin', 'first', 'initially', 'before starting']
      },
      {
        id: 'materials',
        title: '2. Materials & Preparation: What You\'ll Need',
        description: 'List all materials, tools, or prerequisites needed. Include any preparation steps that should be completed first.',
        sentenceStarters: [
          'Before you begin, gather...',
          'You will need the following materials...',
          'Make sure you have...',
          'Prepare by...'
        ],
        powerWords: ['required', 'necessary', 'essential', 'important', 'recommended', 'optional', 'additional', 'specific', 'appropriate'],
        keyElements: ['Complete materials list', 'Tools required', 'Preparation steps', 'Safety considerations'],
        transitionWords: ['before starting', 'first', 'initially', 'to prepare']
      },
      {
        id: 'steps',
        title: '3. Step-by-Step Instructions: How to Do It',
        description: 'Provide clear, detailed instructions in logical order. Use numbered steps and include warnings or tips where needed.',
        sentenceStarters: [
          'Step 1: Begin by...',
          'Next, carefully...',
          'Now, you should...',
          'Important: Make sure to...'
        ],
        powerWords: ['carefully', 'precisely', 'exactly', 'thoroughly', 'completely', 'properly', 'correctly', 'accurately', 'systematically'],
        keyElements: ['Numbered steps', 'Clear instructions', 'Safety warnings', 'Helpful tips'],
        transitionWords: ['first', 'next', 'then', 'after that', 'following this', 'subsequently', 'finally']
      },
      {
        id: 'troubleshooting',
        title: '4. Troubleshooting & Conclusion: Problem Solving',
        description: 'Address common problems and their solutions. Conclude with final checks and next steps.',
        sentenceStarters: [
          'If you encounter problems...',
          'Common issues include...',
          'To verify success...',
          'You have now completed...'
        ],
        powerWords: ['troubleshoot', 'resolve', 'fix', 'correct', 'adjust', 'modify', 'verify', 'confirm', 'complete'],
        keyElements: ['Common problems', 'Solutions', 'Quality checks', 'Final verification'],
        transitionWords: ['if problems occur', 'to troubleshoot', 'finally', 'in conclusion', 'to verify']
      }
    ]
  },

  creative: {
    title: "🌟 Creative Explorer: Free Expression Structure",
    description: "Unleash your creativity! This flexible structure supports experimental writing, poetry, creative non-fiction, and artistic expression.",
    proTip: "Creative writing is about breaking rules and finding your unique voice. Use this structure as a starting point, but feel free to experiment and let your creativity flow!",
    phases: [
      {
        id: 'inspiration',
        title: '1. Inspiration: Spark Your Creativity',
        description: 'Begin with what inspires you. This could be an image, feeling, memory, question, or wild idea that captures your imagination.',
        sentenceStarters: [
          'What if...',
          'I imagine...',
          'In a world where...',
          'The feeling of... reminds me of...'
        ],
        powerWords: ['imagine', 'dream', 'wonder', 'envision', 'create', 'invent', 'discover', 'explore', 'experiment'],
        keyElements: ['Initial inspiration', 'Creative spark', 'Unique perspective', 'Artistic vision'],
        transitionWords: ['imagine', 'picture this', 'what if', 'in my mind']
      },
      {
        id: 'exploration',
        title: '2. Exploration: Develop Your Ideas',
        description: 'Explore your inspiration from different angles. Play with language, experiment with style, and develop your creative concepts.',
        sentenceStarters: [
          'This idea grows into...',
          'From another angle...',
          'The deeper meaning might be...',
          'Playing with this concept...'
        ],
        powerWords: ['transform', 'evolve', 'morph', 'shift', 'dance', 'flow', 'weave', 'spiral', 'bloom'],
        keyElements: ['Creative development', 'Experimental language', 'Multiple perspectives', 'Artistic techniques'],
        transitionWords: ['meanwhile', 'alternatively', 'from here', 'spiraling outward', 'diving deeper']
      },
      {
        id: 'expression',
        title: '3. Expression: Let It Flow',
        description: 'Express your ideas freely using your chosen creative form. This is where you let your artistic voice shine through.',
        sentenceStarters: [
          'The words dance like...',
          'Colors bleed into...',
          'Time moves like...',
          'In this space...'
        ],
        powerWords: ['vibrant', 'ethereal', 'luminous', 'haunting', 'electric', 'fluid', 'crystalline', 'infinite', 'transcendent'],
        keyElements: ['Artistic expression', 'Creative language', 'Unique voice', 'Experimental form'],
        transitionWords: ['flowing into', 'becoming', 'transforming', 'emerging as']
      },
      {
        id: 'reflection',
        title: '4. Reflection: What You\'ve Created',
        description: 'Step back and reflect on your creative work. What have you discovered? How does it make you feel? What does it mean?',
        sentenceStarters: [
          'In creating this, I discovered...',
          'This piece represents...',
          'The journey of writing this taught me...',
          'What emerges is...'
        ],
        powerWords: ['profound', 'meaningful', 'revelatory', 'transformative', 'enlightening', 'cathartic', 'liberating', 'authentic', 'powerful'],
        keyElements: ['Creative reflection', 'Personal discovery', 'Artistic meaning', 'Growth through creation'],
        transitionWords: ['reflecting on', 'looking back', 'in the end', 'what remains']
      }
    ]
  }
};

/**
 * Get the structure for a specific text type
 */
export function getTextTypeStructure(textType: string): TextTypeStructure {
  const normalizedType = textType.toLowerCase();
  return TEXT_TYPE_STRUCTURES[normalizedType] || TEXT_TYPE_STRUCTURES.narrative;
}

/**
 * Get all available text types
 */
export function getAllTextTypes(): string[] {
  return Object.keys(TEXT_TYPE_STRUCTURES);
}