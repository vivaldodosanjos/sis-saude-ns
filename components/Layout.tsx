
import React, { useState } from 'react';
import { User } from '../types';

interface LayoutProps {
  user: User;
  onLogout: () => void;
  children: React.ReactNode;
}

// Representação SVG da Bandeira de Nova Soure para o Logo
const NovaSoureFlag = () => (
  <svg width="48" height="32" viewBox="0 0 300 200" className="rounded shadow-sm border border-white/20">
    <rect width="300" height="200" fill="#0099ff" />
    <path d="M0 0 L300 200 M300 0 L0 200" stroke="white" strokeWidth="40" />
    <path d="M150 0 L150 200 M0 100 L300 100" stroke="white" strokeWidth="40" />
    <circle cx="150" cy="100" r="50" fill="white" />
    <circle cx="150" cy="100" r="35" fill="#ffd700" /> {/* Representação simplificada da coroa */}
    <g fill="white">
      {[...Array(12)].map((_, i) => (
        <path key={i} transform={`rotate(${i * 30} 150 100) translate(0 -65)`} d="M0 -5 L1.5 -1.5 L5 0 L1.5 1.5 L0 5 L-1.5 1.5 L-5 0 L-1.5 -1.5 Z" />
      ))}
    </g>
  </svg>
);

export const Layout: React.FC<LayoutProps> = ({ user, onLogout, children }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Navbar */}
      <header className="sticky top-0 z-50 bg-slate-900 text-white shadow-lg border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            
            {/* Logo & Brand */}
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0">
                <NovaSoureFlag />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold tracking-tighter leading-none flex items-center gap-2">
                  SISMUN 
                  <span className="text-[10px] bg-sky-500/20 text-sky-400 px-1.5 py-0.5 rounded border border-sky-500/30">NOVA SOURE</span>
                </span>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Saúde Municipal</span>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1 mx-8">
              <button className="px-4 py-2 rounded-xl bg-slate-800 text-white font-bold flex items-center gap-2 border border-slate-700 transition-all">
                <i className="fas fa-calendar-alt text-sky-400"></i>
                Agendamentos
              </button>
              <button className="px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 font-bold flex items-center gap-2 transition-all">
                <i className="fas fa-chart-line"></i>
                Relatórios
              </button>
            </nav>

            {/* User Profile & Logout */}
            <div className="hidden md:flex items-center gap-6 pl-6 border-l border-slate-800">
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-sm font-black text-white leading-none">{user.name}</div>
                  <div className="text-[10px] text-sky-400 font-black uppercase mt-1 tracking-tighter">{user.role}</div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-sky-500 flex items-center justify-center text-sm font-black shadow-inner border border-sky-400/20">
                  {user.name.charAt(0)}
                </div>
              </div>
              <button 
                onClick={onLogout}
                className="group flex items-center gap-2 text-slate-400 hover:text-rose-400 transition-colors"
                title="Sair do sistema"
              >
                <i className="fas fa-sign-out-alt text-lg group-hover:translate-x-1 transition-transform"></i>
                <span className="text-xs font-bold uppercase">Sair</span>
              </button>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button 
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 focus:outline-none"
              >
                <i className={`fas ${isMobileMenuOpen ? 'fa-times' : 'fa-bars'} text-xl`}></i>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-slate-900 border-t border-slate-800 animate-in slide-in-from-top duration-200">
            <div className="px-4 pt-2 pb-6 space-y-3">
              <div className="flex items-center gap-3 px-3 py-4 border-b border-slate-800 mb-4">
                <div className="w-12 h-12 rounded-xl bg-sky-500 flex items-center justify-center text-lg font-black">
                  {user.name.charAt(0)}
                </div>
                <div>
                  <div className="text-base font-black text-white">{user.name}</div>
                  <div className="text-xs text-sky-400 font-bold uppercase">{user.role}</div>
                </div>
              </div>
              <button className="w-full flex items-center gap-4 px-4 py-3 rounded-xl bg-slate-800 text-white font-bold">
                <i className="fas fa-calendar-alt text-sky-400 w-5"></i>
                Agendamentos
              </button>
              <button className="w-full flex items-center gap-4 px-4 py-3 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 font-bold">
                <i className="fas fa-chart-line w-5"></i>
                Relatórios
              </button>
              <button 
                onClick={onLogout}
                className="w-full flex items-center gap-4 px-4 py-3 rounded-xl text-rose-400 hover:bg-rose-500/10 font-bold border border-rose-500/20 mt-4"
              >
                <i className="fas fa-sign-out-alt w-5"></i>
                Sair do Sistema
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-100 py-6">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">
            SISMUN © {new Date().getFullYear()} - Nova Soure/BA
          </p>
          <div className="flex items-center gap-2 opacity-50 grayscale hover:grayscale-0 transition-all cursor-help">
             <span className="text-[10px] font-black text-slate-400">PARCEIRO:</span>
             <NovaSoureFlag />
          </div>
        </div>
      </footer>
    </div>
  );
};
