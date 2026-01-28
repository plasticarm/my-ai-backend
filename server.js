// server.js (Fixed Model Names)
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { GoogleGenAI } = require('@google/genai');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' })); 

const genAI = new GoogleGenAI({ apiKey: process.env.API_KEY });

// 1. Text Chat Endpoint
app.post('/chat', async (req, res) => {
    try {
        const { message } = req.body;
        
        // FIX: Use specific version 'gemini-1.5-flash-001' instead of generic alias
        const result = await genAI.models.generateContent({
            model: 'gemini-1.5-flash-001', 
            contents: message
        });
        
        // Handle response safely
        const text = result.response?.candidates?.[0]?.content?.parts?.[0]?.text || "No response text found.";
        res.json({ reply: text });
    } catch (error) {
        console.error("Chat Error:", error);
        // This will print the exact reason to your Render logs if it fails again
        res.status(500).json({ error: error.message });
    }
});

// 2. Image Generation Endpoint
app.post('/image', async (req, res) => {
    try {
        const { prompt } = req.body;
        console.log("Generating image for:", prompt);

        // FIX: Use the specific ID for Imagen 3
        const response = await genAI.models.generateImages({
            model: 'imagen-3.0-generate-001',
            prompt: prompt,
            config: {
                numberOfImages: 1,
                aspectRatio: '1:1'
            }
        });

        const imageBase64 = response.generatedImages?.[0]?.image?.imageBytes;
        
        if (imageBase64) {
            const imageUrl = `data:image/png;base64,${imageBase64}`;
            res.json({ imageUrl: imageUrl });
        } else {
            throw new Error("No image data returned from Google.");
        }

    } catch (error) {
        console.error("Image Gen Error:", error);
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));