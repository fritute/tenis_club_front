import React, { useState } from 'react';
import $ from 'jquery';
import { login } from '../../services/api';
import './Login.css';

function Login({ onLogin, onShowRegister }) {
  const [formData, setFormData] = useState({
    email: '',
    senha: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    
    // jQuery animation on input focus
    $(e.target).addClass('input-active');
  };

  const handleBlur = (e) => {
    if (!e.target.value) {
      $(e.target).removeClass('input-active');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // jQuery loading animation
    $('.login-btn').addClass('loading');

    try {
      console.log('[Login] Enviando credenciais...');
      const response = await login(formData.email, formData.senha);
      
      console.log('[Login] Resposta completa do backend:', response);
      console.log('[Login] response.success:', response.success);
      console.log('[Login] response.user:', response.user);
      console.log('[Login] response.loja:', response.loja);
      console.log('[Login] response.token:', response.token);
      console.log('[Login] response.usuario:', response.usuario);
      
      // Verificar se a resposta é válida
      if (!response || typeof response !== 'object') {
        console.error('[Login] ERRO: Resposta inválida do servidor');
        setError('Resposta inválida do servidor');
        $('.login-form').addClass('error-shake');
        setTimeout(() => $('.login-form').removeClass('error-shake'), 500);
        return;
      }
      
      if (response.success) {
        // jQuery success animation
        $('.login-form').addClass('success-shake');
        
        // Backend pode retornar 'user' ou 'usuario'
        let userData = response.user || response.usuario;
        const token = response.token;
        
        // 🏪 Backend pode retornar loja separada ou dentro do user
        // Verificar ambos os casos
        if (response.loja && !userData.loja) {
          console.log('[Login] 🏪 Loja encontrada na resposta (separada), adicionando ao userData');
          userData = { ...userData, loja: response.loja };
        }
        
        console.log('[Login] userData final:', userData);
        console.log('[Login] userData.loja:', userData?.loja);
        console.log('[Login] token final:', token);
        
        if (!userData) {
          console.error('[Login] ERRO: Backend não retornou dados do usuário!');
          console.error('[Login] Resposta completa:', response);
          setError('Erro ao obter dados do usuário');
          $('.login-form').addClass('error-shake');
          setTimeout(() => $('.login-form').removeClass('error-shake'), 500);
          return;
        }
        
        if (!token) {
          console.error('[Login] ERRO: Backend não retornou token!');
          console.error('[Login] Resposta completa:', response);
          setError('Erro ao obter token de autenticação');
          $('.login-form').addClass('error-shake');
          setTimeout(() => $('.login-form').removeClass('error-shake'), 500);
          return;
        }
        
        setTimeout(() => {
          onLogin(userData, token);
        }, 500);
      } else {
        const errorMsg = response.message || response.error || 'Credenciais inválidas';
        console.error('[Login] Erro retornado pelo backend:', errorMsg);
        setError(errorMsg);
        $('.login-form').addClass('error-shake');
        setTimeout(() => $('.login-form').removeClass('error-shake'), 500);
      }
    } catch (err) {
      setError(err.error || 'Erro ao fazer login. Tente novamente.');
      $('.login-form').addClass('error-shake');
      setTimeout(() => $('.login-form').removeClass('error-shake'), 500);
    } finally {
      setLoading(false);
      $('.login-btn').removeClass('loading');
    }
  };

  // Usuários de demonstração
  const demoUsers = [
    { email: 'admin@sistema.com', senha: 'admin123', nivel: 'Executivo' },
    { email: 'fornecedor@teste.com', senha: 'forn123', nivel: 'Fornecedor' },
    { email: 'usuario@teste.com', senha: 'user123', nivel: 'Comum' },
  ];

  const fillDemoUser = (user) => {
    setFormData({
      email: user.email,
      senha: user.senha,
    });
    
    // jQuery animation
    $('.form-control').addClass('input-active');
    $('.demo-user').addClass('selected-pulse');
    setTimeout(() => $('.demo-user').removeClass('selected-pulse'), 300);
  };

  return (
    <div className="login-container">
      <div className="login-background">
        <div className="bg-shape shape-1"></div>
        <div className="bg-shape shape-2"></div>
        <div className="bg-shape shape-3"></div>
      </div>

      <div className="login-content">
        <div className="login-card">
          <div className="login-header">
            <div className="login-logo">
              <i className="fas fa-running"></i>
            </div>
            <h1 className="login-title">Tênis Club</h1>
            <p className="login-subtitle">Gestão Inteligente de Produtos</p>
          </div>

          <form className="login-form" onSubmit={handleSubmit}>
            {error && (
              <div className="alert alert-error">
                <i className="fas fa-exclamation-circle"></i>
                <span>{error}</span>
              </div>
            )}

            <div className="form-group">
              <label htmlFor="email" className="form-label">
                <i className="fas fa-envelope"></i>
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                className="form-control"
                placeholder="Digite seu email"
                value={formData.email}
                onChange={handleChange}
                onBlur={handleBlur}
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="senha" className="form-label">
                <i className="fas fa-lock"></i>
                Senha
              </label>
              <div className="password-input-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="senha"
                  name="senha"
                  className="form-control"
                  placeholder="Digite sua senha"
                  value={formData.senha}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary login-btn"
              disabled={loading}
            >
              {loading ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i>
                  Entrando...
                </>
              ) : (
                <>
                  <i className="fas fa-sign-in-alt"></i>
                  Entrar
                </>
              )}
            </button>
          </form>

          <div className="demo-users">
            <p className="demo-title">
              <i className="fas fa-users"></i>
              Usuários de Demonstração
            </p>
            <div className="demo-users-grid">
              {demoUsers.map((user, index) => (
                <button
                  key={index}
                  className="demo-user"
                  onClick={() => fillDemoUser(user)}
                  type="button"
                >
                  <i className="fas fa-user-circle"></i>
                  <div className="demo-user-info">
                    <span className="demo-user-nivel">{user.nivel}</span>
                    <span className="demo-user-email">{user.email}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
          
          <div className="auth-footer">
            <p>
              Não tem uma conta?
              <button 
                type="button" 
                className="link-btn"
                onClick={onShowRegister}
              >
                Criar Conta
              </button>
            </p>
          </div>
        </div>

        <div className="login-footer">
          <p>© 2026 Tênis Club. Sistema de Gestão Inteligente.</p>
        </div>
      </div>
    </div>
  );
}

export default Login;
