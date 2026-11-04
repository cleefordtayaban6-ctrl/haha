import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// High body limit to handle lossless high-res screen frames (up to 4K)
app.use(express.json({ limit: '50mb' }));

// Shared Gemini Client instance
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'OmniAssist Server',
    hasApiKey: Boolean(process.env.GEMINI_API_KEY),
  });
});

// Endpoint: Convert screen capture to text & solve question
app.post('/api/generate-from-screen', async (req, res) => {
  try {
    const { imageBase64, mimeType = 'image/jpeg', promptMode = 'solve', customPrompt } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: 'Missing imageBase64 payload.' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        error: 'GEMINI_API_KEY is not configured in the environment.',
      });
    }

    // Strip data URL header if present
    const base64Clean = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '');

    const systemPrompt = `You are an elite, high-precision OCR and exam intelligence engine.
Your mission is to inspect the shared computer screen image and extract everything with flawless accuracy.

TASK 1: VERBATIM OCR
Transcribe all text on the screen verbatim. Capture headers, question statements, code snippets, mathematical notation, and every multiple-choice option (A, B, C, D, etc.). Do not truncate or summarize here.

TASK 2: INTELLIGENT PROBLEM SOLVING
If the screen shows an exam question, test problem, multiple-choice question, code bug, or quiz question:
- recommendedAnswer: State the direct, verified, and unequivocal answer immediately (e.g. "Option C: Depth-First Search" or the exact code correction).
- detectedQuestion: A concise summary of the problem question found on the screen.
- questionType: One of "multiple_choice", "coding", "math_logic", "short_answer", "reading_comprehension", or "general_text".
- explanation: Detailed, bulleted step-by-step reasoning proving why this answer is strictly correct.
- confidence: Integer rating from 50 to 100 based on certainty.
- optionsAnalysis: If multiple-choice options exist, provide a breakdown for each option with status ("Correct" or "Incorrect") and brief rationale.

${customPrompt ? `ADDITIONAL USER INSTRUCTION: ${customPrompt}` : ''}

Respond ONLY with a valid JSON object matching this structure (no surrounding markdown code fences, pure JSON):
{
  "extractedText": "Complete verbatim text transcript from the screen",
  "detectedQuestion": "Summary of identified question/problem",
  "questionType": "multiple_choice",
  "recommendedAnswer": "Direct verified solution / answer option",
  "explanation": "Step-by-step derivation or proof",
  "confidence": 98,
  "optionsAnalysis": [
    { "option": "A", "text": "Option text", "status": "Incorrect", "reason": "Reason" },
    { "option": "B", "text": "Option text", "status": "Correct", "reason": "Reason" }
  ]
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: [
        {
          inlineData: {
            mimeType,
            data: base64Clean,
          },
        },
        systemPrompt,
      ],
      config: {
        responseMimeType: 'application/json',
      },
    });

    const responseText = response.text || '{}';
    let parsedData;
    try {
      parsedData = JSON.parse(responseText);
    } catch {
      parsedData = {
        extractedText: responseText,
        detectedQuestion: 'Screen content processed',
        questionType: 'general_text',
        recommendedAnswer: 'Refer to extracted text above',
        explanation: responseText,
        confidence: 85,
        optionsAnalysis: [],
      };
    }

    return res.json({
      success: true,
      timestamp: new Date().toISOString(),
      data: parsedData,
    });
  } catch (error: any) {
    console.error('Screen generation error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to process screen image.',
    });
  }
});

// Bootstrap Vite dev server middleware or serve built static files
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
        watch: process.env.DISABLE_HMR === 'true' ? null : {},
      },
      appType: 'spa',
    });

    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[OmniAssist Server] Running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[OmniAssist Server] Failed to start:', err);
  process.exit(1);
});
