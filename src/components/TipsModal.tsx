import React from 'react';

interface TipsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TipsModal: React.FC<TipsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center pb-3">
          <h3 className="text-lg font-bold">Writing Tips</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none font-semibold">&times;</button>
        </div>
        <div className="mt-2 text-gray-600">
          <p>Here are some general writing tips to help you improve your work:</p>
          <ul className="list-disc list-inside ml-4">
            <li>**Show, Don't Tell:** Instead of saying a character is sad, describe their slumped shoulders and tear-filled eyes.</li>
            <li>**Vary Sentence Structure:** Mix short, punchy sentences with longer, more complex ones to maintain reader engagement.</li>
            <li>**Use Strong Verbs:** Replace weak verbs (e.g., "walked") with stronger, more descriptive ones (e.g., "strode," "sauntered," "trudged").</li>
            <li>**Read Aloud:** Reading your writing aloud helps you catch awkward phrasing and grammatical errors.</li>
            <li>**Outline Your Ideas:** Before you start writing, create an outline to organize your thoughts and ensure a logical flow.</li>
          </ul>
          <p className="mt-4">Explore these tips and more to enhance your writing style!</p>
        </div>
        <div className="items-center px-4 py-3">
          <button
            id="ok-btn"
            className="px-4 py-2 bg-blue-500 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300"
            onClick={onClose}
          >
            Got it!
          </button>
        </div>
      </div>
    </div>
  );
};
