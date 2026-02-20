import React, { useEffect, useRef, useState } from 'react';
import { useQuizSync } from '../hooks/useQuizSync';
import { API } from '../services/api';
import { QuizStatus } from '../types';
import { Badge, Button, Card } from '../components/SharedUI';
import { Activity, Mic, Send, Square, ThumbsDown, ThumbsUp, Trash2, Users } from 'lucide-react';

const AdminView: React.FC = () => {
  const { session, loading, refresh } = useQuizSync();
  const [updating, setUpdating] = useState(false);
  const [askAiText, setAskAiText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);

  const run = async (action: () => Promise<unknown>) => {
    setUpdating(true);
    try {
      await action();
      await refresh();
    } finally {
      setUpdating(false);
    }
  };

  const activeTeam = session?.teams.find((team) => team.id === session.activeTeamId);
  const micEnabled = session?.askAiState === 'LISTENING' && !!activeTeam;

  const toggleListening = async () => {
    if (!micEnabled) return;

    if (isListening) {
      mediaRecorderRef.current?.stop();
      setIsListening(false);
      return;
    }

    try {
      setMicError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      chunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };

      recorder.onstop = async () => {
        try {
          const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
          const transcript = await API.transcribeMicAudio(blob);
          if (transcript) {
            setAskAiText(transcript);
          } else {
            setMicError('Could not convert voice to text. Please type your question.');
          }
        } finally {
          stream.getTracks().forEach((track) => track.stop());
        }
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsListening(true);
    } catch {
      setMicError('Microphone access failed. Please allow mic permission or type manually.');
      setIsListening(false);
    }
  };

  useEffect(() => {
    if (micEnabled) return;
    if (isListening) {
      mediaRecorderRef.current?.stop();
      setIsListening(false);
    }
  }, [micEnabled, isListening]);

  const submitAskAi = async () => {
    if (!askAiText.trim() || !micEnabled) return;
    setIsSubmitting(true);
    try {
      await API.submitAskAiQuestion(askAiText);
      await refresh();
    } finally {
      setIsSubmitting(false);
      setIsListening(false);
    }
  };

  if (loading || !session) {
    return <div className="min-h-screen bg-slate-950 flex items-center justify-center"><Activity className="animate-spin text-indigo-400" /></div>;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <Card>
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-black uppercase">Ask AI Admin</h1>
              <p className="text-slate-400 mt-2">Admin now controls team selection, mic recording, and question submit in one page.</p>
            </div>
            <div className="flex gap-3">
              <Button onClick={() => run(API.resetSession)} variant="secondary">Reset Scores</Button>
              <Button onClick={() => run(API.purgeLocalStorage)} variant="danger"><Trash2 className="w-4 h-4" /> Purge LocalStorage</Button>
            </div>
          </div>
        </Card>

        <Card>
          <div className="grid grid-cols-3 gap-4">
            <Button onClick={() => run(() => API.updateSessionStatus(QuizStatus.PREVIEW))} variant={session.status === QuizStatus.PREVIEW ? 'primary' : 'secondary'}>Preview</Button>
            <Button onClick={() => run(() => API.updateSessionStatus(QuizStatus.LIVE))} variant={session.status === QuizStatus.LIVE ? 'success' : 'secondary'}>Go Live</Button>
            <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-center">
              <div className="text-xs uppercase text-slate-500">State</div>
              <div className="font-bold mt-1">{session.askAiState}</div>
            </div>
          </div>
        </Card>

        <Card>
          <h2 className="font-black uppercase mb-4 flex items-center gap-2"><Users className="w-4 h-4" /> Select Team & Enable Mic</h2>
          <div className="grid md:grid-cols-3 gap-3">
            {session.teams.map((team) => {
              const active = session.activeTeamId === team.id;
              return (
                <button
                  key={team.id}
                  onClick={() => run(() => API.setActiveTeam(team.id))}
                  className={`p-4 rounded-xl border text-left ${active ? 'bg-indigo-600 border-indigo-400' : 'bg-white/5 border-white/10'}`}
                >
                  <div className="font-bold">{team.name}</div>
                  <div className="text-xs text-slate-300">Score: {team.score}</div>
                </button>
              );
            })}
          </div>

          <div className="mt-4 flex gap-3">
            <Button
              onClick={() => run(() => API.setAskAiState('LISTENING'))}
              variant="primary"
              disabled={!session.activeTeamId || updating}
              className="flex-1"
            >
              <Mic className="w-4 h-4" /> Enable Mic for Selected Team
            </Button>
          </div>
        </Card>

        <Card>
          <div className="space-y-3">
            <div><span className="text-xs uppercase text-slate-500">Current Team</span><p className="font-bold">{activeTeam?.name || 'None selected'}</p></div>
            <div><span className="text-xs uppercase text-slate-500">Question</span><p>{session.currentAskAiQuestion || 'Waiting for question...'}</p></div>
            <div><span className="text-xs uppercase text-slate-500">AI Response</span><p>{session.currentAskAiResponse || 'No answer yet.'}</p></div>
            {session.askAiVerdict && <Badge color={session.askAiVerdict === 'AI_WRONG' ? 'red' : 'green'}>{session.askAiVerdict}</Badge>}
          </div>
        </Card>

        <Card>
          <h2 className="font-black uppercase mb-4">Mic Input + Send (Admin Controlled)</h2>
          <p className="text-slate-400 mb-4">Use this single page flow instead of a separate team page.</p>
          <div className="flex gap-3">
            <Button onClick={toggleListening} variant="primary" disabled={!micEnabled} className="flex-1">
              {isListening ? <Square className="w-4 h-4" /> : <Mic className="w-4 h-4" />} {isListening ? 'Stop Recording' : 'Record Question'}
            </Button>
          </div>
          {micError && <p className="text-rose-300 mt-3 text-sm">{micError}</p>}

          <textarea
            value={askAiText}
            onChange={(event) => setAskAiText(event.target.value)}
            className="w-full min-h-32 rounded-xl bg-slate-900 border border-white/10 p-4 mt-4"
            placeholder="Ask a quiz-domain question..."
            disabled={!micEnabled}
          />

          <Button onClick={submitAskAi} variant="success" className="mt-4 w-full" disabled={!micEnabled || isSubmitting || !askAiText.trim()}>
            <Send className="w-4 h-4" /> Send to Gemini
          </Button>

          {session.askAiState === 'ANSWERING' && (
            <div className="flex gap-3 pt-4">
              <Button onClick={() => run(() => API.judgeAskAi('AI_CORRECT'))} variant="success" className="flex-1"><ThumbsUp className="w-4 h-4" /> Approve AI Reply</Button>
              <Button onClick={() => run(() => API.judgeAskAi('AI_WRONG'))} variant="danger" className="flex-1"><ThumbsDown className="w-4 h-4" /> Reject AI Reply (+20 Team)</Button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default AdminView;
