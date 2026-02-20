
import React from 'react';
import { HashRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import AdminView from './views/AdminView';
import DisplayView from './views/DisplayView';
import TeamView from './views/TeamView';
import { BrainCircuit, Settings, Monitor, Users, ChevronRight, Zap, QrCode } from 'lucide-react';

const Home: React.FC = () => (
  <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 relative overflow-hidden selection:bg-indigo-500 selection:text-white">
    
    {/* Animated Background Elements */}
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] bg-indigo-600/20 blur-[150px] rounded-full animate-pulse [animation-duration:8s]" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[60vw] h-[60vw] bg-cyan-600/10 blur-[150px] rounded-full animate-pulse [animation-duration:12s]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,transparent_0%,rgba(2,6,23,0.8)_100%)] z-10" />
      <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
    </div>

    <div className="relative z-20 flex flex-col items-center max-w-6xl w-full">
      <div className="bg-white/5 backdrop-blur-xl p-8 rounded-[3rem] shadow-[0_0_50px_rgba(79,70,229,0.2)] mb-12 border border-white/10 ring-1 ring-white/20 animate-in zoom-in duration-700">
        <BrainCircuit className="w-20 h-20 text-indigo-400 drop-shadow-[0_0_15px_rgba(129,140,248,0.5)]" />
      </div>
      
      <h1 className="text-5xl md:text-7xl font-black text-white mb-6 font-display tracking-tighter text-center leading-tight">
        DIGITAL UNIVERSITY <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">AI QUIZ</span>
      </h1>
      <p className="text-xl text-slate-400 mb-16 max-w-lg text-center font-medium leading-relaxed">
        Next-generation competitive intelligence platform driven by real-time neural processing and Gemini vision.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full px-4 md:px-0">
        {[
          { to: "/admin", icon: Settings, label: "Admin Core", desc: "System Control", color: "from-slate-800 to-slate-900" },
          { to: "/display", icon: Monitor, label: "Display Node", desc: "Audience View", color: "from-indigo-900 to-slate-900" },
          { to: "/team", icon: Users, label: "Team Uplink", desc: "Participant Interface", color: "from-cyan-900 to-slate-900" }
        ].map((item, idx) => (
          <Link 
            key={idx}
            to={item.to} 
            className="group relative p-1 rounded-[2.5rem] bg-gradient-to-br from-white/10 to-white/5 hover:from-slate-800 hover:to-slate-700 transition-all duration-500 hover:scale-[1.02] hover:shadow-[0_0_40px_rgba(255,255,255,0.1)]"
          >
            <div className={`h-full bg-slate-950 rounded-[2.3rem] p-8 flex flex-col items-center text-center border border-white/5 relative overflow-hidden group-hover:bg-slate-900 transition-colors`}>
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <item.icon className="w-12 h-12 text-slate-500 group-hover:text-white transition-colors duration-300 mb-6 relative z-10" />
              <h2 className="text-2xl font-black text-white uppercase tracking-tight relative z-10">{item.label}</h2>
              <p className="text-slate-500 text-sm font-bold uppercase tracking-widest mt-2 group-hover:text-slate-300 transition-colors relative z-10">{item.desc}</p>
              
              <div className="mt-8 opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 relative z-10">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                  <ChevronRight className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
      
      {/* Dynamic QR Join Section */}
      <div className="mt-20 flex flex-col items-center gap-6 animate-in slide-in-from-bottom duration-1000 delay-500">
         <div className="bg-white/5 p-4 rounded-3xl border border-white/10 relative group">
            <QrCode className="w-24 h-24 text-indigo-400 group-hover:text-white transition-colors" />
            <div className="absolute inset-0 bg-indigo-500/10 blur-xl rounded-full -z-10 animate-pulse" />
         </div>
         <div className="text-center">
            <p className="text-[10px] font-black uppercase text-indigo-500 tracking-[0.4em]">Instant Link</p>
            <p className="text-slate-500 text-xs font-mono mt-1">DUK-AI-QUIZ.LIVE/NODE-JOIN</p>
         </div>
      </div>

      <footer className="mt-24 flex flex-wrap justify-center gap-8 text-[10px] font-black tracking-[0.3em] text-slate-600 uppercase">
        <span className="flex items-center gap-2"><Zap className="w-3 h-3" /> Neural Architecture</span>
        <span className="w-1 h-1 bg-slate-700 rounded-full my-auto hidden md:block"></span>
        <span>Low Latency Protocol</span>
        <span className="w-1 h-1 bg-slate-700 rounded-full my-auto hidden md:block"></span>
        <span>Neural Voice Synthesis</span>
      </footer>
    </div>
  </div>
);

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/admin" element={<AdminView />} />
        <Route path="/display" element={<DisplayView />} />
        <Route path="/team" element={<TeamView />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};

export default App;
