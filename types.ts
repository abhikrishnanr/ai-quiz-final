export enum QuizStatus {
  PREVIEW = 'PREVIEW',
  LIVE = 'LIVE',
  LOCKED = 'LOCKED',
  REVEALED = 'REVEALED'
}

export type RoundType = 'ASK_AI';
export type AskAiState = 'IDLE' | 'LISTENING' | 'PROCESSING' | 'ANSWERING' | 'COMPLETED';

export interface Question {
  id: string;
  text: string;
  roundType: RoundType;
  points: number;
  timeLimit: number;
}

export interface Team {
  id: string;
  name: string;
  score: number;
}

export interface QuizSession {
  id: string;
  currentQuestion: Question | null;
  status: QuizStatus;
  startTime?: number;
  turnStartTime?: number;
  activeTeamId: string | null;
  teams: Team[];
  askAiState: AskAiState;
  currentAskAiQuestion?: string;
  currentAskAiResponse?: string;
  askAiVerdict?: 'AI_CORRECT' | 'AI_WRONG';
  groundingUrls?: { title: string; uri: string }[];
}

export interface APIResponse<T> {
  data?: T;
  error?: string;
  status: number;
}
