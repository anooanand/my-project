/**
 * Dynamic Writing Stage Structures
 *
 * Defines step-by-step guidance for all NSW writing types.
 * Each stage includes specific prompts, questions, and guidance
 * that actively teach students how to construct genre-appropriate pieces.
 */

export interface WritingStage {
  id: string;
  name: string;
  description: string;
  icon: string;
  prompts: string[];
  tips: string[];
  examples?: string[];
  minimumWords?: number;
  objectives: string[];
}

export interface WritingTypeStructure {
  textType: string;
  displayName: string;
  description: string;
  stages: WritingStage[];
  overallGuidance: string;
}

// ============================================================================
// NARRATIVE WRITING
// ============================================================================

export const narrativeStructure: WritingTypeStructure = {
  textType: 'narrative',
  displayName: 'Narrative Writing',
  description: 'Tell a story with characters, setting, and plot',
  overallGuidance: 'A narrative takes your reader on a journey. Follow these stages to craft a compelling story.',
  stages: [
    {
      id: 'opening',
      name: 'Opening',
      description: 'Hook your reader and set the scene',
      icon: '🏠',
      prompts: [
        'Who is your main character? Describe their appearance and personality in 2-3 sentences.',
        'Where and when does your story take place? Paint a vivid picture of the setting.',
        'What is your character doing at the start? What is their normal world like?',
        'How will you hook your reader? Start with action, dialogue, or an intriguing statement.'
      ],
      tips: [
        'Start with something that grabs attention',
        'Use descriptive language to paint a picture',
        'Introduce your main character quickly',
        'Set the mood and tone of your story'
      ],
      examples: [
        'The thunder crashed as Maya huddled under the ancient oak tree...',
        '"Don\'t look back," whispered Tom, his voice barely audible...',
        'It was the kind of morning that promised adventure...'
      ],
      minimumWords: 40,
      objectives: [
        'Introduce main character',
        'Establish setting',
        'Hook the reader',
        'Set the tone'
      ]
    },
    {
      id: 'inciting_incident',
      name: 'Inciting Incident',
      description: 'Something happens that changes everything',
      icon: '⚡',
      prompts: [
        'What event disrupts your character\'s normal world?',
        'How does your character react to this event?',
        'What problem or challenge does this create?',
        'Why is this moment important for your character?'
      ],
      tips: [
        'This event should surprise the reader',
        'Show your character\'s initial reaction',
        'Make it clear why this matters',
        'This sets your story in motion'
      ],
      examples: [
        'Suddenly, a mysterious letter appeared on the doorstep...',
        'Without warning, the lights went out across the entire city...',
        'That\'s when she noticed the map hidden inside the book...'
      ],
      minimumWords: 30,
      objectives: [
        'Introduce the main problem',
        'Disrupt the normal world',
        'Show character reaction',
        'Set story in motion'
      ]
    },
    {
      id: 'rising_action',
      name: 'Rising Action',
      description: 'Build tension with challenges and complications',
      icon: '📈',
      prompts: [
        'What obstacles does your character face as they try to solve the problem?',
        'How do things get more complicated or difficult?',
        'What decisions does your character make? Do they succeed or fail?',
        'How do your character\'s feelings and thoughts change?',
        'Who helps or hinders your character along the way?'
      ],
      tips: [
        'Add at least 2-3 complications',
        'Show your character struggling',
        'Include both successes and failures',
        'Build tension gradually',
        'Use dialogue and action'
      ],
      examples: [
        'First they tried the front door, but it was locked...',
        'Just when things seemed to be going right, another problem arose...',
        'With each step forward, the challenge grew more difficult...'
      ],
      minimumWords: 80,
      objectives: [
        'Present multiple obstacles',
        'Show character growth',
        'Build tension steadily',
        'Keep reader engaged'
      ]
    },
    {
      id: 'climax',
      name: 'Climax',
      description: 'The most exciting moment - the turning point!',
      icon: '🌟',
      prompts: [
        'What is the most intense, exciting moment in your story?',
        'What crucial decision does your character make?',
        'How does your character face their biggest challenge?',
        'What is at stake in this moment? What could be lost or won?'
      ],
      tips: [
        'This is your story\'s peak moment',
        'Use strong, vivid language',
        'Show emotion and tension',
        'Make the reader feel the intensity',
        'This should be the turning point'
      ],
      examples: [
        'With trembling hands, she reached for the final switch...',
        'Everything depended on this one moment...',
        'Time seemed to slow as they made their choice...'
      ],
      minimumWords: 50,
      objectives: [
        'Reach peak tension',
        'Show crucial decision',
        'Resolve main conflict',
        'Create emotional impact'
      ]
    },
    {
      id: 'falling_action',
      name: 'Falling Action',
      description: 'After the climax - immediate consequences',
      icon: '📉',
      prompts: [
        'What happens immediately after the big moment?',
        'How do things begin to settle down?',
        'What immediate consequences result from the climax?',
        'How does your character feel now?'
      ],
      tips: [
        'Start to wind down the tension',
        'Show immediate results',
        'Address lingering questions',
        'Transition toward the ending'
      ],
      examples: [
        'As the dust settled, they realized what they had accomplished...',
        'The danger had passed, but questions remained...',
        'In the aftermath, everything felt different...'
      ],
      minimumWords: 30,
      objectives: [
        'Resolve immediate tension',
        'Show consequences',
        'Begin transition to ending',
        'Address story threads'
      ]
    },
    {
      id: 'resolution',
      name: 'Resolution',
      description: 'A satisfying ending',
      icon: '✨',
      prompts: [
        'How has your character changed from the beginning?',
        'What did your character learn from this experience?',
        'How is the world different now than at the start?',
        'What final thought or feeling do you want to leave with your reader?'
      ],
      tips: [
        'Tie up loose ends',
        'Show character growth',
        'Give a sense of closure',
        'End with impact',
        'Leave the reader satisfied'
      ],
      examples: [
        'As they walked home, they knew nothing would ever be the same...',
        'The adventure was over, but its lessons would last forever...',
        'And that\'s how they learned that courage comes in many forms...'
      ],
      minimumWords: 30,
      objectives: [
        'Provide closure',
        'Show transformation',
        'Leave lasting impression',
        'Complete the journey'
      ]
    }
  ]
};

