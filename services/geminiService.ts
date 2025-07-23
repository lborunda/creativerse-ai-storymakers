import { GoogleGenAI, Type } from "@google/genai";
import type { StoryOption, NarrativeControls, Character } from '../types.js';
import type { Part } from "@google/genai";

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const createSafeImagePrompt = async (
  title: string,
  body: string,
  characterContext: string,
  style: string,
): Promise<string> => {
    const promptForPromptGenerator = `
      You are an expert at creating safe-for-work (SFW) image generation prompts from story text. Your task is to generate a prompt that is symbolic and abstract, focusing entirely on objects and scenery to avoid any possibility of being flagged for safety reasons.

      **CRITICAL SAFETY RULES - MUST BE FOLLOWED:**

      1.  **ZERO CHARACTERS OR BEINGS:** The prompt MUST NOT contain any words describing people, characters, or living beings (e.g., "hero," "child," "adventurer," "figure," "silhouette," "person," "creature"). Do not even describe parts of a character (e.g., "hand," "foot").
      2.  **NO CHARACTER ACTIONS:** The prompt MUST NOT describe an action being performed by an unseen character. For example, do not say "sandals taking a step." Instead, describe the object in a static or naturally animated state, like "sandals resting on a mossy rock" or "sandals glowing softly."
      3.  **FOCUS ON ABSTRACT & SYMBOLIC SCENES:** Create a scene that represents the *theme* of the chapter. Focus on key objects, the environment, and magical effects. Think of it like a beautiful, symbolic book cover illustration, not a direct scene from the story.
      4.  **BE DESCRIPTIVE AND ARTISTIC:** Use vivid adjectives to describe the scene, objects, and atmosphere.

      **Example Transformation:**
      *   **Story Chapter:** "Frida's new sandals were magic. When she put them on, she felt light as a feather and could jump higher than ever before in her sunny garden."
      *   **BAD PROMPT (implies action):** "Magical sandals jumping high in a garden."
      *   **GOOD, ABSTRACT PROMPT:** "A pair of whimsical, glowing sandals resting on a fluffy white cloud, with sparkles trailing down towards a lush, sun-dappled garden below. ${style}."
      *   **ANOTHER GOOD, ABSTRACT PROMPT:** "An artistic close-up of intricately designed magical sandals sitting on a patch of vibrant green grass. A gentle, shimmering light emanates from them, with tiny motes of light floating upwards. ${style}."

      **TASK:**
      Based on the following story chapter and illustration style, generate one single-sentence, safe, abstract, and symbolic image prompt that follows all the rules.

      **Style:** ${style}
      **Chapter Title:** "${title}"
      **Chapter Body:** "${body}"

      Generate the prompt now.
    `;
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: promptForPromptGenerator,
    });
    return response.text.trim().replace(/"/g, ''); // Clean up quotes
};

export const generateCharacterImage = async (
  description: string,
  style: string,
  apiKey?: string
): Promise<string> => {
    const prompt = `A charming, safe-for-work, storybook illustration of a character described as: ${description}. The image should be in a non-photorealistic ${style} style. Ensure the character is depicted in a cheerful and innocent manner. Simple background.`;

    const imageResponse = await ai.models.generateImages({
        model: 'imagen-3.0-generate-002',
        prompt: prompt,
        config: {
            numberOfImages: 1,
            outputMimeType: 'image/jpeg',
            aspectRatio: '1:1',
        },
    });

    if (!imageResponse.generatedImages?.[0]?.image?.imageBytes) {
      throw new Error("Character image generation failed, possibly due to safety filters.");
    }

    return imageResponse.generatedImages[0].image.imageBytes;
};

export const generateSymbolicConcept = async (character: Character, theme: string, apiKey?: string): Promise<string> => {
    const textPrompt = `You are a creative myth-maker. Your task is to find a symbolic representation for a character based on their description (and reference image, if provided) and a theme. The symbol should be a single, evocative element from nature, mythology, or fantasy related to the theme.
    
    Respond with ONLY the name of the symbol. Be specific and descriptive.
    
    Examples:
    - If theme is "Forest" and character is wise: "A wise, ancient owl with glowing eyes"
    - If theme is "Sea" and character is playful: "A mischievous river otter juggling glowing pearls"
    - If theme is "Starlight" and character is lonely: "A single, shimmering tear-drop star"

    Theme: "${theme}"
    Character Description: "${character.description}"

    What is a fitting symbol for this character?`;
    
    const textPart: Part = { text: textPrompt };
    const contentParts: Part[] = [textPart];

    if (character.referenceImage) {
        // This assumes the base64 string does not include the data URI prefix
        const imagePart: Part = {
            inlineData: {
                mimeType: 'image/jpeg', // Assuming jpeg, could be png too.
                data: character.referenceImage,
            },
        };
        contentParts.unshift(imagePart); // Add image before text prompt
    }

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: contentParts },
    });

    return response.text.trim().replace(/"/g, '');
};

