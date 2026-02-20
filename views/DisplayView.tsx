import React, { useEffect, useRef, useState } from 'react';
import { useQuizSync } from '../hooks/useQuizSync';
import { API } from '../services/api';
import { SFX } from '../services/sfx';
import { Badge, Card } from '../components/SharedUI';
import { Activity, ExternalLink, Mic, Power, Volume2 } from 'lucide-react';
import { AIHostAvatar } from '../components/AIHostAvatar';
import { HOST_SCRIPTS } from '../constants';

const DisplayView: React.FC = () => {
  const { session, loading } = useQuizSync();
  const [audioInitialized, setAudioInitialized] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [commentary, setCommentary] = useState('');
  const [askedQuestions, setAskedQuestions] = useState<string[]>([]);
  const [overlayText, setOverlayText] = useState('');

  const activeAudioRef = useRef<HTMLAudioElement | null>(null);
  const lastAskAiStateRef = useRef<string | null>(null);
  const lastQuestionRef = useRef<string | null>(null);

  const activeTeam = session?.teams.find((team) => team.id === session.activeTeamId);

  const speakText = async (text: string) => {
    if (!audioInitialized || !text.trim()) return;
    setCommentary(text);
    const audioSrc = await API.getTTSAudio(text);
    if (!audioSrc) return;

    if (activeAudioRef.current) {
      activeAudioRef.current.pause();
      activeAudioRef.current.currentTime = 0;
    }

    const audio = new Audio(audioSrc);
    activeAudioRef.current = audio;
    setIsSpeaking(true);
    audio.onended = () => {
      setIsSpeaking(false);
      activeAudioRef.current = null;
    };
    try {
      await audio.play();
    } catch {
      setIsSpeaking(false);
    }
  };

  const initAudio = async () => {
    SFX.init();
    SFX.playIntro();
    setAudioInitialized(true);
    setTimeout(() => {
      void speakText(HOST_SCRIPTS.INTRO);
    }, 300);
  };

  useEffect(() => {
    if (!session || !audioInitialized) return;

    if (session.askAiState !== lastAskAiStateRef.current) {
      if (session.askAiState === 'LISTENING' && activeTeam) {
        void speakText(HOST_SCRIPTS.ASK_AI_INTRO.replace('{team}', activeTeam.name));
      }

      if (session.askAiState === 'PROCESSING') {
        void speakText(`${activeTeam?.name || 'Team'} has responded with the question. Processing with Gemini now.`);
      }

      if (session.askAiState === 'ANSWERING' && session.currentAskAiResponse) {
        const isOutOfScope = session.currentAskAiResponse.includes('outside quiz domains');
        if (isOutOfScope) {
          void speakText('The domain is out of scope. Please ask from the quiz domains only.');
        } else {
          void speakText(session.currentAskAiResponse);
        }
      }

      if (session.askAiState === 'COMPLETED') {
        const isWrong = session.askAiVerdict === 'AI_WRONG';
        const verdictText = isWrong
          ? `AI fails. ${activeTeam?.name || 'Team'} wins against AI and gets 20 points.`
          : `AI wins this turn. ${activeTeam?.name || 'Team'} gets zero points.`;
        setOverlayText(isWrong ? `${activeTeam?.name || 'Team'} +20 | AI Failed` : 'AI WINS THIS TURN');
        setTimeout(() => setOverlayText(''), 2800);
        if (isWrong) SFX.playWrong(); else SFX.playCorrect();
        void speakText(verdictText);
      }

      lastAskAiStateRef.current = session.askAiState;
    }
  }, [session, audioInitialized, activeTeam]);

  useEffect(() => {
    if (!session?.currentAskAiQuestion) return;
    if (session.currentAskAiQuestion !== lastQuestionRef.current) {
      lastQuestionRef.current = session.currentAskAiQuestion;
      setAskedQuestions((prev) => [session.currentAskAiQuestion as string, ...prev.filter((item) => item !== session.currentAskAiQuestion)].slice(0, 6));
    }
  }, [session?.currentAskAiQuestion]);

  if (loading || !session) {
    return <div className="min-h-screen bg-slate-950 flex items-center justify-center"><Activity className="animate-spin text-indigo-400" /></div>;
  }

  if (!audioInitialized) {
    return (
      <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center cursor-pointer" onClick={initAudio}>
        <div className="w-24 h-24 rounded-full border-4 border-indigo-500/30 flex items-center justify-center mb-8">
          <Power className="w-10 h-10 text-indigo-400 animate-pulse" />
        </div>
        <h1 className="text-4xl font-black text-white uppercase tracking-[0.2em]">Start Display Audio</h1>
        <p className="text-slate-500 mt-4 uppercase tracking-widest text-xs">Tap once to initialize ElevenLabs voice</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617] text-white p-8 relative">
      {overlayText && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center">
          <div className="rounded-3xl border border-emerald-400/50 bg-emerald-500/10 px-10 py-8 text-center shadow-[0_0_40px_rgba(16,185,129,0.35)]">
            <p className="text-sm uppercase tracking-[0.35em] text-emerald-300">Result Announcement</p>
            <p className="text-4xl font-black mt-3">{overlayText}</p>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4 flex flex-col items-center justify-start gap-5">
          <Card className="w-full flex flex-col items-center">
            <AIHostAvatar size="xl" isSpeaking={isSpeaking} />
            <div className="mt-4 min-h-[80px] flex items-center justify-center">
              {commentary ? (
                <p className="text-center text-indigo-100 text-lg italic">"{commentary}"</p>
              ) : (
                <p className="text-slate-500 text-sm">Avatar ready.</p>
              )}
            </div>
          </Card>

          <Card className="w-full">
            <h3 className="text-xs uppercase text-slate-500 mb-3">Asked Questions</h3>
            <div className="space-y-2">
              {askedQuestions.length === 0 && <p className="text-slate-400">No questions asked yet.</p>}
              {askedQuestions.map((question, index) => (
                <div key={`${question}-${index}`} className="bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-slate-100">
                  {question}
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="lg:col-span-8 space-y-6">
          <Card>
            <div className="flex items-center justify-between gap-4">
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

          <Card className="border-indigo-400/40 ring-2 ring-indigo-500/30 shadow-[0_0_45px_rgba(99,102,241,0.2)]">
            <p className="text-xs uppercase text-indigo-300 tracking-[0.25em]">Question Asked</p>
            <p className="text-3xl mt-3 font-extrabold text-indigo-50">{session.currentAskAiQuestion || 'Waiting for question...'}</p>
          </Card>

          <Card className="border-emerald-400/40 ring-2 ring-emerald-500/30 shadow-[0_0_45px_rgba(16,185,129,0.2)]">
            <p className="text-xs uppercase text-emerald-300 tracking-[0.25em] flex items-center gap-2"><Volume2 className="w-4 h-4" /> AI Answer</p>
            <p className="text-3xl mt-3 font-extrabold text-emerald-50">{session.currentAskAiResponse || 'Waiting for AI response...'}</p>
          </Card>

          <Card>
            <h2 className="font-black uppercase mb-3">Source URLs</h2>
            <div className="space-y-2">
              {(session.groundingUrls || []).length === 0 && <p className="text-slate-400">No source URLs for this response.</p>}
              {(session.groundingUrls || []).map((link, index) => (
                <a key={`${link.uri}-${index}`} href={link.uri} target="_blank" rel="noreferrer" className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-3 hover:bg-white/10">
                  <span className="truncate">{link.title || link.uri}</span>
                  <ExternalLink className="w-4 h-4 text-indigo-300" />
                </a>
              ))}
            </div>
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
    </div>
  );
};

export default DisplayView;
