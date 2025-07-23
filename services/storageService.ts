import type { CreativerseStory, Character } from '../types';

const CREATIVERSE_KEY = 'creativerse_stories';

const getBaseStories = (): CreativerseStory[] => {
  // Simple placeholder images.
  const placeholderImage1 = 'https://images.unsplash.com/photo-1531306728370-e2ebd9d7bb92?q=80&w=800';
  const placeholderImage2 = 'https://images.unsplash.com/photo-1550745165-9bc0b252726a?q=80&w=800';
  const placeholderImage3 = 'https://images.unsplash.com/photo-1615715873434-e3a10953dc33?q=80&w=800';
  
  const baseCharacters1: Character[] = [{id: 'char-base-1', name: 'Leo', description: 'A young inventor with messy hair and oil-stained fingers.', representationStyle: 'portrait', symbolicTheme: ''}];
  const baseCharacters2: Character[] = [{id: 'char-base-2', name: 'Elara', description: 'A being of pure starlight, glowing gently with cosmic energy.', representationStyle: 'portrait', symbolicTheme: ''}];
  const baseCharacters3: Character[] = [{id: 'char-base-3', name: 'Detective Montgomery', description: 'A sharp detective in a trench coat, with a magnifying glass always in his pocket.', representationStyle: 'portrait', symbolicTheme: ''}];

  return [
    {
      id: 'base-1',
      title: 'The Clockwork Dragon',
      author: 'Creativerse',
      storyParts: [
        { title: 'The Discovery', body: 'In a dusty attic, a young inventor named Leo found a box of old gears and a tarnished brass heart. He worked for weeks, piecing together a magnificent creation: a small, clockwork dragon that whirred and clicked with life.', imageUrl: placeholderImage1 },
        { title: 'The First Flight', body: 'Leo wound the key in the dragon\'s side. Its wings unfolded, catching the lamplight. With a soft whirr, it leaped into the air, circling his head before zipping out the open window into the moonlit city.', imageUrl: placeholderImage1 },
      ],
      characters: baseCharacters1,
      controls: { prompt: 'The Clockwork Dragon', tone: 'whimsical', genre: 'fantasy', constraints: '', style: 'Watercolor', numRounds: 2, characters: baseCharacters1, aiProvider: 'gemini' },
      likes: 127,
      isPublic: true,
      createdAt: new Date(Date.now() - 86400000 * 3).toISOString(), // 3 days ago
      coverImageUrl: placeholderImage1,
    },
    {
      id: 'base-2',
      title: 'The Last Starseed',
      author: 'Creativerse',
      storyParts: [
        { title: 'The Landing', body: 'A single, shimmering seed drifted through the cosmos, landing on a barren, grey planet. From it sprouted Elara, a being made of starlight, with a mission to bring life to the void.', imageUrl: placeholderImage2 },
        { title: 'The First Bloom', body: 'Elara touched the dusty ground, and where her fingers grazed, vibrant, glowing flowers bloomed. The colors spread like a wave, painting the desolate landscape with life and light.', imageUrl: placeholderImage2 },
      ],
      characters: baseCharacters2,
      controls: { prompt: 'The Last Starseed', tone: 'mysterious', genre: 'sci-fi', constraints: 'The story must be hopeful.', style: 'Flat Vector', numRounds: 2, characters: baseCharacters2, aiProvider: 'gemini' },
      likes: 256,
      isPublic: true,
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString(), // 2 days ago
      coverImageUrl: placeholderImage2,
    },
     {
      id: 'base-3',
      title: 'The Detective and the Missing Recipe',
      author: 'Creativerse',
      storyParts: [
        { title: 'A Sweet Catastrophe', body: 'The annual city bake-off was in turmoil! Famed baker Mrs. Higgins\'s secret recipe for her prize-winning strawberry tart had vanished. Detective Montgomery, a man who loved puzzles more than pastries, was on the case.', imageUrl: placeholderImage3 },
        { title: 'A Crumb of a Clue', body: 'Detective Montgomery found a single, sugary crumb near the empty recipe box. It wasn\'t a strawberry crumb, but... raspberry! A rival baker was his prime suspect. The game was afoot!', imageUrl: placeholderImage3 },
      ],
      characters: baseCharacters3,
      controls: { prompt: 'The Detective and the Missing Recipe', tone: 'comedic', genre: 'detective', constraints: '', style: 'Crayon Drawing', numRounds: 2, characters: baseCharacters3, aiProvider: 'gemini' },
      likes: 98,
      isPublic: true,
      createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
      coverImageUrl: placeholderImage3,
    },
  ];
};

export const getCreativerseStories = (): CreativerseStory[] => {
  try {
    const storiesJson = localStorage.getItem(CREATIVERSE_KEY);
    if (!storiesJson) return [];
    return JSON.parse(storiesJson);
  } catch (error) {
    console.error("Failed to parse stories from localStorage", error);
    return [];
  }
};

const saveAllStories = (stories: CreativerseStory[]) => {
  localStorage.setItem(CREATIVERSE_KEY, JSON.stringify(stories));
};

export const initializeBaseStories = () => {
  const existingStories = getCreativerseStories();
  if (existingStories.length === 0) {
    saveAllStories(getBaseStories());
  }
};

export const saveStory = (story: CreativerseStory): CreativerseStory[] => {
  const stories = getCreativerseStories();
  stories.unshift(story); // Add to the beginning
  saveAllStories(stories);
  return stories;
};

export const toggleLikeStory = (storyId: string): CreativerseStory[] => {
  let stories = getCreativerseStories();
  const storyIndex = stories.findIndex(s => s.id === storyId);
  if (storyIndex > -1) {
    // For this app, we'll just increment. A real app would track user likes.
    stories[storyIndex].likes += 1;
    saveAllStories(stories);
  }
  return stories;
};