
import React, { useState } from 'react';
import { User, Role } from '../types';

interface UserManagementModuleProps {
  currentUser: User;
  users: User[];
  onUpdateUsers: (users: User[]) => void;
  onDeleteUser: (userId: string) => void;
}

export const UserManagementModule: React.FC<UserManagementModuleProps> = ({ currentUser, users, onUpdateUsers, onDeleteUser }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [alert, setAlert] = useState<{ type: 'success' | 'error', msg: string } | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState<Partial<User>>({
    name: '',
    email: '',
    role: 'FATIMA1',
    groupName: '',
    password: ''
  });

  const showAlert = (type: 'success' | 'error', msg: string) => {
    setAlert({ type, msg });
    setTimeout(() => setAlert(null), 3000);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingUser) {
      const emailExists = users.some(u => u.email.toLowerCase() === formData.email?.toLowerCase());
      if (emailExists) {
        showAlert('error', 'Este e-mail já está cadastrado no sistema.');
        return;
      }
    }

    if (editingUser) {
      // Se a senha estiver vazia na edição, mantém a anterior
      const passwordToSave = formData.password || editingUser.password || '123';
      const updatedList = users.map(u => u.id === editingUser.id ? { ...editingUser, ...formData, password: passwordToSave } as User : u);
      onUpdateUsers(updatedList);
      showAlert('success', 'Usuário atualizado com sucesso!');
    } else {
      const newUser: User = {
        ...formData as User,
        password: formData.password || '123',
        id: Math.random().toString(36).substr(2, 9)
      };
      onUpdateUsers([...users, newUser]);
      showAlert('success', 'Novo usuário cadastrado e pronto para login!');
    }
    closeModal();
  };

  const handleDelete = (id: string) => {
    if (id === currentUser.id) {
      showAlert('error', 'Você não pode excluir seu próprio usuário!');
      return;
    }
    onDeleteUser(id);
  };

  const closeModal = () => {
    setIsAdding(false);
    setEditingUser(null);
    setFormData({ name: '', email: '', role: 'FATIMA1', groupName: '', password: '' });
    setShowPassword(false);
  };

  const ROLES: Role[] = [
    'ADMIN', 'REGULACAO', 'EMULT', 'FATIMA1', 'FATIMA2', 'SEDE1', 'SEDE2', 
    'RASO1', 'RASO2', 'PAIAIA', 'TORRE1', 'TORRE2', 'MELANCIA', 'MONTEALEGRE', 'CANDEIA'
  ];

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      {alert && (
        <div className={`fixed top-4 right-4 z-[350] p-4 rounded-xl shadow-2xl flex items-center gap-3 animate-bounce ${alert.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
          <i className={`fas ${alert.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-triangle'}`}></i>
          <span className="font-bold">{alert.msg}</span>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-2xl font-black text-slate-800">Gestão de Acessos</h3>
          <p className="text-slate-500 text-sm font-medium">Controle as senhas e permissões dos profissionais.</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="bg-slate-800 text-white px-6 py-3 rounded-xl font-black text-sm flex items-center gap-2 hover:bg-slate-900 transition-all shadow-lg active:scale-95"
        >
          <i className="fas fa-user-plus text-sky-400"></i> NOVO USUÁRIO
        </button>
      </div>

      <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-400">
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest">Usuário</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest">E-mail de Login</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest">Perfil / Role</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs ${u.role === 'ADMIN' ? 'bg-rose-100 text-rose-600' : 'bg-sky-100 text-sky-600'}`}>
                        {u.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-bold text-slate-700">{u.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500 font-medium lowercase">{u.email}</td>
                  <td className="px-6 py-4">
                    <span className={`text-[10px] font-black px-2 py-1 rounded-md ${u.role === 'ADMIN' ? 'bg-rose-100 text-rose-600' : u.role === 'REGULACAO' ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-600'}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-center gap-2">
                      <button 
                        onClick={() => { setEditingUser(u); setFormData(u); }}
                        className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:text-indigo-600 hover:border-indigo-200 transition-all shadow-sm"
                        title="Editar profissional"
                      >
                        <i className="fas fa-user-edit text-xs"></i>
                      </button>
                      <button 
                        onClick={() => handleDelete(u.id)}
                        className={`w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-400 transition-all shadow-sm ${u.id === currentUser.id ? 'opacity-20 cursor-not-allowed' : 'hover:text-rose-600 hover:border-rose-200'}`}
                        title="Remover acesso"
                        disabled={u.id === currentUser.id}
                      >
                        <i className="fas fa-user-slash text-xs"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {(isAdding || editingUser) && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in duration-300">
            <div className="p-6 bg-slate-800 text-white flex justify-between items-center">
              <h4 className="font-bold text-lg flex items-center gap-3">
                <i className={`fas ${editingUser ? 'fa-user-edit' : 'fa-user-plus'} text-sky-400`}></i>
                {editingUser ? 'Alterar Dados/Senha' : 'Novo Usuário'}
              </h4>
              <button onClick={closeModal} className="text-slate-400 hover:text-white transition-colors"><i className="fas fa-times text-xl"></i></button>
            </div>
            <form onSubmit={handleSave} className="p-8 space-y-5">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Nome do Profissional</label>
                <input 
                  required 
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 text-sm focus:border-sky-500 outline-none transition-all font-medium"
                  placeholder="Ex: Enf. Maria Santos"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">E-mail (Login)</label>
                <input 
                  required 
                  type="email"
                  value={formData.email} 
                  onChange={e => setFormData({...formData, email: e.target.value})}
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 text-sm focus:border-sky-500 outline-none transition-all font-medium lowercase"
                  placeholder="exemplo@saude.com"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Definir Nova Senha</label>
                <div className="relative">
                  <input 
                    type={showPassword ? "text" : "password"}
                    value={formData.password} 
                    onChange={e => setFormData({...formData, password: e.target.value})}
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 text-sm focus:border-sky-500 outline-none transition-all font-medium"
                    placeholder={editingUser ? "Deixe em branco para não alterar" : "Senha de acesso"}
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-3 text-slate-400 hover:text-sky-600"
                  >
                    <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Perfil de Permissão</label>
                <select 
                  required
                  value={formData.role} 
                  onChange={e => setFormData({...formData, role: e.target.value as Role})}
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 text-sm focus:border-sky-500 outline-none transition-all font-bold text-slate-700 cursor-pointer"
                >
                  <option value="ADMIN">ADMIN (Total)</option>
                  <option value="REGULACAO">REGULAÇÃO (Central)</option>
                  <option value="EMULT">E-MULT (Multi)</option>
                  {ROLES.filter(r => !['ADMIN', 'REGULACAO', 'EMULT'].includes(r)).map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
              
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={closeModal} className="flex-1 px-6 py-3 font-black text-slate-400 uppercase text-xs hover:bg-slate-50 rounded-xl transition-all">Cancelar</button>
                <button type="submit" className="flex-1 px-6 py-3 bg-sky-600 text-white rounded-xl font-black shadow-lg shadow-sky-100 uppercase text-xs hover:bg-sky-700 transition-all active:scale-95">Salvar Acesso</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
