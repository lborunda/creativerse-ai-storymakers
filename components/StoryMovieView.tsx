import React, { useState, useEffect } from 'react';
import type { StoryPart } from '../types';
import { CloseIcon } from './icons';

interface StoryMovieViewProps {
  isOpen: boolean;
  onClose: () => void;
  storyParts: StoryPart[];
  initialPrompt: string;
}

const StoryMovieView: React.FC<StoryMovieViewProps> = ({ isOpen, onClose, storyParts, initialPrompt }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (!isOpen || isPaused || storyParts.length === 0) return;
    
    const timer = setTimeout(() => {
      setCurrentSlide((prev) => (prev + 1) % storyParts.length);
    }, 7000); // 7 seconds per slide

    return () => clearTimeout(timer);
  }, [currentSlide, storyParts.length, isOpen, isPaused]);

  useEffect(() => {
    // Reset on open
    if (isOpen) {
      setCurrentSlide(0);
      setIsPaused(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const part = storyParts[currentSlide];

  return (
    <div className="fixed inset-0 bg-black z-50 flex items-center justify-center" onClick={() => setIsPaused(!isPaused)}>
      <style>{`
        .breathing-image {
          animation: kenburns-breathing 10s ease-in-out infinite alternate;
        }
        @keyframes kenburns-breathing {
          0% {
            transform: scale(1.0) translate(0, 0);
            opacity: 0.9;
          }
          50% {
            transform: scale(1.1) translate(1%, -1%);
            opacity: 1;
          }
          100% {
            transform: scale(1.05) translate(-1%, 1%);
            opacity: 0.95;
          }
        }
        @keyframes fade-in { 0% { opacity: 0; transform: translateY(10px); } 100% { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fade-in 1s ease-out forwards; }
      `}</style>
      
      <button 
        onClick={(e) => { e.stopPropagation(); onClose(); }} 
        className="absolute top-6 right-6 text-white bg-black bg-opacity-50 rounded-full p-2 z-50 hover:bg-opacity-75 transition"
      >
        <CloseIcon className="w-8 h-8"/>
      </button>

      {part && (
        <div key={currentSlide} className="w-full h-full relative overflow-hidden">
          <img src={part.imageUrl} className="breathing-image w-full h-full object-cover" alt={part.title} />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent"></div>
          <div className="absolute bottom-0 left-0 p-8 md:p-12 text-white w-full animate-fade-in">
            <h2 className="text-3xl md:text-5xl font-bold mb-2" style={{animationDelay: '0.5s'}}>{part.title}</h2>
            <p className="text-lg md:text-xl leading-relaxed max-w-4xl" style={{animationDelay: '1s'}}>{part.body}</p>
          </div>
        </div>
      )}

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
        {storyParts.map((_, index) => (
          <button 
            key={index} 
            onClick={(e) => { e.stopPropagation(); setCurrentSlide(index); }} 
            className={`w-3 h-3 rounded-full transition-all ${index === currentSlide ? 'bg-white scale-125' : 'bg-white/50'}`}
          />
        ))}
      </div>

       <div className="absolute top-6 left-6 text-white bg-black bg-opacity-50 rounded-lg p-2 z-50 text-sm">
        {isPaused ? 'Paused' : 'Playing...'} (Click to {isPaused ? 'play' : 'pause'})
      </div>
    </div>
  );
};

export default StoryMovieView;
