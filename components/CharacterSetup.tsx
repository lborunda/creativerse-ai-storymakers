
import React, { useState, useRef } from 'react';
import type { Character, AiProvider } from '../types';
import { UserCircleIcon, CloseIcon, PhotoIcon, SparklesIcon } from './icons';
import * as clientApi from '../clientApi';

interface CharacterSetupProps {
  characters: Character[];
  onCharactersChange: (characters: Character[]) => void;
  illustrationStyle: string;
}

const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const result = (reader.result as string).split(',')[1];
            resolve(result);
        };
        reader.onerror = error => reject(error);
    });
};

const CharacterEditor: React.FC<{
    character: Character;
    onUpdate: (updatedCharacter: Character) => void;
    onRemove: (id: string) => void;
    illustrationStyle: string;
}> = ({ character, onUpdate, onRemove, illustrationStyle }) => {
    const [isGenerating, setIsGenerating] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleChange = (field: keyof Character, value: string) => {
        onUpdate({ ...character, [field]: value });
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            try {
                const base64Image = await fileToBase64(file);
                onUpdate({ ...character, referenceImage: base64Image });
            } catch (error) {
                console.error("Error converting file to base64", error);
                alert("Sorry, there was an error uploading your image.");
            }
        }
    };

    const handleGenerateSymbol = async () => {
        setIsGenerating(true);
        // This relies on the provider being available in localStorage, which App.tsx sets.
        const provider = localStorage.getItem('ai_provider') as AiProvider || 'gemini';
        try {
            const concept = await clientApi.generateSymbolicConcept(character, character.symbolicTheme || 'elements', provider);
            const imageData = await clientApi.generateSymbolicImageFromConcept(concept, character.symbolicTheme || 'elements', illustrationStyle, provider);
            const b64ImageData = imageData.startsWith('data:') ? imageData.split(',')[1] : imageData;
            onUpdate({ ...character, symbolicConcept: concept, imageData: b64ImageData });
        } catch (error) {
            console.error("Error generating symbol:", error);
            const message = error instanceof Error ? error.message : "An unknown error occurred.";
            alert(`Sorry, the AI couldn't generate a symbol. Please try again or adjust the description. Error: ${message}`);
        } finally {
            setIsGenerating(false);
        }
    }

    return (
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 relative space-y-3">
            <button
              onClick={() => onRemove(character.id)}
              className="absolute top-2 right-2 text-gray-400 hover:text-red-500"
              aria-label="Remove Character"
            >
                <CloseIcon className="w-4 h-4"/>
            </button>
            
            <div className="flex gap-4 items-start">
                <div className="w-24 h-24 bg-gray-200 rounded-md flex-shrink-0 flex items-center justify-center relative group">
                    {character.imageData ? (
                        <img src={`data:image/jpeg;base64,${character.imageData}`} alt={character.name} className="w-full h-full object-cover rounded-md"/>
                    ) : (
                         <UserCircleIcon className="w-12 h-12 text-gray-400"/>
                    )}
                     {character.referenceImage && !character.imageData && (
                        <img src={`data:image/jpeg;base64,${character.referenceImage}`} alt="Reference" className="w-full h-full object-cover rounded-md absolute inset-0 opacity-50"/>
                    )}
                </div>
                <div className="flex-grow space-y-2">
                    <input
                        type="text"
                        value={character.name}
                        onChange={(e) => handleChange('name', e.target.value)}
                        className="w-full p-2 border rounded-md text-sm font-bold"
                    />
                    <input
                        type="text"
                        value={character.description}
                        onChange={(e) => handleChange('description', e.target.value)}
                        className="w-full p-2 border rounded-md text-sm"
                        placeholder="Character description..."
                    />
                </div>
            </div>
            
            {character.symbolicConcept && (
                <div className="p-2 text-xs bg-purple-100 text-purple-800 rounded-md italic text-center">
                    <strong>Symbol:</strong> {character.symbolicConcept}
                </div>
            )}
            
            <div className="flex gap-2 items-center">
                 <div className="flex-grow flex gap-2 rounded-lg p-1 bg-gray-200">
                    <button 
                        onClick={() => handleChange('representationStyle', 'portrait')}
                        className={`w-full text-xs py-1 rounded-md transition ${character.representationStyle === 'portrait' ? 'bg-white shadow' : ''}`}
                    >Portrait</button>
                    <button 
                        onClick={() => handleChange('representationStyle', 'symbolic')}
                        className={`w-full text-xs py-1 rounded-md transition ${character.representationStyle === 'symbolic' ? 'bg-white shadow' : ''}`}
                    >Symbolic</button>
                 </div>
                 <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/png, image/jpeg" className="hidden" />
                 <button onClick={() => fileInputRef.current?.click()} className="p-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition" title="Upload reference photo">
                    <PhotoIcon className="w-5 h-5 text-gray-600"/>
                 </button>
            </div>

            {character.representationStyle === 'symbolic' && (
                <div className="flex gap-2">
                    <input
                        type="text"
                        placeholder="Symbolic Theme (e.g., Forest)"
                        value={character.symbolicTheme || ''}
                        onChange={(e) => handleChange('symbolicTheme', e.target.value)}
                        className="w-full p-2 border rounded-md text-sm"
                    />
                    <button onClick={handleGenerateSymbol} disabled={isGenerating || !character.symbolicTheme} className="flex items-center gap-2 bg-purple-600 text-white font-bold text-sm py-2 px-3 rounded-lg hover:bg-purple-700 disabled:bg-gray-400 transition whitespace-nowrap">
                       <SparklesIcon className="w-4 h-4"/>
                       {isGenerating ? 'Generating...' : (character.imageData ? 'Regenerate' : 'Generate Symbol')}
                    </button>
                </div>
            )}
        </div>
    );
};


const CharacterSetup: React.FC<CharacterSetupProps> = ({ characters, onCharactersChange, illustrationStyle }) => {
  const handleAddCharacter = () => {
    const newCharacter: Character = {
      id: `char-${Date.now()}`,
      name: 'New Character',
      description: 'A mysterious figure with unknown motives.',
      representationStyle: 'symbolic',
      symbolicTheme: 'Forest',
    };
    onCharactersChange([...characters, newCharacter]);
  };

  const handleUpdateCharacter = (updatedCharacter: Character) => {
    const newCharacters = characters.map(c => c.id === updatedCharacter.id ? updatedCharacter : c);
    onCharactersChange(newCharacters);
  };
  
  const handleRemoveCharacter = (id: string) => {
    if (characters.length <= 1) {
        alert("You must have at least one character.");
        return;
    }
    const newCharacters = characters.filter(c => c.id !== id);
    onCharactersChange(newCharacters);
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-800">Character Design</h2>
        <UserCircleIcon className="w-8 h-8 text-purple-500"/>
      </div>
      <div className="space-y-3">
        {characters.map(char => (
            <CharacterEditor 
                key={char.id} 
                character={char} 
                onUpdate={handleUpdateCharacter} 
                onRemove={handleRemoveCharacter}
                illustrationStyle={illustrationStyle}
            />
        ))}
      </div>
      <button
        onClick={handleAddCharacter}
        className="w-full mt-4 text-sm font-semibold text-indigo-600 border-2 border-dashed border-gray-300 rounded-lg py-2 hover:bg-indigo-50 transition"
      >
        + Add Character
      </button>
    </div>
  );
};

export default CharacterSetup;
