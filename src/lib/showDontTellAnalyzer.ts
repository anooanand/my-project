/**
 * Show Don't Tell Analyzer
 *
 * Identifies "telling" in narrative and descriptive writing and suggests "showing" alternatives
 */

export interface ShowDontTellIssue {
  original: string;
  position: { start: number; end: number };
  type: 'emotion' | 'state' | 'trait' | 'reaction';
  explanation: string;
  showingSuggestions: string[];
  example: {
    before: string;
    after: string;
  };
}

// Common "telling" patterns mapped to "showing" suggestions
const tellingPatterns = {
  emotions: {
    'was happy': {
      type: 'emotion' as const,
      suggestions: [
        'Her face lit up with a brilliant smile',
        'His eyes sparkled with joy',
        'She bounced on her toes, unable to contain her excitement',
        'A grin spread across his face'
      ],
      example: {
        before: 'Sarah was happy when she saw the gift.',
        after: 'Sarah\'s eyes widened, and a delighted squeal escaped her lips as she clutched the gift to her chest.'
      }
    },
    'was sad': {
      type: 'emotion' as const,
      suggestions: [
        'Tears welled up in her eyes',
        'His shoulders slumped as he stared at the floor',
        'She bit her lip to hold back tears',
        'He turned away, unable to meet their eyes'
      ],
      example: {
        before: 'Tom was sad about leaving.',
        after: 'Tom\'s throat tightened as he took one last look around the room, blinking rapidly to clear his blurring vision.'
      }
    },
    'was angry': {
      type: 'emotion' as const,
      suggestions: [
        'Her fists clenched at her sides',
        'His jaw tightened, a vein pulsing in his temple',
        'She glared at him, her voice dropping to an icy whisper',
        'He slammed his hand on the table'
      ],
      example: {
        before: 'Maria was angry at the decision.',
        after: 'Maria\'s face flushed crimson as she spun away, her fingernails digging into her palms.'
      }
    },
    'was scared': {
      type: 'emotion' as const,
      suggestions: [
        'His heart pounded against his ribs',
        'Her hands trembled as she reached for the door',
        'Cold sweat broke out across his forehead',
        'She froze, unable to move or breathe'
      ],
      example: {
        before: 'Jake was scared of the dark forest.',
        after: 'Jake\'s pulse thundered in his ears as he peered into the shadowy trees, every rustle making him jump.'
      }
    },
    'was nervous': {
      type: 'emotion' as const,
      suggestions: [
        'His hands shook as he adjusted his tie',
        'She fidgeted with her hair, unable to stand still',
        'Sweat beaded on his forehead despite the cool air',
        'Her stomach churned with butterflies'
      ],
      example: {
        before: 'Emma was nervous about the performance.',
        after: 'Emma\'s fingers trembled as she smoothed her costume for the tenth time, her heart racing like a drum solo.'
      }
    },
    'was excited': {
      type: 'emotion' as const,
      suggestions: [
        'She couldn\'t wipe the grin off her face',
        'He talked rapidly, words tumbling over each other',
        'Her eyes gleamed with anticipation',
        'He paced back and forth, energy radiating from every movement'
      ],
      example: {
        before: 'Alex was excited about the trip.',
        after: 'Alex couldn\'t sit still, jumping up every few minutes to check the clock, his backpack packed and ready by the door since dawn.'
      }
    },
    'felt worried': {
      type: 'emotion' as const,
      suggestions: [
        'She gnawed at her lower lip',
        'His brow furrowed as he checked his phone again',
        'She twisted the hem of her shirt between her fingers',
        'He couldn\'t focus, his mind racing through worst-case scenarios'
      ],
      example: {
        before: 'Mom felt worried when I was late.',
        after: 'Mom paced by the window, glancing at her watch every few seconds, her phone clutched tightly in her hand.'
      }
    },
    'felt guilty': {
      type: 'emotion' as const,
      suggestions: [
        'He couldn\'t meet her eyes',
        'She looked away, shame burning in her cheeks',
        'His voice dropped to barely a whisper',
        'She twisted her hands together, unable to speak'
      ],
      example: {
        before: 'David felt guilty about the lie.',
        after: 'David stared at his shoes, his face flushed, words dying in his throat as he tried to apologize.'
      }
    }
  },
  states: {
    'was tired': {
      type: 'state' as const,
      suggestions: [
        'Her eyelids drooped, threatening to close',
        'He stifled a yawn and rubbed his heavy eyes',
        'She moved sluggishly, every step an effort',
        'His head nodded forward before he jerked awake'
      ],
      example: {
        before: 'After the hike, everyone was tired.',
        after: 'After the hike, they collapsed onto the grass, chests heaving, muscles screaming with every movement.'
      }
    },
    'was cold': {
      type: 'state' as const,
      suggestions: [
        'She wrapped her arms around herself, teeth chattering',
        'His breath came out in visible puffs',
        'Goosebumps rose on her arms',
        'He shivered, pulling his coat tighter'
      ],
      example: {
        before: 'It was cold outside.',
        after: 'Frost glittered on every surface, and each breath stung his lungs with icy sharpness.'
      }
    },
    'was hot': {
      type: 'state' as const,
      suggestions: [
        'Sweat trickled down her back',
        'He wiped his damp forehead with his sleeve',
        'The air shimmered with heat waves',
        'She fanned herself, desperate for a breeze'
      ],
      example: {
        before: 'The summer day was hot.',
        after: 'The summer sun beat down mercilessly, baking the pavement until it radiated heat in visible waves.'
      }
    },
    'was hungry': {
      type: 'state' as const,
      suggestions: [
        'His stomach growled loudly',
        'She couldn\'t focus on anything but thoughts of food',
        'The aroma made his mouth water',
        'Her stomach twisted with emptiness'
      ],
      example: {
        before: 'By lunchtime, I was hungry.',
        after: 'By lunchtime, my stomach growled so loudly that others turned to look, and I could think of nothing but food.'
      }
    }
  },
  traits: {
    'was brave': {
      type: 'trait' as const,
      suggestions: [
        'Despite her trembling hands, she stepped forward',
        'He took a deep breath and pushed through his fear',
        'Her voice shook but she spoke up anyway',
        'He stood his ground, refusing to back down'
      ],
      example: {
        before: 'The soldier was brave.',
        after: 'The soldier stood firm even as explosions rocked the ground, his jaw set with determination.'
      }
    },
    'was kind': {
      type: 'trait' as const,
      suggestions: [
        'She knelt down to help the child up',
        'He gave his lunch to the hungry student',
        'She listened patiently, never interrupting',
        'He offered his jacket without being asked'
      ],
      example: {
        before: 'Mrs. Chen was kind to everyone.',
        after: 'Mrs. Chen always had a warm smile and a listening ear, remembering small details about each student\'s life.'
      }
    },
    'was mean': {
      type: 'trait' as const,
      suggestions: [
        'He shoved past without a word',
        'She laughed cruelly at his mistake',
        'He sneered at anyone who approached',
        'She deliberately tripped the other student'
      ],
      example: {
        before: 'The bully was mean.',
        after: 'The bully smirked as he knocked the books from the younger student\'s hands, not bothering to look back.'
      }
    },
    'was smart': {
      type: 'trait' as const,
      suggestions: [
        'She solved the complex equation in seconds',
        'He quickly spotted the pattern others missed',
        'She explained the concept in a way everyone understood',
        'His solution was both simple and brilliant'
      ],
      example: {
        before: 'The detective was smart.',
        after: 'The detective\'s eyes lit up as she connected the clues others had overlooked, piecing together the mystery.'
      }
    }
  },
  reactions: {
    'was surprised': {
      type: 'reaction' as const,
      suggestions: [
        'Her eyes widened and her mouth dropped open',
        'He stumbled backward, speechless',
        'She gasped, one hand flying to her mouth',
        'His eyebrows shot up in disbelief'
      ],
      example: {
        before: 'Everyone was surprised by the news.',
        after: 'Everyone froze mid-conversation, eyes wide and mouths agape as they processed the unexpected announcement.'
      }
    },
    'was confused': {
      type: 'reaction' as const,
      suggestions: [
        'He scratched his head, brow furrowed',
        'She tilted her head, eyes narrowed in thought',
        'He reread the instructions, still lost',
        'She opened her mouth to ask, then closed it, unsure'
      ],
      example: {
        before: 'The student was confused by the question.',
        after: 'The student read the question three times, each word making sense individually but the meaning escaping her entirely.'
      }
    },
    'was disappointed': {
      type: 'reaction' as const,
      suggestions: [
        'His face fell, shoulders sagging',
        'She blinked back tears, forcing a smile',
        'He sighed heavily, dreams deflating',
        'She crumpled the letter, unable to read further'
      ],
      example: {
        before: 'I was disappointed about not making the team.',
        after: 'The posted list blurred before my eyes as I scanned it three times, my name conspicuously absent. My shoulders slumped as I turned away.'
      }
    }
  }
};

