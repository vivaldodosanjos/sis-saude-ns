
import { User, Appointment, RegulacaoRecord, RegulacaoStatus, FisioterapiaRecord, FisioterapiaStatus, PrioridadeClinica, FisioterapiaSessao } from './types';

export const INITIAL_USERS: User[] = [
  { id: '1', email: 'admin@saude.com', name: 'Administrador', role: 'ADMIN', groupName: 'Admin', password: '123' },
  { id: '2', email: 'f1@saude.com', name: 'Equipe Fátima 1', role: 'FATIMA1', groupName: 'Unidade Fátima 1', password: '123' },
  { id: '3', email: 'f2@saude.com', name: 'Equipe Fátima 2', role: 'FATIMA2', groupName: 'Unidade Fátima 2', password: '123' },
  { id: '4', email: 're@saude.com', name: 'Gestor Regulação', role: 'REGULACAO', groupName: 'Regulação Central', password: '123' },
  { id: '5', email: 'em@saude.com', name: 'Equipe E-mult', role: 'EMULT', groupName: 'E-mult', password: '123' },
  
  // Novos Usuários
  { id: 's1', email: 's1@saude.com', name: 'Equipe Sede 1', role: 'SEDE1', groupName: 'Unidade Sede 1', password: '123' },
  { id: 's2', email: 's2@saude.com', name: 'Equipe Sede 2', role: 'SEDE2', groupName: 'Unidade Sede 2', password: '123' },
  { id: 'r1', email: 'r1@saude.com', name: 'Equipe Raso 1', role: 'RASO1', groupName: 'Unidade Raso 1', password: '123' },
  { id: 'r2', email: 'r2@saude.com', name: 'Equipe Raso 2', role: 'RASO2', groupName: 'Unidade Raso 2', password: '123' },
  { id: 'pa', email: 'pa@saude.com', name: 'Equipe Paiaiá', role: 'PAIAIA', groupName: 'Unidade Paiaiá', password: '123' },
  { id: 't1', email: 't1@saude.com', name: 'Equipe Torre 1', role: 'TORRE1', groupName: 'Unidade Torre 1', password: '123' },
  { id: 't2', email: 't2@saude.com', name: 'Equipe Torre 2', role: 'TORRE2', groupName: 'Unidade Torre 2', password: '123' },
  { id: 'me', email: 'me@saude.com', name: 'Equipe Melancia', role: 'MELANCIA', groupName: 'Unidade Melancia', password: '123' },
  { id: 'mo', email: 'mo@saude.com', name: 'Equipe Montealegre', role: 'MONTEALEGRE', groupName: 'Unidade Montealegre', password: '123' },
  { id: 'ca', email: 'ca@saude.com', name: 'Equipe Candeia', role: 'CANDEIA', groupName: 'Unidade Candeia', password: '123' },
];

const generateMockRegulacao = (): RegulacaoRecord[] => {
  const records: RegulacaoRecord[] = [];
  const especialidades = ['Cardiologia', 'Oftalmologia', 'Ortopedia', 'Ginecologia', 'Pediatria', 'Dermatologia', 'Neurologia', 'Urologia'];
  const statusList: RegulacaoStatus[] = ['AGUARDANDO', 'AGENDADO', 'DEVOLVIDO'];
  const acsNomes = ['Carlos Silva', 'Ana Paula', 'João Santos', 'Maria Oliveira', 'Roberto Costa'];

  INITIAL_USERS.forEach((user) => {
    for (let i = 1; i <= 30; i++) {
      const status = statusList[Math.floor(Math.random() * statusList.length)];
      const index = i.toString().padStart(2, '0');
      
      records.push({
        id: `mock-${user.role}-${index}`,
        dataRegistro: new Date(2024, 3, Math.floor(Math.random() * 28) + 1, 10, 0).toISOString(),
        cnsCpf: `${Math.floor(100 + Math.random() * 899)}.${Math.floor(100 + Math.random() * 899)}.${Math.floor(100 + Math.random() * 899)}-${Math.floor(10 + Math.random() * 89)}`,
        nomePaciente: `Paciente ${index} - ${user.groupName}`,
        nomeACS: acsNomes[Math.floor(Math.random() * acsNomes.length)],
        especialidade: especialidades[Math.floor(Math.random() * especialidades.length)],
        exameProcedimento: 'Consulta Especializada',
        status: status,
        dataAgendamento: status === 'AGENDADO' ? '2024-06-' + (Math.floor(Math.random() * 20) + 10) : undefined,
        criadoPor: user.name,
        criadoPorEmail: user.email,
        observacao: `Registro de teste gerado para validação do grupo ${user.role}.`
      });
    }
  });

  return records;
};

