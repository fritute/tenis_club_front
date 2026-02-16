import React, { useState, useEffect } from 'react';
import $ from 'jquery';
import {
  getProdutos,
  createProduto,
  updateProduto,
  deleteProduto,
  getCategorias,
  getFornecedores,
  getProdutoImagens,
  uploadProdutoImagem,
  setProdutoImagemPrincipal,
  deleteProdutoImagem,
  createPedido,
} from '../../services/api';
import { showNotification } from '../../services/api';
import ProdutoImagem from '../../components/ProdutoImagem/ProdutoImagem';
import './Produtos.css';

const API_BASE = 'http://localhost:8000';

function Produtos({ user }) {
  const [produtos, setProdutos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [fornecedores, setFornecedores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [showCompraModal, setShowCompraModal] = useState(false);
  const [produtoParaCompra, setProdutoParaCompra] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [selectedProdutoId, setSelectedProdutoId] = useState(null);
  const [produtoImagens, setProdutoImagens] = useState([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    categoria_id: '',
    preco_base: '',
    codigo_interno: '',
    status: 'Ativo',
  });

  // Dados do formulário de compra
  const [compraData, setCompraData] = useState({
    quantidade: 1,
    observacoes: '',
    endereco_entrega: {
      logradouro: '',
      numero: '',
      complemento: '',
      bairro: '',
      cidade: '',
      estado: '',
      cep: ''
    },
    telefone_contato: '',
  });
  
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [produtosData, categoriasData, fornecedoresData] = await Promise.all([
        getProdutos(),
        getCategorias(),
        getFornecedores(),
      ]);
      
      console.log('[Produtos] Dados recebidos:');
      console.log('[Produtos] produtosData tipo:', typeof produtosData);
      console.log('[Produtos] produtosData é array?', Array.isArray(produtosData));
      console.log('[Produtos] produtosData:', produtosData);
      console.log('[Produtos] categoriasData:', categoriasData);
      console.log('[Produtos] fornecedoresData:', fornecedoresData);
      
      // Backend pode retornar {produtos: [...]} ou [...]
      const produtos = Array.isArray(produtosData) ? produtosData : 
                       (produtosData?.produtos || produtosData?.data || []);
      const categorias = Array.isArray(categoriasData) ? categoriasData : 
                        (categoriasData?.categorias || categoriasData?.data || []);
      const fornecedores = Array.isArray(fornecedoresData) ? fornecedoresData : 
                          (fornecedoresData?.fornecedores || fornecedoresData?.data || []);
      
      console.log('[Produtos] Após extração:');
      console.log('[Produtos] produtos array:', produtos);
      console.log('[Produtos] categorias array:', categorias);
      console.log('[Produtos] fornecedores array:', fornecedores);
      
      setProdutos(produtos);
      setCategorias(categorias);
      setFornecedores(fornecedores);
    } catch (error) {
      console.error('[Produtos] Erro ao carregar dados:', error);
      
      // Mensagem de erro mais específica baseada no tipo de erro
      let errorMessage = 'Erro ao carregar dados';
      
      if (error.error?.includes('CORS') || error.error?.includes('conexão')) {
        errorMessage = 'Problema de conexão com o backend - verifique se está rodando';
      } else if (error.error?.includes('não implementada')) {
        errorMessage = 'Algumas funcionalidades ainda não foram implementadas no backend';
      }
      
      showNotification(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadProdutoImagens = async (produtoId) => {
    try {
      const imagens = await getProdutoImagens(produtoId);
      setProdutoImagens(Array.isArray(imagens) ? imagens : []);
    } catch (error) {
      console.error('Erro ao carregar imagens:', error);
      setProdutoImagens([]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (editingId) {
        await updateProduto(editingId, formData);
        showNotification('Produto atualizado com sucesso!', 'success');
      } else {
        await createProduto(formData);
        showNotification('Produto criado com sucesso!', 'success');
      }

      closeModal();
      loadData();
    } catch (error) {
      console.error('Erro ao salvar produto:', error);
      showNotification(error.error || 'Erro ao salvar produto', 'error');
    }
  };

  const handleEdit = (produto) => {
    setEditingId(produto.id);
    setFormData({
      nome: produto.nome || '',
      descricao: produto.descricao || '',
      categoria_id: produto.categoria_id || '',
      preco_base: produto.preco_base || '',
      codigo_interno: produto.codigo_interno || '',
      status: produto.status || 'Ativo',
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir este produto?')) {
      try {
        await deleteProduto(id);
        showNotification('Produto excluído com sucesso!', 'success');
        loadData();
      } catch (error) {
        console.error('Erro ao excluir produto:', error);
        showNotification(error.error || 'Erro ao excluir produto', 'error');
      }
    }
  };

  const handleComprar = (produto) => {
    console.log('[Produtos] Iniciando compra do produto:', produto);
    setProdutoParaCompra(produto);
    setCompraData({
      quantidade: 1,
      observacoes: '',
      endereco_entrega: {
        logradouro: '',
        numero: '',
        complemento: '',
        bairro: '',
        cidade: '',
        estado: '',
        cep: ''
      },
      telefone_contato: '',
    });
    setShowCompraModal(true);
    
    setTimeout(() => {
      $('.compra-modal').addClass('show');
    }, 10);
  };

  const closeCompraModal = () => {
    $('.compra-modal').removeClass('show');
    setTimeout(() => {
      setShowCompraModal(false);
      setProdutoParaCompra(null);
    }, 300);
  };

  const handleSubmitCompra = async (e) => {
    e.preventDefault();
    
    if (!produtoParaCompra) return;
    
    try {
      // Validar dados obrigatórios
      if (!compraData.endereco_entrega.logradouro || 
          !compraData.endereco_entrega.numero || 
          !compraData.endereco_entrega.cidade || 
          !compraData.endereco_entrega.estado || 
          !compraData.endereco_entrega.cep) {
        showNotification('Por favor, preencha todos os campos do endereço', 'error');
        return;
      }

      if (!compraData.telefone_contato || compraData.telefone_contato.trim() === '') {
        showNotification('Por favor, preencha o telefone de contato', 'error');
        return;
      }

      // Calculos para o pedido
      const precoUnitario = produtoParaCompra.preco_base || 0;
      const quantidade = parseInt(compraData.quantidade);
      const subtotal = precoUnitario * quantidade;

      // Formatar endereço como string
      const enderecoCompleto = [
        `${compraData.endereco_entrega.logradouro}, ${compraData.endereco_entrega.numero}`,
        compraData.endereco_entrega.complemento,
        compraData.endereco_entrega.bairro,
        `${compraData.endereco_entrega.cidade}-${compraData.endereco_entrega.estado}`,
        compraData.endereco_entrega.cep
      ].filter(Boolean).join(', ');

      console.log('[Produtos] Endereço formatado:', enderecoCompleto);

      // Formato da API v2.2 segundo documentação
      const pedidoData = {
        usuario_id: user?.id, // ID do usuário logado
        fornecedor_id: produtoParaCompra.fornecedor_id, // ID do fornecedor do produto
        telefone_contato: compraData.telefone_contato,
        endereco_entrega: enderecoCompleto, // String formatada
        observacoes: compraData.observacoes || '',
        itens: [
          {
            produto_id: produtoParaCompra.id,
            quantidade: quantidade,
            preco_unitario: precoUnitario,
            subtotal: subtotal
          }
        ]
      };

      console.log('[Produtos] Submetendo pedido (API v2.2):', pedidoData);
      
      // Usar a API de pedidos v2.2
      try {
        const response = await createPedido(pedidoData);
        console.log('[Produtos] Pedido criado na API v2.2:', response);
        
        showNotification(
          `✅ Pedido realizado com sucesso! 
          🛒 ${quantidade}x ${produtoParaCompra.nome}
          💰 Total: R$ ${subtotal.toFixed(2)}
          📋 ID: #${response.id || 'novo'}`,
          'success'
        );
        
        // Limpar formulário e fechar modal
        setCompraData({
          quantidade: 1,
          observacoes: '',
          endereco_entrega: {
            logradouro: '',
            numero: '',
            complemento: '',
            bairro: '',
            cidade: '',
            estado: '',
            cep: ''
          },
          telefone_contato: ''
        });
        
      } catch (apiError) {
        console.error('[Produtos] Erro na API de pedidos v2.2:', apiError);
        
        if (apiError.response?.status === 404) {
          // API ainda não implementada - mostrar dados simulados  
          console.warn('[Produtos] API de pedidos não disponível, simulando sucesso');
          
          showNotification(
            `🔧 Pedido simulado (API em desenvolvimento)! 
            🛒 ${quantidade}x ${produtoParaCompra.nome}
            💰 Total: R$ ${subtotal.toFixed(2)}
            📧 Dados salvos localmente`,
            'success'
          );
          
          // Simular armazenamento local para desenvolvimento
          const pedidosLocal = JSON.parse(localStorage.getItem('pedidos_simulados') || '[]');
          pedidosLocal.push({
            ...pedidoData,
            id: Date.now(),
            created_at: new Date().toISOString(),
            status: 'pendente'
          });
          localStorage.setItem('pedidos_simulados', JSON.stringify(pedidosLocal));
          
        } else {
          // Erro real da API
          throw apiError;
        }
      }

      closeCompraModal();
      
    } catch (error) {
      console.error('[Produtos] Erro ao processar compra v2.2:', error);
      
      const errorMessage = error.response?.data?.message || 
                          error.message || 
                          'Erro desconhecido ao processar compra';
      
      showNotification(
        `❌ Erro ao processar compra: ${errorMessage}. Tente novamente.`,
        'error'
      );
    }
  };

  const openModal = () => {
    setEditingId(null);
    setFormData({
      nome: '',
      descricao: '',
      categoria_id: '',
      preco_base: '',
      codigo_interno: '',
      status: 'Ativo',
    });
    setShowModal(true);
  };

  const closeModal = () => {
    $('.modal').removeClass('show');
    setTimeout(() => {
      setShowModal(false);
      setEditingId(null);
    }, 300);
  };

  const openImageModal = async (produtoId) => {
    setSelectedProdutoId(produtoId);
    await loadProdutoImagens(produtoId);
    setShowImageModal(true);
    
    setTimeout(() => {
      $('.image-modal').addClass('show');
    }, 10);
  };

  const closeImageModal = () => {
    $('.image-modal').removeClass('show');
    setTimeout(() => {
      setShowImageModal(false);
      setSelectedProdutoId(null);
      setProdutoImagens([]);
    }, 300);
  };

  const handleImageUpload = async (e) => {
    const files = e.target.files;
    
    if (!files || files.length === 0) return;

    setUploadingImage(true);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append('imagem', file);
        formData.append('produto_id', selectedProdutoId);
        formData.append('descricao', `Imagem do produto`);
        formData.append('eh_principal', i === 0 ? 'true' : 'false');

        await uploadProdutoImagem(formData);
      }

      showNotification(`${files.length} imagem(ns) enviada(s) com sucesso!`, 'success');
      await loadProdutoImagens(selectedProdutoId);
      
      // Reset file input
      e.target.value = '';
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      showNotification(error.error || 'Erro ao fazer upload da imagem', 'error');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSetPrincipal = async (imagemId) => {
    try {
      await setProdutoImagemPrincipal(imagemId);
      showNotification('Imagem principal definida!', 'success');
      await loadProdutoImagens(selectedProdutoId);
    } catch (error) {
      console.error('Erro ao definir imagem principal:', error);
      showNotification('Erro ao definir imagem principal', 'error');
    }
  };

  const handleDeleteImage = async (imagemId) => {
    if (window.confirm('Tem certeza que deseja excluir esta imagem?')) {
      try {
        await deleteProdutoImagem(imagemId);
        showNotification('Imagem excluída com sucesso!', 'success');
        await loadProdutoImagens(selectedProdutoId);
      } catch (error) {
        console.error('Erro ao excluir imagem:', error);
        showNotification('Erro ao excluir imagem', 'error');
      }
    }
  };

  const getCategoriaName = (id) => {
    const categoria = categorias.find((c) => c.id === id);
    return categoria ? categoria.nome : 'N/A';
  };

  const filteredProdutos = produtos.filter((p) =>
    p.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.descricao?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.codigo_interno?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Carregando produtos...</p>
      </div>
    );
  }

  return (
    <div className="produtos-container page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <i className="fas fa-shoe-prints"></i>
            Produtos
          </h1>
          <p className="page-description">
            Gerencie seu catálogo de produtos
          </p>
        </div>
        <button className="btn btn-primary" onClick={openModal}>
          <i className="fas fa-plus"></i>
          Novo Produto
        </button>
      </div>

      {/* Banner informativo para fornecedores */}
      {user?.nivel?.toLowerCase() === 'fornecedor' && (
        <div className="alert alert-info" style={{ marginBottom: '1.5rem' }}>
          <i className="fas fa-info-circle"></i>
          <div>
            <strong>Modo Fornecedor</strong>
            <p>Você está visualizando e pode gerenciar apenas os produtos vinculados a você.</p>
          </div>
        </div>
      )}

      {/* Banner informativo para compradores */}
      {user?.nivel?.toLowerCase() === 'comum' && (
        <div className="alert alert-info" style={{ marginBottom: '1.5rem' }}>
          <i className="fas fa-eye"></i>
          <div>
            <strong>Modo Visualização</strong>
            <p>Explore o catálogo completo de produtos. Para criar vínculos com fornecedores, acesse o menu Fornecedores.</p>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <h2 className="card-title">
            <i className="fas fa-list"></i>
            Catálogo de Produtos ({filteredProdutos.length})
          </h2>
          <div className="search-box">
            <i className="fas fa-search"></i>
            <input
              type="text"
              placeholder="Buscar produto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="card-body">
          {filteredProdutos.length === 0 ? (
            <div className="empty-state">
              <i className="fas fa-inbox"></i>
              <h3>Nenhum produto encontrado</h3>
              <p>Clique no botão "Novo Produto" para adicionar um.</p>
            </div>
          ) : (
            <div className="produtos-grid">
              {filteredProdutos.map((produto) => (
                <div key={produto.id} className="produto-card">
                  <ProdutoImagem 
                    produtoId={produto.id}
                    produtoNome={produto.nome}
                    size="medium"
                    className="produto-card-imagem"
                  />
                  <div className="produto-content">
                    <h3 className="produto-nome">{produto.nome}</h3>
                    <p className="produto-descricao">
                      {produto.descricao || 'Sem descrição'}
                    </p>
                    <div className="produto-info">
                      <span className="produto-categoria">
                        <i className="fas fa-tag"></i>
                        {getCategoriaName(produto.categoria_id)}
                      </span>
                      {produto.preco_base && (
                        <span className="produto-preco">
                          R$ {Number(produto.preco_base).toFixed(2)}
                        </span>
                      )}
                    </div>
                    <span className={`badge ${produto.status === 'Ativo' ? 'badge-success' : 'badge-error'}`}>
                      {produto.status}
                    </span>
                  </div>
                  <div className="produto-actions">
                    {user?.nivel?.toLowerCase() === 'comum' ? (
                      // Usuário comum - apenas botão comprar
                      <button
                        className="btn btn-sm btn-success btn-comprar"
                        onClick={() => handleComprar(produto)}
                        title="Comprar Produto"
                      >
                        <i className="fas fa-shopping-cart"></i>
                        Comprar
                      </button>
                    ) : (
                      // Fornecedores e Executivos - botões administrativos
                      <>
                        <button
                          className="btn btn-sm btn-info"
                          onClick={() => openImageModal(produto.id)}
                          title="Imagens"
                        >
                          <i className="fas fa-images"></i>
                        </button>
                        {user?.nivel?.toLowerCase() === 'executivo' && (
                          <>
                            <button
                              className="btn btn-sm btn-warning"
                              onClick={() => handleEdit(produto)}
                              title="Editar"
                            >
                              <i className="fas fa-edit"></i>
                            </button>
                            <button
                              className="btn btn-sm btn-danger"
                              onClick={() => handleDelete(produto.id)}
                              title="Excluir"
                            >
                              <i className="fas fa-trash"></i>
                            </button>
                          </>
                        )}
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal Produto */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">
                <i className="fas fa-shoe-prints"></i>
                {editingId ? 'Editar Produto' : 'Novo Produto'}
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
                    placeholder="Nome do produto"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Descrição</label>
                  <textarea
                    className="form-control"
                    placeholder="Descrição do produto"
                    rows="3"
                    value={formData.descricao}
                    onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Categoria</label>
                    <select
                      className="form-control"
                      value={formData.categoria_id}
                      onChange={(e) => setFormData({ ...formData, categoria_id: e.target.value })}
                    >
                      <option value="">Selecione uma categoria</option>
                      {categorias.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.nome}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Preço Base</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-control"
                      placeholder="0.00"
                      value={formData.preco_base}
                      onChange={(e) => setFormData({ ...formData, preco_base: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Código Interno</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Código do produto"
                      value={formData.codigo_interno}
                      onChange={(e) => setFormData({ ...formData, codigo_interno: e.target.value })}
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

      {/* Modal Imagens */}
      {showImageModal && (
        <div className="modal-overlay" onClick={closeImageModal}>
          <div className="modal image-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">
                <i className="fas fa-images"></i>
                Imagens do Produto
              </h2>
              <button className="btn-close" onClick={closeImageModal}>
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div className="modal-body">
              <div className="upload-area">
                <input
                  type="file"
                  id="imageUpload"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  onChange={handleImageUpload}
                  disabled={uploadingImage}
                  style={{ display: 'none' }}
                />
                <label htmlFor="imageUpload" className="upload-label">
                  {uploadingImage ? (
                    <>
                      <i className="fas fa-spinner fa-spin"></i>
                      <span>Enviando imagens...</span>
                    </>
                  ) : (
                    <>
                      <i className="fas fa-cloud-upload-alt"></i>
                      <span>Clique para enviar imagens</span>
                      <small>JPEG, PNG ou WebP (máx. 5MB cada)</small>
                    </>
                  )}
                </label>
              </div>

              {produtoImagens.length === 0 ? (
                <div className="empty-state">
                  <i className="fas fa-image"></i>
                  <h3>Nenhuma imagem</h3>
                  <p>Faça upload de imagens para este produto.</p>
                </div>
              ) : (
                <div className="imagens-grid">
                  {produtoImagens.map((imagem) => (
                    <div key={imagem.id} className="imagem-item">
                      {imagem.eh_principal && (
                        <div className="imagem-principal-badge">
                          <i className="fas fa-star"></i>
                          Principal
                        </div>
                      )}
                      <div className="imagem-preview">
                        <img 
                          src={`${API_BASE}/${imagem.caminho}`} 
                          alt={imagem.alt_text || 'Imagem do produto'} 
                        />
                      </div>
                      <div className="imagem-actions">
                        {!imagem.eh_principal && (
                          <button
                            className="btn btn-sm btn-success"
                            onClick={() => handleSetPrincipal(imagem.id)}
                            title="Definir como principal"
                          >
                            <i className="fas fa-star"></i>
                          </button>
                        )}
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => handleDeleteImage(imagem.id)}
                          title="Excluir"
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={closeImageModal}>
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Compra */}
      {showCompraModal && produtoParaCompra && (
        <div className="modal-overlay" onClick={closeCompraModal}>
          <div className="modal compra-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">
                <i className="fas fa-shopping-cart"></i>
                Comprar Produto
              </h2>
              <button className="btn-close" onClick={closeCompraModal}>
                <i className="fas fa-times"></i>
              </button>
            </div>

            <form onSubmit={handleSubmitCompra}>
              <div className="modal-body">
                {/* Informações do Produto */}
                <div className="produto-compra-info">
                  <h3>{produtoParaCompra.nome}</h3>
                  <p className="produto-descricao">{produtoParaCompra.descricao || 'Sem descrição'}</p>
                  <div className="produto-preco-info">
                    <span className="preco-unitario">
                      Preço unitário: <strong>R$ {parseFloat(produtoParaCompra.preco_base || 0).toFixed(2)}</strong>
                    </span>
                  </div>
                </div>

                <hr />

                {/* Formulário de Compra */}
                <div className="compra-form">
                  <div className="form-group">
                    <label className="form-label required">Quantidade</label>
                    <input
                      type="number"
                      className="form-control"
                      min="1"
                      value={compraData.quantidade}
                      onChange={(e) => setCompraData({ ...compraData, quantidade: parseInt(e.target.value) || 1 })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label required">Endereço de Entrega</label>
                    <div className="endereco-grid">
                      <div className="endereco-row">
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Logradouro/Rua"
                          value={compraData.endereco_entrega.logradouro}
                          onChange={(e) => setCompraData({ 
                            ...compraData, 
                            endereco_entrega: { 
                              ...compraData.endereco_entrega, 
                              logradouro: e.target.value 
                            }
                          })}
                          required
                        />
                        <input
                          type="text"
                          className="form-control endereco-numero"
                          placeholder="Número"
                          value={compraData.endereco_entrega.numero}
                          onChange={(e) => setCompraData({ 
                            ...compraData, 
                            endereco_entrega: { 
                              ...compraData.endereco_entrega, 
                              numero: e.target.value 
                            }
                          })}
                          required
                        />
                      </div>
                      
                      <div className="endereco-row">
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Complemento (opcional)"
                          value={compraData.endereco_entrega.complemento}
                          onChange={(e) => setCompraData({ 
                            ...compraData, 
                            endereco_entrega: { 
                              ...compraData.endereco_entrega, 
                              complemento: e.target.value 
                            }
                          })}
                        />
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Bairro"
                          value={compraData.endereco_entrega.bairro}
                          onChange={(e) => setCompraData({ 
                            ...compraData, 
                            endereco_entrega: { 
                              ...compraData.endereco_entrega, 
                              bairro: e.target.value 
                            }
                          })}
                          required
                        />
                      </div>
                      
                      <div className="endereco-row">
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Cidade"
                          value={compraData.endereco_entrega.cidade}
                          onChange={(e) => setCompraData({ 
                            ...compraData, 
                            endereco_entrega: { 
                              ...compraData.endereco_entrega, 
                              cidade: e.target.value 
                            }
                          })}
                          required
                        />
                        <select
                          className="form-control endereco-estado"
                          value={compraData.endereco_entrega.estado}
                          onChange={(e) => setCompraData({ 
                            ...compraData, 
                            endereco_entrega: { 
                              ...compraData.endereco_entrega, 
                              estado: e.target.value 
                            }
                          })}
                          required
                        >
                          <option value="">Estado</option>
                          <option value="AC">AC</option> <option value="AL">AL</option>
                          <option value="AP">AP</option> <option value="AM">AM</option>
                          <option value="BA">BA</option> <option value="CE">CE</option>
                          <option value="DF">DF</option> <option value="ES">ES</option>
                          <option value="GO">GO</option> <option value="MA">MA</option>
                          <option value="MT">MT</option> <option value="MS">MS</option>
                          <option value="MG">MG</option> <option value="PA">PA</option>
                          <option value="PB">PB</option> <option value="PR">PR</option>
                          <option value="PE">PE</option> <option value="PI">PI</option>
                          <option value="RJ">RJ</option> <option value="RN">RN</option>
                          <option value="RS">RS</option> <option value="RO">RO</option>
                          <option value="RR">RR</option> <option value="SC">SC</option>
                          <option value="SP">SP</option> <option value="SE">SE</option>
                          <option value="TO">TO</option>
                        </select>
                      </div>
                      
                      <div className="endereco-row">
                        <input
                          type="text"
                          className="form-control endereco-cep"
                          placeholder="CEP (00000-000)"
                          value={compraData.endereco_entrega.cep}
                          onChange={(e) => setCompraData({ 
                            ...compraData, 
                            endereco_entrega: { 
                              ...compraData.endereco_entrega, 
                              cep: e.target.value 
                            }
                          })}
                          maxLength="9"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label required">Telefone para Contato</label>
                    <input
                      type="tel"
                      className="form-control"
                      placeholder="(00) 00000-0000"
                      value={compraData.telefone_contato}
                      onChange={(e) => setCompraData({ ...compraData, telefone_contato: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Observações</label>
                    <textarea
                      className="form-control"
                      placeholder="Observações sobre o pedido (opcional)"
                      rows="3"
                      value={compraData.observacoes}
                      onChange={(e) => setCompraData({ ...compraData, observacoes: e.target.value })}
                    ></textarea>
                  </div>

                  {/* Resumo do Pedido */}
                  <div className="pedido-resumo">
                    <h4>Resumo do Pedido</h4>
                    <div className="resumo-item">
                      <span>Produto:</span>
                      <span>{produtoParaCompra.nome}</span>
                    </div>
                    <div className="resumo-item">
                      <span>Quantidade:</span>
                      <span>{compraData.quantidade}</span>
                    </div>
                    <div className="resumo-item">
                      <span>Preço unitário:</span>
                      <span>R$ {parseFloat(produtoParaCompra.preco_base || 0).toFixed(2)}</span>
                    </div>
                    <div className="resumo-item total">
                      <span>Total:</span>
                      <span>R$ {((produtoParaCompra.preco_base || 0) * compraData.quantidade).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={closeCompraModal}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-success">
                  <i className="fas fa-credit-card"></i>
                  Finalizar Compra
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Produtos;
