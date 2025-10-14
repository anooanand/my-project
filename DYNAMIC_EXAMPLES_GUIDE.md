# Dynamic Contextual Examples System

## Overview
The AI Writing Buddy now generates dynamic, contextually relevant examples based on the user's specific writing prompt and text type, replacing all hardcoded generic examples.

## How It Works

### 1. Prompt Analysis
The system extracts key elements from the writing prompt:
- **Objects**: key, chest, door, book, letter, treasure, etc.
- **Settings**: attic, library, school, forest, beach, etc.
- **Characters**: grandmother, friend, teacher, stranger, etc.
- **Actions**: found, discover, explore, unlock, investigate, etc.
- **Emotions/Tone**: mysterious, exciting, ancient, secret, etc.

### 2. Example Generation
Examples are generated based on:
- **Writing Type**: Narrative, Persuasive, Expository, Reflective, Recount
- **Writing Progress**: Opening (0 words), Development (<100 words), Climax (<200 words), Conclusion (>200 words)
- **Prompt Elements**: Combines extracted elements into natural, relevant examples

## Example Outputs

### Narrative: "A mysterious key found in grandmother's attic"
**Opening (0 words):**
- "The attic was silent except for the creaking floorboards as I noticed the key gleaming in a shaft of dusty light."
- "The mysterious key seemed to pulse with an energy I couldn't explain, drawing me closer despite my hesitation."
- "'Never touch that key,' my grandmother had warned me countless times, but now I understood why."

**Development (50 words):**
- "My fingers traced the edge of the key, and suddenly I understood what I had to do next."
- "The attic seemed different now—shadows moved in corners I'd never noticed before."

### Persuasive: "Schools should implement more technology"
**Opening:**
- "Imagine the impact we could make if we took action on technology today—the benefits would transform our community."
- "The question isn't whether we should address technology, but rather how quickly we can begin making a difference."

**Development:**
- "Research consistently demonstrates that communities investing in technology see measurable improvements."
- "Consider the alternative: if we ignore technology, we risk falling behind while others move forward."

### Expository: "How does photosynthesis work?"
**Opening:**
- "To fully understand this process, we must examine its key components, their relationships, and how they interact."
- "This process functions through a series of interconnected steps, each building upon the previous one."

### Reflective: "A time when you learned something important"
**Opening:**
- "Looking back on that experience, I can now see how profoundly it shaped my understanding of myself."
- "At the time, I didn't realize how significant that lesson would become."

### Recount: "Our excursion to the museum"
**Opening:**
- "It was early morning when the excursion began, and none of us could have predicted how extraordinary it would be."
- "As we arrived at the museum, the excitement was palpable—everyone eager to see what awaited us."

## Benefits

1. **Highly Relevant**: Examples directly reference elements from the student's actual prompt
2. **Stage-Appropriate**: Different examples for opening, development, and conclusion phases
3. **Educational**: Each example includes a description of its purpose
4. **Genre-Specific**: Examples follow conventions of the selected text type
5. **Inspiring**: Provides concrete, actionable ideas students can adapt

## Technical Implementation

### Files Modified:
- `src/lib/dynamicExampleGenerator.ts` - Core example generation logic
- `src/components/ContextualAICoachPanel.tsx` - Display dynamic examples
- `src/components/EnhancedCoachPanel.tsx` - Pass prompt to sub-components
- `src/components/EnhancedWritingLayoutNSW.tsx` - Connect prompt data

### Example Flow:
1. User selects/generates a writing prompt
2. Prompt is passed to EnhancedCoachPanel via `writingPrompt` prop
3. ContextualAICoachPanel receives the prompt
4. dynamicExampleGenerator analyzes prompt and generates 1-3 examples
5. Examples are displayed prominently in the "Examples" tab with visual distinction

## Usage for Students

1. Select or generate a writing prompt
2. Click on the "Examples" tab in the Writing Buddy panel
3. See 1-3 dynamic examples inspired by your specific prompt
4. Use these as starting points or inspiration for your writing
5. As you write, examples adapt to your progress (opening → development → conclusion)

## Future Enhancements

- AI-powered example generation using GPT for even more contextual variety
- Examples that adapt to student's skill level
- Multi-language support for examples
- Save favorite examples for reference
