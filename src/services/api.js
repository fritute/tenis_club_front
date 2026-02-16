import axios from 'axios';
import $ from 'jquery';
import { TODOS_STATUS, isStatusValido } from '../constants/pedidoConstants';

const API_BASE_URL = 'http://localhost:8000/api';

// Configuração do Axios
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Exportar instância do api para uso direto
export { api };


// Interceptor para adicionar token JWT
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log(`[API Request] 🚀 ${config.method?.toUpperCase()} ${config.url}`);
      console.log('[API Request] 🎫 Token JWT adicionado ao header Authorization');
      console.log('[API Request] 🔐 Backend decodificará fornecedor_id automaticamente');
      
      // Log do usuário atual se disponível
      try {
        const userData = JSON.parse(localStorage.getItem('user'));
        if (userData?.nome) {
          console.log(`[API Request] 👤 Requisição para usuário: ${userData.nome} (${userData.nivel})`);
        }
      } catch (e) {
        // Ignorar erro de parse
      }
    } else {
      console.log(`[API Request] 📝 ${config.method?.toUpperCase()} ${config.url} (sem token)`);
    }
    return config;
  },
  (error) => {
    console.error('[API Request] 💥 Erro no interceptor:', error);
    return Promise.reject(error);
  }
);

// Função para limpar resposta corrompida com HTML/PHP warnings
const cleanJSONResponse = (data) => {
  if (typeof data === 'string') {
    // Procurar pelo JSON no meio de warnings HTML/PHP
    const jsonMatch = data.match(/({.*})/s);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[1]);
      } catch (e) {
        console.warn('[API] Erro ao parsear JSON limpo:', e);
        return data;
      }
    }
    return data;
  }
  return data;
};

// Interceptor para logar respostas
api.interceptors.response.use(
  (response) => {
    console.log(`[API Response] ${response.status} ${response.config.url}`);
    
    // Limpar dados corrompidos por warnings PHP
    response.data = cleanJSONResponse(response.data);
    
    console.log('[API Response] Dados:', response.data);
    return response;
  },
  (error) => {
    if (error.response) {
      console.error(`[API Response] ${error.response.status} ${error.response.config.url}`);
      console.error('[API Response] Erro:', error.response.data);
      
      // Verificar se é erro de CORS
      if (error.message?.includes('Network Error')) {
        console.error('[API Response] ⚠️  ERRO DE REDE - Possível problema de CORS');
        console.error('[API Response] Verifique se o backend está rodando e configurado para CORS');
      }
    } else if (error.request) {
      console.error('[API Response] Sem resposta do servidor');
      console.error('[API Response] Request:', error.request);
      
      if (error.message?.includes('Network Error')) {
        console.error('[API Response] ⚠️  ERRO DE REDE - Verifique:');
        console.error('[API Response] 1. Backend está rodando?');
        console.error('[API Response] 2. CORS está configurado?');
        console.error('[API Response] 3. URL está correta?');
      }
    } else {
      console.error('[API Response] Erro:', error.message);
    }
    return Promise.reject(error);
  }
);

// ============================================
// AUTENTICAÇÃO
// ============================================

// Função de diagnóstico da API
export const diagnosticarConexao = async () => {
  const diagnostico = {
    timestamp: new Date().toISOString(),
    baseURL: api.defaults.baseURL,
    problemas: [],
    sucessos: [],
    recomendacoes: []
  };
  
  console.log('🔍 [DIAGNÓSTICO] Iniciando verificação da API...');
  
  // Teste 1: Verificar conectividade básica
  try {
    const response = await fetch(api.defaults.baseURL);
    if (response.ok) {
      diagnostico.sucessos.push('✅ Backend está respondendo');
    } else {
      diagnostico.problemas.push(`⚠️ Backend retornou status ${response.status}`);
    }
  } catch (error) {
    diagnostico.problemas.push('❌ Backend não está respondendo');
    if (error.message.includes('CORS')) {
      diagnostico.problemas.push('❌ Problema de CORS detectado');
      diagnostico.recomendacoes.push('Configurar CORS no backend (veja CORRECOES_BACKEND.md)');
    }
  }
  
  // Teste 2: Verificar rotas específicas
  const rotasTeste = ['/produtos', '/categorias', '/fornecedores'];
  
  for (const rota of rotasTeste) {
    try {
      await api.get(rota);
      diagnostico.sucessos.push(`✅ Rota ${rota} funcionando`);
    } catch (error) {
      if (error.message?.includes('Network Error')) {
        diagnostico.problemas.push(`❌ CORS bloqueando ${rota}`);
      } else if (error.response?.status === 404) {
        diagnostico.problemas.push(`❌ Rota ${rota} não implementada`);
      } else {
        diagnostico.problemas.push(`⚠️ Erro em ${rota}: ${error.message}`);
      }
    }
  }
  
  // Adicionar recomendações gerais
  if (diagnostico.problemas.some(p => p.includes('CORS'))) {
    diagnostico.recomendacoes.push('🔧 Configurar CORS no backend');
    diagnostico.recomendacoes.push('📋 Consultar arquivo CORRECOES_BACKEND.md');
  }
  
  if (diagnostico.problemas.some(p => p.includes('não implementada'))) {
    diagnostico.recomendacoes.push('⚙️ Implementar rotas faltantes no backend');
  }
  
  console.log('📊 [DIAGNÓSTICO] Resultado:', diagnostico);
  return diagnostico;
};

// Função utilitária para executar diagnóstico via console
window.diagnosticarAPI = diagnosticarConexao;

export const login = async (email, senha) => {
  try {
    const response = await api.post('/usuarios/login', { email, senha });
    
    // A resposta já foi limpa pelo interceptor
    const data = response.data;
    
    console.log('[API] Login - Dados limpos:', data);
    
    // Verificar se a resposta tem a estrutura esperada
    if (typeof data === 'object' && data !== null) {
      return data;
    }
    
    // Se não conseguiu parsear, retornar erro
    console.error('[API] Login - Resposta inválida:', data);
    throw new Error('Resposta inválida do servidor');
    
  } catch (error) {
    console.error('[API] Erro no login:', error);
    
    // Tratar diferentes tipos de erro
    if (error.response?.status === 401) {
      throw new Error('Credenciais inválidas');
    } else if (error.message?.includes('Network Error')) {
      throw new Error('Erro de conexão com o servidor. Verifique se o backend está rodando.');
    }
    
    throw error.response?.data || new Error(error.message || 'Erro ao fazer login');
  }
};

