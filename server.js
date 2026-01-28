// server.js (Pro Version)
require('dotenv').config();
const express = require('express');
const cors = require('cors');
// We use the new Unified SDK for Image Generation support
const { GoogleGenAI } = require('@google/genai');

const app = express();
app.use(cors());
// INCREASE LIMIT: This prevents "Payload Too Large" crashes when sending long prompts
app.use(express.json({ limit: '10mb' })); 

const genAI = new GoogleGenAI({ apiKey: process.env.API_KEY });

// 1. Chat Endpoint (Text)
app.post('/chat', async (req, res) => {
    try {
        const { message } = req.body;
        // Use Gemini 1.5 Flash for fast text chat
        const result = await genAI.models.generateContent({
            model: 'gemini-1.5-flash',
            contents: message
        });
        
        // The new SDK structure is slightly different
        const text = result.response.candidates[0].content.parts[0].text;
        res.json({ reply: text });
    } catch (error) {
        console.error("Chat Error:", error);
        res.status(500).json({ error: error.message });
    }
});

// 2. Image Endpoint (Real Visuals)
app.post('/image', async (req, res) => {
    try {
        const { prompt } = req.body;
        console.log("Generating image for:", prompt);

        // Use Imagen 3 (Standard) or Gemini 2.5 Flash Image depending on access
        // 'imagen-3.0-generate-001' is the standard image model
        const response = await genAI.models.generateImages({
            model: 'imagen-3.0-generate-001',
            prompt: prompt,
            config: {
                numberOfImages: 1,
                aspectRatio: '1:1'
            }
        });

        // Get the base64 image data
        const imageBase64 = response.generatedImages[0].image.imageBytes;
        const imageUrl = `data:image/png;base64,${imageBase64}`;

        res.json({ imageUrl: imageUrl });
    } catch (error) {
        console.error("Image Gen Error:", error);
        // Fallback: If image fails, return a text description so the app doesn't break
        res.status(500).json({ error: "Image generation failed. Check API Key permissions." });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));