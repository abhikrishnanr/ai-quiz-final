import React, { useEffect, useRef, useState } from 'react';
import { useQuizSync } from '../hooks/useQuizSync';
import { API } from '../services/api';
import { SFX } from '../services/sfx';
import { Badge, Card } from '../components/SharedUI';
import { Activity, Mic, Power, Volume2 } from 'lucide-react';
import { AIHostAvatar } from '../components/AIHostAvatar';
import { HOST_SCRIPTS } from '../constants';

function decodeBase64(base64: string) {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i += 1) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(data: Uint8Array, ctx: AudioContext): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length;
  const buffer = ctx.createBuffer(1, frameCount, 24000);
  const channelData = buffer.getChannelData(0);

  for (let i = 0; i < frameCount; i += 1) {
    channelData[i] = dataInt16[i] / 32768.0;
  }

  return buffer;
}

const DisplayView: React.FC = () => {
  const { session, loading } = useQuizSync();
  const [audioInitialized, setAudioInitialized] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [commentary, setCommentary] = useState('');
  const [askedQuestions, setAskedQuestions] = useState<string[]>([]);

  const audioContextRef = useRef<AudioContext | null>(null);
  const activeSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const lastAskAiStateRef = useRef<string | null>(null);
  const lastQuestionRef = useRef<string | null>(null);

  const activeTeam = session?.teams.find((team) => team.id === session.activeTeamId);

  const initAudio = async () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }

    if (audioContextRef.current.state === 'suspended') {
      await audioContextRef.current.resume();
    }

    SFX.init();
    SFX.playIntro();
    setAudioInitialized(true);

    const introAudio = await API.getTTSAudio(HOST_SCRIPTS.INTRO);
    if (introAudio) {
      setTimeout(() => {
        void playAudio(introAudio, HOST_SCRIPTS.INTRO);
      }, 300);
    }
  };

  const playAudio = async (base64Data: string, text: string) => {
    if (!audioContextRef.current) return;

    if (activeSourceRef.current) {
      try {
        activeSourceRef.current.stop();
      } catch {
        // no-op
      }
    }

    setCommentary(text);
    setIsSpeaking(true);

    try {
      const audioBuffer = await decodeAudioData(decodeBase64(base64Data), audioContextRef.current);
      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContextRef.current.destination);
      source.onended = () => {
        setIsSpeaking(false);
        activeSourceRef.current = null;
      };
      activeSourceRef.current = source;
      source.start();
    } catch {
      setIsSpeaking(false);
    }
  };

  useEffect(() => {
    if (!session || !audioInitialized) return;

    if (session.askAiState !== lastAskAiStateRef.current) {
      if (session.askAiState === 'LISTENING' && activeTeam) {
        const text = HOST_SCRIPTS.ASK_AI_INTRO.replace('{team}', activeTeam.name);
        API.getTTSAudio(text).then((audio) => {
          if (audio) void playAudio(audio, text);
        });
      }

      if (session.askAiState === 'PROCESSING') {
        const text = `${activeTeam?.name || 'Selected team'}, question received. Processing now.`;
        API.getTTSAudio(text).then((audio) => {
          if (audio) void playAudio(audio, text);
        });
      }

      if (session.askAiState === 'ANSWERING' && session.currentAskAiResponse) {
        API.getTTSAudio(session.currentAskAiResponse).then((audio) => {
          if (audio) {
            void playAudio(audio, session.currentAskAiResponse || '');
          }
        });
      }

      if (session.askAiState === 'COMPLETED') {
        const isWrong = session.askAiVerdict === 'AI_WRONG';
        const verdictText = isWrong
          ? `My answer was wrong. ${activeTeam?.name || 'Team'} gets 200 points.`
          : 'My answer was correct. No points awarded this turn.';
        if (isWrong) SFX.playWrong(); else SFX.playCorrect();
        API.getTTSAudio(verdictText).then((audio) => {
          if (audio) void playAudio(audio, verdictText);
        });
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
        <p className="text-slate-500 mt-4 uppercase tracking-widest text-xs">Tap once to initialize avatar voice</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617] text-white p-8">
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

          <Card>
            <p className="text-xs uppercase text-slate-500">Question Asked</p>
            <p className="text-2xl mt-2">{session.currentAskAiQuestion || 'Waiting for question...'}</p>
          </Card>

          <Card>
            <p className="text-xs uppercase text-slate-500 flex items-center gap-2"><Volume2 className="w-4 h-4" /> AI Answer</p>
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
    </div>
  );
};

export default DisplayView;
