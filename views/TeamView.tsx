import React, { useEffect, useRef, useState } from 'react';
import { useQuizSync } from '../hooks/useQuizSync';
import { API } from '../services/api';
import { Badge, Button, Card } from '../components/SharedUI';
import { BrainCircuit, Mic, Send } from 'lucide-react';

const TeamView: React.FC = () => {
  const { session, loading, refresh } = useQuizSync();
  const [selectedTeam, setSelectedTeam] = useState<string | null>(localStorage.getItem('duk_team_id'));
  const [askAiText, setAskAiText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (!('webkitSpeechRecognition' in window)) return;
    const recognition = new (window as any).webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
    recognition.onresult = (event: any) => {
      setAskAiText(event.results[0][0].transcript);
      setIsListening(false);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognitionRef.current = recognition;
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

  const toggleListening = () => {
    if (!recognitionRef.current || !micEnabled) return;
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

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
              <Mic className="w-4 h-4" /> {isListening ? 'Stop Listening' : 'Speak Question'}
            </Button>
          </div>
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
