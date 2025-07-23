import React from 'react';
import type { StoryPart } from '../types';
import { CloseIcon } from './icons';

interface FinalStoryViewProps {
  isOpen: boolean;
  onClose: () => void;
  storyParts: StoryPart[];
  initialPrompt: string;
}

const FinalStoryView: React.FC<FinalStoryViewProps> = ({ isOpen, onClose, storyParts, initialPrompt }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 z-40 flex items-center justify-center p-4" onClick={onClose}>
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto relative p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 transition">
          <CloseIcon className="w-8 h-8"/>
        </button>
        
        <div className="text-center mb-8">
          <h1 className="text-4xl font-extrabold text-gray-800 tracking-tight">{initialPrompt}</h1>
          <p className="mt-2 text-lg text-gray-500">Your completed adventure!</p>
        </div>

        <div className="space-y-10">
          {storyParts.map((part, index) => (
            <div key={index} className="p-6 bg-gray-50 rounded-xl border border-gray-200">
              <h3 className="text-2xl font-bold text-indigo-600 mb-2">Chapter {index + 1}: {part.title}</h3>
              <img src={part.imageUrl} alt={`Illustration for chapter ${index + 1}`} className="w-full h-auto max-h-96 object-contain rounded-lg mb-4" />
              <p className="text-gray-700 leading-relaxed text-lg">{part.body}</p>
            </div>
          ))}
        </div>
        
        <div className="text-center mt-12">
            <p className="text-3xl font-bold text-teal-500">✨ The End ✨</p>
        </div>
      </div>
    </div>
  );
};

export default FinalStoryView;