// ============================================================================
// PERSUASIVE WRITING
// ============================================================================

export const persuasiveStructure: WritingTypeStructure = {
  textType: 'persuasive',
  displayName: 'Persuasive Writing',
  description: 'Convince your reader of your viewpoint',
  overallGuidance: 'Present a clear position and support it with strong arguments and evidence.',
  stages: [
    {
      id: 'introduction',
      name: 'Introduction',
      description: 'State your position clearly and hook the reader',
      icon: '🎯',
      prompts: [
        'What is your topic? State it in one clear sentence.',
        'What is your position? Do you agree, disagree, or suggest something?',
        'Write your thesis statement: "I believe that..." or "We should..."',
        'How will you hook your reader? Use a question, fact, or striking statement.'
      ],
      tips: [
        'Be clear about your position from the start',
        'Hook the reader with something interesting',
        'Preview your main arguments',
        'Keep it concise but impactful'
      ],
      examples: [
        'Did you know that...? This is why I believe...',
        'Every student deserves... and here\'s why it matters...',
        'We face an important choice, and the right answer is clear...'
      ],
      minimumWords: 40,
      objectives: [
        'State thesis clearly',
        'Hook the reader',
        'Preview arguments',
        'Establish credibility'
      ]
    },
    {
      id: 'argument_1',
      name: 'First Argument',
      description: 'Present your strongest supporting point',
      icon: '💪',
      prompts: [
        'What is your STRONGEST reason to support your position? State it clearly.',
        'What evidence supports this argument? (facts, examples, statistics, expert opinions)',
        'Explain WHY this evidence matters and HOW it supports your position.',
        'Use transition words: "Firstly," "To begin with," "Most importantly,"'
      ],
      tips: [
        'Start with your best argument',
        'Provide specific evidence',
        'Explain your reasoning clearly',
        'Use persuasive language',
        'Make it convincing'
      ],
      examples: [
        'Firstly, research shows that...',
        'The most compelling reason is...',
        'To begin with, consider the fact that...'
      ],
      minimumWords: 50,
      objectives: [
        'Present clear argument',
        'Provide evidence',
        'Explain reasoning',
        'Persuade effectively'
      ]
    },
    {
      id: 'argument_2',
      name: 'Second Argument',
      description: 'Add another strong supporting point',
      icon: '🎪',
      prompts: [
        'What is your SECOND strongest reason? State it as a new point.',
        'What different evidence supports THIS argument?',
        'How does this argument strengthen your overall position?',
        'Use transition words: "Furthermore," "Additionally," "Secondly,"'
      ],
      tips: [
        'Make this argument different from the first',
        'Provide new evidence',
        'Show variety in your reasoning',
        'Build on your previous point'
      ],
      examples: [
        'Furthermore, we must consider...',
        'In addition to this, evidence suggests...',
        'Secondly, it is important to note that...'
      ],
      minimumWords: 50,
      objectives: [
        'Present second argument',
        'Add new evidence',
        'Strengthen overall case',
        'Maintain persuasive tone'
      ]
    },
    {
      id: 'argument_3',
      name: 'Third Argument (Optional)',
      description: 'Reinforce with an additional point',
      icon: '🔥',
      prompts: [
        'Do you have a third strong reason? If so, what is it?',
        'What evidence supports this final argument?',
        'How does this complete your case?',
        'Use transition words: "Finally," "Lastly," "Moreover,"'
      ],
      tips: [
        'Keep it concise if adding a third',
        'Ensure it adds value',
        'Don\'t repeat previous points',
        'This is optional but can strengthen your case'
      ],
      examples: [
        'Finally, we cannot ignore the fact that...',
        'Moreover, this approach has proven...',
        'Lastly, consider the long-term benefits...'
      ],
      minimumWords: 40,
      objectives: [
        'Add final supporting point',
        'Complete argument set',
        'Reinforce position',
        'Prepare for conclusion'
      ]
    },
    {
      id: 'counterargument',
      name: 'Counter-Argument & Rebuttal',
      description: 'Address opposing views respectfully',
      icon: '⚖️',
      prompts: [
        'What might someone who disagrees say? State their viewpoint fairly.',
        'Why is this opposing view not as strong as yours?',
        'What evidence shows your position is better?',
        'Use phrases like: "Some people might argue... however," "While it\'s true that... we must also consider..."'
      ],
      tips: [
        'Show you understand other viewpoints',
        'Be respectful, not dismissive',
        'Explain why your view is stronger',
        'This shows mature thinking'
      ],
      examples: [
        'Some people might argue that..., however...',
        'While it\'s true that..., we must also consider...',
        'Critics may say..., but the evidence clearly shows...'
      ],
      minimumWords: 40,
      objectives: [
        'Acknowledge opposing views',
        'Refute respectfully',
        'Strengthen your position',
        'Show balanced thinking'
      ]
    },
    {
      id: 'conclusion',
      name: 'Conclusion',
      description: 'Summarize and leave a lasting impression',
      icon: '🏁',
      prompts: [
        'Restate your thesis in a NEW way (don\'t just copy your introduction).',
        'Briefly summarize your strongest arguments in 1-2 sentences.',
        'What action do you want readers to take, or what do you want them to remember?',
        'End with a powerful final thought, question, or call to action.'
      ],
      tips: [
        'Don\'t just repeat yourself',
        'Summarize main points briefly',
        'Leave a lasting impression',
        'End strongly and confidently',
        'Include a call to action if appropriate'
      ],
      examples: [
        'In conclusion, it is clear that...',
        'For all these reasons, we must...',
        'The evidence overwhelmingly supports...',
        'Therefore, let us take action to...'
      ],
      minimumWords: 40,
      objectives: [
        'Restate thesis differently',
        'Summarize key points',
        'Call to action',
        'Leave strong impression'
      ]
    }
  ]
};

