import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import $ from 'jquery';
import {
  getFornecedores,
  createFornecedor,
  updateFornecedor,
  deleteFornecedor,
  getProdutos,
  getProdutoImagens,
} from '../../services/api';
import { showNotification } from '../../services/api';
import './Fornecedores.css';

function Fornecedores({ user }) {
  const navigate = useNavigate();
  const [fornecedores, setFornecedores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDetalhesModal, setShowDetalhesModal] = useState(false);
  const [fornecedorSelecionado, setFornecedorSelecionado] = useState(null);
  const [produtosFornecedor, setProdutosFornecedor] = useState([]);
  const [imagensFornecedor, setImagensFornecedor] = useState({}); // Cache imagens produtos do fornecedor
  const [loadingProdutos, setLoadingProdutos] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    telefone: '',
    cnpj: '',
    endereco: '',
    status: 'Ativo',
  });
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadFornecedores();
  }, []);

  const loadFornecedores = async () => {
    try {
      setLoading(true);
      const data = await getFornecedores();
      
      console.log('[Fornecedores] Dados recebidos:');
      console.log('[Fornecedores] data tipo:', typeof data);
      console.log('[Fornecedores] data é array?', Array.isArray(data));
      console.log('[Fornecedores] data:', data);
      
      // Backend pode retornar {fornecedores: [...]} ou [...]
      const fornecedores = Array.isArray(data) ? data : 
                          (data?.fornecedores || data?.data || []);
      
      console.log('[Fornecedores] fornecedores array:', fornecedores);
      setFornecedores(fornecedores);
    } catch (error) {
      console.error('[Fornecedores] Erro ao carregar fornecedores:', error);
      showNotification('Erro ao carregar fornecedores', 'error');
      setFornecedores([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (editingId) {
        await updateFornecedor(editingId, formData);
        showNotification('Fornecedor atualizado com sucesso!', 'success');
      } else {
        await createFornecedor(formData);
        showNotification('Fornecedor criado com sucesso!', 'success');
      }

      closeModal();
      loadFornecedores();
    } catch (error) {
      console.error('Erro ao salvar fornecedor:', error);
      showNotification(error.error || 'Erro ao salvar fornecedor', 'error');
    }
  };

  const handleEdit = (fornecedor) => {
    setEditingId(fornecedor.id);
    setFormData({
      nome: fornecedor.nome || '',
      email: fornecedor.email || '',
      telefone: fornecedor.telefone || '',
      cnpj: fornecedor.cnpj || '',
      endereco: fornecedor.endereco || '',
      status: fornecedor.status || 'Ativo',
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir este fornecedor?')) {
      try {
        await deleteFornecedor(id);
        showNotification('Fornecedor excluído com sucesso!', 'success');
        loadFornecedores();
      } catch (error) {
        console.error('Erro ao excluir fornecedor:', error);
        showNotification(error.error || 'Erro ao excluir fornecedor', 'error');
      }
    }
  };

  const openModal = () => {
    setEditingId(null);
    setFormData({
      nome: '',
      email: '',
      telefone: '',
      cnpj: '',
      endereco: '',
      status: 'Ativo',
    });
    setShowModal(true);

    setTimeout(() => {
      $('.modal').addClass('show');
    }, 10);
  };

  const handleCadastrarLoja = () => {
    console.log('[Fornecedores] Navegando para cadastro de loja');
    navigate('/cadastrar-loja');
  };

  const closeModal = () => {
    $('.modal').removeClass('show');
    setTimeout(() => {
      setShowModal(false);
      setEditingId(null);
    }, 300);
  };

  const closeDetalhesModal = () => {
    $('.modal-detalhes').removeClass('show');
    setTimeout(() => {
      setShowDetalhesModal(false);
      setFornecedorSelecionado(null);
      setProdutosFornecedor([]);
      setImagensFornecedor({}); // Limpar cache de imagens
    }, 300);
  };

  const handleVerProdutos = async (fornecedor) => {
    try {
      console.log('[Fornecedores] === INICIANDO VISUALIZAÇÃO DE PRODUTOS ===');
      console.log('[Fornecedores] Fornecedor selecionado:', fornecedor);
      console.log('[Fornecedores] Fornecedor ID:', fornecedor.id);
      
      setFornecedorSelecionado(fornecedor);
      setShowDetalhesModal(true);
      setLoadingProdutos(true);
      setProdutosFornecedor([]);
      setImagensFornecedor({}); // Limpar cache de imagens anterior
      
      // Aguarda modal aparecer antes de aplicar animação
      setTimeout(() => {
        $('.modal-detalhes').addClass('show');
      }, 10);
      
      // Buscar produtos deste fornecedor específico
      console.log('[Fornecedores] Fazendo requisição para produtos do fornecedor_id:', fornecedor.id);
      
      const produtosData = await getProdutos({ fornecedor_id: fornecedor.id });
      console.log('[Fornecedores] === RESPOSTA DA API ===');
      console.log('[Fornecedores] Dados brutos recebidos:', produtosData);
      console.log('[Fornecedores] Tipo dos dados:', typeof produtosData);
      console.log('[Fornecedores] É array?', Array.isArray(produtosData));
      
      const produtos = Array.isArray(produtosData) ? produtosData : 
                      (produtosData?.produtos || produtosData?.data || []);
      
      console.log('[Fornecedores] === PRODUTOS PROCESSADOS ===');
      console.log('[Fornecedores] Produtos filtrados:', produtos);
      console.log('[Fornecedores] Quantidade de produtos:', produtos.length);
      
      if (produtos.length > 0) {
        console.log('[Fornecedores] Primeiro produto:', produtos[0]);
        console.log('[Fornecedores] Fornecedor_id dos produtos:', produtos.map(p => ({ id: p.id, nome: p.nome, fornecedor_id: p.fornecedor_id })));
      }
      
      setProdutosFornecedor(produtos);
      
      // Carregar imagens dos produtos do fornecedor
      if (produtos.length > 0) {
        loadImagensFornecedor(produtos);
      }
    } catch (error) {
      console.error('[Fornecedores] === ERRO AO CARREGAR PRODUTOS ===');
      console.error('[Fornecedores] Erro completo:', error);
      console.error('[Fornecedores] Status do erro:', error.response?.status);
      console.error('[Fornecedores] Dados do erro:', error.response?.data);
      
      showNotification('Erro ao carregar produtos do fornecedor', 'error');
      setProdutosFornecedor([]);
    } finally {
      setLoadingProdutos(false);
    }
  };

  // Função para carregar imagens dos produtos do fornecedor
  const loadImagensFornecedor = async (produtosList) => {
    try {
      const imagensCache = {};
      
      // Carregar primeira imagem de cada produto
      await Promise.all(
        produtosList.slice(0, 10).map(async (produto) => { // Máximo 10 para não sobrecarregar
          try {
            const imagens = await getProdutoImagens(produto.id);
            const imagensArray = Array.isArray(imagens) ? imagens : 
                               (imagens?.imagens || imagens?.data || []);
            
            const imagemPrincipal = imagensArray.find(img => img.eh_principal) || 
                                   imagensArray[0];
            
            if (imagemPrincipal) {
              imagensCache[produto.id] = {
                url: `http://localhost:8000/${imagemPrincipal.caminho}`,
                alt: imagemPrincipal.alt_text || produto.nome
              };
            }
          } catch (error) {
            console.log(`[Fornecedores] Sem imagens para produto ${produto.id}`);
          }
        })
      );
      
      setImagensFornecedor(imagensCache);
      console.log('[Fornecedores] Cache de imagens do fornecedor carregado:', imagensCache);
    } catch (error) {
      console.error('[Fornecedores] Erro ao carregar imagens dos produtos do fornecedor:', error);
    }
  };

  const filteredFornecedores = fornecedores.filter((f) =>
    f.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.cnpj?.includes(searchTerm)
  );

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Carregando fornecedores...</p>
      </div>
    );
  }

  return (
    <div className="fornecedores-container page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <i className="fas fa-truck"></i>
            Fornecedores
          </h1>
          <p className="page-description">
            Gerencie os fornecedores de produtos
          </p>
        </div>
        {user?.nivel?.toLowerCase() === 'executivo' && (
          <button className="btn btn-primary" onClick={openModal}>
            <i className="fas fa-plus"></i>
            Novo Fornecedor
          </button>
        )}
        {user?.nivel?.toLowerCase() === 'fornecedor' && (
          <button className="btn btn-success" onClick={handleCadastrarLoja}>
            <i className="fas fa-store"></i>
            Cadastrar Minha Loja
          </button>
        )}
      </div>

      {/* Banner informativo para compradores */}
      {user?.nivel?.toLowerCase() === 'comum' && (
        <div className="alert alert-info" style={{ marginBottom: '1.5rem' }}>
          <i className="fas fa-handshake"></i>
          <div>
            <strong>Escolha seus Fornecedores</strong>
            <p>Visualize a lista completa de fornecedores e crie vínculos comerciais para ter acesso a seus produtos.</p>
          </div>
        </div>
      )}

      {/* Banner informativo para fornecedores */}
      {user?.nivel?.toLowerCase() === 'fornecedor' && (
        <div className="alert alert-success" style={{ marginBottom: '1.5rem' }}>
          <i className="fas fa-store"></i>
          <div>
            <strong>Cadastre sua Loja</strong>
            <p>Como fornecedor, você pode cadastrar sua loja para começar a vender produtos. Clique no botão "Cadastrar Minha Loja" para começar.</p>
          </div>
        </div>
      )}

      {/* Banner informativo para fornecedores */}
      {user?.nivel?.toLowerCase() === 'fornecedor' && (
        <div className="alert alert-warning" style={{ marginBottom: '1.5rem' }}>
          <i className="fas fa-lock"></i>
          <div>
            <strong>Acesso Limitado</strong>
            <p>Como fornecedor, você não tem permissão para gerenciar outros fornecedores. Acesse "Meus Produtos" para gerenciar seu catálogo.</p>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <h2 className="card-title">
            <i className="fas fa-list"></i>
            Lista de Fornecedores ({filteredFornecedores.length})
          </h2>
          <div className="search-box">
            <i className="fas fa-search"></i>
            <input
              type="text"
              placeholder="Buscar fornecedor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="card-body">
          {filteredFornecedores.length === 0 ? (
            <div className="empty-state">
              <i className="fas fa-inbox"></i>
              <h3>Nenhum fornecedor encontrado</h3>
              <p>Clique no botão "Novo Fornecedor" para adicionar um.</p>
            </div>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>Email</th>
                    <th>Telefone</th>
                    <th>CNPJ</th>
                    <th>Status</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFornecedores.map((fornecedor) => (
                    <tr key={fornecedor.id}>
                      <td>
                        <strong>{fornecedor.nome}</strong>
                      </td>
                      <td>{fornecedor.email}</td>
                      <td>{fornecedor.telefone}</td>
                      <td>{fornecedor.cnpj}</td>
                      <td>
                        <span className={`badge ${fornecedor.status === 'Ativo' ? 'badge-success' : 'badge-error'}`}>
                          {fornecedor.status}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          {/* Botão Ver Produtos - disponível para todos os usuários */}
                          <button
                            className="btn btn-sm btn-info"
                            onClick={() => handleVerProdutos(fornecedor)}
                            title="Ver Produtos"
                          >
                            <i className="fas fa-box"></i> Ver Produtos
                          </button>
                          
                          {/* Botões de administração - apenas para executivos */}
                          {user?.nivel?.toLowerCase() === 'executivo' && (
                            <>
                              <button
                                className="btn btn-sm btn-warning"
                                onClick={() => handleEdit(fornecedor)}
                                title="Editar"
                              >
                                <i className="fas fa-edit"></i>
                              </button>
                              <button
                                className="btn btn-sm btn-danger"
                                onClick={() => handleDelete(fornecedor.id)}
                                title="Excluir"
                              >
                                <i className="fas fa-trash"></i>
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">
                <i className="fas fa-truck"></i>
                {editingId ? 'Editar Fornecedor' : 'Novo Fornecedor'}
              </h2>
              <button className="btn-close" onClick={closeModal}>
                <i className="fas fa-times"></i>
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label required">Nome</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Nome do fornecedor"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    className="form-control"
                    placeholder="email@exemplo.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Telefone</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="(11) 1234-5678"
                      value={formData.telefone}
                      onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">CNPJ</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="00.000.000/0001-00"
                      value={formData.cnpj}
                      onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Endereço</label>
                  <textarea
                    className="form-control"
                    placeholder="Endereço completo"
                    rows="3"
                    value={formData.endereco}
                    onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label required">Status</label>
                  <select
                    className="form-control"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    required
                  >
                    <option value="Ativo">Ativo</option>
                    <option value="Inativo">Inativo</option>
                  </select>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={closeModal}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  <i className="fas fa-save"></i>
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Detalhes do Fornecedor */}
      {showDetalhesModal && fornecedorSelecionado && (
        <div className="modal-overlay" onClick={closeDetalhesModal}>
          <div className="modal modal-detalhes modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">
                <i className="fas fa-truck"></i>
                {fornecedorSelecionado.nome}
              </h2>
              <button className="btn-close" onClick={closeDetalhesModal}>
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div className="modal-body">
              {/* Informações do Fornecedor */}
              <div className="fornecedor-info">
                <div className="row">
                  <div className="col-md-6">
                    <div className="info-item">
                      <strong><i className="fas fa-envelope"></i> Email:</strong>
                      <span>{fornecedorSelecionado.email || 'Não informado'}</span>
                    </div>
                    <div className="info-item">
                      <strong><i className="fas fa-phone"></i> Telefone:</strong>
                      <span>{fornecedorSelecionado.telefone || 'Não informado'}</span>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="info-item">
                      <strong><i className="fas fa-file-alt"></i> CNPJ:</strong>
                      <span>{fornecedorSelecionado.cnpj || 'Não informado'}</span>
                    </div>
                    <div className="info-item">
                      <strong><i className="fas fa-check-circle"></i> Status:</strong>
                      <span className={`badge ${fornecedorSelecionado.status === 'Ativo' ? 'badge-success' : 'badge-error'}`}>
                        {fornecedorSelecionado.status}
                      </span>
                    </div>
                  </div>
                </div>
                {fornecedorSelecionado.endereco && (
                  <div className="info-item">
                    <strong><i className="fas fa-map-marker-alt"></i> Endereço:</strong>
                    <span>{fornecedorSelecionado.endereco}</span>
                  </div>
                )}
              </div>

              <hr />

              {/* Lista de Produtos */}
              <div className="produtos-fornecedor">
                <h3>
                  <i className="fas fa-box"></i> 
                  Produtos Disponíveis
                  {!loadingProdutos && produtosFornecedor.length > 0 && (
                    <span className="badge badge-info ml-2">{produtosFornecedor.length}</span>
                  )}
                </h3>

                {loadingProdutos ? (
                  <div className="loading-products">
                    <div className="spinner-small"></div>
                    <p>Carregando produtos...</p>
                  </div>
                ) : produtosFornecedor.length === 0 ? (
                  <div className="empty-produtos">
                    <i className="fas fa-box-open"></i>
                    <p>Este fornecedor ainda não possui produtos cadastrados.</p>
                  </div>
                ) : (
                  <div className="produtos-grid">
                    {produtosFornecedor.map((produto) => (
                      <div key={produto.id} className="produto-card">
                        <div className="produto-image-container">
                          {imagensFornecedor[produto.id] ? (
                            <img 
                              src={imagensFornecedor[produto.id].url}
                              alt={imagensFornecedor[produto.id].alt}
                              className="produto-image-modal"
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                              }}
                            />
                          ) : null}
                          <div 
                            className="produto-image-placeholder-modal"
                            style={{ display: imagensFornecedor[produto.id] ? 'none' : 'flex' }}
                          >
                            <i className="fas fa-image"></i>
                          </div>
                        </div>
                        <div className="produto-header">
                          <h4>{produto.nome}</h4>
                          {produto.preco && (
                            <span className="produto-preco">
                              R$ {parseFloat(produto.preco || 0).toFixed(2)}
                            </span>
                          )}
                        </div>
                        <div className="produto-body">
                          {produto.descricao && (
                            <p className="produto-descricao">{produto.descricao}</p>
                          )}
                          <div className="produto-details">
                            {produto.estoque && (
                              <span className="produto-estoque">
                                <i className="fas fa-cubes"></i>
                                Estoque: {produto.estoque}
                              </span>
                            )}
                            <span className={`produto-status badge ${produto.status === 'ativo' ? 'badge-success' : 'badge-warning'}`}>
                              {produto.status || 'Ativo'}
                            </span>
                          </div>
                        </div>
                        {user?.nivel?.toLowerCase() === 'comum' && (
                          <div className="produto-actions">
                            <button className="btn btn-sm btn-primary">
                              <i className="fas fa-shopping-cart"></i>
                              Comprar
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={closeDetalhesModal}>
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Fornecedores;
