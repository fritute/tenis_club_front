import React, { useState, useEffect } from 'react';
import $ from 'jquery';
import {
  getCategorias,
  createCategoria,
  updateCategoria,
  deleteCategoria,
} from '../../services/api';
import { showNotification } from '../../services/api';
import './Categorias.css';

function Categorias({ user }) {
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    status: 'Ativo',
  });
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadCategorias();
  }, []);

  const loadCategorias = async () => {
    try {
      setLoading(true);
      const data = await getCategorias();
      
      console.log('[Categorias] Dados recebidos:');
      console.log('[Categorias] data tipo:', typeof data);
      console.log('[Categorias] data é array?', Array.isArray(data));
      console.log('[Categorias] data:', data);
      
      // Backend pode retornar {categorias: [...]} ou [...]
      const categorias = Array.isArray(data) ? data : 
                        (data?.categorias || data?.data || []);
      
      console.log('[Categorias] categorias array:', categorias);
      setCategorias(categorias);
    } catch (error) {
      console.error('[Categorias] Erro ao carregar categorias:', error);
      showNotification('Erro ao carregar categorias', 'error');
      setCategorias([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (editingId) {
        await updateCategoria(editingId, formData);
        showNotification('Categoria atualizada com sucesso!', 'success');
      } else {
        await createCategoria(formData);
        showNotification('Categoria criada com sucesso!', 'success');
      }

      closeModal();
      loadCategorias();
    } catch (error) {
      console.error('Erro ao salvar categoria:', error);
      showNotification(error.error || 'Erro ao salvar categoria', 'error');
    }
  };

  const handleEdit = (categoria) => {
    setEditingId(categoria.id);
    setFormData({
      nome: categoria.nome || '',
      descricao: categoria.descricao || '',
      status: categoria.status || 'Ativo',
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir esta categoria?')) {
      try {
        await deleteCategoria(id);
        showNotification('Categoria excluída com sucesso!', 'success');
        loadCategorias();
      } catch (error) {
        console.error('Erro ao excluir categoria:', error);
        showNotification(error.error || 'Erro ao excluir categoria', 'error');
      }
    }
  };

  const openModal = () => {
    setEditingId(null);
    setFormData({
      nome: '',
      descricao: '',
      status: 'Ativo',
    });
    setShowModal(true);

    setTimeout(() => {
      $('.modal').addClass('show');
    }, 10);
  };

  const closeModal = () => {
    $('.modal').removeClass('show');
    setTimeout(() => {
      setShowModal(false);
      setEditingId(null);
    }, 300);
  };

  const filteredCategorias = categorias.filter((c) =>
    c.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.descricao?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Carregando categorias...</p>
      </div>
    );
  }

  return (
    <div className="categorias-container page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <i className="fas fa-tags"></i>
            Categorias
          </h1>
          <p className="page-description">
            Organize seus produtos por categorias
          </p>
        </div>
        {user?.nivel?.toLowerCase() === 'executivo' && (
          <button className="btn btn-primary" onClick={openModal}>
            <i className="fas fa-plus"></i>
            Nova Categoria
          </button>
        )}
      </div>

      {/* Banner informativo para fornecedores */}
      {user?.nivel?.toLowerCase() === 'fornecedor' && (
        <div className="alert alert-info" style={{ marginBottom: '1.5rem' }}>
          <i className="fas fa-eye"></i>
          <div>
            <strong>Modo Visualização</strong>
            <p>Você pode visualizar as categorias disponíveis para classificar seus produtos. Para criar ou editar categorias, contate um administrador.</p>
          </div>
        </div>
      )}

      {/* Banner informativo para compradores */}
      {user?.nivel?.toLowerCase() === 'comum' && (
        <div className="alert alert-info" style={{ marginBottom: '1.5rem' }}>
          <i className="fas fa-tags"></i>
          <div>
            <strong>Catálogo de Categorias</strong>
            <p>Explore as categorias de produtos disponíveis no sistema para facilitar sua busca.</p>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <h2 className="card-title">
            <i className="fas fa-list"></i>
            Lista de Categorias ({filteredCategorias.length})
          </h2>
          <div className="search-box">
            <i className="fas fa-search"></i>
            <input
              type="text"
              placeholder="Buscar categoria..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="card-body">
          {filteredCategorias.length === 0 ? (
            <div className="empty-state">
              <i className="fas fa-inbox"></i>
              <h3>Nenhuma categoria encontrada</h3>
              <p>Clique no botão "Nova Categoria" para adicionar uma.</p>
            </div>
          ) : (
            <div className="categorias-grid">
              {filteredCategorias.map((categoria) => (
                <div key={categoria.id} className="categoria-card">
                  <div className="categoria-icon">
                    <i className="fas fa-tag"></i>
                  </div>
                  <div className="categoria-content">
                    <h3 className="categoria-nome">{categoria.nome}</h3>
                    <p className="categoria-descricao">
                      {categoria.descricao || 'Sem descrição'}
                    </p>
                    <span className={`badge ${categoria.status === 'Ativo' ? 'badge-success' : 'badge-error'}`}>
                      {categoria.status}
                    </span>
                  </div>
                  {user?.nivel?.toLowerCase() === 'executivo' ? (
                    <div className="categoria-actions">
                      <button
                        className="btn btn-sm btn-warning"
                        onClick={() => handleEdit(categoria)}
                        title="Editar"
                      >
                        <i className="fas fa-edit"></i>
                      </button>
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => handleDelete(categoria.id)}
                        title="Excluir"
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    </div>
                  ) : (
                    <div className="categoria-lock">
                      <i className="fas fa-lock"></i>
                      <span>Somente leitura</span>
                    </div>
                  )}
                </div>
              ))}
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
                <i className="fas fa-tags"></i>
                {editingId ? 'Editar Categoria' : 'Nova Categoria'}
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
                    placeholder="Nome da categoria"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Descrição</label>
                  <textarea
                    className="form-control"
                    placeholder="Descrição da categoria"
                    rows="4"
                    value={formData.descricao}
                    onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
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
    </div>
  );
}

export default Categorias;