// ============================================================================
// EXPOSITORY WRITING
// ============================================================================

export const expositoryStructure: WritingTypeStructure = {
  textType: 'expository',
  displayName: 'Expository Writing',
  description: 'Explain or inform about a topic',
  overallGuidance: 'Present information clearly and objectively to help readers understand your topic.',
  stages: [
    {
      id: 'introduction',
      name: 'Introduction',
      description: 'Introduce your topic and preview main points',
      icon: '📚',
      prompts: [
        'What is your topic? State it clearly in one sentence.',
        'Why is this topic important or interesting?',
        'What main points will you explain? List 2-3 key ideas.',
        'Write a hook to grab attention: a fact, question, or interesting statement.'
      ],
      tips: [
        'Be clear and objective',
        'Preview what you\'ll explain',
        'Make it interesting but factual',
        'Set expectations for the reader'
      ],
      examples: [
        'Have you ever wondered how...? This essay will explain...',
        'Understanding [topic] is important because...',
        'There are three main aspects of [topic] that everyone should know...'
      ],
      minimumWords: 40,
      objectives: [
        'Introduce topic clearly',
        'Preview main points',
        'Engage reader interest',
        'Set informative tone'
      ]
    },
    {
      id: 'body_point_1',
      name: 'First Main Point',
      description: 'Explain your first key idea',
      icon: '1️⃣',
      prompts: [
        'What is your first main point? State it in a clear topic sentence.',
        'What facts, details, or examples explain this point?',
        'How does this information help readers understand the topic?',
        'Use transition words: "First," "To begin with," "Initially,"'
      ],
      tips: [
        'Start with a clear topic sentence',
        'Provide specific details and facts',
        'Explain thoroughly',
        'Use examples to clarify',
        'Stay objective and factual'
      ],
      minimumWords: 50,
      objectives: [
        'Present first main idea',
        'Provide supporting details',
        'Explain clearly',
        'Use facts and examples'
      ]
    },
    {
      id: 'body_point_2',
      name: 'Second Main Point',
      description: 'Explain your second key idea',
      icon: '2️⃣',
      prompts: [
        'What is your second main point? State it clearly.',
        'What new information or details support this point?',
        'How does this relate to your first point?',
        'Use transition words: "Next," "Furthermore," "In addition,"'
      ],
      tips: [
        'Make clear connection to previous point',
        'Provide different information',
        'Maintain factual tone',
        'Explain thoroughly'
      ],
      minimumWords: 50,
      objectives: [
        'Present second idea',
        'Add new information',
        'Connect to previous point',
        'Deepen understanding'
      ]
    },
    {
      id: 'body_point_3',
      name: 'Third Main Point',
      description: 'Explain your third key idea',
      icon: '3️⃣',
      prompts: [
        'What is your third main point? State it clearly.',
        'What final details or examples support this?',
        'How does this complete your explanation of the topic?',
        'Use transition words: "Finally," "Lastly," "Additionally,"'
      ],
      tips: [
        'Complete your explanation',
        'Provide final key details',
        'Tie points together',
        'Prepare for conclusion'
      ],
      minimumWords: 50,
      objectives: [
        'Present final main point',
        'Complete information set',
        'Connect all ideas',
        'Provide comprehensive view'
      ]
    },
    {
      id: 'conclusion',
      name: 'Conclusion',
      description: 'Summarize and reinforce understanding',
      icon: '✅',
      prompts: [
        'Briefly summarize the main points you explained (2-3 sentences).',
        'Restate why this topic is important or significant.',
        'What should readers understand now about this topic?',
        'End with a final thought or interesting fact.'
      ],
      tips: [
        'Summarize key information',
        'Reinforce main message',
        'Don\'t introduce new information',
        'Leave reader with clear understanding'
      ],
      examples: [
        'In summary, [topic] involves three key aspects...',
        'Understanding [topic] helps us appreciate...',
        'Now that we\'ve explored [topic], it\'s clear that...'
      ],
      minimumWords: 40,
      objectives: [
        'Summarize main points',
        'Reinforce importance',
        'Provide closure',
        'Ensure clear understanding'
      ]
    }
  ]
};

