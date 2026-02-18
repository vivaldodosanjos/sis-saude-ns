
import { User, RegulacaoRecord, RegulacaoStatus, AtendimentoTipo } from '../types';
import { MOCK_REGULACAO, INITIAL_USERS } from '../constants';
import { Permissions } from '../utils/permissions';
import React, { useState, useMemo, useRef } from 'react';

interface RegulacaoModuleProps {
  user: User;
}

export const RegulacaoModule: React.FC<RegulacaoModuleProps> = ({ user }) => {
  const [records, setRecords] = useState<RegulacaoRecord[]>(MOCK_REGULACAO);
  const [activeTab, setActiveTab] = useState<'BUSCA' | 'NOVO'>('BUSCA');
  const [alert, setAlert] = useState<{ type: 'success' | 'error', msg: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [filters, setFilters] = useState({
    nome: '', 
    cnsCpf: '', 
    acs: '', 
    especialidade: '', 
    status: '', 
    dataRegistro: '',
    origem: '',
    atendimento: '' 
  });
  const [sortConfig, setSortConfig] = useState<{ key: keyof RegulacaoRecord, direction: 'asc' | 'desc' } | null>(null);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const [formData, setFormData] = useState<Partial<RegulacaoRecord>>({
    status: 'AGUARDANDO',
    cnsCpf: '',
    nomePaciente: '',
    nomeACS: '',
    endereco: '',
    telefone: '',
    especialidade: '',
    exameProcedimento: '',
    tipo: '',
    cid: '',
    atendimento: 'Eletivo',
    observacao: ''
  });

  const [editingRecord, setEditingRecord] = useState<RegulacaoRecord | null>(null);
  const [changeReason, setChangeReason] = useState('');

  const canImportExport = Permissions.canImportExportData(user);
  const canDelete = Permissions.canDeleteRecords(user);
  const canEditSensitive = Permissions.canEditSensitiveFields(user);
  const canFilterByOrigin = Permissions.canViewAllRegulacaoRecords(user);

  const showAlert = (type: 'success' | 'error', msg: string) => {
    setAlert({ type, msg });
    setTimeout(() => setAlert(null), 3000);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const newRecord: RegulacaoRecord = {
      ...formData as RegulacaoRecord,
      id: Math.random().toString(36).substr(2, 9),
      dataRegistro: new Date().toISOString(),
      criadoPor: user.name,
      criadoPorEmail: user.email,
      status: formData.status as RegulacaoStatus || 'AGUARDANDO'
    };
    setRecords([newRecord, ...records]);
    showAlert('success', 'Paciente registrado com sucesso na regulação!');
    setFormData({ 
      status: 'AGUARDANDO', 
      cnsCpf: '', 
      nomePaciente: '', 
      atendimento: 'Eletivo', 
      especialidade: '', 
      exameProcedimento: '',
      nomeACS: '',
      telefone: '',
      endereco: '',
      cid: '',
      tipo: '',
      observacao: ''
    });
    setActiveTab('BUSCA');
  };

  const handleUpdate = () => {
    if (!editingRecord || !changeReason) return;
    setRecords(prev => prev.map(r => r.id === editingRecord.id ? { 
      ...editingRecord, 
      motivoAlteracao: changeReason,
      alteradoPor: user.name 
    } : r));
    setEditingRecord(null);
    setChangeReason('');
    showAlert('success', 'Registro atualizado com sucesso!');
  };

  // FUNÇÃO PARA EXCLUIR REGISTRO (CORREÇÃO FUNCIONAL)
  const handleDelete = (id: string) => {
    if (window.confirm('ATENÇÃO: Deseja realmente excluir este registro permanentemente? Esta ação não poderá ser desfeita.')) {
      setRecords(prevRecords => {
        const filtered = prevRecords.filter(r => r.id !== id);
        return filtered;
      });
      showAlert('success', 'Registro removido com sucesso!');
    }
  };

  // FUNÇÃO PARA BAIXAR MODELO DE IMPORTAÇÃO
  const handleDownloadTemplate = () => {
    const headers = [
      'CNS/CPF',
      'Nome Paciente',
      'Especialidade',
      'Procedimento',
      'ACS',
      'Telefone',
      'CID',
      'Atendimento',
      'Endereco',
      'Observacao'
    ];
    
    const exampleRow = [
      '000.000.000-00',
      'NOME DO PACIENTE EXEMPLO',
      'CARDIOLOGIA',
      'CONSULTA',
      'NOME DO ACS',
      '(75) 99999-9999',
      'I10',
      'Eletivo',
      'RUA EXEMPLO, 123',
      'PACIENTE COM HIPERTENSAO'
    ];

    const csvContent = [
      headers.join(';'),
      exampleRow.join(';')
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'modelo_importacao_sismun.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showAlert('success', 'Modelo de importação baixado!');
  };

  // FUNCIONALIDADE DE EXPORTAÇÃO CSV
  const handleExportCSV = () => {
    if (processedRecords.length === 0) {
      showAlert('error', 'Não há dados para exportar com os filtros atuais.');
      return;
    }

    const headers = [
      'Data Registro',
      'CNS/CPF',
      'Paciente',
      'Especialidade',
      'Procedimento',
      'Unidade/Origem',
      'Status',
      'Atendimento',
      'ACS',
      'Observação'
    ];

    const rows = processedRecords.map(r => [
      formatDate(r.dataRegistro),
      r.cnsCpf,
      r.nomePaciente,
      r.especialidade || '',
      r.exameProcedimento || '',
      r.criadoPor,
      r.status,
      r.atendimento || 'Eletivo',
      r.nomeACS || '',
      (r.observacao || '').replace(/\n/g, ' ')
    ]);

    const csvContent = [
      headers.join(';'),
      ...rows.map(row => row.join(';'))
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `regulacao_sismun_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showAlert('success', 'Exportação concluída!');
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      showAlert('success', `Arquivo "${file.name}" processado com sucesso!`);
      if (e.target) e.target.value = '';
    }
  };

  const visibleRecords = useMemo(() => {
    return records.filter(record => Permissions.canSeeRecord(user, record));
  }, [records, user]);

  const stats = useMemo(() => {
    return {
      total: visibleRecords.length,
      aguardando: visibleRecords.filter(r => r.status === 'AGUARDANDO').length,
      agendado: visibleRecords.filter(r => r.status === 'AGENDADO').length,
      devolvido: visibleRecords.filter(r => r.status === 'DEVOLVIDO').length,
    };
  }, [visibleRecords]);

  const processedRecords = useMemo(() => {
    let filtered = visibleRecords.filter(r => {
      const matchNome = r.nomePaciente.toLowerCase().includes(filters.nome.toLowerCase());
      const matchCns = r.cnsCpf.includes(filters.cnsCpf);
      const matchStatus = filters.status === '' || r.status === filters.status;
      const matchAcs = (r.nomeACS || '').toLowerCase().includes(filters.acs.toLowerCase());
      const matchEspecialidade = (r.especialidade || '').toLowerCase().includes(filters.especialidade.toLowerCase());
      const matchOrigem = filters.origem === '' || r.criadoPor === filters.origem;
      const matchAtendimento = filters.atendimento === '' || r.atendimento === filters.atendimento;
      return matchNome && matchCns && matchStatus && matchAcs && matchEspecialidade && matchOrigem && matchAtendimento;
    });

    if (sortConfig) {
      filtered.sort((a, b) => {
        const valA = (a[sortConfig.key] || '').toString().toLowerCase();
        const valB = (b[sortConfig.key] || '').toString().toLowerCase();
        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return filtered;
  }, [visibleRecords, filters, sortConfig]);

  const paginatedRecords = processedRecords.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const toggleSort = (key: keyof RegulacaoRecord) => {
    setSortConfig(prev => ({
      key,
      direction: prev?.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const getStatusRowClass = (status: RegulacaoStatus) => {
    switch (status) {
      case 'AGENDADO': return 'bg-blue-50 text-blue-900 border-l-4 border-blue-500';
      case 'DEVOLVIDO': return 'bg-amber-50 text-amber-900 border-l-4 border-amber-500';
      case 'AGUARDANDO': return 'bg-rose-50 text-rose-900 border-l-4 border-rose-500';
      default: return '';
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    try {
      const datePart = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
      const [year, month, day] = datePart.split('-');
      return `${day}/${month}/${year}`;
    } catch { return dateStr; }
  };

  return (
    <div className="space-y-6">
      {alert && (
        <div className={`fixed top-4 right-4 z-[200] p-4 rounded-xl shadow-2xl flex items-center gap-3 animate-bounce ${alert.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
          <i className={`fas ${alert.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-triangle'}`}></i>
          <span className="font-bold">{alert.msg}</span>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 transition-all hover:shadow-md">
          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600"><i className="fas fa-users text-lg"></i></div>
          <div>
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total</div>
            <div className="text-xl font-black text-slate-800">{stats.total}</div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 transition-all hover:shadow-md">
          <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600"><i className="fas fa-clock text-lg"></i></div>
          <div>
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Aguardando</div>
            <div className="text-xl font-black text-slate-800">{stats.aguardando}</div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 transition-all hover:shadow-md">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600"><i className="fas fa-calendar-check text-lg"></i></div>
          <div>
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Agendados</div>
            <div className="text-xl font-black text-slate-800">{stats.agendado}</div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 transition-all hover:shadow-md">
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600"><i className="fas fa-undo-alt text-lg"></i></div>
          <div>
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Devolvidos</div>
            <div className="text-xl font-black text-slate-800">{stats.devolvido}</div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4 bg-white p-2 rounded-2xl shadow-sm border border-slate-100 w-fit">
        <button onClick={() => setActiveTab('BUSCA')} className={`px-6 py-2 rounded-xl font-bold transition-all ${activeTab === 'BUSCA' ? 'bg-slate-800 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}>
          <i className="fas fa-search mr-2"></i> Consulta
        </button>
        <button onClick={() => setActiveTab('NOVO')} className={`px-6 py-2 rounded-xl font-bold transition-all ${activeTab === 'NOVO' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}>
          <i className="fas fa-plus mr-2"></i> Novo Registro
        </button>
      </div>

      {activeTab === 'NOVO' ? (
        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in duration-300">
          <div className="bg-slate-800 p-6 text-white">
            <h3 className="text-xl font-bold flex items-center gap-3"><i className="fas fa-file-medical text-emerald-400"></i> Cadastro de Paciente - Regulação</h3>
            <p className="text-slate-400 text-sm mt-1">Campos com * são de preenchimento obrigatório.</p>
          </div>
          <form onSubmit={handleSave} className="p-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-1 opacity-60">
              <label className="text-xs font-black text-slate-500 uppercase">Data do Registro (Auto)</label>
              <input disabled value={new Date().toLocaleDateString('pt-BR')} className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-3 cursor-not-allowed" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-black text-slate-500 uppercase">CNS/CPF *</label>
              <input required value={formData.cnsCpf} onChange={(e) => setFormData({...formData, cnsCpf: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:border-emerald-500 outline-none" placeholder="000.000.000-00" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-black text-slate-500 uppercase">Nome Completo *</label>
              <input required value={formData.nomePaciente} onChange={(e) => setFormData({...formData, nomePaciente: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:border-emerald-500 outline-none" placeholder="Nome do Paciente" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-black text-slate-500 uppercase">Especialidade</label>
              <input value={formData.especialidade} onChange={(e) => setFormData({...formData, especialidade: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:border-emerald-500 outline-none" placeholder="Ex: Cardiologia" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-black text-slate-500 uppercase">Exame/Procedimento</label>
              <input value={formData.exameProcedimento} onChange={(e) => setFormData({...formData, exameProcedimento: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:border-emerald-500 outline-none" placeholder="Ex: Ecocardiograma" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-black text-slate-500 uppercase">Nome do ACS</label>
              <input value={formData.nomeACS} onChange={(e) => setFormData({...formData, nomeACS: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:border-emerald-500 outline-none" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-black text-slate-500 uppercase">Telefone</label>
              <input value={formData.telefone} onChange={(e) => setFormData({...formData, telefone: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:border-emerald-500 outline-none" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-black text-slate-500 uppercase">CID</label>
              <input value={formData.cid} onChange={(e) => setFormData({...formData, cid: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:border-emerald-500 outline-none" placeholder="Ex: I10" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-black text-slate-500 uppercase">Atendimento</label>
              <select value={formData.atendimento} onChange={(e) => setFormData({...formData, atendimento: e.target.value as AtendimentoTipo})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:border-emerald-500 outline-none">
                <option value="Eletivo">Eletivo</option>
                <option value="Prioridade">Prioridade</option>
                <option value="Urgente">Urgente</option>
              </select>
            </div>
            <div className="md:col-span-3 space-y-1">
              <label className="text-xs font-black text-slate-500 uppercase">Endereço</label>
              <input value={formData.endereco} onChange={(e) => setFormData({...formData, endereco: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:border-emerald-500 outline-none" placeholder="Rua, Número, Bairro..." />
            </div>
            <div className="md:col-span-3 space-y-1">
              <label className="text-xs font-black text-slate-500 uppercase">Observações</label>
              <textarea value={formData.observacao} onChange={(e) => setFormData({...formData, observacao: e.target.value})} rows={3} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:border-emerald-500 outline-none"></textarea>
            </div>
            <div className="md:col-span-3 pt-4 border-t border-slate-100 flex justify-end gap-4">
              <button type="button" onClick={() => setActiveTab('BUSCA')} className="px-8 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-100">Cancelar</button>
              <button type="submit" className="px-12 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black shadow-lg flex items-center gap-2">SALVAR REGISTRO <i className="fas fa-save"></i></button>
            </div>
          </form>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><i className="fas fa-filter text-slate-300"></i> Filtros de Busca</h4>
              {canImportExport && (
                <button onClick={handleDownloadTemplate} className="text-indigo-600 text-[10px] font-black hover:underline flex items-center gap-1 uppercase">
                  <i className="fas fa-download"></i> Baixar Modelo CSV
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Paciente</label>
                <input placeholder="Nome..." value={filters.nome} onChange={(e) => setFilters({...filters, nome: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 text-sm outline-none" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">CNS/CPF</label>
                <input placeholder="000.000..." value={filters.cnsCpf} onChange={(e) => setFilters({...filters, cnsCpf: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 text-sm outline-none" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Status</label>
                <select value={filters.status} onChange={(e) => setFilters({...filters, status: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 text-sm outline-none">
                  <option value="">Todos</option>
                  <option value="AGUARDANDO">Aguardando</option>
                  <option value="AGENDADO">Agendado</option>
                  <option value="DEVOLVIDO">Devolvido</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Atendimento</label>
                <select value={filters.atendimento} onChange={(e) => setFilters({...filters, atendimento: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 text-sm outline-none">
                  <option value="">Todos</option>
                  <option value="Eletivo">Eletivo</option>
                  <option value="Prioridade">Prioridade</option>
                  <option value="Urgente">Urgente</option>
                </select>
              </div>
              <div className={`space-y-1 ${!canFilterByOrigin ? 'opacity-30' : ''}`}>
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Usuário/Origem</label>
                <select disabled={!canFilterByOrigin} value={filters.origem} onChange={(e) => setFilters({...filters, origem: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 text-sm outline-none">
                  <option value="">Todas Unidades</option>
                  {INITIAL_USERS.map(u => (<option key={u.id} value={u.name}>{u.name}</option>))}
                </select>
              </div>
              <div className="flex items-end gap-2 lg:col-span-2">
                {canImportExport && (
                  <>
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".csv" />
                    <button onClick={handleImportClick} className="flex-1 bg-emerald-600 text-white text-[10px] font-black py-2.5 rounded-xl flex items-center justify-center gap-2 hover:bg-emerald-700 transition-colors shadow-sm active:scale-95"><i className="fas fa-file-import"></i> IMPORTAR</button>
                    <button onClick={handleExportCSV} className="flex-1 bg-indigo-600 text-white text-[10px] font-black py-2.5 rounded-xl flex items-center justify-center gap-2 hover:bg-indigo-700 transition-colors shadow-sm active:scale-95"><i className="fas fa-file-export"></i> EXPORTAR</button>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-800 text-white">
                    <th onClick={() => toggleSort('dataRegistro')} className="px-4 py-4 text-[10px] font-black uppercase cursor-pointer hover:bg-slate-700 whitespace-nowrap">Data <i className="fas fa-sort ml-1"></i></th>
                    <th className="px-4 py-4 text-[10px] font-black uppercase whitespace-nowrap">CNS/CPF</th>
                    <th onClick={() => toggleSort('nomePaciente')} className="px-4 py-4 text-[10px] font-black uppercase cursor-pointer hover:bg-slate-700">Paciente <i className="fas fa-sort ml-1"></i></th>
                    <th onClick={() => toggleSort('especialidade')} className="px-4 py-4 text-[10px] font-black uppercase cursor-pointer hover:bg-slate-700">Especialidade <i className="fas fa-sort ml-1"></i></th>
                    <th onClick={() => toggleSort('exameProcedimento')} className="px-4 py-4 text-[10px] font-black uppercase cursor-pointer hover:bg-slate-700">Procedimento <i className="fas fa-sort ml-1"></i></th>
                    <th onClick={() => toggleSort('criadoPor')} className="px-4 py-4 text-[10px] font-black uppercase cursor-pointer hover:bg-slate-700 whitespace-nowrap">Origem <i className="fas fa-sort ml-1"></i></th>
                    <th className="px-4 py-4 text-[10px] font-black uppercase whitespace-nowrap">Status</th>
                    <th className="px-4 py-4 text-[10px] font-black uppercase text-center whitespace-nowrap">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedRecords.length > 0 ? paginatedRecords.map((record) => (
                    <tr key={record.id} className={`hover:brightness-95 transition-all ${getStatusRowClass(record.status)}`}>
                      <td className="px-4 py-4 text-xs font-medium whitespace-nowrap">{formatDate(record.dataRegistro)}</td>
                      <td className="px-4 py-4 text-xs whitespace-nowrap">{record.cnsCpf}</td>
                      <td className="px-4 py-4 text-xs font-bold">{record.nomePaciente}</td>
                      <td className="px-4 py-4 text-xs font-medium text-slate-600">{record.especialidade || '-'}</td>
                      <td className="px-4 py-4 text-xs font-medium text-slate-600">{record.exameProcedimento || '-'}</td>
                      <td className="px-4 py-4 text-xs font-medium text-slate-500 uppercase tracking-tighter whitespace-nowrap">{record.criadoPor}</td>
                      <td className="px-4 py-4 text-[10px] font-black">
                        <div className="flex flex-col gap-0.5">
                          <span>{record.status}</span>
                          {record.atendimento && <span className={`text-[8px] px-1 rounded-sm w-fit ${record.atendimento === 'Urgente' ? 'bg-rose-500 text-white' : record.atendimento === 'Prioridade' ? 'bg-amber-500 text-white' : 'bg-slate-400 text-white'}`}>{record.atendimento.toUpperCase()}</span>}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <div className="flex justify-center items-center gap-2">
                          <button 
                            onClick={() => { setEditingRecord(record); setChangeReason(''); }} 
                            className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/50 border border-slate-200 hover:text-indigo-600 transition-colors shadow-sm"
                            title="Editar Registro"
                          >
                            <i className="fas fa-edit"></i>
                          </button>
                          {canDelete && (
                            <button 
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleDelete(record.id);
                              }} 
                              className="w-8 h-8 flex items-center justify-center rounded-lg bg-rose-50 text-rose-600 border border-rose-100 hover:bg-rose-600 hover:text-white transition-all shadow-sm"
                              title="Excluir Registro permanentemente"
                            >
                              <i className="fas fa-trash-alt"></i>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )) : (<tr><td colSpan={8} className="px-4 py-12 text-center text-slate-400 font-bold uppercase tracking-widest bg-slate-50/50">Nenhum registro encontrado.</td></tr>)}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {editingRecord && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl overflow-hidden animate-in zoom-in duration-300">
            <div className="p-6 bg-slate-800 text-white flex justify-between items-center">
              <h4 className="font-bold text-lg flex items-center gap-3"><i className="fas fa-user-edit text-emerald-400"></i> Edição de Registro</h4>
              <button onClick={() => setEditingRecord(null)} className="text-slate-400 hover:text-white transition-colors"><i className="fas fa-times text-xl"></i></button>
            </div>
            <div className="p-8 space-y-6 max-h-[85vh] overflow-y-auto">
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase">CNS/CPF * (Obrigatório)</label>
                  <input 
                    disabled={!canEditSensitive} 
                    value={editingRecord.cnsCpf} 
                    onChange={(e) => setEditingRecord({...editingRecord, cnsCpf: e.target.value})} 
                    className={`w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm outline-none ${!canEditSensitive ? 'cursor-not-allowed opacity-60' : 'focus:border-indigo-500 focus:bg-white'}`} 
                  />
                  {!canEditSensitive && <p className="text-[8px] text-slate-400 mt-1 italic font-medium uppercase tracking-tighter">Campo restrito ao Administrador</p>}
                </div>
                <div className="md:col-span-2 space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase">Nome Completo * (Obrigatório)</label>
                  <input 
                    disabled={!canEditSensitive} 
                    value={editingRecord.nomePaciente} 
                    onChange={(e) => setEditingRecord({...editingRecord, nomePaciente: e.target.value})} 
                    className={`w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm outline-none ${!canEditSensitive ? 'cursor-not-allowed opacity-60' : 'focus:border-indigo-500 focus:bg-white'}`} 
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-600 uppercase">Especialidade (Livre)</label>
                  <input value={editingRecord.especialidade || ''} onChange={(e) => setEditingRecord({...editingRecord, especialidade: e.target.value})} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm focus:border-indigo-500" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-600 uppercase">Procedimento (Livre)</label>
                  <input value={editingRecord.exameProcedimento || ''} onChange={(e) => setEditingRecord({...editingRecord, exameProcedimento: e.target.value})} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm focus:border-indigo-500" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-600 uppercase">Nome ACS (Livre)</label>
                  <input value={editingRecord.nomeACS || ''} onChange={(e) => setEditingRecord({...editingRecord, nomeACS: e.target.value})} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm focus:border-indigo-500" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-600 uppercase">Status (Livre)</label>
                  <select value={editingRecord.status} onChange={(e) => setEditingRecord({...editingRecord, status: e.target.value as RegulacaoStatus})} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-indigo-700 focus:border-indigo-500 cursor-pointer">
                    <option value="AGUARDANDO">AGUARDANDO</option>
                    <option value="AGENDADO">AGENDADO</option>
                    <option value="DEVOLVIDO">DEVOLVIDO</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-600 uppercase">Telefone</label>
                  <input value={editingRecord.telefone || ''} onChange={(e) => setEditingRecord({...editingRecord, telefone: e.target.value})} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm focus:border-indigo-500" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-600 uppercase">CID</label>
                  <input value={editingRecord.cid || ''} onChange={(e) => setEditingRecord({...editingRecord, cid: e.target.value})} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm focus:border-indigo-500" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-600 uppercase">Data Agend.</label>
                  <input type="date" value={editingRecord.dataAgendamento || ''} onChange={(e) => setEditingRecord({...editingRecord, dataAgendamento: e.target.value})} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm focus:border-indigo-500" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-600 uppercase">Data Entrega</label>
                  <input type="date" value={editingRecord.dataEntrega || ''} onChange={(e) => setEditingRecord({...editingRecord, dataEntrega: e.target.value})} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm focus:border-indigo-500" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-600 uppercase">Endereço</label>
                <input value={editingRecord.endereco || ''} onChange={(e) => setEditingRecord({...editingRecord, endereco: e.target.value})} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm focus:border-indigo-500" />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-600 uppercase">Observações</label>
                <textarea value={editingRecord.observacao || ''} onChange={(e) => setEditingRecord({...editingRecord, observacao: e.target.value})} rows={2} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm focus:border-indigo-500"></textarea>
              </div>

              <div className="p-6 bg-indigo-50 border-2 border-indigo-100 rounded-3xl space-y-3">
                <label className="text-xs font-black text-indigo-700 uppercase">Justificativa da Alteração *</label>
                <textarea required value={changeReason} onChange={(e) => setChangeReason(e.target.value)} placeholder="Obrigatório: Descreva por que está alterando este registro..." className="w-full bg-white border-2 border-indigo-200 rounded-2xl px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50" rows={2}></textarea>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button onClick={() => setEditingRecord(null)} className="px-6 py-2 font-bold text-slate-500 uppercase text-xs hover:text-slate-800 transition-colors">Descartar</button>
                <button disabled={!changeReason} onClick={handleUpdate} className="px-10 py-3 bg-indigo-600 text-white rounded-2xl font-black shadow-xl disabled:opacity-50 uppercase text-xs transition-all active:scale-95 hover:bg-indigo-700">Salvar Alterações</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
