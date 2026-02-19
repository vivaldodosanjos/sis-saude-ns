import React, { useState } from 'react';
import { User, AppointmentType } from '../types';
import { RegulacaoModule } from './RegulacaoModule';
import { UserManagementModule } from './UserManagementModule';
import { EmultModule } from './EmultModule';
import { Permissions } from '../utils/permissions';

interface DashboardProps {
  user: User;
  allUsers: User[];
  onUpdateUsers: (users: User[]) => void;
  onDeleteUser: (userId: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ user, allUsers, onUpdateUsers, onDeleteUser }) => {
  const [activeModule, setActiveModule] = useState<'HOME' | 'REGULACAO' | 'EMULT' | 'USERS'>('HOME');
  const [selectedSpecialty, setSelectedSpecialty] = useState<AppointmentType | undefined>(undefined);

  const canAccessRegulacao = Permissions.canAccessRegulacao(user);
  const canAccessEmult = Permissions.canAccessEmult(user);
  const canManageUsers = Permissions.canManageUsers(user);

  const handleOpenEmult = (specialty?: AppointmentType) => {
    if (!canAccessEmult) return;
    setSelectedSpecialty(specialty);
    setActiveModule('EMULT');
  };

  if (activeModule === 'REGULACAO') {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <button onClick={() => setActiveModule('HOME')} className="text-sm font-bold text-slate-400 hover:text-slate-800 flex items-center gap-2 group transition-all">
            <i className="fas fa-arrow-left group-hover:-translate-x-1 transition-transform"></i> Voltar ao Painel
          </button>
          <div className="bg-indigo-50 text-indigo-700 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-indigo-100 shadow-sm">
            Módulo Regulação Ativo
          </div>
        </div>
        <RegulacaoModule user={user} />
      </div>
    );
  }

  if (activeModule === 'EMULT') {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <button onClick={() => { setActiveModule('HOME'); setSelectedSpecialty(undefined); }} className="text-sm font-bold text-slate-400 hover:text-slate-800 flex items-center gap-2 group transition-all">
            <i className="fas fa-arrow-left group-hover:-translate-x-1 transition-transform"></i> Voltar ao Painel
          </button>
          <div className="bg-amber-50 text-amber-700 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-amber-100 shadow-sm">
            Módulo Fisioterapia Ativo
          </div>
        </div>
        <EmultModule user={user} initialType={selectedSpecialty} />
      </div>
    );
  }

  if (activeModule === 'USERS') {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <button onClick={() => setActiveModule('HOME')} className="text-sm font-bold text-slate-400 hover:text-slate-800 flex items-center gap-2 group transition-all">
            <i className="fas fa-arrow-left group-hover:-translate-x-1 transition-transform"></i> Voltar ao Painel
          </button>
          <div className="bg-sky-50 text-sky-700 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-sky-100 shadow-sm">
            Módulo Administrativo Ativo
          </div>
        </div>
        <UserManagementModule 
          currentUser={user} 
          users={allUsers} 
          onUpdateUsers={onUpdateUsers} 
          onDeleteUser={onDeleteUser} 
        />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black text-slate-800 tracking-tight">Painel SISMUN</h2>
          <p className="text-slate-500 font-bold mt-1 uppercase text-xs tracking-widest">Bem-vindo, {user.name} • {user.groupName}</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          {canManageUsers && (
            <button 
              onClick={() => setActiveModule('USERS')}
              className="px-6 py-3 rounded-2xl font-black transition-all shadow-lg bg-slate-800 text-white hover:scale-105 active:scale-95 flex items-center gap-2 text-xs uppercase tracking-widest"
            >
              <i className="fas fa-users-cog text-sky-400"></i>
              Administração
            </button>
          )}

          {canAccessRegulacao && (
            <button 
              onClick={() => setActiveModule('REGULACAO')}
              className="px-6 py-3 rounded-2xl font-black transition-all shadow-xl bg-indigo-600 text-white shadow-indigo-100 hover:scale-105 active:scale-95 flex items-center gap-2 text-xs uppercase tracking-widest"
            >
              <i className="fas fa-file-signature"></i>
              Regulação
            </button>
          )}
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
        <div onClick={() => canAccessRegulacao && setActiveModule('REGULACAO')} className={`p-8 rounded-[40px] border-2 transition-all cursor-pointer group relative overflow-hidden ${canAccessRegulacao ? 'bg-white border-slate-100 hover:border-indigo-500 hover:shadow-2xl shadow-sm' : 'bg-slate-50 border-slate-100 opacity-50 grayscale cursor-not-allowed'}`}>
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/50 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700"></div>
          <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 mb-6 group-hover:scale-110 transition-transform relative z-10">
            <i className="fas fa-hospital-user text-3xl"></i>
          </div>
          <h3 className="text-2xl font-black text-slate-800 relative z-10">Regulação</h3>
          <p className="text-slate-500 mt-2 font-medium relative z-10">Gestão de encaminhamentos, exames e procedimentos especializados.</p>
        </div>

        <div className={`p-8 rounded-[40px] border-2 transition-all group relative overflow-hidden flex flex-col ${canAccessEmult ? 'bg-white border-slate-100 hover:shadow-2xl shadow-sm' : 'bg-slate-50 border-slate-100 opacity-50 grayscale cursor-not-allowed'}`}>
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-50/50 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700"></div>
          
          <div className="flex items-center gap-4 mb-6 relative z-10">
            <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 group-hover:rotate-12 transition-transform">
              <i className="fas fa-user-nurse text-3xl"></i>
            </div>
            <div>
              <h3 className="text-2xl font-black text-slate-800">Equipe E-mult</h3>
              <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Acompanhamento Especializado</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 relative z-10 mt-auto">
             <button 
              onClick={() => handleOpenEmult('FISIOTERAPIA')}
              className={`flex items-center justify-between p-5 rounded-2xl border-2 border-slate-50 bg-slate-50/50 hover:bg-amber-50 hover:border-amber-100 transition-all text-left ${!canAccessEmult ? 'pointer-events-none' : ''}`}
            >
              <div className="flex items-center gap-4">
                <i className="fas fa-crutch text-amber-500 text-xl"></i>
                <div className="flex flex-col">
                  <span className="font-black text-slate-800 text-sm uppercase leading-none mb-1">Fisioterapia</span>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Agendar Paciente</span>
                </div>
              </div>
              <i className="fas fa-arrow-right text-amber-400"></i>
            </button>

            <button disabled className="opacity-40 flex items-center justify-between p-5 rounded-2xl border-2 border-slate-50 bg-slate-50/50 cursor-not-allowed grayscale">
              <div className="flex items-center gap-4">
                <i className="fas fa-brain text-slate-400 text-xl"></i>
                <span className="font-black text-slate-400 text-sm uppercase">Psicologia (Breve)</span>
              </div>
            </button>

            <button disabled className="opacity-40 flex items-center justify-between p-5 rounded-2xl border-2 border-slate-50 bg-slate-50/50 cursor-not-allowed grayscale">
              <div className="flex items-center gap-4">
                <i className="fas fa-apple-alt text-slate-400 text-xl"></i>
                <span className="font-black text-slate-400 text-sm uppercase">Nutrição (Breve)</span>
              </div>
            </button>
          </div>
        </div>

        {canManageUsers && (
          <div onClick={() => setActiveModule('USERS')} className="p-8 rounded-[40px] border-2 transition-all cursor-pointer group relative overflow-hidden bg-white border-slate-100 hover:border-slate-800 hover:shadow-2xl shadow-sm">
            <div className="absolute top-0 right-0 w-32 h-32 bg-slate-100/50 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700"></div>
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-600 mb-6 group-hover:scale-110 transition-transform relative z-10">
              <i className="fas fa-users-cog text-3xl"></i>
            </div>
            <h3 className="text-2xl font-black text-slate-800 relative z-10">Administração</h3>
            <p className="text-slate-500 mt-2 font-medium relative z-10">Gerencie profissionais, unidades e permissões.</p>
          </div>
        )}
      </div>
    </div>
  );
};
