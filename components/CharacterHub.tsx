import React, { useState } from 'react';
import type { Character } from '../types';
import { CloseIcon, UserCircleIcon } from './icons';

interface CharacterHubProps {
  isOpen: boolean;
  onClose: () => void;
  characters: Character[];
  setCharacters: React.Dispatch<React.SetStateAction<Character[]>>;
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

const CharacterHub: React.FC<CharacterHubProps> = ({ isOpen, onClose, characters, setCharacters }) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newImageFile, setNewImageFile] = useState<File | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  const handleAddCharacter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newDesc || isAdding) return;
    setIsAdding(true);

    let imageData: string | undefined = undefined;
    if (newImageFile) {
        try {
            imageData = await fileToBase64(newImageFile);
        } catch (error) {
            console.error("Error converting file to base64", error);
            // Optionally show an error to the user
            setIsAdding(false);
            return;
        }
    }

    const newCharacter: Character = {
        id: `char-${Date.now()}`,
        name: newName,
        description: newDesc,
        imageData,
        representationStyle: 'portrait',
        symbolicTheme: ''
    };

    setCharacters(prev => [...prev, newCharacter]);
    
    // Reset form
    setNewName('');
    setNewDesc('');
    setNewImageFile(null);
    setShowAddForm(false);
    setIsAdding(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 z-40 flex items-center justify-center p-4" onClick={onClose}>
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto relative p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 transition">
          <CloseIcon className="w-8 h-8"/>
        </button>
        
        <div className="flex items-center gap-3 mb-6">
          <UserCircleIcon className="w-10 h-10 text-purple-600"/>
          <h1 className="text-3xl font-extrabold text-gray-800">Character Hub</h1>
        </div>

        <div className="space-y-4 mb-6">
            <h2 className="text-lg font-bold text-gray-700">Your Characters</h2>
            {characters.length === 0 ? (
                <p className="text-gray-500 italic">No characters yet. They will appear here once your story begins.</p>
            ) : (
                <ul className="space-y-3">
                    {characters.map(char => (
                        <li key={char.id} className="p-3 bg-gray-50 rounded-lg border flex gap-3 items-start">
                            <div className="w-16 h-16 bg-gray-200 rounded-md flex-shrink-0 flex items-center justify-center">
                                {char.imageData ? (
                                    <img src={`data:image/jpeg;base64,${char.imageData}`} alt={char.name} className="w-full h-full object-cover rounded-md"/>
                                ) : (
                                    <UserCircleIcon className="w-8 h-8 text-gray-400"/>
                                )}
                            </div>
                            <div>
                               <p className="font-bold text-gray-800">{char.name}</p>
                               <p className="text-sm text-gray-600">{char.description}</p>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>

        {!showAddForm ? (
            <button 
                onClick={() => setShowAddForm(true)}
                className="w-full bg-indigo-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-indigo-700 transition"
            >
                Introduce a New Character
            </button>
        ) : (
            <form onSubmit={handleAddCharacter} className="p-4 border-t space-y-4">
                <h3 className="text-lg font-bold text-gray-700">Add a New Character</h3>
                 <div>
                    <label htmlFor="charName" className="block text-sm font-medium text-gray-600 mb-1">Name</label>
                    <input type="text" id="charName" value={newName} onChange={e => setNewName(e.target.value)} required className="w-full p-2 border rounded-md" />
                </div>
                <div>
                    <label htmlFor="charDesc" className="block text-sm font-medium text-gray-600 mb-1">Visual Description</label>
                    <textarea id="charDesc" value={newDesc} onChange={e => setNewDesc(e.target.value)} required className="w-full p-2 border rounded-md" rows={3}></textarea>
                </div>
                 <div>
                    <label htmlFor="charImg" className="block text-sm font-medium text-gray-600 mb-1">Reference Image (Optional)</label>
                    <input type="file" id="charImg" accept="image/png, image/jpeg" onChange={e => setNewImageFile(e.target.files ? e.target.files[0] : null)} className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100"/>
                </div>
                <div className="flex justify-end gap-3">
                     <button type="button" onClick={() => setShowAddForm(false)} className="bg-gray-200 text-gray-700 font-bold py-2 px-4 rounded-lg hover:bg-gray-300">
                        Cancel
                    </button>
                    <button type="submit" disabled={isAdding} className="bg-indigo-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-indigo-700 disabled:bg-gray-400">
                        {isAdding ? 'Adding...' : 'Add Character'}
                    </button>
                </div>
            </form>
        )}

      </div>
    </div>
  );
};

export default CharacterHub;