/**
 * Analyze text for "telling" that should be "showing"
 */
export function analyzeShowDontTell(text: string): ShowDontTellIssue[] {
  const issues: ShowDontTellIssue[] = [];
  const lowerText = text.toLowerCase();

  // Check for all telling patterns
  Object.entries({...tellingPatterns.emotions, ...tellingPatterns.states, ...tellingPatterns.traits, ...tellingPatterns.reactions}).forEach(([pattern, data]) => {
    const regex = new RegExp(`\\b${pattern}\\b`, 'gi');
    let match;

    while ((match = regex.exec(lowerText)) !== null) {
      issues.push({
        original: match[0],
        position: { start: match.index, end: match.index + match[0].length },
        type: data.type,
        explanation: `Instead of telling readers that someone "${pattern}", show it through actions, body language, or physical reactions.`,
        showingSuggestions: data.suggestions,
        example: data.example
      });
    }
  });

  return issues;
}

/**
 * Get specific suggestions for improving a telling phrase
 */
export function getSuggestionForTelling(tellingPhrase: string): {
  suggestions: string[];
  example: { before: string; after: string };
} | null {
  const lowerPhrase = tellingPhrase.toLowerCase().trim();

  // Search all categories
  for (const category of Object.values(tellingPatterns)) {
    if (category[lowerPhrase as keyof typeof category]) {
      const data = category[lowerPhrase as keyof typeof category];
      return {
        suggestions: data.suggestions,
        example: data.example
      };
    }
  }

  return null;
}

