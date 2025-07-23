
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import * as aiService from './services/aiService.js';

const app = express();
app.use(express.json({ limit: '2mb' })); // for base64 images

const port = process.env.PORT || 8080;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// When running the built server from dist-server, the client assets are in ../dist
const clientDistPath = path.join(__dirname, '..', 'dist');

// A helper function to wrap async route handlers and catch errors
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

// Middleware to add API keys to the request object for downstream use
const addApiKeys = (req, res, next) => {
    // In a real app, you might have more robust key management.
    // Here we pull them from environment variables on the server.
    req.apiKeys = {
      openai: process.env.OPENAI_API_KEY,
      huggingface: process.env.HF_API_TOKEN,
    };
    next();
};

app.use('/api', addApiKeys); // Apply API key middleware to all API routes

// API routes
app.post('/api/generate-story-and-images', asyncHandler(async (req, res) => {
  const { controls, currentRound, previousPartText, characters } = req.body;
  const result = await aiService.generateStoryAndImages(controls, currentRound, previousPartText, characters, req.apiKeys);
  res.json(result);
}));

app.post('/api/regenerate-image', asyncHandler(async (req, res) => {
  const { title, body, characters, style, provider } = req.body;
  const result = await aiService.regenerateImageForChapter(title, body, characters, style, provider, req.apiKeys);
  res.json(result);
}));

app.post('/api/feedback', asyncHandler(async (req, res) => {
  const { originalText, editedText, provider } = req.body;
  const result = await aiService.getWritingFeedback(originalText, editedText, provider, req.apiKeys);
  res.json(result);
}));

app.post('/api/character-image', asyncHandler(async (req, res) => {
    const { description, style, provider } = req.body;
    const result = await aiService.generateCharacterImage(description, style, provider, req.apiKeys);
    res.json(result);
}));

app.post('/api/symbolic-concept', asyncHandler(async (req, res) => {
    const { character, theme, provider } = req.body;
    const result = await aiService.generateSymbolicConcept(character, theme, provider, req.apiKeys);
    res.json(result);
}));

app.post('/api/symbolic-image', asyncHandler(async (req, res) => {
    const { concept, theme, style, provider } = req.body;
    const result = await aiService.generateSymbolicImageFromConcept(concept, theme, style, provider, req.apiKeys);
    res.json(result);
}));


// Serve static files from the client build directory
app.use(express.static(clientDistPath));

// For all other requests, serve the index.html file for client-side routing
app.get('*', (req, res) => {
  res.sendFile(path.join(clientDistPath, 'index.html'));
});

// Centralized error handler
app.use((err, req, res, next) => {
    console.error(`Unhandled error on ${req.method} ${req.path}:`, err);
    res.status(500).json({ error: err.message || 'An internal server error occurred.' });
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