const generateMockFisioterapia = (): FisioterapiaRecord[] => {
  const records: FisioterapiaRecord[] = [];
  const ubsList = ['Fátima 1', 'Fátima 2', 'Sede 1', 'Sede 2', 'Raso 1', 'Paiaiá', 'Torre 1', 'Melancia'];
  const statusList: FisioterapiaStatus[] = ['AGUARDANDO', 'ADMITIDO', 'ALTA'];
  const prioridades: PrioridadeClinica[] = ['Eletivo', 'Prioritário', 'Urgente'];
  const acsNomes = ['Marta', 'Ricardo', 'Sueli', 'Tiago', 'Bruna'];

  for (let i = 1; i <= 30; i++) {
    const status = statusList[Math.floor(Math.random() * statusList.length)];
    const qtdSessoes = Math.floor(Math.random() * 10) + 5;
    const sessoes: FisioterapiaSessao[] = [];
    
    if (status !== 'AGUARDANDO') {
      for (let s = 1; s <= qtdSessoes; s++) {
        const executada = Math.random() > 0.2; // 80% chance de executada
        sessoes.push({
          numero: s,
          dataPrevista: new Date(2024, 4, s * 2).toISOString(),
          executada: status === 'ALTA' ? executada : (s < qtdSessoes / 2 ? executada : null),
          motivoNaoExecucao: !executada ? 'Paciente não compareceu' : undefined,
          dataRegistroAtendimento: status === 'ALTA' || s < qtdSessoes / 2 ? new Date(2024, 4, s * 2, 14, 0).toISOString() : undefined
        });
      }
    }

    records.push({
      id: `fisiomock-${i}`,
      dataRegistro: new Date(2024, 2, i, 9, 0).toISOString(),
      cnsCpf: `${Math.floor(100 + Math.random() * 899)}.${Math.floor(100 + Math.random() * 899)}.${Math.floor(100 + Math.random() * 899)}-${Math.floor(10 + Math.random() * 89)}`,
      nome: `Paciente Fisio ${i}`,
      ubsOrigem: ubsList[Math.floor(Math.random() * ubsList.length)],
      endereco: `Rua das Flores, nº ${i * 10}`,
      acs: acsNomes[Math.floor(Math.random() * acsNomes.length)],
      telefone: `(75) 9${Math.floor(8000 + Math.random() * 1999)}-${Math.floor(1000 + Math.random() * 8999)}`,
      cid: `M${Math.floor(40 + Math.random() * 20)}`,
      prioridade: prioridades[Math.floor(Math.random() * prioridades.length)],
      emailCriador: 'admin@saude.com',
      status: status,
      quantidadeSessoes: status !== 'AGUARDANDO' ? qtdSessoes : undefined,
      emailAdmissor: status !== 'AGUARDANDO' ? 'em@saude.com' : undefined,
      dataAdmissao: status !== 'AGUARDANDO' ? new Date(2024, 3, 1).toISOString() : undefined,
      sessoes: sessoes,
      observacao: "Paciente com dores crônicas encaminhado via UBS."
    });
  }
  return records;
};

export const MOCK_REGULACAO: RegulacaoRecord[] = generateMockRegulacao();
export const MOCK_FISIOTERAPIA: FisioterapiaRecord[] = generateMockFisioterapia();

export const MOCK_APPOINTMENTS: Appointment[] = [
  {
    id: '101',
    patientId: 'p1',
    patientName: 'Maria Silva Oliveira',
    type: 'NUTRICAO',
    date: '2024-06-15',
    status: 'PENDENTE',
    requestedBy: 'f1@saude.com'
  }
];

export const COLORS = {
  primary: 'blue-600',
  secondary: 'emerald-600',
  danger: 'rose-500',
  warning: 'amber-500',
  info: 'sky-500'
};
