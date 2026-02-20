import { GoogleGenAI } from '@google/genai';
import { AskAiState, QuizSession, QuizStatus } from '../types';
import { QuizService } from './mockBackend';

const geminiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
const ai = geminiKey ? new GoogleGenAI({ apiKey: geminiKey }) : null;

export const STORAGE_KEY_TTS = 'DUK_TTS_CACHE_GEMINI_V3';
export const STORAGE_KEY_TRANSCRIPTS = 'DUK_TRANSCRIPTS_CACHE_V1';

const ELEVENLABS_BASE_URL = process.env.ELEVENLABS_BASE_URL || 'https://api.elevenlabs.io';
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const ELEVENLABS_VOICE_ID = process.env.ELEVENLABS_VOICE_ID;
const ELEVENLABS_MODEL_ID = process.env.ELEVENLABS_MODEL_ID || 'eleven_flash_v2_5';
const ELEVENLABS_OUTPUT_FORMAT = process.env.ELEVENLABS_OUTPUT_FORMAT || 'mp3_44100_128';

const getPersistentCache = (): Record<string, string> => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY_TTS) || '{}');
  } catch {
    return {};
  }
};

const saveToPersistentCache = (key: string, base64: string) => {
  const cache = getPersistentCache();
  cache[key] = base64;
  localStorage.setItem(STORAGE_KEY_TTS, JSON.stringify(cache));
};

const getTranscriptCache = (): Record<string, string> => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY_TRANSCRIPTS) || '{}');
  } catch {
    return {};
  }
};

const saveTranscriptCache = (key: string, value: string) => {
  const cache = getTranscriptCache();
  cache[key] = value;
  localStorage.setItem(STORAGE_KEY_TRANSCRIPTS, JSON.stringify(cache));
};

const toBase64 = async (blob: Blob): Promise<string> => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onloadend = () => {
    const result = reader.result?.toString() || '';
    resolve(result.split(',')[1] || '');
  };
  reader.onerror = reject;
  reader.readAsDataURL(blob);
});

export const API = {
  fetchSession: async (): Promise<QuizSession> => QuizService.getSession(),
  updateSessionStatus: async (status: QuizStatus): Promise<QuizSession> => QuizService.updateStatus(status),
  resetSession: async (): Promise<QuizSession> => QuizService.resetSession(),
  setActiveTeam: async (teamId: string): Promise<QuizSession> => QuizService.setActiveTeam(teamId),
  setAskAiState: async (state: AskAiState): Promise<QuizSession> => QuizService.setAskAiState(state),
  judgeAskAi: async (verdict: 'AI_CORRECT' | 'AI_WRONG'): Promise<QuizSession> => QuizService.judgeAskAi(verdict),
  purgeLocalStorage: async (): Promise<QuizSession> => {
    localStorage.removeItem(STORAGE_KEY_TTS);
    localStorage.removeItem(STORAGE_KEY_TRANSCRIPTS);
    return QuizService.purgeLocalState();
  },

  getTTSAudio: async (text: string): Promise<string | undefined> => {
    if (!ELEVENLABS_API_KEY || !ELEVENLABS_VOICE_ID) return undefined;
    const cacheKey = text.trim().toLowerCase();
    const cache = getPersistentCache();
    if (cache[cacheKey]) return cache[cacheKey];

    try {
      const response = await fetch(`${ELEVENLABS_BASE_URL}/v1/text-to-speech/${ELEVENLABS_VOICE_ID}?output_format=${ELEVENLABS_OUTPUT_FORMAT}`, {
        method: 'POST',
        headers: {
          'xi-api-key': ELEVENLABS_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: text.slice(0, 600),
          model_id: ELEVENLABS_MODEL_ID,
        }),
      });

      if (!response.ok) return undefined;
      const buffer = await response.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      let binary = '';
      for (let i = 0; i < bytes.byteLength; i += 1) {
        binary += String.fromCharCode(bytes[i]);
      }
      const base64 = btoa(binary);
      const audioDataUrl = `data:audio/mpeg;base64,${base64}`;
      saveToPersistentCache(cacheKey, audioDataUrl);
      return audioDataUrl;
    } catch {
      return undefined;
    }
  },

  transcribeMicAudio: async (audioBlob: Blob): Promise<string | undefined> => {
    if (!ai) return undefined;
    try {
      const base64Audio = await toBase64(audioBlob);
      const cacheKey = base64Audio.slice(0, 120);
      const transcriptCache = getTranscriptCache();
      if (transcriptCache[cacheKey]) return transcriptCache[cacheKey];

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          {
            role: 'user',
            parts: [
              { text: 'Transcribe this short quiz question audio accurately in plain English only.' },
              { inlineData: { mimeType: audioBlob.type || 'audio/webm', data: base64Audio } },
            ],
          },
        ],
      });

      const text = (response.text || '').trim();
      if (!text) return undefined;
      saveTranscriptCache(cacheKey, text);
      return text;
    } catch {
      return undefined;
    }
  },

  submitAskAiQuestion: async (questionText: string): Promise<QuizSession> => {
    const cleanQuestion = questionText.trim();
    await QuizService.setAskAiState('PROCESSING', { question: cleanQuestion });
    return API.generateAskAiResponse(cleanQuestion);
  },

  generateAskAiResponse: async (userQuestion: string): Promise<QuizSession> => {
    if (!ai) {
      return QuizService.setAskAiState('ANSWERING', {
        response: 'AI key is not configured. Please set GEMINI_API_KEY.',
        links: [],
      });
    }

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `User question: "${userQuestion}"`,
        config: {
          tools: [{ googleSearch: {} }],
          systemInstruction: `You are an AI quiz host.
First classify if question is in quiz domains: science, technology, AI, mathematics, history, geography, current affairs, or general knowledge.
If outside domain, reply exactly: "This question is outside quiz domains. Ask a quiz-domain question."
If in-domain, answer in one sentence under 35 words and be factual.
Keep tone concise and suitable for an on-stage quiz.`,
        },
      });

      const aiText = response.text || 'I could not generate a response.';
      const links = (response.candidates?.[0]?.groundingMetadata?.groundingChunks || [])
        .filter((chunk: any) => chunk.web?.uri)
        .map((chunk: any) => ({ title: chunk.web.title, uri: chunk.web.uri }));

      return QuizService.setAskAiState('ANSWERING', { response: aiText, links });
    } catch {
      return QuizService.setAskAiState('ANSWERING', {
        response: 'I am having trouble connecting. Please ask again.',
        links: [],
      });
    }
  },
};
