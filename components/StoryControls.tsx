import React from 'react';
import type { NarrativeControls } from '../types';
import { SparklesIcon, GlobeAltIcon } from './icons';
import CharacterSetup from './CharacterSetup';

interface StoryControlsProps {
  controls: NarrativeControls;
  onControlChange: <K extends keyof NarrativeControls>(key: K, value: NarrativeControls[K]) => void;
  onSubmit: () => void;
  onExplore: () => void;
  isLoading: boolean;
}

const ControlGroup: React.FC<{ label: string; htmlFor: string; children: React.ReactNode }> = ({ label, htmlFor, children }) => (
  <div className="mb-4">
    <label htmlFor={htmlFor} className="block text-sm font-medium text-gray-600 mb-1">{label}</label>
    {children}
  </div>
);

const StoryControls: React.FC<StoryControlsProps> = ({ controls, onControlChange, onSubmit, onExplore, isLoading }) => {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    onControlChange(name as keyof NarrativeControls, name === 'numRounds' ? parseInt(value) : value);
  };

  return (
    <div className="space-y-6">
       <button
        onClick={onSubmit}
        disabled={isLoading || !controls.prompt || controls.characters.length === 0}
        className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-indigo-300"
      >
        <SparklesIcon className="w-5 h-5" />
        {isLoading ? 'Generating...' : 'Start Your Story'}
      </button>

       <button
        onClick={onExplore}
        className="w-full flex items-center justify-center gap-2 bg-white border border-gray-300 text-gray-700 font-semibold py-2 px-4 rounded-lg hover:bg-gray-100 transition-colors shadow-sm"
        aria-label="Explore Creativerse"
      >
        <GlobeAltIcon className="w-5 h-5 text-indigo-500"/>
        Explore Creativerse
      </button>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Your Story Idea</h2>
        <ControlGroup label="What is your story about?" htmlFor="prompt">
            <input type="text" id="prompt" name="prompt" value={controls.prompt} onChange={handleInputChange} placeholder="A lost robot searching for its creator..." className="w-full p-2 border rounded-md bg-gray-50 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition" />
        </ControlGroup>
      </div>

      <CharacterSetup 
        characters={controls.characters}
        onCharactersChange={(newCharacters) => onControlChange('characters', newCharacters)}
        illustrationStyle={controls.style}
      />

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Narrative Design Controls</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ControlGroup label="Story Tone" htmlFor="tone">
            <select id="tone" name="tone" value={controls.tone} onChange={handleInputChange} className="w-full p-2 border rounded-md bg-gray-50 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition">
              <option value="">Default</option>
              <option value="mysterious">Mysterious</option>
              <option value="comedic">Comedic</option>
              <option value="dramatic">Dramatic</option>
              <option value="whimsical">Whimsical</option>
              <option value="educational">Educational</option>
            </select>
          </ControlGroup>
          <ControlGroup label="Genre" htmlFor="genre">
            <select id="genre" name="genre" value={controls.genre} onChange={handleInputChange} className="w-full p-2 border rounded-md bg-gray-50 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition">
              <option value="">Default</option>
              <option value="fantasy">Fantasy</option>
              <option value="detective">Detective</option>
              <option value="sci-fi">Science Fiction</option>
              <option value="adventure">Adventure</option>
              <option value="fairy-tale">Fairy Tale</option>
            </select>
          </ControlGroup>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <ControlGroup label="Number of Chapters" htmlFor="numRounds">
                <select id="numRounds" name="numRounds" value={controls.numRounds} onChange={handleInputChange} className="w-full p-2 border rounded-md bg-gray-50 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition">
                    {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
            </ControlGroup>
            <ControlGroup label="Illustration Style" htmlFor="style">
                <select id="style" name="style" value={controls.style} onChange={handleInputChange} className="w-full p-2 border rounded-md bg-gray-50 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition">
                    <option value="Crayon Drawing">Crayon Drawing</option>
                    <option value="Watercolor">Watercolor</option>
                    <option value="Flat Vector">Flat Vector</option>
                    <option value="Papercut">Papercut</option>
                </select>
            </ControlGroup>
        </div>
         <ControlGroup label="Story Constraints (e.g., must feature a dragon)" htmlFor="constraints">
            <input type="text" id="constraints" name="constraints" value={controls.constraints} onChange={handleInputChange} placeholder="e.g., must have a dragon, no violence" className="w-full p-2 border rounded-md bg-gray-50 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition" />
        </ControlGroup>
      </div>

    </div>
  );
};

export default StoryControls;