// server.js (The Master Brain)
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { GoogleGenAI } = require('@google/genai');

const app = express();

// 1. SECURITY: Whitelist your apps
// Add every new app URL here so they can talk to this server
const allowedOrigins = [
  'http://localhost:5173',                   // Local Development
  'https://lumina-gallery-builder.vercel.app', // Your deployed Lumina App
  'https://die-a-log-studio.vercel.app/',    // Your deployed Die-A-Log Studio App
  // Future: 'https://my-audio-app.vercel.app'
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      // Optional: Un-comment the next line to strictly block unknown sites
      // return callback(new Error('CORS policy: Origin not allowed'), false);
    }
    return callback(null, true);
  }
}));

app.use(express.json({ limit: '10mb' })); 

const genAI = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * 2. GENERIC TEXT/JSON ENDPOINT
 * This endpoint is flexible. It lets the frontend decide:
 * - Which model to use (Flash, Pro, etc.)
 * - If it wants JSON or Text
 * - What the System Instructions are
 */
app.post('/api/google/generate', async (req, res) => {
    try {
        // Extract generic config from the frontend request
        // Default to 'gemini-1.5-flash' if frontend doesn't specify
        const { 
            contents, 
            model = 'gemini-1.5-flash', 
            config 
        } = req.body;

        console.log(`🧠 Generating with ${model}...`);

        const result = await genAI.models.generateContent({
            model: model,
            contents: contents, // Pass the full conversation or string
            config: config      // Pass systemInstruction, temperature, jsonSchema here
        });

        // Return the full result so the frontend can parse what it needs
        // (Text, function calls, usage metadata, etc.)
        res.json(result); 
        
    } catch (error) {
        console.error("Generative Error:", error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * 3. GENERIC IMAGE ENDPOINT
 * Handles aspect ratios and number of images dynamically
 */
app.post('/api/google/image', async (req, res) => {
    try {
        const { prompt, aspectRatio = '1:1', numberOfImages = 1 } = req.body;
        
        console.log(`🎨 Generating image: ${prompt}`);

        const response = await genAI.models.generateImages({
            model: 'imagen-3.0-generate-001',
            prompt: prompt,
            config: {
                numberOfImages: numberOfImages,
                aspectRatio: aspectRatio,
                // Add 'safetySettings' here if needed later
            }
        });

        // Helper: Convert raw bytes to usable Data URL immediately
        const images = response.generatedImages?.map(img => 
            `data:image/png;base64,${img.image.imageBytes}`
        ) || [];

        if (images.length > 0) {
            res.json({ images: images });
        } else {
            throw new Error("No image data returned.");
        }

    } catch (error) {
        console.error("Image Gen Error:", error);
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Master Brain running on port ${PORT}`));