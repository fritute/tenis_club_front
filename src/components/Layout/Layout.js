import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import $ from 'jquery';
import './Layout.css';

function Layout({ children, user, onLogout }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
    
    // jQuery animation
    if (sidebarOpen) {
      $('.sidebar').addClass('closed');
      $('.main-content').addClass('expanded');
    } else {
      $('.sidebar').removeClass('closed');
      $('.main-content').removeClass('expanded');
    }
  };

  // Menus baseados no nível do usuário
  const getMenuItems = () => {
    const nivel = user?.nivel?.toLowerCase();
    
    // Menu EXECUTIVO - Acesso completo ao sistema
    if (nivel === 'executivo') {
      return [
        { path: '/', icon: 'fa-chart-line', label: 'Dashboard' },
        { path: '/fornecedores', icon: 'fa-truck', label: 'Fornecedores' },
        { path: '/produtos', icon: 'fa-shoe-prints', label: 'Produtos' },
        { path: '/categorias', icon: 'fa-tags', label: 'Categorias' },
        { path: '/relatorios', icon: 'fa-file-alt', label: 'Relatórios' },
      ];
    }
    
    // Menu FORNECEDOR - Gerenciar seus produtos  
    if (nivel === 'fornecedor') {
      const baseMenu = [
        { path: '/', icon: 'fa-chart-line', label: 'Dashboard' },
      ];
      
      console.log('[Layout] 👔 Usuário fornecedor detectado');
      console.log('[Layout] 🏪 Verificando loja associada:', user?.loja ? 'Encontrada' : 'Não encontrada');
      
      // Se o fornecedor tem loja associada (via JWT), mostrar "Minha Loja"
      if (user?.loja) {
        console.log('[Layout] ✅ Loja encontrada, adicionando menu "Minha Loja"');
        baseMenu.push({ path: '/minha-loja', icon: 'fa-store', label: 'Minha Loja' });
      } else {
        console.log('[Layout] ⚠️ Fornecedor sem loja associada, menu limitado');
      }
      
      baseMenu.push(
        { path: '/produtos', icon: 'fa-shoe-prints', label: 'Meus Produtos' },
        { path: '/pedidos', icon: 'fa-shopping-bag', label: 'Pedidos Recebidos' },
        { path: '/categorias', icon: 'fa-tags', label: 'Categorias' }
      );
      
      // Se tem loja, adicionar vínculos de produtos
      if (user?.loja) {
        baseMenu.push({ path: '/vinculos-produtos', icon: 'fa-link', label: 'Vínculos' });
      }
      
      return baseMenu;
    }
    
    // Menu COMUM (Comprador) - Visualizar fornecedores e produtos
    if (nivel === 'comum') {
      return [
        { path: '/', icon: 'fa-chart-line', label: 'Dashboard' },
        { path: '/fornecedores', icon: 'fa-truck', label: 'Fornecedores' },
        { path: '/produtos', icon: 'fa-shoe-prints', label: 'Produtos' },
        { path: '/vinculos-produtos', icon: 'fa-link', label: 'Vínculos' },
        { path: '/pedidos', icon: 'fa-shopping-bag', label: 'Meus Pedidos' },
      ];
    }
    
    // Menu padrão (caso nível não seja reconhecido)
    return [
      { path: '/', icon: 'fa-home', label: 'Início' },
    ];
  };

  const menuItems = getMenuItems();

  const isActive = (path) => {
    return location.pathname === path;
  };

  const handleLogout = () => {
    // jQuery animation before logout
    $('.layout-container').addClass('fade-out');
    setTimeout(() => {
      onLogout();
    }, 300);
  };

  return (
    <div className="layout-container">
      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? '' : 'closed'}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <i className="fas fa-running"></i>
            {sidebarOpen && <span>Tênis Club</span>}
          </div>
        </div>

        <nav className="sidebar-nav">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-item ${isActive(item.path) ? 'active' : ''}`}
            >
              <i className={`fas ${item.icon}`}></i>
              {sidebarOpen && <span>{item.label}</span>}
            </Link>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">
              <i className="fas fa-user-circle"></i>
            </div>
            {sidebarOpen && (
              <div className="user-details">
                <span className="user-name">{user?.nome}</span>
                <span className="user-role">{user?.nivel}</span>
              </div>
            )}
          </div>
          {sidebarOpen && (
            <button className="btn-logout" onClick={handleLogout}>
              <i className="fas fa-sign-out-alt"></i>
              Sair
            </button>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <div className={`main-content ${sidebarOpen ? '' : 'expanded'}`}>
        {/* Header */}
        <header className="main-header">
          <button className="btn-toggle-sidebar" onClick={toggleSidebar}>
            <i className="fas fa-bars"></i>
          </button>

          <div className="header-right">
            <div className="header-welcome">
              Bem-vindo, <strong>{user?.nome}</strong>
            </div>
            <div className="header-badge">
              <span className={`badge badge-${user?.nivel === 'executivo' ? 'error' : user?.nivel === 'fornecedor' ? 'warning' : 'info'}`}>
                {user?.nivel}
              </span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="page-wrapper">
          {children}
        </main>
      </div>
    </div>
  );
}

export default Layout;
