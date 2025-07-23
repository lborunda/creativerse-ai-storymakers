import React from 'react';
import type { StoryOption } from '../types';

interface OptionsGridProps {
  options: StoryOption[];
  onSelect: (index: number) => void;
  round: number;
}

const OptionsGrid: React.FC<OptionsGridProps> = ({ options, onSelect, round }) => {
  return (
    <div className="py-8">
      <h2 className="text-2xl font-bold text-center mb-2 text-gray-800">Chapter {round}: Choose Your Path</h2>
      <p className="text-center text-gray-500 mb-8">Select an option to continue your adventure.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {options.map((option, index) => (
          <div
            key={index}
            className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200 transition-all duration-300 hover:shadow-xl hover:scale-105"
          >
            <img className="h-56 w-full object-cover" src={option.imageUrl} alt={`Illustration for option ${index + 1}`} />
            <div className="p-6">
              <h3 className="font-bold text-lg text-gray-900 mb-2">{option.title}</h3>
              <p className="text-gray-600 text-base mb-4 h-28 overflow-y-auto">{option.body}</p>
              <button
                onClick={() => onSelect(index)}
                className="w-full bg-teal-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-teal-600 transition-colors duration-300"
              >
                Select Option {index + 1}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OptionsGrid;
