
import React, { useState, useEffect, useRef } from 'react';
import { useQuizSync } from '../hooks/useQuizSync';
import { API } from '../services/api';
import { QuizStatus, SubmissionType } from '../types';
import { Card, Button, Badge } from '../components/SharedUI';
import { 
  CheckCircle2, AlertCircle, Clock, Zap, LogOut, 
  Sparkles, MessageSquare, BrainCircuit, Waves, 
  Lock as LockIcon, Activity, HandMetal, Mic, Send, Eye,
  ArrowRight, Volume2
} from 'lucide-react';
import { AIHostAvatar } from '../components/AIHostAvatar';

const TeamView: React.FC = () => {
  const { session, loading, refresh } = useQuizSync();
  const [selectedTeam, setSelectedTeam] = useState<string | null>(localStorage.getItem('duk_team_id'));
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [timeExpired, setTimeExpired] = useState(false);
  
  const [askAiText, setAskAiText] = useState("");
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  const currentQuestion = session?.currentQuestion;
  const mySubmission = session?.submissions.find(s => s.teamId === selectedTeam);
  const myTeam = session?.teams.find(t => t.id === selectedTeam);
  const isMyTurn = session?.activeTeamId === selectedTeam;
  const isReading = session?.isReading; // Ensure reading state is captured

  useEffect(() => {
    if (session?.status === QuizStatus.PREVIEW) {
      setSelectedAnswer(null);
      setAskAiText("");
      setTimeExpired(false);
    }
  }, [session?.currentQuestion?.id, session?.status]);

  // Timer Check for Team
  useEffect(() => {
    // Timer only counts if NOT reading
    if (session?.status === QuizStatus.LIVE && currentQuestion?.roundType === 'STANDARD' && isMyTurn && session.turnStartTime && !isReading) {
        const checkTimer = () => {
            const elapsed = (Date.now() - session.turnStartTime!) / 1000;
            if (elapsed > 30 && !timeExpired) {
                setTimeExpired(true);
            } else if (elapsed <= 30 && timeExpired) {
                setTimeExpired(false);
            }
        };
        const interval = setInterval(checkTimer, 500);
        return () => clearInterval(interval);
    }
  }, [session?.status, currentQuestion, isMyTurn, session?.turnStartTime, timeExpired, isReading]);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window) {
      const recognition = new (window as any).webkitSpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';
      
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setAskAiText(transcript);
        setIsListening(false);
      };

      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);
      
      recognitionRef.current = recognition;
    }
  }, []);

  if (loading || !session) return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6">
       <div className="w-16 h-16 rounded-full border-[3px] border-slate-900 border-t-indigo-500 animate-spin" />
    </div>
  );

  if (!selectedTeam) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-8 relative overflow-hidden">
        <div className="relative z-10 w-full max-w-sm flex flex-col items-center">
            <BrainCircuit className="w-20 h-20 text-indigo-400 mb-12" />
            <h1 className="text-5xl font-black text-white uppercase tracking-tighter mb-12">Select Team</h1>
            <div className="w-full space-y-5">
              {session.teams.map(t => (
                <button 
                  key={t.id} 
                  onClick={() => { setSelectedTeam(t.id); localStorage.setItem('duk_team_id', t.id); }} 
                  className="w-full p-8 bg-white/5 border border-white/10 rounded-[2.5rem] text-white font-black uppercase text-2xl hover:bg-white/10 transition-all"
                >
                  {t.name}
                </button>
              ))}
            </div>
        </div>
      </div>
    );
  }

  const handleSubmit = async (type: SubmissionType = 'ANSWER') => {
    if (type === 'ANSWER' && selectedAnswer === null) return;
    setIsSubmitting(true);
    try {
      await API.submitTeamAnswer(selectedTeam, session.currentQuestion!.id, selectedAnswer ?? undefined, type);
      await refresh();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRequestHint = async () => {
    if (session.requestedHint) return;
    setIsSubmitting(true);
    try {
      await API.requestHint(selectedTeam);
      await refresh();
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const toggleListening = () => {
    if (!recognitionRef.current) return;
    if (isListening) {
        recognitionRef.current.stop();
        setIsListening(false);
    } else {
        recognitionRef.current.start();
        setIsListening(true);
    }
  };

  const submitAskAi = async () => {
      if (!askAiText.trim()) return;
      setIsSubmitting(true);
      try {
          await API.submitAskAiQuestion(askAiText);
          await refresh();
      } finally {
          setIsSubmitting(false);
      }
  };

  const renderContent = () => {
    if (!currentQuestion || session.status === QuizStatus.PREVIEW) {
      return (
        <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-12">
          <Clock className="w-24 h-24 text-indigo-400 animate-pulse" />
          <h2 className="text-4xl font-black text-white uppercase tracking-tighter">Connected</h2>
          <p className="text-slate-500 font-bold uppercase tracking-[0.5em] text-[10px]">Waiting for Host</p>
        </div>
      );
    }

    if (currentQuestion.roundType === 'ASK_AI') {
        if (!isMyTurn) {
             return (
                <div className="flex flex-col items-center justify-center h-[50vh] text-center animate-in zoom-in">
                    <div className="w-32 h-32 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center mb-8">
                        <LockIcon className="w-12 h-12 text-slate-500" />
                    </div>
                    <h2 className="text-3xl font-black text-white uppercase tracking-tight">Active: {session.teams.find(t=>t.id===session.activeTeamId)?.name}</h2>
                    <p className="text-slate-400 mt-4 uppercase tracking-widest text-xs">Waiting for them...</p>
                </div>
             );
        }

        if (session.askAiState === 'IDLE') {
             return (
                <div className="flex flex-col items-center justify-center h-[50vh] text-center animate-in zoom-in">
                    <BrainCircuit className="w-24 h-24 text-purple-500 mb-8 animate-pulse" />
                    <h2 className="text-3xl font-black text-white uppercase tracking-tight">Challenge AI</h2>
                    <p className="text-slate-400 mt-4 uppercase tracking-widest text-xs max-w-md mx-auto">Prepare your question. Wait for signal.</p>
                </div>
             );
        }

        if (session.askAiState === 'LISTENING') {
            return (
                <div className="flex flex-col items-center gap-8 max-w-2xl mx-auto animate-in slide-in-from-bottom">
                     <div className="text-center space-y-2">
                        <Badge color="blue">Input Active</Badge>
                        <h2 className="text-4xl font-black text-white uppercase">Ask Question</h2>
                     </div>
                     <div className="w-full relative">
                        <textarea
                            value={askAiText}
                            onChange={(e) => setAskAiText(e.target.value)}
                            placeholder="Type or use mic..."
                            className="w-full bg-slate-900/50 border border-white/10 rounded-[2rem] p-8 h-48 text-xl text-white resize-none focus:outline-none focus:border-indigo-500 transition-colors"
                        />
                        <button onClick={toggleListening} className={`absolute bottom-6 right-6 p-4 rounded-full transition-all ${isListening ? 'bg-rose-500 animate-pulse' : 'bg-white/10 hover:bg-white/20'}`}>
                            <Mic className="w-6 h-6 text-white" />
                        </button>
                     </div>
                     <Button variant="primary" className="w-full h-20 text-xl" onClick={submitAskAi} disabled={!askAiText.trim() || isSubmitting}>
                        <Send className="w-6 h-6 mr-3" /> SEND
                     </Button>
                </div>
            );
        }

        return (
             <div className="flex flex-col items-center justify-center h-[50vh] text-center space-y-8 animate-in zoom-in">
                 <div className="relative w-32 h-32">
                     <div className="absolute inset-0 border-4 border-indigo-500/30 rounded-full" />
                     <div className="absolute inset-0 border-t-4 border-indigo-500 rounded-full animate-spin" />
                     <BrainCircuit className="absolute inset-0 m-auto w-12 h-12 text-indigo-400" />
                 </div>
                 <h3 className="text-2xl font-black text-white uppercase">Thinking...</h3>
                 <div className="bg-white/5 p-6 rounded-2xl max-w-xl">
                    <p className="text-slate-300 italic">"{session.currentAskAiQuestion}"</p>
                 </div>
             </div>
        );
    }

    if (session.status === QuizStatus.LIVE || session.status === QuizStatus.LOCKED) {
      const isBuzzer = currentQuestion.roundType === 'BUZZER';
      const isVisual = currentQuestion.roundType === 'VISUAL';
      const canPlay = isBuzzer || isMyTurn;
      const isLocked = session.status === QuizStatus.LOCKED;
      
      // If time expired in Standard round, lock active team
      const timeLock = timeExpired && currentQuestion.roundType === 'STANDARD';

      // Lock input while reading
      const inputLocked = isLocked || timeLock || isReading;

      return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 animate-in slide-in-from-bottom-8">
           <div className="lg:col-span-4 space-y-8">
              <div className={`p-10 rounded-[3rem] border-2 flex flex-col gap-6 shadow-2xl ${
                isBuzzer ? 'bg-amber-600/10 border-amber-600' : isVisual ? 'bg-cyan-600/10 border-cyan-600' : 'bg-indigo-600/10 border-indigo-600'
              }`}>
                  <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500">Status</span>
                  <div className="flex items-center justify-between">
                    <span className="font-black text-white uppercase tracking-tighter text-4xl">
                        {isBuzzer ? 'Buzzer' : isVisual ? 'Visual' : isMyTurn ? 'Your Turn' : 'Active'}
                    </span>
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${isBuzzer ? 'bg-amber-500' : isVisual ? 'bg-cyan-600' : 'bg-indigo-600'}`}>
                      {isBuzzer ? <Zap className="w-7 h-7 text-white" /> : isVisual ? <Eye className="w-7 h-7 text-white" /> : <Waves className="w-7 h-7 text-white" />}
                    </div>
                  </div>
              </div>

              {isMyTurn && !mySubmission && currentQuestion.roundType === 'STANDARD' && (
                <div className="bg-white/5 border border-white/10 rounded-[3rem] p-10 space-y-6">
                  <Button variant="primary" className="w-full h-20 rounded-3xl text-lg" disabled={session.requestedHint || session.hintVisible || isSubmitting || inputLocked} onClick={handleRequestHint}>
                    {session.hintVisible ? 'Hint Given' : session.requestedHint ? 'Asked Admin' : 'Need Hint'}
                  </Button>
                </div>
              )}

              {session.hintVisible && (
                <div className="bg-indigo-600/10 border border-indigo-500/50 p-10 rounded-[3rem] backdrop-blur-3xl animate-in zoom-in">
                    <p className="text-2xl font-bold text-slate-100 italic">"{currentQuestion.hint}"</p>
                </div>
              )}
           </div>

           <div className="lg:col-span-8 space-y-8">
              <Card className="bg-slate-900/80 border-white/10 p-12 overflow-hidden relative">
                 {isVisual && currentQuestion.visualUri && (
                    <img src={currentQuestion.visualUri} className="absolute inset-0 w-full h-full object-cover opacity-20" alt="Asset" />
                 )}
                 <h2 className="text-4xl font-black text-white leading-tight tracking-tighter relative z-10">{currentQuestion.text}</h2>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
                
                {/* Overlay for Time Expired / Locked */}
                {(isLocked || timeLock) && !mySubmission && (
                    <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md z-30 flex items-center justify-center rounded-[3rem] border border-white/5">
                        <div className="bg-slate-900 border border-rose-500/50 px-12 py-6 rounded-full flex items-center gap-6">
                          <LockIcon className="w-6 h-6 text-rose-500" />
                          <span className="text-sm font-black uppercase text-rose-500 tracking-[0.4em]">{timeLock ? "TIME EXPIRED" : "LOCKED"}</span>
                        </div>
                    </div>
                )}
                
                {/* Overlay for Reading Phase */}
                {isReading && !mySubmission && !isLocked && (
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm z-30 flex items-center justify-center rounded-[3rem] border border-indigo-500/30">
                        <div className="bg-indigo-900/40 border border-indigo-500/50 px-12 py-6 rounded-full flex items-center gap-6 shadow-[0_0_50px_rgba(79,70,229,0.5)]">
                          <Volume2 className="w-6 h-6 text-indigo-400 animate-pulse" />
                          <span className="text-sm font-black uppercase text-indigo-400 tracking-[0.4em]">READING QUESTION...</span>
                        </div>
                    </div>
                )}

                {currentQuestion.options.map((opt, i) => (
                  <button key={i} disabled={!!mySubmission || !canPlay || inputLocked} onClick={() => setSelectedAnswer(i)} className={`p-10 rounded-[3rem] border-2 text-left flex items-center transition-all duration-500 ${selectedAnswer === i ? 'bg-white border-white text-slate-950 shadow-xl' : 'bg-white/5 border-white/5 text-slate-300 hover:bg-white/10'}`}>
                    <span className={`w-14 h-14 rounded-2xl flex items-center justify-center mr-8 font-black text-2xl ${selectedAnswer === i ? 'bg-slate-900 text-white' : 'bg-white/10 text-slate-500'}`}>{String.fromCharCode(65+i)}</span>
                    <span className="text-2xl font-bold tracking-tight">{opt}</span>
                  </button>
                ))}
              </div>

              {!mySubmission && canPlay && !inputLocked && (
                  <div className="flex gap-4">
                        <button disabled={selectedAnswer === null || isSubmitting} onClick={() => handleSubmit('ANSWER')} className={`flex-1 py-12 text-white rounded-[4rem] text-4xl font-black uppercase tracking-tighter shadow-2xl transition-all duration-700 active:scale-95 ${selectedAnswer === null ? 'bg-slate-900/50 opacity-40' : isBuzzer ? 'bg-amber-600' : isVisual ? 'bg-cyan-600' : 'bg-indigo-600'}`}>
                        {isBuzzer ? 'BUZZ IN' : 'SUBMIT ANSWER'}
                        </button>
                        
                        {!isBuzzer && (
                            <button disabled={isSubmitting} onClick={() => handleSubmit('PASS')} className="w-40 bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white rounded-[4rem] font-black uppercase tracking-wider flex items-center justify-center gap-2">
                                <ArrowRight className="w-6 h-6" /> PASS
                            </button>
                        )}
                  </div>
              )}

              {mySubmission && (
                 <div className="bg-white/5 p-16 rounded-[4rem] border border-white/10 text-center space-y-6">
                    {mySubmission.type === 'PASS' ? (
                        <>
                             <ArrowRight className="w-16 h-16 text-slate-500 mx-auto" />
                             <h3 className="text-3xl font-black text-white uppercase italic tracking-widest">PASSED TURN</h3>
                        </>
                    ) : (
                        <>
                            <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto animate-pulse" />
                            <h3 className="text-3xl font-black text-white uppercase italic tracking-widest">SENT</h3>
                        </>
                    )}
                 </div>
              )}
           </div>
        </div>
      );
    }

    if (session.status === QuizStatus.REVEALED) {
       const isCorrect = mySubmission?.isCorrect;
       const passed = mySubmission?.type === 'PASS';
       
       return (
         <div className="flex flex-col items-center justify-center h-[70vh] space-y-16 animate-in zoom-in max-w-5xl mx-auto">
            {!passed ? (
                <>
                    <div className={`w-40 h-40 rounded-full flex items-center justify-center border-4 ${isCorrect ? 'bg-emerald-600 border-emerald-400 shadow-[0_0_50px_rgba(16,185,129,0.4)]' : 'bg-rose-700 border-rose-500 shadow-2xl'}`}>
                    {isCorrect ? <CheckCircle2 className="w-24 h-24 text-white" /> : <AlertCircle className="w-24 h-24 text-white" />}
                    </div>
                    <div className="text-center">
                    <h2 className={`text-8xl font-black uppercase italic tracking-tighter ${isCorrect ? 'text-emerald-400' : 'text-rose-400'}`}>{isCorrect ? 'CORRECT' : 'WRONG'}</h2>
                    </div>
                </>
            ) : (
                <div className="text-center">
                     <div className="w-40 h-40 rounded-full flex items-center justify-center border-4 bg-slate-700 border-slate-500 shadow-2xl mx-auto mb-10">
                        <ArrowRight className="w-24 h-24 text-slate-300" />
                     </div>
                     <h2 className="text-8xl font-black uppercase italic tracking-tighter text-slate-400">PASSED</h2>
                </div>
            )}
            
            <div className="bg-white/5 backdrop-blur-3xl p-12 rounded-[4rem] w-full flex justify-between items-center border border-white/10 shadow-2xl">
               <div>
                  <span className="text-slate-600 font-black uppercase tracking-[0.4em] text-[9px] block mb-2">Score</span>
                  <span className="text-7xl font-black text-white italic tracking-tighter tabular-nums">{myTeam?.score} <span className="text-2xl font-normal text-slate-700 not-italic">PTS</span></span>
               </div>
               <Activity className="w-20 h-20 text-indigo-400" />
            </div>
         </div>
       );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-slate-950 font-sans w-full max-w-[1440px] mx-auto relative flex flex-col shadow-2xl overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(transparent_0%,#020617_100%)] pointer-events-none" />
      <header className="bg-slate-900/60 backdrop-blur-3xl p-10 flex justify-between items-center border-b border-white/10 sticky top-0 z-50">
         <div className="flex items-center gap-8">
            <div className="w-16 h-16 rounded-full border border-indigo-500/30 flex items-center justify-center bg-indigo-500/5">
                <BrainCircuit className="w-8 h-8 text-indigo-400" />
            </div>
            <div>
               <p className="text-[10px] font-black uppercase text-indigo-500 mb-2 tracking-[0.3em]">Connected</p>
               <p className="text-3xl font-black text-white tracking-tighter">{myTeam?.name}</p>
            </div>
         </div>
         <button onClick={() => { localStorage.removeItem('duk_team_id'); setSelectedTeam(null); }} className="p-5 bg-white/5 rounded-[2rem] text-slate-500 hover:text-rose-500 transition-all border border-white/5 active:scale-90">
            <LogOut className="w-8 h-8" />
         </button>
      </header>
      <main className="flex-grow p-12 overflow-y-auto custom-scrollbar relative z-10">
         {renderContent()}
      </main>
      <footer className="bg-slate-900/80 backdrop-blur-3xl border-t border-white/10 p-10 flex items-center gap-8">
         <MessageSquare className="w-10 h-10 text-indigo-400" />
         <p className="text-sm text-slate-500 italic font-medium">"Connected to Quiz System."</p>
      </footer>
    </div>
  );
};

export default TeamView;
