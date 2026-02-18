
import { User, Role, RegulacaoRecord } from '../types';

/**
 * Define todos os papéis que representam Unidades Básicas / Equipes de Ponta
 */
const ALL_UNIT_ROLES: Role[] = [
  'FATIMA1', 'FATIMA2', 'SEDE1', 'SEDE2', 'RASO1', 'RASO2', 
  'PAIAIA', 'TORRE1', 'TORRE2', 'MELANCIA', 'MONTEALEGRE', 'CANDEIA'
];

/**
 * Define quais papéis têm acesso total (ver tudo) no módulo de regulação
 */
const ROLES_COM_ACESSO_TOTAL_REGULACAO: Role[] = ['ADMIN', 'REGULACAO'];

/**
 * Define quais papéis podem ver o botão/módulo de regulação
 */
const ROLES_QUE_VEM_REGULACAO: Role[] = ['ADMIN', 'REGULACAO', ...ALL_UNIT_ROLES];

/**
 * Define quais papéis podem ver o botão/módulo E-mult
 */
const ROLES_QUE_VEM_EMULT: Role[] = ['ADMIN', 'EMULT', ...ALL_UNIT_ROLES];

export const Permissions = {
  // Verifica se o usuário pode acessar o módulo de Regulação
  canAccessRegulacao: (user: User) => ROLES_QUE_VEM_REGULACAO.includes(user.role),

  // Verifica se o usuário pode acessar o módulo E-mult
  canAccessEmult: (user: User) => ROLES_QUE_VEM_EMULT.includes(user.role),

  // Verifica se o usuário pode ver TODOS os registros da regulação (ou apenas os dele)
  canViewAllRegulacaoRecords: (user: User) => ROLES_COM_ACESSO_TOTAL_REGULACAO.includes(user.role),

  // Verifica se o usuário pode importar/exportar dados (XLSX/CSV)
  canImportExportData: (user: User) => user.role === 'ADMIN',

  // Verifica se o usuário pode editar campos protegidos (CNS, Nome) após o cadastro
  canEditSensitiveFields: (user: User) => user.role === 'ADMIN',

  // Verifica se o usuário pode excluir registros da regulação
  canDeleteRecords: (user: User) => user.role === 'ADMIN',

  // Verifica se o usuário pode gerenciar os usuários do sistema
  canManageUsers: (user: User) => user.role === 'ADMIN',

  // Lógica de visibilidade de um registro específico
  canSeeRecord: (user: User, record: RegulacaoRecord) => {
    if (Permissions.canViewAllRegulacaoRecords(user)) return true;
    return record.criadoPorEmail === user.email;
  }
};
