import { GoogleGenAI, Modality } from '@google/genai';
import { AskAiState, QuizSession, QuizStatus } from '../types';
import { QuizService } from './mockBackend';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const STORAGE_KEY_TTS = 'DUK_TTS_CACHE_GEMINI_V3';

const QUIZ_DOMAIN_KEYWORDS = [
  'ai', 'artificial intelligence', 'machine learning', 'deep learning', 'neural', 'llm',
  'data science', 'computer science', 'algorithm', 'programming', 'robotics', 'cybersecurity',
  'internet', 'cloud', 'database', 'network', 'software', 'hardware', 'technology', 'tech',
  'mathematics', 'physics', 'chemistry', 'biology', 'astronomy', 'space', 'engineering',
  'history', 'geography', 'economics', 'current affairs', 'general knowledge', 'science', 'quiz'
];

const isWithinQuizDomain = (question: string): boolean => {
  const normalized = question.toLowerCase();
  return QUIZ_DOMAIN_KEYWORDS.some((keyword) => normalized.includes(keyword));
};

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

export const API = {
  fetchSession: async (): Promise<QuizSession> => QuizService.getSession(),
  updateSessionStatus: async (status: QuizStatus): Promise<QuizSession> => QuizService.updateStatus(status),
  resetSession: async (): Promise<QuizSession> => QuizService.resetSession(),
  setActiveTeam: async (teamId: string): Promise<QuizSession> => QuizService.setActiveTeam(teamId),
  setAskAiState: async (state: AskAiState): Promise<QuizSession> => QuizService.setAskAiState(state),
  judgeAskAi: async (verdict: 'AI_CORRECT' | 'AI_WRONG'): Promise<QuizSession> => QuizService.judgeAskAi(verdict),

  getTTSAudio: async (text: string): Promise<string | undefined> => {
    if (!process.env.API_KEY) return undefined;
    const cacheKey = text.trim().toLowerCase();
    const cache = getPersistentCache();
    if (cache[cacheKey]) return cache[cacheKey];

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-preview-tts',
        contents: [{ parts: [{ text: text.slice(0, 400) }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        saveToPersistentCache(cacheKey, base64Audio);
      }
      return base64Audio;
    } catch {
      return undefined;
    }
  },

  submitAskAiQuestion: async (questionText: string): Promise<QuizSession> => {
    const cleanQuestion = questionText.trim();
    await QuizService.setAskAiState('PROCESSING', { question: cleanQuestion });

    if (!isWithinQuizDomain(cleanQuestion)) {
      return QuizService.setAskAiState('ANSWERING', {
        response: 'Only quiz-domain topics are allowed. Please ask from science, technology, current affairs, or general knowledge.',
        links: [],
      });
    }

    return API.generateAskAiResponse(cleanQuestion);
  },

  generateAskAiResponse: async (userQuestion: string): Promise<QuizSession> => {
    if (!process.env.API_KEY) {
      return QuizService.setAskAiState('ANSWERING', {
        response: 'AI key is not configured. Please set API_KEY.',
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
Answer ONLY if the question is in quiz domains: science, technology, AI, mathematics, history, geography, current affairs, or general knowledge.
If outside domain, reply exactly: "This question is outside quiz domains. Ask a quiz-domain question."
Keep valid answers short: max 30 words, one sentence.`,
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
