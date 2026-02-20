
import React from 'react';

interface ButtonProps {
  onClick?: () => void;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'ghost' | 'amber';
  disabled?: boolean;
  className?: string;
  type?: 'button' | 'submit';
}

export const Button: React.FC<ButtonProps> = ({ 
  onClick, 
  children, 
  variant = 'primary', 
  disabled, 
  className = '',
  type = 'button'
}) => {
  const baseStyles = 'relative overflow-hidden px-6 py-3 rounded-2xl font-black transition-all duration-300 active:scale-[0.96] disabled:opacity-40 disabled:cursor-not-allowed text-xs uppercase tracking-[0.2em] flex items-center justify-center';
  
  const variants = {
    primary: 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-[0_0_30px_rgba(79,70,229,0.4)] border border-indigo-400/30',
    secondary: 'bg-white/5 text-slate-300 border border-white/10 hover:bg-white/10 backdrop-blur-md',
    danger: 'bg-rose-600 text-white hover:bg-rose-500 shadow-[0_0_30px_rgba(225,29,72,0.4)] border border-rose-400/30',
    success: 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.4)] border border-emerald-400/30',
    amber: 'bg-amber-600 text-white hover:bg-amber-500 shadow-[0_0_30px_rgba(217,119,6,0.4)] border border-amber-400/30',
    ghost: 'bg-transparent text-slate-500 hover:text-white hover:bg-white/5',
  };

  return (
    <button 
      type={type}
      onClick={onClick} 
      disabled={disabled} 
      className={`${baseStyles} ${variants[variant]} ${className}`}
    >
      <span className="relative z-10">{children}</span>
    </button>
  );
};

export const Card: React.FC<{ children: React.ReactNode; className?: string; noPadding?: boolean }> = ({ children, className = '', noPadding = false }) => (
  <div className={`bg-slate-900/40 backdrop-blur-2xl rounded-[2.5rem] shadow-[0_20px_60px_rgba(0,0,0,0.5)] border border-white/10 ${noPadding ? '' : 'p-6 md:p-10'} ${className}`}>
    {children}
  </div>
);

export const Badge: React.FC<{ children: React.ReactNode; color?: string }> = ({ children, color = 'blue' }) => {
  const colors: Record<string, string> = {
    blue: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.2)]',
    green: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.2)]',
    red: 'bg-rose-500/10 text-rose-400 border-rose-500/30 shadow-[0_0_15px_rgba(244,63,94,0.2)]',
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.2)]',
    slate: 'bg-white/5 text-slate-400 border-white/10',
  };
  return (
    <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.25em] border ${colors[color]}`}>
      {children}
    </span>
  );
};

export const Timer: React.FC<{ seconds: number; max: number }> = ({ seconds, max }) => {
  const percentage = Math.max(0, (seconds / max) * 100);
  const colorClass = seconds < 10 ? 'bg-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.6)]' : seconds < 20 ? 'bg-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.6)]' : 'bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.6)]';
  
  return (
    <div className="w-full h-2.5 bg-white/5 rounded-full overflow-hidden border border-white/10 backdrop-blur-sm">
      <div 
        className={`h-full transition-all duration-1000 ease-linear ${colorClass} relative`} 
        style={{ width: `${percentage}%` }}
      >
        <div className="absolute top-0 right-0 bottom-0 w-1 bg-white/40 animate-pulse" />
      </div>
    </div>
  );
};
