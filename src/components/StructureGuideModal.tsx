import React from 'react';

interface StructureGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StructureGuideModal: React.FC<StructureGuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border border-gray-200 dark:border-gray-700 w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white dark:bg-gray-800">
        <div className="flex justify-between items-center pb-3">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Structure Guide</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-2xl leading-none font-semibold">&times;</button>
        </div>
        <div className="mt-2 text-gray-600 dark:text-gray-300">
          <p>This is your Structure Guide content. It can include tips on essay structure, paragraph organization, etc.</p>
          <h4 className="font-semibold mt-4 text-gray-900 dark:text-white">Example Structure:</h4>
          <ul className="list-disc list-inside ml-4">
            <li>Introduction (Hook, Background, Thesis)</li>
            <li>Body Paragraph 1 (Topic Sentence, Evidence, Analysis)</li>
            <li>Body Paragraph 2 (Topic Sentence, Evidence, Analysis)</li>
            <li>Body Paragraph 3 (Topic Sentence, Evidence, Analysis)</li>
            <li>Conclusion (Restate Thesis, Summarize Points, Concluding Thought)</li>
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