export const cadastrarUsuario = async (dadosUsuario) => {
  try {
    console.log('[API] Cadastrando usuário:', dadosUsuario);
    const response = await api.post('/usuarios', dadosUsuario);
    
    const data = response.data;
    console.log('[API] Cadastro - Resposta:', data);
    
    return data;
  } catch (error) {
    console.error('[API] Erro no cadastro:', error);
    
    // Tratar diferentes tipos de erro
    if (error.response?.status === 409) {
      throw new Error('E-mail já cadastrado no sistema');
    } else if (error.response?.status === 400) {
      const msg = error.response?.data?.message || 'Dados inválidos';
      throw new Error(msg);
    } else if (error.message?.includes('Network Error')) {
      throw new Error('Erro de conexão. Verifique se o backend está rodando.');
    }
    
    throw error.response?.data || new Error('Erro ao criar conta. Tente novamente.');
  }
};

export const cadastrarLoja = async (dadosLoja) => {
  try {
    console.log('[API] Cadastrando loja:', dadosLoja);
    const response = await api.post('/fornecedores/minha-loja', dadosLoja);
    
    const data = response.data;
    console.log('[API] Cadastro de loja - Resposta completa:', data);
    
    // Garantir que retornamos dados consistentes
    const resultado = {
      success: data.success !== false,
      fornecedor_id: data.fornecedor_id || data.id || data.loja?.id || data.data?.id,
      loja: data.loja || data.data || {
        id: data.fornecedor_id || data.id,
        nome: dadosLoja.nome,
        email: dadosLoja.email,
        cnpj: dadosLoja.cnpj,
        telefone: dadosLoja.telefone,
        endereco: dadosLoja.endereco
      },
      message: data.message || 'Loja cadastrada com sucesso',
      ...data
    };
    
    console.log('[API] Dados normalizados da loja:', resultado);
    return resultado;
  } catch (error) {
    console.error('[API] Erro no cadastro da loja:', error);
    
    if (error.response?.status === 400) {
      const errorData = error.response?.data;
      
      // Se a resposta contém HTML/PHP warnings, extrair JSON limpo
      if (typeof errorData === 'string' && errorData.includes('<br />')) {
        try {
          // Tentar extrair JSON da resposta HTML
          const jsonMatch = errorData.match(/(\{.*\})/);
          if (jsonMatch) {
            const cleanJson = JSON.parse(jsonMatch[1]);
            const msg = cleanJson.message || 'Dados da loja inválidos';
            throw new Error(msg);
          }
        } catch (parseError) {
          console.warn('[API] Não foi possível extrair JSON da resposta:', parseError);
        }
      }
      
      const msg = errorData?.message || 'Dados da loja inválidos';
      throw new Error(msg);
    } else if (error.response?.status === 409) {
      throw new Error('Você já possui uma loja cadastrada');
    } else if (error.response?.status === 403) {
      throw new Error('Apenas fornecedores podem cadastrar lojas');
    } else if (error.response?.status === 500) {
      throw new Error('Erro interno do servidor. O backend precisa ser corrigido.');
    } else if (error.message?.includes('Network Error')) {
      throw new Error('Erro de conexão. Verifique se o backend está rodando.');
    }
    
    throw error.response?.data || new Error('Erro ao cadastrar loja. Tente novamente.');
  }
};

// Alias para manter compatibilidade
export const createMinhaLoja = cadastrarLoja;

export const validateToken = async (token) => {
  try {
    const response = await api.post('/usuarios/validar-token', { token });
    return response.data;
  } catch (error) {
    console.error('[API] Erro ao validar token:', error);
    console.error('[API] Status:', error.response?.status);
    console.error('[API] Dados:', error.response?.data);
    
    // Tratamento específico para erro 501
    if (error.response?.status === 501) {
      console.error('[API] ⚠️  ERRO 501 - Endpoint não implementado no backend');
      console.error('[API] O backend precisa implementar: POST /api/usuarios/validar-token');
      console.error('[API] Esperado: { "valid": true/false, "user": {...} }');
    }
    
    throw error.response?.data || new Error('Token inválido');
  }
};

// ============================================
// FORNECEDORES - Sistema Completo 🏪
// ============================================

// Listar fornecedores
export const getFornecedores = async (params = {}) => {
  try {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value);
      }
    });
    
    const queryString = queryParams.toString();
    const url = queryString ? `/fornecedores?${queryString}` : '/fornecedores';
    
    console.log('[API] 🏪 Buscando fornecedores:', url);
    const response = await api.get(url);
    
    console.log(`[API] ✅ ${response.data?.length || 0} fornecedores encontrados`);
    return response.data;
  } catch (error) {
    console.error('[API] ❌ Erro ao buscar fornecedores:', error);
    throw error.response?.data || new Error('Erro ao buscar fornecedores');
  }
};

