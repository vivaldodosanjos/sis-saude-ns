export type UserGroup = 
  | 'Fatima1' | 'Fatima2' | 'Sede1' | 'Sede2' | 'Raso1' | 'Raso2' 
  | 'Paiaia' | 'Torre1' | 'Torre2' | 'Melancia' | 'Montealegre' 
  | 'Candeia' | 'Regulacao' | 'Emult' | 'Admin';

export interface User {
  email: string;
  group: UserGroup;
}

export type PatientStatus = 'aguardando' | 'agendado' | 'devolvido';

export interface PatientRecord {
  id: string;
  registrationDate: string; // ISO string
  cnsCpf: string;
  name: string;
  acsName?: string;
  address?: string;
  phone?: string;
  specialty?: string;
  procedure?: string;
  type?: string;
  cid?: string;
  status: PatientStatus;
  appointmentDate?: string;
  deliveryDate?: string;
  observation?: string;
  createdBy: string; // user email
  group: UserGroup;
  changeReason?: string;
}

export interface EmultRecord {
  id: string;
  registrationDate: string;
  cnsCpf: string;
  name: string;
  category: 'Nutrição' | 'Fisioterapia' | 'Psicologia';
  createdBy: string;
  group: UserGroup;
}
