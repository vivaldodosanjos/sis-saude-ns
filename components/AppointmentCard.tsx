
import React from 'react';
import { Appointment } from '../types';

interface AppointmentCardProps {
  appointment: Appointment;
  onUpdateStatus: (id: string, status: Appointment['status']) => void;
}

export const AppointmentCard: React.FC<AppointmentCardProps> = ({ appointment, onUpdateStatus }) => {
  const getStatusColor = (status: Appointment['status']) => {
    switch (status) {
      case 'PENDENTE': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'CONFIRMADO': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'REALIZADO': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'CANCELADO': return 'bg-rose-100 text-rose-700 border-rose-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getTypeLabel = (type: Appointment['type']) => {
    switch (type) {
      case 'REGULACAO': return { label: 'Regulação', icon: 'fa-file-signature', color: 'text-indigo-600' };
      case 'NUTRICAO': return { label: 'Nutrição', icon: 'fa-apple-alt', color: 'text-emerald-600' };
      case 'FISIOTERAPIA': return { label: 'Fisioterapia', icon: 'fa-crutch', color: 'text-amber-600' };
      case 'PSICOLOGIA': return { label: 'Psicologia', icon: 'fa-brain', color: 'text-rose-600' };
    }
  };

  const { label, icon, color } = getTypeLabel(appointment.type);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div>
          <span className={`text-[10px] font-bold px-2 py-1 rounded-full border mb-2 inline-block ${getStatusColor(appointment.status)}`}>
            {appointment.status}
          </span>
          <h3 className="font-semibold text-slate-800 text-lg">{appointment.patientName}</h3>
          <div className="flex items-center gap-2 mt-1 text-slate-500 text-sm font-medium">
            <i className={`fas ${icon} ${color}`}></i>
            {label}
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm font-bold text-slate-700">{new Date(appointment.date).toLocaleDateString('pt-BR')}</div>
          <div className="text-xs text-slate-400">Data Agendada</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mt-6">
        <button 
          onClick={() => onUpdateStatus(appointment.id, 'CONFIRMADO')}
          className="flex-1 bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-200 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:text-emerald-700 transition-all flex items-center justify-center gap-2"
        >
          <i className="fas fa-check"></i> Confirmar
        </button>
        <button 
          onClick={() => onUpdateStatus(appointment.id, 'CANCELADO')}
          className="flex-1 bg-slate-50 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:text-rose-700 transition-all flex items-center justify-center gap-2"
        >
          <i className="fas fa-times"></i> Cancelar
        </button>
      </div>
    </div>
  );
};