// Ver minha loja (fornecedor logado) - Baseado no schema do banco
export const getMinhaLoja = async (useAlternativeEndpoint = false) => {
  try {
    const endpoint = useAlternativeEndpoint ? '/fornecedores?minha_loja=true' : '/fornecedores/minha-loja';
    console.log(`[API] 🏪 Buscando loja via: ${endpoint}`);
    console.log('[API] 🔐 JWT → fornecedor_id → tabela fornecedores');
    console.log('[API] 📊 Schema: usuarios.fornecedor_id → fornecedores.id');
    
    const response = await api.get(endpoint);
    
    console.log('[API] ✅ Resposta recebida com sucesso!');
    console.log('[API] 📋 Status:', response.status);
    console.log('[API] 🗂️ Estrutura da resposta:', response.data);
    console.log('[API] 🔍 Tipo de dados:', typeof response.data);
    console.log('[API] 🗝️ Chaves disponíveis:', Object.keys(response.data || {}));
    
    // Análise da estrutura baseada no schema do banco
    if (response.data) {
      if (response.data.success !== undefined) {
        console.log('[API] ✅ Campo success:', response.data.success);
        if (response.data.success === false) {
          console.log('[API] ⚠️ Falha: Usuário pode não ter fornecedor_id ou registro em fornecedores');
        }
      }
      if (response.data.data !== undefined) {
        console.log('[API] 📋 Campo data:', response.data.data, 'Tipo:', typeof response.data.data);
        if (Array.isArray(response.data.data) && response.data.data.length === 0) {
          console.log('[API] 🔍 Array vazio = usuário autenticado mas sem loja em fornecedores');
        }
      }
      if (response.data.message !== undefined) {
        console.log('[API] 💬 Mensagem:', response.data.message);
      }
    }
    
    return response.data;
  } catch (error) {
    console.error('[API] ❌ Erro ao buscar loja:', error);
    console.error('[API] 🐛 Status:', error.response?.status);
    console.error('[API] 📋 Response:', error.response?.data);
    
    // Tratamento baseado no schema do banco
    if (error.response?.status === 404) {
      throw new Error('Loja não encontrada. O usuário não possui registro na tabela fornecedores.');
    } else if (error.response?.status === 403) {
      throw new Error('Acesso negado. Apenas usuários com nivel=fornecedor podem acessar.');
    } else if (error.response?.status === 401) {
      throw new Error('Token expirado ou inválido. Faça login novamente.');
    }
    
    throw error.response?.data || new Error('Erro ao buscar dados da loja');
  }
};

// Atualizar minha loja (fornecedor logado)
export const updateMinhaLoja = async (dadosLoja) => {
  try {
    console.log('[API] 🏪 Atualizando minha loja:', dadosLoja);
    const response = await api.put('/fornecedores/minha-loja', dadosLoja);
    
    console.log('[API] ✅ Loja atualizada com sucesso!');
    return response.data;
  } catch (error) {
    console.error('[API] ❌ Erro ao atualizar loja:', error);
    
    if (error.response?.status === 404) {
      throw new Error('Loja não encontrada');
    } else if (error.response?.status === 403) {
      throw new Error('Acesso negado. Apenas fornecedores podem atualizar');
    }
    
    throw error.response?.data || new Error('Erro ao atualizar loja');
  }
};

// Alterar status da loja (novo endpoint específico)
export const updateLojaStatus = async (lojaId, status) => {
  try {
    console.log('[API] 🔄 Alterando status da loja:', { lojaId, status });
    
    // Validação de status
    if (!['Ativo', 'Inativo'].includes(status)) {
      throw new Error('Status deve ser "Ativo" ou "Inativo"');
    }
    
    const response = await api.post(`/fornecedores/${lojaId}/status`, { status });
    
    console.log('[API] ✅ Status da loja alterado com sucesso!');
    return response.data;
  } catch (error) {
    console.error('[API] ❌ Erro ao alterar status da loja:', error);
    
    if (error.response?.status === 404) {
      throw new Error('Loja não encontrada');
    } else if (error.response?.status === 403) {
      throw new Error('Acesso negado. Você só pode alterar sua própria loja');
    }
    
    throw error.response?.data || new Error('Erro ao alterar status da loja');
  }
};

// Alterar status do produto (novo endpoint específico)
export const updateProdutoStatus = async (produtoId, status) => {
  try {
    console.log('[API] 🔄 Alterando status do produto:', { produtoId, status });
    
    // Validação de status
    if (!['Ativo', 'Inativo'].includes(status)) {
      throw new Error('Status deve ser "Ativo" ou "Inativo"');
    }
    
    const response = await api.post(`/produtos/${produtoId}/status`, { status });
    
    console.log('[API] ✅ Status do produto alterado com sucesso!');
    return response.data;
  } catch (error) {
    console.error('[API] ❌ Erro ao alterar status do produto:', error);
    
    if (error.response?.status === 404) {
      throw new Error('Produto não encontrado');
    } else if (error.response?.status === 403) {
      throw new Error('Acesso negado. Você só pode alterar seus próprios produtos');
    }
    
    throw error.response?.data || new Error('Erro ao alterar status do produto');
  }
};

// Buscar fornecedor por ID
export const getFornecedor = async (id) => {
  try {
    console.log('[API] 🔍 Buscando fornecedor:', id);
    const response = await api.get(`/fornecedores/${id}`);
    
    console.log(`[API] ✅ Fornecedor ${id} encontrado`);
    return response.data;
  } catch (error) {
    console.error('[API] ❌ Erro ao buscar fornecedor:', error);
    
    if (error.response?.status === 404) {
      throw new Error('Fornecedor não encontrado');
    } else if (error.response?.status === 403) {
      throw new Error('Você não tem permissão para visualizar este fornecedor');
    }
    
    throw error.response?.data || new Error('Erro ao buscar fornecedor');
  }
};

// Criar fornecedor (executivo)
export const createFornecedor = async (data) => {
  try {
    console.log('[API] ➕ Criando fornecedor:', data.nome);
    const response = await api.post('/fornecedores', data);
    
    console.log(`[API] ✅ Fornecedor criado com sucesso - ID: ${response.data?.id || 'N/A'}`);
    return response.data;
  } catch (error) {
    console.error('[API] ❌ Erro ao criar fornecedor:', error);
    
    if (error.response?.status === 400) {
      throw new Error('Dados inválidos. Verifique os campos obrigatórios.');
    } else if (error.response?.status === 409) {
      throw new Error('CNPJ ou email já cadastrado');
    } else if (error.response?.status === 403) {
      throw new Error('Você não tem permissão para criar fornecedores');
    }
    
    throw error.response?.data || new Error('Erro ao criar fornecedor');
  }
};

// Atualizar fornecedor
export const updateFornecedor = async (id, data) => {
  try {
    console.log('[API] ✏️ Atualizando fornecedor:', id);
    const response = await api.put(`/fornecedores/${id}`, data);
    
    console.log(`[API] ✅ Fornecedor ${id} atualizado com sucesso`);
    return response.data;
  } catch (error) {
    console.error('[API] ❌ Erro ao atualizar fornecedor:', error);
    
    if (error.response?.status === 404) {
      throw new Error('Fornecedor não encontrado');
    } else if (error.response?.status === 400) {
      throw new Error('Dados inválidos. Verifique os campos obrigatórios.');
    } else if (error.response?.status === 403) {
      throw new Error('Você não tem permissão para alterar este fornecedor');
    }
    
    throw error.response?.data || new Error('Erro ao atualizar fornecedor');
  }
};

