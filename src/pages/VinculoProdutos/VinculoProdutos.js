import React, { useState, useEffect } from 'react';
import { 
  getProdutos, 
  getFornecedores,
  getVinculos,
  createVinculo,
  createVinculosMultiplos,
  deleteVinculo,
  deleteVinculosEmMassa,
  deleteVinculosPorProduto,
  getVinculosPorFornecedor,
  deleteVinculoPorProdutoFornecedor,
  setVinculoPrincipal,
  getHistoricoVinculos,
  getProdutosDisponiveis
} from '../../services/api';
import ProdutoImagem from '../../components/ProdutoImagem/ProdutoImagem';
import './VinculoProdutos.css';

const VinculoProdutos = ({ user }) => {
  // Estado para abas
  const [abaAtiva, setAbaAtiva] = useState('todos');
  
  // Estados gerais
  const [produtos, setProdutos] = useState([]);
  const [fornecedores, setFornecedores] = useState([]);
  const [vinculos, setVinculos] = useState([]);
  const [produtosDisponiveis, setProdutosDisponiveis] = useState([]);
  const [loadingMarketplace, setLoadingMarketplace] = useState(false);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Filtros
  const [termoBusca, setTermoBusca] = useState('');
  
  // Seleção múltipla para remoção em massa
  const [vinculosSelecionados, setVinculosSelecionados] = useState([]);
  const [removendoEmMassa, setRemovendoEmMassa] = useState(false);
  
  // Modal
  const [showModal, setShowModal] = useState(false);
  const [showModalMultiplo, setShowModalMultiplo] = useState(false);
  const [produtoSelecionado, setProdutoSelecionado] = useState(null);
  const [fornecedorSelecionado, setFornecedorSelecionado] = useState(null);
  const [precoFornecedor, setPrecoFornecedor] = useState('');

  // Modal Histórico
  const [showModalHistorico, setShowModalHistorico] = useState(false);
  const [historicoData, setHistoricoData] = useState([]);
  const [loadingHistorico, setLoadingHistorico] = useState(false);
  const [produtoHistorico, setProdutoHistorico] = useState(null);

  const isFornecedor = user?.nivel?.toLowerCase() === 'fornecedor';
  const isExecutivo = user?.nivel?.toLowerCase() === 'executivo';

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      setLoading(true);
      setError('');

      // Carregar produtos disponíveis
      const responseProdutos = await getProdutos();
      const produtosArray = Array.isArray(responseProdutos)
        ? responseProdutos
        : (responseProdutos?.produtos || responseProdutos?.data || []);
      setProdutos(produtosArray);

      // Carregar fornecedores disponíveis
      const responseFornecedores = await getFornecedores();
      const fornecedoresArray = Array.isArray(responseFornecedores)
        ? responseFornecedores
        : (responseFornecedores?.fornecedores || responseFornecedores?.data || []);
      setFornecedores(fornecedoresArray);

      // Carregar todos os vínculos
      try {
        const todosVinculos = await getVinculos();
        const novosVinculos = Array.isArray(todosVinculos) ? [...todosVinculos] : ([...(todosVinculos?.data || [])]);
        setVinculos(novosVinculos);
      } catch (e) {
        setVinculos([]);
      }


    } catch (err) {
      setError('⚠️ Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const carregarMarketplace = async () => {
    if (!isFornecedor) return;
    
    try {
      setLoadingMarketplace(true);
      const disponiveis = await getProdutosDisponiveis();
      setProdutosDisponiveis(Array.isArray(disponiveis) ? disponiveis : []);
    } catch (err) {
      // Não exibimos erro global para não atrapalhar a navegação, apenas log
    } finally {
      setLoadingMarketplace(false);
    }
  };

  useEffect(() => {
    if (abaAtiva === 'marketplace' && isFornecedor) {
      carregarMarketplace();
    }
  }, [abaAtiva, isFornecedor]);

  const abrirModalVinculo = (produto = null) => {
    setProdutoSelecionado(produto);
    setFornecedorSelecionado(isFornecedor ? user?.loja?.id : null);
    setPrecoFornecedor(produto?.preco || '');
    setShowModal(true);
    setError('');
    setSuccess('');
  };

  const fecharModal = () => {
    setShowModal(false);
    setProdutoSelecionado(null);
    setFornecedorSelecionado(null);
    setPrecoFornecedor('');
    setError('');
    setSuccess('');
  };

  const criarNovoVinculo = async () => {
    try {
      setError('');
      setSuccess('');

      if (!produtoSelecionado) {
        setError('Selecione um produto');
        return;
      }

      const fornecedorId = isFornecedor ? user?.loja?.id : fornecedorSelecionado;
      
      if (!fornecedorId) {
        setError('Selecione um fornecedor');
        return;
      }

      const vinculoData = {
        id_produto: produtoSelecionado.id,
        id_fornecedor: parseInt(fornecedorId),
        preco_fornecedor: parseFloat(precoFornecedor) || produtoSelecionado.preco || 0,
        status: 'Ativo'
      };

      await createVinculo(vinculoData);
      
      setSuccess('✅ Vínculo criado com sucesso!');
      carregarDados();
      if (isFornecedor) carregarMarketplace();
      
      setTimeout(() => {
        fecharModal();
      }, 1500);

    } catch (err) {
      setError(err.message || '❌ Erro ao criar vínculo');
    }
  };

  const removerVinculo = async (vinculo) => {
    const produto = getProdutoById(vinculo.id_produto);
    const nomeProduto = produto?.nome || `Produto #${vinculo.id_produto}`;
    
    if (!window.confirm(`Tem certeza que deseja remover o vínculo com "${nomeProduto}"?`)) return;
    
    setError('');
    setSuccess('');

    try {
      // Usar a função de deleção que o backend espera, com id_produto e id_fornecedor
      await deleteVinculoPorProdutoFornecedor(vinculo.id_produto, vinculo.id_fornecedor);
      
      setVinculos(prev => prev.filter(v => v.id !== vinculo.id)); // Remove localmente
      setSuccess(`✅ Vínculo removido!`);
      
      setTimeout(() => setSuccess(''), 3000);

    } catch (err) {
      setError(err.message || '❌ Erro ao remover vínculo');
    }
  };

  // Funções de seleção múltipla
  const toggleSelecaoVinculo = (vinculoId) => {
    setVinculosSelecionados(prev => 
      prev.includes(vinculoId) 
        ? prev.filter(id => id !== vinculoId)
        : [...prev, vinculoId]
    );
  };

  const selecionarTodos = () => {
    const vinculosVisiveis = vinculosFiltrados();
    const todosIds = vinculosVisiveis.map(v => v.id);
    
    // Se todos já estão selecionados, desseleciona todos
    const todosSelecionados = todosIds.every(id => vinculosSelecionados.includes(id));
    
    if (todosSelecionados) {
      setVinculosSelecionados([]);
    } else {
      setVinculosSelecionados(todosIds);
    }
  };

  const limparSelecao = () => {
    setVinculosSelecionados([]);
  };

  const removerVinculosEmMassa = async () => {
    if (vinculosSelecionados.length === 0) {
      setError('Selecione pelo menos um vínculo para remover');
      return;
    }

    // Buscar os objetos completos dos vínculos selecionados
    const vinculosParaRemover = vinculos.filter(v => vinculosSelecionados.includes(v.id));
    // Filtrar apenas vínculos válidos
    const vinculosValidos = vinculosParaRemover.filter(v => v.id_produto && v.id_fornecedor);
    const qtd = vinculosValidos.length;
    if (qtd === 0) {
      setError('Nenhum vínculo válido selecionado para remover');
      return;
    }
    if (!window.confirm(`Tem certeza que deseja remover ${qtd} vínculo(s)?`)) return;

    try {
      setRemovendoEmMassa(true);
      setError('');
      setSuccess('');

      const resultado = await deleteVinculosEmMassa(vinculosValidos);

      // Se o resultado for um objeto com sucesso/falhas, é fallback (remoção um a um)
      let sucessos = qtd;
      let falhas = 0;
      let idsRemovidos = vinculosValidos.map(v => v.id);

      if (resultado && typeof resultado === 'object' && ('sucesso' in resultado || 'falhas' in resultado)) {
        sucessos = resultado.sucesso?.length || 0;
        falhas = resultado.falhas?.length || 0;
        idsRemovidos = resultado.sucesso || []; // Garante que temos os IDs corretos

        if (falhas > 0) {
          setSuccess(`✅ ${sucessos} vínculos removidos. ⚠️ ${falhas} falharam.`);
        } else {
          setSuccess(`✅ ${sucessos} vínculos removidos com sucesso!`);
        }
        if (resultado.falhas?.length > 0) {
          // Falhas silenciosas
        }
      } else {
        setSuccess(`✅ ${qtd} vínculos removidos com sucesso!`);
      }

      setVinculos(prev => prev.filter(v => !idsRemovidos.includes(v.id)));
      setVinculosSelecionados([]);
      
      setTimeout(() => setSuccess(''), 4000);

    } catch (err) {
      setError(err.message || '❌ Erro ao remover vínculos em massa');
    } finally {
      setRemovendoEmMassa(false);
    }
  };

  // Remover todos os vínculos de um produto
  const removerVinculosPorProduto = async (produto) => {
    const vinculosProduto = vinculos.filter(v => v.id_produto === produto.id);
    if (vinculosProduto.length === 0) {
      setError('Este produto não possui vínculos');
      return;
    }

    const qtd = vinculosProduto.length;
    if (!window.confirm(`Remover TODOS os ${qtd} vínculos do produto "${produto.nome}"?`)) return;

    try {
      setError('');
      await deleteVinculosPorProduto(produto.id);
      
      setVinculos(prev => prev.filter(v => v.id_produto !== produto.id)); // Remove localmente
      
      setSuccess(`✅ Todos os vínculos do produto "${produto.nome}" foram removidos!`);
      setTimeout(() => setSuccess(''), 4000);
      
    } catch (err) {
      console.error('[VinculoProdutos] Erro ao remover vínculos do produto:', err);
      setError('❌ Erro ao remover vínculos do produto');
    }
  };

  // Modal para criar vínculos múltiplos
  const abrirModalMultiplo = () => {
    setShowModalMultiplo(true);
    setError('');
    setSuccess('');
  };

  const fecharModalMultiplo = () => {
    setShowModalMultiplo(false);
  };

  const criarVinculosMultiplos = async () => {
    try {
      const produtosSelecionados = Array.from(
        document.querySelectorAll('.produtos-list input[type="checkbox"]:checked')
      ).map(input => parseInt(input.value));
      
      const fornecedoresSelecionados = Array.from(
        document.querySelectorAll('.fornecedores-list input[type="checkbox"]:checked')
      ).map(input => parseInt(input.value));

      if (produtosSelecionados.length === 0) {
        setError('Selecione pelo menos um produto');
        return;
      }

      if (fornecedoresSelecionados.length === 0) {
        setError('Selecione pelo menos um fornecedor');
        return;
      }

      // Criar todas as combinações possíveis
      const vinculos = [];
      produtosSelecionados.forEach(produtoId => {
        fornecedoresSelecionados.forEach(fornecedorId => {
          const produto = produtos.find(p => p.id === produtoId);
          vinculos.push({
            id_produto: produtoId,
            id_fornecedor: fornecedorId,
            preco_fornecedor: produto?.preco || 0,
            status: 'Ativo'
          });
        });
      });

      console.log('[VinculoProdutos] Criando vínculos múltiplos:', vinculos);
      
      setError('');
      await createVinculosMultiplos(vinculos);
      
      const total = vinculos.length;
      setSuccess(`✅ ${total} vínculos criados com sucesso!`);
      
      carregarDados();
      
      setTimeout(() => {
        fecharModalMultiplo();
      }, 2000);

    } catch (err) {
      console.error('[VinculoProdutos] Erro ao criar vínculos múltiplos:', err);
      setError(err.message || '❌ Erro ao criar vínculos múltiplos');
    }
  };

  // Funções de Fornecedor Principal e Histórico
  const definirPrincipal = async (vinculo) => {
    try {
      setError('');
      setSuccess('');
      
      await setVinculoPrincipal(vinculo.id_produto, vinculo.id_fornecedor);
      
      // Atualizar estado local para refletir a mudança imediatamente
      setVinculos(prev => prev.map(v => {
        // Se for do mesmo produto
        if (v.id_produto === vinculo.id_produto) {
          return {
            ...v,
            // Marca como principal se for o fornecedor escolhido, desmarca os outros
            principal: v.id_fornecedor === vinculo.id_fornecedor
          };
        }
        return v;
      }));
      
      setSuccess('✅ Fornecedor definido como principal com sucesso!');
      setTimeout(() => setSuccess(''), 3000);
      
    } catch (err) {
      setError(err.message || '❌ Erro ao definir fornecedor principal');
    }
  };

  const verHistorico = async (produto) => {
    setProdutoHistorico(produto);
    setShowModalHistorico(true);
    setLoadingHistorico(true);
    setHistoricoData([]);
    setError('');

    try {
      const dados = await getHistoricoVinculos(produto.id);
      setHistoricoData(Array.isArray(dados) ? dados : (dados?.data || []));
    } catch (err) {
      setError('Erro ao carregar histórico de vínculos');
    } finally {
      setLoadingHistorico(false);
    }
  };
  
  const fecharModalHistorico = () => {
    setShowModalHistorico(false);
    setProdutoHistorico(null);
    setHistoricoData([]);
  };

  const produtosFiltrados = () => {
    return produtos.filter(produto => {
      const matchBusca = !termoBusca || 
        produto.nome?.toLowerCase().includes(termoBusca.toLowerCase()) ||
        produto.descricao?.toLowerCase().includes(termoBusca.toLowerCase());
      
      return matchBusca;
    });
  };

  const vinculosFiltrados = () => {
    return vinculos.filter(vinculo => {
      const produto = produtos.find(p => p.id === vinculo.id_produto);
      const fornecedor = fornecedores.find(f => f.id === vinculo.id_fornecedor);
      
      const matchBusca = !termoBusca || 
        produto?.nome?.toLowerCase().includes(termoBusca.toLowerCase()) ||
        fornecedor?.nome?.toLowerCase().includes(termoBusca.toLowerCase());
      
      return matchBusca;
    });
  };

  const formatarValor = (valor) => {
    return parseFloat(valor || 0).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };

  const getProdutoById = (id) => produtos.find(p => p.id === id);
  const getFornecedorById = (id) => fornecedores.find(f => f.id === id);

  const produtoJaVinculado = (produtoId, fornecedorId) => {
    return vinculos.some(v => v.id_produto === produtoId && v.id_fornecedor === fornecedorId);
  };

  if (loading) {
    return (
      <div className="vinculo-loading">
        <i className="fas fa-spinner fa-spin fa-2x"></i>
        <p>Carregando...</p>
      </div>
    );
  }

  return (
    <div className="vinculo-produtos-container">
      {/* Header */}
      <div className="vinculo-header">
        <div className="header-info">
          <h2>
            <i className="fas fa-link"></i> 
            {isFornecedor ? ' Vincular Meus Produtos' : ' Vínculos Produto-Fornecedor'}
          </h2>
          <p>
            {isFornecedor 
              ? 'Vincule produtos ao seu catálogo de fornecedor'
              : 'Veja quais fornecedores oferecem cada produto'
            }
          </p>
        </div>
        <div className="header-stats">
          <div className="stat-card">
            <i className="fas fa-link"></i>
            <span>{vinculos.length} Vínculos</span>
          </div>
          <div className="stat-card">
            <i className="fas fa-box"></i>
            <span>{produtos.length} Produtos</span>
          </div>
          <div className="stat-card">
            <i className="fas fa-store"></i>
            <span>{fornecedores.length} Fornecedores</span>
          </div>
        </div>
      </div>

      {/* Mensagens */}
      {error && (
        <div className="alert-message error">
          <i className="fas fa-exclamation-triangle"></i>
          {error}
        </div>
      )}
      
      {success && (
        <div className="alert-message success">
          <i className="fas fa-check-circle"></i>
          {success}
        </div>
      )}

      {/* Abas de Navegação */}
      <div className="vinculos-tabs">
        <button 
          className={`tab-btn ${abaAtiva === 'todos' ? 'active' : ''}`}
          onClick={() => setAbaAtiva('todos')}
        >
          <i className="fas fa-list"></i> Todos os Vínculos
        </button>
        <button 
          className={`tab-btn ${abaAtiva === 'produtos' ? 'active' : ''}`}
          onClick={() => setAbaAtiva('produtos')}
        >
          <i className="fas fa-box"></i> Por Produto
        </button>
        {isFornecedor && (
          <>
            <button 
              className={`tab-btn ${abaAtiva === 'meus' ? 'active' : ''}`}
              onClick={() => setAbaAtiva('meus')}
            >
              <i className="fas fa-store"></i> Meus Vínculos
              {vinculos.filter(v => v.id_fornecedor === user?.loja?.id).length > 0 && (
                <span className="badge">{vinculos.filter(v => v.id_fornecedor === user?.loja?.id).length}</span>
              )}
            </button>
            <button 
              className={`tab-btn ${abaAtiva === 'marketplace' ? 'active' : ''}`}
              onClick={() => setAbaAtiva('marketplace')}
            >
              <i className="fas fa-cart-plus"></i> Marketplace
              <span className="badge-new">Novo</span>
            </button>
          </>
        )}
      </div>

      {/* Filtros e Ação */}
      <div className="vinculo-filters">
        <div className="filter-group">
          <input
            type="text"
            placeholder="🔍 Buscar produto ou fornecedor..."
            value={termoBusca}
            onChange={(e) => setTermoBusca(e.target.value)}
            className="search-input"
          />
        </div>
        
        <div className="action-buttons">
          {/* Botões de seleção em massa - só aparecem na aba "todos" */}
          {abaAtiva === 'todos' && (isFornecedor || isExecutivo) && vinculosFiltrados().length > 0 && (
            <>
              {vinculosSelecionados.length > 0 && (
                <span className="selection-count">
                  {vinculosSelecionados.length} selecionado(s)
                </span>
              )}
              <button 
                className="btn btn-outline-secondary btn-sm" 
                onClick={selecionarTodos}
                title="Selecionar/Desselecionar todos"
              >
                <i className="fas fa-check-double"></i>
                {vinculosFiltrados().every(v => vinculosSelecionados.includes(v.id)) 
                  ? 'Desselecionar' : 'Selecionar Todos'}
              </button>
              {vinculosSelecionados.length > 0 && (
                <>
                  <button 
                    className="btn btn-outline-secondary btn-sm" 
                    onClick={limparSelecao}
                  >
                    <i className="fas fa-times"></i> Limpar
                  </button>
                  <button 
                    className="btn btn-danger btn-sm" 
                    onClick={removerVinculosEmMassa}
                    disabled={removendoEmMassa}
                  >
                    {removendoEmMassa ? (
                      <><i className="fas fa-spinner fa-spin"></i> Removendo...</>
                    ) : (
                      <><i className="fas fa-trash"></i> Remover ({vinculosSelecionados.length})</>
                    )}
                  </button>
                </>
              )}
            </>
          )}
          
          {(isFornecedor || isExecutivo) && (
            <div className="action-buttons-group">
              <button className="btn btn-primary" onClick={() => abrirModalVinculo()}>
                <i className="fas fa-plus"></i> Novo Vínculo
              </button>
              {isExecutivo && (
                <button className="btn btn-secondary" onClick={abrirModalMultiplo}>
                  <i className="fas fa-plus-circle"></i> Vínculos Múltiplos
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Aba: TODOS OS VÍNCULOS */}
      {abaAtiva === 'todos' && (
        <div className="tab-content">
          <h3><i className="fas fa-list"></i> Todos os Vínculos</h3>
          
          {vinculosFiltrados().length === 0 ? (
            <div className="empty-state">
              <i className="fas fa-unlink fa-2x"></i>
              <h4>Nenhum vínculo encontrado</h4>
              <p>Ainda não há vínculos entre produtos e fornecedores.</p>
            </div>
          ) : (
            <div className="vinculos-table">
              <table>
                <thead>
                  <tr>
                    {(isFornecedor || isExecutivo) && (
                      <th className="th-checkbox">
                        <input
                          type="checkbox"
                          checked={vinculosFiltrados().length > 0 && vinculosFiltrados().every(v => vinculosSelecionados.includes(v.id))}
                          onChange={selecionarTodos}
                          title="Selecionar todos"
                        />
                      </th>
                    )}
                    <th>Produto</th>
                    <th>Fornecedor</th>
                    <th>Preço Fornecedor</th>
                    <th>Status</th>
                    {(isFornecedor || isExecutivo) && <th>Ações</th>}
                  </tr>
                </thead>
                <tbody>
                  {vinculosFiltrados().map(vinculo => {
                    const produto = getProdutoById(vinculo.id_produto);
                    const fornecedor = getFornecedorById(vinculo.id_fornecedor);
                    const podeRemover = isExecutivo || (isFornecedor && vinculo.id_fornecedor === user?.loja?.id);
                    const estaSelecionado = vinculosSelecionados.includes(vinculo.id);
                    
                    return (
                      <tr key={vinculo.id} className={estaSelecionado ? 'row-selected' : ''}>
                        {(isFornecedor || isExecutivo) && (
                          <td className="td-checkbox">
                            <input
                              type="checkbox"
                              checked={estaSelecionado}
                              onChange={() => toggleSelecaoVinculo(vinculo.id)}
                            />
                          </td>
                        )}
                        <td>
                          <div className="cell-produto">
                            <i className="fas fa-shoe-prints"></i>
                            <span>{produto?.nome || `Produto #${vinculo.id_produto}`}</span>
                          </div>
                        </td>
                        <td>
                          <div className="cell-fornecedor">
                            <i className="fas fa-store"></i>
                            <span>{fornecedor?.nome || `Fornecedor #${vinculo.id_fornecedor}`}</span>
                          </div>
                        </td>
                        <td className="cell-preco">
                          {formatarValor(vinculo.preco_fornecedor)}
                        </td>
                        <td>
                          <span className={`status-badge ${vinculo.status?.toLowerCase()}`}>
                            {vinculo.status}
                          </span>
                        </td>
                        {(isFornecedor || isExecutivo) && (
                          <td>
                            {isExecutivo && (
                              <button
                                className={`btn btn-sm ${vinculo.principal ? 'btn-warning' : 'btn-outline-secondary'}`}
                                onClick={() => definirPrincipal(vinculo)}
                                title={vinculo.principal ? 'Fornecedor Principal' : 'Definir como Principal'}
                                style={{ marginRight: '5px' }}
                              >
                                <i className={`fas fa-star`}></i>
                              </button>
                            )}
                            
                            {podeRemover && (
                              <button 
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => removerVinculo(vinculo)}
                              >
                                <i className="fas fa-trash"></i>
                              </button>
                            )}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Aba: POR PRODUTO */}
      {abaAtiva === 'produtos' && (
        <div className="tab-content">
          <h3><i className="fas fa-box"></i> Produtos e seus Fornecedores</h3>
          
          {produtosFiltrados().length === 0 ? (
            <div className="empty-state">
              <i className="fas fa-search fa-2x"></i>
              <h4>Nenhum produto encontrado</h4>
            </div>
          ) : (
            <div className="items-grid">
              {produtosFiltrados().map(produto => {
                const vinculosProduto = vinculos.filter(v => v.id_produto === produto.id);
                const jaVinculado = isFornecedor && produtoJaVinculado(produto.id, user?.loja?.id);
                
                return (
                  <div key={produto.id} className="item-card">
                    <ProdutoImagem 
                      produtoId={produto.id}
                      produtoNome={produto.nome}
                      size="banner"
                      className="item-image-wrapper"
                    />
                    {vinculosProduto.length > 0 && (
                      <div className="vinculo-count">
                        {vinculosProduto.length}
                      </div>
                    )}
                    
                    <div className="item-info">
                      <h4>{produto.nome}</h4>
                      <p className="item-categoria">
                        {typeof produto.categoria === 'object' ? produto.categoria?.nome : produto.categoria}
                      </p>
                      <p className="item-preco">{formatarValor(produto.preco)}</p>
                      
                      {vinculosProduto.length > 0 ? (
                        <div className="fornecedores-lista">
                          <small>Fornecedores:</small>
                          {vinculosProduto.map(v => {
                            const forn = getFornecedorById(v.id_fornecedor);
                            return (
                              <span key={v.id} className={`fornecedor-tag ${v.principal ? 'principal' : ''}`}>
                                {forn?.nome || `#${v.id_fornecedor}`}
                                {v.principal && <i className="fas fa-star" style={{ color: '#f59e0b', marginLeft: '5px' }} title="Principal"></i>}
                                
                                {isExecutivo && !v.principal && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      definirPrincipal(v);
                                    }}
                                    title="Definir como Principal"
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', marginLeft: '5px' }}
                                  >
                                    <i className="far fa-star"></i>
                                  </button>
                                )}
                                <small>{formatarValor(v.preco_fornecedor)}</small>
                              </span>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="sem-fornecedor">Sem fornecedores vinculados</p>
                      )}
                    </div>
                    
                    {isFornecedor && (
                      <div className="item-actions">
                        <button
                          className={`btn ${jaVinculado ? 'btn-success' : 'btn-primary'}`}
                          onClick={() => !jaVinculado && abrirModalVinculo(produto)}
                          disabled={jaVinculado}
                        >
                          <i className={`fas fa-${jaVinculado ? 'check' : 'link'}`}></i>
                          {jaVinculado ? 'Vinculado' : 'Vincular'}
                        </button>
                      </div>
                    )}
                    
                    {/* Ações Administrativas (Executivo) */}
                    {isExecutivo && vinculosProduto.length > 0 && (
                      <div className="item-actions" style={{ display: 'flex', gap: '5px' }}>
                        <button
                          className="btn btn-info btn-sm"
                          onClick={() => verHistorico(produto)}
                          title="Ver Histórico de Vínculos"
                          style={{ color: 'white' }}
                        >
                          <i className="fas fa-history"></i> Histórico
                        </button>
                        
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => removerVinculosPorProduto(produto)}
                          title={`Remover todos os ${vinculosProduto.length} vínculos`}
                        >
                          <i className="fas fa-trash"></i> Limpar
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Aba: MEUS VÍNCULOS (Fornecedor) */}
      {abaAtiva === 'meus' && isFornecedor && (
        <div className="tab-content">
          <h3><i className="fas fa-store"></i> Meus Produtos Vinculados</h3>
          {vinculos.filter(v => v.id_fornecedor === user?.loja?.id).length === 0 ? (
            <div className="empty-state">
              <i className="fas fa-unlink fa-2x"></i>
              <h4>Você ainda não vinculou produtos</h4>
              <p>Vá na aba "Marketplace" para encontrar novos produtos para vender.</p>
            </div>
          ) : (
            <div className="vinculos-list">
              {vinculos.filter(v => v.id_fornecedor === user?.loja?.id).map(vinculo => {
                const produto = getProdutoById(vinculo.id_produto);
                return (
                  <div key={vinculo.id} className="vinculo-item">
                    <div className="vinculo-image">
                      {produto?.imagem ? (
                        <img src={produto.imagem} alt={produto?.nome} />
                      ) : (
                        <div className="placeholder-image small">
                          <i className="fas fa-shoe-prints"></i>
                        </div>
                      )}
                    </div>
                    <div className="vinculo-info">
                      <h5>{produto?.nome || `Produto #${vinculo.id_produto}`}</h5>
                      <p>{produto?.categoria}</p>
                      <p className="vinculo-preco">
                        Meu preço: {formatarValor(vinculo.preco_fornecedor)}
                      </p>
                      <span className={`status-badge ${vinculo.status?.toLowerCase()}`}>
                        {vinculo.status}
                      </span>
                    </div>
                    <button 
                      className="btn btn-outline-danger btn-sm"
                      onClick={() => removerVinculo(vinculo)}
                    >
                      <i className="fas fa-unlink"></i>
                      Desvincular
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Aba: MARKETPLACE (Novos Produtos) */}
      {abaAtiva === 'marketplace' && isFornecedor && (
        <div className="tab-content">
          <div className="marketplace-header">
            <h3><i className="fas fa-cart-plus"></i> Marketplace de Produtos</h3>
            <p>Encontre novos produtos para adicionar ao seu catálogo de vendas.</p>
          </div>
          
          {loadingMarketplace ? (
            <div className="vinculo-loading">
              <i className="fas fa-spinner fa-spin fa-2x"></i>
              <p>Buscando oportunidades...</p>
            </div>
          ) : produtosDisponiveis.length === 0 ? (
            <div className="empty-state">
              <i className="fas fa-box-open fa-2x"></i>
              <h4>Nenhum produto novo disponível</h4>
              <p>No momento, não há novos produtos disponíveis para vínculo.</p>
            </div>
          ) : (
            <div className="items-grid">
              {produtosDisponiveis
                .filter(p => !termoBusca || p.nome.toLowerCase().includes(termoBusca.toLowerCase()))
                .map(produto => (
                <div key={produto.id} className="item-card marketplace-card">
                  <div className="card-badge-new">Novo</div>
                  <ProdutoImagem 
                    produtoId={produto.id}
                    produtoNome={produto.nome}
                    size="banner"
                    className="item-image-wrapper"
                  />
                  
                  <div className="item-info">
                    <h4>{produto.nome}</h4>
                    <p className="item-categoria">
                      {typeof produto.categoria === 'object' ? produto.categoria?.nome : produto.categoria}
                    </p>
                    <p className="item-preco">{formatarValor(produto.preco)}</p>
                    <p className="item-desc">{produto.descricao}</p>
                  </div>
                  
                  <div className="item-actions">
                    <button
                      className="btn btn-success btn-block"
                      onClick={() => abrirModalVinculo(produto)}
                    >
                      <i className="fas fa-plus-circle"></i>
                      Quero Vender
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal de Criar Vínculo */}
      {showModal && (
        <div className="modal-overlay" onClick={fecharModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h4>
                <i className="fas fa-link"></i>
                Criar Vínculo Produto-Fornecedor
              </h4>
              <button className="modal-close" onClick={fecharModal}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <div className="modal-body">
              {/* Seleção de Produto */}
              <div className="form-group">
                <label>Produto *</label>
                {produtoSelecionado ? (
                  <div className="selected-item">
                    <i className="fas fa-shoe-prints"></i>
                    <span>{produtoSelecionado.nome}</span>
                    <button onClick={() => setProdutoSelecionado(null)}>
                      <i className="fas fa-times"></i>
                    </button>
                  </div>
                ) : (
                  <select 
                    value={produtoSelecionado?.id || ''}
                    onChange={(e) => {
                      const prod = produtos.find(p => p.id === parseInt(e.target.value));
                      setProdutoSelecionado(prod);
                      if (prod) setPrecoFornecedor(prod.preco || '');
                    }}
                    className="form-control"
                  >
                    <option value="">Selecione um produto...</option>
                    {produtos.map(prod => (
                      <option key={prod.id} value={prod.id}>
                        {prod.nome} - {formatarValor(prod.preco)}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Seleção de Fornecedor (se não for fornecedor logado) */}
              {!isFornecedor && (
                <div className="form-group">
                  <label>Fornecedor *</label>
                  <select 
                    value={fornecedorSelecionado || ''}
                    onChange={(e) => setFornecedorSelecionado(e.target.value)}
                    className="form-control"
                  >
                    <option value="">Selecione um fornecedor...</option>
                    {fornecedores.map(forn => (
                      <option key={forn.id} value={forn.id}>
                        {forn.nome}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Preço do Fornecedor */}
              <div className="form-group">
                <label>Preço do Fornecedor (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={precoFornecedor}
                  onChange={(e) => setPrecoFornecedor(e.target.value)}
                  className="form-control"
                  placeholder="0,00"
                />
              </div>

              {error && (
                <div className="alert-message error">
                  <i className="fas fa-exclamation-triangle"></i>
                  {error}
                </div>
              )}
              
              {success && (
                <div className="alert-message success">
                  <i className="fas fa-check-circle"></i>
                  {success}
                </div>
              )}
            </div>
            
            <div className="modal-actions">
              <button className="btn btn-outline-secondary" onClick={fecharModal}>
                Cancelar
              </button>
              <button className="btn btn-primary" onClick={criarNovoVinculo}>
                <i className="fas fa-link"></i>
                Criar Vínculo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Vínculos Múltiplos (Executivo) */}
      {showModalMultiplo && (
        <div className="modal-overlay" onClick={fecharModalMultiplo}>
          <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h4>
                <i className="fas fa-plus-circle"></i>
                Criar Vínculos Múltiplos
              </h4>
              <button className="modal-close" onClick={fecharModalMultiplo}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <div className="modal-body">
              <div className="form-group">
                <p className="help-text">
                  <i className="fas fa-info-circle"></i>
                  Selecione múltiplos produtos e fornecedores para criar vários vínculos de uma vez.
                </p>
              </div>

              <div className="vinculos-multiplos-grid">
                <div className="produtos-section">
                  <h5>Produtos Disponíveis</h5>
                  <div className="produtos-list">
                    {produtos.map(produto => (
                      <div key={produto.id} className="produto-item">
                        <label>
                          <input type="checkbox" value={produto.id} />
                          <span>{produto.nome}</span>
                          <small>{formatarValor(produto.preco)}</small>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="fornecedores-section">
                  <h5>Fornecedores Disponíveis</h5>
                  <div className="fornecedores-list">
                    {fornecedores.map(fornecedor => (
                      <div key={fornecedor.id} className="fornecedor-item">
                        <label>
                          <input type="checkbox" value={fornecedor.id} />
                          <span>{fornecedor.nome}</span>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {error && (
                <div className="alert-message error">
                  <i className="fas fa-exclamation-triangle"></i>
                  {error}
                </div>
              )}
              
              {success && (
                <div className="alert-message success">
                  <i className="fas fa-check-circle"></i>
                  {success}
                </div>
              )}
            </div>
            
            <div className="modal-actions">
              <button className="btn btn-outline-secondary" onClick={fecharModalMultiplo}>
                Cancelar
              </button>
              <button className="btn btn-primary" onClick={criarVinculosMultiplos}>
                <i className="fas fa-plus-circle"></i>
                Criar Vínculos
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Histórico */}
      {showModalHistorico && (
        <div className="modal-overlay" onClick={fecharModalHistorico}>
          <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h4>
                <i className="fas fa-history"></i>
                Histórico de Vínculos: {produtoHistorico?.nome}
              </h4>
              <button className="modal-close" onClick={fecharModalHistorico}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <div className="modal-body">
              {loadingHistorico ? (
                <div className="vinculo-loading">
                  <i className="fas fa-spinner fa-spin fa-2x"></i>
                  <p>Carregando histórico...</p>
                </div>
              ) : historicoData.length === 0 ? (
                <div className="empty-state">
                  <i className="fas fa-history fa-2x"></i>
                  <h4>Nenhum histórico encontrado</h4>
                  <p>Não há registros de alterações para este produto.</p>
                </div>
              ) : (
                <div className="vinculos-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Data/Hora</th>
                        <th>Ação</th>
                        <th>Fornecedor</th>
                        <th>Usuário</th>
                        <th>Detalhes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {historicoData.map((hist, index) => (
                        <tr key={index}>
                          <td>{new Date(hist.created_at || hist.data_acao).toLocaleString()}</td>
                          <td>
                            <span className={`status-badge ${
                              (hist.acao === 'CRIACAO' || hist.acao === 'ADICAO') ? 'ativo' : 
                              (hist.acao === 'REMOCAO' || hist.acao === 'EXCLUSAO') ? 'inativo' : 
                              'warning'
                            }`}>
                              {hist.acao}
                            </span>
                          </td>
                          <td>{hist.fornecedor_nome || `#${hist.id_fornecedor}`}</td>
                          <td>{hist.usuario_nome || 'Sistema'}</td>
                          <td>{hist.detalhes || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            
            <div className="modal-actions">
              <button className="btn btn-primary" onClick={fecharModalHistorico}>
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VinculoProdutos;
