import React from 'react';
import { useQuizSync } from '../hooks/useQuizSync';
import { Badge, Card } from '../components/SharedUI';
import { Activity, Mic } from 'lucide-react';

const DisplayView: React.FC = () => {
  const { session, loading } = useQuizSync();

  if (loading || !session) {
    return <div className="min-h-screen bg-slate-950 flex items-center justify-center"><Activity className="animate-spin text-indigo-400" /></div>;
  }

  const activeTeam = session.teams.find((team) => team.id === session.activeTeamId);

  return (
    <div className="min-h-screen bg-slate-950 text-white p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <Card>
          <div className="flex items-center justify-between">
            <h1 className="text-4xl font-black uppercase">Ask AI Round</h1>
            <Badge color="blue">Live Display</Badge>
          </div>
        </Card>

        <Card>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <p className="text-xs uppercase text-slate-500">Mic Enabled For</p>
              <p className="text-3xl font-black mt-2">{activeTeam?.name || 'Waiting for team selection'}</p>
              <p className="text-slate-400 mt-2">{session.askAiState === 'LISTENING' ? 'Mic is ON' : 'Mic is OFF'}</p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 flex items-center gap-4">
              <Mic className={`w-10 h-10 ${session.askAiState === 'LISTENING' ? 'text-emerald-400' : 'text-slate-500'}`} />
              <div>
                <p className="text-xs uppercase text-slate-500">Ask AI State</p>
                <p className="text-2xl font-bold">{session.askAiState}</p>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <p className="text-xs uppercase text-slate-500">Team Question</p>
          <p className="text-2xl mt-2">{session.currentAskAiQuestion || 'Waiting for question...'}</p>
        </Card>

        <Card>
          <p className="text-xs uppercase text-slate-500">AI Answer</p>
          <p className="text-2xl mt-2">{session.currentAskAiResponse || 'Waiting for AI response...'}</p>
        </Card>

        <Card>
          <h2 className="font-black uppercase mb-3">Scoreboard</h2>
          <div className="grid md:grid-cols-3 gap-3">
            {[...session.teams].sort((a, b) => b.score - a.score).map((team) => (
              <div key={team.id} className="rounded-xl border border-white/10 bg-white/5 p-4 flex justify-between">
                <span>{team.name}</span>
                <span className="font-black">{team.score}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default DisplayView;