// ============================================================================
// DESCRIPTIVE WRITING
// ============================================================================

export const descriptiveStructure: WritingTypeStructure = {
  textType: 'descriptive',
  displayName: 'Descriptive Writing',
  description: 'Paint a vivid picture with words',
  overallGuidance: 'Use sensory details and figurative language to help readers see, hear, feel, smell, and taste what you describe.',
  stages: [
    {
      id: 'introduction',
      name: 'Opening',
      description: 'Introduce what you\'re describing',
      icon: '🎨',
      prompts: [
        'What are you describing? A place, person, object, or scene?',
        'What is your first impression? What stands out most?',
        'How will you hook your reader? Start with a striking detail.',
        'Set the overall mood: Is it peaceful, mysterious, exciting, or something else?'
      ],
      tips: [
        'Start with your strongest impression',
        'Set the mood immediately',
        'Make the reader curious',
        'Use vivid, specific language'
      ],
      examples: [
        'The ancient forest stood silent, wrapped in morning mist...',
        'She had the kind of smile that could light up a room...',
        'The marketplace buzzed with life, colors, and countless sounds...'
      ],
      minimumWords: 30,
      objectives: [
        'Introduce subject',
        'Create first impression',
        'Set mood',
        'Hook reader'
      ]
    },
    {
      id: 'visual_details',
      name: 'Visual Description',
      description: 'What can you see?',
      icon: '👁️',
      prompts: [
        'What do you SEE? Describe colors, shapes, sizes, and patterns.',
        'What catches your eye first? Then what do you notice?',
        'Use comparisons: What does it look like? What does it remind you of?',
        'Include at least 3 specific visual details.'
      ],
      tips: [
        'Use specific colors (not just "blue" but "sapphire blue")',
        'Describe from near to far, or top to bottom',
        'Use similes and metaphors',
        'Paint a clear picture',
        'Show rather than tell'
      ],
      examples: [
        'The walls were painted a deep crimson, like aged wine...',
        'Towering above, the mountains stretched their jagged peaks...',
        'Her eyes sparkled like emeralds in sunlight...'
      ],
      minimumWords: 50,
      objectives: [
        'Provide visual details',
        'Use specific descriptors',
        'Create clear image',
        'Use figurative language'
      ]
    },
    {
      id: 'sensory_details',
      name: 'Other Senses',
      description: 'Engage sound, smell, touch, and taste',
      icon: '🎵',
      prompts: [
        'What SOUNDS do you hear? Describe at least 2 sounds.',
        'What SMELLS are present? Pleasant or unpleasant?',
        'What TEXTURES can you feel? Rough, smooth, soft, hard?',
        'If relevant, what TASTES are in the air or on your tongue?'
      ],
      tips: [
        'Use onomatopoeia for sounds (buzz, crash, whisper)',
        'Be specific about smells (fresh bread, not just "good smell")',
        'Describe textures vividly',
        'Engage multiple senses',
        'Make the reader feel present'
      ],
      examples: [
        'The wind whispered through the leaves while birds chirped overhead...',
        'A sweet aroma of cinnamon and vanilla filled the air...',
        'The ancient wood felt rough and weathered beneath my fingertips...'
      ],
      minimumWords: 50,
      objectives: [
        'Engage multiple senses',
        'Create immersive experience',
        'Use vivid sensory words',
        'Make scene come alive'
      ]
    },
    {
      id: 'emotional_atmosphere',
      name: 'Mood and Emotion',
      description: 'Convey the feeling and atmosphere',
      icon: '💫',
      prompts: [
        'What MOOD or ATMOSPHERE does this create? (peaceful, eerie, exciting, etc.)',
        'How does this place/person/thing make you FEEL?',
        'What emotions would others feel experiencing this?',
        'Use words that convey emotion and atmosphere.'
      ],
      tips: [
        'Don\'t just say "it felt scary" - show it',
        'Use mood-setting vocabulary',
        'Connect sensory details to feelings',
        'Create an emotional response'
      ],
      examples: [
        'An eerie silence hung in the air, making every small sound seem amplified...',
        'The warmth and laughter created a welcoming, homey atmosphere...',
        'A sense of ancient mystery pervaded the place...'
      ],
      minimumWords: 40,
      objectives: [
        'Establish mood',
        'Convey emotion',
        'Create atmosphere',
        'Evoke reader response'
      ]
    },
    {
      id: 'conclusion',
      name: 'Closing Impression',
      description: 'Leave a lasting image',
      icon: '🌅',
      prompts: [
        'What is your final, overall impression?',
        'What will you remember most about what you described?',
        'How has your view or feeling changed from beginning to end?',
        'End with a powerful final image or thought.'
      ],
      tips: [
        'Return to your opening mood or contrast it',
        'Leave reader with strong final image',
        'Make it memorable',
        'Tie it all together'
      ],
      examples: [
        'As the sun set, the entire scene transformed into something magical...',
        'This place, with all its beauty and mystery, would stay with me forever...',
        'And that\'s why this remains the most extraordinary place I\'ve ever seen...'
      ],
      minimumWords: 30,
      objectives: [
        'Provide closure',
        'Leave lasting impression',
        'Complete description',
        'End memorably'
      ]
    }
  ]
};

