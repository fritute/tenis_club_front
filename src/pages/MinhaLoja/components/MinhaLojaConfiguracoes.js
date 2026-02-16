import React, { useState } from 'react';
import { updateFornecedor } from '../../../services/api';
import $ from 'jquery';
import './MinhaLojaConfiguracoes.css';

const MinhaLojaConfiguracoes = ({ loja, onUpdate }) => {
  const [formData, setFormData] = useState({
    nome: loja?.nome || '',
    email: loja?.email || '',
    cnpj: loja?.cnpj || '',
    telefone: loja?.telefone || '',
    status: loja?.status || 'ativo',
    endereco: loja?.endereco || '',
    descricao: loja?.descricao || '',
    horarios: loja?.horarios || {
      segunda: '08:00-18:00',
      terca: '08:00-18:00',
      quarta: '08:00-18:00',
      quinta: '08:00-18:00',
      sexta: '08:00-18:00',
      sabado: '08:00-12:00',
      domingo: 'Fechado'
    }
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeSection, setActiveSection] = useState('informacoes');

  const formatTelefone = (value) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4,5})(\d{4})$/, '$1-$2')
      .replace(/(-\d{4})\d+?$/, '$1');
  };

  const formatCNPJ = (value) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{2})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'telefone') {
      setFormData(prev => ({ ...prev, [name]: formatTelefone(value) }));
    } else if (name === 'cnpj') {
      setFormData(prev => ({ ...prev, [name]: formatCNPJ(value) }));
    } else if (name.startsWith('horarios.')) {
      const dia = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        horarios: {
          ...prev.horarios,
          [dia]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    
    if (error) setError('');
    if (success) setSuccess('');
  };

  const handleStatusToggle = () => {
    const novoStatus = formData.status === 'ativo' ? 'inativo' : 'ativo';
    setFormData(prev => ({ ...prev, status: novoStatus }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      
      // Validações
      if (!formData.nome.trim()) {
        throw new Error('📝 Nome da loja é obrigatório');
      }
      
      if (!formData.email.trim() || !formData.email.includes('@')) {
        throw new Error('📧 Email válido é obrigatório');
      }
      
      if (formData.cnpj && formData.cnpj.replace(/\D/g, '').length !== 14) {
        throw new Error('🏢 CNPJ deve ter 14 dígitos');
      }
      
      if (formData.telefone && formData.telefone.replace(/\D/g, '').length < 10) {
        throw new Error('📞 Telefone deve ter pelo menos 10 dígitos');
      }

      // Preparar dados para envio
      const dadosAtualizacao = {
        nome: formData.nome.trim(),
        email: formData.email.trim(),
        cnpj: formData.cnpj.trim(),
        telefone: formData.telefone.trim(),
        status: formData.status,
        endereco: formData.endereco.trim(),
        descricao: formData.descricao.trim(),
        horarios: formData.horarios
      };

      // Atualizar no backend
      const response = await updateFornecedor(loja.id, dadosAtualizacao);
      
      if (response.success) {
        setSuccess('✅ Configurações salvas com sucesso!');
        onUpdate(dadosAtualizacao);
        
        // Animação de sucesso com jQuery
        $('.config-form').addClass('save-success');
        setTimeout(() => $('.config-form').removeClass('save-success'), 1000);
        
        // Auto-hide success message
        setTimeout(() => setSuccess(''), 5000);
      } else {
        throw new Error(response.message || 'Erro ao salvar configurações');
      }
      
    } catch (err) {
      console.error('[MinhaLojaConfiguracoes] Erro:', err);
      setError(err.message || '❌ Erro ao salvar configurações');
    } finally {
      setLoading(false);
    }
  };

  const diasSemana = {
    segunda: 'Segunda-feira',
    terca: 'Terça-feira',
    quarta: 'Quarta-feira',
    quinta: 'Quinta-feira',
    sexta: 'Sexta-feira',
    sabado: 'Sábado',
    domingo: 'Domingo'
  };

  return (
    <div className="minha-loja-configuracoes">
      {/* Header */}
      <div className="config-header">
        <div className="header-info">
          <h3><i className="fas fa-cog"></i> Configurações da Loja</h3>
          <p>Configure as informações e preferências da sua loja</p>
        </div>
        
        {/* Status Toggle */}
        <div className="status-toggle-container">
          <div className="status-info">
            <span className="status-label">Status da Loja:</span>
            <div className={`status-indicator ${formData.status}`}>
              <i className={`fas fa-${formData.status === 'ativo' ? 'check-circle' : 'times-circle'}`}></i>
              {formData.status === 'ativo' ? 'Ativa' : 'Inativa'}
            </div>
          </div>
          <button 
            type="button"
            className={`status-toggle ${formData.status}`}
            onClick={handleStatusToggle}
            title={`Clique para ${formData.status === 'ativo' ? 'desativar' : 'ativar'} a loja`}
          >
            <div className="toggle-slider">
              <i className={`fas fa-${formData.status === 'ativo' ? 'check' : 'times'}`}></i>
            </div>
          </button>
        </div>
      </div>

      {/* Navegação por Seções */}
      <div className="config-tabs">
        <button 
          className={`tab-btn ${activeSection === 'informacoes' ? 'active' : ''}`}
          onClick={() => setActiveSection('informacoes')}
        >
          <i className="fas fa-info-circle"></i>
          Informações Básicas
        </button>
        <button 
          className={`tab-btn ${activeSection === 'horarios' ? 'active' : ''}`}
          onClick={() => setActiveSection('horarios')}
        >
          <i className="fas fa-clock"></i>
          Horários de Funcionamento
        </button>
        <button 
          className={`tab-btn ${activeSection === 'avancado' ? 'active' : ''}`}
          onClick={() => setActiveSection('avancado')}
        >
          <i className="fas fa-cogs"></i>
          Configurações Avançadas
        </button>
      </div>

      {/* Formulário */}
      <form onSubmit={handleSubmit} className="config-form">
        {/* Mensagens */}
        {error && (
          <div className="error-message">
            <i className="fas fa-exclamation-triangle"></i>
            {error}
          </div>
        )}
        
        {success && (
          <div className="success-message">
            <i className="fas fa-check-circle"></i>
            {success}
          </div>
        )}

        {/* Seção: Informações Básicas */}
        {activeSection === 'informacoes' && (
          <div className="config-section">
            <h4><i className="fas fa-store"></i> Informações da Loja</h4>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="nome">
                  <i className="fas fa-tag"></i>
                  Nome da Loja *
                </label>
                <input
                  type="text"
                  id="nome"
                  name="nome"
                  value={formData.nome}
                  onChange={handleInputChange}
                  placeholder="Nome da sua loja"
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="email">
                  <i className="fas fa-envelope"></i>
                  Email *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="contato@minhaloja.com"
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="cnpj">
                  <i className="fas fa-id-card"></i>
                  CNPJ
                </label>
                <input
                  type="text"
                  id="cnpj"
                  name="cnpj"
                  value={formData.cnpj}
                  onChange={handleInputChange}
                  placeholder="00.000.000/0000-00"
                  maxLength="18"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="telefone">
                  <i className="fas fa-phone"></i>
                  Telefone
                </label>
                <input
                  type="tel"
                  id="telefone"
                  name="telefone"
                  value={formData.telefone}
                  onChange={handleInputChange}
                  placeholder="(11) 99999-9999"
                  maxLength="15"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="endereco">
                <i className="fas fa-map-marker-alt"></i>
                Endereço Completo
              </label>
              <textarea
                id="endereco"
                name="endereco"
                value={formData.endereco}
                onChange={handleInputChange}
                placeholder="Rua, número, bairro, cidade, estado, CEP"
                rows="3"
              />
            </div>

            <div className="form-group">
              <label htmlFor="descricao">
                <i className="fas fa-align-left"></i>
                Descrição da Loja
              </label>
              <textarea
                id="descricao"
                name="descricao"
                value={formData.descricao}
                onChange={handleInputChange}
                placeholder="Descreva sua loja, produtos e diferenciais..."
                rows="4"
              />
            </div>
          </div>
        )}

        {/* Seção: Horários */}
        {activeSection === 'horarios' && (
          <div className="config-section">
            <h4><i className="fas fa-clock"></i> Horários de Funcionamento</h4>
            <p className="section-description">
              Configure os horários de funcionamento da sua loja. Use "Fechado" para dias sem funcionamento.
            </p>
            
            <div className="horarios-grid">
              {Object.entries(diasSemana).map(([dia, label]) => (
                <div key={dia} className="horario-item">
                  <label htmlFor={`horarios.${dia}`}>
                    <i className="far fa-calendar"></i>
                    {label}
                  </label>
                  <input
                    type="text"
                    id={`horarios.${dia}`}
                    name={`horarios.${dia}`}
                    value={formData.horarios[dia]}
                    onChange={handleInputChange}
                    placeholder="08:00-18:00 ou Fechado"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Seção: Configurações Avançadas */}
        {activeSection === 'avancado' && (
          <div className="config-section">
            <h4><i className="fas fa-cogs"></i> Configurações Avançadas</h4>
            
            <div className="config-card">
              <div className="config-item">
                <div className="config-info">
                  <h5><i className="fas fa-eye"></i> Visibilidade da Loja</h5>
                  <p>Sua loja está {formData.status === 'ativo' ? 'visível' : 'oculta'} para os clientes</p>
                </div>
                <div className="config-value">
                  <button 
                    type="button"
                    className={`btn ${formData.status === 'ativo' ? 'btn-success' : 'btn-warning'}`}
                    onClick={handleStatusToggle}
                  >
                    {formData.status === 'ativo' ? (
                      <><i className="fas fa-eye"></i> Loja Ativa</>
                    ) : (
                      <><i className="fas fa-eye-slash"></i> Loja Inativa</>
                    )}
                  </button>
                </div>
              </div>

              <div className="config-item">
                <div className="config-info">
                  <h5><i className="fas fa-chart-bar"></i> Estatísticas</h5>
                  <p>Visualize as estatísticas da sua loja</p>
                </div>
                <div className="config-value">
                  <button type="button" className="btn btn-outline-primary">
                    <i className="fas fa-chart-line"></i>
                    Ver Relatórios
                  </button>
                </div>
              </div>

              <div className="config-item">
                <div className="config-info">
                  <h5><i className="fas fa-download"></i> Exportar Dados</h5>
                  <p>Baixe um backup dos dados da sua loja</p>
                </div>
                <div className="config-value">
                  <button type="button" className="btn btn-outline-info">
                    <i className="fas fa-file-export"></i>
                    Exportar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Ações do Formulário */}
        <div className="form-actions">
          <button 
            type="button" 
            className="btn btn-outline-secondary"
            onClick={() => window.location.reload()}
          >
            <i className="fas fa-undo"></i>
            Cancelar Alterações
          </button>
          
          <button 
            type="submit" 
            className="btn btn-success"
            disabled={loading}
          >
            {loading ? (
              <><i className="fas fa-spinner fa-spin"></i> Salvando...</>
            ) : (
              <><i className="fas fa-save"></i> Salvar Configurações</>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default MinhaLojaConfiguracoes;