export const generateSymbolicImageFromConcept = async (
  concept: string,
  theme: string,
  style: string,
  apiKey?: string
): Promise<string> => {
  const imagePrompt = `An abstract and symbolic image of "${concept}". The scene is themed around "${theme}". ${style}, expressive, artistic, high-detail, safe-for-work.`;
  
  const imageResponse = await ai.models.generateImages({
    model: 'imagen-3.0-generate-002',
    prompt: imagePrompt,
    config: {
        numberOfImages: 1,
        outputMimeType: 'image/jpeg',
        aspectRatio: '1:1',
    },
  });

  if (!imageResponse.generatedImages?.[0]?.image?.imageBytes) {
    throw new Error("Abstract character image generation failed unexpectedly.");
  }
  
  return imageResponse.generatedImages[0].image.imageBytes;
};


const storyOptionSchema = {
    type: Type.ARRAY,
    items: {
        type: Type.OBJECT,
        properties: {
            title: {
                type: Type.STRING,
                description: "A short, bold headline for the story chapter (max 5 words)."
            },
            body: {
                type: Type.STRING,
                description: "The main paragraph of the story chapter (around 40-60 words)."
            }
        },
        required: ["title", "body"]
    }
};

const getTaskDescription = (round: number, numRounds: number, prompt: string): string => {
  if (round === 1) {
    return `Write three imaginative and distinct story openings based on this idea: "${prompt}".`;
  }
  if (round < numRounds) {
    return `Continue this story with three distinct and engaging next chapters: "${prompt}".`;
  }
  return `Write three satisfying and distinct endings for this story, resolving the plot: "${prompt}".`;
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
}

export const generateStoryAndImages = async (
  controls: NarrativeControls,
  currentRound: number,
  previousPartText: string | null,
  characters: Character[],
  apiKey?: string
): Promise<StoryOption[]> => {
  const { tone, genre, constraints, style, numRounds } = controls;

  // 1. Generate story text options
  const characterContext = buildCharacterContext(characters);
  const metaInstructions: string[] = [];
  if (tone) metaInstructions.push(`The tone should be ${tone}`);
  if (genre) metaInstructions.push(`The genre is ${genre}`);
  if (constraints) metaInstructions.push(`Follow these constraints: ${constraints}`);
  const guidelines = metaInstructions.length > 0 ? `Guidelines: ${metaInstructions.join('. ')}. ` : '';
  
  const task = getTaskDescription(currentRound, numRounds, previousPartText || controls.prompt);
  const fullPrompt = `${guidelines}${characterContext} ${task} Provide exactly 3 options, each with a title and a body.`;

  const textResponse = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: fullPrompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: storyOptionSchema,
    }
  });
  
  const responseJson = JSON.parse(textResponse.text);
  const storyParts: {title: string, body: string}[] = responseJson;

  if (!storyParts || storyParts.length === 0) {
      throw new Error("AI failed to generate story options.");
  }

  // 2. Generate an image for each text option in parallel
  const imagePromises = storyParts.map(async (part) => {
    const imagePrompt = await createSafeImagePrompt(part.title, part.body, characterContext, style);
    
    const imageResponse = await ai.models.generateImages({
        model: 'imagen-3.0-generate-002',
        prompt: imagePrompt,
        config: {
            numberOfImages: 1,
            outputMimeType: 'image/jpeg',
            aspectRatio: '1:1',
        },
    });

    if (!imageResponse.generatedImages?.[0]?.image?.imageBytes) {
      console.error("Image generation failed for prompt:", imagePrompt);
      return 'https://via.placeholder.com/512/cccccc/969696?text=Image+Failed';
    }

    const base64ImageBytes = imageResponse.generatedImages[0].image.imageBytes;
    return `data:image/jpeg;base64,${base64ImageBytes}`;
  });

  const imageUrls = await Promise.all(imagePromises);

  // 3. Combine text and images
  return storyParts.map((part, index) => ({
    title: part.title,
    body: part.body,
    imageUrl: imageUrls[index],
  }));
};

export const regenerateImageForChapter = async (
    title: string,
    body: string,
    characters: Character[],
    style: string,
    apiKey?: string
): Promise<string> => {
    const characterContext = buildCharacterContext(characters);
    const imagePrompt = await createSafeImagePrompt(title, body, characterContext, style);
    
    const imageResponse = await ai.models.generateImages({
        model: 'imagen-3.0-generate-002',
        prompt: imagePrompt,
        config: {
            numberOfImages: 1,
            outputMimeType: 'image/jpeg',
            aspectRatio: '1:1',
        },
    });

    if (!imageResponse.generatedImages?.[0]?.image?.imageBytes) {
      throw new Error("Failed to regenerate image. The prompt might have been blocked for safety reasons.");
    }
    
    return `data:image/jpeg;base64,${imageResponse.generatedImages[0].image.imageBytes}`;
}

export const getWritingFeedback = async (
    originalText: string,
    editedText: string,
    apiKey?: string
): Promise<string> => {
    const prompt = `You are a friendly and encouraging creative writing coach. A user has edited a part of their story.
    
    Original text: "${originalText}"
    User's new text: "${editedText}"
    
    Please provide brief, constructive feedback in 2-3 sentences. Praise their creativity, then offer one small suggestion to enhance their writing, perhaps related to imagery, pacing, or consistency. Frame it as a helpful tip for creative writing.`;

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt
    });

    return response.text.trim();
}