
import type { StoryOption, NarrativeControls, Character } from './types';

// Helper function to make POST requests to our backend
const postApi = async (endpoint: string, body: object) => {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || `Request failed with status ${response.status}`);
  }
  return response.json();
};

export const generateStoryAndImages = async (
  controls: NarrativeControls,
  currentRound: number,
  previousPartText: string | null,
  characters: Character[]
): Promise<StoryOption[]> => {
  return postApi('/api/generate-story-and-images', {
    controls,
    currentRound,
    previousPartText,
    characters,
    provider: controls.aiProvider,
  });
};

export const regenerateImageForChapter = async (
  title: string,
  body: string,
  characters: Character[],
  style: string,
  provider: string
): Promise<string> => {
  return postApi('/api/regenerate-image', { title, body, characters, style, provider });
};

export const getWritingFeedback = async (
  originalText: string,
  editedText: string,
  provider: string
): Promise<string> => {
  return postApi('/api/feedback', { originalText, editedText, provider });
};

export const generateCharacterImage = async (
  description: string,
  style: string,
  provider: string
): Promise<string> => {
    return postApi('/api/character-image', { description, style, provider });
};

export const generateSymbolicConcept = async (
  character: Character,
  theme: string,
  provider: string
): Promise<string> => {
  return postApi('/api/symbolic-concept', { character, theme, provider });
};

export const generateSymbolicImageFromConcept = async (
  concept: string,
  theme: string,
  style: string,
  provider: string
): Promise<string> => {
  return postApi('/api/symbolic-image', { concept, theme, style, provider });
};
