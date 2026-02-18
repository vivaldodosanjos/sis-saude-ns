
import React, { useState, useEffect } from 'react';
import { User } from './types';
import { INITIAL_USERS } from './constants';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';

const NovaSoureFlag = () => (
  <svg width="60" height="40" viewBox="0 0 300 200" className="rounded-lg shadow-md border border-slate-200 mb-4">
    <rect width="300" height="200" fill="#0099ff" />
    <path d="M0 0 L300 200 M300 0 L0 200" stroke="white" strokeWidth="40" />
    <path d="M150 0 L150 200 M0 100 L300 100" stroke="white" strokeWidth="40" />
    <circle cx="150" cy="100" r="50" fill="white" />
    <circle cx="150" cy="100" r="35" fill="#ffd700" />
    <g fill="white">
      {[...Array(12)].map((_, i) => (
        <path key={i} transform={`rotate(${i * 30} 150 100) translate(0 -65)`} d="M0 -5 L1.5 -1.5 L5 0 L1.5 1.5 L0 5 L-1.5 1.5 L-5 0 L-1.5 -1.5 Z" />
      ))}
    </g>
  </svg>
);

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const savedUsers = localStorage.getItem('sismun_users_db');
    if (savedUsers) {
      setAllUsers(JSON.parse(savedUsers));
    } else {
      setAllUsers(INITIAL_USERS);
      localStorage.setItem('sismun_users_db', JSON.stringify(INITIAL_USERS));
    }

    const savedSession = localStorage.getItem('sismun_user');
    if (savedSession) {
      setUser(JSON.parse(savedSession));
    }
  }, []);

  const updateAllUsers = (newUsers: User[]) => {
    setAllUsers(newUsers);
    localStorage.setItem('sismun_users_db', JSON.stringify(newUsers));
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const foundUser = allUsers.find(u => u.email.toLowerCase() === loginEmail.toLowerCase());
    
    // Valida a senha individual do usuário (fallback para '123' se não definida)
    const userPassword = foundUser?.password || '123';

    if (foundUser && loginPass === userPassword) {
      setUser(foundUser);
      setError('');
      localStorage.setItem('sismun_user', JSON.stringify(foundUser));
    } else {
      setError('E-mail ou senha incorretos. Verifique suas credenciais.');
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('sismun_user');
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden font-sans">
        <div className="absolute top-0 -left-1/4 w-1/2 h-1/2 bg-sky-600/20 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-0 -right-1/4 w-1/2 h-1/2 bg-white/5 blur-[120px] rounded-full"></div>

        <div className="max-w-md w-full relative z-10">
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden p-8 md:p-10 border border-white/20">
            <div className="text-center mb-8 flex flex-col items-center">
              <NovaSoureFlag />
              <h1 className="text-3xl font-black text-slate-800 tracking-tight">SISMUN</h1>
              <p className="text-sky-600 font-bold text-sm mt-1 px-4 italic leading-tight">
                Você é a linha de frente da esperança!
              </p>
              <p className="text-slate-400 font-bold uppercase text-[9px] tracking-[0.2em] mt-2">
                Município de Nova Soure
              </p>
              <div className="h-1 w-12 bg-sky-500 rounded-full mt-3"></div>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">E-mail Corporativo</label>
                <div className="relative">
                  <span className="absolute left-4 top-3.5 text-slate-400">
                    <i className="fas fa-envelope"></i>
                  </span>
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl py-3 pl-11 pr-4 focus:outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-50 transition-all font-medium text-slate-700"
                    placeholder="ex: admin@saude.com"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-bold text-slate-700 mb-2 block uppercase tracking-wide">Senha</label>
                <div className="relative">
                  <span className="absolute left-4 top-3.5 text-slate-400">
                    <i className="fas fa-lock"></i>
                  </span>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={loginPass}
                    onChange={(e) => setLoginPass(e.target.value)}
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl py-3 pl-11 pr-12 focus:outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-50 transition-all font-medium text-slate-700"
                    placeholder="Sua senha de acesso"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-3.5 text-slate-400 hover:text-sky-600 transition-colors"
                  >
                    <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                  </button>
                </div>
              </div>

              {error && (
                <div className="p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl text-xs font-bold flex items-center gap-3 animate-head-shake">
                  <i className="fas fa-exclamation-circle text-sm"></i>
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-slate-800 hover:bg-slate-900 text-white font-black py-4 rounded-xl shadow-lg shadow-slate-200 transition-all transform hover:-translate-y-0.5 active:scale-95 flex items-center justify-center gap-3"
              >
                ACESSAR SISTEMA
                <i className="fas fa-arrow-right text-sky-400"></i>
              </button>
            </form>
            
            <div className="mt-8 text-center pt-6 border-t border-slate-100">
              <p className="text-xs text-slate-400 font-black uppercase tracking-widest">Secretaria de Saúde</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Layout user={user} onLogout={handleLogout}>
      <Dashboard 
        user={user} 
        allUsers={allUsers} 
        onUpdateUsers={updateAllUsers} 
      />
    </Layout>
  );
};

export default App;
