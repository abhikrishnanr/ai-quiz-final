import { AskAiState, QuizSession, QuizStatus, Team } from '../types';

const STORAGE_KEY = 'DUK_QUIZ_SESSION_V2';

const DEFAULT_TEAMS: Team[] = Array.from({ length: 6 }, (_, index) => ({
  id: `t${index + 1}`,
  name: `Team ${index + 1}`,
  score: 0,
}));

const DEFAULT_SESSION: QuizSession = {
  id: 'session-ask-ai',
  currentQuestion: {
    id: 'ask-ai-main',
    text: 'Ask AI Round: Ask a quiz-domain question to the AI host.',
    roundType: 'ASK_AI',
    points: 20,
    timeLimit: 60,
  },
  status: QuizStatus.PREVIEW,
  teams: DEFAULT_TEAMS,
  activeTeamId: null,
  turnStartTime: 0,
  askAiState: 'IDLE',
};

const normalizeSession = (raw: QuizSession): QuizSession => {
  const byName = new Map(raw.teams.map((team) => [team.name, team]));
  const normalizedTeams = DEFAULT_TEAMS.map((defaultTeam) => {
    const existing = byName.get(defaultTeam.name) || raw.teams.find((team) => team.id === defaultTeam.id);
    return {
      ...defaultTeam,
      score: existing?.score ?? 0,
    };
  });

  return {
    ...DEFAULT_SESSION,
    ...raw,
    currentQuestion: DEFAULT_SESSION.currentQuestion,
    teams: normalizedTeams,
    activeTeamId: raw.activeTeamId && normalizedTeams.some((team) => team.id === raw.activeTeamId) ? raw.activeTeamId : null,
  };
};

const loadSession = (): QuizSession => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return DEFAULT_SESSION;
    return normalizeSession(JSON.parse(stored));
  } catch {
    return DEFAULT_SESSION;
  }
};

const saveSession = (session: QuizSession) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
};

export const QuizService = {
  getSession: async (): Promise<QuizSession> => loadSession(),

  updateStatus: async (status: QuizStatus): Promise<QuizSession> => {
    const session = loadSession();
    session.status = status;
    if (status === QuizStatus.LIVE) {
      session.startTime = Date.now();
      session.turnStartTime = Date.now();
    }
    saveSession(session);
    return session;
  },

  resetSession: async (): Promise<QuizSession> => {
    const current = loadSession();
    const reset: QuizSession = {
      ...DEFAULT_SESSION,
      teams: current.teams.map((team) => ({ ...team, score: 0 })),
    };
    saveSession(reset);
    return reset;
  },

  setActiveTeam: async (teamId: string): Promise<QuizSession> => {
    const session = loadSession();
    if (!session.teams.some((team) => team.id === teamId)) return session;
    session.activeTeamId = teamId;
    session.askAiState = 'IDLE';
    session.currentAskAiQuestion = undefined;
    session.currentAskAiResponse = undefined;
    session.askAiVerdict = undefined;
    session.groundingUrls = [];
    session.turnStartTime = Date.now();
    saveSession(session);
    return session;
  },

  setAskAiState: async (state: AskAiState, payload?: { question?: string; response?: string; links?: { title: string; uri: string }[] }): Promise<QuizSession> => {
    const session = loadSession();
    session.askAiState = state;

    if (state === 'LISTENING') {
      session.currentAskAiQuestion = undefined;
      session.currentAskAiResponse = undefined;
      session.askAiVerdict = undefined;
      session.groundingUrls = [];
    }

    if (payload?.question) {
      session.currentAskAiQuestion = payload.question;
    }

    if (payload?.response) {
      session.currentAskAiResponse = payload.response;
    }

    if (payload?.links) {
      session.groundingUrls = payload.links;
    }

    saveSession(session);
    return session;
  },

  judgeAskAi: async (verdict: 'AI_CORRECT' | 'AI_WRONG'): Promise<QuizSession> => {
    const session = loadSession();
    session.askAiState = 'COMPLETED';
    session.askAiVerdict = verdict;

    if (verdict === 'AI_WRONG' && session.activeTeamId) {
      const team = session.teams.find((item) => item.id === session.activeTeamId);
      if (team) team.score += 20;
    }

    saveSession(session);
    return session;
  },
};
