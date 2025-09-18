import React from 'react';

interface Props {
  content?: string;
  onChange?: (content: string) => void;
  placeholder?: string;
  focusMode?: boolean;
}

function WritingArea({ content = '', onChange, placeholder = 'Start writing...', focusMode = false }: Props) {
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange?.(e.target.value);
  };

  return (
    <textarea
      className={`w-full h-full p-3 rounded-lg border resize-none outline-none transition-all duration-300 ${
        focusMode ? 'bg-gray-800 text-white text-lg border-gray-600' : 'bg-white text-gray-700'
      }`}
      placeholder={placeholder}
      value={content}
      onChange={handleChange}
      style={{ minHeight: '400px' }}
    />
  );
}

export default WritingArea;