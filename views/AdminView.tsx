import React, { useState } from 'react';
import { useQuizSync } from '../hooks/useQuizSync';
import { API } from '../services/api';
import { QuizStatus } from '../types';
import { Card, Badge, Button } from '../components/SharedUI';
import { Activity, Copy, Mic, ThumbsDown, ThumbsUp, Users } from 'lucide-react';

const AdminView: React.FC = () => {
  const { session, loading, refresh } = useQuizSync();
  const [updating, setUpdating] = useState(false);

  const run = async (action: () => Promise<unknown>) => {
    setUpdating(true);
    try {
      await action();
      await refresh();
    } finally {
      setUpdating(false);
    }
  };

  const copyText = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // no-op
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
              <p className="text-slate-400 mt-2">Use approve/reject to finalize each team round.</p>
            </div>
            <Button onClick={() => run(API.resetSession)} variant="secondary">Reset Scores</Button>
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
          <h2 className="font-black uppercase mb-4">Team Ask URLs</h2>
          <div className="grid md:grid-cols-2 gap-3">
            {session.teams.map((team) => {
              const teamUrl = `${window.location.origin}${window.location.pathname}#/team?team=${team.id}`;
              return (
                <div key={team.id} className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <p className="font-bold">{team.name}</p>
                  <p className="text-xs text-slate-400 break-all mt-1">{teamUrl}</p>
                  <Button variant="secondary" className="mt-3" onClick={() => copyText(teamUrl)}>
                    <Copy className="w-4 h-4" /> Copy URL
                  </Button>
                </div>
              );
            })}
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
            <div><span className="text-xs uppercase text-slate-500">Current Team</span><p className="font-bold">{session.teams.find((team) => team.id === session.activeTeamId)?.name || 'None selected'}</p></div>
            <div><span className="text-xs uppercase text-slate-500">Question</span><p>{session.currentAskAiQuestion || 'Waiting for team...'}</p></div>
            <div><span className="text-xs uppercase text-slate-500">AI Response</span><p>{session.currentAskAiResponse || 'No answer yet.'}</p></div>
            {session.askAiState === 'ANSWERING' && (
              <div className="flex gap-3 pt-2">
                <Button onClick={() => run(() => API.judgeAskAi('AI_CORRECT'))} variant="success" className="flex-1"><ThumbsUp className="w-4 h-4" /> Approve AI Reply</Button>
                <Button onClick={() => run(() => API.judgeAskAi('AI_WRONG'))} variant="danger" className="flex-1"><ThumbsDown className="w-4 h-4" /> Reject AI Reply (+20 Team)</Button>
              </div>
            )}
            {session.askAiVerdict && <Badge color={session.askAiVerdict === 'AI_WRONG' ? 'red' : 'green'}>{session.askAiVerdict}</Badge>}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AdminView;