// ============================================================================
// REFLECTIVE WRITING
// ============================================================================

export const reflectiveStructure: WritingTypeStructure = {
  textType: 'reflective',
  displayName: 'Reflective Writing',
  description: 'Think deeply about an experience and what you learned',
  overallGuidance: 'Explore a significant experience, your thoughts about it, and what you learned.',
  stages: [
    {
      id: 'introduction',
      name: 'Introduction',
      description: 'Introduce the experience',
      icon: '🤔',
      prompts: [
        'What experience will you reflect on? Describe it briefly.',
        'When and where did this happen?',
        'Why is this experience significant to you?',
        'Hook the reader with the importance or impact of this moment.'
      ],
      tips: [
        'Set the context clearly',
        'Explain why this matters',
        'Be honest and personal',
        'Draw the reader in'
      ],
      examples: [
        'The day I learned to ride a bike taught me more than I expected...',
        'There was one moment that changed how I see myself...',
        'Looking back, I realize that experience shaped who I am today...'
      ],
      minimumWords: 40,
      objectives: [
        'Introduce experience',
        'Establish significance',
        'Set reflective tone',
        'Engage reader'
      ]
    },
    {
      id: 'description',
      name: 'Describe the Experience',
      description: 'What happened?',
      icon: '📖',
      prompts: [
        'What exactly happened? Describe the key events in order.',
        'Who was involved? What was their role?',
        'What were you thinking and feeling during this experience?',
        'Include important details that help readers understand.'
      ],
      tips: [
        'Be specific and detailed',
        'Include your thoughts and feelings',
        'Show, don\'t just tell',
        'Help reader experience it with you'
      ],
      minimumWords: 60,
      objectives: [
        'Narrate experience',
        'Include thoughts/feelings',
        'Provide context',
        'Create understanding'
      ]
    },
    {
      id: 'analysis',
      name: 'Analyze Your Response',
      description: 'Why did you react that way?',
      icon: '🔍',
      prompts: [
        'Why did you react or feel the way you did?',
        'What influenced your thoughts and actions?',
        'What surprised you about your own response?',
        'What did you discover about yourself?'
      ],
      tips: [
        'Dig deeper into your reactions',
        'Be honest and self-aware',
        'Examine your motivations',
        'Show self-understanding'
      ],
      minimumWords: 50,
      objectives: [
        'Analyze reactions',
        'Show self-awareness',
        'Explore motivations',
        'Demonstrate insight'
      ]
    },
    {
      id: 'learning',
      name: 'What Did You Learn?',
      description: 'Insights and lessons',
      icon: '💡',
      prompts: [
        'What did you learn from this experience?',
        'How did this change your perspective or understanding?',
        'What would you do differently if faced with this again?',
        'What insights did you gain about yourself or others?'
      ],
      tips: [
        'Identify specific lessons',
        'Show personal growth',
        'Be thoughtful and mature',
        'Connect to bigger ideas'
      ],
      minimumWords: 50,
      objectives: [
        'Identify lessons learned',
        'Show growth',
        'Demonstrate maturity',
        'Make connections'
      ]
    },
    {
      id: 'conclusion',
      name: 'Conclusion',
      description: 'Looking forward',
      icon: '🌟',
      prompts: [
        'How will this experience influence your future?',
        'What will you carry forward from this?',
        'How are you different because of this experience?',
        'What final thought do you want to share?'
      ],
      tips: [
        'Look to the future',
        'Show lasting impact',
        'End with insight',
        'Leave reader thoughtful'
      ],
      examples: [
        'Now, whenever I face a challenge, I remember...',
        'This experience taught me that...',
        'I will always carry this lesson with me...'
      ],
      minimumWords: 40,
      objectives: [
        'Show future application',
        'Demonstrate lasting impact',
        'Provide closure',
        'End thoughtfully'
      ]
    }
  ]
};

