import type { HierarchyPointLink, HierarchyPointNode } from 'd3-hierarchy';

export interface StoryOption {
  title: string;
  body: string;
  imageUrl: string;
}

export interface StoryPart extends StoryOption {}

export type AiProvider = 'gemini' | 'openai' | 'huggingface';

export interface ApiKeys {
    openai?: string | null;
    huggingface?: string | null;
}

export interface NarrativeControls {
  prompt: string;
  tone: string;
  genre: string;
  constraints: string;
  style: string;
  numRounds: number;
  characters: Character[];
  aiProvider: AiProvider;
}

export type GameState = 'idle' | 'loading' | 'options_ready' | 'story_complete';

export interface Character {
  id: string;
  name: string;
  description: string;
  referenceImage?: string; // base64 of user-uploaded image
  representationStyle: 'portrait' | 'symbolic';
  symbolicTheme?: string;
  symbolicConcept?: string; // AI-generated concept, e.g., "A wise owl"
  imageData?: string; // The final generated image (portrait or symbolic)
}

// For the story tree
export interface TreeNodeData {
  id: string;
  text: string;
  body: string; // Add body for editing
  imageUrl: string;
  isChosenPath: boolean;
  pathIndices: number[];
  children: TreeNodeData[];
  isEditing?: boolean; // Flag for workshop mode
  feedback?: string; // For writing coach feedback
}

export interface D3Node extends HierarchyPointNode<TreeNodeData> {}

export interface D3Link extends HierarchyPointLink<TreeNodeData> {
  source: D3Node;
  target: D3Node;
}

export interface CreativerseStory {
  id: string;
  title: string; // The initial prompt
  author: string;
  storyParts: StoryPart[];
  characters: Character[];
  controls: NarrativeControls;
  likes: number;
  isPublic: boolean;
  createdAt: string; // ISO string
  // Use the first chapter's image as the cover
  coverImageUrl: string; 
}