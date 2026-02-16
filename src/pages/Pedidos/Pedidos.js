import React, { useState, useEffect } from 'react';
import $ from 'jquery';
import { 
  getMeusPedidos, 
  getPedidosRecebidos, 
  getAllPedidos, 
  getEstatisticasPedidos,
  updateStatusPedido,
  cancelarPedido,
  showNotification 
} from '../../services/api';
import './Pedidos.css';

const Pedidos = ({ user }) => {
  const [pedidos, setPedidos] = useState([]);
  const [estatisticas, setEstatisticas] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [filtros, setFiltros] = useState({
    status: '',
    data_inicio: '',
    data_fim: ''
  });
  const [viewMode, setViewMode] = useState('lista'); // 'lista' ou 'estatisticas'
  const [pedidoSelecionado, setPedidoSelecionado] = useState(null);
  const [showDetalhModal, setShowDetalhModal] = useState(false);

  // Definir função de carregamento baseada no nível do usuário
  const carregarPedidos = async () => {
    setLoading(true);
    try {
      let dadosPedidos;
      
      switch (user?.nivel) {
        case 'comum':
          // Usuário comum - seus pedidos como comprador
          console.log('[Pedidos] Carregando meus pedidos (usuário comum)');
          dadosPedidos = await getMeusPedidos();
          break;
        case 'fornecedor':
          // Fornecedor - pedidos recebidos da sua empresa
          console.log('[Pedidos] Carregando pedidos recebidos (fornecedor)');
          dadosPedidos = await getPedidosRecebidos();
          break;
        case 'executivo':
          // Executivo - todos os pedidos do sistema
          console.log('[Pedidos] Carregando todos pedidos (executivo)');
          dadosPedidos = await getAllPedidos(filtros);
          break;
        default:
          console.warn('[Pedidos] Nível de usuário não reconhecido:', user?.nivel);
          dadosPedidos = [];
      }
      
      const pedidosArray = Array.isArray(dadosPedidos) ? dadosPedidos : 
                          (dadosPedidos?.pedidos || dadosPedidos?.data || []);
      
      setPedidos(pedidosArray);
      console.log('[Pedidos] Pedidos carregados:', pedidosArray.length);
      
    } catch (error) {
      console.error('[Pedidos] Erro ao carregar:', error);
      if (error.message?.includes('404') || error.response?.status === 404) {
        console.warn('[Pedidos] API de pedidos não implementada ainda, mostrando dados simulados');
        // Dados simulados para desenvolvimento
        const pedidosSimulados = [
          {
            id: 1,
            status: 'pendente',
            valor_total: 599.80,
            created_at: '2026-02-10T10:30:00Z',
            cliente_nome: 'João Silva',
            fornecedor_nome: 'Nike Brasil',
            total_itens: 2,
            endereco_entrega: {
              logradouro: 'Rua das Flores',
              numero: '123',
              bairro: 'Centro',
              cidade: 'São Paulo',
              estado: 'SP',
              cep: '01234-567'
            }
          },
          {
            id: 2,
            status: 'entregue',
            valor_total: 450.00,
            created_at: '2026-02-05T14:20:00Z',
            cliente_nome: 'Maria Santos',
            fornecedor_nome: 'Adidas Brasil',
            total_itens: 1
          }
        ];
        setPedidos(pedidosSimulados);
      } else {
        showNotification('Erro ao carregar pedidos', 'error');
        setPedidos([]);
      }
    } finally {
      setLoading(false);
    }
  };

  // Carregar estatísticas (apenas para fornecedores)
  const carregarEstatisticas = async () => {
    if (user?.nivel !== 'fornecedor') return;
    
    try {
      console.log('[Pedidos] Carregando estatísticas do fornecedor');
      const dados = await getEstatisticasPedidos();
      setEstatisticas(dados);
      console.log('[Pedidos] Estatísticas carregadas:', dados);
    } catch (error) {
      console.error('[Pedidos] Erro ao carregar estatísticas:', error);
      // Estatísticas simuladas para desenvolvimento
      setEstatisticas({
        total_pedidos: 15,
        pedidos_pendentes: 3,
        pedidos_confirmados: 5,
        pedidos_enviados: 2,
        pedidos_entregues: 5,
        pedidos_cancelados: 0,
        valor_total_vendas: 4599.85,
        ticket_medio: 306.66
      });
    }
  };

  useEffect(() => {
    if (user) {
      carregarPedidos();
      if (user?.nivel === 'fornecedor') {
        carregarEstatisticas();
      }
    }
  }, [user, filtros]);

  // Atualizar status do pedido (fornecedor/executivo)
  const handleAtualizarStatus = async (pedidoId, novoStatus) => {
    if (!['fornecedor', 'executivo'].includes(user?.nivel)) {
      showNotification('Você não tem permissão para alterar status', 'error');
      return;
    }

    try {
      console.log('[Pedidos] Atualizando status:', pedidoId, 'para:', novoStatus);
      await updateStatusPedido(pedidoId, novoStatus);
      showNotification(`Status atualizado para: ${novoStatus}`, 'success');
      carregarPedidos(); // Recarregar lista
    } catch (error) {
      console.error('[Pedidos] Erro ao atualizar status:', error);
      showNotification('Erro ao atualizar status do pedido', 'error');
    }
  };

  // Cancelar pedido (cliente)
  const handleCancelarPedido = async (pedidoId) => {
    if (user?.nivel !== 'comum') {
      showNotification('Apenas clientes podem cancelar pedidos', 'error');
      return;
    }

    if (!window.confirm('Tem certeza que deseja cancelar este pedido?')) {
      return;
    }

    try {
      console.log('[Pedidos] Cancelando pedido:', pedidoId);
      await cancelarPedido(pedidoId);
      showNotification('Pedido cancelado com sucesso', 'success');
      carregarPedidos(); // Recarregar lista
    } catch (error) {
      console.error('[Pedidos] Erro ao cancelar pedido:', error);
      showNotification('Erro ao cancelar pedido', 'error');
    }
  };

  // Ver detalhes do pedido
  const handleVerDetalhes = (pedido) => {
    console.log('[Pedidos] Visualizando detalhes do pedido:', pedido.id);
    setPedidoSelecionado(pedido);
    setShowDetalhModal(true);
    
    setTimeout(() => {
      $('.modal-detalh-pedido').addClass('show');
    }, 10);
  };

  // Fechar modal de detalhes
  const handleFecharModal = () => {
    $('.modal-detalh-pedido').removeClass('show');
    setTimeout(() => {
      setShowDetalhModal(false);
      setPedidoSelecionado(null);
    }, 300);
  };

  // Aplicar filtros (executivo)
  const handleAplicarFiltros = () => {
    if (user?.nivel === 'executivo') {
      console.log('[Pedidos] Aplicando filtros:', filtros);
      carregarPedidos();
    }
  };

  // Formatar data
  const formatarData = (dataString) => {
    if (!dataString) return 'N/A';
    const data = new Date(dataString);
    return data.toLocaleDateString('pt-BR') + ' ' + data.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  // Formatar status
  const formatarStatus = (status) => {
    const statusMap = {
      'pendente': { texto: 'Pendente', classe: 'status-pendente' },
      'confirmado': { texto: 'Confirmado', classe: 'status-confirmado' },
      'enviado': { texto: 'Enviado', classe: 'status-enviado' },
      'entregue': { texto: 'Entregue', classe: 'status-entregue' },
      'cancelado': { texto: 'Cancelado', classe: 'status-cancelado' }
    };
    
    const statusInfo = statusMap[status] || { texto: status, classe: 'status-default' };
    return (
      <span className={`status-badge ${statusInfo.classe}`}>
        {statusInfo.texto}
      </span>
    );
  };

  // Renderizar ações baseadas no nível do usuário
  const renderizarAcoes = (pedido) => {
    if (user?.nivel === 'comum') {
      // Cliente pode cancelar pedidos pendentes
      return pedido.status === 'pendente' ? (
        <button 
          className="btn-acao btn-cancelar"
          onClick={() => handleCancelarPedido(pedido.id)}
          title="Cancelar Pedido"
        >
          <i className="fas fa-times"></i> Cancelar
        </button>
      ) : null;
    }
    
    if (['fornecedor', 'executivo'].includes(user?.nivel)) {
      // Fornecedor/Executivo pode atualizar status
      return pedido.status !== 'cancelado' && pedido.status !== 'entregue' ? (
        <select
          className="select-status"
          value={pedido.status}
          onChange={(e) => handleAtualizarStatus(pedido.id, e.target.value)}
          title="Alterar Status"
        >
          <option value="pendente">Pendente</option>
          <option value="confirmado">Confirmado</option>
          <option value="enviado">Enviado</option>
          <option value="entregue">Entregue</option>
          <option value="cancelado">Cancelado</option>
        </select>
      ) : null;
    }
    
    return null;
  };

  if (!user) {
    return (
      <div className="pedidos-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Carregando informações do usuário...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pedidos-container">
      {/* Header */}
      <div className="page-header">
        <div className="header-content">
          <div className="header-text">
            <h1>
              <i className="fas fa-shopping-cart"></i> 
              {user?.nivel === 'comum' ? 'Meus Pedidos' : 
               user?.nivel === 'fornecedor' ? 'Pedidos Recebidos' : 
               'Gerenciar Pedidos'}
            </h1>
            <p>
              {user?.nivel === 'comum' ? 'Acompanhe seus pedidos e compras realizadas' :
               user?.nivel === 'fornecedor' ? 'Gerencie os pedidos da sua empresa' :
               'Controle total sobre todos os pedidos do sistema'}
            </p>
          </div>
          
          {/* Opções de visualização (fornecedor) */}
          {user?.nivel === 'fornecedor' && (
            <div className="view-toggle">
              <button 
                className={`btn-view ${viewMode === 'lista' ? 'active' : ''}`}
                onClick={() => setViewMode('lista')}
              >
                <i className="fas fa-list"></i> Lista
              </button>
              <button 
                className={`btn-view ${viewMode === 'estatisticas' ? 'active' : ''}`}
                onClick={() => setViewMode('estatisticas')}
              >
                <i className="fas fa-chart-bar"></i> Estatísticas
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Filtros (executivo) */}
      {user?.nivel === 'executivo' && (
        <div className="filtros-container">
          <h3><i className="fas fa-filter"></i> Filtros</h3>
          <div className="filtros-grid">
            <div className="campo-filtro">
              <label>Status:</label>
              <select 
                value={filtros.status}
                onChange={(e) => setFiltros({...filtros, status: e.target.value})}
              >
                <option value="">Todos</option>
                <option value="pendente">Pendente</option>
                <option value="confirmado">Confirmado</option>
                <option value="enviado">Enviado</option>
                <option value="entregue">Entregue</option>
                <option value="cancelado">Cancelado</option>
              </select>
            </div>
            <div className="campo-filtro">
              <label>Data início:</label>
              <input 
                type="date"
                value={filtros.data_inicio}
                onChange={(e) => setFiltros({...filtros, data_inicio: e.target.value})}
              />
            </div>
            <div className="campo-filtro">
              <label>Data fim:</label>
              <input 
                type="date"
                value={filtros.data_fim}
                onChange={(e) => setFiltros({...filtros, data_fim: e.target.value})}
              />
            </div>
            <button className="btn-aplicar-filtros" onClick={handleAplicarFiltros}>
              <i className="fas fa-search"></i> Aplicar
            </button>
          </div>
        </div>
      )}

      {/* Estatísticas (fornecedor) */}
      {user?.nivel === 'fornecedor' && viewMode === 'estatisticas' && estatisticas && (
        <div className="estatisticas-container">
          <h3><i className="fas fa-chart-line"></i> Estatísticas de Vendas</h3>
          <div className="estatisticas-grid">
            <div className="stat-card">
              <i className="fas fa-shopping-bag"></i>
              <div className="stat-info">
                <h4>{estatisticas.total_pedidos || 0}</h4>
                <p>Total de Pedidos</p>
              </div>
            </div>
            <div className="stat-card">
              <i className="fas fa-clock"></i>
              <div className="stat-info">
                <h4>{estatisticas.pedidos_pendentes || 0}</h4>
                <p>Pedidos Pendentes</p>
              </div>
            </div>
            <div className="stat-card">
              <i className="fas fa-check-circle"></i>
              <div className="stat-info">
                <h4>{estatisticas.pedidos_entregues || 0}</h4>
                <p>Pedidos Entregues</p>
              </div>
            </div>
            <div className="stat-card">
              <i className="fas fa-dollar-sign"></i>
              <div className="stat-info">
                <h4>R$ {(estatisticas.valor_total_vendas || 0).toFixed(2)}</h4>
                <p>Total em Vendas</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lista de pedidos */}
      {(!user?.nivel || user?.nivel !== 'fornecedor' || viewMode === 'lista') && (
        <div className="pedidos-content">
          {loading ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Carregando pedidos...</p>
            </div>
          ) : pedidos.length === 0 ? (
            <div className="empty-state">
              <i className="fas fa-inbox"></i>
              <h3>Nenhum pedido encontrado</h3>
              <p>
                {user?.nivel === 'comum' ? 'Você ainda não fez nenhum pedido.' :
                 user?.nivel === 'fornecedor' ? 'Nenhum pedido recebido ainda.' :
                 'Nenhum pedido no sistema.'}
              </p>
            </div>
          ) : (
            <div className="pedidos-lista">
              {pedidos.map(pedido => (
                <div key={pedido.id} className="pedido-card">
                  <div className="pedido-header">
                    <div className="pedido-id">
                      <strong>Pedido #{pedido.id}</strong>
                    </div>
                    <div className="pedido-status">
                      {formatarStatus(pedido.status)}
                    </div>
                  </div>
                  
                  <div className="pedido-info">
                    <div className="pedido-detalhes">
                      <p><strong>Data:</strong> {formatarData(pedido.created_at || pedido.data_pedido)}</p>
                      {user?.nivel !== 'comum' && pedido.cliente_nome && (
                        <p><strong>Cliente:</strong> {pedido.cliente_nome}</p>
                      )}
                      {user?.nivel === 'executivo' && pedido.fornecedor_nome && (
                        <p><strong>Fornecedor:</strong> {pedido.fornecedor_nome}</p>
                      )}
                      <p><strong>Total:</strong> R$ {(pedido.valor_total || 0).toFixed(2)}</p>
                      {pedido.total_itens && (
                        <p><strong>Itens:</strong> {pedido.total_itens}</p>
                      )}
                    </div>
                    
                    <div className="pedido-acoes">
                      <button 
                        className="btn-acao btn-detalhes"
                        onClick={() => handleVerDetalhes(pedido)}
                      >
                        <i className="fas fa-eye"></i> Ver Detalhes
                      </button>
                      {renderizarAcoes(pedido)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal de Detalhes */}
      {showDetalhModal && pedidoSelecionado && (
        <div className="modal-overlay" onClick={handleFecharModal}>
          <div className="modal-detalh-pedido" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3><i className="fas fa-receipt"></i> Detalhes do Pedido #{pedidoSelecionado.id}</h3>
              <button className="btn-fechar" onClick={handleFecharModal}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <div className="modal-body">
              <div className="detalh-grid">
                <div className="detalh-section">
                  <h4><i className="fas fa-info-circle"></i> Informações Gerais</h4>
                  <p><strong>Status:</strong> {formatarStatus(pedidoSelecionado.status)}</p>
                  <p><strong>Data do Pedido:</strong> {formatarData(pedidoSelecionado.created_at)}</p>
                  <p><strong>Valor Total:</strong> R$ {(pedidoSelecionado.valor_total || 0).toFixed(2)}</p>
                  {pedidoSelecionado.observacoes && (
                    <p><strong>Observações:</strong> {pedidoSelecionado.observacoes}</p>
                  )}
                </div>
                
                {pedidoSelecionado.endereco_entrega && typeof pedidoSelecionado.endereco_entrega === 'object' && (
                  <div className="detalh-section">
                    <h4><i className="fas fa-map-marker-alt"></i> Endereço de Entrega</h4>
                    <p>{pedidoSelecionado.endereco_entrega.logradouro}, {pedidoSelecionado.endereco_entrega.numero}</p>
                    {pedidoSelecionado.endereco_entrega.complemento && (
                      <p>{pedidoSelecionado.endereco_entrega.complemento}</p>
                    )}
                    <p>{pedidoSelecionado.endereco_entrega.bairro}</p>
                    <p>{pedidoSelecionado.endereco_entrega.cidade} - {pedidoSelecionado.endereco_entrega.estado}</p>
                    <p>CEP: {pedidoSelecionado.endereco_entrega.cep}</p>
                  </div>
                )}
                
                {pedidoSelecionado.itens && Array.isArray(pedidoSelecionado.itens) && pedidoSelecionado.itens.length > 0 && (
                  <div className="detalh-section itens-section">
                    <h4><i className="fas fa-list"></i> Itens do Pedido ({pedidoSelecionado.itens.length})</h4>
                    {pedidoSelecionado.itens.map((item, index) => (
                      <div key={index} className="item-detalh">
                        <p><strong>{item.produto_nome || `Produto ${item.produto_id}`}</strong></p>
                        <p>Quantidade: {item.quantidade}</p>
                        <p>Preço Unit.: R$ {(item.preco_unitario || 0).toFixed(2)}</p>
                        <p>Subtotal: R$ {(item.subtotal || 0).toFixed(2)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const getStatusBadgeClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'pendente':
        return 'badge-warning';
      case 'confirmado':
        return 'badge-info';
      case 'entregue':
        return 'badge-success';
      case 'cancelado':
        return 'badge-error';
      default:
        return 'badge-secondary';
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'pendente':
        return 'fa-clock';
      case 'confirmado':
        return 'fa-check';
      case 'entregue':
        return 'fa-truck';
      case 'cancelado':
        return 'fa-times';
      default:
        return 'fa-question';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  const filteredPedidos = pedidos.filter((pedido) => {
    const matchesSearch = 
      pedido.produto_nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pedido.id?.toString().includes(searchTerm) ||
      pedido.endereco_entrega?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'todos' || pedido.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Carregando pedidos...</p>
      </div>
    );
  }

  return (
    <div className="pedidos-container page-container">
      <div className="page-header">
        <div>
          <h1>
            <i className="fas fa-shopping-bag"></i>
            {user?.nivel?.toLowerCase() === 'comum' ? 'Meus Pedidos' : 
             user?.nivel?.toLowerCase() === 'fornecedor' ? 'Pedidos Recebidos' : 
             'Todos os Pedidos'}
          </h1>
          <p>
            {user?.nivel?.toLowerCase() === 'comum' ? 'Acompanhe seus pedidos realizados' :
             user?.nivel?.toLowerCase() === 'fornecedor' ? 'Pedidos dos produtos da sua empresa' :
             'Gestão de todos os pedidos do sistema'}
          </p>
        </div>
      </div>

      {/* Informações por nível de usuário */}
      {user?.nivel?.toLowerCase() === 'comum' && (
        <div className="info-banner info-comprador">
          <i className="fas fa-shopping-cart"></i>
          <div>
            <strong>Seus Pedidos</strong>
            <p>Aqui você encontra todos os pedidos que realizou. Status: Pendente → Confirmado → Entregue</p>
          </div>
        </div>
      )}

      {user?.nivel?.toLowerCase() === 'fornecedor' && (
        <div className="info-banner info-fornecedor">
          <i className="fas fa-store"></i>
          <div>
            <strong>Pedidos da Sua Empresa</strong>
            <p>Gerencie os pedidos recebidos dos produtos da sua empresa</p>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <h2 className="card-title">
            <i className="fas fa-list"></i>
            Lista de Pedidos
            {filteredPedidos.length > 0 && (
              <span className="badge badge-info">{filteredPedidos.length}</span>
            )}
          </h2>
          <div className="search-filters">
            <div className="search-box">
              <i className="fas fa-search"></i>
              <input
                type="text"
                placeholder="Buscar por produto, ID ou endereço..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select 
              className="form-control"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="todos">Todos Status</option>
              <option value="pendente">Pendente</option>
              <option value="confirmado">Confirmado</option>
              <option value="entregue">Entregue</option>
              <option value="cancelado">Cancelado</option>
            </select>
          </div>
        </div>

        <div className="card-body">
          {filteredPedidos.length === 0 ? (
            <div className="empty-state">
              <i className="fas fa-shopping-bag"></i>
              <h3>Nenhum pedido encontrado</h3>
              <p>
                {user?.nivel?.toLowerCase() === 'comum' 
                  ? 'Você ainda não fez nenhum pedido. Navegue pelos produtos para fazer sua primeira compra!'
                  : 'Nenhum pedido recebido ainda.'}
              </p>
            </div>
          ) : (
            <div className="pedidos-grid">
              {filteredPedidos.map((pedido) => (
                <div key={pedido.id} className="pedido-card">
                  <div className="pedido-header">
                    <div>
                      <h4>Pedido #{pedido.id}</h4>
                      <span className="pedido-data">
                        <i className="fas fa-calendar"></i>
                        {formatDate(pedido.criado_em)}
                      </span>
                    </div>
                    <span className={`badge ${getStatusBadgeClass(pedido.status)}`}>
                      <i className={`fas ${getStatusIcon(pedido.status)}`}></i>
                      {pedido.status}
                    </span>
                  </div>

                  <div className="pedido-produto">
                    <h5>{pedido.produto_nome}</h5>
                    <div className="produto-details">
                      <span>Quantidade: <strong>{pedido.quantidade}</strong></span>
                      <span>Unitário: <strong>R$ {parseFloat(pedido.preco_unitario).toFixed(2)}</strong></span>
                      <span className="total">Total: <strong>R$ {parseFloat(pedido.valor_total).toFixed(2)}</strong></span>
                    </div>
                  </div>

                  <div className="pedido-entrega">
                    <div className="entrega-info">
                      <i className="fas fa-map-marker-alt"></i>
                      <span>{pedido.endereco_entrega}</span>
                    </div>
                    <div className="contato-info">
                      <i className="fas fa-phone"></i>
                      <span>{pedido.telefone_contato}</span>
                    </div>
                  </div>

                  {pedido.observacoes && (
                    <div className="pedido-observacoes">
                      <strong>Observações:</strong>
                      <p>{pedido.observacoes}</p>
                    </div>
                  )}

                  <div className="pedido-actions">
                    {pedido.status === 'pendente' && user?.nivel?.toLowerCase() === 'comum' && (
                      <button className="btn btn-sm btn-outline-danger">
                        <i className="fas fa-times"></i>
                        Cancelar
                      </button>
                    )}
                    
                    {pedido.status === 'pendente' && user?.nivel?.toLowerCase() === 'fornecedor' && (
                      <>
                        <button className="btn btn-sm btn-success">
                          <i className="fas fa-check"></i>
                          Confirmar
                        </button>
                        <button className="btn btn-sm btn-outline-danger">
                          <i className="fas fa-times"></i>
                          Recusar
                        </button>
                      </>
                    )}

                    {pedido.status === 'confirmado' && user?.nivel?.toLowerCase() === 'fornecedor' && (
                      <button className="btn btn-sm btn-info">
                        <i className="fas fa-truck"></i>
                        Marcar como Entregue
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Pedidos;