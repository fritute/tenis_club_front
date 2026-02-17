
import axios from 'axios';
import $ from 'jquery';
import { TODOS_STATUS, isStatusValido } from '../constants/pedidoConstants';

// Deletar vínculo por produto e fornecedor
export const deleteVinculoPorProdutoFornecedor = async (id_produto, id_fornecedor) => {
  try {
    // Log removido
    const response = await api.delete(`/vinculos/${id_produto}?fornecedor=${id_fornecedor}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || new Error('Erro ao remover vínculo por produto e fornecedor');
  }
};

const API_BASE_URL = 'http://localhost:8000/api';

// Configuração do Axios
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000, // 15 segundos de timeout para evitar loading eterno
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
    }
    return config;
  },
  (error) => {
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
    // Limpar dados corrompidos por warnings PHP
    response.data = cleanJSONResponse(response.data);
    return response;
  },
  (error) => {
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
  
  return diagnostico;
};

// Função utilitária para executar diagnóstico via console
window.diagnosticarAPI = diagnosticarConexao;

export const login = async (email, senha) => {
  try {
    const response = await api.post('/usuarios/login', { email, senha });
    
    // A resposta já foi limpa pelo interceptor
    const data = response.data;
    
    // Verificar se a resposta tem a estrutura esperada
    if (typeof data === 'object' && data !== null) {
      return data;
    }
    
    // Se não conseguiu parsear, retornar erro
    throw new Error('Resposta inválida do servidor');
    
  } catch (error) {
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
    const response = await api.post('/usuarios', dadosUsuario);
    return response.data;
  } catch (error) {
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
    const response = await api.post('/fornecedores/minha-loja', dadosLoja);
    
    const data = response.data;
    
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
    
    return resultado;
  } catch (error) {
    
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
          // Ignorar erro de parse
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
    
    const response = await api.get(url);
    
    return response.data;
  } catch (error) {
    throw error.response?.data || new Error('Erro ao buscar fornecedores');
  }
};

// Ver minha loja (fornecedor logado) - Baseado no schema do banco
export const getMinhaLoja = async (useAlternativeEndpoint = false) => {
  try {
    const endpoint = useAlternativeEndpoint ? '/fornecedores?minha_loja=true' : '/fornecedores/minha-loja';
    
    const response = await api.get(endpoint);
    
    return response.data;
  } catch (error) {
    
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
    const response = await api.put('/fornecedores/minha-loja', dadosLoja);
    return response.data;
  } catch (error) {
    
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
    
    // Validação de status
    if (!['Ativo', 'Inativo'].includes(status)) {
      throw new Error('Status deve ser "Ativo" ou "Inativo"');
    }
    
    const response = await api.post(`/fornecedores/${lojaId}/status`, { status });
    
    return response.data;
  } catch (error) {
    
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
    
    // Validação de status
    if (!['Ativo', 'Inativo'].includes(status)) {
      throw new Error('Status deve ser "Ativo" ou "Inativo"');
    }
    
    const response = await api.post(`/produtos/${produtoId}/status`, { status });
    
    return response.data;
  } catch (error) {
    
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
    const response = await api.get(`/fornecedores/${id}`);
    
    return response.data;
  } catch (error) {
    
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
    const response = await api.post('/fornecedores', data);
    
    return response.data;
  } catch (error) {
    
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
    const response = await api.put(`/fornecedores/${id}`, data);
    
    return response.data;
  } catch (error) {
    
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
    
    const response = await api.get(url);
    return response.data;
  } catch (error) {
    
    // Tratar diferentes tipos de erro
    if (error.message?.includes('Network Error')) {
      throw new Error('Erro de conexão - verifique se o backend está rodando e configurado para CORS');
    }
    
    if (error.response?.status === 404) {
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
    const response = await api.post('/produtos/minha-loja', produtoData);
    
    return response.data;
  } catch (error) {
    
    const errorMessage = error.response?.data?.message || '';
    
    if (error.response?.status === 400) {
      throw new Error('Dados inválidos - Nome do produto é obrigatório');
    } else if (error.response?.status === 401) {
      throw new Error('Você precisa estar logado como fornecedor');
    } else if (error.response?.status === 403) {
      // Verificar se é erro de token desatualizado
      if (errorMessage.includes('não está associado') || errorMessage.includes('Crie sua loja')) {
        throw new Error('TOKEN_DESATUALIZADO');
      }
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
    const response = await api.get(`/produtos/imagens/principal/${produtoId}`);
    
    return response.data;
  } catch (error) {
    
    if (error.response?.status === 404) {
      return null;
    }
    
    // Fallback para método anterior se o novo endpoint não estiver disponível
    if (error.response?.status === 404 || error.response?.status === 405) {
      try {
        const response = await getProdutoImagens(produtoId);
        
        // A resposta pode ser um array direto ou um objeto com propriedade data
        const imagens = Array.isArray(response) ? response : (response?.data || response?.imagens || []);
        
        if (imagens.length === 0) {
          return null;
        }
        
        // Buscar imagem marcada como principal primeiro
        const imagemPrincipal = imagens.find(img => img.principal === true || img.principal === 1);
        if (imagemPrincipal) {
          return imagemPrincipal;
        }
        
        // Se não tem principal, pegar a primeira da lista
        const primeiraImagem = imagens[0];
        return primeiraImagem;
      } catch (fallbackError) {
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
    if (!data.fornecedor_id) {
      throw new Error('ID do fornecedor é obrigatório');
    }
    
    if (!data.itens || data.itens.length === 0) {
      throw new Error('O pedido deve conter pelo menos um item');
    }
    
    if (!data.endereco_entrega) {
      throw new Error('Endereço de entrega é obrigatório');
    }
    
    // Validar campos obrigatórios de cada item
    data.itens.forEach((item, index) => {
      if (!item.produto_id) {
        throw new Error(`Item ${index + 1}: produto_id é obrigatório`);
      }
      if (!item.quantidade || item.quantidade <= 0) {
        throw new Error(`Item ${index + 1}: quantidade deve ser maior que zero`);
      }
      if (item.preco_unitario === undefined || item.preco_unitario === null) {
        throw new Error(`Item ${index + 1}: preco_unitario é obrigatório`);
      }
    });
    
    const response = await api.post('/pedidos', data);
    
    return response.data;
  } catch (error) {
    
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
    
    const response = await api.get(url);
    return response.data;
  } catch (error) {
    
    if (error.response?.status === 404) {
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
    
    const response = await api.get(url);
    return response.data;
  } catch (error) {
    
    const errorMessage = error.response?.data?.message || '';
    
    if (error.response?.status === 404) {
      return { pedidos: [] };
    }
    
    // Verificar se é erro de token desatualizado (fornecedor sem loja associada no JWT)
    if (error.response?.status === 403) {
      if (errorMessage.includes('não está associado') || errorMessage.includes('Crie sua loja')) {
        throw new Error('TOKEN_DESATUALIZADO');
      }
    }
    
    throw error.response?.data || new Error('Erro ao buscar pedidos recebidos');
  }
};

// Estatísticas de pedidos (fornecedor)
export const getEstatisticasPedidos = async (periodo = '30d') => {
  try {
    const response = await api.get(`/pedidos/estatisticas?periodo=${periodo}`);
    
    return response.data;
  } catch (error) {
    
    const errorMessage = error.response?.data?.message || '';
    
    if (error.response?.status === 404) {
      return {
        total_pedidos: 0,
        pedidos_pendentes: 0,
        pedidos_confirmados: 0,
        pedidos_entregues: 0,
        pedidos_cancelados: 0,
        receita_total: 0,
        receita_mes_atual: 0,
        ticket_medio: 0
      };
    }
    
    // Verificar se é erro de token desatualizado (fornecedor sem loja associada no JWT)
    if (error.response?.status === 403) {
      if (errorMessage.includes('não está associado') || errorMessage.includes('Crie sua loja')) {
        throw new Error('TOKEN_DESATUALIZADO');
      }
      // Retornar estatísticas zeradas se não tem permissão
      return {
        total_pedidos: 0,
        pedidos_pendentes: 0,
        pedidos_confirmados: 0,
        pedidos_entregues: 0,
        pedidos_cancelados: 0,
        receita_total: 0,
        receita_mes_atual: 0,
        ticket_medio: 0
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
    
    const response = await api.get(`/pedidos/${id}`);
    
    return response.data;
  } catch (error) {
    
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
    
    const response = await api.get(url);
    return response.data;
  } catch (error) {
    
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
    
    const response = await api.put(`/pedidos/${id}/status`, { 
      status, 
      observacao
    });
    
    return response.data;
  } catch (error) {
    
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
    const response = await api.put(`/pedidos/${id}/cancelar`, { motivo });
    
    return response.data;
  } catch (error) {
    
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
  return getAllPedidos(params);
};

// ============================================
// SISTEMA DE USUÁRIOS - Gerenciamento Completo 🔐
// ============================================

// Validar token JWT
export const validarToken = async (token) => {
  try {
    const response = await api.post('/usuarios/validar-token', { token });
    
    return response.data;
  } catch (error) {
    
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
    
    const response = await api.get(url);
    return response.data;
  } catch (error) {
    
    if (error.response?.status === 403) {
      throw new Error('Apenas executivos podem listar usuários');
    }
    
    throw error.response?.data || new Error('Erro ao buscar usuários');
  }
};

// Perfil próprio do usuário
export const getPerfil = async () => {
  try {
    const response = await api.get('/usuarios/perfil');
    
    return response.data;
  } catch (error) {
    
    if (error.response?.status === 401) {
      throw new Error('Não autenticado. Faça login novamente.');
    }
    
    throw error.response?.data || new Error('Erro ao buscar perfil');
  }
};

// Buscar usuário por ID
export const getUsuario = async (id) => {
  try {
    const response = await api.get(`/usuarios/${id}`);
    
    return response.data;
  } catch (error) {
    
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
    const response = await api.post('/usuarios', dadosUsuario);
    
    return response.data;
  } catch (error) {
    
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
    const response = await api.put(`/usuarios/${id}`, dadosUsuario);
    
    return response.data;
  } catch (error) {
    
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
    const response = await api.delete(`/usuarios/${id}`);
    
    return response.data;
  } catch (error) {
    
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
    const response = await api.get('/vinculos');
    
    const data = response.data;
    const vinculos = Array.isArray(data) ? data : (data?.vinculos || data?.data || []);
    
    return vinculos;
  } catch (error) {
    
    if (error.response?.status === 404) {
      return [];
    }
    
    throw error.response?.data || new Error('Erro ao buscar vinculos');
  }
};

// Criar vinculo produto-fornecedor
export const createVinculo = async (vinculoData) => {
  try {
    const response = await api.post('/vinculos', vinculoData);
    
    return response.data;
  } catch (error) {
    
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
    const response = await api.post('/vinculos/multiplos', { vinculos: vinculosData });
    
    return response.data;
  } catch (error) {
    
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
    const response = await api.get('/vinculos/produto/' + produtoId);
    
    const data = response.data;
    const vinculos = Array.isArray(data) ? data : (data?.vinculos || data?.data || []);
    
    return vinculos;
  } catch (error) {
    
    if (error.response?.status === 404) {
      return [];
    }
    
    throw error.response?.data || new Error('Erro ao buscar fornecedores do produto');
  }
};

// Buscar produtos de um fornecedor
export const getVinculosPorFornecedor = async (fornecedorId) => {
  try {
    const response = await api.get('/vinculos/fornecedor/' + fornecedorId);
    
    const data = response.data;
    const vinculos = Array.isArray(data) ? data : (data?.vinculos || data?.data || []);
    
    return vinculos;
  } catch (error) {
    if (error.response?.status === 404) {
      return [];
    }
    
    throw error.response?.data || new Error('Erro ao buscar produtos do fornecedor');
  }
};

// Nova rota para buscar produtos da minha empresa (próprios + vinculados)
export const getMeusProdutos = async () => {
  try {
    const response = await api.get('/produtos/minha-empresa');
    
    const data = response.data;
    const produtos = Array.isArray(data) ? data : (data?.produtos || data?.data || []);
    
    return produtos;
  } catch (error) {
    if (error.response?.status === 404) {
      // Fallback para getProdutos com loja_id se a rota nova falhar
      try {
        const user = JSON.parse(localStorage.getItem('user'));
        if (user?.loja?.id) {
          return await getProdutos({ loja_id: user.loja.id });
        }
      } catch (e) {
        // Silently fail fallback
      }
      return [];
    }
    
    throw error.response?.data || new Error('Erro ao buscar produtos da minha empresa');
  }
};

// Remover vínculo por ID
export const deleteVinculo = async (vinculoId) => {
  try {
    const response = await api.delete('/vinculos/' + vinculoId);
    return response.data;
  } catch (error) {
    if (error.response?.status === 404) {
      throw new Error('Vínculo não encontrado');
    } else if (error.response?.status === 403) {
      throw new Error('Você não tem permissão para remover este vínculo');
    }
    throw error.response?.data || new Error('Erro ao remover vínculo');
  }
};
export const deleteVinculosEmMassa = async (vinculos) => {
  try {
    // Filtra apenas os campos id_produto e id_fornecedor
    const vinculosFiltrados = vinculos.map(v => ({
      id_produto: v.id_produto,
      id_fornecedor: v.id_fornecedor
    }));
    // Validação extra
    const invalidos = vinculosFiltrados.filter(v => !v.id_produto || !v.id_fornecedor);
    if (invalidos.length > 0) {
      throw new Error('Existem vínculos sem id_produto ou id_fornecedor');
    }
    try {
      const response = await api.delete('/vinculos/multiplos', {
        data: { vinculos: vinculosFiltrados },
        headers: { 'Content-Type': 'application/json' }
      });
      return response.data;
    } catch (massaError) {
      // Se não existir endpoint de massa, remove um a um
      if (massaError.response?.status === 404 || massaError.response?.status === 405) {
        const resultados = {
          sucesso: [],
          falhas: []
        };
        for (const vinc of vinculosFiltrados) {
          try {
            // Remove por produto e fornecedor
            await api.delete(`/vinculos/${vinc.id_produto}?fornecedor=${vinc.id_fornecedor}`);
            resultados.sucesso.push(vinc);
          } catch (err) {
            resultados.falhas.push({ ...vinc, erro: err.message });
          }
        }
        return resultados;
      }
      throw massaError;
    }
  } catch (error) {
    throw error.response?.data || new Error('Erro ao remover vínculos em massa');
  }
};

// Remover todos os vínculos de um produto
export const deleteVinculosPorProduto = async (produtoId) => {
  try {
    const response = await api.delete(`/vinculos/produto/${produtoId}`);
    
    return response.data;
  } catch (error) {
    
    if (error.response?.status === 404) {
      throw new Error('Produto não encontrado ou sem vínculos');
    } else if (error.response?.status === 403) {
      throw new Error('Você não tem permissão para remover estes vínculos');
    }
    
    throw error.response?.data || new Error('Erro ao remover vínculos do produto');
  }
};

// Definir fornecedor principal para um produto
export const setVinculoPrincipal = async (id_produto, id_fornecedor) => {
  try {
    const response = await api.put(`/vinculos/${id_produto}/${id_fornecedor}/principal`);
    
    return response.data;
  } catch (error) {
    
    if (error.response?.status === 404) {
      throw new Error('Vínculo não encontrado');
    } else if (error.response?.status === 403) {
      throw new Error('Permissão negada');
    }
    
    throw error.response?.data || new Error('Erro ao definir fornecedor principal');
  }
};

// Obter histórico de vínculos
export const getHistoricoVinculos = async (produtoId = null) => {
  try {
    let url = '/vinculos/historico';
    if (produtoId) {
      url += `?produto_id=${produtoId}`;
    }
    
    const response = await api.get(url);
    
    return response.data;
  } catch (error) {
    throw error.response?.data || new Error('Erro ao buscar histórico de vínculos');
  }
};

export const getProdutosDisponiveis = async () => {
  try {
    const response = await api.get('/produtos/disponiveis');
    
    const data = response.data;
    const produtos = Array.isArray(data) ? data : (data?.produtos || data?.data || []);
    
    return produtos;
  } catch (error) {
    if (error.response?.status === 404) {
      return [];
    }
    
    throw error.response?.data || new Error('Erro ao buscar produtos disponíveis');
  }
};

// Aliases para compatibilidade
export const createVinculoProduto = createVinculo;
export const deleteVinculoProduto = deleteVinculo;
export const getVinculosProduto = getVinculosPorProduto;

export default api;