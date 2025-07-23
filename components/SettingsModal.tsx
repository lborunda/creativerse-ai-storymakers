
import React, { useState, useEffect } from 'react';
import type { AiProvider, ApiKeys } from '../types';
import { CloseIcon, Cog6ToothIcon } from './icons';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentProvider: AiProvider;
  onProviderChange: (provider: AiProvider) => void;
  apiKeys: ApiKeys;
  onApiKeysChange: (keys: ApiKeys) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, currentProvider, onProviderChange, apiKeys, onApiKeysChange }) => {
  const [localKeys, setLocalKeys] = useState<ApiKeys>({});

  useEffect(() => {
    if (isOpen) {
      setLocalKeys(apiKeys);
    }
  }, [isOpen, apiKeys]);

  const handleKeyChange = (provider: 'openai' | 'huggingface', value: string) => {
    setLocalKeys(prev => ({ ...prev, [provider]: value }));
  };

  const handleSave = () => {
    onApiKeysChange(localKeys);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full relative p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 transition">
          <CloseIcon className="w-8 h-8"/>
        </button>
        
        <div className="flex items-center gap-3 mb-6">
            <Cog6ToothIcon className="w-10 h-10 text-indigo-500"/>
            <h1 className="text-3xl font-extrabold text-gray-800">AI Settings</h1>
        </div>

        <div className="space-y-6">
            <div>
                <label htmlFor="aiProvider" className="block text-sm font-medium text-gray-700 mb-1">AI Provider Engine</label>
                <select 
                    id="aiProvider" 
                    value={currentProvider} 
                    onChange={e => onProviderChange(e.target.value as AiProvider)}
                    className="w-full p-2 border rounded-md bg-gray-50 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                >
                    <option value="gemini">Google Gemini (Default, No Key Needed)</option>
                    <option value="openai">OpenAI (GPT-4o-mini & DALL-E 3)</option>
                    <option value="huggingface">Hugging Face (Llama 3 & SDXL)</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">Select the AI model used to generate stories and images.</p>
            </div>

            {currentProvider === 'openai' && (
                <div>
                    <label htmlFor="openaiKey" className="block text-sm font-medium text-gray-700 mb-1">OpenAI API Key</label>
                    <input 
                        type="password" 
                        id="openaiKey"
                        placeholder="sk-..."
                        value={localKeys.openai || ''}
                        onChange={e => handleKeyChange('openai', e.target.value)}
                        className="w-full p-2 border rounded-md font-mono"
                    />
                </div>
            )}

            {currentProvider === 'huggingface' && (
                 <div>
                    <label htmlFor="hfKey" className="block text-sm font-medium text-gray-700 mb-1">Hugging Face API Token</label>
                    <input 
                        type="password" 
                        id="hfKey"
                        placeholder="hf_..."
                        value={localKeys.huggingface || ''}
                        onChange={e => handleKeyChange('huggingface', e.target.value)}
                        className="w-full p-2 border rounded-md font-mono"
                    />
                </div>
            )}

            <div className="p-3 bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg text-sm">
                <strong>Warning:</strong> Your API keys for OpenAI and Hugging Face are stored in your browser's local storage. Do not use this on a shared computer. The Google Gemini key is handled securely on the server.
            </div>
        </div>

        <div className="mt-8 text-right">
            <button
                onClick={handleSave}
                className="bg-indigo-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-indigo-700 transition"
            >
                Save Settings
            </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
