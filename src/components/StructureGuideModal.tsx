import React from 'react';

interface StructureGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  textType: string; // Add textType prop
}

// Define the correct structures for different writing types
const STRUCTURE_GUIDES: { [key: string]: { title: string; points: string[] } } = {
  // --- Core Essay Types ---
  'Expository Writing': {
    title: 'Expository Structure (Standard Essay)',
    points: [
      'Introduction (Hook, Background, Thesis Statement)',
      'Body Paragraph 1 (Topic Sentence, Evidence, Analysis)',
      'Body Paragraph 2 (Topic Sentence, Evidence, Analysis)',
      'Body Paragraph 3 (Topic Sentence, Evidence, Analysis)',
      'Conclusion (Restate Thesis, Summarize Main Points, Concluding Statement)',
    ],
  },
  'Persuasive Writing': {
    title: 'Persuasive Structure (PEEEL)',
    points: [
      'Introduction (Hook, Background, Contention/Thesis)',
      'Body Paragraph 1 (Point, Evidence, Explanation, Elaborate, Link)',
      'Body Paragraph 2 (Point, Evidence, Explanation, Elaborate, Link)',
      'Body Paragraph 3 (Point, Evidence, Explanation, Elaborate, Link - often a counter-argument)',
      'Conclusion (Restate Contention, Summarize Points, Call to Action)',
    ],
  },
  'Narrative Writing': {
    title: 'Narrative Structure (Story Mountain)',
    points: [
      'Orientation (Introduction of characters, setting, and time)',
      'Complication (The problem or conflict is introduced)',
      'Rising Action (Events leading to the climax)',
      'Climax (The most exciting or turning point of the story)',
      'Falling Action (Events after the climax, leading to the end)',
      'Resolution (The problem is solved and the story concludes)',
    ],
  },
  'Discussion Writing': {
    title: 'Discussion Structure',
    points: [
      'Introduction (Statement of Issue, Thesis/Contention)',
      'Arguments For (Point, Evidence, Explanation)',
      'Arguments Against (Point, Evidence, Explanation)',
      'Conclusion (Summary of both sides, Personal Opinion/Recommendation)',
    ],
  },
  // --- Creative & Personal Types ---
  'Reflective Writing': {
    title: 'Reflective Structure (What, So What, Now What)',
    points: [
      'Description (What happened? Who was involved?)',
      'Feelings (What were your thoughts and feelings?)',
      'Evaluation (What was good and bad about the experience?)',
      'Analysis (What sense can you make of the situation?)',
      'Conclusion (What did you learn? What will you do next?)',
    ],
  },
  'Descriptive Writing': {
    title: 'Descriptive Structure (Focus on Sensory Detail)',
    points: [
      'Introduction (Set the scene and mood)',
      'Body Paragraph 1 (Focus on one main sensory detail/aspect - e.g., Sight)',
      'Body Paragraph 2 (Focus on a second sensory detail/aspect - e.g., Sound and Smell)',
      'Body Paragraph 3 (Focus on a third sensory detail/aspect - e.g., Touch and Taste)',
      'Conclusion (Restate the overall impression or atmosphere)',
    ],
  },
  'Recount Writing': {
    title: 'Recount Structure (Chronological Order)',
    points: [
      'Orientation (Who, What, Where, When)',
      'Event 1 (Detail the first event in the sequence)',
      'Event 2 (Detail the next event in the sequence)',
      'Event 3 (Detail the final event in the sequence)',
      'Reorientation (Concluding statement or personal comment/reflection)',
    ],
  },
  'Diary Entry': {
    title: 'Diary Entry Structure',
    points: [
      'Date and Salutation (e.g., Dear Diary,)',
      'Opening Sentence (State the main topic/event of the day)',
      'Body Paragraphs (Detail key events, thoughts, and feelings in chronological or thematic order)',
      'Closing Sentence (Summary or looking forward to tomorrow)',
      'Signature (e.g., Your name or initials)',
    ],
  },
  // --- Practical & Transactional Types ---
  'Advertisement': {
    title: 'Advertisement Structure (AIDA)',
    points: [
      'Attention (Catchy headline or image)',
      'Interest (Detail the benefits and features of the product/service)',
      'Desire (Create a strong emotional connection)',
      'Action (Clear Call to Action - e.g., Buy Now, Visit Website)',
    ],
  },
  'Advice Sheet': {
    title: 'Advice Sheet Structure',
    points: [
      'Title (Clear and engaging)',
      'Introduction (Explain the purpose and importance of the advice)',
      'Numbered/Bulleted Sections (Clear, concise advice points with explanations)',
      'Summary/Conclusion (Final encouraging words or key takeaway)',
      'Contact/Further Resources (Where to get more help)',
    ],
  },
  'Guide': {
    title: 'Guide Structure (How-To)',
    points: [
      'Title (Clearly state the goal of the guide)',
      'Introduction (What the guide will help the reader achieve)',
      'Materials/Prerequisites (What is needed to start)',
      'Step-by-Step Instructions (Clear, numbered, and concise steps)',
      'Conclusion (Final tips and troubleshooting)',
    ],
  },
  'Letter Writing': {
    title: 'Formal Letter Structure',
    points: [
      'Sender\'s Address and Date',
      'Recipient\'s Name and Address',
      'Salutation (e.g., Dear Mr/Ms [Surname])',
      'Introduction (State the purpose of the letter clearly)',
      'Body Paragraphs (Detail the main points)',
      'Conclusion (Summarize and state desired action)',
      'Sign-off (e.g., Yours sincerely,)',
      'Signature and Printed Name',
    ],
  },
  'News Report': {
    title: 'News Report Structure (Inverted Pyramid)',
    points: [
      'Headline (Clear, concise, and attention-grabbing)',
      'Lead Paragraph (The 5 W\'s: Who, What, Where, When, Why)',
      'Body Paragraphs (Detailed explanation of the events, quotes, and background)',
      'Less Important Details (Additional context or future developments)',
    ],
  },
  'Review Writing': {
    title: 'Review Structure',
    points: [
      'Title and Introduction (Name of item, brief summary, overall opinion)',
      'Summary/Description (What is it about? No spoilers)',
      'Analysis/Evaluation (Detailed discussion of strengths and weaknesses)',
      'Conclusion (Final recommendation, rating, and target audience)',
    ],
  },
  'Speech': {
    title: 'Speech Structure',
    points: [
      'Introduction (Attention-grabbing hook, clear statement of purpose/thesis)',
      'Body Point 1 (Main argument/topic with supporting evidence)',
      'Body Point 2 (Second main argument/topic with supporting evidence)',
      'Body Point 3 (Third main argument/topic with supporting evidence)',
      'Conclusion (Summary of main points, powerful final statement/call to action)',
    ],
  },
  // Fallback to Expository structure for any unhandled type
  'default': {
    title: 'General Essay Structure',
    points: [
      'Introduction (Hook, Background, Thesis)',
      'Body Paragraph 1 (Topic Sentence, Evidence, Analysis)',
      'Body Paragraph 2 (Topic Sentence, Evidence, Analysis)',
      'Body Paragraph 3 (Topic Sentence, Evidence, Analysis)',
      'Conclusion (Restate Thesis, Summarize Points, Concluding Thought)',
    ],
  },
};

