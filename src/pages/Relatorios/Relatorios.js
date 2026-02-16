import React, { useState, useEffect } from 'react';
import $ from 'jquery';
import {
  getRelatorioDashboard,
  getRelatorioFornecedores,
  getRelatorioProdutos,
  getRelatorioCategorias,
  getRelatorioFinanceiro,
} from '../../services/api';
import { showNotification } from '../../services/api';
import './Relatorios.css';

function Relatorios({ user }) {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [relatorioData, setRelatorioData] = useState(null);

  useEffect(() => {
    loadRelatorio(activeTab);
  }, [activeTab]);

  const loadRelatorio = async (tipo) => {
    try {
      setLoading(true);
      let data;

      console.log(`[Relatorios] Carregando relatório: ${tipo}`);

      switch (tipo) {
        case 'dashboard':
          data = await getRelatorioDashboard();
          break;
        case 'fornecedores':
          data = await getRelatorioFornecedores();
          break;
        case 'produtos':
          data = await getRelatorioProdutos();
          break;
        case 'categorias':
          data = await getRelatorioCategorias();
          break;
        case 'financeiro':
          data = await getRelatorioFinanceiro();
          break;
        default:
          data = null;
      }

      console.log(`[Relatorios] Dados recebidos:`, data);
      setRelatorioData(data);
      
      // jQuery animation
      $('.relatorio-content').addClass('slide-in');
      setTimeout(() => $('.relatorio-content').removeClass('slide-in'), 300);
    } catch (error) {
      console.error('[Relatorios] Erro ao carregar relatório:', error);
      console.error('[Relatorios] Detalhes do erro:', {
        message: error.message,
        response: error.response,
        tipo: tipo
      });
      
      const errorMessage = error.error || error.message || 'Erro ao carregar relatório. Verifique se o backend está rodando.';
      showNotification(errorMessage, 'error');
      setRelatorioData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  const exportToJSON = () => {
    if (!relatorioData) return;
    
    const dataStr = JSON.stringify(relatorioData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `relatorio_${activeTab}_${new Date().getTime()}.json`;
    link.click();
    
    showNotification('Relatório exportado com sucesso!', 'success');
  };

  const renderDashboard = () => {
    if (!relatorioData) return null;

    const temDados = relatorioData.fornecedores_total > 0 || 
                     relatorioData.produtos_total > 0 || 
                     relatorioData.categorias_total > 0;

    return (
      <div className="relatorio-dashboard">
        <div className="dashboard-stats">
          <div className="stat-box stat-blue">
            <i className="fas fa-truck"></i>
            <div className="stat-content">
              <div className="stat-value">{relatorioData.fornecedores_total || 0}</div>
              <div className="stat-label">Total Fornecedores</div>
            </div>
          </div>
          <div className="stat-box stat-orange">
            <i className="fas fa-shoe-prints"></i>
            <div className="stat-content">
              <div className="stat-value">{relatorioData.produtos_total || 0}</div>
              <div className="stat-label">Total Produtos</div>
            </div>
          </div>
          <div className="stat-box stat-green">
            <i className="fas fa-tags"></i>
            <div className="stat-content">
              <div className="stat-value">{relatorioData.categorias_total || 0}</div>
              <div className="stat-label">Total Categorias</div>
            </div>
          </div>
        </div>

        {!temDados && (
          <div className="alert alert-info">
            <i className="fas fa-info-circle"></i>
            <div>
              <strong>Nenhum dado cadastrado ainda</strong>
              <p>Cadastre fornecedores, produtos e categorias para visualizar estatísticas aqui.</p>
            </div>
          </div>
        )}

        {relatorioData.top_fornecedores && relatorioData.top_fornecedores.length > 0 && (
          <div className="relatorio-section">
            <h3>
              <i className="fas fa-trophy"></i>
              Top Fornecedores
            </h3>
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Posição</th>
                    <th>Nome</th>
                    <th>Total Produtos</th>
                  </tr>
                </thead>
                <tbody>
                  {relatorioData.top_fornecedores.map((f, index) => (
                    <tr key={index}>
                      <td>
                        <div className="ranking-badge">
                          {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                        </div>
                      </td>
                      <td><strong>{f.nome}</strong></td>
                      <td>{f.total_produtos}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderFornecedores = () => {
    if (!relatorioData || !relatorioData.fornecedores) return null;

    if (relatorioData.fornecedores.length === 0) {
      return (
        <div className="empty-state">
          <i className="fas fa-truck"></i>
          <h3>Nenhum fornecedor cadastrado</h3>
          <p>Cadastre fornecedores para visualizar o relatório detalhado.</p>
        </div>
      );
    }

    return (
      <div className="relatorio-fornecedores">
        <div className="relatorio-section">
          <h3>
            <i className="fas fa-truck"></i>
            Lista de Fornecedores ({relatorioData.fornecedores.length})
          </h3>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Email</th>
                  <th>CNPJ</th>
                  <th>Total Produtos</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {relatorioData.fornecedores.map((f, index) => (
                  <tr key={index}>
                    <td><strong>{f.nome}</strong></td>
                    <td>{f.email || 'N/A'}</td>
                    <td>{f.cnpj || 'N/A'}</td>
                    <td>{f.total_produtos || 0}</td>
                    <td>
                      <span className={`badge ${f.status === 'Ativo' ? 'badge-success' : 'badge-error'}`}>
                        {f.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderProdutos = () => {
    if (!relatorioData || !relatorioData.produtos) return null;

    if (relatorioData.produtos.length === 0) {
      return (
        <div className="empty-state">
          <i className="fas fa-shoe-prints"></i>
          <h3>Nenhum produto cadastrado</h3>
          <p>Cadastre produtos para visualizar o relatório detalhado.</p>
        </div>
      );
    }

    return (
      <div className="relatorio-produtos">
        <div className="relatorio-section">
          <h3>
            <i className="fas fa-shoe-prints"></i>
            Lista de Produtos ({relatorioData.produtos.length})
          </h3>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Categoria</th>
                  <th>Preço Base</th>
                  <th>Total Fornecedores</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {relatorioData.produtos.map((p, index) => (
                  <tr key={index}>
                    <td><strong>{p.nome}</strong></td>
                    <td>{p.categoria_nome || 'N/A'}</td>
                    <td>
                      {p.preco_base ? `R$ ${Number(p.preco_base).toFixed(2)}` : 'N/A'}
                    </td>
                    <td>{p.total_fornecedores || 0}</td>
                    <td>
                      <span className={`badge ${p.status === 'Ativo' ? 'badge-success' : 'badge-error'}`}>
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderCategorias = () => {
    if (!relatorioData || !relatorioData.categorias) return null;

    if (relatorioData.categorias.length === 0) {
      return (
        <div className="empty-state">
          <i className="fas fa-tags"></i>
          <h3>Nenhuma categoria cadastrada</h3>
          <p>Cadastre categorias para visualizar o relatório detalhado.</p>
        </div>
      );
    }

    return (
      <div className="relatorio-categorias">
        <div className="relatorio-section">
          <h3>
            <i className="fas fa-tags"></i>
            Análise de Categorias ({relatorioData.categorias.length})
          </h3>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Total Produtos</th>
                  <th>Preço Mínimo</th>
                  <th>Preço Máximo</th>
                  <th>Preço Médio</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {relatorioData.categorias.map((c, index) => (
                  <tr key={index}>
                    <td><strong>{c.nome}</strong></td>
                    <td>{c.total_produtos || 0}</td>
                    <td>
                      {c.preco_minimo ? `R$ ${Number(c.preco_minimo).toFixed(2)}` : 'N/A'}
                    </td>
                    <td>
                      {c.preco_maximo ? `R$ ${Number(c.preco_maximo).toFixed(2)}` : 'N/A'}
                    </td>
                    <td>
                      {c.preco_medio ? `R$ ${Number(c.preco_medio).toFixed(2)}` : 'N/A'}
                    </td>
                    <td>
                      <span className={`badge ${c.status === 'Ativo' ? 'badge-success' : 'badge-error'}`}>
                        {c.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderFinanceiro = () => {
    if (!relatorioData) return null;

    const temDados = (relatorioData.produtos_multi_fornecedores && 
                      relatorioData.produtos_multi_fornecedores.length > 0) ||
                     relatorioData.economia_potencial;

    if (!temDados) {
      return (
        <div className="empty-state">
          <i className="fas fa-dollar-sign"></i>
          <h3>Dados insuficientes para análise financeira</h3>
          <p>Cadastre produtos com múltiplos fornecedores para visualizar oportunidades de economia.</p>
        </div>
      );
    }

    return (
      <div className="relatorio-financeiro">
        <div className="relatorio-section">
          <h3>
            <i className="fas fa-dollar-sign"></i>
            Análise Financeira
          </h3>
          
          {relatorioData.economia_potencial && (
            <div className="alert alert-info">
              <i className="fas fa-info-circle"></i>
              <div>
                <strong>Economia Potencial Identificada!</strong>
                <p>{relatorioData.economia_potencial}</p>
              </div>
            </div>
          )}

          {relatorioData.produtos_multi_fornecedores && relatorioData.produtos_multi_fornecedores.length > 0 && (
            <div className="table-container">
              <h4>Produtos com Múltiplos Fornecedores</h4>
              <table className="table">
                <thead>
                  <tr>
                    <th>Produto</th>
                    <th>Total Fornecedores</th>
                    <th>Oportunidade</th>
                  </tr>
                </thead>
                <tbody>
                  {relatorioData.produtos_multi_fornecedores.map((p, index) => (
                    <tr key={index}>
                      <td><strong>{p.produto_nome}</strong></td>
                      <td>{p.total_fornecedores}</td>
                      <td>
                        <span className="badge badge-warning">
                          Comparar Preços
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Carregando relatório...</p>
        </div>
      );
    }

    if (!relatorioData) {
      return (
        <div className="empty-state">
          <i className="fas fa-chart-bar"></i>
          <h3>Nenhum dado disponível</h3>
          <p>Verifique se o backend está rodando em <strong>http://localhost:8000</strong></p>
          <p>Verifique também o console do navegador para mais detalhes</p>
          <p>Não foi possível carregar o relatório.</p>
        </div>
      );
    }

    switch (activeTab) {
      case 'dashboard':
        return renderDashboard();
      case 'fornecedores':
        return renderFornecedores();
      case 'produtos':
        return renderProdutos();
      case 'categorias':
        return renderCategorias();
      case 'financeiro':
        return renderFinanceiro();
      default:
        return null;
    }
  };

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: 'fa-chart-line' },
    { id: 'fornecedores', label: 'Fornecedores', icon: 'fa-truck' },
    { id: 'produtos', label: 'Produtos', icon: 'fa-shoe-prints' },
    { id: 'categorias', label: 'Categorias', icon: 'fa-tags' },
    { id: 'financeiro', label: 'Financeiro', icon: 'fa-dollar-sign' },
  ];

  return (
    <div className="relatorios-container page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <i className="fas fa-file-alt"></i>
            Relatórios
          </h1>
          <p className="page-description">
            Análise completa dos dados do sistema
          </p>
        </div>
        <button className="btn btn-primary" onClick={exportToJSON} disabled={!relatorioData}>
          <i className="fas fa-download"></i>
          Exportar JSON
        </button>
      </div>

      <div className="card">
        <div className="relatorio-tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => handleTabChange(tab.id)}
            >
              <i className={`fas ${tab.icon}`}></i>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="relatorio-content">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}

export default Relatorios;
