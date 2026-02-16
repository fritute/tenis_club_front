import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import $ from 'jquery';
import { 
  getRelatorioDashboard, 
  getProdutos, 
  getFornecedores,
  getCategorias 
} from '../../services/api';
import './Dashboard.css';

function Dashboard({ user }) {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalFornecedores: 0,
    totalProdutos: 0,
    totalCategorias: 0,
    topFornecedores: []
  });

  useEffect(() => {
    loadDashboardData();
    
    // jQuery animation on mount
    $('.stat-card').each(function(index) {
      $(this).delay(100 * index).queue(function() {
        $(this).addClass('animate-in').dequeue();
      });
    });
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Load all data in parallel
      const [dashboardData, produtos, fornecedores, categorias] = await Promise.all([
        getRelatorioDashboard().catch(() => ({ fornecedores_total: 0 })),
        getProdutos().catch(() => []),
        getFornecedores().catch(() => []),
        getCategorias().catch(() => [])
      ]);

      setStats({
        totalFornecedores: fornecedores.length || dashboardData.fornecedores_total || 0,
        totalProdutos: produtos.length || dashboardData.produtos_total || 0,
        totalCategorias: categorias.length || dashboardData.categorias_total || 0,
        topFornecedores: dashboardData.top_fornecedores || []
      });

      // jQuery counter animation
      animateCounters();
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const animateCounters = () => {
    $('.stat-number').each(function() {
      const $this = $(this);
      const countTo = parseInt($this.text());
      
      $({ countNum: 0 }).animate({
        countNum: countTo
      }, {
        duration: 1500,
        easing: 'swing',
        step: function() {
          $this.text(Math.floor(this.countNum));
        },
        complete: function() {
          $this.text(this.countNum);
        }
      });
    });
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner"></div>
        <p>Carregando dashboard...</p>
      </div>
    );
  }

  // Validação de segurança para user
  if (!user) {
    return (
      <div className="dashboard-loading">
        <div className="spinner"></div>
        <p>Carregando informações do usuário...</p>
      </div>
    );
  }

  // Mensagens personalizadas por nível
  const getWelcomeMessage = () => {
    const nivel = user?.nivel?.toLowerCase();
    
    if (nivel === 'executivo') {
      return {
        title: 'Dashboard Executivo',
        subtitle: 'Visão geral completa do sistema Tênis Club'
      };
    }
    
    if (nivel === 'fornecedor') {
      return {
        title: 'Painel do Fornecedor',
        subtitle: 'Gerencie seus produtos e visualize seu desempenho'
      };
    }
    
    if (nivel === 'comum') {
      return {
        title: 'Bem-vindo ao Tênis Club',
        subtitle: 'Explore fornecedores e encontre os melhores produtos'
      };
    }
    
    return {
      title: 'Dashboard',
      subtitle: 'Visão geral do sistema Tênis Club'
    };
  };

  const welcomeMessage = getWelcomeMessage();

  return (
    <div className="dashboard-container">
      {/* Hero Section */}
      <div className="dashboard-hero">
        <div className="hero-content">
          <h1 className="hero-title">
            <i className="fas fa-chart-line"></i>
            {welcomeMessage.title}
          </h1>
          <p className="hero-subtitle">
            {welcomeMessage.subtitle}
          </p>
        </div>
        <div className="hero-icon">
          <i className="fas fa-running"></i>
        </div>
      </div>

      {/* Informações baseadas no nível do usuário */}
      {user?.nivel?.toLowerCase() === 'executivo' && (
        <div className="info-banner info-executivo">
          <i className="fas fa-shield-alt"></i>
          <div>
            <strong>Acesso Executivo</strong>
            <p>Você tem acesso completo ao sistema incluindo gerenciamento de fornecedores, produtos, categorias e relatórios.</p>
          </div>
        </div>
      )}

      {user?.nivel?.toLowerCase() === 'fornecedor' && (
        <div className="info-banner info-fornecedor">
          <i className="fas fa-box"></i>
          <div>
            <strong>Painel de Fornecedor</strong>
            <p>Gerencie seus produtos, categorias e visualize estatísticas do seu desempenho no sistema.</p>
          </div>
        </div>
      )}

      {user?.nivel?.toLowerCase() === 'comum' && (
        <div className="info-banner info-comprador">
          <i className="fas fa-shopping-cart"></i>
          <div>
            <strong>Portal do Comprador</strong>
            <p>Explore fornecedores, visualize produtos e encontre as melhores ofertas para seu negócio.</p>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card stat-fornecedores">
          <div className="stat-icon">
            <i className="fas fa-truck"></i>
          </div>
          <div className="stat-info">
            <div className="stat-number">{stats.totalFornecedores}</div>
            <div className="stat-label">Fornecedores</div>
          </div>
          <Link to="/fornecedores" className="stat-link">
            Ver todos <i className="fas fa-arrow-right"></i>
          </Link>
        </div>

        <div className="stat-card stat-produtos">
          <div className="stat-icon">
            <i className="fas fa-shoe-prints"></i>
          </div>
          <div className="stat-info">
            <div className="stat-number">{stats.totalProdutos}</div>
            <div className="stat-label">Produtos</div>
          </div>
          <Link to="/produtos" className="stat-link">
            Ver todos <i className="fas fa-arrow-right"></i>
          </Link>
        </div>

        <div className="stat-card stat-categorias">
          <div className="stat-icon">
            <i className="fas fa-tags"></i>
          </div>
          <div className="stat-info">
            <div className="stat-number">{stats.totalCategorias}</div>
            <div className="stat-label">Categorias</div>
          </div>
          <Link to="/categorias" className="stat-link">
            Ver todas <i className="fas fa-arrow-right"></i>
          </Link>
        </div>

        <div className="stat-card stat-relatorios">
          <div className="stat-icon">
            <i className="fas fa-file-alt"></i>
          </div>
          <div className="stat-info">
            <div className="stat-number">6</div>
            <div className="stat-label">Relatórios</div>
          </div>
          <Link to="/relatorios" className="stat-link">
            Ver relatórios <i className="fas fa-arrow-right"></i>
          </Link>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <h2 className="section-title">
          <i className="fas fa-bolt"></i>
          Ações Rápidas
        </h2>
        <div className="actions-grid">
          <Link to="/fornecedores" className="action-card">
            <i className="fas fa-plus-circle"></i>
            <span>Novo Fornecedor</span>
          </Link>
          <Link to="/produtos" className="action-card">
            <i className="fas fa-plus-circle"></i>
            <span>Novo Produto</span>
          </Link>
          <Link to="/categorias" className="action-card">
            <i className="fas fa-plus-circle"></i>
            <span>Nova Categoria</span>
          </Link>
          <Link to="/relatorios" className="action-card">
            <i className="fas fa-chart-bar"></i>
            <span>Ver Relatórios</span>
          </Link>
        </div>
      </div>

      {/* Top Fornecedores */}
      {stats.topFornecedores && stats.topFornecedores.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">
              <i className="fas fa-trophy"></i>
              Top Fornecedores
            </h2>
          </div>
          <div className="card-body">
            <div className="top-fornecedores-list">
              {stats.topFornecedores.slice(0, 5).map((fornecedor, index) => (
                <div key={index} className="top-fornecedor-item">
                  <div className="fornecedor-rank">#{index + 1}</div>
                  <div className="fornecedor-info">
                    <div className="fornecedor-nome">{fornecedor.nome}</div>
                    <div className="fornecedor-produtos">
                      {fornecedor.total_produtos} produto(s)
                    </div>
                  </div>
                  <div className="fornecedor-badge">
                    {index === 0 && <i className="fas fa-crown"></i>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* System Info */}
      <div className="system-info">
        <div className="info-card">
          <i className="fas fa-user-shield"></i>
          <div className="info-content">
            <div className="info-label">Usuário Logado</div>
            <div className="info-value">{user?.nome || 'Usuário'}</div>
          </div>
        </div>
        <div className="info-card">
          <i className="fas fa-shield-alt"></i>
          <div className="info-content">
            <div className="info-label">Nível de Acesso</div>
            <div className="info-value">{user?.nivel || 'N/A'}</div>
          </div>
        </div>
        <div className="info-card">
          <i className="fas fa-calendar"></i>
          <div className="info-content">
            <div className="info-label">Data</div>
            <div className="info-value">{new Date().toLocaleDateString('pt-BR')}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