// Deletar fornecedor
export const deleteFornecedor = async (id) => {
  try {
    console.log('[API] 🗑️ Deletando fornecedor:', id);
    const response = await api.delete(`/fornecedores/${id}`);
    
    console.log(`[API] ✅ Fornecedor ${id} deletado com sucesso`);
    return response.data;
  } catch (error) {
    console.error('[API] ❌ Erro ao deletar fornecedor:', error);
    
    if (error.response?.status === 404) {
      throw new Error('Fornecedor não encontrado');
    } else if (error.response?.status === 403) {
      throw new Error('Você não tem permissão para deletar este fornecedor');
    } else if (error.response?.status === 400) {
      throw new Error('Não é possível deletar este fornecedor. Verifique se não há dependências.');
    }
    
    throw error.response?.data || new Error('Erro ao deletar fornecedor');
  }
};

// ============================================
// PRODUTOS
// ============================================

export const getProdutos = async (params = {}) => {
  try {
    // Construir query string se houver parâmetros
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value);
      }
    });
    
    const queryString = queryParams.toString();
    const url = queryString ? `/produtos?${queryString}` : '/produtos';
    
    console.log('[API] getProdutos - URL:', url);
    const response = await api.get(url);
    return response.data;
  } catch (error) {
    console.error('[API] Erro ao buscar produtos:', error);
    
    // Tratar diferentes tipos de erro
    if (error.message?.includes('Network Error')) {
      console.error('[API] ⚠️  Erro de CORS/Conectividade ao buscar produtos');
      console.error('[API] Verifique se o backend está configurado para CORS');
      throw new Error('Erro de conexão - verifique se o backend está rodando e configurado para CORS');
    }
    
    if (error.response?.status === 404) {
      console.error('[API] Endpoint /produtos não encontrado no backend');
      throw new Error('Rota de produtos não implementada no backend');
    }
    
    throw error.response?.data || new Error('Erro ao buscar produtos');
  }
};

