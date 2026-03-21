/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  Plus, 
  LogOut, 
  ChevronDown, 
  ChevronUp, 
  Download, 
  Upload, 
  Edit2, 
  Trash2, 
  AlertCircle, 
  CheckCircle2, 
  Menu,
  X,
  Stethoscope,
  Users as UsersIcon,
  Filter,
  ArrowUpDown,
  History
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import * as XLSX from 'xlsx';
import { User, UserGroup, PatientRecord, PatientStatus, EmultRecord } from './types';

// Predefined users
const PREDEFINED_USERS: Record<string, { group: UserGroup; pass: string }> = {
  'f1@saude.com': { group: 'Fatima1', pass: '123' },
  'f2@saude.com': { group: 'Fatima2', pass: '123' },
  's1@saude.com': { group: 'Sede1', pass: '123' },
  's2@saude.com': { group: 'Sede2', pass: '123' },
  'r1@saude.com': { group: 'Raso1', pass: '123' },
  'r2@saude.com': { group: 'Raso2', pass: '123' },
  'pa@saude.com': { group: 'Paiaia', pass: '123' },
  't1@saude.com': { group: 'Torre1', pass: '123' },
  't2@saude.com': { group: 'Torre2', pass: '123' },
  'me@saude.com': { group: 'Melancia', pass: '123' },
  'mo@saude.com': { group: 'Montealegre', pass: '123' },
  'ca@saude.com': { group: 'Candeia', pass: '123' },
  're@saude.com': { group: 'Regulacao', pass: '123' },
  'em@saude.com': { group: 'Emult', pass: '123' },
  'admin@saude.com': { group: 'Admin', pass: '123' },
};

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [loginError, setLoginError] = useState('');

  const [view, setView] = useState<'menu' | 'regulacao' | 'emult'>('menu');
  const [emultCategory, setEmultCategory] = useState<'Nutrição' | 'Fisioterapia' | 'Psicologia' | null>(null);

  const [records, setRecords] = useState<PatientRecord[]>([]);
  const [emultRecords, setEmultRecords] = useState<EmultRecord[]>([]);
  
  const [showForm, setShowForm] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState<PatientRecord | null>(null);
  const [changeReason, setChangeReason] = useState('');
  const [showReasonModal, setShowReasonModal] = useState(false);
  const [pendingUpdate, setPendingUpdate] = useState<PatientRecord | null>(null);

  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Filters
  const [filters, setFilters] = useState({
    registrationDate: '',
    cnsCpf: '',
    name: '',
    acsName: '',
    specialty: '',
    procedure: '',
    type: '',
    status: '' as PatientStatus | '',
    appointmentDate: '',
    deliveryDate: '',
  });

  // Pagination & Sorting
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState<{ key: keyof PatientRecord; direction: 'asc' | 'desc' } | null>(null);

  useEffect(() => {
    const savedRecords = localStorage.getItem('sismun_records');
    const savedEmult = localStorage.getItem('sismun_emult');
    if (savedRecords) setRecords(JSON.parse(savedRecords));
    if (savedEmult) setEmultRecords(JSON.parse(savedEmult));
  }, []);

  useEffect(() => {
    localStorage.setItem('sismun_records', JSON.stringify(records));
  }, [records]);

  useEffect(() => {
    localStorage.setItem('sismun_emult', JSON.stringify(emultRecords));
  }, [emultRecords]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const user = PREDEFINED_USERS[loginEmail];
    if (user && user.pass === loginPass) {
      setCurrentUser({ email: loginEmail, group: user.group });
      setLoginError('');
    } else {
      setLoginError('E-mail ou senha incorretos.');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setView('menu');
    setEmultCategory(null);
  };

  const showAlert = (type: 'success' | 'error', message: string) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 3000);
  };

  const handleSaveRecord = (formData: Partial<PatientRecord>) => {
    if (editingRecord) {
      // If editing, require reason
      setPendingUpdate({ ...editingRecord, ...formData } as PatientRecord);
      setShowReasonModal(true);
    } else {
      const newRecord: PatientRecord = {
        id: crypto.randomUUID(),
        registrationDate: new Date().toISOString(),
        cnsCpf: formData.cnsCpf || '',
        name: formData.name || '',
        acsName: formData.acsName,
        address: formData.address,
        phone: formData.phone,
        specialty: formData.specialty,
        procedure: formData.procedure,
        type: formData.type,
        cid: formData.cid,
        status: formData.status || 'aguardando',
        appointmentDate: formData.appointmentDate,
        deliveryDate: formData.deliveryDate,
        observation: formData.observation,
        createdBy: currentUser!.email,
        group: currentUser!.group,
      };
      setRecords([newRecord, ...records]);
      showAlert('success', 'Registro efetuado com sucesso!');
      setShowForm(false);
    }
  };

  const confirmUpdate = () => {
    if (pendingUpdate && changeReason) {
      const updatedRecords = records.map(r => 
        r.id === pendingUpdate.id ? { ...pendingUpdate, changeReason } : r
      );
      setRecords(updatedRecords);
      showAlert('success', 'Registro atualizado com sucesso!');
      setShowReasonModal(false);
      setPendingUpdate(null);
      setChangeReason('');
      setEditingRecord(null);
      setShowForm(false);
    }
  };

  const handleDelete = (id: string) => {
    if (currentUser?.group !== 'Admin') return;
    if (window.confirm('Tem certeza que deseja excluir este registro?')) {
      setRecords(records.filter(r => r.id !== id));
      showAlert('success', 'Registro excluído com sucesso!');
    }
  };

  // Visibility Logic
  const visibleRecords = useMemo(() => {
    if (!currentUser) return [];
    let filtered = records;
    
    // Group visibility
    if (currentUser.group !== 'Admin' && currentUser.group !== 'Regulacao') {
      filtered = filtered.filter(r => r.group === currentUser.group);
    }

    // Search Filters
    filtered = filtered.filter(r => {
      return (
        (!filters.registrationDate || r.registrationDate.includes(filters.registrationDate)) &&
        (!filters.cnsCpf || r.cnsCpf.toLowerCase().includes(filters.cnsCpf.toLowerCase())) &&
        (!filters.name || r.name.toLowerCase().includes(filters.name.toLowerCase())) &&
        (!filters.acsName || r.acsName?.toLowerCase().includes(filters.acsName.toLowerCase())) &&
        (!filters.specialty || r.specialty?.toLowerCase().includes(filters.specialty.toLowerCase())) &&
        (!filters.procedure || r.procedure?.toLowerCase().includes(filters.procedure.toLowerCase())) &&
        (!filters.type || r.type?.toLowerCase().includes(filters.type.toLowerCase())) &&
        (!filters.status || r.status === filters.status) &&
        (!filters.appointmentDate || r.appointmentDate?.includes(filters.appointmentDate)) &&
        (!filters.deliveryDate || r.deliveryDate?.includes(filters.deliveryDate))
      );
    });

    // Sorting
    if (sortConfig) {
      filtered.sort((a, b) => {
        const aVal = a[sortConfig.key] || '';
        const bVal = b[sortConfig.key] || '';
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [records, currentUser, filters, sortConfig]);

  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return visibleRecords.slice(start, start + pageSize);
  }, [visibleRecords, currentPage, pageSize]);

  const totalPages = Math.ceil(visibleRecords.length / pageSize);

  const handleExport = () => {
    if (currentUser?.group !== 'Admin') return;
    const worksheet = XLSX.utils.json_to_sheet(visibleRecords);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Registros");
    XLSX.writeFile(workbook, "SISMUN_Export.xlsx");
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (currentUser?.group !== 'Admin' || !e.target.files) return;
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws) as PatientRecord[];
      // Add IDs if missing and ensure group/createdBy
      const processed = data.map(r => ({
        ...r,
        id: r.id || crypto.randomUUID(),
        registrationDate: r.registrationDate || new Date().toISOString(),
        createdBy: r.createdBy || currentUser.email,
        group: r.group || currentUser.group,
      }));
      setRecords([...processed, ...records]);
      showAlert('success', `${processed.length} registros importados!`);
    };
    reader.readAsBinaryString(file);
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden"
        >
          <div className="p-8 text-center border-b border-gray-100">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
                <Stethoscope className="text-white w-8 h-8" />
              </div>
            </div>
            <h1 className="text-4xl font-bold text-[#1e293b] mb-1">SISMUN</h1>
            <p className="text-blue-500 font-medium italic text-base">Você é a linha de frente da esperança!</p>
            <p className="text-gray-400 text-xs uppercase tracking-widest mt-2">Município de Nova Soure</p>
            <div className="w-12 h-1 bg-blue-500 mx-auto mt-4 rounded-full"></div>
          </div>

          <form onSubmit={handleLogin} className="p-8 space-y-6">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">E-mail Corporativo</label>
              <div className="relative">
                <UsersIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input 
                  type="email" 
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="ex: admin@saude.com"
                  className="w-full bg-gray-50 border-none rounded-2xl py-4 pl-12 pr-4 text-lg text-gray-700 focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Senha</label>
              <div className="relative">
                <X className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input 
                  type="password" 
                  value={loginPass}
                  onChange={(e) => setLoginPass(e.target.value)}
                  placeholder="Sua senha de acesso"
                  className="w-full bg-gray-50 border-none rounded-2xl py-4 pl-12 pr-4 text-lg text-gray-700 focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                  required
                />
              </div>
            </div>

            {loginError && (
              <div className="flex items-center gap-2 text-red-500 text-base bg-red-50 p-3 rounded-xl">
                <AlertCircle className="w-4 h-4" />
                <span>{loginError}</span>
              </div>
            )}

            <button 
              type="submit"
              className="w-full bg-[#1e293b] text-white text-lg font-bold py-4 rounded-2xl shadow-lg hover:bg-[#334155] transition-all flex items-center justify-center gap-2 group"
            >
              ACESSAR SISTEMA
              <motion.span animate={{ x: [0, 5, 0] }} transition={{ repeat: Infinity, duration: 1.5 }}>
                <ChevronDown className="w-5 h-5 rotate-270" />
              </motion.span>
            </button>

            <div className="pt-4 text-center">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Secretaria de Saúde</p>
            </div>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center text-white">
            <Stethoscope className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#1e293b]">SISMUN</h2>
            <p className="text-xs text-gray-400 uppercase font-bold tracking-tighter">{currentUser.group}</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-base text-gray-500 hidden sm:block">{currentUser.email}</span>
          <button 
            onClick={handleLogout}
            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="flex-1 p-6">
        <AnimatePresence mode="wait">
          {view === 'menu' ? (
            <motion.div 
              key="menu"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 pt-12"
            >
              <button 
                onClick={() => currentUser.group === 'Emult' ? showAlert('error', 'Acesso negado à Regulação.') : setView('regulacao')}
                className={`group p-8 rounded-[2.5rem] text-left transition-all shadow-xl hover:shadow-2xl flex flex-col justify-between h-auto min-h-[18rem] ${
                  currentUser.group === 'Emult' ? 'bg-gray-100 opacity-50 cursor-not-allowed' : 'bg-white hover:-translate-y-2'
                }`}
              >
                <div className="w-14 h-14 bg-blue-500 rounded-2xl flex items-center justify-center text-white mb-4 shadow-lg shadow-blue-100">
                  <History className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-3xl font-bold text-[#1e293b] mb-2">Regulação</h3>
                  <p className="text-gray-500 text-base">Gerenciamento de encaminhamentos, exames e especialidades.</p>
                </div>
              </button>

              <div className="bg-white p-8 rounded-[2.5rem] shadow-xl flex flex-col h-auto min-h-[18rem]">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-100">
                    <UsersIcon className="w-8 h-8" />
                  </div>
                  <h3 className="text-3xl font-bold text-[#1e293b]">E-mult</h3>
                </div>
                <div className="grid grid-cols-1 gap-2 pb-4">
                  {['Nutrição', 'Fisioterapia', 'Psicologia'].map((cat) => (
                    <button 
                      key={cat}
                      onClick={() => {
                        setEmultCategory(cat as any);
                        setView('emult');
                      }}
                      className="w-full text-left py-3 px-4 rounded-xl hover:bg-emerald-50 text-gray-600 hover:text-emerald-600 text-lg font-medium transition-all flex items-center justify-between group"
                    >
                      {cat}
                      <ChevronDown className="w-4 h-4 -rotate-90 opacity-0 group-hover:opacity-100 transition-all" />
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          ) : view === 'regulacao' ? (
            <motion.div 
              key="regulacao"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <button onClick={() => setView('menu')} className="p-2 hover:bg-gray-200 rounded-full transition-all">
                    <X className="w-5 h-5" />
                  </button>
                  <h2 className="text-3xl font-bold text-[#1e293b]">Regulação</h2>
                </div>
                
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setShowReportModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition-all text-base font-medium"
                  >
                    <History className="w-4 h-4" /> Relatórios
                  </button>
                  {currentUser.group === 'Admin' && (
                    <>
                      <button 
                        onClick={handleExport}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition-all text-base font-medium"
                      >
                        <Download className="w-4 h-4" /> Exportar
                      </button>
                      <label className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition-all text-base font-medium cursor-pointer">
                        <Upload className="w-4 h-4" /> Importar
                        <input type="file" className="hidden" accept=".xlsx,.csv,.ods" onChange={handleImport} />
                      </label>
                    </>
                  )}
                  <button 
                    onClick={() => {
                      setEditingRecord(null);
                      setShowForm(true);
                    }}
                    className="flex items-center gap-2 px-6 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-all text-base font-bold shadow-lg shadow-blue-100"
                  >
                    <Plus className="w-4 h-4" /> Novo Registro
                  </button>
                </div>
              </div>

              {/* Filters */}
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-400 uppercase">Nome do Paciente</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input 
                      type="text" 
                      placeholder="Buscar..."
                      value={filters.name}
                      onChange={(e) => setFilters({...filters, name: e.target.value})}
                      className="w-full bg-gray-50 border-none rounded-xl py-2 pl-9 pr-4 text-base focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-400 uppercase">CNS/CPF</label>
                  <input 
                    type="text" 
                    value={filters.cnsCpf}
                    onChange={(e) => setFilters({...filters, cnsCpf: e.target.value})}
                    className="w-full bg-gray-50 border-none rounded-xl py-2 px-4 text-base focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-400 uppercase">Status</label>
                  <select 
                    value={filters.status}
                    onChange={(e) => setFilters({...filters, status: e.target.value as any})}
                    className="w-full bg-gray-50 border-none rounded-xl py-2 px-4 text-base focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="">Todos</option>
                    <option value="aguardando">Aguardando</option>
                    <option value="agendado">Agendado</option>
                    <option value="devolvido">Devolvido</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-400 uppercase">Especialidade</label>
                  <input 
                    type="text" 
                    value={filters.specialty}
                    onChange={(e) => setFilters({...filters, specialty: e.target.value})}
                    className="w-full bg-gray-50 border-none rounded-xl py-2 px-4 text-base focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div className="flex items-end">
                  <button 
                    onClick={() => setFilters({
                      registrationDate: '', cnsCpf: '', name: '', acsName: '', specialty: '', 
                      procedure: '', type: '', status: '', appointmentDate: '', deliveryDate: ''
                    })}
                    className="w-full py-2 text-gray-400 hover:text-gray-600 text-base font-medium transition-all"
                  >
                    Limpar Filtros
                  </button>
                </div>
              </div>

              {/* Table */}
              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100">
                        {[
                          { key: 'registrationDate', label: 'Data Registro' },
                          { key: 'cnsCpf', label: 'CNS/CPF' },
                          { key: 'name', label: 'Paciente' },
                          { key: 'acsName', label: 'ACS' },
                          { key: 'specialty', label: 'Especialidade' },
                          { key: 'status', label: 'Status' },
                          { key: 'changeReason', label: 'Motivo Alteração' },
                          { key: 'createdBy', label: 'Usuário' }
                        ].map((col) => (
                          <th 
                            key={col.key}
                            onClick={() => setSortConfig({
                              key: col.key as any,
                              direction: sortConfig?.key === col.key && sortConfig.direction === 'asc' ? 'desc' : 'asc'
                            })}
                            className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-all"
                          >
                            <div className="flex items-center gap-2">
                              {col.label}
                              <ArrowUpDown className="w-3 h-3" />
                            </div>
                          </th>
                        ))}
                        <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedRecords.map((record) => (
                        <tr 
                          key={record.id}
                          className={`border-b border-gray-50 transition-all hover:bg-gray-50/50 ${
                            record.status === 'agendado' ? 'bg-blue-50/30' : 
                            record.status === 'devolvido' ? 'bg-yellow-50/30' : 
                            'bg-red-50/30'
                          }`}
                        >
                          <td className="px-6 py-4 text-base text-gray-600">{new Date(record.registrationDate).toLocaleDateString()}</td>
                          <td className="px-6 py-4 text-base font-medium text-gray-700">{record.cnsCpf}</td>
                          <td className="px-6 py-4 text-base font-bold text-[#1e293b]">{record.name}</td>
                          <td className="px-6 py-4 text-base text-gray-600">{record.acsName || '-'}</td>
                          <td className="px-6 py-4 text-base text-gray-600">{record.specialty || '-'}</td>
                          <td className="px-6 py-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                              record.status === 'agendado' ? 'bg-blue-100 text-blue-600' : 
                              record.status === 'devolvido' ? 'bg-yellow-100 text-yellow-600' : 
                              'bg-red-100 text-red-600'
                            }`}>
                              {record.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500 italic">{record.changeReason || '-'}</td>
                          <td className="px-6 py-4 text-sm text-gray-400">{record.createdBy}</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <button 
                                onClick={() => {
                                  setEditingRecord(record);
                                  setShowForm(true);
                                }}
                                className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              {currentUser.group === 'Admin' && (
                                <button 
                                  onClick={() => handleDelete(record.id)}
                                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="px-6 py-4 bg-gray-50 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-500">Linhas por página:</span>
                    <select 
                      value={pageSize}
                      onChange={(e) => setPageSize(Number(e.target.value))}
                      className="bg-white border border-gray-200 rounded-lg text-sm py-1 px-2 outline-none"
                    >
                      {[10, 30, 50, 100].map(v => <option key={v} value={v}>{v}</option>)}
                    </select>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button 
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(v => Math.max(1, v - 1))}
                      className="p-2 disabled:opacity-30 text-gray-500 hover:bg-gray-200 rounded-lg transition-all"
                    >
                      <ChevronDown className="w-4 h-4 rotate-90" />
                    </button>
                    <span className="text-sm font-bold text-gray-600">Página {currentPage} de {totalPages || 1}</span>
                    <button 
                      disabled={currentPage === totalPages || totalPages === 0}
                      onClick={() => setCurrentPage(v => Math.min(totalPages, v + 1))}
                      className="p-2 disabled:opacity-30 text-gray-500 hover:bg-gray-200 rounded-lg transition-all"
                    >
                      <ChevronDown className="w-4 h-4 -rotate-90" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="emult"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="max-w-4xl mx-auto pt-12 text-center"
            >
              <div className="w-20 h-20 bg-emerald-500 rounded-3xl flex items-center justify-center text-white mx-auto mb-6 shadow-xl shadow-emerald-100">
                <UsersIcon className="w-10 h-10" />
              </div>
              <h2 className="text-4xl font-bold text-[#1e293b] mb-2">E-mult: {emultCategory}</h2>
              <p className="text-gray-500 mb-8 text-lg">Módulo em desenvolvimento para {emultCategory}.</p>
              <button 
                onClick={() => setView('menu')}
                className="px-8 py-3 bg-white border border-gray-200 rounded-2xl text-gray-600 text-lg font-bold hover:bg-gray-50 transition-all shadow-sm"
              >
                Voltar ao Menu
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-[#0f172a]/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
          >
            <div className="p-8 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-3xl font-bold text-[#1e293b]">Relatório de Regulação</h3>
                <p className="text-sm text-gray-400 uppercase font-bold tracking-widest mt-1">Estatísticas Atuais</p>
              </div>
              <button onClick={() => setShowReportModal(false)} className="p-2 hover:bg-gray-100 rounded-full transition-all">
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-8">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-blue-50 p-6 rounded-3xl border border-blue-100">
                  <p className="text-xs font-bold text-blue-400 uppercase mb-1">Total</p>
                  <p className="text-3xl font-bold text-blue-600">{visibleRecords.length}</p>
                </div>
                <div className="bg-emerald-50 p-6 rounded-3xl border border-emerald-100">
                  <p className="text-xs font-bold text-emerald-400 uppercase mb-1">Agendados</p>
                  <p className="text-3xl font-bold text-emerald-600">
                    {visibleRecords.filter(r => r.status === 'agendado').length}
                  </p>
                </div>
                <div className="bg-red-50 p-6 rounded-3xl border border-red-100">
                  <p className="text-xs font-bold text-red-400 uppercase mb-1">Aguardando</p>
                  <p className="text-3xl font-bold text-red-600">
                    {visibleRecords.filter(r => r.status === 'aguardando').length}
                  </p>
                </div>
              </div>

              {/* Detailed Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Status Breakdown */}
                <div className="space-y-4">
                  <h4 className="text-lg font-bold text-[#1e293b] flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-blue-500" />
                    Por Status
                  </h4>
                  <div className="space-y-2">
                    {['aguardando', 'agendado', 'devolvido'].map(status => {
                      const count = visibleRecords.filter(r => r.status === status).length;
                      const percent = visibleRecords.length ? (count / visibleRecords.length) * 100 : 0;
                      return (
                        <div key={status} className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="capitalize text-gray-600">{status}</span>
                            <span className="font-bold text-gray-700">{count} ({percent.toFixed(1)}%)</span>
                          </div>
                          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div 
                              className={`h-full transition-all duration-500 ${
                                status === 'agendado' ? 'bg-emerald-500' : 
                                status === 'devolvido' ? 'bg-yellow-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Top Specialties */}
                <div className="space-y-4">
                  <h4 className="text-lg font-bold text-[#1e293b] flex items-center gap-2">
                    <Stethoscope className="w-5 h-5 text-blue-500" />
                    Top Especialidades
                  </h4>
                  <div className="space-y-2">
                    {(Object.entries(
                      visibleRecords.reduce((acc, r) => {
                        const spec = r.specialty || 'Não Informada';
                        acc[spec] = (acc[spec] || 0) + 1;
                        return acc;
                      }, {} as Record<string, number>)
                    ) as [string, number][])
                      .sort((a, b) => b[1] - a[1])
                      .slice(0, 5)
                      .map(([spec, count]) => {
                        const percent = visibleRecords.length ? (count / visibleRecords.length) * 100 : 0;
                        return (
                          <div key={spec} className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600 truncate max-w-[150px]">{spec}</span>
                              <span className="font-bold text-gray-700">{count}</span>
                            </div>
                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full bg-blue-500" style={{ width: `${percent}%` }} />
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              </div>

              {/* Group Breakdown (Admin/Regulacao only) */}
              {(currentUser.group === 'Admin' || currentUser.group === 'Regulacao') && (
                <div className="space-y-4 pt-4 border-top border-gray-100">
                  <h4 className="text-lg font-bold text-[#1e293b] flex items-center gap-2">
                    <UsersIcon className="w-5 h-5 text-blue-500" />
                    Por Unidade de Saúde
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {(Object.entries(
                      visibleRecords.reduce((acc, r) => {
                        acc[r.group] = (acc[r.group] || 0) + 1;
                        return acc;
                      }, {} as Record<string, number>)
                    ) as [string, number][])
                      .sort((a, b) => b[1] - a[1])
                      .map(([group, count]) => (
                        <div key={group} className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                          <p className="text-[10px] font-bold text-gray-400 uppercase truncate">{group}</p>
                          <p className="text-xl font-bold text-gray-700">{count}</p>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>

            <div className="p-8 border-t border-gray-100 bg-gray-50 flex justify-end">
              <button 
                onClick={() => setShowReportModal(false)}
                className="px-8 py-3 bg-[#1e293b] text-white rounded-2xl font-bold hover:bg-[#334155] transition-all"
              >
                Fechar Relatório
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-[#0f172a]/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
          >
            <div className="p-8 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-3xl font-bold text-[#1e293b]">{editingRecord ? 'Editar Registro' : 'Novo Registro'}</h3>
                <p className="text-sm text-gray-400 uppercase font-bold tracking-widest mt-1">Regulação</p>
              </div>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-gray-100 rounded-full transition-all">
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8">
              <form id="record-form" onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                handleSaveRecord(Object.fromEntries(formData) as any);
              }} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-400 uppercase">Data do Registro (Automática)</label>
                  <input 
                    type="text" 
                    readOnly 
                    value={editingRecord ? new Date(editingRecord.registrationDate).toLocaleString() : new Date().toLocaleString()}
                    className="w-full bg-gray-50 border-none rounded-2xl py-3 px-4 text-gray-500 text-base font-medium cursor-not-allowed"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-400 uppercase">CNS/CPF *</label>
                  <input 
                    name="cnsCpf"
                    required
                    defaultValue={editingRecord?.cnsCpf}
                    readOnly={editingRecord && currentUser.group !== 'Admin'}
                    onBlur={(e) => {
                      if (!editingRecord) {
                        const val = e.target.value;
                        const match = records.find(r => r.cnsCpf === val);
                        if (match) {
                          const form = document.getElementById('record-form') as HTMLFormElement;
                          if (form) {
                            (form.elements.namedItem('name') as HTMLInputElement).value = match.name;
                            (form.elements.namedItem('acsName') as HTMLInputElement).value = match.acsName || '';
                            (form.elements.namedItem('phone') as HTMLInputElement).value = match.phone || '';
                            (form.elements.namedItem('address') as HTMLInputElement).value = match.address || '';
                            showAlert('success', 'Dados recuperados do último registro deste paciente.');
                          }
                        }
                      }
                    }}
                    className={`w-full bg-gray-50 border-none rounded-2xl py-3 px-4 text-gray-700 text-base focus:ring-2 focus:ring-blue-500 outline-none ${editingRecord && currentUser.group !== 'Admin' ? 'opacity-50 cursor-not-allowed' : ''}`}
                  />
                </div>

                <div className="space-y-1 md:col-span-2">
                  <label className="text-xs font-bold text-gray-400 uppercase">Nome do Paciente *</label>
                  <input 
                    name="name"
                    required
                    defaultValue={editingRecord?.name}
                    readOnly={editingRecord && currentUser.group !== 'Admin'}
                    className={`w-full bg-gray-50 border-none rounded-2xl py-3 px-4 text-gray-700 text-base focus:ring-2 focus:ring-blue-500 outline-none ${editingRecord && currentUser.group !== 'Admin' ? 'opacity-50 cursor-not-allowed' : ''}`}
                  />
                </div>

                <div className="space-y-1 md:col-span-2">
                  <label className="text-xs font-bold text-gray-400 uppercase">Endereço</label>
                  <input 
                    name="address"
                    defaultValue={editingRecord?.address}
                    className="w-full bg-gray-50 border-none rounded-2xl py-3 px-4 text-gray-700 text-base focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-400 uppercase">Nome do ACS</label>
                  <input 
                    name="acsName"
                    defaultValue={editingRecord?.acsName}
                    className="w-full bg-gray-50 border-none rounded-2xl py-3 px-4 text-gray-700 text-base focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-400 uppercase">Telefone</label>
                  <input 
                    name="phone"
                    defaultValue={editingRecord?.phone}
                    className="w-full bg-gray-50 border-none rounded-2xl py-3 px-4 text-gray-700 text-base focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-400 uppercase">Especialidade</label>
                  <input 
                    name="specialty"
                    defaultValue={editingRecord?.specialty}
                    className="w-full bg-gray-50 border-none rounded-2xl py-3 px-4 text-gray-700 text-base focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-400 uppercase">Exame/Procedimento</label>
                  <input 
                    name="procedure"
                    defaultValue={editingRecord?.procedure}
                    className="w-full bg-gray-50 border-none rounded-2xl py-3 px-4 text-gray-700 text-base focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-400 uppercase">Tipo</label>
                  <input 
                    name="type"
                    defaultValue={editingRecord?.type}
                    className="w-full bg-gray-50 border-none rounded-2xl py-3 px-4 text-gray-700 text-base focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-400 uppercase">CID</label>
                  <input 
                    name="cid"
                    defaultValue={editingRecord?.cid}
                    className="w-full bg-gray-50 border-none rounded-2xl py-3 px-4 text-gray-700 text-base focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-400 uppercase">Status</label>
                  <select 
                    name="status"
                    defaultValue={editingRecord?.status || 'aguardando'}
                    className="w-full bg-gray-50 border-none rounded-2xl py-3 px-4 text-gray-700 text-base focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="aguardando">Aguardando</option>
                    <option value="agendado">Agendado</option>
                    <option value="devolvido">Devolvido</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Data Agendamento</label>
                  <input 
                    name="appointmentDate"
                    type="date"
                    defaultValue={editingRecord?.appointmentDate}
                    className="w-full bg-gray-50 border-none rounded-2xl py-3 px-4 text-gray-700 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Data Entrega</label>
                  <input 
                    name="deliveryDate"
                    type="date"
                    defaultValue={editingRecord?.deliveryDate}
                    className="w-full bg-gray-50 border-none rounded-2xl py-3 px-4 text-gray-700 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div className="space-y-1 md:col-span-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Observação</label>
                  <textarea 
                    name="observation"
                    defaultValue={editingRecord?.observation}
                    rows={3}
                    className="w-full bg-gray-50 border-none rounded-2xl py-3 px-4 text-gray-700 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                  />
                </div>
              </form>
            </div>

            <div className="p-8 border-t border-gray-100 flex items-center justify-end gap-4">
              <button 
                onClick={() => setShowForm(false)}
                className="px-6 py-3 text-gray-400 font-bold hover:text-gray-600 transition-all"
              >
                Cancelar
              </button>
              <button 
                type="submit"
                form="record-form"
                className="px-10 py-3 bg-blue-500 text-white font-bold rounded-2xl shadow-lg shadow-blue-100 hover:bg-blue-600 transition-all"
              >
                {editingRecord ? 'Salvar Alterações' : 'Confirmar Registro'}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Reason Modal */}
      {showReasonModal && (
        <div className="fixed inset-0 bg-[#0f172a]/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-[2rem] p-8 shadow-2xl w-full max-w-md"
          >
            <h3 className="text-xl font-bold text-[#1e293b] mb-4">Motivo da Alteração</h3>
            <p className="text-sm text-gray-500 mb-4">É obrigatório informar o motivo para qualquer alteração em registros existentes.</p>
            <textarea 
              value={changeReason}
              onChange={(e) => setChangeReason(e.target.value)}
              placeholder="Descreva o motivo..."
              className="w-full bg-gray-50 border-none rounded-2xl py-3 px-4 text-gray-700 focus:ring-2 focus:ring-blue-500 outline-none resize-none mb-6"
              rows={4}
            />
            <div className="flex items-center justify-end gap-4">
              <button 
                onClick={() => setShowReasonModal(false)}
                className="px-6 py-2 text-gray-400 font-bold hover:text-gray-600 transition-all"
              >
                Voltar
              </button>
              <button 
                onClick={confirmUpdate}
                disabled={!changeReason.trim()}
                className="px-8 py-2 bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-100 hover:bg-blue-600 disabled:opacity-50 transition-all"
              >
                Confirmar
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Alerts */}
      <AnimatePresence>
        {alert && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className={`fixed bottom-8 right-8 z-[100] px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 ${
              alert.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
            }`}
          >
            {alert.type === 'success' ? <CheckCircle2 className="w-6 h-6" /> : <AlertCircle className="w-6 h-6" />}
            <span className="font-bold">{alert.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