/**
 * Calculate show/tell ratio for narrative/descriptive writing
 */
export function calculateShowTellRatio(text: string): {
  showingCount: number;
  tellingCount: number;
  ratio: number; // Higher is better (more showing)
  assessment: 'excellent' | 'good' | 'needs_improvement' | 'poor';
} {
  const issues = analyzeShowDontTell(text);
  const tellingCount = issues.length;

  // Count showing indicators (action verbs, sensory details, etc.)
  const showingIndicators = [
    'trembled', 'grinned', 'frowned', 'stammered', 'gasped', 'whispered',
    'clenched', 'slumped', 'lit up', 'sparkled', 'drooped', 'shivered',
    'wiped', 'clutched', 'bounced', 'paced', 'fumbled', 'darted'
  ];

  let showingCount = 0;
  const lowerText = text.toLowerCase();
  showingIndicators.forEach(indicator => {
    const matches = lowerText.match(new RegExp(`\\b${indicator}\\b`, 'g'));
    showingCount += matches ? matches.length : 0;
  });

  const ratio = tellingCount === 0 ? showingCount : showingCount / tellingCount;

  let assessment: 'excellent' | 'good' | 'needs_improvement' | 'poor';
  if (ratio >= 3) assessment = 'excellent';
  else if (ratio >= 1.5) assessment = 'good';
  else if (ratio >= 0.5) assessment = 'needs_improvement';
  else assessment = 'poor';

  return { showingCount, tellingCount, ratio, assessment };
}

/**
 * Generate comprehensive show-don't-tell feedback
 */
export function generateShowDontTellFeedback(text: string): {
  summary: string;
  issues: ShowDontTellIssue[];
  ratio: ReturnType<typeof calculateShowTellRatio>;
  tips: string[];
} {
  const issues = analyzeShowDontTell(text);
  const ratio = calculateShowTellRatio(text);

  let summary: string;
  if (ratio.assessment === 'excellent') {
    summary = 'Excellent! Your writing shows strong use of "showing" through actions and details rather than just "telling" readers how characters feel.';
  } else if (ratio.assessment === 'good') {
    summary = 'Good work! You\'re using "showing" techniques. Focus on replacing the remaining "telling" phrases with vivid actions and details.';
  } else if (ratio.assessment === 'needs_improvement') {
    summary = 'You have room to improve. Try showing emotions through actions, body language, and physical reactions instead of naming them directly.';
  } else {
    summary = 'Focus on "showing" rather than "telling". Instead of stating emotions or traits, show them through specific actions, dialogue, and physical details.';
  }

  const tips = [
    'Replace emotion words (happy, sad, angry) with physical reactions and body language',
    'Use specific actions to show character traits instead of naming them',
    'Include sensory details (what characters see, hear, feel, smell, taste)',
    'Show character reactions through dialogue and behavior',
    'Use strong verbs that paint a picture (whispered, trudged, glared)'
  ];

  return { summary, issues, ratio, tips };
}
