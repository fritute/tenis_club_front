import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import $ from 'jquery';
import { cadastrarLoja, validateToken } from '../../services/api';
import './CadastroLoja.css';

const CadastroLoja = ({ user, token, onComplete, onSkip }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    cnpj: '',
    telefone: '',
    endereco: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');



  const handleChange = (e) => {
    const { name, value } = e.target;
    
    let formattedValue = value;
    
    // Aplicar formatação conforme o campo
    if (name === 'telefone') {
      formattedValue = formatTelefone(value);
    } else if (name === 'cnpj') {
      formattedValue = formatCNPJ(value);
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: formattedValue
    }));
    
    if (error) setError('');
  };



  const formatTelefone = (value) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 6) return `(${numbers.slice(0,2)}) ${numbers.slice(2)}`;
    if (numbers.length <= 10) return `(${numbers.slice(0,2)}) ${numbers.slice(2,7)}-${numbers.slice(7)}`;
    return `(${numbers.slice(0,2)}) ${numbers.slice(2,7)}-${numbers.slice(7,11)}`;
  };

  const formatCNPJ = (value) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 5) return `${numbers.slice(0,2)}.${numbers.slice(2)}`;
    if (numbers.length <= 8) return `${numbers.slice(0,2)}.${numbers.slice(2,5)}.${numbers.slice(5)}`;
    if (numbers.length <= 12) return `${numbers.slice(0,2)}.${numbers.slice(2,5)}.${numbers.slice(5,8)}/${numbers.slice(8)}`;
    return `${numbers.slice(0,2)}.${numbers.slice(2,5)}.${numbers.slice(5,8)}/${numbers.slice(8,12)}-${numbers.slice(12,14)}`;
  };



  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Não precisamos validar step específico, faremos validação inline
    
    setLoading(true);
    $('.submit-btn').addClass('loading');
    
    // Variável para controlar token temporário
    let tokenOriginal = null;
    
    try {
      console.log('[CadastroLoja] Enviando dados da loja:', formData);
      console.log('[CadastroLoja] Usuário logado:', user);
      
      // Verificar se o usuário está disponível
      if (!user || !user.id) {
        throw new Error('Usuário não encontrado. Faça login novamente.');
      }
      
      // Validar dados antes de enviar
      if (!formData.nome || formData.nome.trim().length < 2) {
        throw new Error('\u26a0\ufe0f Nome da loja deve ter pelo menos 2 caracteres');
      }

      const emailLoja = formData.email || user.email;
      if (!emailLoja || !emailLoja.includes('@')) {
        throw new Error('\ud83d\udce7 Email da loja \u00e9 obrigat\u00f3rio e deve ser v\u00e1lido');
      }

      // Validar CNPJ se preenchido
      if (formData.cnpj && formData.cnpj.replace(/\D/g, '').length !== 14) {
        throw new Error('\ud83c\udfd2 CNPJ deve ter 14 d\u00edgitos (formato: 00.000.000/0000-00)');
      }

      // Validar telefone se preenchido
      if (formData.telefone && formData.telefone.replace(/\D/g, '').length < 10) {
        throw new Error('\ud83d\udcde Telefone deve ter pelo menos 10 d\u00edgitos (formato: (11) 99999-9999)');
      }

      // Dados da loja - Backend identifica usuário pelo JWT automaticamente
      const lojaData = {
        nome: formData.nome.trim(),
        email: emailLoja.trim(),
        cnpj: formData.cnpj ? formData.cnpj.trim() : '',
        telefone: formData.telefone ? formData.telefone.trim() : '',
        endereco: formData.endereco ? formData.endereco.trim() : ''
      };

      console.log('[CadastroLoja] 🚀 Backend identifica usuário pelo JWT');
      console.log('[CadastroLoja] 📋 Dados para envio:', lojaData);
      
      // ⚠️ IMPORTANTE: Salvar token temporariamente no localStorage para o interceptor funcionar
      if (token && !localStorage.getItem('token')) {
        console.log('[CadastroLoja] 💾 Salvando token temporariamente no localStorage');
        tokenOriginal = localStorage.getItem('token'); // null neste caso
        localStorage.setItem('token', token);
      }
      
      const response = await cadastrarLoja(lojaData);
      
      console.log('[CadastroLoja] ✅ Resposta do backend:', response);
      
      if (response && (response.success || response.fornecedor_id || response.loja || response.id)) {
        $('.loja-form').addClass('success-shake');
        
        // ⚠️ IMPORTANTE: Se o backend retornar um novo token, salvar!
        if (response.token) {
          console.log('[CadastroLoja] 🔐 Novo token JWT recebido, atualizando...');
          localStorage.setItem('token', response.token);
        }
        
        // Extrair ID da loja de várias possíveis fontes
        const fornecedor_id = response.fornecedor_id || 
                             response.id || 
                             response.loja?.id || 
                             response.data?.id ||
                             response.loja?.fornecedor_id ||
                             Date.now(); // Fallback: usar timestamp se backend não retornar ID
        
        console.log('[CadastroLoja] 📋 fornecedor_id extraído:', fornecedor_id);
        
        // Criar objeto completo da loja
        const lojaCompleta = {
          id: fornecedor_id,
          fornecedor_id: fornecedor_id,
          nome: lojaData.nome,
          email: lojaData.email || user?.email,
          cnpj: lojaData.cnpj || '',
          telefone: lojaData.telefone || '',
          endereco: lojaData.endereco || '',
          status: 'Ativo',
          ...(response.loja || response.data || {})
        };
        
        console.log('[CadastroLoja] 🏪 Loja completa:', lojaCompleta);
        
        // Atualizar dados do usuário no localStorage
        const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
        
        const updatedUser = {
          ...currentUser,
          fornecedor_id: fornecedor_id,
          loja: lojaCompleta
        };
        
        localStorage.setItem('user', JSON.stringify(updatedUser));
        console.log('[CadastroLoja] 💾 Dados do usuário atualizados no localStorage:', updatedUser);
        
        // 🔐 CRÍTICO: Revalidar o token para forçar backend a retornar token atualizado com fornecedor_id
        let tokenAtualizado = false;
        try {
          const currentToken = localStorage.getItem('token');
          if (currentToken && !response.token) {
            console.log('[CadastroLoja] 🔄 Revalidando token para obter fornecedor_id atualizado...');
            const validationResponse = await validateToken(currentToken);
            
            if (validationResponse.valid && validationResponse.token) {
              console.log('[CadastroLoja] ✅ Novo token recebido da revalidação');
              localStorage.setItem('token', validationResponse.token);
              tokenAtualizado = true;
            } else if (validationResponse.valid && validationResponse.user?.fornecedor_id) {
              console.log('[CadastroLoja] ✅ Token revalidado com fornecedor_id:', validationResponse.user.fornecedor_id);
              // Atualizar user com dados atualizados
              const revalidatedUser = {
                ...updatedUser,
                ...validationResponse.user,
                loja: lojaCompleta
              };
              localStorage.setItem('user', JSON.stringify(revalidatedUser));
              tokenAtualizado = true;
            } else {
              console.warn('[CadastroLoja] ⚠️ Revalidação não retornou fornecedor_id. Forçando logout/login.');
            }
          } else if (response.token) {
            tokenAtualizado = true; // Backend já retornou token novo
          }
        } catch (revalidateError) {
          console.warn('[CadastroLoja] ⚠️ Erro ao revalidar token:', revalidateError);
        }
        
        // Mostrar mensagem de sucesso
        const successMessage = tokenAtualizado 
          ? '<i class="fas fa-check-circle"></i>Loja cadastrada com sucesso!'
          : '<i class="fas fa-check-circle"></i>Loja cadastrada! Faça logout e login para atualizar permissões.';
        
        const $success = $(`<div class="success-notification">${successMessage}</div>`);
        $('body').append($success);
        setTimeout(() => $success.addClass('show'), 100);
        
        setTimeout(() => {
          $success.remove();
          
          // Se onComplete existe (fluxo de registro), usar ele para continuar logado
          if (onComplete && typeof onComplete === 'function') {
            console.log('[CadastroLoja] ✅ Completando cadastro e mantendo usuário logado');
            console.log('[CadastroLoja] 📦 Enviando dados completos:', lojaCompleta);
            onComplete(lojaCompleta);
          } else {
            // Se não atualizou o token, forçar logout para relogar
            if (!tokenAtualizado) {
              console.log('[CadastroLoja] 🔄 Token não atualizado, forçando logout para nova autenticação');
              localStorage.removeItem('token');
              localStorage.removeItem('user');
              
              // Mostrar aviso antes de redirecionar
              const $warning = $('<div class="warning-notification"><i class="fas fa-info-circle"></i>Por favor, faça login novamente para ativar as permissões da sua loja.</div>');
              $('body').append($warning);
              setTimeout(() => $warning.addClass('show'), 100);
              
              setTimeout(() => {
                $warning.remove();
                navigate('/login');
              }, 2500);
            } else {
              // Token atualizado, navegar para minha-loja normalmente
              console.log('[CadastroLoja] 🏪 Navegando para minha loja');
              navigate('/minha-loja');
            }
          }
        }, 1500);
      } else {
        setError(response?.message || 'Erro ao cadastrar loja');
        $('.loja-form').addClass('error-shake');
        setTimeout(() => $('.loja-form').removeClass('error-shake'), 500);
      }
    } catch (err) {
      console.error('[CadastroLoja] Erro:', err);
      
      let errorMessage = '❌ Erro ao cadastrar loja. Tente novamente.';
      
      if (err.error) {
        errorMessage = err.error;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      // Se há detalhes específicos do erro de validação do backend
      if (err.details && err.details.errors) {
        const errors = err.details.errors;
        const errorList = Object.values(errors).join(', ');
        errorMessage = `📝 Campos obrigatórios: ${errorList}`;
      }

      // Tratamento específico para erros comuns do backend
      if (err.response?.data?.message) {
        const backendMessage = err.response.data.message;
        if (backendMessage.includes('already exists') || backendMessage.includes('já cadastrado')) {
          errorMessage = '⚠️ Esta loja já está cadastrada no sistema';
        } else if (backendMessage.includes('invalid') || backendMessage.includes('inválido')) {
          errorMessage = '❌ Dados inválidos. Verifique os campos preenchidos';
        } else if (backendMessage.includes('permission') || backendMessage.includes('permissão')) {
          errorMessage = '🚫 Você não tem permissão para cadastrar uma loja';
        } else {
          errorMessage = `⚠️ ${backendMessage}`;
        }
      }
      
      setError(errorMessage);
      $('.loja-form').addClass('error-shake');
      setTimeout(() => $('.loja-form').removeClass('error-shake'), 500);
    } finally {
      // Cleanup: se salvamos um token temporário e houve sucesso, manter o token
      // Se houve erro, remover o token temporário se não existia antes
      if (token && tokenOriginal === null) {
        const tokenAtual = localStorage.getItem('token');
        if (tokenAtual === token) {
          if (!error) {
            console.log('[CadastroLoja] 🔐 Mantendo token salvo - loja criada com sucesso');
            // Token permanece salvo permanentemente
          } else {
            console.log('[CadastroLoja] 🧹 Removendo token temporário devido ao erro');
            localStorage.removeItem('token');
          }
        }
      }
      
      setLoading(false);
      $('.submit-btn').removeClass('loading');
    }
  };

  return (
    <div className="cadastro-loja-container">
      <div className="cadastro-loja-card">
        <div className="cadastro-header">
          <h2>
            <i className="fas fa-store"></i>
            Cadastrar Loja
          </h2>
          <p>Bem-vindo, <strong>{user?.nome}</strong>! Preencha os dados básicos da sua loja.</p>
        </div>

        <form className="loja-form" onSubmit={handleSubmit}>
          {error && (
            <div className="error-message">
              <i className="fas fa-exclamation-triangle"></i>
              {error}
            </div>
          )}

          <div className="form-step">
            <h3><i className="fas fa-store"></i> Dados da Loja</h3>
            
            <div className="form-group">
              <label htmlFor="nome">
                <i className="fas fa-store"></i>
                Nome da Loja <span className="required">*</span>
              </label>
              <input
                className="form-control"
                type="text"
                id="nome"
                name="nome"
                value={formData.nome}
                onChange={handleChange}
                placeholder="Digite o nome da sua loja"
                required
                autoFocus
              />
              <small className="field-hint">Este será o nome visível para seus clientes</small>
            </div>

            <div className="form-group">
              <label htmlFor="email">
                <i className="fas fa-envelope"></i>
                Email da Loja
              </label>
              <input
                className="form-control"
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder={user?.email || 'email@exemplo.com'}
              />
              <small className="field-hint">Se vazio, usará seu email: {user?.email}</small>
            </div>

            <div className="form-group">
              <label htmlFor="cnpj">
                <i className="fas fa-id-card"></i>
                CNPJ
              </label>
              <input
                className="form-control"
                type="text"
                id="cnpj"
                name="cnpj"
                value={formData.cnpj}
                onChange={handleChange}
                placeholder="00.000.000/0000-00"
                maxLength="18"
              />
              <small className="field-hint">Formatação automática</small>
            </div>

            <div className="form-group">
              <label htmlFor="telefone">
                <i className="fas fa-phone"></i>
                Telefone de Contato
              </label>
              <input
                className="form-control"
                type="tel"
                id="telefone"
                name="telefone"
                value={formData.telefone}
                onChange={handleChange}
                placeholder="(11) 99999-9999"
                maxLength="15"
              />
            </div>

            <div className="form-group">
              <label htmlFor="endereco">
                <i className="fas fa-map-marker-alt"></i>
                Endereço
              </label>
              <input
                className="form-control"
                type="text"
                id="endereco"
                name="endereco"
                value={formData.endereco}
                onChange={handleChange}
                placeholder="Av. Paulista, 1000, São Paulo-SP"
              />
              <small className="field-hint">Endereço completo da loja</small>
            </div>
          </div>

          <div className="form-buttons">
            <button 
              type="submit" 
              className="btn btn-primary submit-btn"
              disabled={loading}
            >
              {loading ? (
                <><i className="fas fa-spinner fa-spin"></i> Cadastrando Loja...</>
              ) : (
                <><i className="fas fa-store"></i> Cadastrar Loja</>
              )}
            </button>
            
            {onSkip && (
              <button 
                type="button" 
                className="btn btn-secondary"
                onClick={onSkip}
                disabled={loading}
              >
                <i className="fas fa-clock"></i>
                Pular por Agora
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default CadastroLoja;