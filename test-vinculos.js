
const axios = require('axios');

const API_BASE_URL = 'http://localhost:8000/api';

async function testarVinculos() {
  try {
    // 1. Pegar um produto qualquer
    console.log('Buscando produtos...');
    // Como /produtos deu erro 500, vamos tentar listar categorias ou algo que funcione para pegar um ID, 
    // ou tentar um ID fixo se soubermos.
    // Vamos tentar pegar vinculos direto
    
    console.log('Buscando vinculos...');
    const response = await axios.get(`${API_BASE_URL}/vinculos`);
    const vinculos = response.data.vinculos || response.data;
    
    console.log('Vinculos encontrados:', vinculos);
    
    if (vinculos.length > 0) {
      const produtoId = vinculos[0].produto_id;
      console.log(`Testando getVinculosPorProduto para produto ${produtoId}...`);
      
      const respProduto = await axios.get(`${API_BASE_URL}/vinculos/produto/${produtoId}`);
      console.log('Fornecedores do produto:', respProduto.data);
    } else {
      console.log('Nenhum vinculo encontrado para testar.');
    }
    
  } catch (error) {
    console.error('Erro:', error.response ? error.response.data : error.message);
  }
}

testarVinculos();