// ============================================================================
// RECOUNT WRITING
// ============================================================================

export const recountStructure: WritingTypeStructure = {
  textType: 'recount',
  displayName: 'Recount',
  description: 'Retell events in chronological order',
  overallGuidance: 'Tell what happened in the order it occurred, with clear details and reflections.',
  stages: [
    {
      id: 'orientation',
      name: 'Orientation',
      description: 'Set the scene',
      icon: '📍',
      prompts: [
        'What event are you recounting?',
        'When did it happen? Where did it take place?',
        'Who was involved? Who was there with you?',
        'Why are you sharing this particular event?'
      ],
      tips: [
        'Answer: Who? What? When? Where?',
        'Set the context clearly',
        'Give readers the background they need',
        'Make it interesting from the start'
      ],
      examples: [
        'Last summer, my family and I went to...',
        'On the first day of school, something unexpected happened...',
        'I\'ll never forget the day when...'
      ],
      minimumWords: 40,
      objectives: [
        'Establish who, what, when, where',
        'Set context',
        'Engage reader',
        'Prepare for events'
      ]
    },
    {
      id: 'sequence_events',
      name: 'Sequence of Events',
      description: 'What happened first, next, then?',
      icon: '📅',
      prompts: [
        'What happened FIRST? Describe the beginning events.',
        'What happened NEXT? Continue in chronological order.',
        'What happened THEN? Keep events in sequence.',
        'Use time connectives: First, Then, Next, After that, Later, Finally'
      ],
      tips: [
        'Keep events in clear order',
        'Use time connectives',
        'Include important details',
        'Don\'t skip important events',
        'Make it flow smoothly'
      ],
      examples: [
        'First, we arrived at the station...',
        'After waiting for an hour, the train finally arrived...',
        'Then, something completely unexpected occurred...'
      ],
      minimumWords: 80,
      objectives: [
        'Present events chronologically',
        'Use time connectives',
        'Maintain clear sequence',
        'Include key details'
      ]
    },
    {
      id: 'important_moment',
      name: 'Highlight Important Moments',
      description: 'Focus on significant parts',
      icon: '⭐',
      prompts: [
        'What was the most interesting or important part?',
        'Describe this moment in more detail.',
        'What made this moment special or memorable?',
        'What were you thinking or feeling during this?'
      ],
      tips: [
        'Slow down for important moments',
        'Add more detail here',
        'Include thoughts and feelings',
        'Help readers experience it with you'
      ],
      minimumWords: 50,
      objectives: [
        'Highlight key moments',
        'Add detailed description',
        'Include personal response',
        'Create engagement'
      ]
    },
    {
      id: 'conclusion',
      name: 'Conclusion',
      description: 'Wrap up and reflect',
      icon: '🎬',
      prompts: [
        'How did the event end?',
        'What happened finally or eventually?',
        'How did you feel about the whole experience?',
        'What will you remember most about this?'
      ],
      tips: [
        'Bring events to a close',
        'Include your final thoughts',
        'Reflect on the experience',
        'Leave a lasting impression'
      ],
      examples: [
        'By the end of the day, I realized...',
        'Looking back, this was one of the best days because...',
        'I\'ll always remember this experience...'
      ],
      minimumWords: 40,
      objectives: [
        'Conclude events',
        'Reflect on experience',
        'Share final thoughts',
        'Provide closure'
      ]
    }
  ]
};

