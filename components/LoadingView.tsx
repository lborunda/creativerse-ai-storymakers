import React from 'react';
import type { StoryPart, Character } from '../types';
import { SparklesIcon } from './icons';

interface LoadingViewProps {
    message: string;
    storySoFar: StoryPart[];
    characters: Character[];
}

const LoadingView: React.FC<LoadingViewProps> = ({ message, storySoFar, characters }) => {
    const lastPart = storySoFar.length > 0 ? storySoFar[storySoFar.length - 1] : null;

    return (
        <div className="bg-white p-6 md:p-8 rounded-xl shadow-lg border border-gray-200 my-8">
            <div className="text-center mb-6">
                <div className="flex justify-center items-center gap-3">
                     <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                     <h2 className="text-2xl font-bold text-gray-800">{message}</h2>
                </div>
                <p className="text-gray-500 mt-2">The AI is crafting the next part of your adventure. Here's a recap...</p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6 items-start">
                {/* Story So Far Column */}
                <div className="space-y-4">
                    <h3 className="font-bold text-lg text-gray-700 border-b pb-2">Story So Far...</h3>
                    {lastPart ? (
                         <div className="p-4 bg-gray-50 rounded-lg">
                            <img src={lastPart.imageUrl} alt={lastPart.title} className="w-full h-48 object-cover rounded-md mb-3" />
                            <h4 className="font-bold text-indigo-700">Chapter {storySoFar.length}: {lastPart.title}</h4>
                            <p className="text-sm text-gray-600 line-clamp-3">{lastPart.body}</p>
                        </div>
                    ) : (
                        <p className="text-sm text-gray-500 italic">Your story is about to begin!</p>
                    )}
                </div>

                {/* Characters Column */}
                <div className="space-y-4">
                    <h3 className="font-bold text-lg text-gray-700 border-b pb-2">Characters</h3>
                    {characters.length > 0 ? (
                        <ul className="space-y-2">
                           {characters.map(char => (
                               <li key={char.id} className="p-2 bg-gray-50 rounded-lg">
                                   <p className="font-bold text-purple-700 text-sm">{char.name}</p>
                                   <p className="text-xs text-gray-600">{char.description}</p>
                               </li>
                           ))}
                        </ul>
                    ) : (
                        <p className="text-sm text-gray-500 italic">Generating your main character...</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LoadingView;
