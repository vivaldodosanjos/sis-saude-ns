
export type Role = 
  | 'ADMIN' 
  | 'REGULACAO' 
  | 'EMULT' 
  | 'FATIMA1' 
  | 'FATIMA2'
  | 'SEDE1'
  | 'SEDE2'
  | 'RASO1'
  | 'RASO2'
  | 'PAIAIA'
  | 'TORRE1'
  | 'TORRE2'
  | 'MELANCIA'
  | 'MONTEALEGRE'
  | 'CANDEIA';

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  groupName: string;
  password?: string;
}

export type AppointmentType = 'REGULACAO' | 'NUTRICAO' | 'FISIOTERAPIA' | 'PSICOLOGIA';
export type FisioterapiaStatus = 'AGUARDANDO' | 'ADMITIDO' | 'ALTA';
export type PrioridadeClinica = 'Eletivo' | 'Prioritário' | 'Urgente';

export interface FisioterapiaSessao {
  numero: number;
  dataPrevista: string;
  executada: boolean | null;
  motivoNaoExecucao?: string;
  dataRegistroAtendimento?: string;
}

export interface FisioterapiaRecord {
  id: string;
  dataRegistro: string;
  cnsCpf: string;
  nome: string;
  ubsOrigem: string;
  endereco: string;
  acs: string;
  telefone: string;
  cid: string;
  prioridade: PrioridadeClinica;
  emailCriador: string;
  status: FisioterapiaStatus;
  
  // Campos de Admissão
  quantidadeSessoes?: number;
  dataAdmissao?: string;
  emailAdmissor?: string;
  observacao?: string;
  sessoes: FisioterapiaSessao[];
}

export type RegulacaoStatus = 'AGUARDANDO' | 'AGENDADO' | 'DEVOLVIDO';
export type AtendimentoTipo = 'Eletivo' | 'Prioridade' | 'Urgente';

export interface RegulacaoRecord {
  id: string;
  dataRegistro: string; 
  cnsCpf: string;       
  nomePaciente: string; 
  nomeACS?: string;
  status: RegulacaoStatus;
  criadoPor: string;    
  criadoPorEmail: string;
  atendimento?: AtendimentoTipo;
  especialidade?: string;
  exameProcedimento?: string;
  endereco?: string;
  telefone?: string;
  cid?: string;
  tipo?: string;
  dataAgendamento?: string;
  dataEntrega?: string;
  observacao?: string;
  motivoAlteracao?: string;
  alteradoPor?: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  type: AppointmentType;
  date: string;
  status: 'PENDENTE' | 'CONFIRMADO' | 'REALIZADO' | 'CANCELADO';
  notes?: string;
  requestedBy: string;
}
