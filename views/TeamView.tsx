import React, { useEffect, useRef, useState } from 'react';
import { useQuizSync } from '../hooks/useQuizSync';
import { API } from '../services/api';
import { Badge, Button, Card } from '../components/SharedUI';
import { BrainCircuit, Mic, Send, Square } from 'lucide-react';

const TeamView: React.FC = () => {
  const { session, loading, refresh } = useQuizSync();
  const [selectedTeam, setSelectedTeam] = useState<string | null>(localStorage.getItem('duk_team_id'));
  const [askAiText, setAskAiText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const teamFromUrl = params.get('team');
    if (teamFromUrl) {
      setSelectedTeam(teamFromUrl);
      localStorage.setItem('duk_team_id', teamFromUrl);
    }
  }, []);

  if (loading || !session) return null;

  if (!selectedTeam) {
    return (
      <div className="min-h-screen bg-slate-950 text-white p-8 flex items-center justify-center">
        <div className="max-w-md w-full space-y-4 text-center">
          <BrainCircuit className="w-16 h-16 mx-auto text-indigo-400" />
          <h1 className="text-3xl font-black uppercase">Choose Team</h1>
          {session.teams.map((team) => (
            <button
              key={team.id}
              className="w-full p-4 rounded-xl bg-white/5 border border-white/10"
              onClick={() => {
                setSelectedTeam(team.id);
                localStorage.setItem('duk_team_id', team.id);
              }}
            >
              {team.name}
            </button>
          ))}
        </div>
      </div>
    );
  }

  const myTeam = session.teams.find((team) => team.id === selectedTeam);
  const isMyTurn = session.activeTeamId === selectedTeam;
  const micEnabled = session.askAiState === 'LISTENING' && isMyTurn;

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

  return (
    <div className="min-h-screen bg-slate-950 text-white p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-black">{myTeam?.name}</h1>
            <Badge color={isMyTurn ? 'green' : 'blue'}>{isMyTurn ? 'Your Turn' : 'Waiting'}</Badge>
          </div>
          <p className="text-slate-400 mt-2">Only ASK AI round is active.</p>
        </Card>

        <Card>
          <p className="text-xs uppercase text-slate-500">Mic Permission</p>
          <p className="text-2xl mt-2">{micEnabled ? 'Enabled by admin' : 'Disabled (wait for admin to select your team)'}</p>
          <div className="mt-4 flex gap-3">
            <Button onClick={toggleListening} variant="primary" disabled={!micEnabled} className="flex-1">
              {isListening ? <Square className="w-4 h-4" /> : <Mic className="w-4 h-4" />} {isListening ? 'Stop Recording' : 'Record Question'}
            </Button>
          </div>
          {micError && <p className="text-rose-300 mt-3 text-sm">{micError}</p>}
        </Card>

        <Card>
          <textarea
            value={askAiText}
            onChange={(event) => setAskAiText(event.target.value)}
            className="w-full min-h-32 rounded-xl bg-slate-900 border border-white/10 p-4"
            placeholder="Ask a quiz-domain question..."
            disabled={!micEnabled}
          />
          <Button onClick={submitAskAi} variant="success" className="mt-4 w-full" disabled={!micEnabled || isSubmitting || !askAiText.trim()}>
            <Send className="w-4 h-4" /> Submit to Ask AI
          </Button>
        </Card>

        <Card>
          <p className="text-xs uppercase text-slate-500">Latest AI Response</p>
          <p className="mt-2">{session.currentAskAiResponse || 'No response yet.'}</p>
        </Card>
      </div>
    </div>
  );
};

export default TeamView;
