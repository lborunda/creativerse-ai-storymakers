import type { NarrativeControls, StoryOption, Character, ApiKeys } from '../types.js';
import * as geminiService from './geminiService.js';
import * as openaiService from './openaiService.js';
import * as huggingfaceService from './huggingfaceService.js';

const getProviderServices = (provider: string) => {
    switch (provider) {
        case 'openai': return openaiService;
        case 'huggingface': return huggingfaceService;
        case 'gemini':
        default: return geminiService;
    }
};

const getKeyForProvider = (provider: string, apiKeys: ApiKeys): string | undefined => {
    switch (provider) {
        case 'openai': return apiKeys.openai;
        case 'huggingface': return apiKeys.huggingface;
        default: return undefined; // Gemini uses process.env internally
    }
};

const assertApiKey = (provider: string, apiKey: string | undefined): asserts apiKey is string => {
    if (provider !== 'gemini' && !apiKey) {
        throw new Error(`Missing API key for provider: ${provider}. Please configure it in Settings.`);
    }
};

export const generateStoryAndImages = async (
    controls: NarrativeControls,
    currentRound: number,
    previousPartText: string | null,
    characters: Character[],
    apiKeys: ApiKeys
): Promise<StoryOption[]> => {
    const service = getProviderServices(controls.aiProvider);
    const apiKey = getKeyForProvider(controls.aiProvider, apiKeys);
    assertApiKey(controls.aiProvider, apiKey);
    return service.generateStoryAndImages(controls, currentRound, previousPartText, characters, apiKey);
};

export const generateCharacterImage = async (
    description: string,
    style: string,
    provider: string,
    apiKeys: ApiKeys
): Promise<string> => {
    const service = getProviderServices(provider);
    const apiKey = getKeyForProvider(provider, apiKeys);
    assertApiKey(provider, apiKey);
    return service.generateCharacterImage(description, style, apiKey);
};

export const generateSymbolicConcept = async (
    character: Character,
    theme: string,
    provider: string,
    apiKeys: ApiKeys
): Promise<string> => {
    const service = getProviderServices(provider);
    const apiKey = getKeyForProvider(provider, apiKeys);
    assertApiKey(provider, apiKey);
    return service.generateSymbolicConcept(character, theme, apiKey);
};

export const generateSymbolicImageFromConcept = async (
    concept: string,
    theme: string,
    style: string,
    provider: string,
    apiKeys: ApiKeys
): Promise<string> => {
    const service = getProviderServices(provider);
    const apiKey = getKeyForProvider(provider, apiKeys);
    assertApiKey(provider, apiKey);
    return service.generateSymbolicImageFromConcept(concept, theme, style, apiKey);
};

export const regenerateImageForChapter = async (
    title: string,
    body: string,
    characters: Character[],
    style: string,
    provider: string,
    apiKeys: ApiKeys
): Promise<string> => {
    const service = getProviderServices(provider);
    const apiKey = getKeyForProvider(provider, apiKeys);
    assertApiKey(provider, apiKey);
    return service.regenerateImageForChapter(title, body, characters, style, apiKey);
};

export const getWritingFeedback = async (
    originalText: string,
    editedText: string,
    provider: string,
    apiKeys: ApiKeys
): Promise<string> => {
    const service = getProviderServices(provider);
    const apiKey = getKeyForProvider(provider, apiKeys);
    assertApiKey(provider, apiKey);
    return service.getWritingFeedback(originalText, editedText, apiKey);
};
