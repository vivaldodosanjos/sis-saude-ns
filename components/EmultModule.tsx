
import React, { useState, useMemo, useEffect } from 'react';
import { User, AppointmentType, FisioterapiaRecord, FisioterapiaStatus, PrioridadeClinica, FisioterapiaSessao } from '../types';
import { MOCK_FISIOTERAPIA } from '../constants';

interface EmultModuleProps {
  user: User;
  initialType?: AppointmentType;
}

export const EmultModule: React.FC<EmultModuleProps> = ({ user, initialType }) => {
  const [records, setRecords] = useState<FisioterapiaRecord[]>([]);
  const [activeTab, setActiveTab] = useState<'LISTA' | 'NOVO' | 'DETALHES' | 'RELATORIO'>('LISTA');
  const [selectedRecord, setSelectedRecord] = useState<FisioterapiaRecord | null>(null);
  const [editingRecord, setEditingRecord] = useState<FisioterapiaRecord | null>(null);
  const [alert, setAlert] = useState<{ type: 'success' | 'error', msg: string } | null>(null);

  // Paginação e Limites
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Form de Registro Inicial
  const [formData, setFormData] = useState<Partial<FisioterapiaRecord>>({
    cnsCpf: '',
    nome: '',
    ubsOrigem: user.groupName,
    endereco: '',
    acs: '',
    telefone: '',
    cid: '',
    prioridade: 'Eletivo',
    status: 'AGUARDANDO'
  });

  // Persistência Local com Inicialização Mock
  useEffect(() => {
    const saved = localStorage.getItem('sismun_fisioterapia_db');
    if (saved && JSON.parse(saved).length > 0) {
      setRecords(JSON.parse(saved));
    } else {
      setRecords(MOCK_FISIOTERAPIA);
      localStorage.setItem('sismun_fisioterapia_db', JSON.stringify(MOCK_FISIOTERAPIA));
    }
  }, []);

  const saveToDB = (newRecords: FisioterapiaRecord[]) => {
    setRecords(newRecords);
    localStorage.setItem('sismun_fisioterapia_db', JSON.stringify(newRecords));
  };

  const showAlert = (type: 'success' | 'error', msg: string) => {
    setAlert({ type, msg });
    setTimeout(() => setAlert(null), 3000);
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('pt-BR');
  };

  // Lógica de Autocomplemento Inteligente
  const handleCnsChange = (val: string) => {
    setFormData(prev => ({ ...prev, cnsCpf: val }));
    if (val.length >= 5) {
      const match = records.find(r => r.cnsCpf === val);
      if (match) {
        setFormData(prev => ({
          ...prev,
          nome: match.nome,
          endereco: match.endereco,
          acs: match.acs,
          telefone: match.telefone,
          ubsOrigem: match.ubsOrigem
        }));
      }
    }
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const newRecord: FisioterapiaRecord = {
      ...formData as FisioterapiaRecord,
      id: Math.random().toString(36).substr(2, 9),
      dataRegistro: new Date().toISOString(),
      emailCriador: user.email,
      status: 'AGUARDANDO',
      sessoes: []
    };
    saveToDB([newRecord, ...records]);
    showAlert('success', 'Registro de Fisioterapia realizado com sucesso!');
    setActiveTab('LISTA');
    setFormData({ cnsCpf: '', nome: '', ubsOrigem: user.groupName, endereco: '', acs: '', telefone: '', cid: '', prioridade: 'Eletivo', status: 'AGUARDANDO' });
  };

  const handleUpdateRecord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecord) return;
    const updated = records.map(r => r.id === editingRecord.id ? editingRecord : r);
    saveToDB(updated);
    showAlert('success', 'Dados do paciente atualizados!');
    setEditingRecord(null);
  };

  const handleUpdateObservation = (recordId: string, obs: string) => {
    const updated = records.map(r => r.id === recordId ? { ...r, observacao: obs } : r);
    saveToDB(updated);
    const updatedRecord = updated.find(r => r.id === recordId);
    if (updatedRecord) setSelectedRecord(updatedRecord);
    showAlert('success', 'Observação do prontuário atualizada!');
  };

  // Lógica de Admissão
  const handleAdmitir = (recordId: string, qtdSessoes: number, obs: string) => {
    const updated = records.map(r => {
      if (r.id === recordId) {
        const sessoes: FisioterapiaSessao[] = Array.from({ length: qtdSessoes }, (_, i) => ({
          numero: i + 1,
          dataPrevista: '',
          executada: null
        }));
        return { 
          ...r, 
          status: 'ADMITIDO' as FisioterapiaStatus, 
          quantidadeSessoes: qtdSessoes, 
          observacao: obs,
          emailAdmissor: user.email,
          dataAdmissao: new Date().toISOString(),
          sessoes 
        };
      }
      return r;
    });
    saveToDB(updated);
    showAlert('success', 'Paciente admitido para tratamento!');
    setSelectedRecord(updated.find(r => r.id === recordId) || null);
  };

  // Registro de Sessão
  const handleUpdateSessao = (recordId: string, sessaoNum: number, executada: boolean, motivo?: string) => {
    const updated = records.map(r => {
      if (r.id === recordId) {
        const novasSessoes = r.sessoes.map(s => 
          s.numero === sessaoNum ? { ...s, executada, motivoNaoExecucao: motivo, dataRegistroAtendimento: new Date().toISOString() } : s
        );
        return { ...r, sessoes: novasSessoes };
      }
      return r;
    });
    saveToDB(updated);
    setSelectedRecord(updated.find(r => r.id === recordId) || null);
  };

  const handleAlta = (recordId: string) => {
    const updated = records.map(r => r.id === recordId ? { ...r, status: 'ALTA' as FisioterapiaStatus } : r);
    saveToDB(updated);
    showAlert('success', 'Paciente recebeu ALTA do tratamento.');
    setActiveTab('LISTA');
    setSelectedRecord(null);
  };

  // Lógica de Paginação
  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return records.slice(start, start + rowsPerPage);
  }, [records, currentPage, rowsPerPage]);

  const totalPages = Math.ceil(records.length / rowsPerPage);

  // Cálculos do Relatório
  const reportStats = useMemo(() => {
    const total = records.length;
    const aguardando = records.filter(r => r.status === 'AGUARDANDO').length;
    const admitido = records.filter(r => r.status === 'ADMITIDO').length;
    const alta = records.filter(r => r.status === 'ALTA').length;

    let totalSessoesPlanejadas = 0;
    let sessoesExecutadas = 0;
    let sessoesFaltas = 0;

    records.forEach(r => {
      r.sessoes.forEach(s => {
        if (s.executada !== null) {
          totalSessoesPlanejadas++;
          if (s.executada) sessoesExecutadas++;
          else sessoesFaltas++;
        }
      });
    });

    const ubsReferral = records.reduce((acc, r) => {
      acc[r.ubsOrigem] = (acc[r.ubsOrigem] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return { total, aguardando, admitido, alta, sessoesExecutadas, sessoesFaltas, ubsReferral };
  }, [records]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {alert && (
        <div className={`fixed top-4 right-4 z-[500] p-4 rounded-xl shadow-2xl flex items-center gap-3 animate-bounce bg-emerald-600 text-white`}>
          <i className="fas fa-check-circle"></i>
          <span className="font-bold">{alert.msg}</span>
        </div>
      )}

      {/* Navegação Interna */}
      <div className="flex flex-wrap items-center gap-4 bg-white p-2 rounded-2xl shadow-sm border border-slate-100 w-fit">
        <button onClick={() => { setActiveTab('LISTA'); setSelectedRecord(null); setEditingRecord(null); }} className={`px-6 py-2 rounded-xl font-bold transition-all ${activeTab === 'LISTA' ? 'bg-amber-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}>
          <i className="fas fa-list-ul mr-2"></i> Fila / Lista
        </button>
        <button onClick={() => setActiveTab('NOVO')} className={`px-6 py-2 rounded-xl font-bold transition-all ${activeTab === 'NOVO' ? 'bg-slate-800 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}>
          <i className="fas fa-plus-circle mr-2"></i> Novo Registro
        </button>
        <button onClick={() => setActiveTab('RELATORIO')} className={`px-6 py-2 rounded-xl font-bold transition-all ${activeTab === 'RELATORIO' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}>
          <i className="fas fa-chart-pie mr-2"></i> Relatório de Atendimento
        </button>
      </div>

      {activeTab === 'NOVO' && (
        <div className="bg-white rounded-[40px] shadow-xl border border-slate-100 overflow-hidden animate-in zoom-in duration-300">
          <div className="bg-slate-800 p-8 text-white">
            <h3 className="text-2xl font-black flex items-center gap-3"><i className="fas fa-crutch text-amber-400"></i> Fisioterapia - Novo Registro</h3>
            <p className="text-slate-400 font-medium mt-1">O sistema buscará dados anteriores automaticamente pelo CNS/CPF.</p>
          </div>
          <form onSubmit={handleCreate} className="p-10 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Data do Registro</label>
                <input disabled value={new Date().toLocaleDateString('pt-BR')} className="w-full bg-slate-100 border-2 border-slate-100 rounded-2xl px-5 py-4 font-bold text-slate-500 cursor-not-allowed" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">CNS ou CPF *</label>
                <input required value={formData.cnsCpf} onChange={e => handleCnsChange(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 focus:border-amber-500 outline-none transition-all font-bold" placeholder="000.000.000-00" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nome Completo *</label>
                <input required value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 focus:border-amber-500 outline-none transition-all font-bold" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">UBS de Origem</label>
                <input required value={formData.ubsOrigem} onChange={e => setFormData({...formData, ubsOrigem: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 focus:border-amber-500 outline-none transition-all" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nome do ACS</label>
                <input value={formData.acs} onChange={e => setFormData({...formData, acs: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 focus:border-amber-500 outline-none transition-all" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Telefone de Contato</label>
                <input value={formData.telefone} onChange={e => setFormData({...formData, telefone: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 focus:border-amber-500 outline-none transition-all" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">CID Principal</label>
                <input value={formData.cid} onChange={e => setFormData({...formData, cid: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 focus:border-amber-500 outline-none transition-all" placeholder="Ex: M54.5" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Prioridade Clinica</label>
                <select value={formData.prioridade} onChange={e => setFormData({...formData, prioridade: e.target.value as PrioridadeClinica})} className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 focus:border-amber-500 outline-none font-bold">
                  <option value="Eletivo">Eletivo</option>
                  <option value="Prioritário">Prioritário</option>
                  <option value="Urgente">Urgente</option>
                </select>
              </div>
              <div className="space-y-1 opacity-50">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Usuário Responsável</label>
                <input disabled value={user.email} className="w-full bg-slate-100 border-2 border-slate-100 rounded-2xl px-5 py-4 italic font-medium" />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Endereço Completo</label>
              <input value={formData.endereco} onChange={e => setFormData({...formData, endereco: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 focus:border-amber-500 outline-none transition-all" />
            </div>

            <div className="flex justify-end gap-4 pt-6 border-t border-slate-100">
              <button type="button" onClick={() => setActiveTab('LISTA')} className="px-8 py-4 font-black text-slate-400 uppercase tracking-widest hover:text-slate-800 transition-colors">Descartar</button>
              <button type="submit" className="px-12 py-4 bg-amber-600 text-white rounded-2xl font-black shadow-xl shadow-amber-100 hover:bg-amber-700 transition-all active:scale-95 uppercase tracking-widest">FINALIZAR REGISTRO</button>
            </div>
          </form>
        </div>
      )}

      {activeTab === 'LISTA' && (
        <div className="bg-white rounded-[40px] shadow-xl border border-slate-100 overflow-hidden">
          <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h4 className="text-xl font-black text-slate-800">Fila e Acompanhamento</h4>
              <p className="text-sm font-medium text-slate-500 uppercase tracking-widest">Módulo Fisioterapia</p>
            </div>
            
            {/* Seletor de Limite */}
            <div className="flex items-center gap-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Exibir:</label>
              <select 
                value={rowsPerPage} 
                onChange={(e) => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                className="bg-white border-2 border-slate-100 rounded-xl px-4 py-2 text-xs font-black outline-none focus:border-amber-500 transition-all"
              >
                <option value={10}>10 pacientes</option>
                <option value={30}>30 pacientes</option>
                <option value={50}>50 pacientes</option>
              </select>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-800 text-white">
                  <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest">Data Registro</th>
                  <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest">Paciente</th>
                  <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest">UBS Origem</th>
                  <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest">Admitido Por</th>
                  <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest">Prioridade</th>
                  <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest">Status</th>
                  <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedRecords.map(r => (
                  <tr key={r.id} className="hover:bg-slate-50 transition-all">
                    <td className="px-6 py-6 text-xs font-bold text-slate-500 uppercase whitespace-nowrap">
                      {formatDate(r.dataRegistro)}
                    </td>
                    <td className="px-6 py-6">
                      <div className="font-black text-slate-800">{r.nome}</div>
                      <div className="text-[10px] text-slate-400 font-bold tracking-widest">{r.cnsCpf}</div>
                    </td>
                    <td className="px-6 py-6">
                      <div className="text-xs font-bold text-slate-600 uppercase tracking-tighter bg-slate-50 px-2 py-1 rounded-md border border-slate-100 w-fit">
                        {r.ubsOrigem}
                      </div>
                    </td>
                    <td className="px-6 py-6">
                      {r.emailAdmissor ? (
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-[8px] font-black uppercase">
                            {r.emailAdmissor.charAt(0)}
                          </div>
                          <div className="text-[10px] font-medium text-slate-500 lowercase">{r.emailAdmissor}</div>
                        </div>
                      ) : (
                        <span className="text-[9px] font-black text-slate-300 uppercase italic">Aguardando</span>
                      )}
                    </td>
                    <td className="px-6 py-6">
                      <span className={`text-[10px] font-black px-3 py-1 rounded-full border-2 ${r.prioridade === 'Urgente' ? 'border-rose-200 bg-rose-50 text-rose-600' : 'border-slate-200 bg-slate-50 text-slate-600'}`}>
                        {r.prioridade.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-6">
                      <span className={`text-[10px] font-black px-3 py-1 rounded-full ${r.status === 'ADMITIDO' ? 'bg-emerald-100 text-emerald-700' : r.status === 'ALTA' ? 'bg-slate-800 text-white' : 'bg-amber-100 text-amber-700'}`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="px-6 py-6">
                      <div className="flex justify-center items-center gap-2">
                        <button 
                          onClick={() => { setSelectedRecord(r); setActiveTab('DETALHES'); }} 
                          className="bg-white border-2 border-slate-200 px-3 py-2 rounded-xl text-[9px] font-black text-slate-600 hover:border-emerald-500 hover:text-emerald-600 transition-all shadow-sm flex items-center gap-2"
                        >
                          <i className="fas fa-notes-medical"></i> GERENCIAR
                        </button>
                        <button 
                          onClick={() => setEditingRecord(r)} 
                          className="bg-white border-2 border-slate-200 p-2 rounded-xl text-slate-400 hover:border-amber-500 hover:text-amber-500 transition-all shadow-sm"
                          title="Editar Cadastro"
                        >
                          <i className="fas fa-user-edit text-xs"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {records.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-8 py-20 text-center text-slate-300 font-black uppercase tracking-[0.2em]">Sem registros na fila de Fisioterapia</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Rodapé de Paginação */}
          {records.length > 0 && (
            <div className="p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Mostrando {Math.min(records.length, (currentPage - 1) * rowsPerPage + 1)} - {Math.min(records.length, currentPage * rowsPerPage)} de {records.length} pacientes
              </div>
              <div className="flex gap-2">
                <button 
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => prev - 1)}
                  className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-amber-600 disabled:opacity-30 transition-all"
                >
                  <i className="fas fa-chevron-left"></i>
                </button>
                <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-800 text-white font-black text-xs">
                  {currentPage}
                </div>
                <button 
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => prev + 1)}
                  className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-amber-600 disabled:opacity-30 transition-all"
                >
                  <i className="fas fa-chevron-right"></i>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'RELATORIO' && (
        <div className="space-y-8 animate-in fade-in duration-500">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-8 rounded-[32px] shadow-sm border border-slate-100">
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Total de Pacientes</div>
              <div className="text-4xl font-black text-slate-800">{reportStats.total}</div>
            </div>
            <div className="bg-white p-8 rounded-[32px] shadow-sm border border-slate-100 border-l-8 border-l-amber-500">
              <div className="text-[10px] font-black text-amber-500 uppercase tracking-[0.2em] mb-2">Em Espera</div>
              <div className="text-4xl font-black text-slate-800">{reportStats.aguardando}</div>
            </div>
            <div className="bg-white p-8 rounded-[32px] shadow-sm border border-slate-100 border-l-8 border-l-emerald-500">
              <div className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em] mb-2">Em Atendimento</div>
              <div className="text-4xl font-black text-slate-800">{reportStats.admitido}</div>
            </div>
            <div className="bg-white p-8 rounded-[32px] shadow-sm border border-slate-100 border-l-8 border-l-slate-800">
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Altas Concluídas</div>
              <div className="text-4xl font-black text-slate-800">{reportStats.alta}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white p-10 rounded-[40px] shadow-xl border border-slate-100">
              <h5 className="text-xl font-black text-slate-800 mb-8 flex items-center gap-3">
                <i className="fas fa-tasks text-indigo-500"></i> Eficiência de Atendimento
              </h5>
              <div className="space-y-8">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Sessões Realizadas</span>
                    <span className="text-sm font-black text-emerald-600">{reportStats.sessoesExecutadas}</span>
                  </div>
                  <div className="w-full bg-slate-100 h-4 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full" style={{ width: `${(reportStats.sessoesExecutadas / (reportStats.sessoesExecutadas + reportStats.sessoesFaltas || 1)) * 100}%` }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Sessões Perdidas (Faltas)</span>
                    <span className="text-sm font-black text-rose-500">{reportStats.sessoesFaltas}</span>
                  </div>
                  <div className="w-full bg-slate-100 h-4 rounded-full overflow-hidden">
                    <div className="bg-rose-500 h-full" style={{ width: `${(reportStats.sessoesFaltas / (reportStats.sessoesExecutadas + reportStats.sessoesFaltas || 1)) * 100}%` }}></div>
                  </div>
                </div>
                <div className="pt-6 border-t border-slate-50 text-center">
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Taxa de Presença Geral</div>
                  <div className="text-3xl font-black text-indigo-600 mt-1">
                    {((reportStats.sessoesExecutadas / (reportStats.sessoesExecutadas + reportStats.sessoesFaltas || 1)) * 100).toFixed(1)}%
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white p-10 rounded-[40px] shadow-xl border border-slate-100">
              <h5 className="text-xl font-black text-slate-800 mb-8 flex items-center gap-3">
                <i className="fas fa-map-marker-alt text-amber-500"></i> Origem dos Encaminhamentos
              </h5>
              <div className="space-y-4">
                {Object.entries(reportStats.ubsReferral).sort((a,b) => b[1] - a[1]).map(([ubs, count]) => (
                  <div key={ubs} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                    <span className="font-bold text-slate-700 uppercase text-xs tracking-tighter">{ubs}</span>
                    <div className="flex items-center gap-3">
                       <span className="text-[10px] font-black text-slate-400">({count} pacientes)</span>
                       <span className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center font-black text-slate-800 text-xs shadow-sm">{count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'DETALHES' && selectedRecord && (
        <div className="space-y-6 animate-in slide-in-from-right duration-500">
          <div className="bg-white rounded-[40px] shadow-2xl border border-slate-100 overflow-hidden">
            <div className={`${selectedRecord.status === 'ADMITIDO' ? 'bg-emerald-600' : selectedRecord.status === 'ALTA' ? 'bg-slate-800' : 'bg-amber-600'} p-10 text-white flex justify-between items-center transition-colors`}>
              <div>
                <span className="text-[10px] font-black uppercase tracking-[0.3em] bg-white/20 px-3 py-1 rounded-full mb-4 inline-block">Prontuário de Fisioterapia</span>
                <h3 className="text-4xl font-black tracking-tighter">{selectedRecord.nome}</h3>
                <p className="mt-2 text-white/70 font-bold uppercase text-xs tracking-widest">{selectedRecord.ubsOrigem} • ACS {selectedRecord.acs}</p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-black mb-1">{selectedRecord.status}</div>
                <div className="text-[10px] font-bold text-white/60 uppercase tracking-widest">Desde {new Date(selectedRecord.dataRegistro).toLocaleDateString()}</div>
              </div>
            </div>

            <div className="p-10 grid grid-cols-1 lg:grid-cols-3 gap-10">
              {/* Painel Esquerdo: Info */}
              <div className="space-y-8">
                <div>
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Dados do Paciente</h4>
                  <div className="space-y-4">
                    <div className="p-4 bg-slate-50 rounded-2xl">
                      <div className="text-[9px] font-black text-slate-400 uppercase">CNS/CPF</div>
                      <div className="font-bold text-slate-800">{selectedRecord.cnsCpf}</div>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-2xl">
                      <div className="text-[9px] font-black text-slate-400 uppercase">Contato</div>
                      <div className="font-bold text-slate-800">{selectedRecord.telefone}</div>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-2xl">
                      <div className="text-[9px] font-black text-slate-400 uppercase">Endereço</div>
                      <div className="font-bold text-slate-800 text-xs">{selectedRecord.endereco}</div>
                    </div>
                  </div>
                </div>

                {/* Campo de Observação no Prontuário */}
                <div className="p-6 bg-slate-50 rounded-[32px] border-2 border-slate-100 space-y-4">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <i className="fas fa-sticky-note text-amber-500"></i> Observações do Prontuário
                  </h4>
                  <textarea 
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:border-amber-500 outline-none transition-all resize-none font-medium h-32"
                    placeholder="Notas clínicas, evolução ou lembretes..."
                    value={selectedRecord.observacao || ''}
                    onChange={(e) => {
                      const newObs = e.target.value;
                      setSelectedRecord({...selectedRecord, observacao: newObs});
                    }}
                  />
                  <button 
                    onClick={() => handleUpdateObservation(selectedRecord.id, selectedRecord.observacao || '')}
                    className="w-full bg-white border border-slate-200 text-slate-700 font-black py-2 rounded-xl text-[10px] uppercase tracking-widest hover:bg-slate-800 hover:text-white transition-all shadow-sm"
                  >
                    Salvar Observação
                  </button>
                </div>

                {selectedRecord.status === 'AGUARDANDO' && (
                  <div className="p-8 bg-amber-50 rounded-[32px] border-2 border-amber-100">
                    <h4 className="text-sm font-black text-amber-800 uppercase tracking-widest mb-6">Admitir Paciente</h4>
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-amber-600 uppercase">Qtd de Sessões Planejadas</label>
                        <input id="qtd_sessoes" type="number" min="1" className="w-full bg-white border-2 border-amber-200 rounded-xl px-4 py-3 outline-none focus:border-amber-500 font-bold" defaultValue="10" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-amber-600 uppercase">Observação / Diagnóstico</label>
                        <textarea id="obs_admissao" rows={3} className="w-full bg-white border-2 border-amber-200 rounded-xl px-4 py-3 outline-none focus:border-amber-500" placeholder="Informações clínicas..."></textarea>
                      </div>
                      <button 
                        onClick={() => {
                          const q = parseInt((document.getElementById('qtd_sessoes') as HTMLInputElement).value);
                          const o = (document.getElementById('obs_admissao') as HTMLTextAreaElement).value;
                          handleAdmitir(selectedRecord.id, q, o);
                        }}
                        className="w-full bg-amber-600 text-white font-black py-4 rounded-xl shadow-lg hover:bg-amber-700 transition-all uppercase text-xs"
                      >
                        CONFIRMAR ADMISSÃO
                      </button>
                    </div>
                  </div>
                )}

                {selectedRecord.status === 'ADMITIDO' && (
                  <button onClick={() => handleAlta(selectedRecord.id)} className="w-full bg-slate-900 text-white font-black py-6 rounded-3xl shadow-xl hover:bg-black transition-all flex items-center justify-center gap-3 uppercase text-xs">
                    <i className="fas fa-check-double text-emerald-400"></i> DAR ALTA AO PACIENTE
                  </button>
                )}
              </div>

              {/* Painel Central/Direito: Sessões */}
              <div className="lg:col-span-2 space-y-6">
                {selectedRecord.status === 'AGUARDANDO' ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-12 border-4 border-dashed border-slate-100 rounded-[40px] text-slate-300">
                    <i className="fas fa-history text-6xl mb-4"></i>
                    <p className="font-black uppercase tracking-[0.2em]">Aguardando Admissão clínica para iniciar o cronograma de sessões</p>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cronograma de Atendimento ({selectedRecord.sessoes.length} Sessões)</h4>
                      <div className="text-[10px] font-black text-emerald-600 uppercase">Admitido por: {selectedRecord.emailAdmissor}</div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedRecord.sessoes.map(s => (
                        <div key={s.numero} className={`p-6 rounded-3xl border-2 transition-all ${s.executada === true ? 'bg-emerald-50 border-emerald-100' : s.executada === false ? 'bg-rose-50 border-rose-100' : 'bg-white border-slate-100 shadow-sm'}`}>
                          <div className="flex justify-between items-start mb-4">
                            <span className="w-8 h-8 rounded-lg bg-slate-800 text-white flex items-center justify-center font-black text-xs">{s.numero}</span>
                            {s.dataRegistroAtendimento && (
                              <span className="text-[8px] font-black text-slate-400 uppercase">{new Date(s.dataRegistroAtendimento).toLocaleString('pt-BR')}</span>
                            )}
                          </div>
                          
                          {s.executada === null ? (
                            <div className="space-y-4">
                              <p className="text-xs font-bold text-slate-500">Registrar atendimento da sessão:</p>
                              <div className="flex gap-2">
                                <button onClick={() => handleUpdateSessao(selectedRecord.id, s.numero, true)} className="flex-1 bg-emerald-600 text-white text-[10px] font-black py-3 rounded-xl hover:bg-emerald-700">EXECUÇÃO OK</button>
                                <button onClick={() => {
                                  const mot = window.prompt("Motivo da não execução:");
                                  if(mot) handleUpdateSessao(selectedRecord.id, s.numero, false, mot);
                                }} className="flex-1 bg-rose-100 text-rose-600 text-[10px] font-black py-3 rounded-xl hover:bg-rose-200">FALTA / CANCELADO</button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${s.executada ? 'bg-emerald-200 text-emerald-700' : 'bg-rose-200 text-rose-700'}`}>
                                <i className={`fas ${s.executada ? 'fa-check' : 'fa-times'}`}></i>
                              </div>
                              <div>
                                <div className={`text-xs font-black uppercase ${s.executada ? 'text-emerald-700' : 'text-rose-700'}`}>
                                  {s.executada ? 'Sessão Executada' : 'Sessão Não Realizada'}
                                </div>
                                {s.motivoNaoExecucao && <div className="text-[10px] font-medium text-rose-500">Motivo: {s.motivoNaoExecucao}</div>}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Edição de Cadastro */}
      {editingRecord && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-4xl overflow-hidden animate-in zoom-in duration-300">
            <div className="p-8 bg-amber-600 text-white flex justify-between items-center">
              <div>
                <h4 className="font-black text-2xl flex items-center gap-3">
                  <i className="fas fa-user-edit"></i> Editar Cadastro do Paciente
                </h4>
                <p className="text-amber-100 text-xs font-bold uppercase tracking-widest mt-1">Alteração de dados demográficos e clínicos</p>
              </div>
              <button onClick={() => setEditingRecord(null)} className="text-white/60 hover:text-white transition-colors"><i className="fas fa-times text-2xl"></i></button>
            </div>
            <form onSubmit={handleUpdateRecord} className="p-10 space-y-8 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">CNS ou CPF</label>
                  <input required value={editingRecord.cnsCpf} onChange={e => setEditingRecord({...editingRecord, cnsCpf: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 focus:border-amber-500 outline-none font-bold" />
                </div>
                <div className="md:col-span-2 space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nome Completo</label>
                  <input required value={editingRecord.nome} onChange={e => setEditingRecord({...editingRecord, nome: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 focus:border-amber-500 outline-none font-bold" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">UBS Origem</label>
                  <input required value={editingRecord.ubsOrigem} onChange={e => setEditingRecord({...editingRecord, ubsOrigem: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 focus:border-amber-500 outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ACS</label>
                  <input value={editingRecord.acs} onChange={e => setEditingRecord({...editingRecord, acs: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 focus:border-amber-500 outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Telefone</label>
                  <input value={editingRecord.telefone} onChange={e => setEditingRecord({...editingRecord, telefone: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 focus:border-amber-500 outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">CID</label>
                  <input value={editingRecord.cid} onChange={e => setEditingRecord({...editingRecord, cid: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 focus:border-amber-500 outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Prioridade</label>
                  <select value={editingRecord.prioridade} onChange={e => setEditingRecord({...editingRecord, prioridade: e.target.value as PrioridadeClinica})} className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 focus:border-amber-500 outline-none font-bold">
                    <option value="Eletivo">Eletivo</option>
                    <option value="Prioritário">Prioritário</option>
                    <option value="Urgente">Urgente</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Endereço Completo</label>
                <input value={editingRecord.endereco} onChange={e => setEditingRecord({...editingRecord, endereco: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 focus:border-amber-500 outline-none" />
              </div>
              
              <div className="pt-8 border-t border-slate-100 flex justify-end gap-4">
                <button type="button" onClick={() => setEditingRecord(null)} className="px-8 py-4 font-black text-slate-400 uppercase text-xs tracking-widest hover:text-slate-800 transition-colors">Cancelar</button>
                <button type="submit" className="px-12 py-4 bg-amber-600 text-white rounded-2xl font-black shadow-xl hover:bg-amber-700 transition-all active:scale-95 uppercase text-xs tracking-widest">SALVAR ALTERAÇÕES</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