export const StructureGuideModal: React.FC<StructureGuideModalProps> = ({ isOpen, onClose, textType }) => {
  if (!isOpen) return null;

  // Normalize textType to match keys, assuming the keys are exact matches to the user's list
  const structure = STRUCTURE_GUIDES[textType] || STRUCTURE_GUIDES.default;

  return (
    <div className="fixed inset-0 bg-gray-600 dark:bg-gray-900 bg-opacity-50 dark:bg-opacity-80 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border border-gray-200 dark:border-gray-700 w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white dark:bg-gray-800">
        <div className="flex justify-between items-center pb-3">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Structure Guide</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-2xl leading-none font-semibold">&times;</button>
        </div>
        <div className="mt-2 text-gray-600 dark:text-gray-300">
          <p>This guide outlines the recommended structure for a **{textType}** piece of writing.</p>
          <h4 className="font-semibold mt-4 text-gray-900 dark:text-white">{structure.title}:</h4>
          <ul className="list-disc list-inside ml-4">
            {structure.points.map((point, index) => (
              <li key={index}>{point}</li>
            ))}
          </ul>
          <p className="mt-4">You can expand this content with more detailed guides, examples, and interactive elements.</p>
        </div>
        <div className="items-center px-4 py-3">
          <button
            id="ok-btn"
            className="px-4 py-2 bg-blue-500 dark:bg-blue-600 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
            onClick={onClose}
          >
            Got it!
          </button>
        </div>
      </div>
    </div>
  );
};