// ============================================================================
// ADVERTISEMENT WRITING
// ============================================================================

export const advertisementStructure: WritingTypeStructure = {
  textType: 'advertisement',
  displayName: 'Advertisement',
  description: 'Persuade people to buy or do something',
  overallGuidance: 'Create an engaging, persuasive message that makes people want to take action.',
  stages: [
    {
      id: 'headline',
      name: 'Headline',
      description: 'Grab attention with a catchy headline',
      icon: '📢',
      prompts: [
        'What are you advertising? A product, service, event, or idea?',
        'Write a catchy headline that grabs attention (5-10 words).',
        'What makes this special or different?',
        'Use power words, questions, or exciting statements.'
      ],
      tips: [
        'Make it short and punchy',
        'Use exciting language',
        'Ask a question or make a bold claim',
        'Make people want to read more'
      ],
      examples: [
        'Discover the Adventure of a Lifetime!',
        'The Best Pizza in Town - Guaranteed!',
        'Transform Your Room in Just One Day!',
        'Don\'t Miss This Limited-Time Offer!'
      ],
      minimumWords: 10,
      objectives: [
        'Create catchy headline',
        'Grab attention immediately',
        'Introduce product/service',
        'Generate interest'
      ]
    },
    {
      id: 'hook',
      name: 'Opening Hook',
      description: 'Engage your audience',
      icon: '🎣',
      prompts: [
        'Why should people care about this?',
        'What problem does this solve?',
        'What benefit or desire does this fulfill?',
        'Make them imagine using or experiencing this.'
      ],
      tips: [
        'Focus on benefits, not just features',
        'Create desire or need',
        'Appeal to emotions',
        'Make it relatable'
      ],
      examples: [
        'Tired of boring weekends? Imagine...',
        'You deserve the best, and that\'s exactly what you\'ll get...',
        'Picture yourself...'
      ],
      minimumWords: 30,
      objectives: [
        'Create desire',
        'Show relevance',
        'Appeal to emotions',
        'Build interest'
      ]
    },
    {
      id: 'features_benefits',
      name: 'Features & Benefits',
      description: 'Explain what makes this great',
      icon: '✨',
      prompts: [
        'What are the key features? List at least 3 important aspects.',
        'For each feature, explain the BENEFIT: How does it help people?',
        'What makes this better than alternatives?',
        'Use bullet points or a clear list format.'
      ],
      tips: [
        'Features = what it has',
        'Benefits = what it does for you',
        'Always focus on benefits',
        'Use specific, convincing details',
        'Make it sound irresistible'
      ],
      examples: [
        '• Hours of fun for the whole family',
        '• Easy to use - no experience needed',
        '• Save time and money with...'
      ],
      minimumWords: 50,
      objectives: [
        'List key features',
        'Explain benefits',
        'Show value',
        'Build desire'
      ]
    },
    {
      id: 'call_to_action',
      name: 'Call to Action',
      description: 'Tell people what to do next',
      icon: '👉',
      prompts: [
        'What do you want people to DO? (buy, visit, call, attend, try)',
        'Create urgency: Why should they act NOW?',
        'Make it easy: Tell them exactly how to take action.',
        'Use action verbs: Buy, Visit, Call, Try, Join, Discover'
      ],
      tips: [
        'Be direct and clear',
        'Create urgency (limited time, while stocks last)',
        'Make action easy',
        'End with power and excitement'
      ],
      examples: [
        'Visit us today! Limited spots available!',
        'Call now and receive a special discount!',
        'Don\'t wait - offer ends soon!',
        'Get yours before they\'re all gone!'
      ],
      minimumWords: 30,
      objectives: [
        'Clear call to action',
        'Create urgency',
        'Make action easy',
        'Close persuasively'
      ]
    }
  ]
};

// ============================================================================
// ADVICE SHEET WRITING
// ============================================================================

