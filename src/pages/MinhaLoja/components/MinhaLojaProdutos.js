import React, { useState, useEffect } from 'react';
import { getProdutos, getMeusProdutos, addProdutoMinhaLoja, updateProduto, deleteProduto, getCategorias, deleteVinculoPorProdutoFornecedor } from '../../../services/api';
import ProdutoImagem from '../../../components/ProdutoImagem/ProdutoImagem';
import $ from 'jquery';
import './MinhaLojaProdutos.css';

const MinhaLojaProdutos = ({ loja }) => {
  const [produtos, setProdutos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [showReloginModal, setShowReloginModal] = useState(false);
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    preco: '',
    categoria: '',
    estoque: '',
    imagem: null
  });

  useEffect(() => {
    carregarDados();
  }, [loja]);

  const carregarDados = async () => {
    try {
      setLoading(true);
      
      // Carregar produtos e categorias em paralelo
      // Usar getMeusProdutos() para buscar próprios + vinculados
      const [produtosResponse, categoriasResponse] = await Promise.all([
        getMeusProdutos(),
        getCategorias()
      ]);
      
      // Extrair dados dos produtos
      const produtosList = produtosResponse?.data || produtosResponse?.produtos || produtosResponse || [];
      setProdutos(produtosList);
      
      // Extrair dados das categorias
      const categoriasList = Array.isArray(categoriasResponse) 
        ? categoriasResponse 
        : (categoriasResponse?.data || categoriasResponse?.categorias || []);
      setCategorias(categoriasList);
      
    } catch (err) {
      setError('⚠️ Erro ao carregar dados da loja');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    
    if (type === 'file') {
      setFormData(prev => ({ ...prev, [name]: e.target.files[0] }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const formatPreco = (value) => {
    // Remove tudo que não é número
    const numbers = value.replace(/[^0-9]/g, '');
    // Converte para centavos
    const cents = parseInt(numbers) || 0;
    // Converte de volta para reais
    const reais = cents / 100;
    // Formata como moeda
    return reais.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const handlePrecoChange = (e) => {
    const formatted = formatPreco(e.target.value);
    setFormData(prev => ({ ...prev, preco: formatted }));
  };

  const openModal = (produto = null) => {
    if (produto) {
      setEditingProduct(produto);
      setFormData({
        nome: produto.nome || '',
        descricao: produto.descricao || '',
        preco: produto.preco || '',
        categoria: produto.categoria || '',
        estoque: produto.estoque || '',
        imagem: null
      });
    } else {
      setEditingProduct(null);
      setFormData({
        nome: '',
        descricao: '',
        preco: '',
        categoria: '',
        estoque: '',
        imagem: null
      });
    }
    setShowModal(true);
    setError('');
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingProduct(null);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // Validações básicas
      if (!formData.nome.trim()) {
        throw new Error('📝 Nome do produto é obrigatório');
      }

      if (editingProduct) {
        // EDIÇÃO - usar endpoint completo
        if (!formData.preco) {
          throw new Error('💰 Preço é obrigatório');
        }
        if (!formData.categoria) {
          throw new Error('🏷️ Categoria é obrigatória');
        }

        const precoNumerico = formData.preco.replace(/[^0-9,]/g, '').replace(',', '.');
        
        // Formatar dados para JSON em vez de FormData para evitar problemas de tipo
        const produtoUpdateData = {
          nome: formData.nome.trim(),
          descricao: formData.descricao.trim(),
          preco: parseFloat(precoNumerico),
          preco_base: parseFloat(precoNumerico),
          categoria_id: parseInt(formData.categoria), // Importante: usar categoria_id
          estoque: parseInt(formData.estoque || '0'),
          loja_id: loja.id
        };

        // Se houver imagem, enviar separadamente ou em outro momento
        // Por enquanto, focar em fazer o update dos dados funcionar
        
        await updateProduto(editingProduct.id, produtoUpdateData);
        
        // Se tiver imagem nova, fazer upload separado
        if (formData.imagem) {
            // Implementar upload de imagem separado se necessário
        }
      } else {
        // CRIAÇÃO - usar endpoint simplificado da minha loja
        
        const produtoSimplificado = {
          nome: formData.nome.trim()
          // Outros campos são opcionais e têm defaults no backend:
          // - status: "Ativo" automático
          // - descricao: "" por padrão
          // - fornecedor_id: extraído do JWT automaticamente
        };

        // Se preencheu campos opcionais, incluir
        if (formData.descricao?.trim()) {
          produtoSimplificado.descricao = formData.descricao.trim();
        }
        if (formData.preco) {
          const precoNumerico = parseFloat(formData.preco.replace(/[^0-9,]/g, '').replace(',', '.'));
          produtoSimplificado.preco = precoNumerico;
          produtoSimplificado.preco_base = precoNumerico; // Garante compatibilidade
        }
        if (formData.categoria) {
          produtoSimplificado.categoria = formData.categoria;
        }
        if (formData.estoque) {
          produtoSimplificado.estoque = parseInt(formData.estoque);
        }

        await addProdutoMinhaLoja(produtoSimplificado);
      }

      closeModal();
      carregarDados();
    } catch (err) {
      
      // Verificar se é erro de token desatualizado
      if (err.message === 'TOKEN_DESATUALIZADO') {
        setShowReloginModal(true);
        closeModal();
        return;
      }
      
      setError(err.message || '❌ Erro ao salvar produto');
    }
  };

  // Forçar logout para obter novo token
  const handleForcarRelogin = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  const handleUnlink = async (produto) => {
    // Usar jQuery para modal de confirmação
    const $modal = $(`
      <div class="delete-modal-overlay">
        <div class="delete-modal">
          <h4><i class="fas fa-unlink"></i> Confirmar Desvinculação</h4>
          <p>Deseja remover "${produto.nome}" da sua lista de vendas?</p>
          <div class="modal-buttons">
            <button class="btn btn-outline-secondary cancel-btn">Cancelar</button>
            <button class="btn btn-danger confirm-btn">Desvincular</button>
          </div>
        </div>
      </div>
    `);
    
    $('body').append($modal);
    setTimeout(() => $modal.addClass('show'), 50);
    
    $modal.find('.cancel-btn').on('click', () => {
      $modal.removeClass('show');
      setTimeout(() => $modal.remove(), 300);
    });
    
    $modal.find('.confirm-btn').on('click', async () => {
      try {
        await deleteVinculoPorProdutoFornecedor(produto.id, loja.id);
        carregarDados();
        
        $modal.removeClass('show');
        setTimeout(() => $modal.remove(), 300);
        
        // Mostrar sucesso
        const $success = $('<div class="success-toast"><i class="fas fa-check"></i>Produto desvinculado com sucesso!</div>');
        $('body').append($success);
        setTimeout(() => $success.addClass('show'), 100);
        setTimeout(() => {
          $success.removeClass('show');
          setTimeout(() => $success.remove(), 300);
        }, 3000);
        
      } catch (err) {
        
        const $error = $('<div class="error-toast"><i class="fas fa-times"></i>Erro ao desvincular produto</div>');
        $('body').append($error);
        setTimeout(() => $error.addClass('show'), 100);
        setTimeout(() => {
          $error.removeClass('show');
          setTimeout(() => $error.remove(), 300);
        }, 3000);
      }
    });
  };

  const handleDelete = async (produtoId) => {
    // Usar jQuery para modal de confirmação
    const $modal = $(`
      <div class="delete-modal-overlay">
        <div class="delete-modal">
          <h4><i class="fas fa-trash-alt"></i> Confirmar Exclusão</h4>
          <p>Tem certeza que deseja excluir este produto?</p>
          <div class="modal-buttons">
            <button class="btn btn-outline-secondary cancel-btn">Cancelar</button>
            <button class="btn btn-danger confirm-btn">Excluir</button>
          </div>
        </div>
      </div>
    `);
    
    $('body').append($modal);
    setTimeout(() => $modal.addClass('show'), 50);
    
    $modal.find('.cancel-btn').on('click', () => {
      $modal.removeClass('show');
      setTimeout(() => $modal.remove(), 300);
    });
    
    $modal.find('.confirm-btn').on('click', async () => {
      try {
        await deleteProduto(produtoId);
        carregarDados();
        
        $modal.removeClass('show');
        setTimeout(() => $modal.remove(), 300);
        
        // Mostrar sucesso
        const $success = $('<div class="success-toast"><i class="fas fa-check"></i>Produto excluído com sucesso!</div>');
        $('body').append($success);
        setTimeout(() => $success.addClass('show'), 100);
        setTimeout(() => {
          $success.removeClass('show');
          setTimeout(() => $success.remove(), 300);
        }, 3000);
        
      } catch (err) {
        
        const $error = $('<div class="error-toast"><i class="fas fa-times"></i>Erro ao excluir produto</div>');
        $('body').append($error);
        setTimeout(() => $error.addClass('show'), 100);
        setTimeout(() => {
          $error.removeClass('show');
          setTimeout(() => $error.remove(), 300);
        }, 3000);
      }
    });
  };

  if (loading) {
    return (
      <div className="produtos-loading">
        <i className="fas fa-spinner fa-spin fa-2x"></i>
        <p>Carregando produtos...</p>
      </div>
    );
  }

  return (
    <div className="minha-loja-produtos">
      {/* Header */}
      <div className="produtos-header">
        <div className="header-info">
          <h3><i className="fas fa-box"></i> Meus Produtos</h3>
          <p>Gerencie os produtos da sua loja</p>
        </div>
        <button 
          className="btn btn-primary"
          onClick={() => openModal()}
        >
          <i className="fas fa-plus"></i>
          Adicionar Produto
        </button>
      </div>

      {/* Lista de Produtos */}
      {error && (
        <div className="error-message">
          <i className="fas fa-exclamation-triangle"></i>
          {error}
        </div>
      )}

      {produtos.length === 0 ? (
        <div className="empty-products">
          <i className="fas fa-box-open fa-3x"></i>
          <h4>Nenhum produto cadastrado</h4>
          <p>Comece adicionando seus primeiros produtos para vender na sua loja.</p>
          <button 
            className="btn btn-primary"
            onClick={() => openModal()}
          >
            <i className="fas fa-plus"></i>
            Adicionar Primeiro Produto
          </button>
        </div>
      ) : (
        <div className="produtos-grid">
          {produtos.map(produto => {
            const isOwner = produto.fornecedor_id === loja?.id;
            
            return (
            <div key={produto.id} className="produto-card">
              <div className="produto-card-header">
                <ProdutoImagem 
                  produtoId={produto.id}
                  produtoNome={produto.nome}
                  size="medium"
                  className="produto-card-imagem"
                />
                {!isOwner && (
                  <span className="badge-revenda" title="Produto de outro fornecedor (Revenda)">
                    <i className="fas fa-exchange-alt"></i> Revenda
                  </span>
                )}
              </div>
              
              <div className="produto-info">
                <h5>{produto.nome}</h5>
                <p className="produto-categoria">
                  {typeof produto.categoria === 'object' ? produto.categoria?.nome : produto.categoria}
                </p>
                <p className="produto-descricao">{produto.descricao}</p>
                
                <div className="produto-details">
                  <span className="produto-preco">
                    R$ {parseFloat(produto.preco || 0).toLocaleString('pt-BR', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })}
                  </span>
                  <span className="produto-estoque">
                    Estoque: {produto.estoque || 0}
                  </span>
                </div>
              </div>
              
              <div className="produto-actions">
                {isOwner ? (
                  <>
                    <button 
                      className="btn btn-outline-primary btn-sm"
                      onClick={() => openModal(produto)}
                      title="Editar"
                    >
                      <i className="fas fa-edit"></i>
                    </button>
                    <button 
                      className="btn btn-outline-danger btn-sm"
                      onClick={() => handleDelete(produto.id)}
                      title="Excluir"
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                  </>
                ) : (
                  <>
                    <button 
                      className="btn btn-outline-secondary btn-sm"
                      disabled
                      title="Gerencie este produto na tela de Vínculos"
                    >
                      <i className="fas fa-lock"></i>
                    </button>
                    <button 
                      className="btn btn-outline-warning btn-sm"
                      onClick={() => handleUnlink(produto)}
                      title="Desvincular (Remover da lista)"
                    >
                      <i className="fas fa-unlink"></i>
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
        </div>
      )}

      {/* Modal de Produto */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h4>
                <i className="fas fa-box"></i>
                {editingProduct ? 'Editar Produto' : 'Adicionar Produto'}
              </h4>
              <button className="modal-close" onClick={closeModal}>
                <i className="fas fa-times"></i>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="produto-form">
              {error && (
                <div className="error-message">
                  <i className="fas fa-exclamation-triangle"></i>
                  {error}
                </div>
              )}

              <div className="form-group">
                <label htmlFor="nome">
                  <i className="fas fa-tag"></i>
                  Nome do Produto *
                </label>
                <input
                  type="text"
                  id="nome"
                  name="nome"
                  value={formData.nome}
                  onChange={handleInputChange}
                  placeholder="Nome do produto"
                  required
                />
                {!editingProduct && (
                  <small className="help-text">
                    <i className="fas fa-info-circle"></i>
                    Para produtos novos, apenas o nome é obrigatório. Status será "Ativo" automaticamente.
                  </small>
                )}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="preco">
                    <i className="fas fa-dollar-sign"></i>
                    Preço {editingProduct && '*'}
                  </label>
                  <input
                    type="text"
                    id="preco"
                    name="preco"
                    value={formData.preco}
                    onChange={handlePrecoChange}
                    placeholder="0,00"
                    required={editingProduct}
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="estoque">
                    <i className="fas fa-boxes"></i>
                    Estoque
                  </label>
                  <input
                    type="number"
                    id="estoque"
                    name="estoque"
                    value={formData.estoque}
                    onChange={handleInputChange}
                    placeholder="0"
                    min="0"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="categoria">
                  <i className="fas fa-list"></i>
                  Categoria {editingProduct && '*'}
                </label>
                <select
                  id="categoria"
                  name="categoria"
                  value={formData.categoria}
                  onChange={handleInputChange}
                  required={editingProduct}
                >
                  <option value="">Selecione uma categoria</option>
                  {categorias.map(categoria => (
                    <option key={categoria.id || categoria} value={categoria.id || categoria}>
                      {categoria.nome || categoria}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="descricao">
                  <i className="fas fa-align-left"></i>
                  Descrição
                </label>
                <textarea
                  id="descricao"
                  name="descricao"
                  value={formData.descricao}
                  onChange={handleInputChange}
                  placeholder="Descreva o produto..."
                  rows="3"
                />
              </div>

              <div className="form-group">
                <label htmlFor="imagem">
                  <i className="fas fa-image"></i>
                  Imagem do Produto
                </label>
                <input
                  type="file"
                  id="imagem"
                  name="imagem"
                  accept="image/*"
                  onChange={handleInputChange}
                />
                <small className="form-hint">
                  Formatos aceitos: JPG, PNG, GIF (máx. 5MB)
                </small>
              </div>

              <div className="form-actions">
                <button type="button" className="btn btn-outline-secondary" onClick={closeModal}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  <i className="fas fa-save"></i>
                  {editingProduct ? 'Salvar Alterações' : 'Adicionar Produto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Relogin Necessário */}
      {showReloginModal && (
        <div className="modal-overlay relogin-modal-overlay">
          <div className="modal-content relogin-modal">
            <div className="relogin-icon">
              <i className="fas fa-sync-alt"></i>
            </div>
            <h3>Atualização Necessária</h3>
            <p>
              Sua loja foi cadastrada, mas suas permissões precisam ser atualizadas.
              <br /><br />
              <strong>Faça login novamente</strong> para poder cadastrar produtos.
            </p>
            <div className="relogin-actions">
              <button 
                className="btn btn-secondary" 
                onClick={() => setShowReloginModal(false)}
              >
                Cancelar
              </button>
              <button 
                className="btn btn-primary"
                onClick={handleForcarRelogin}
              >
                <i className="fas fa-sign-in-alt"></i>
                Fazer Login Novamente
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MinhaLojaProdutos;