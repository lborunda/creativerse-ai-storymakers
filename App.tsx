
import React, { useState, useCallback, useEffect } from 'react';
import type { GameState, NarrativeControls, StoryOption, StoryPart, Character, CreativerseStory, ApiKeys, AiProvider } from './types';
import * as clientApi from './clientApi';
import { initializeBaseStories, saveStory } from './services/storageService';
import StoryControls from './components/StoryControls';
import OptionsGrid from './components/OptionsGrid';
import FinalStoryView from './components/FinalStoryView';
import StoryTreeView from './components/StoryTreeView';
import StoryMovieView from './components/StoryMovieView';
import LoadingView from './components/LoadingView';
import CharacterHub from './components/CharacterHub';
import SaveStoryModal from './components/SaveStoryModal';
import CreativerseView from './components/CreativerseView';
import SettingsModal from './components/SettingsModal';
import { BookOpenIcon, TreeIcon, PlayIcon, UserCircleIcon, GlobeAltIcon, BookmarkIcon, Cog6ToothIcon } from './components/icons';

const App: React.FC = () => {
  const [controls, setControls] = useState<NarrativeControls>({
    prompt: 'Baby Frida"s new sandals.',
    tone: 'whimsical',
    genre: 'adventure',
    constraints: 'The main character must be kind to others.',
    style: 'Crayon Drawing',
    numRounds: 3,
    aiProvider: 'gemini',
    characters: [
      {
        id: `char-default-${Date.now()}`,
        name: 'Baby Frida',
        description: 'A curious and adventurous toddler with magical, glowing sandals.',
        representationStyle: 'symbolic',
        symbolicTheme: 'Magic & Wonder'
      }
    ]
  });
  const [apiKeys, setApiKeys] = useState<ApiKeys>({});
  const [gameState, setGameState] = useState<GameState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const [loadingMessage, setLoadingMessage] = useState('');
  
  const [currentRound, setCurrentRound] = useState(1);
  const [storyOptions, setStoryOptions] = useState<StoryOption[]>([]);
  const [finalStoryParts, setFinalStoryParts] = useState<StoryPart[]>([]);
  
  const [activeCharacters, setActiveCharacters] = useState<Character[]>([]);
  const [allGeneratedOptions, setAllGeneratedOptions] = useState<StoryOption[][]>([]);
  const [selectedPathIndices, setSelectedPathIndices] = useState<number[]>([]);

  const [isFullStoryOpen, setIsFullStoryOpen] = useState(false);
  const [isTreeViewOpen, setIsTreeViewOpen] = useState(false);
  const [isMovieViewOpen, setIsMovieViewOpen] = useState(false);
  const [isCharacterHubOpen, setIsCharacterHubOpen] = useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isCreativerseOpen, setIsCreativerseOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [viewingStory, setViewingStory] = useState<CreativerseStory | null>(null);

  useEffect(() => {
    initializeBaseStories();
    // Load saved keys and provider from local storage on startup
    const savedOpenAIKey = localStorage.getItem('openai_api_key');
    const savedHfKey = localStorage.getItem('huggingface_api_token');
    setApiKeys({ openai: savedOpenAIKey, huggingface: savedHfKey });
    
    const savedProvider = localStorage.getItem('ai_provider') as AiProvider;
    if (savedProvider) {
        handleControlChange('aiProvider', savedProvider);
    }
  }, []);

  const handleControlChange = useCallback(<K extends keyof NarrativeControls>(
    key: K, 
    value: NarrativeControls[K]
  ) => {
    setControls(prev => ({ ...prev, [key]: value }));
    if (key === 'aiProvider') {
        localStorage.setItem('ai_provider', value as string);
    }
  }, []);

  const handleApiKeysChange = (newKeys: ApiKeys) => {
    setApiKeys(newKeys);
    if (newKeys.openai) localStorage.setItem('openai_api_key', newKeys.openai); else localStorage.removeItem('openai_api_key');
    if (newKeys.huggingface) localStorage.setItem('huggingface_api_token', newKeys.huggingface); else localStorage.removeItem('huggingface_api_token');
  };

  const clearInfoMessages = useCallback(() => {
    if (notification) setNotification(null);
    if (error) setError(null);
  }, [notification, error]);

  const resetGameState = useCallback(() => {
    setGameState('idle');
    setFinalStoryParts([]);
    setAllGeneratedOptions([]);
    setSelectedPathIndices([]);
    setActiveCharacters([]);
    setCurrentRound(1);
    setControls(prev => ({ 
      ...prev,
      prompt: 'A new adventure',
    }));
  }, []);

  const startNewStory = async () => {
    clearInfoMessages();
    setGameState('loading');
    setFinalStoryParts([]);
    setAllGeneratedOptions([]);
    setSelectedPathIndices([]);
    setActiveCharacters([]);
    setCurrentRound(1);
    
    try {
      setLoadingMessage("Generating character images...");
      
      const characterRealizationPromises = controls.characters.map(async (char) => {
        if (char.imageData) return char;

        let realizedChar: Character = { ...char };
        if (char.representationStyle === 'portrait') {
            try {
                const imageData = await clientApi.generateCharacterImage(char.description, controls.style, controls.aiProvider);
                realizedChar.imageData = imageData.startsWith('data:') ? imageData.split(',')[1] : imageData;
            } catch (imageError) {
                console.warn(`Portrait generation failed for ${char.name}. Falling back to abstract.`, imageError);
                setNotification(`Couldn't create a portrait for ${char.name}, so we made a symbolic one instead!`);
                const fallbackTheme = 'light and shadow';
                const concept = await clientApi.generateSymbolicConcept(char, fallbackTheme, controls.aiProvider);
                const imageData = await clientApi.generateSymbolicImageFromConcept(concept, fallbackTheme, controls.style, controls.aiProvider);
                realizedChar.imageData = imageData.startsWith('data:') ? imageData.split(',')[1] : imageData;
                realizedChar.symbolicConcept = concept;
            }
        } else {
            const theme = char.symbolicTheme || 'The Elements';
            const concept = await clientApi.generateSymbolicConcept(char, theme, controls.aiProvider);
            const imageData = await clientApi.generateSymbolicImageFromConcept(concept, theme, controls.style, controls.aiProvider);
            realizedChar.imageData = imageData.startsWith('data:') ? imageData.split(',')[1] : imageData;
            realizedChar.symbolicConcept = concept;
        }
        return realizedChar;
      });
      
      const generatedCharacters = await Promise.all(characterRealizationPromises);
      setActiveCharacters(generatedCharacters);
      
      setLoadingMessage("Generating story openings...");
      const options = await clientApi.generateStoryAndImages(controls, 1, null, generatedCharacters);
      setStoryOptions(options);
      setAllGeneratedOptions([options]);
      setGameState('options_ready');
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : 'An unknown error occurred.');
      setGameState('idle');
    }
  };

  const handleSelectOption = async (index: number) => {
    clearInfoMessages();
    const selectedOption = storyOptions[index];
    const newFinalParts = [...finalStoryParts, selectedOption];
    setFinalStoryParts(newFinalParts);
    
    const newSelectedIndices = [...selectedPathIndices, index];
    setSelectedPathIndices(newSelectedIndices);
    const nextRound = currentRound + 1;

    if (nextRound > controls.numRounds) {
      setGameState('story_complete');
    } else {
      setCurrentRound(nextRound);
      setGameState('loading');
      setLoadingMessage(`Generating Chapter ${nextRound}...`);
      try {
        const fullText = `${selectedOption.title} ${selectedOption.body}`;
        const options = await clientApi.generateStoryAndImages(controls, nextRound, fullText, activeCharacters);
        setStoryOptions(options);
        setAllGeneratedOptions(prev => [...prev, options]);
        setGameState('options_ready');
      } catch (e) {
        console.error(e);
        setError(e instanceof Error ? e.message : 'An unknown error occurred.');
        setGameState('story_complete');
      }
    }
  };
  
  const handleSwitchBranch = async (pathIndices: number[]) => {
      clearInfoMessages();
      setIsTreeViewOpen(false);
      setGameState('loading');

      const newAllGeneratedOptions = allGeneratedOptions.slice(0, pathIndices.length);
      
      let newFinalParts: StoryPart[] = [];
      for (let i = 0; i < pathIndices.length; i++) {
        newFinalParts.push(allGeneratedOptions[i][pathIndices[i]]);
      }

      setFinalStoryParts(newFinalParts);
      setSelectedPathIndices(pathIndices);
      setAllGeneratedOptions(newAllGeneratedOptions);

      const nextRound = newFinalParts.length + 1;
      setCurrentRound(nextRound);
      setLoadingMessage(`Generating Chapter ${nextRound}...`);
      
      if (nextRound > controls.numRounds) {
          setGameState('story_complete');
      } else {
          try {
              const branchOption = newFinalParts[newFinalParts.length - 1];
              const newText = `${branchOption.title} ${branchOption.body}`;
              const options = await clientApi.generateStoryAndImages(controls, nextRound, newText, activeCharacters);
              setStoryOptions(options);
              setAllGeneratedOptions(prev => [...prev, options]);
              setGameState('options_ready');
          } catch (e) {
              console.error(e);
              setError(e instanceof Error ? e.message : 'An unknown error occurred.');
              setGameState('story_complete');
          }
      }
  };

  const handleNodeUpdate = async (pathIndices: number[], newTitle: string, newBody: string) => {
    const newAllOptions = [...allGeneratedOptions];
    const chapterIndex = pathIndices.length - 1;
    const optionIndex = pathIndices[chapterIndex];
    
    const originalOption = newAllOptions[chapterIndex][optionIndex];
    
    originalOption.title = newTitle;
    originalOption.body = newBody;

    try {
      setError(null);
      const newImageUrl = await clientApi.regenerateImageForChapter(newTitle, newBody, activeCharacters, controls.style, controls.aiProvider);
      originalOption.imageUrl = newImageUrl;
    } catch(e) {
        console.error(e);
        setError(e instanceof Error ? e.message : 'An unknown error occurred while regenerating the image.');
    }
    
    setAllGeneratedOptions(newAllOptions);
    
    const currentPathStr = selectedPathIndices.slice(0, pathIndices.length).join('-');
    const updatedPathStr = pathIndices.join('-');
    if(currentPathStr === updatedPathStr) {
      const newFinalParts = [...finalStoryParts];
      newFinalParts[chapterIndex] = originalOption;
      setFinalStoryParts(newFinalParts);
    }
  };
  
  const handleGetFeedback = async (pathIndices: number[], newTitle: string, newBody: string) => {
      const chapterIndex = pathIndices.length - 1;
      const optionIndex = pathIndices[chapterIndex];
      const originalText = `${allGeneratedOptions[chapterIndex][optionIndex].title} ${allGeneratedOptions[chapterIndex][optionIndex].body}`;
      const newText = `${newTitle} ${newBody}`;
      const feedback = await clientApi.getWritingFeedback(originalText, newText, controls.aiProvider);

      alert(`AI Feedback: ${feedback}`);
  };

  const handleSaveStory = async (isPublic: boolean) => {
    setIsSaving(true);
    const newStory: CreativerseStory = {
        id: `story-${Date.now()}`,
        title: controls.prompt,
        author: 'You',
        storyParts: finalStoryParts,
        characters: activeCharacters,
        controls,
        likes: 0,
        isPublic,
        createdAt: new Date().toISOString(),
        coverImageUrl: finalStoryParts[0]?.imageUrl || 'https://via.placeholder.com/512'
    };
    saveStory(newStory);

    setTimeout(() => {
        setIsSaving(false);
        setIsSaveModalOpen(false);
        setNotification(`Your story has been ${isPublic ? 'shared to the Creativerse' : 'saved privately'}!`);
        resetGameState();
    }, 1000);
  };

  const handleOpenCreativerse = () => {
      clearInfoMessages();
      setIsCreativerseOpen(true);
  };

  const handleReadCreativerseStory = (story: CreativerseStory) => {
      setViewingStory(story);
      setIsFullStoryOpen(true);
      setIsCreativerseOpen(false);
  };

  const handleRemixStory = (story: CreativerseStory) => {
      setControls(story.controls);
      setIsCreativerseOpen(false);
      setNotification(`Remixing "${story.title}". Change any settings and start your new story!`);
      resetGameState();
      // Keep the controls from the remixed story
      setControls(story.controls);
  };

  const renderContent = () => {
    switch (gameState) {
      case 'loading':
        return <LoadingView message={loadingMessage} storySoFar={finalStoryParts} characters={activeCharacters} />;
      case 'options_ready':
        return <OptionsGrid options={storyOptions} onSelect={handleSelectOption} round={currentRound} />;
      case 'story_complete':
        return (
          <div className="text-center py-10 bg-white rounded-xl shadow-lg border mt-8">
            <h2 className="text-3xl font-bold text-gray-800">Your Story is Complete!</h2>
            <p className="text-gray-600 mt-2">What would you like to do next?</p>
            <div className="mt-6 flex flex-col md:flex-row gap-4 justify-center px-4">
               <button onClick={() => setIsSaveModalOpen(true)} className="flex items-center justify-center gap-2 bg-indigo-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-indigo-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-indigo-300">
                <BookmarkIcon className="w-5 h-5"/>
                Save & Finish
              </button>
              <button onClick={() => setIsTreeViewOpen(true)} className="flex items-center justify-center gap-2 bg-gray-500 text-white font-bold py-3 px-6 rounded-lg hover:bg-gray-600 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-gray-200">
                <TreeIcon className="w-5 h-5"/>
                Enter Workshop
              </button>
            </div>
             <div className="mt-4 flex flex-col md:flex-row gap-4 justify-center px-4">
               <button onClick={() => setIsMovieViewOpen(true)} className="flex items-center justify-center gap-2 bg-rose-500/90 text-white font-bold py-2 px-4 rounded-lg hover:bg-rose-500 transition-all text-sm">
                <PlayIcon className="w-4 h-4"/>
                Watch Movie
              </button>
               <button onClick={() => setIsFullStoryOpen(true)} className="flex items-center justify-center gap-2 bg-teal-500/90 text-white font-bold py-2 px-4 rounded-lg hover:bg-teal-500 transition-all text-sm">
                <BookOpenIcon className="w-4 h-4"/>
                Read Story
              </button>
            </div>
          </div>
        );
      case 'idle':
      default:
        return <StoryControls controls={controls} onControlChange={handleControlChange} onSubmit={startNewStory} onExplore={handleOpenCreativerse} isLoading={false} />;
    }
  };

  const isStoryActive = gameState !== 'idle';

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-4 md:p-8 max-w-5xl">
        <header className="text-center mb-8 relative">
          <h1 className="text-5xl font-extrabold text-gray-800 tracking-tighter">
            Creativerse
          </h1>
          <p className="text-lg text-gray-500 mt-2">Your AI-Powered Storytelling Studio</p>
           <button 
            onClick={() => setIsSettingsModalOpen(true)} 
            className="absolute top-0 right-0 p-2 text-gray-500 hover:text-indigo-600 transition-transform duration-300 hover:rotate-45"
            aria-label="Open AI Settings"
          >
            <Cog6ToothIcon className="w-8 h-8"/>
          </button>
        </header>
        
        {error && (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-md" role="alert">
                <p className="font-bold">An Error Occurred</p>
                <p>{error}</p>
            </div>
        )}
        {notification && (
            <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 mb-6 rounded-md" role="status">
                <p className="font-bold">Heads up!</p>
                <p>{notification}</p>
            </div>
        )}

        {renderContent()}

        {isStoryActive && (
          <>
            <div className="mt-8 text-center">
                <button
                    onClick={resetGameState}
                    className="bg-gray-700 text-white font-bold py-2 px-5 rounded-lg hover:bg-gray-800 transition-colors"
                >
                    Start a New Story
                </button>
            </div>
             <button
              onClick={() => setIsCharacterHubOpen(true)}
              className="fixed bottom-6 right-6 bg-purple-600 text-white rounded-full p-4 shadow-lg hover:bg-purple-700 transition transform hover:scale-110 z-30"
              aria-label="Manage Characters"
            >
              <UserCircleIcon className="w-8 h-8"/>
            </button>
          </>
        )}

        <FinalStoryView 
          isOpen={isFullStoryOpen}
          onClose={() => {
            setIsFullStoryOpen(false);
            setViewingStory(null);
          }}
          storyParts={viewingStory ? viewingStory.storyParts : finalStoryParts}
          initialPrompt={viewingStory ? viewingStory.title : controls.prompt}
        />
        
        <StoryTreeView
            isOpen={isTreeViewOpen}
            onClose={() => setIsTreeViewOpen(false)}
            allOptions={allGeneratedOptions}
            selectedIndices={selectedPathIndices}
            initialPrompt={controls.prompt}
            onSwitchBranch={handleSwitchBranch}
            onNodeUpdate={handleNodeUpdate}
            onGetFeedback={handleGetFeedback}
        />

        <StoryMovieView
            isOpen={isMovieViewOpen}
            onClose={() => setIsMovieViewOpen(false)}
            storyParts={finalStoryParts}
            initialPrompt={controls.prompt}
        />
        
        <CharacterHub
            isOpen={isCharacterHubOpen}
            onClose={() => setIsCharacterHubOpen(false)}
            characters={activeCharacters}
            setCharacters={setActiveCharacters}
        />

        <SaveStoryModal
            isOpen={isSaveModalOpen}
            onClose={() => setIsSaveModalOpen(false)}
            onSave={handleSaveStory}
            isSaving={isSaving}
        />

        <CreativerseView
            isOpen={isCreativerseOpen}
            onClose={() => setIsCreativerseOpen(false)}
            onRead={handleReadCreativerseStory}
            onRemix={handleRemixStory}
        />
        
        <SettingsModal
            isOpen={isSettingsModalOpen}
            onClose={() => setIsSettingsModalOpen(false)}
            currentProvider={controls.aiProvider}
            onProviderChange={(p) => handleControlChange('aiProvider', p)}
            apiKeys={apiKeys}
            onApiKeysChange={handleApiKeysChange}
        />

      </div>
    </div>
  );
};

export default App;
