/**
 * 📋 Constantes do Sistema de Pedidos
 * 
 * Centraliza todas as constantes relacionadas a pedidos para:
 * - Evitar erros de digitação
 * - Facilitar manutenção
 * - Garantir consistência
 */

// Status válidos de pedidos
export const PEDIDO_STATUS = {
  PENDENTE: 'pendente',
  CONFIRMADO: 'confirmado',
  EM_SEPARACAO: 'em_separacao',
  EM_TRANSITO: 'em_transito',
  ENTREGUE: 'entregue',
  CANCELADO: 'cancelado'
};

// Labels amigáveis para exibição
export const PEDIDO_STATUS_LABELS = {
  [PEDIDO_STATUS.PENDENTE]: 'Pendente',
  [PEDIDO_STATUS.CONFIRMADO]: 'Confirmado',
  [PEDIDO_STATUS.EM_SEPARACAO]: 'Em Separação',
  [PEDIDO_STATUS.EM_TRANSITO]: 'Em Trânsito',
  [PEDIDO_STATUS.ENTREGUE]: 'Entregue',
  [PEDIDO_STATUS.CANCELADO]: 'Cancelado'
};

// Cores para badges de status
export const PEDIDO_STATUS_CORES = {
  [PEDIDO_STATUS.PENDENTE]: '#ffc107', // Amarelo
  [PEDIDO_STATUS.CONFIRMADO]: '#17a2b8', // Azul claro
  [PEDIDO_STATUS.EM_SEPARACAO]: '#007bff', // Azul
  [PEDIDO_STATUS.EM_TRANSITO]: '#6f42c1', // Roxo
  [PEDIDO_STATUS.ENTREGUE]: '#28a745', // Verde
  [PEDIDO_STATUS.CANCELADO]: '#dc3545' // Vermelho
};

// Ícones para cada status
export const PEDIDO_STATUS_ICONES = {
  [PEDIDO_STATUS.PENDENTE]: 'fa-clock',
  [PEDIDO_STATUS.CONFIRMADO]: 'fa-check-circle',
  [PEDIDO_STATUS.EM_SEPARACAO]: 'fa-box-open',
  [PEDIDO_STATUS.EM_TRANSITO]: 'fa-shipping-fast',
  [PEDIDO_STATUS.ENTREGUE]: 'fa-check-double',
  [PEDIDO_STATUS.CANCELADO]: 'fa-times-circle'
};

// Fluxo de status (transições permitidas)
export const PEDIDO_FLUXO_STATUS = {
  [PEDIDO_STATUS.PENDENTE]: [
    PEDIDO_STATUS.CONFIRMADO,
    PEDIDO_STATUS.CANCELADO
  ],
  [PEDIDO_STATUS.CONFIRMADO]: [
    PEDIDO_STATUS.EM_SEPARACAO,
    PEDIDO_STATUS.CANCELADO
  ],
  [PEDIDO_STATUS.EM_SEPARACAO]: [
    PEDIDO_STATUS.EM_TRANSITO,
    PEDIDO_STATUS.CANCELADO
  ],
  [PEDIDO_STATUS.EM_TRANSITO]: [
    PEDIDO_STATUS.ENTREGUE,
    PEDIDO_STATUS.CANCELADO
  ],
  [PEDIDO_STATUS.ENTREGUE]: [], // Status final
  [PEDIDO_STATUS.CANCELADO]: [] // Status final
};

// Validar se transição de status é permitida
export const podeTransicionarStatus = (statusAtual, statusNovo) => {
  const transicoesPermitidas = PEDIDO_FLUXO_STATUS[statusAtual] || [];
  return transicoesPermitidas.includes(statusNovo);
};

// Obter próximos status possíveis
export const getProximosStatus = (statusAtual) => {
  return PEDIDO_FLUXO_STATUS[statusAtual] || [];
};

// Verificar se status é final
export const isStatusFinal = (status) => {
  return status === PEDIDO_STATUS.ENTREGUE || status === PEDIDO_STATUS.CANCELADO;
};

// Verificar se pedido pode ser cancelado
export const podeCancelar = (status) => {
  return status !== PEDIDO_STATUS.ENTREGUE && status !== PEDIDO_STATUS.CANCELADO;
};

// Array com todos os status (para dropdowns)
export const TODOS_STATUS = Object.values(PEDIDO_STATUS);

// Helper para obter label do status
export const getStatusLabel = (status) => {
  return PEDIDO_STATUS_LABELS[status] || status;
};

// Helper para obter cor do status
export const getStatusCor = (status) => {
  return PEDIDO_STATUS_CORES[status] || '#6c757d';
};

// Helper para obter ícone do status
export const getStatusIcone = (status) => {
  return PEDIDO_STATUS_ICONES[status] || 'fa-question';
};

// Validar se status existe
export const isStatusValido = (status) => {
  return TODOS_STATUS.includes(status);
};

const pedidoConstants = {
  PEDIDO_STATUS,
  PEDIDO_STATUS_LABELS,
  PEDIDO_STATUS_CORES,
  PEDIDO_STATUS_ICONES,
  PEDIDO_FLUXO_STATUS,
  TODOS_STATUS,
  podeTransicionarStatus,
  getProximosStatus,
  isStatusFinal,
  podeCancelar,
  getStatusLabel,
  getStatusCor,
  getStatusIcone,
  isStatusValido
};

export default pedidoConstants;
