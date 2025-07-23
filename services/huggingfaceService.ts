

import type { StoryOption, NarrativeControls, Character } from '../types.js';

const HF_API_URL = 'https://api-inference.huggingface.co/models/';
const TEXT_MODEL = 'meta-llama/Meta-Llama-3-8B-Instruct';
const IMAGE_MODEL = 'stabilityai/stable-diffusion-xl-base-1.0';

// Helper to convert blob to base64
const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
        if (typeof reader.result === 'string') {
            resolve(reader.result.split(',')[1]);
        } else {
            reject(new Error("Failed to read blob as data URL"));
        }
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

// Helper to query HF API, with retry for loading models
const hfFetch = async (model: string, apiKey: string, payload: object, isImage: boolean = false): Promise<any> => {
    const response = await fetch(`${HF_API_URL}${model}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(payload)
    });

    if (response.status === 503) { // Model is loading
        await new Promise(resolve => setTimeout(resolve, 7000)); // wait and retry
        return hfFetch(model, apiKey, payload, isImage);
    }
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Hugging Face API Error (${response.status}): ${errorText}`);
    }
    return isImage ? response.blob() : response.json();
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
    const prompt = `A charming, safe-for-work, storybook illustration of a character described as: ${description}, ${style}, beautiful, high quality`;
    const blob = await hfFetch(IMAGE_MODEL, apiKey, { inputs: prompt }, true);
    return blobToBase64(blob);
};

export const generateSymbolicConcept = async (character: Character, theme: string, apiKey: string): Promise<string> => {
    // Note: HF text models do not support multi-modal input via the inference API easily. We ignore reference image here.
    const prompt = `You are a creative myth-maker. Find a symbolic representation for a character based on their description and a theme. Respond with ONLY the name of the symbol (e.g., "A wise, ancient owl with glowing eyes").\n\nTheme: "${theme}"\nCharacter Description: "${character.description}"\n\nSymbol:`;
    const response = await hfFetch(TEXT_MODEL, apiKey, {
        inputs: prompt,
        parameters: { max_new_tokens: 30, return_full_text: false }
    });
    return response[0].generated_text.trim().replace(/"/g, '').split('\n')[0];
};

export const generateSymbolicImageFromConcept = async (concept: string, theme: string, style: string, apiKey: string): Promise<string> => {
    const imagePrompt = `An abstract and symbolic masterpiece painting of "${concept}", themed around "${theme}". ${style}, expressive, artistic, high-detail, safe-for-work, award-winning art.`;
    const blob = await hfFetch(IMAGE_MODEL, apiKey, { inputs: imagePrompt }, true);
    return blobToBase64(blob);
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

    const structuredPrompt = `You are a creative storyteller. Follow the user's request.
    ${characterContext}
    Guidelines:
    - Tone: ${tone || 'neutral'}
    - Genre: ${genre || 'general'}
    - Constraints: ${constraints || 'none'}
    - Return exactly 3 story options.
    - Your response MUST be ONLY a valid JSON array of objects. Each object must have "title" (string, max 5 words) and "body" (string, 40-60 words).
    - Example Format: [{"title": "t", "body": "b"}, {"title": "t", "body": "b"}, {"title": "t", "body": "b"}]
    
    Request: ${getTaskDescription(currentRound)}
    
    JSON response:`;

    const textResponse = await hfFetch(TEXT_MODEL, apiKey, {
        inputs: structuredPrompt,
        parameters: { max_new_tokens: 500, return_full_text: false, temperature: 0.8 }
    });
    
    let storyParts: {title: string, body: string}[] = [];
    try {
        const generatedText = textResponse[0].generated_text;
        // Clean up markdown code blocks if present
        const cleanedText = generatedText.replace(/```json\n|```/g, '').trim();
        storyParts = JSON.parse(cleanedText);
        if (storyParts.length > 3) storyParts = storyParts.slice(0, 3);
    } catch (e) {
        console.error("Failed to parse JSON from Llama, retrying with a fallback.", e, textResponse[0].generated_text);
        // Fallback for when JSON fails
        return [
            { title: "AI Generation Error", body: "The open-source model failed to provide a valid story structure. You can try again or switch to a different AI provider in the settings.", imageUrl: 'https://via.placeholder.com/512/ff0000/ffffff?text=Error' }
        ];
    }

    const imagePromises = storyParts.map(async (part) => {
        const imagePrompt = `cinematic film still, ${part.title}, ${part.body}, ${style}, high quality, beautiful, high detail`;
        try {
            const blob = await hfFetch(IMAGE_MODEL, apiKey, { inputs: imagePrompt }, true);
            const b64 = await blobToBase64(blob);
            return `data:image/jpeg;base64,${b64}`;
        } catch (imgErr) {
            console.error("Hugging Face image generation failed:", imgErr);
            return 'https://via.placeholder.com/512/cccccc/969696?text=Image+Failed';
        }
    });

    const imageUrls = await Promise.all(imagePromises);

    return storyParts.map((part, index) => ({
        ...part,
        imageUrl: imageUrls[index],
    }));
};

export const regenerateImageForChapter = async (title: string, body: string, characters: Character[], style: string, apiKey: string): Promise<string> => {
    const prompt = `cinematic film still, ${title}, ${body}, ${style}, high quality, beautiful, high detail`;
    const blob = await hfFetch(IMAGE_MODEL, apiKey, { inputs: prompt }, true);
    const b64 = await blobToBase64(blob);
    return `data:image/jpeg;base64,${b64}`;
};

export const getWritingFeedback = async (originalText: string, editedText: string, apiKey: string): Promise<string> => {
    const prompt = `You are a friendly writing coach. A user edited their story. Provide brief, constructive feedback in 2-3 sentences.\n\nOriginal: "${originalText}"\n\nNew: "${editedText}"\n\nFeedback:`;
    const response = await hfFetch(TEXT_MODEL, apiKey, {
        inputs: prompt,
        parameters: { max_new_tokens: 150, return_full_text: false }
    });
    return response[0].generated_text.trim();
};