export const getProduto = async (id) => {
  try {
    const response = await api.get(`/produtos/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || new Error('Erro ao buscar produto');
  }
};

export const createProduto = async (data) => {
  try {
    const response = await api.post('/produtos', data);
    return response.data;
  } catch (error) {
    throw error.response?.data || new Error('Erro ao criar produto');
  }
};

// Criar produto na minha loja (fornecedor) - Endpoint específico 
export const addProdutoMinhaLoja = async (produtoData) => {
  try {
    console.log('[API] 🏪 Adicionando produto à minha loja:', produtoData);
    const response = await api.post('/produtos/minha-loja', produtoData);
    
    console.log('[API] ✅ Produto adicionado à loja:', response.data);
    return response.data;
  } catch (error) {
    console.error('[API] ❌ Erro ao adicionar produto à loja:', error);
    
    if (error.response?.status === 400) {
      throw new Error('Dados inválidos - Nome do produto é obrigatório');
    } else if (error.response?.status === 401) {
      throw new Error('Você precisa estar logado como fornecedor');
    } else if (error.response?.status === 403) {
      throw new Error('Apenas fornecedores podem adicionar produtos à sua loja');
    } else if (error.response?.status === 409) {
      throw new Error('Produto com esse nome já existe na sua loja');
    }
    
    throw error.response?.data || new Error('Erro ao adicionar produto à loja');
  }
};

export const updateProduto = async (id, data) => {
  try {
    const response = await api.put(`/produtos/${id}`, data);
    return response.data;
  } catch (error) {
    throw error.response?.data || new Error('Erro ao atualizar produto');
  }
};

export const deleteProduto = async (id) => {
  try {
    const response = await api.delete(`/produtos/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || new Error('Erro ao deletar produto');
  }
};

// ============================================
// CATEGORIAS
// ============================================

export const getCategorias = async () => {
  try {
    const response = await api.get('/categorias');
    return response.data;
  } catch (error) {
    throw error.response?.data || new Error('Erro ao buscar categorias');
  }
};

export const getCategoria = async (id) => {
  try {
    const response = await api.get(`/categorias/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || new Error('Erro ao buscar categoria');
  }
};

export const createCategoria = async (data) => {
  try {
    const response = await api.post('/categorias', data);
    return response.data;
  } catch (error) {
    throw error.response?.data || new Error('Erro ao criar categoria');
  }
};

export const updateCategoria = async (id, data) => {
  try {
    const response = await api.put(`/categorias/${id}`, data);
    return response.data;
  } catch (error) {
    throw error.response?.data || new Error('Erro ao atualizar categoria');
  }
};

export const deleteCategoria = async (id) => {
  try {
    const response = await api.delete(`/categorias/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || new Error('Erro ao deletar categoria');
  }
};

// ============================================
// IMAGENS DE PRODUTOS
// ============================================

export const getProdutoImagens = async (produtoId) => {
  try {
    const response = await api.get(`/produtos/imagens?produto_id=${produtoId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || new Error('Erro ao buscar imagens');
  }
};

// Buscar imagem principal do produto (para cards/banners) - Endpoint otimizado
export const getProdutoImagemPrincipal = async (produtoId) => {
  try {
    console.log('[API] 🖼️ Buscando imagem principal do produto (endpoint otimizado):', produtoId);
    const response = await api.get(`/produtos/imagens/principal/${produtoId}`);
    
    console.log('[API] ✅ Imagem principal encontrada via endpoint dedicado!');
    return response.data;
  } catch (error) {
    console.error('[API] ❌ Erro ao buscar imagem principal via endpoint otimizado:', error);
    
    if (error.response?.status === 404) {
      console.log('[API] 📷 Produto sem imagem principal - usando placeholder');
      return null;
    }
    
    // Fallback para método anterior se o novo endpoint não estiver disponível
    if (error.response?.status === 404 || error.response?.status === 405) {
      console.log('[API] 🔄 Tentando método fallback para imagem principal');
      try {
        const response = await getProdutoImagens(produtoId);
        
        // A resposta pode ser um array direto ou um objeto com propriedade data
        const imagens = Array.isArray(response) ? response : (response?.data || response?.imagens || []);
        
        if (imagens.length === 0) {
          console.log('[API] 📷 Nenhuma imagem encontrada para produto:', produtoId);
          return null;
        }
        
        // Buscar imagem marcada como principal primeiro
        const imagemPrincipal = imagens.find(img => img.principal === true || img.principal === 1);
        if (imagemPrincipal) {
          console.log('[API] ✅ Imagem principal encontrada:', imagemPrincipal.url);
          return imagemPrincipal;
        }
        
        // Se não tem principal, pegar a primeira da lista
        const primeiraImagem = imagens[0];
        console.log('[API] 📸 Usando primeira imagem:', primeiraImagem.url);
        return primeiraImagem;
      } catch (fallbackError) {
        console.log('[API] ⚠️ Fallback também falhou:', fallbackError.message);
        return null;
      }
    }
    
    throw error.response?.data || new Error('Erro ao buscar imagem principal');
  }
};

export const uploadProdutoImagem = async (formData) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/produtos/imagens`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || new Error('Erro ao fazer upload da imagem');
  }
};

export const updateProdutoImagem = async (id, data) => {
  try {
    const response = await api.put(`/produtos/imagens/${id}`, data);
    return response.data;
  } catch (error) {
    throw error.response?.data || new Error('Erro ao atualizar imagem');
  }
};

export const setProdutoImagemPrincipal = async (id) => {
  try {
    const response = await api.put(`/produtos/imagens/${id}/principal`);
    return response.data;
  } catch (error) {
    throw error.response?.data || new Error('Erro ao definir imagem principal');
  }
};

export const reordenarProdutoImagens = async (produtoId, ordem) => {
  try {
    const response = await api.put('/produtos/imagens/reordenar', {
      produto_id: produtoId,
      ordem: ordem,
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || new Error('Erro ao reordenar imagens');
  }
};

export const deleteProdutoImagem = async (id) => {
  try {
    const response = await api.delete(`/produtos/imagens/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || new Error('Erro ao deletar imagem');
  }
};

// ============================================
// RELATÓRIOS
// ============================================

export const getRelatorioDashboard = async () => {
  try {
    const response = await api.get('/relatorios/dashboard');
    return response.data;
  } catch (error) {
    throw error.response?.data || new Error('Erro ao buscar dashboard');
  }
};

export const getRelatorioFornecedores = async () => {
  try {
    const response = await api.get('/relatorios/fornecedores');
    return response.data;
  } catch (error) {
    throw error.response?.data || new Error('Erro ao buscar relatório de fornecedores');
  }
};

export const getRelatorioProdutos = async () => {
  try {
    const response = await api.get('/relatorios/produtos');
    return response.data;
  } catch (error) {
    throw error.response?.data || new Error('Erro ao buscar relatório de produtos');
  }
};

export const getRelatorioCategorias = async () => {
  try {
    const response = await api.get('/relatorios/categorias');
    return response.data;
  } catch (error) {
    throw error.response?.data || new Error('Erro ao buscar relatório de categorias');
  }
};

export const getRelatorioFinanceiro = async () => {
  try {
    const response = await api.get('/relatorios/financeiro');
    return response.data;
  } catch (error) {
    throw error.response?.data || new Error('Erro ao buscar relatório financeiro');
  }
};

// ============================================
// PEDIDOS/COMPRAS - Sistema de API Integrado 🛒
// ============================================

/**
 * 📋 ENDPOINTS DISPONÍVEIS:
 * 
 * | Método | URL                        | Descrição                   | Autenticação |
 * |--------|----------------------------|-----------------------------|--------------|
 * | GET    | /api/pedidos               | Listar todos (executivo)    | ✅ Sim       |
 * | GET    | /api/pedidos/meus          | Meus pedidos (usuário)      | ✅ Sim       |
 * | GET    | /api/pedidos/recebidos     | Pedidos recebidos (fornec.) | ✅ Sim       |
 * | GET    | /api/pedidos/{id}          | Detalhes do pedido          | ✅ Sim       |
 * | POST   | /api/pedidos               | Criar novo pedido           | ✅ Sim       |
 * | PUT    | /api/pedidos/{id}/status   | Atualizar status            | ✅ Sim       |
 * | PUT    | /api/pedidos/{id}/cancelar | Cancelar pedido             | ✅ Sim       |
 * 
 * 🔐 Segurança: Todas as rotas requerem autenticação JWT
 * 📊 Log: Todas operações são registradas no sistema
 */

// Criar novo pedido com itens (usuários comuns)
export const createPedido = async (data) => {
  try {
    // Validação dos dados obrigatórios
    if (!data.itens || data.itens.length === 0) {
      throw new Error('O pedido deve conter pelo menos um item');
    }
    
    if (!data.endereco_entrega || data.endereco_entrega.trim() === '') {
      throw new Error('Endereço de entrega é obrigatório');
    }
    
    if (!data.telefone_contato || data.telefone_contato.trim() === '') {
      throw new Error('Telefone de contato é obrigatório');
    }
    
    console.log('[API] 🛒 Criando pedido com', data.itens.length, 'item(ns)');
    console.log('[API] 📞 Telefone:', data.telefone_contato);
    console.log('[API] 📍 Endereço:', data.endereco_entrega);
    console.log('[API] 📦 Dados completos do pedido:', JSON.stringify(data, null, 2));
    
    const response = await api.post('/pedidos', data);
    
    console.log(`[API] ✅ Pedido criado com sucesso - ID: ${response.data?.id || 'N/A'}`);
    return response.data;
  } catch (error) {
    console.error('[API] ❌ Erro ao criar pedido:', error);
    
    if (error.response?.status === 400) {
      throw new Error('Dados do pedido inválidos. Verifique os campos obrigatórios.');
    } else if (error.response?.status === 403) {
      throw new Error('Você não tem permissão para criar pedidos.');
    } else if (error.response?.status === 404) {
      throw new Error('Rota de criação de pedidos não implementada no backend.');
    }
    
    throw error.response?.data || error;
  }
};

// Meus pedidos (usuário comprador)
export const getMeusPedidos = async (params = {}) => {
  try {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value);
      }
    });
    
    const queryString = queryParams.toString();
    const url = queryString ? `/pedidos/meus?${queryString}` : '/pedidos/meus';
    
    console.log('[API] 📋 Buscando meus pedidos:', url);
    const response = await api.get(url);
    return response.data;
  } catch (error) {
    console.error('[API] ❌ Erro ao buscar meus pedidos:', error);
    
    if (error.response?.status === 404) {
      console.warn('[API] ⚠️ Endpoint /pedidos/meus não implementado, usando dados simulados');
      return {
        pedidos: [
          {
            id: 1,
            produto_nome: 'Tênis Nike Air Max',
            quantidade: 1,
            preco_unitario: 299.90,
            valor_total: 299.90,
            status: 'pendente',
            fornecedor_nome: 'Nike Store',
            endereco_entrega: 'Rua das Flores, 123, São Paulo-SP',
            telefone_contato: '(11) 99999-9999',
            criado_em: new Date().toISOString(),
            observacoes: 'Observações do pedido'
          }
        ]
      };
    }
    
    throw error.response?.data || new Error('Erro ao buscar seus pedidos');
  }
};

// Pedidos recebidos (fornecedor)
export const getPedidosRecebidos = async (params = {}) => {
  try {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value);
      }
    });
    
    const queryString = queryParams.toString();
    const url = queryString ? `/pedidos/recebidos?${queryString}` : '/pedidos/recebidos';
    
    console.log('[API] 🏪 Buscando pedidos recebidos:', url);
    const response = await api.get(url);
    return response.data;
  } catch (error) {
    console.error('[API] ❌ Erro ao buscar pedidos recebidos:', error);
    
    if (error.response?.status === 404) {
      console.warn('[API] ⚠️ Endpoint /pedidos/recebidos não implementado');
      return { pedidos: [] };
    }
    
    throw error.response?.data || new Error('Erro ao buscar pedidos recebidos');
  }
};

// Estatísticas de pedidos (fornecedor)
export const getEstatisticasPedidos = async (periodo = '30d') => {
  try {
    const response = await api.get(`/pedidos/estatisticas?periodo=${periodo}`);
    
    console.log('[API] 📊 Estatísticas de pedidos carregadas');
    return response.data;
  } catch (error) {
    console.error('[API] ❌ Erro ao buscar estatísticas de pedidos:', error);
    
    if (error.response?.status === 404) {
      return {
        total_pedidos: 150,
        pedidos_pendentes: 12,
        pedidos_confirmados: 35,
        pedidos_entregues: 98,
        pedidos_cancelados: 5,
        receita_total: 45750.80,
        receita_mes_atual: 8945.50,
        ticket_medio: 305.00
      };
    }
    
    throw error.response?.data || new Error('Erro ao buscar estatísticas');
  }
};

// Buscar pedido específico por ID
export const getPedido = async (id) => {
  try {
    if (!id) {
      throw new Error('ID do pedido é obrigatório');
    }
    
    console.log('[API] 🔍 Buscando detalhes do pedido:', id);
    const response = await api.get(`/pedidos/${id}`);
    
    console.log('[API] ✅ Pedido encontrado:', response.data);
    return response.data;
  } catch (error) {
    console.error('[API] ❌ Erro ao buscar pedido:', error);
    
    if (error.response?.status === 404) {
      throw new Error('Pedido não encontrado');
    } else if (error.response?.status === 403) {
      throw new Error('Você não tem permissão para visualizar este pedido');
    }
    
    throw error.response?.data || error;
  }
};

// Listar todos os pedidos (executivo apenas)
export const getAllPedidos = async (params = {}) => {
  try {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value);
      }
    });
    
    const queryString = queryParams.toString();
    const url = queryString ? `/pedidos?${queryString}` : '/pedidos';
    
    console.log('[API] 👑 Buscando todos os pedidos (executivo):', url);
    const response = await api.get(url);
    return response.data;
  } catch (error) {
    console.error('[API] ❌ Erro ao buscar pedidos:', error);
    
    if (error.response?.status === 403) {
      throw new Error('Apenas executivos podem visualizar todos os pedidos');
    }
    
    throw error.response?.data || new Error('Erro ao buscar pedidos');
  }
};

// Atualizar status do pedido (fornecedor/executivo)
export const updateStatusPedido = async (id, status, observacao = '') => {
  try {
    // Validação de status usando constantes
    if (!isStatusValido(status)) {
      throw new Error(`Status inválido. Use um dos seguintes: ${TODOS_STATUS.join(', ')}`);
    }
    
    console.log('[API] 🔄 Atualizando status do pedido:', id, 'para:', status);
    const response = await api.put(`/pedidos/${id}/status`, { 
      status, 
      observacao
    });
    
    console.log(`[API] ✅ Status do pedido ${id} atualizado para: ${status}`);
    return response.data;
  } catch (error) {
    console.error('[API] ❌ Erro ao atualizar status do pedido:', error);
    
    if (error.response?.status === 403) {
      throw new Error('Você não tem permissão para alterar este pedido');
    } else if (error.response?.status === 404) {
      throw new Error('Pedido não encontrado');
    } else if (error.response?.status === 400) {
      throw new Error('Status inválido ou transição não permitida');
    }
    
    throw error.response?.data || error;
  }
};

// Cancelar pedido (cliente)
export const cancelarPedido = async (id, motivo = '') => {
  try {
    console.log('[API] ❌ Cancelando pedido:', id, motivo ? `Motivo: ${motivo}` : '');
    const response = await api.put(`/pedidos/${id}/cancelar`, { motivo });
    
    console.log(`[API] ✅ Pedido ${id} cancelado com sucesso`);
    return response.data;
  } catch (error) {
    console.error('[API] ❌ Erro ao cancelar pedido:', error);
    
    if (error.response?.status === 403) {
      throw new Error('Você não pode cancelar este pedido. Apenas o cliente pode cancelar seus próprios pedidos.');
    } else if (error.response?.status === 400) {
      throw new Error('Pedido não pode ser cancelado no status atual. Pedidos entregues não podem ser cancelados.');
    } else if (error.response?.status === 404) {
      throw new Error('Pedido não encontrado');
    }
    
    throw error.response?.data || error;
  }
};

// Função genérica para manter compatibilidade (será removida futuramente)
export const getPedidos = async (params = {}) => {
  console.warn('[API] ⚠️ AVISO: getPedidos() será descontinuada. Use getMeusPedidos(), getPedidosRecebidos() ou getAllPedidos()');
  return getAllPedidos(params);
};

// ============================================
// SISTEMA DE USUÁRIOS - Gerenciamento Completo 🔐
// ============================================

// Validar token JWT
export const validarToken = async (token) => {
  try {
    console.log('[API] 🔐 Validando token JWT');
    const response = await api.post('/usuarios/validar-token', { token });
    
    console.log('[API] ✅ Token válido');
    return response.data;
  } catch (error) {
    console.error('[API] ❌ Token inválido:', error);
    
    if (error.response?.status === 401) {
      throw new Error('Token inválido ou expirado');
    }
    
    throw error.response?.data || new Error('Erro ao validar token');
  }
};

// Listar usuários (executivo apenas)
export const getUsuarios = async (params = {}) => {
  try {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value);
      }
    });
    
    const queryString = queryParams.toString();
    const url = queryString ? `/usuarios?${queryString}` : '/usuarios';
    
    console.log('[API] 👥 Buscando usuários (executivo):', url);
    const response = await api.get(url);
    return response.data;
  } catch (error) {
    console.error('[API] ❌ Erro ao buscar usuários:', error);
    
    if (error.response?.status === 403) {
      throw new Error('Apenas executivos podem listar usuários');
    }
    
    throw error.response?.data || new Error('Erro ao buscar usuários');
  }
};

// Perfil próprio do usuário
export const getPerfil = async () => {
  try {
    console.log('[API] 👤 Buscando perfil do usuário');
    const response = await api.get('/usuarios/perfil');
    
    console.log('[API] ✅ Perfil carregado');
    return response.data;
  } catch (error) {
    console.error('[API] ❌ Erro ao buscar perfil:', error);
    
    if (error.response?.status === 401) {
      throw new Error('Não autenticado. Faça login novamente.');
    }
    
    throw error.response?.data || new Error('Erro ao buscar perfil');
  }
};

// Buscar usuário por ID
export const getUsuario = async (id) => {
  try {
    console.log('[API] 🔍 Buscando usuário:', id);
    const response = await api.get(`/usuarios/${id}`);
    
    console.log(`[API] ✅ Usuário ${id} encontrado`);
    return response.data;
  } catch (error) {
    console.error('[API] ❌ Erro ao buscar usuário:', error);
    
    if (error.response?.status === 404) {
      throw new Error('Usuário não encontrado');
    } else if (error.response?.status === 403) {
      throw new Error('Você não tem permissão para visualizar este usuário');
    }
    
    throw error.response?.data || new Error('Erro ao buscar usuário');
  }
};

// Criar novo usuário
export const criarUsuario = async (dadosUsuario) => {
  try {
    console.log('[API] ➕ Criando novo usuário:', dadosUsuario.nome);
    const response = await api.post('/usuarios', dadosUsuario);
    
    console.log(`[API] ✅ Usuário criado com sucesso - ID: ${response.data?.id || 'N/A'}`);
    return response.data;
  } catch (error) {
    console.error('[API] ❌ Erro ao criar usuário:', error);
    
    if (error.response?.status === 400) {
      throw new Error('Dados inválidos. Verifique os campos obrigatórios.');
    } else if (error.response?.status === 409) {
      throw new Error('Email já está sendo usado por outro usuário');
    } else if (error.response?.status === 403) {
      throw new Error('Você não tem permissão para criar usuários');
    }
    
    throw error.response?.data || new Error('Erro ao criar usuário');
  }
};

// Atualizar usuário existente
export const atualizarUsuario = async (id, dadosUsuario) => {
  try {
    console.log('[API] ✏️ Atualizando usuário:', id);
    const response = await api.put(`/usuarios/${id}`, dadosUsuario);
    
    console.log(`[API] ✅ Usuário ${id} atualizado com sucesso`);
    return response.data;
  } catch (error) {
    console.error('[API] ❌ Erro ao atualizar usuário:', error);
    
    if (error.response?.status === 404) {
      throw new Error('Usuário não encontrado');
    } else if (error.response?.status === 400) {
      throw new Error('Dados inválidos. Verifique os campos obrigatórios.');
    } else if (error.response?.status === 409) {
      throw new Error('Email já está sendo usado por outro usuário');
    } else if (error.response?.status === 403) {
      throw new Error('Você não tem permissão para alterar este usuário');
    }
    
    throw error.response?.data || new Error('Erro ao atualizar usuário');
  }
};

// Deletar usuário
export const deletarUsuario = async (id) => {
  try {
    console.log('[API] 🗑️ Deletando usuário:', id);
    const response = await api.delete(`/usuarios/${id}`);
    
    console.log(`[API] ✅ Usuário ${id} deletado com sucesso`);
    return response.data;
  } catch (error) {
    console.error('[API] ❌ Erro ao deletar usuário:', error);
    
    if (error.response?.status === 404) {
      throw new Error('Usuário não encontrado');
    } else if (error.response?.status === 403) {
      throw new Error('Você não tem permissão para deletar este usuário');
    } else if (error.response?.status === 400) {
      throw new Error('Não é possível deletar este usuário. Verifique se não há dependências.');
    }
    
    throw error.response?.data || new Error('Erro ao deletar usuário');
  }
};

// ============================================
// jQuery Helper Functions
// ============================================

export const showNotification = (message, type = 'success') => {
  // Remove notificações existentes
  $('.notification').remove();
  
  const notification = $(`
    <div class="notification notification-${type}">
      <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
      <span>${message}</span>
    </div>
  `);
  
  $('body').append(notification);
  
  setTimeout(() => {
    notification.addClass('show');
  }, 100);
  
  setTimeout(() => {
    notification.removeClass('show');
    setTimeout(() => notification.remove(), 300);
  }, 3000);
};

// ============================================

// ============================================
// SISTEMA DE VINCULOS PRODUTO-FORNECEDOR
// ============================================

// Listar todos os vinculos
export const getVinculos = async () => {
  try {
    console.log('[API] Buscando todos os vinculos');
    const response = await api.get('/vinculos');
    
    const data = response.data;
    const vinculos = Array.isArray(data) ? data : (data?.vinculos || data?.data || []);
    
    console.log('[API] vinculos encontrados:', vinculos.length);
    return vinculos;
  } catch (error) {
    console.error('[API] Erro ao buscar vinculos:', error);
    
    if (error.response?.status === 404) {
      return [];
    }
    
    throw error.response?.data || new Error('Erro ao buscar vinculos');
  }
};

// Criar vinculo produto-fornecedor
export const createVinculo = async (vinculoData) => {
  try {
    console.log('[API] Criando vinculo produto-fornecedor:', vinculoData);
    const response = await api.post('/vinculos', vinculoData);
    
    console.log('[API] Vinculo criado com sucesso:', response.data);
    return response.data;
  } catch (error) {
    console.error('[API] Erro ao criar vinculo:', error);
    
    if (error.response?.status === 409) {
      throw new Error('Este vinculo ja existe');
    } else if (error.response?.status === 404) {
      throw new Error('Produto ou fornecedor nao encontrado');
    } else if (error.response?.status === 400) {
      throw new Error('Dados invalidos para criar vinculo');
    }
    
    throw error.response?.data || new Error('Erro ao criar vinculo');
  }
};

// Criar múltiplos vínculos
export const createVinculosMultiplos = async (vinculosData) => {
  try {
    console.log('[API] Criando vínculos múltiplos:', vinculosData);
    const response = await api.post('/vinculos/multiplos', { vinculos: vinculosData });
    
    console.log('[API] Vínculos criados:', response.data);
    return response.data;
  } catch (error) {
    console.error('[API] Erro ao criar vínculos múltiplos:', error);
    
    if (error.response?.status === 400) {
      throw new Error('Dados inválidos para criar vínculos');
    } else if (error.response?.status === 409) {
      throw new Error('Alguns vínculos já existem');
    }
    
    throw error.response?.data || new Error('Erro ao criar vínculos múltiplos');
  }
};

// Buscar fornecedores de um produto
export const getVinculosPorProduto = async (produtoId) => {
  try {
    console.log('[API] Buscando fornecedores do produto:', produtoId);
    const response = await api.get('/vinculos/produto/' + produtoId);
    
    const data = response.data;
    const vinculos = Array.isArray(data) ? data : (data?.vinculos || data?.data || []);
    
    console.log('[API] Fornecedores vinculados ao produto:', vinculos.length);
    return vinculos;
  } catch (error) {
    console.error('[API] Erro ao buscar fornecedores do produto:', error);
    
    if (error.response?.status === 404) {
      return [];
    }
    
    throw error.response?.data || new Error('Erro ao buscar fornecedores do produto');
  }
};

// Buscar produtos de um fornecedor
export const getVinculosPorFornecedor = async (fornecedorId) => {
  try {
    console.log('[API] Buscando produtos do fornecedor:', fornecedorId);
    const response = await api.get('/vinculos/fornecedor/' + fornecedorId);
    
    const data = response.data;
    const vinculos = Array.isArray(data) ? data : (data?.vinculos || data?.data || []);
    
    console.log('[API] Produtos vinculados ao fornecedor:', vinculos.length);
    return vinculos;
  } catch (error) {
    console.error('[API] Erro ao buscar produtos do fornecedor:', error);
    
    if (error.response?.status === 404) {
      return [];
    }
    
    throw error.response?.data || new Error('Erro ao buscar produtos do fornecedor');
  }
};

// Remover vinculo
export const deleteVinculo = async (vinculoId) => {
  try {
    console.log('[API] Removendo vinculo:', vinculoId);
    const response = await api.delete('/vinculos/' + vinculoId);
    
    console.log('[API] Vinculo removido com sucesso');
    return response.data;
  } catch (error) {
    console.error('[API] Erro ao remover vinculo:', error);
    
    if (error.response?.status === 404) {
      throw new Error('Vinculo nao encontrado');
    } else if (error.response?.status === 403) {
      throw new Error('Voce nao tem permissao para remover este vinculo');
    }
    
    throw error.response?.data || new Error('Erro ao remover vinculo');
  }
};

// Remover múltiplos vínculos em massa
export const deleteVinculosEmMassa = async (vinculoIds) => {
  try {
    console.log('[API] Removendo vínculos em massa:', vinculoIds);
    
    // Usa endpoint correto /vinculos/multiplos
    try {
      const response = await api.delete('/vinculos/multiplos', { 
        data: { ids: vinculoIds } 
      });
      console.log('[API] Vínculos removidos em massa com sucesso');
      return response.data;
    } catch (massaError) {
      // Se não existir endpoint de massa, remove um a um
      if (massaError.response?.status === 404 || massaError.response?.status === 405) {
        console.log('[API] Endpoint de massa não disponível, removendo um a um...');
        
        const resultados = {
          sucesso: [],
          falhas: []
        };
        
        for (const id of vinculoIds) {
          try {
            await api.delete('/vinculos/' + id);
            resultados.sucesso.push(id);
          } catch (err) {
            resultados.falhas.push({ id, erro: err.message });
          }
        }
        
        console.log('[API] Remoção em massa concluída:', resultados);
        return resultados;
      }
      throw massaError;
    }
  } catch (error) {
    console.error('[API] Erro ao remover vínculos em massa:', error);
    throw error.response?.data || new Error('Erro ao remover vínculos em massa');
  }
};

// Remover todos os vínculos de um produto
export const deleteVinculosPorProduto = async (produtoId) => {
  try {
    console.log('[API] Removendo vínculos do produto:', produtoId);
    const response = await api.delete(`/vinculos/produto/${produtoId}`);
    
    console.log('[API] Vínculos do produto removidos com sucesso');
    return response.data;
  } catch (error) {
    console.error('[API] Erro ao remover vínculos do produto:', error);
    
    if (error.response?.status === 404) {
      throw new Error('Produto não encontrado ou sem vínculos');
    } else if (error.response?.status === 403) {
      throw new Error('Você não tem permissão para remover estes vínculos');
    }
    
    throw error.response?.data || new Error('Erro ao remover vínculos do produto');
  }
};

// Aliases para compatibilidade
export const createVinculoProduto = createVinculo;
export const deleteVinculoProduto = deleteVinculo;
export const getVinculosProduto = getVinculosPorProduto;

export default api;