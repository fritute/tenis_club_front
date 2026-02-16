import React, { useState, useEffect } from 'react';
import { getPedidos, updateStatusPedido } from '../../../services/api';
import $ from 'jquery';
import './MinhaLojaPedidos.css';

const MinhaLojaPedidos = ({ loja }) => {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('todos');
  const [expandedPedido, setExpandedPedido] = useState(null);

  const statusPedidos = {
    'pendente': { label: 'Pendente', color: '#ffc107', icon: 'clock' },
    'confirmado': { label: 'Confirmado', color: '#17a2b8', icon: 'check-circle' },
    'preparando': { label: 'Preparando', color: '#fd7e14', icon: 'cog' },
    'enviado': { label: 'Enviado', color: '#6f42c1', icon: 'truck' },
    'entregue': { label: 'Entregue', color: '#28a745', icon: 'check-double' },
    'cancelado': { label: 'Cancelado', color: '#dc3545', icon: 'times-circle' }
  };

  useEffect(() => {
    carregarPedidos();
  }, [loja]);

  const carregarPedidos = async () => {
    try {
      setLoading(true);
      const response = await getPedidos({ loja_id: loja?.id });
      setPedidos(response?.pedidos || []);
    } catch (err) {
      console.error('[MinhaLojaPedidos] Erro ao carregar pedidos:', err);
      setError('⚠️ Erro ao carregar pedidos da loja');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (pedidoId, novoStatus) => {
    try {
      await updateStatusPedido(pedidoId, novoStatus);
      
      // Atualizar na lista local
      setPedidos(prev => prev.map(pedido => 
        pedido.id === pedidoId 
          ? { ...pedido, status: novoStatus }
          : pedido
      ));
      
      // Mostrar feedback com jQuery
      const statusInfo = statusPedidos[novoStatus];
      const $notification = $(`
        <div class="status-notification success">
          <i class="fas fa-check-circle"></i>
          Pedido #${pedidoId} atualizado para: ${statusInfo.label}
        </div>
      `);
      
      $('body').append($notification);
      setTimeout(() => $notification.addClass('show'), 100);
      setTimeout(() => {
        $notification.removeClass('show');
        setTimeout(() => $notification.remove(), 300);
      }, 3000);
      
    } catch (err) {
      console.error('[MinhaLojaPedidos] Erro ao atualizar status:', err);
      
      const $errorNotification = $(`
        <div class="status-notification error">
          <i class="fas fa-exclamation-triangle"></i>
          Erro ao atualizar status do pedido
        </div>
      `);
      
      $('body').append($errorNotification);
      setTimeout(() => $errorNotification.addClass('show'), 100);
      setTimeout(() => {
        $errorNotification.removeClass('show');
        setTimeout(() => $errorNotification.remove(), 300);
      }, 3000);
    }
  };

  const toggleExpandPedido = (pedidoId) => {
    setExpandedPedido(expandedPedido === pedidoId ? null : pedidoId);
  };

  const filtrarPedidos = () => {
    if (filtroStatus === 'todos') return pedidos;
    return pedidos.filter(pedido => pedido.status === filtroStatus);
  };

  const formatarData = (data) => {
    return new Date(data).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatarValor = (valor) => {
    return parseFloat(valor || 0).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };

  const contarPedidosPorStatus = () => {
    const contadores = {};
    Object.keys(statusPedidos).forEach(status => {
      contadores[status] = pedidos.filter(p => p.status === status).length;
    });
    return contadores;
  };

  if (loading) {
    return (
      <div className="pedidos-loading">
        <i className="fas fa-spinner fa-spin fa-2x"></i>
        <p>Carregando pedidos...</p>
      </div>
    );
  }

  const pedidosFiltrados = filtrarPedidos();
  const contadores = contarPedidosPorStatus();

  return (
    <div className="minha-loja-pedidos">
      {/* Header */}
      <div className="pedidos-header">
        <div className="header-info">
          <h3><i className="fas fa-shopping-cart"></i> Pedidos da Loja</h3>
          <p>Gerencie os pedidos recebidos na sua loja</p>
        </div>
      </div>

      {/* Estatísticas de Status */}
      <div className="status-cards">
        <div className="status-card todos" onClick={() => setFiltroStatus('todos')}>
          <div className="status-info">
            <span className="status-count">{pedidos.length}</span>
            <span className="status-label">Todos</span>
          </div>
          <i className="fas fa-chart-line"></i>
        </div>
        
        {Object.entries(statusPedidos).map(([status, info]) => (
          <div 
            key={status}
            className={`status-card ${filtroStatus === status ? 'active' : ''}`}
            style={{ borderColor: info.color }}
            onClick={() => setFiltroStatus(status)}
          >
            <div className="status-info">
              <span className="status-count" style={{ color: info.color }}>
                {contadores[status]}
              </span>
              <span className="status-label">{info.label}</span>
            </div>
            <i className={`fas fa-${info.icon}`} style={{ color: info.color }}></i>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="pedidos-filters">
        <select 
          value={filtroStatus} 
          onChange={(e) => setFiltroStatus(e.target.value)}
          className="filter-select"
        >
          <option value="todos">📋 Todos os Pedidos</option>
          {Object.entries(statusPedidos).map(([status, info]) => (
            <option key={status} value={status}>
              {info.label} ({contadores[status]})
            </option>
          ))}
        </select>
        
        <button 
          className="btn btn-outline-primary btn-sm"
          onClick={carregarPedidos}
          title="Atualizar"
        >
          <i className="fas fa-sync-alt"></i>
          Atualizar
        </button>
      </div>

      {/* Lista de Pedidos */}
      {error && (
        <div className="error-message">
          <i className="fas fa-exclamation-triangle"></i>
          {error}
        </div>
      )}

      {pedidosFiltrados.length === 0 ? (
        <div className="empty-pedidos">
          <i className="fas fa-shopping-cart fa-3x"></i>
          <h4>
            {filtroStatus === 'todos' 
              ? 'Nenhum pedido ainda' 
              : `Nenhum pedido ${statusPedidos[filtroStatus]?.label.toLowerCase()}`
            }
          </h4>
          <p>
            {filtroStatus === 'todos'
              ? 'Quando alguém fizer um pedido na sua loja, ele aparecerá aqui.'
              : `Não há pedidos com status "${statusPedidos[filtroStatus]?.label}" no momento.`
            }
          </p>
        </div>
      ) : (
        <div className="pedidos-lista">
          {pedidosFiltrados.map(pedido => {
            const statusInfo = statusPedidos[pedido.status] || statusPedidos.pendente;
            const isExpanded = expandedPedido === pedido.id;
            
            return (
              <div key={pedido.id} className="pedido-card">
                {/* Header do Pedido */}
                <div className="pedido-header" onClick={() => toggleExpandPedido(pedido.id)}>
                  <div className="pedido-info">
                    <div className="pedido-numero">
                      <strong>Pedido #{pedido.id}</strong>
                      <span className="pedido-data">
                        {formatarData(pedido.data_pedido)}
                      </span>
                    </div>
                    <div className="pedido-cliente">
                      <i className="fas fa-user"></i>
                      {pedido.cliente_nome || 'Cliente não informado'}
                    </div>
                  </div>
                  
                  <div className="pedido-resumo">
                    <div className="pedido-valor">
                      {formatarValor(pedido.valor_total)}
                    </div>
                    <div 
                      className="pedido-status"
                      style={{ 
                        backgroundColor: `${statusInfo.color}15`,
                        color: statusInfo.color,
                        border: `1px solid ${statusInfo.color}40`
                      }}
                    >
                      <i className={`fas fa-${statusInfo.icon}`}></i>
                      {statusInfo.label}
                    </div>
                  </div>
                  
                  <div className="pedido-expand">
                    <i className={`fas fa-chevron-${isExpanded ? 'up' : 'down'}`}></i>
                  </div>
                </div>

                {/* Detalhes do Pedido */}
                {isExpanded && (
                  <div className="pedido-detalhes">
                    {/* Produtos do Pedido */}
                    <div className="pedido-produtos">
                      <h5><i className="fas fa-box"></i> Produtos</h5>
                      {pedido.produtos?.map((produto, index) => (
                        <div key={index} className="produto-item">
                          <div className="produto-nome">
                            {produto.nome}
                            <span className="produto-categoria">
                              ({typeof produto.categoria === 'object' ? produto.categoria?.nome : produto.categoria})
                            </span>
                          </div>
                          <div className="produto-quantidade">
                            Qtd: {produto.quantidade}
                          </div>
                          <div className="produto-preco">
                            {formatarValor(produto.preco_unitario)}
                          </div>
                          <div className="produto-total">
                            {formatarValor(produto.quantidade * produto.preco_unitario)}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Informações de Entrega */}
                    {pedido.endereco_entrega && (
                      <div className="pedido-entrega">
                        <h5><i className="fas fa-truck"></i> Entrega</h5>
                        <p>{pedido.endereco_entrega}</p>
                        {pedido.observacoes && (
                          <p><strong>Observações:</strong> {pedido.observacoes}</p>
                        )}
                      </div>
                    )}

                    {/* Ações do Pedido */}
                    <div className="pedido-actions">
                      <div className="status-selector">
                        <label>Alterar Status:</label>
                        <select 
                          value={pedido.status}
                          onChange={(e) => handleStatusChange(pedido.id, e.target.value)}
                          className="status-select"
                        >
                          {Object.entries(statusPedidos).map(([status, info]) => (
                            <option key={status} value={status}>
                              {info.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      <div className="action-buttons">
                        <button 
                          className="btn btn-outline-primary btn-sm"
                          onClick={() => {
                            $('.pedido-print-content').html(`
                              <h2>Pedido #${pedido.id}</h2>
                              <p><strong>Cliente:</strong> ${pedido.cliente_nome}</p>
                              <p><strong>Data:</strong> ${formatarData(pedido.data_pedido)}</p>
                              <p><strong>Total:</strong> ${formatarValor(pedido.valor_total)}</p>
                            `);
                            window.print();
                          }}
                          title="Imprimir Pedido"
                        >
                          <i className="fas fa-print"></i>
                          Imprimir
                        </button>
                        <button 
                          className="btn btn-outline-info btn-sm"
                          title="Contatar Cliente"
                        >
                          <i className="fas fa-phone"></i>
                          Contato
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="pedido-print-content" style={{ display: 'none' }}></div>
    </div>
  );
};

export default MinhaLojaPedidos;