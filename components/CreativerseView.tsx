import React, { useState, useEffect } from 'react';
import type { CreativerseStory } from '../types';
import { getCreativerseStories, toggleLikeStory } from '../services/storageService';
import { CloseIcon, HeartIcon, BookOpenIcon, SparklesIcon } from './icons';

interface CreativerseViewProps {
  isOpen: boolean;
  onClose: () => void;
  onRead: (story: CreativerseStory) => void;
  onRemix: (story: CreativerseStory) => void;
}

const StoryCard: React.FC<{
    story: CreativerseStory,
    onLike: (id: string) => void,
    onRead: (story: CreativerseStory) => void,
    onRemix: (story: CreativerseStory) => void,
}> = ({ story, onLike, onRead, onRemix }) => {
    return (
        <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200 flex flex-col">
            <img className="h-48 w-full object-cover" src={story.coverImageUrl} alt={`Cover for ${story.title}`} />
            <div className="p-4 flex flex-col flex-grow">
                <h3 className="font-bold text-lg text-gray-900 mb-1 truncate" title={story.title}>{story.title}</h3>
                <p className="text-sm text-gray-500 mb-3">by {story.author}</p>
                <div className="flex-grow"></div>
                <div className="flex justify-between items-center mt-auto pt-3 border-t">
                    <button onClick={() => onLike(story.id)} className="flex items-center gap-1 text-red-500 hover:text-red-600 transition-transform hover:scale-110">
                        <HeartIcon filled={true} className="w-5 h-5"/>
                        <span className="font-bold text-sm">{story.likes}</span>
                    </button>
                    <div className="flex gap-2">
                        <button onClick={() => onRead(story)} className="flex items-center gap-1 text-xs px-2 py-1 rounded bg-teal-500 text-white hover:bg-teal-600">
                            <BookOpenIcon className="w-4 h-4" /> Read
                        </button>
                         <button onClick={() => onRemix(story)} className="flex items-center gap-1 text-xs px-2 py-1 rounded bg-indigo-500 text-white hover:bg-indigo-600">
                            <SparklesIcon className="w-4 h-4" /> Remix
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}


const CreativerseView: React.FC<CreativerseViewProps> = ({ isOpen, onClose, onRead, onRemix }) => {
    const [stories, setStories] = useState<CreativerseStory[]>([]);
    const [filter, setFilter] = useState<'public' | 'private'>('public');

    useEffect(() => {
        if (isOpen) {
            const allStories = getCreativerseStories();
            const filtered = allStories.filter(s => filter === 'public' ? s.isPublic : !s.isPublic);
            setStories(filtered.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
        }
    }, [isOpen, filter]);

    const handleLike = (id: string) => {
        const updatedStories = toggleLikeStory(id);
        const filtered = updatedStories.filter(s => filter === 'public' ? s.isPublic : !s.isPublic);
        setStories(filtered.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-gray-100 z-50 flex flex-col" onClick={onClose}>
            <div className="bg-white shadow-md p-4 sticky top-0 z-10 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-800">Creativerse</h1>
                    <p className="text-gray-500">Explore, read, and remix stories from the community.</p>
                </div>
                <button onClick={onClose} className="text-gray-500 hover:text-gray-800">
                    <CloseIcon className="w-8 h-8"/>
                </button>
            </div>

            <div className="p-4 bg-white border-b">
                <div className="flex justify-center space-x-1 bg-gray-200 rounded-lg p-1 max-w-sm mx-auto">
                    <button onClick={() => setFilter('public')} className={`w-full px-4 py-2 text-sm font-semibold rounded-md transition ${filter === 'public' ? 'bg-indigo-500 text-white shadow' : 'text-gray-600'}`}>
                        Public Stories
                    </button>
                     <button onClick={() => setFilter('private')} className={`w-full px-4 py-2 text-sm font-semibold rounded-md transition ${filter === 'private' ? 'bg-teal-500 text-white shadow' : 'text-gray-600'}`}>
                        My Private Stories
                    </button>
                </div>
            </div>
            
            <div className="flex-grow overflow-y-auto p-4 md:p-8" onClick={e => e.stopPropagation()}>
                {stories.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {stories.map(story => (
                            <StoryCard key={story.id} story={story} onLike={handleLike} onRead={onRead} onRemix={onRemix}/>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-16">
                        <h2 className="text-2xl font-bold text-gray-700">It's a little quiet here...</h2>
                        <p className="text-gray-500 mt-2">
                            {filter === 'public' 
                                ? "No public stories found. Why not share one of yours?" 
                                : "You haven't saved any private stories yet."}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CreativerseView;
