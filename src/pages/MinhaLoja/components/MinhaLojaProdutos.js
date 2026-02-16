import React, { useState, useEffect } from 'react';
import { getProdutos, addProdutoMinhaLoja, updateProduto, deleteProduto, getCategorias } from '../../../services/api';
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
      const [produtosResponse, categoriasResponse] = await Promise.all([
        getProdutos({ loja_id: loja?.id }),
        getCategorias()
      ]);
      
      console.log('[MinhaLojaProdutos] 🔍 Carregando produtos para loja:', loja?.id);
      console.log('[MinhaLojaProdutos] 📦 Resposta produtos:', produtosResponse);
      console.log('[MinhaLojaProdutos] 🏷️ Resposta categorias:', categoriasResponse);
      
      // Extrair dados dos produtos
      const produtosList = produtosResponse?.data || produtosResponse?.produtos || produtosResponse || [];
      console.log('[MinhaLojaProdutos] 📋 Produtos extraídos:', produtosList);
      setProdutos(produtosList);
      
      // Extrair dados das categorias
      const categoriasList = Array.isArray(categoriasResponse) 
        ? categoriasResponse 
        : (categoriasResponse?.data || categoriasResponse?.categorias || []);
      console.log('[MinhaLojaProdutos] 📂 Categorias extraídas:', categoriasList);
      setCategorias(categoriasList);
      
    } catch (err) {
      console.error('[MinhaLojaProdutos] Erro ao carregar dados:', err);
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

        const produtoData = new FormData();
        produtoData.append('nome', formData.nome.trim());
        produtoData.append('descricao', formData.descricao.trim());
        produtoData.append('preco', formData.preco.replace(/[^0-9,]/g, '').replace(',', '.'));
        produtoData.append('categoria', formData.categoria);
        produtoData.append('estoque', formData.estoque || '0');
        produtoData.append('loja_id', loja.id);
        
        if (formData.imagem) {
          produtoData.append('imagem', formData.imagem);
        }

        await updateProduto(editingProduct.id, produtoData);
      } else {
        // CRIAÇÃO - usar endpoint simplificado da minha loja
        console.log('[MinhaLojaProdutos] 🆕 Criando produto simplificado na minha loja');
        
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
          produtoSimplificado.preco = parseFloat(formData.preco.replace(/[^0-9,]/g, '').replace(',', '.'));
        }
        if (formData.categoria) {
          produtoSimplificado.categoria = formData.categoria;
        }
        if (formData.estoque) {
          produtoSimplificado.estoque = parseInt(formData.estoque);
        }

        console.log('[MinhaLojaProdutos] 📤 Dados enviados:', produtoSimplificado);
        
        await addProdutoMinhaLoja(produtoSimplificado);
        
        console.log('[MinhaLojaProdutos] ✅ Produto criado com sucesso');
      }

      closeModal();
      carregarDados();
    } catch (err) {
      console.error('[MinhaLojaProdutos] Erro ao salvar produto:', err);
      setError(err.message || '❌ Erro ao salvar produto');
    }
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
        console.error('[MinhaLojaProdutos] Erro ao excluir produto:', err);
        
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
          {produtos.map(produto => (
            <div key={produto.id} className="produto-card">
              <ProdutoImagem 
                produtoId={produto.id}
                produtoNome={produto.nome}
                size="medium"
                className="produto-card-imagem"
              />
              
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
              </div>
            </div>
          ))}
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
    </div>
  );
};

export default MinhaLojaProdutos;