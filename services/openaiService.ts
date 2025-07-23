

import type { NarrativeControls, StoryOption, Character } from '../types.js';

const OPENAI_API_URL = 'https://api.openai.com/v1';

// Helper to safely call the API
const openaiFetch = async (endpoint: string, apiKey: string, body: object) => {
    const response = await fetch(`${OPENAI_API_URL}${endpoint}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(body)
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(`OpenAI API Error: ${error.error.message}`);
    }
    return response.json();
};

const createSafeImagePrompt = async (
  title: string,
  body: string,
  characterContext: string,
  style: string,
  apiKey: string
): Promise<string> => {
    const promptForPromptGenerator = `You are an expert at creating safe-for-work (SFW) DALL-E 3 image generation prompts. Create a single, detailed sentence for an image prompt. The image should be symbolic and abstract, focusing on objects and scenery. Do not include any people or characters. Style: ${style}. Scene context: ${characterContext}. Chapter Title: "${title}". Chapter Body: "${body}".`;
    
    const response = await openaiFetch('/chat/completions', apiKey, {
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: promptForPromptGenerator }],
        max_tokens: 150,
        temperature: 0.7
    });

    return response.choices[0].message.content.trim().replace(/"/g, '');
};

const buildCharacterContext = (characters: Character[]): string => {
  if (characters.length === 0) return "";
  const characterDescriptions = characters.map(c => {
    if (c.representationStyle === 'symbolic' && c.symbolicConcept) {
        return `${c.name} is represented symbolically as '${c.symbolicConcept}'. Their personality is: ${c.description}.`;
    }
    return `${c.name}: ${c.description}`;
  }).join('; ');

  return `The story features these characters: ${characterDescriptions}. Ensure they are represented consistently according to their descriptions or symbolic forms.`;
};

// --- Exported Service Functions ---

export const generateCharacterImage = async (description: string, style: string, apiKey: string): Promise<string> => {
    const prompt = `A charming, safe-for-work, storybook illustration of a character described as: ${description}. The image should be in a non-photorealistic ${style} style. Ensure the character is depicted in a cheerful and innocent manner. Simple background.`;
    const response = await openaiFetch('/images/generations', apiKey, {
        model: 'dall-e-3',
        prompt: prompt,
        n: 1,
        size: '1024x1024',
        response_format: 'b64_json'
    });
    return response.data[0].b64_json;
};

export const generateSymbolicConcept = async (character: Character, theme: string, apiKey: string): Promise<string> => {
    const userMessages: ({ type: "text"; text: string } | { type: "image_url"; image_url: { url: string } })[] = [
        { 
            type: "text", 
            text: `You are a creative myth-maker. Find a symbolic representation for a character based on their description and a theme. The symbol should be a single, evocative element from nature, mythology, or fantasy. Respond with ONLY the name of the symbol (e.g., "A wise, ancient owl with glowing eyes"). Theme: "${theme}". Character Description: "${character.description}". What is a fitting symbol?`
        }
    ];

    if (character.referenceImage) {
        userMessages.unshift({
            type: "image_url",
            image_url: {
              url: `data:image/jpeg;base64,${character.referenceImage}`,
            },
        });
    }

    const response = await openaiFetch('/chat/completions', apiKey, {
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: userMessages }],
        max_tokens: 50
    });
    return response.choices[0].message.content.trim().replace(/"/g, '');
};

export const generateSymbolicImageFromConcept = async (concept: string, theme: string, style: string, apiKey: string): Promise<string> => {
    const imagePrompt = `An abstract and symbolic image of "${concept}". The scene is themed around "${theme}". ${style}, expressive, artistic, high-detail, safe-for-work.`;
    const response = await openaiFetch('/images/generations', apiKey, {
        model: 'dall-e-3',
        prompt: imagePrompt,
        n: 1,
        size: '1024x1024',
        response_format: 'b64_json'
    });
    return response.data[0].b64_json;
};

export const generateStoryAndImages = async (
  controls: NarrativeControls,
  currentRound: number,
  previousPartText: string | null,
  characters: Character[],
  apiKey: string
): Promise<StoryOption[]> => {
  const { tone, genre, constraints, style, numRounds, prompt } = controls;
  const characterContext = buildCharacterContext(characters);

  const getTaskDescription = (round: number): string => {
    if (round === 1) return `Write three imaginative and distinct story openings based on this idea: "${prompt}".`;
    if (round < numRounds) return `Continue this story with three distinct and engaging next chapters: "${previousPartText}".`;
    return `Write three satisfying and distinct endings for this story, resolving the plot: "${previousPartText}".`;
  };

  const systemPrompt = `You are a creative storyteller for children. Generate content based on the user's request.
  ${characterContext}
  Guidelines:
  - Tone: ${tone || 'neutral'}
  - Genre: ${genre || 'general'}
  - Constraints: ${constraints || 'none'}
  - Return exactly 3 story options.
  - Your response must be a JSON object containing a single key "options" which is an array of objects. Each object must have "title" (string, max 5 words) and "body" (string, 40-60 words).
  - Do not include any other text or explanation outside of the JSON object.`;
  
  const userPrompt = getTaskDescription(currentRound);

  const textResponse = await openaiFetch('/chat/completions', apiKey, {
    model: "gpt-4o-mini",
    messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
    ],
    response_format: { type: "json_object" }
  });

  const storyParts: {title: string, body: string}[] = JSON.parse(textResponse.choices[0].message.content).options;

  const imagePromises = storyParts.map(async (part) => {
    const imagePrompt = await createSafeImagePrompt(part.title, part.body, characterContext, style, apiKey);
    const imageResponse = await openaiFetch('/images/generations', apiKey, {
        model: 'dall-e-3',
        prompt: imagePrompt,
        n: 1,
        size: '1024x1024',
        response_format: 'b64_json'
    });
    return `data:image/jpeg;base64,${imageResponse.data[0].b64_json}`;
  });

  const imageUrls = await Promise.all(imagePromises);

  return storyParts.map((part, index) => ({
    ...part,
    imageUrl: imageUrls[index],
  }));
};

export const regenerateImageForChapter = async (title: string, body: string, characters: Character[], style: string, apiKey: string): Promise<string> => {
    const characterContext = buildCharacterContext(characters);
    const imagePrompt = await createSafeImagePrompt(title, body, characterContext, style, apiKey);
    const response = await openaiFetch('/images/generations', apiKey, {
        model: 'dall-e-3',
        prompt: imagePrompt,
        n: 1,
        size: '1024x1024',
        response_format: 'b64_json'
    });
    return `data:image/jpeg;base64,${response.data[0].b64_json}`;
};

export const getWritingFeedback = async (originalText: string, editedText: string, apiKey: string): Promise<string> => {
    const prompt = `You are a friendly and encouraging creative writing coach. A user has edited a part of their story.
    Original text: "${originalText}"
    User's new text: "${editedText}"
    Please provide brief, constructive feedback in 2-3 sentences.`;

    const response = await openaiFetch('/chat/completions', apiKey, {
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 150
    });
    return response.choices[0].message.content.trim();
};