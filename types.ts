
export enum QuizStatus {
  PREVIEW = 'PREVIEW',
  LIVE = 'LIVE',
  LOCKED = 'LOCKED',
  REVEALED = 'REVEALED'
}

export type RoundType = 'BUZZER' | 'STANDARD' | 'ASK_AI' | 'VISUAL';
export type SubmissionType = 'ANSWER' | 'PASS';
export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';
export type AskAiState = 'IDLE' | 'LISTENING' | 'PROCESSING' | 'ANSWERING' | 'JUDGING' | 'COMPLETED';

export interface Question {
  id: string;
  text: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  points: number;
  timeLimit: number;
  roundType: RoundType;
  difficulty: Difficulty;
  hint: string;
  visualUri?: string; // For image-based rounds
}

export interface Team {
  id: string;
  name: string;
  score: number;
  lastActive?: number;
}

export interface Submission {
  teamId: string;
  questionId: string;
  answer?: number;
  type: SubmissionType;
  timestamp: number;
  isCorrect?: boolean;
}

export interface QuizSession {
  id: string;
  currentQuestion: Question | null;
  status: QuizStatus;
  startTime?: number;
  turnStartTime?: number;
  activeTeamId: string | null;
  passedTeamIds: string[];
  requestedHint: boolean;
  hintVisible: boolean;
  explanationVisible: boolean;
  nextRoundType: RoundType;
  teams: Team[];
  submissions: Submission[];
  isReading?: boolean;
  
  // Ask The AI Round Specifics
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
