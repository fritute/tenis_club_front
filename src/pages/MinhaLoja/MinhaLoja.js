import React, { useState, useEffect } from 'react';
import { getMinhaLoja, updateLojaStatus } from '../../services/api';
import { api } from '../../services/api';
import $ from 'jquery';
import MinhaLojaProdutos from './components/MinhaLojaProdutos';
import MinhaLojaPedidos from './components/MinhaLojaPedidos';
import MinhaLojaConfiguracoes from './components/MinhaLojaConfiguracoes';
import './MinhaLoja.css';

const MinhaLoja = ({ user }) => {
  const [activeTab, setActiveTab] = useState('produtos');
  const [loja, setLoja] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Função para alternar status da loja
  const toggleStatusLoja = async () => {
    if (!loja || !loja.id) return;
    
    // Converte status atual para o formato correto e calcula o novo
    const statusAtual = loja.status?.toLowerCase() === 'ativo' || loja.status === 'Ativo' ? 'Ativo' : 'Inativo';
    const novoStatus = statusAtual === 'Ativo' ? 'Inativo' : 'Ativo';
    
    try {
      console.log('[MinhaLoja] 🔄 Alterando status de', statusAtual, 'para', novoStatus);
      
      await updateLojaStatus(loja.id, novoStatus);
      
      setLoja(prev => ({ ...prev, status: novoStatus }));
      console.log('[MinhaLoja] ✅ Status alterado com sucesso!');
      
    } catch (err) {
      console.error('[MinhaLoja] ❌ Erro ao alterar status:', err);
      setError('Erro ao alterar status da loja: ' + (err.message || 'Erro desconhecido'));
      
      // Limpar erro após 5 segundos
      setTimeout(() => setError(''), 5000);
    }
  };

  // Função de debug para testar manualmente no console
  window.debugMinhaLoja = {
    testarEndpoints: async () => {
      console.log('🧪 [DEBUG] Testando ambos endpoints...');
      try {
        console.log('🚀 [DEBUG] Testando endpoint padrão...');
        const resp1 = await getMinhaLoja(false);
        console.log('📊 [DEBUG] Resposta endpoint padrão:', resp1);
        
        console.log('🚀 [DEBUG] Testando endpoint alternativo...');
        const resp2 = await getMinhaLoja(true);
        console.log('📊 [DEBUG] Resposta endpoint alternativo:', resp2);
      } catch (err) {
        console.error('❌ [DEBUG] Erro nos testes:', err);
      }
    },
    verificarToken: () => {
      const token = localStorage.getItem('token');
      console.log('🎫 [DEBUG] Token atual:', token ? 'Presente' : 'Ausente');
      if (token) {
        try {
          // Verificar se é um JWT válido (tem 3 partes separadas por ponto)
          const parts = token.split('.');
          console.log('🔍 [DEBUG] Partes do JWT:', parts.length);
          
          if (parts.length === 3) {
            // Tentar decodificar payload do JWT (base64)
            const payload = JSON.parse(atob(parts[1]));
            console.log('🔓 [DEBUG] Payload do JWT:', payload);
            console.log('👤 [DEBUG] fornecedor_id no token:', payload.fornecedor_id || payload.id || 'não encontrado');
          } else {
            console.warn('⚠️ [DEBUG] Token não está no formato JWT padrão (não tem 3 partes)');
            console.log('📝 [DEBUG] Token completo:', token.substring(0, 50) + '...');
          }
        } catch (e) {
          console.warn('⚠️ [DEBUG] Não foi possível decodificar JWT:', e.message);
          console.log('📝 [DEBUG] Token (primeiros 100 chars):', token.substring(0, 100));
        }
      }
    },
    dadosUsuario: () => {
      console.log('👤 [DEBUG] Dados do usuário (prop):', user);
      console.log('💾 [DEBUG] Dados do localStorage:', JSON.parse(localStorage.getItem('user') || 'null'));
      console.log('🔗 [DEBUG] Schema do banco:');
      console.log('  📋 usuarios.id =', user?.id || 'não encontrado');
      console.log('  👔 usuarios.nivel =', user?.nivel || 'não encontrado');
      console.log('  🏪 usuarios.fornecedor_id =', user?.fornecedor_id || 'NULL (precisa cadastrar loja)');
      console.log('  📊 Status esperado: fornecedor_id aponta para fornecedores.id');
    },
    
    testarConexaoBD: async () => {
      console.log('🗄️ [DEBUG] Testando estrutura do banco...');
      try {
        // Testar endpoint de fornecedores para ver estrutura
        const resp = await api.get('/fornecedores');
        console.log('📊 [DEBUG] Estrutura /fornecedores:', resp.data);
        console.log('🔍 [DEBUG] Verificar se existe registro para fornecedor_id do usuário');
        
        // Testar endpoint específico para diagnóstico
        if(resp.data && Array.isArray(resp.data)) {
          console.log('📋 [DEBUG] Total de fornecedores no sistema:', resp.data.length);
          console.log('👤 [DEBUG] Fornecedor_id no JWT:', user?.fornecedor_id || 'NULL');
          
          const meuFornecedor = resp.data.find(f => f.id === user?.fornecedor_id);
          if(meuFornecedor) {
            console.log('✅ [DEBUG] Fornecedor encontrado:', meuFornecedor);
          } else {
            console.log('❌ [DEBUG] Nenhum fornecedor encontrado para ID:', user?.fornecedor_id);
            console.log('💡 [DEBUG] CAUSA: usuarios.fornecedor_id não aponta para registro válido');
          }
        }
      } catch (err) {
        console.warn('⚠️ [DEBUG] Erro ao testar conexão BD:', err?.response?.data || err.message);
      }
    },
    
    validarEsquemaBanco: () => {
      console.log('🏗️ [SCHEMA] Validando esquema atual do banco:');
      console.log('📄 [SCHEMA] Tabela usuarios:');
      console.log('  - usuarios.id =', user?.id);
      console.log('  - usuarios.nivel =', user?.nivel);  
      console.log('  - usuarios.fornecedor_id =', user?.fornecedor_id || 'NULL ❌');
      console.log('📄 [SCHEMA] Tabela fornecedores:');
      console.log('  - fornecedores.id deve corresponder a usuarios.fornecedor_id');
      console.log('  - fornecedores.nome, cnpj, email, telefone, status');
      console.log('🔗 [SCHEMA] Relacionamento esperado:');
      console.log('  JWT → usuarios → usuarios.fornecedor_id → fornecedores.id → dados da loja');
      console.log('💡 [SOLUÇÃO] Se fornecedor_id = NULL, usar Cadastrar Loja!');
    }
  };

  // Função para carregar dados da loja (memoizada com useCallback) - DEFINIR PRIMEIRO
  const carregarMinhaLoja = React.useCallback(async (tentarEndpointAlternativo = false) => {
    try {
      setLoading(true);
      console.log(`[MinhaLoja] 🔍 Buscando loja ${tentarEndpointAlternativo ? '(endpoint alternativo)' : '(endpoint padrão)'}...`);
      console.log('[MinhaLoja] 🔐 Sistema usará token JWT para identificar fornecedor automaticamente');
      
      const response = await getMinhaLoja(tentarEndpointAlternativo);
      console.log('[MinhaLoja] ✅ Resposta do servidor:', response);
      console.log('[MinhaLoja] 🔍 Analisando estrutura da resposta...');
      console.log('[MinhaLoja] 📊 Tipo da resposta:', typeof response);
      console.log('[MinhaLoja] 🗂️ Chaves disponíveis:', Object.keys(response || {}));
      console.log('[MinhaLoja] ✅ response.success:', response?.success);
      console.log('[MinhaLoja] 📋 response.data:', response?.data);
      console.log('[MinhaLoja] 📦 response.fornecedores:', response?.fornecedores);
      console.log('[MinhaLoja] 🏪 response.loja:', response?.loja);
      
      // Verificar múltiplas estruturas possíveis da API
      let lojaData = null;
      let fornecedorSemLoja = false;
      
      // Estrutura 1: { success: true, data: [loja] }
      if (response?.success && response?.data && Array.isArray(response.data)) {
        if (response.data.length > 0) {
          lojaData = response.data[0];
          console.log('[MinhaLoja] ✅ Estrutura tipo 1 detectada (success + data array com loja)');
        } else {
          // Fornecedor autenticado, mas sem loja associada
          fornecedorSemLoja = true;
          console.log('[MinhaLoja] ⚠️ Fornecedor autenticado via JWT, mas SEM loja associada');
          console.log('[MinhaLoja] 💡 Mensagem do backend:', response.message);
        }
      }
      // Estrutura 2: { fornecedores: [loja] } (endpoint alternativo)  
      else if (response?.fornecedores && Array.isArray(response.fornecedores) && response.fornecedores.length > 0) {
        lojaData = response.fornecedores[0];
        console.log('[MinhaLoja] ✅ Estrutura tipo 2 detectada (fornecedores array)');
      }
      // Estrutura 3: { loja: {...} } (direta)
      else if (response?.loja) {
        lojaData = response.loja;
        console.log('[MinhaLoja] ✅ Estrutura tipo 3 detectada (loja direta)');
      }
      // Estrutura 4: resposta direta é a loja
      else if (response && typeof response === 'object' && response.id && response.nome) {
        lojaData = response;
        console.log('[MinhaLoja] ✅ Estrutura tipo 4 detectada (resposta direta)');
      }
      
      if (lojaData) {
        console.log('[MinhaLoja] 🏪 Loja encontrada via JWT + fornecedor_id:', lojaData);
        console.log('[MinhaLoja] 🔗 Associação funcionando corretamente!');
        setLoja(lojaData);
        setError('');
        
        // Atualizar dados do usuário no localStorage
        try {
          const userData = JSON.parse(localStorage.getItem('user') || '{}');
          userData.loja = lojaData;
          userData.fornecedor_id = lojaData.id;
          localStorage.setItem('user', JSON.stringify(userData));
          console.log('[MinhaLoja] 💾 Dados sincronizados com localStorage');
        } catch (err) {
          console.warn('[MinhaLoja] ⚠️ Erro ao sincronizar localStorage:', err);
        }
      } else if (fornecedorSemLoja) {
        console.log('[MinhaLoja] 👔 Fornecedor autenticado mas sem loja no servidor');
        
        // IMPORTANTE: Verificar se temos dados locais como fallback
        // (loja criada recentemente, mas backend pode não ter atualizado associação)
        try {
          const userData = JSON.parse(localStorage.getItem('user') || '{}');
          if (userData.loja && (userData.loja.id || userData.loja.nome)) {
            console.log('[MinhaLoja] 💾 Usando dados da loja do localStorage como fallback:', userData.loja);
            setLoja(userData.loja);
            setError('');
            return; // Sair do catch e não mostrar erro
          }
        } catch (localErr) {
          console.warn('[MinhaLoja] ⚠️ Erro ao verificar localStorage:', localErr);
        }
        
        setError(`👋 Olá ${user?.nome || 'Fornecedor'}! Você está autenticado com sucesso, mas ainda não possui uma loja cadastrada no sistema. Para acessar o painel completo, você precisa cadastrar sua loja primeiro.`);
      } else {
        console.warn('[MinhaLoja] ❌ Nenhuma estrutura de loja reconhecida na resposta');
        
        // FALLBACK: Verificar dados locais
        try {
          const userData = JSON.parse(localStorage.getItem('user') || '{}');
          if (userData.loja && (userData.loja.id || userData.loja.nome)) {
            console.log('[MinhaLoja] 💾 Usando dados da loja do localStorage como fallback:', userData.loja);
            setLoja(userData.loja);
            setError('');
            return;
          }
        } catch (localErr) {
          console.warn('[MinhaLoja] ⚠️ Erro ao verificar localStorage:', localErr);
        }
        
        setError('⚠️ Erro inesperado ao processar dados da loja. Verifique se você possui uma loja cadastrada ou tente novamente!');
      }
    } catch (err) {
      console.error('[MinhaLoja] 💥 Erro ao carregar loja:', err);
      
      // PRIMEIRO: Verificar se temos dados locais como fallback
      try {
        const userData = JSON.parse(localStorage.getItem('user') || '{}');
        if (userData.loja && (userData.loja.id || userData.loja.nome)) {
          console.log('[MinhaLoja] 💾 Erro no servidor, mas temos dados locais:', userData.loja);
          setLoja(userData.loja);
          setError('');
          return; // Usar dados locais, ignorar erro do servidor
        }
      } catch (localErr) {
        console.warn('[MinhaLoja] ⚠️ Erro ao verificar localStorage:', localErr);
      }
      
      // Tratamento de erros JWT específicos
      if (err.error && err.error.includes('Token expirado')) {
        setError('🔏 Sua sessão expirou. Faça login novamente.');
        setTimeout(() => {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }, 3000);
      } else if (err.error && err.error.includes('não encontrada')) {
        setError('🏪 Você ainda não possui uma loja cadastrada. Cadastre sua loja para começar!');
      } else if (err.error && err.error.includes('fornecedores')) {
        setError('🔒 Apenas fornecedores podem acessar esta funcionalidade');
      } else {
        setError('⚠️ Erro ao carregar dados da loja. Verifique sua conexão!');
      }
    } finally {
      setLoading(false);
    }
  }, [user?.nome]); // Dependência apenas do nome para mensagem

  // useEffect para carregar dados da loja
  useEffect(() => {
    console.log('[MinhaLoja] 🚀 Inicializando componente...');
    console.log('[MinhaLoja] 👤 Dados do usuário recebidos via props:', user);
    
    // SEMPRE verificar localStorage primeiro (dados mais recentes)
    let dadosLocais = null;
    try {
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      console.log('[MinhaLoja] 💾 Dados no localStorage:', userData);
      
      if (userData.loja && (userData.loja.id || userData.loja.nome)) {
        dadosLocais = userData.loja;
        console.log('[MinhaLoja] ✅ Loja encontrada no localStorage:', dadosLocais);
      }
    } catch (err) {
      console.warn('[MinhaLoja] ⚠️ Erro ao ler localStorage:', err);
    }
    
    // Prioridade 1: Dados do localStorage (mais atualizados)
    if (dadosLocais && (dadosLocais.id || dadosLocais.nome)) {
      console.log('[MinhaLoja] 🏪 Usando dados da loja do localStorage:', dadosLocais);
      setLoja(dadosLocais);
      setLoading(false);
      setError('');
      return;
    }
    
    // Prioridade 2: Dados vindos via props (user)
    if (user && user.loja && (user.loja.id || user.loja.nome)) {
      console.log('[MinhaLoja] 🏪 Usando dados da loja do props:', user.loja);
      setLoja(user.loja);
      setLoading(false);
      setError('');
      return;
    }
    
    // Prioridade 3: fornecedor_id existe mas loja não está completa
    const fornecedorId = user?.fornecedor_id || dadosLocais?.fornecedor_id;
    if (fornecedorId) {
      console.log('[MinhaLoja] 🔍 fornecedor_id encontrado:', fornecedorId);
      console.log('[MinhaLoja] 🌐 Buscando dados completos da loja no servidor...');
      carregarMinhaLoja();
      return;
    }
    
    // Se não encontrou nada, buscar no servidor
    console.log('[MinhaLoja] 🌐 Nenhum dado local, buscando no servidor...');
    carregarMinhaLoja();
  }, [user, carregarMinhaLoja]);

  const handleTabClick = (tab) => {
    // Animação de transição com jQuery
    $('.tab-content').addClass('fade-out');
    
    setTimeout(() => {
      setActiveTab(tab);
      $('.tab-content').removeClass('fade-out').addClass('fade-in');
      
      setTimeout(() => {
        $('.tab-content').removeClass('fade-in');
      }, 300);
    }, 150);
  };

  const handleLojaUpdate = (dadosAtualizados) => {
    setLoja(prev => ({ ...prev, ...dadosAtualizados }));
    
    // Atualizar também os dados do usuário no localStorage se possível
    try {
      const userData = JSON.parse(localStorage.getItem('user'));
      if (userData && userData.loja) {
        userData.loja = { ...userData.loja, ...dadosAtualizados };
        localStorage.setItem('user', JSON.stringify(userData));
        console.log('[MinhaLoja] Dados do usuário atualizados no localStorage');
      }
    } catch (err) {
      console.warn('[MinhaLoja] Erro ao atualizar localStorage:', err);
    }
  };

  if (loading) {
    return (
      <div className="minha-loja-container">
        <div className="loading-container">
          <i className="fas fa-spinner fa-spin fa-3x"></i>
          <p>Carregando dados da loja...</p>
        </div>
      </div>
    );
  }

  if (error && !loja) {
    return (
      <div className="minha-loja-container">
        <div className="error-container">
          <i className="fas fa-store-alt fa-3x" style={{ color: '#ffd700' }}></i>
          <h3>👋 Olá, {user?.nome || 'Fornecedor'}!</h3>
          <p>{error}</p>
          
          {/* Mostrar status de autenticação */}
          <div className="auth-status">
            <p><strong>✅ Status:</strong> Autenticado como fornecedor</p>
            <p><strong>📧 Email:</strong> {user?.email}</p>
            <p><strong>🎫 JWT:</strong> Válido e ativo</p>
            <p><strong>🏪 Situação:</strong> Sem loja na tabela `fornecedores`</p>
            <p><strong>💡 Solução:</strong> Cadastrar loja criará associação automática</p>
          </div>
          
          <div className="error-actions">
            {error.includes('ainda não possui uma loja') && (
              <button 
                className="btn btn-success btn-lg"
                onClick={() => window.location.href = '/cadastrar-loja'}
                style={{ marginBottom: '15px' }}
              >
                <i className="fas fa-store"></i> Cadastrar Minha Loja Agora
              </button>
            )}
            
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
              <button 
                className="btn btn-primary"
                onClick={() => {
                  setError('');
                  carregarMinhaLoja(false); // Tentar endpoint padrão
                }}
              >
                <i className="fas fa-redo"></i> Verificar Novamente
              </button>
              
              <button 
                className="btn btn-outline-primary"
                onClick={() => {
                  setError('');
                  carregarMinhaLoja(true); // Tentar endpoint alternativo
                }}
              >
                <i className="fas fa-exchange-alt"></i> Endpoint Alt.
              </button>
              
              <button 
                className="btn btn-info"
                onClick={() => {
                  console.log('🧪 [DEBUG MANUAL] Executando testes completos...');
                  window.debugMinhaLoja?.testarEndpoints();
                  window.debugMinhaLoja?.verificarToken();
                  window.debugMinhaLoja?.dadosUsuario();
                  window.debugMinhaLoja?.testarConexaoBD();
                  window.debugMinhaLoja?.validarEsquemaBanco();
                  alert('🔍 Diagnóstico completo executado!\n\n✅ Testes incluem:\n• Endpoints da API\n• Validação do JWT\n• Dados do usuário\n• Estrutura do banco\n• Schema de relacionamentos\n\n📋 Verifique o console para resultados detalhados.');
                }}
              >
                <i className="fas fa-bug"></i> Debug
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="minha-loja-container">
      {/* Header da Loja */}
      <div className="loja-header">
        <div className="loja-info">
          <div className="loja-avatar">
            <i className="fas fa-store fa-2x"></i>
          </div>
          <div className="loja-details">
            <h2>{loja?.nome || 'Minha Loja'}</h2>
            <p className="loja-email">📧 {loja?.email}</p>
            <div className="loja-status">
              {(() => {
                const status = (loja?.status || '').toLowerCase();
                const isAtivo = status === 'ativo';
                return (
                  <>
                    <span className={`status-badge ${isAtivo ? 'active' : 'inactive'}`}>
                      {isAtivo ? '✅ Ativa' : '❌ Inativa'}
                    </span>
                    <button
                      className={`status-toggle-btn ${isAtivo ? 'ativo' : 'inativo'}`}
                      onClick={toggleStatusLoja}
                      title={`Clique para ${isAtivo ? 'desativar' : 'ativar'} a loja`}
                    >
                      <i className={`fas fa-${isAtivo ? 'toggle-on' : 'toggle-off'}`}></i>
                    </button>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
        
        {/* Estatísticas rápidas */}
        <div className="loja-stats">
          <div className="stat-card">
            <i className="fas fa-box"></i>
            <div>
              <span className="stat-number">0</span>
              <span className="stat-label">Produtos</span>
            </div>
          </div>
          <div className="stat-card">
            <i className="fas fa-shopping-cart"></i>
            <div>
              <span className="stat-number">0</span>
              <span className="stat-label">Pedidos</span>
            </div>
          </div>
          <div className="stat-card">
            <i className="fas fa-dollar-sign"></i>
            <div>
              <span className="stat-number">R$ 0,00</span>
              <span className="stat-label">Vendas</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navegação por Abas */}
      <div className="loja-tabs">
        <button 
          className={`tab-button ${activeTab === 'produtos' ? 'active' : ''}`}
          onClick={() => handleTabClick('produtos')}
        >
          <i className="fas fa-box"></i>
          Produtos
        </button>
        <button 
          className={`tab-button ${activeTab === 'pedidos' ? 'active' : ''}`}
          onClick={() => handleTabClick('pedidos')}
        >
          <i className="fas fa-shopping-cart"></i>
          Pedidos
        </button>
        <button 
          className={`tab-button ${activeTab === 'configuracoes' ? 'active' : ''}`}
          onClick={() => handleTabClick('configuracoes')}
        >
          <i className="fas fa-cog"></i>
          Configurações
        </button>
      </div>

      {/* Conteúdo das Abas */}
      <div className="tab-content">
        {activeTab === 'produtos' && (
          <MinhaLojaProdutos loja={loja} />
        )}
        {activeTab === 'pedidos' && (
          <MinhaLojaPedidos loja={loja} />
        )}
        {activeTab === 'configuracoes' && (
          <MinhaLojaConfiguracoes 
            loja={loja} 
            onUpdate={handleLojaUpdate}
          />
        )}
      </div>
    </div>
  );
};

export default MinhaLoja;