import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

// Services
import { validateToken, getMinhaLoja } from './services/api';

// Components
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import CadastroLoja from './components/Auth/CadastroLoja';
import Dashboard from './components/Dashboard/Dashboard';
import Layout from './components/Layout/Layout';

// Pages
import Fornecedores from './pages/Fornecedores/Fornecedores';
import Produtos from './pages/Produtos/Produtos';
import Categorias from './pages/Categorias/Categorias';
import Pedidos from './pages/Pedidos/Pedidos';
import Relatorios from './pages/Relatorios/Relatorios';
import MinhaLoja from './pages/MinhaLoja/MinhaLoja';
import VinculoProdutos from './pages/VinculoProdutos/VinculoProdutos';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showRegister, setShowRegister] = useState(false);
  const [showCadastroLoja, setShowCadastroLoja] = useState(false);
  const [pendingUserData, setPendingUserData] = useState(null);
  const [pendingToken, setPendingToken] = useState(null);

  useEffect(() => {
    // Timeout de segurança para evitar loading eterno
    const safetyTimer = setTimeout(() => {
      console.warn('[App] ⚠️ Timeout de segurança ativado - forçando fim do loading');
      setLoading(false);
    }, 5000); // 5 segundos de limite máximo para loading

    checkAuth().finally(() => {
      clearTimeout(safetyTimer);
    });
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('token');
    const savedUserStr = localStorage.getItem('user');
    
    console.log('[App] 🔍 Verificando autenticação...');
    console.log('[App] 🎫 Token encontrado:', token ? 'Sim (JWT)' : 'Não');
    
    // Carregar dados salvos do localStorage como backup
    let savedUser = null;
    try {
      savedUser = savedUserStr ? JSON.parse(savedUserStr) : null;
      console.log('[App] 💾 Dados salvos do usuário:', savedUser);
    } catch (e) {
      console.log('[App] ⚠️ Erro ao parsear dados salvos');
    }
    
    if (!token) {
      console.log('[App] ❌ Sem token, usuário não autenticado');
      setLoading(false);
      return;
    }

    try {
      console.log('[App] 🔐 Validando token JWT com backend...');
      const response = await validateToken(token);
      console.log('[App] ✅ Resposta da validação:', response);
      
      if (response.valid) {
        console.log('[App] 🎯 Token JWT válido! Usuário:', response.user);
        console.log('[App] 🏪 Fornecedor_id extraído do token automaticamente');
        
        // IMPORTANTE: Mesclar dados do backend com dados salvos para preservar nível e loja
        let userData = {
          ...savedUser,           // Dados salvos (inclui nível e loja)
          ...response.user,       // Dados do token (atualiza o que o backend retornar)
        };
        
        // Se o backend não retornou nível, usar o salvo
        if (!userData.nivel && savedUser?.nivel) {
          console.log('[App] 🔄 Usando nível salvo:', savedUser.nivel);
          userData.nivel = savedUser.nivel;
        }
        
        // Se o backend não retornou loja, usar a salva
        if (!userData.loja && savedUser?.loja) {
          console.log('[App] 🔄 Usando loja salva:', savedUser.loja);
          userData.loja = savedUser.loja;
        }
        
        console.log('[App] 📊 Nível do usuário:', userData.nivel);
        
        // Para fornecedores, buscar dados da loja automaticamente (se não tiver nos dados salvos)
        if (userData.nivel?.toLowerCase() === 'fornecedor' && !userData.loja) {
          console.log('[App] 👔 Usuário é fornecedor, buscando dados da loja...');
          try {
            const lojaResponse = await getMinhaLoja();
            console.log('[App] 🏪 Resposta da loja:', lojaResponse);
            
            // Extrair dados da loja da resposta
            const lojaData = lojaResponse?.data || lojaResponse?.loja || lojaResponse;
            
            if (lojaData && (lojaData.id || lojaData.nome)) {
              console.log('[App] ✅ Loja encontrada:', lojaData);
              userData = { ...userData, loja: lojaData };
            } else {
              console.log('[App] ⚠️ Fornecedor sem loja cadastrada ainda');
            }
          } catch (lojaError) {
            console.log('[App] ⚠️ Erro ao buscar loja (pode não existir ainda):', lojaError.message);
          }
        }
        
        console.log('[App] ✅ Dados finais do usuário:', userData);
        setIsAuthenticated(true);
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
      } else {
        console.warn('[App] ❌ Token JWT inválido ou expirado, limpando dados');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    } catch (error) {
      console.error('[App] 💥 Erro ao validar token JWT:', error);
      
      // FALLBACK: Se o backend falhou mas tem dados salvos válidos, usar eles
      if (savedUser && savedUser.nivel) {
        console.log('[App] 🔄 Usando dados salvos como fallback');
        setIsAuthenticated(true);
        setUser(savedUser);
      } else {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (userData, token) => {
    console.log('[App] Login bem-sucedido!');
    console.log('[App] Token recebido:', token);
    console.log('[App] Dados do usuário:', userData);
    
    if (!userData) {
      console.error('[App] ERRO: userData é undefined ou null!');
      console.error('[App] O componente Login passou dados inválidos');
      return;
    }
    
    if (!token) {
      console.error('[App] ERRO: token é undefined ou null!');
      return;
    }
    
    // Salvar token primeiro (necessário para buscar loja)
    localStorage.setItem('token', token);
    
    let finalUserData = userData;
    
    // Se o usuário for fornecedor e não tem loja nos dados, buscar
    if (userData?.nivel?.toLowerCase() === 'fornecedor' && !userData.loja) {
      console.log('[App] 👔 Fornecedor logando, buscando dados da loja...');
      try {
        const lojaResponse = await getMinhaLoja();
        console.log('[App] 🏪 Resposta da loja:', lojaResponse);
        
        const lojaData = lojaResponse?.data || lojaResponse?.loja || lojaResponse;
        
        if (lojaData && (lojaData.id || lojaData.nome)) {
          console.log('[App] ✅ Loja encontrada:', lojaData);
          finalUserData = { ...userData, loja: lojaData };
        } else {
          console.log('[App] ⚠️ Fornecedor sem loja cadastrada');
        }
      } catch (lojaError) {
        console.log('[App] ⚠️ Erro ao buscar loja:', lojaError.message);
      }
    }
    
    localStorage.setItem('user', JSON.stringify(finalUserData));
    setUser(finalUserData);
    setIsAuthenticated(true);
    setShowRegister(false);
    setShowCadastroLoja(false);
    
    console.log('[App] Token salvo no localStorage');
    console.log('[App] Dados salvos:', {
      token: localStorage.getItem('token'),
      user: localStorage.getItem('user')
    });
  };

  const handleRegisterSuccess = (userData, authToken, tipoUsuario) => {
    console.log('[App] Cadastro bem-sucedido!');
    console.log('[App] Tipo de usuário:', tipoUsuario);
    console.log('[App] Dados do usuário:', userData);
    
    if (tipoUsuario === 'fornecedor') {
      // Para fornecedores, guardar dados temporariamente e mostrar cadastro da loja
      setPendingUserData(userData);
      setPendingToken(authToken);
      setShowRegister(false);
      setShowCadastroLoja(true);
    } else {
      // Para usuários comuns, fazer login diretamente
      handleLogin(userData, authToken);
    }
  };
  
  const handleCadastroLojaComplete = (lojaData) => {
    console.log('[App] 🏪 Cadastro da loja concluído:', lojaData);
    
    // Buscar dados atuais do localStorage (que foram atualizados pelo CadastroLoja)
    const currentUserData = JSON.parse(localStorage.getItem('user') || '{}');
    console.log('[App] 📋 Dados atuais no localStorage:', currentUserData);
    
    // Criar usuário completo com TODOS os dados necessários
    const userWithLoja = {
      ...pendingUserData, // Dados originais do usuário
      ...currentUserData, // Dados atualizados (incluindo fornecedor_id)
      loja: lojaData, // Dados da loja recém-criada
      fornecedor_id: lojaData.id || lojaData.fornecedor_id || currentUserData.fornecedor_id // Garantir fornecedor_id
    };
    
    console.log('[App] 💾 Usuário final com loja:', userWithLoja);
    
    // Salvar no localStorage
    localStorage.setItem('user', JSON.stringify(userWithLoja));
    
    // Atualizar estado do App diretamente (sem fazer login novamente)
    setUser(userWithLoja);
    setIsAuthenticated(true);
    
    // Limpar dados temporários
    setPendingUserData(null);
    setPendingToken(null);
    setShowCadastroLoja(false);
    
    console.log('[App] ✅ Usuário logado com loja associada!');
  };
  
  const handleSkipCadastroLoja = () => {
    console.log('[App] Pulando cadastro da loja');
    handleLogin(pendingUserData, pendingToken);
    
    // Limpar dados temporários
    setPendingUserData(null);
    setPendingToken(null);
  };

  const showRegisterForm = () => {
    setShowRegister(true);
    setShowCadastroLoja(false);
  };
  
  const backToLogin = () => {
    setShowRegister(false);
    setShowCadastroLoja(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setIsAuthenticated(false);
  };

  // O Router deve envolver toda a aplicação para evitar erros de useNavigate
  return (
    <Router>
      {loading ? (
        <div className="loading-screen">
          <div className="loading-content">
            <div className="spinner"></div>
            <h2>Virtual Market</h2>
            <p>Carregando...</p>
          </div>
        </div>
      ) : showCadastroLoja && pendingUserData ? (
        <CadastroLoja 
          user={pendingUserData}
          token={pendingToken}
          onComplete={handleCadastroLojaComplete}
          onSkip={handleSkipCadastroLoja}
        />
      ) : showRegister ? (
        <Register 
          onRegisterSuccess={handleRegisterSuccess}
          onBackToLogin={backToLogin}
        />
      ) : (
      <div className="App">
        {!isAuthenticated ? (
          <Routes>
            <Route path="/login" element={<Login onLogin={handleLogin} onShowRegister={showRegisterForm} />} />
            <Route path="*" element={<Navigate to="/login" />} />
          </Routes>
        ) : (
          <Layout user={user} onLogout={handleLogout}>
            <Routes>
              <Route path="/" element={<Dashboard user={user} />} />
              <Route path="/fornecedores" element={<Fornecedores user={user} />} />
              <Route path="/produtos" element={<Produtos user={user} />} />
              <Route path="/categorias" element={<Categorias user={user} />} />
              <Route path="/pedidos" element={<Pedidos user={user} />} />
              <Route path="/relatorios" element={<Relatorios user={user} />} />
              <Route path="/minha-loja" element={<MinhaLoja user={user} />} />
              <Route path="/vinculos-produtos" element={<VinculoProdutos user={user} />} />
              <Route path="/cadastrar-loja" element={
                <CadastroLoja 
                  user={user} 
                  onComplete={(lojaData) => {
                    console.log('[App] 🏪 Loja cadastrada para usuário já logado:', lojaData);
                    
                    // Atualizar estado do usuário com a nova loja
                    const updatedUser = {
                      ...user,
                      fornecedor_id: lojaData.id || lojaData.fornecedor_id,
                      loja: lojaData
                    };
                    setUser(updatedUser);
                    localStorage.setItem('user', JSON.stringify(updatedUser));
                    
                    console.log('[App] ✅ Estado do usuário atualizado:', updatedUser);
                    
                    // Se a resposta incluiu novo token, já foi salvo no CadastroLoja
                    // Forçar revalidação do token para pegar fornecedor_id atualizado
                    setTimeout(async () => {
                      try {
                        const token = localStorage.getItem('token');
                        if (token) {
                          console.log('[App] 🔄 Revalidando token após cadastro da loja...');
                          const response = await validateToken(token);
                          if (response.valid && response.user) {
                            const finalUser = { 
                              ...response.user, 
                              loja: lojaData,
                              fornecedor_id: response.user.fornecedor_id || lojaData.id
                            };
                            setUser(finalUser);
                            localStorage.setItem('user', JSON.stringify(finalUser));
                            console.log('[App] ✅ Usuário final sincronizado:', finalUser);
                          }
                        }
                      } catch (err) {
                        console.warn('[App] ⚠️ Erro ao revalidar:', err);
                      }
                    }, 500);
                  }}
                  onSkip={() => {
                    window.location.href = '/fornecedores';
                  }}
                />
              } />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </Layout>
        )}
        </div>
      )}
    </Router>
  );
}

export default App;
