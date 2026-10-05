/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI(apiKey ? { apiKey } : {});

// Helper to try models with fallback: gemini-3.8-flash -> gemini-3.5-flash -> gemini-3.5-flash-lite -> gemini-3.1-flash-lite
async function generateWithFallback(contents: any, config?: any) {
  const models = ['gemini-3.8-flash', 'gemini-3.5-flash', 'gemini-3.5-flash-lite', 'gemini-3.1-flash-lite'];
  let lastError: any = null;
  for (const model of models) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents,
        config,
      });
      return response;
    } catch (err: any) {
      console.warn(`Model ${model} failed: ${err.message}. Trying next fallback...`);
      lastError = err;
    }
  }
  throw lastError || new Error('All Gemini models failed');
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '10mb' }));

  // API Endpoint: Analyze Food Photo
  app.post('/api/analyze-food-photo', async (req, res) => {
    try {
      const { imageBase64, mimeType } = req.body;
      if (!imageBase64) {
        return res.status(400).json({ error: 'Missing imageBase64' });
      }

      if (!apiKey) {
        return res.status(500).json({ error: 'GEMINI_API_KEY not configured on server' });
      }

      const response = await generateWithFallback(
        [
          {
            inlineData: {
              data: imageBase64,
              mimeType: mimeType || 'image/jpeg',
            },
          },
          {
            text: 'Analyze this food photo. Identify the meal type (Breakfast, Lunch, Snack, or Dinner), list the individual food items with estimated portions, calories, protein (g), carbs (g), and fat (g). Also provide total calories and confidence score (0 to 1). Return valid JSON.',
          },
        ],
        {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              meal: { type: Type.STRING },
              foods: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    estimated_portion: { type: Type.STRING },
                    calories: { type: Type.NUMBER },
                    protein_g: { type: Type.NUMBER },
                    carbs_g: { type: Type.NUMBER },
                    fat_g: { type: Type.NUMBER },
                  },
                  required: ['name', 'calories', 'protein_g', 'carbs_g', 'fat_g'],
                },
              },
              total_calories: { type: Type.NUMBER },
              confidence: { type: Type.NUMBER },
            },
            required: ['meal', 'foods', 'total_calories', 'confidence'],
          },
        }
      );

      const textResult = response.text;
      if (!textResult) {
        throw new Error('No response text from Gemini');
      }

      const parsed = JSON.parse(textResult);
      res.json(parsed);
    } catch (error: any) {
      console.error('Error analyzing food photo:', error);
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  });

  // API Endpoint: Extract Food from Text or Voice transcript
  app.post('/api/extract-food-text', async (req, res) => {
    try {
      const { text } = req.body;
      if (!text) {
        return res.status(400).json({ error: 'Missing text' });
      }

      if (!apiKey) {
        return res.status(500).json({ error: 'GEMINI_API_KEY not configured on server' });
      }

      const response = await generateWithFallback(
        [
          {
            text: `Extract food entries from the following user description. Classify each into a meal (breakfast, lunch, snack, dinner), estimate calories, protein, carbs, and fat for each item. Text: "${text}"`,
          },
        ],
        {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              entries: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    meal: { type: Type.STRING },
                    food_name: { type: Type.STRING },
                    portion: { type: Type.STRING },
                    calories: { type: Type.NUMBER },
                    protein_g: { type: Type.NUMBER },
                    carbs_g: { type: Type.NUMBER },
                    fat_g: { type: Type.NUMBER },
                  },
                  required: ['meal', 'food_name', 'calories', 'protein_g', 'carbs_g', 'fat_g'],
                },
              },
            },
            required: ['entries'],
          },
        }
      );

      const textResult = response.text;
      if (!textResult) {
        throw new Error('No response from Gemini');
      }

      const parsed = JSON.parse(textResult);
      res.json(parsed);
    } catch (error: any) {
      console.error('Error extracting food text:', error);
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  });

  // API Endpoint: Estimate Food Macros for Manual Entry
  app.post('/api/estimate-food', async (req, res) => {
    try {
      const { foodName, quantity } = req.body;
      if (!foodName) {
        return res.status(400).json({ error: 'Missing foodName' });
      }

      if (!apiKey) {
        return res.status(500).json({ error: 'GEMINI_API_KEY not configured on server' });
      }

      const response = await generateWithFallback(
        [
          {
            text: `Estimate the calories, protein (g), carbs (g), and fat (g) for this food item and quantity/portion. Food: "${foodName}", Quantity/Portion: "${quantity || '1 serving'}". Return valid JSON.`,
          },
        ],
        {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              calories: { type: Type.NUMBER },
              protein_g: { type: Type.NUMBER },
              carbs_g: { type: Type.NUMBER },
              fat_g: { type: Type.NUMBER },
            },
            required: ['calories', 'protein_g', 'carbs_g', 'fat_g'],
          },
        }
      );

      const textResult = response.text;
      if (!textResult) {
        throw new Error('No response from Gemini');
      }

      const parsed = JSON.parse(textResult);
      res.json(parsed);
    } catch (error: any) {
      console.error('Error estimating food macros:', error);
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  });

  // API Endpoint: AI Fitness Coach Chat
  app.post('/api/ai-chat', async (req, res) => {
    try {
      const { message, context } = req.body;
      if (!message) {
        return res.status(400).json({ error: 'Missing message' });
      }

      if (!apiKey) {
        return res.status(500).json({ error: 'GEMINI_API_KEY not configured on server' });
      }

      const systemInstruction = `You are Apex Coach, an expert personal fitness trainer, sports nutritionist, and exercise physiologist. 
You provide encouraging, science-backed, personalized advice on nutrition, calorie targets, weight training, muscle hypertrophy, and recovery.
Here is the user's current context data: ${JSON.stringify(context || {})}.
Be direct, helpful, and concise.`;

      const response = await generateWithFallback([
        {
          text: `${systemInstruction}\n\nUser Question: ${message}`,
        },
      ]);

      res.json({ reply: response.text || 'Keep pushing towards your goals!' });
    } catch (error: any) {
      console.error('Error in AI chat:', error);
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  });

  // Vite middleware for development
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });

  app.use(vite.middlewares);

  const port = 3000;
  app.listen(port, '0.0.0.0', () => {
    console.log(`Apex Fit server running on http://0.0.0.0:${port}`);
  });
}

startServer();
