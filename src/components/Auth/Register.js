import React, { useState } from 'react';
import $ from 'jquery';
import { cadastrarUsuario, login } from '../../services/api';
import './Register.css';

const Register = ({ onRegisterSuccess, onBackToLogin }) => {
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    senha: '',
    confirmarSenha: '',
    nivel: 'comum',
    telefone: '',
    endereco: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1); // 1: dados básicos, 2: dados complementares

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Limpar erro quando usuário começar a digitar
    if (error) setError('');
  };

  const validateStep1 = () => {
    if (!formData.nome.trim()) {
      setError('Nome é obrigatório');
      return false;
    }
    if (!formData.email.trim()) {
      setError('E-mail é obrigatório');
      return false;
    }
    if (!formData.email.includes('@')) {
      setError('E-mail inválido');
      return false;
    }
    if (!formData.senha) {
      setError('Senha é obrigatória');
      return false;
    }
    if (formData.senha.length < 6) {
      setError('Senha deve ter pelo menos 6 caracteres');
      return false;
    }
    if (formData.senha !== formData.confirmarSenha) {
      setError('Senhas não conferem');
      return false;
    }
    return true;
  };

  const handleNextStep = (e) => {
    e.preventDefault();
    if (validateStep1()) {
      setStep(2);
      $('.register-form').addClass('step-animation');
      setTimeout(() => $('.register-form').removeClass('step-animation'), 300);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateStep1()) return;
    
    setLoading(true);
    $('.register-btn').addClass('loading');
    
    try {
      console.log('[Register] Enviando dados de cadastro:', formData);
      const response = await cadastrarUsuario(formData);
      
      console.log('[Register] Resposta do backend:', response);
      
      // Backend retorna { success: true, message: "...", id: X }
      // Precisa fazer login para obter token e dados completos
      if (response.success) {
        console.log('[Register] ✅ Cadastro OK! Fazendo login automático...');
        
        // Fazer login automático com as credenciais
        const loginResponse = await login(formData.email, formData.senha);
        console.log('[Register] Resposta do login:', loginResponse);
        
        if (loginResponse.success) {
          $('.register-form').addClass('success-shake');
          
          // Pegar dados do login
          let userData = loginResponse.user || loginResponse.usuario;
          const token = loginResponse.token;
          
          // Se backend retornar loja separada, adicionar ao userData
          if (loginResponse.loja && !userData.loja) {
            userData = { ...userData, loja: loginResponse.loja };
          }
          
          console.log('[Register] userData do login:', userData);
          console.log('[Register] token do login:', token);
          
          // Se for fornecedor, redirecionar para cadastro da loja
          if (formData.nivel === 'fornecedor') {
            setTimeout(() => {
              onRegisterSuccess(userData, token, 'fornecedor');
            }, 500);
          } else {
            // Para usuários comuns, ir direto para o sistema
            setTimeout(() => {
              onRegisterSuccess(userData, token, 'comum');
            }, 500);
          }
        } else {
          setError('Conta criada, mas erro ao fazer login automático. Tente fazer login manualmente.');
        }
      } else {
        console.error('[Register] Resposta não indica sucesso:', response);
        setError(response.message || response.error || 'Erro ao criar conta');
        $('.register-form').addClass('error-shake');
        setTimeout(() => $('.register-form').removeClass('error-shake'), 500);
      }
    } catch (err) {
      console.error('[Register] Erro:', err);
      setError(err.error || err.message || 'Erro ao criar conta. Tente novamente.');
      $('.register-form').addClass('error-shake');
      setTimeout(() => $('.register-form').removeClass('error-shake'), 500);
    } finally {
      setLoading(false);
      $('.register-btn').removeClass('loading');
    }
  };

  const handleBackStep = () => {
    setStep(1);
    $('.register-form').addClass('step-animation');
    setTimeout(() => $('.register-form').removeClass('step-animation'), 300);
  };

  return (
    <div className="auth-container">
      <div className="auth-card register-card">
        <div className="auth-header">
          <h2>
            <i className="fas fa-user-plus"></i>
            Criar Conta
          </h2>
          <p>Preencha os dados para se cadastrar</p>
          
          <div className="progress-bar">
            <div className="progress-step">
              <div className={`step-circle ${step >= 1 ? 'active' : ''}`}>1</div>
              <span>Dados Básicos</span>
            </div>
            <div className="progress-line"></div>
            <div className="progress-step">
              <div className={`step-circle ${step >= 2 ? 'active' : ''}`}>2</div>
              <span>Informações Extras</span>
            </div>
          </div>
        </div>

        <form className="register-form" onSubmit={step === 1 ? handleNextStep : handleSubmit}>
          {error && (
            <div className="error-message">
              <i className="fas fa-exclamation-triangle"></i>
              {error}
            </div>
          )}

          {step === 1 && (
            <div className="form-step step-1">
              <div className="form-group">
                <label htmlFor="nome">
                  <i className="fas fa-user"></i>
                  Nome Completo
                </label>
                <input
                  type="text"
                  id="nome"
                  name="nome"
                  value={formData.nome}
                  onChange={handleChange}
                  placeholder="Digite seu nome completo"
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">
                  <i className="fas fa-envelope"></i>
                  E-mail
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="seu@email.com"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="senha">
                    <i className="fas fa-lock"></i>
                    Senha
                  </label>
                  <input
                    type="password"
                    id="senha"
                    name="senha"
                    value={formData.senha}
                    onChange={handleChange}
                    placeholder="Mínimo 6 caracteres"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="confirmarSenha">
                    <i className="fas fa-lock"></i>
                    Confirmar Senha
                  </label>
                  <input
                    type="password"
                    id="confirmarSenha"
                    name="confirmarSenha"
                    value={formData.confirmarSenha}
                    onChange={handleChange}
                    placeholder="Repita a senha"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="nivel">
                  <i className="fas fa-users"></i>
                  Tipo de Conta
                </label>
                <select
                  id="nivel"
                  name="nivel"
                  value={formData.nivel}
                  onChange={handleChange}
                >
                  <option value="comum">👤 Cliente - Comprar produtos</option>
                  <option value="fornecedor">🏪 Fornecedor - Vender produtos</option>
                </select>
              </div>

              <button type="submit" className="register-btn btn-primary">
                <i className="fas fa-arrow-right"></i>
                Continuar
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="form-step step-2">
              <div className="form-group">
                <label htmlFor="telefone">
                  <i className="fas fa-phone"></i>
                  Telefone (Opcional)
                </label>
                <input
                  type="tel"
                  id="telefone"
                  name="telefone"
                  value={formData.telefone}
                  onChange={handleChange}
                  placeholder="(11) 99999-9999"
                />
              </div>

              <div className="form-group">
                <label htmlFor="endereco">
                  <i className="fas fa-map-marker-alt"></i>
                  Endereço (Opcional)
                </label>
                <textarea
                  id="endereco"
                  name="endereco"
                  value={formData.endereco}
                  onChange={handleChange}
                  placeholder="Rua, número, bairro, cidade, estado"
                  rows="3"
                ></textarea>
              </div>

              {formData.nivel === 'fornecedor' && (
                <div className="info-box">
                  <i className="fas fa-info-circle"></i>
                  <div>
                    <strong>Próximo passo:</strong>
                    <p>Após criar sua conta, você será direcionado para cadastrar suas informações de empresa/loja.</p>
                  </div>
                </div>
              )}

              <div className="form-buttons">
                <button 
                  type="button" 
                  className="btn btn-outline-secondary"
                  onClick={handleBackStep}
                >
                  <i className="fas fa-arrow-left"></i>
                  Voltar
                </button>
                
                <button 
                  type="submit" 
                  className="register-btn btn-primary"
                  disabled={loading}
                >
                  {loading ? (
                    <><i className="fas fa-spinner fa-spin"></i> Criando...</>
                  ) : (
                    <><i className="fas fa-check"></i> Criar Conta</>
                  )}
                </button>
              </div>
            </div>
          )}
        </form>

        <div className="auth-footer">
          <p>
            Já tem uma conta?
            <button 
              type="button" 
              className="link-btn"
              onClick={onBackToLogin}
            >
              Fazer Login
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;