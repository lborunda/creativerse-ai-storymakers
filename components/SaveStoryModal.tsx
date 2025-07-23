import React from 'react';
import { CloseIcon, BookmarkIcon } from './icons';

interface SaveStoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (isPublic: boolean) => void;
  isSaving: boolean;
}

const SaveStoryModal: React.FC<SaveStoryModalProps> = ({ isOpen, onClose, onSave, isSaving }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 z-40 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full relative p-8 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 transition">
          <CloseIcon className="w-8 h-8"/>
        </button>
        
        <BookmarkIcon className="w-16 h-16 text-indigo-500 mx-auto mb-4"/>
        <h1 className="text-3xl font-extrabold text-gray-800">Save Your Story</h1>
        <p className="mt-2 text-gray-600">Choose where to save your masterpiece. Sharing to the Creativerse lets others read, like, and remix your story!</p>

        <div className="mt-8 space-y-4">
            <button
                onClick={() => onSave(false)}
                disabled={isSaving}
                className="w-full bg-teal-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-teal-600 disabled:bg-gray-400 transition-all transform hover:scale-105"
            >
                {isSaving ? 'Saving...' : 'Save to My Stories (Private)'}
            </button>
            <button
                onClick={() => onSave(true)}
                disabled={isSaving}
                className="w-full bg-indigo-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 transition-all transform hover:scale-105"
            >
                {isSaving ? 'Sharing...' : 'Share to Creativerse (Public)'}
            </button>
        </div>
      </div>
    </div>
  );
};

export default SaveStoryModal;