export const adviceSheetStructure: WritingTypeStructure = {
  textType: 'advice',
  displayName: 'Advice Sheet',
  description: 'Give helpful, practical advice',
  overallGuidance: 'Provide clear, practical advice that helps people solve a problem or improve a situation.',
  stages: [
    {
      id: 'introduction',
      name: 'Introduction',
      description: 'Identify the problem or topic',
      icon: '🎯',
      prompts: [
        'What problem or situation are you giving advice about?',
        'Why is this advice needed? What\'s the challenge?',
        'Who is your audience? (students, parents, friends)',
        'Hook readers by showing you understand their situation.'
      ],
      tips: [
        'Show you understand the problem',
        'Be empathetic and supportive',
        'Make it relevant to your audience',
        'Set a helpful, positive tone'
      ],
      examples: [
        'Starting at a new school can feel overwhelming, but it doesn\'t have to be...',
        'Many students struggle with time management. Here\'s how to take control...',
        'If you\'re worried about exams, this advice will help you succeed...'
      ],
      minimumWords: 40,
      objectives: [
        'Identify problem/topic',
        'Show understanding',
        'Establish helpful tone',
        'Engage audience'
      ]
    },
    {
      id: 'advice_1',
      name: 'First Piece of Advice',
      description: 'Give your most important tip',
      icon: '1️⃣',
      prompts: [
        'What is your MOST important piece of advice? State it clearly.',
        'WHY is this important? Explain the benefit.',
        'HOW can they do this? Give practical steps or examples.',
        'Use clear headings: "First," "Tip 1:", "Most Importantly:"'
      ],
      tips: [
        'Be specific and practical',
        'Explain why it works',
        'Give clear steps',
        'Use positive, encouraging language',
        'Include examples if helpful'
      ],
      examples: [
        'First, create a schedule. This helps because...',
        'The most important thing is to stay organized...',
        'Start by making a list of...'
      ],
      minimumWords: 50,
      objectives: [
        'Provide clear advice',
        'Explain reasoning',
        'Give practical steps',
        'Be encouraging'
      ]
    },
    {
      id: 'advice_2',
      name: 'Second Piece of Advice',
      description: 'Add another helpful tip',
      icon: '2️⃣',
      prompts: [
        'What is your SECOND piece of advice? State it clearly.',
        'Why is this also important?',
        'What practical steps can they take?',
        'Use transition words: "Next," "Another helpful tip," "Additionally,"'
      ],
      tips: [
        'Build on your first advice',
        'Keep it practical',
        'Use examples',
        'Stay positive and supportive'
      ],
      minimumWords: 50,
      objectives: [
        'Provide additional advice',
        'Maintain practical focus',
        'Build comprehensive guidance',
        'Stay encouraging'
      ]
    },
    {
      id: 'advice_3',
      name: 'Third Piece of Advice',
      description: 'Complete your guidance',
      icon: '3️⃣',
      prompts: [
        'What is your THIRD piece of advice?',
        'How does this complete your overall guidance?',
        'What practical tips can you share?',
        'Use transition words: "Finally," "Lastly," "One more thing,"'
      ],
      tips: [
        'Complete your set of advice',
        'Tie everything together',
        'Remain practical',
        'Be supportive'
      ],
      minimumWords: 50,
      objectives: [
        'Provide final advice',
        'Complete guidance set',
        'Maintain helpful tone',
        'Prepare for conclusion'
      ]
    },
    {
      id: 'conclusion',
      name: 'Conclusion',
      description: 'Encourage and summarize',
      icon: '💪',
      prompts: [
        'Briefly summarize your main pieces of advice.',
        'Encourage your readers - remind them they can do this!',
        'What final tip or thought do you want to leave them with?',
        'End on a positive, motivating note.'
      ],
      tips: [
        'Summarize key points',
        'Be encouraging and positive',
        'Express confidence in them',
        'Leave them motivated to act'
      ],
      examples: [
        'Remember, with these tips you can...',
        'You\'ve got this! Just follow these steps and...',
        'By following this advice, you\'ll find that...'
      ],
      minimumWords: 40,
      objectives: [
        'Summarize advice',
        'Encourage readers',
        'Leave positive impression',
        'Motivate action'
      ]
    }
  ]
};

// ============================================================================
// EXPORT ALL STRUCTURES
// ============================================================================

export const allWritingStructures: Record<string, WritingTypeStructure> = {
  narrative: narrativeStructure,
  persuasive: persuasiveStructure,
  expository: expositoryStructure,
  descriptive: descriptiveStructure,
  reflective: reflectiveStructure,
  recount: recountStructure,
  advertisement: advertisementStructure,
  advice: adviceSheetStructure
};

/**
 * Get the writing structure for a specific text type
 */
export function getWritingStructure(textType: string): WritingTypeStructure | undefined {
  return allWritingStructures[textType.toLowerCase()];
}

/**
 * Get all available writing types
 */
export function getAvailableWritingTypes(): string[] {
  return Object.keys(allWritingStructures);
}
