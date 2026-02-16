/**
 * Script de teste para verificar endpoints do backend
 * Execute com: node test-backend.js
 */

const http = require('http');

const BASE_URL = 'localhost';
const BASE_PORT = 8000;

// Função auxiliar para fazer requisições HTTP
function testEndpoint(path, token = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: BASE_URL,
      port: BASE_PORT,
      path: path,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: data
        });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('Timeout - Servidor não respondeu em 5 segundos'));
    });

    req.end();
  });
}

async function runTests() {
  console.log('='.repeat(60));
  console.log('TESTANDO ENDPOINTS DO BACKEND - TÊNIS CLUB');
  console.log('='.repeat(60));
  console.log();

  const endpoints = [
    '/api/relatorios',
    '/api/relatorios/dashboard',
    '/api/relatorios/fornecedores',
    '/api/relatorios/produtos',
    '/api/relatorios/categorias',
    '/api/relatorios/vinculos',
    '/api/relatorios/financeiro',
  ];

  for (const endpoint of endpoints) {
    try {
      console.log(`\n📡 Testando: ${endpoint}`);
      console.log('-'.repeat(60));
      
      const result = await testEndpoint(endpoint);
      
      console.log(`✅ Status: ${result.status}`);
      
      if (result.status === 200) {
        try {
          const jsonData = JSON.parse(result.data);
          console.log(`📦 Dados recebidos:`, JSON.stringify(jsonData, null, 2).substring(0, 500));
          
          if (typeof jsonData === 'object' && jsonData !== null) {
            console.log(`📊 Estrutura:`, Object.keys(jsonData));
          }
        } catch (e) {
          console.log(`⚠️  Resposta não é JSON válido:`, result.data.substring(0, 200));
        }
      } else if (result.status === 401) {
        console.log(`🔒 Endpoint requer autenticação (token JWT)`);
      } else if (result.status === 404) {
        console.log(`❌ Endpoint não encontrado - verifique se o backend implementou esta rota`);
      } else {
        console.log(`⚠️  Resposta:`, result.data.substring(0, 200));
      }
      
    } catch (error) {
      console.log(`❌ ERRO: ${error.message}`);
      
      if (error.code === 'ECONNREFUSED') {
        console.log(`\n⚠️  O BACKEND NÃO ESTÁ RODANDO!`);
        console.log(`   Verifique se o servidor PHP está ativo na porta ${BASE_PORT}`);
        console.log(`   Comando: php -S localhost:${BASE_PORT} -t caminho/do/backend`);
        break;
      }
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('TESTES CONCLUÍDOS');
  console.log('='.repeat(60));
  console.log('\n💡 PRÓXIMOS PASSOS:');
  console.log('   1. Se o backend não está rodando, inicie-o primeiro');
  console.log('   2. Se endpoints retornam 404, confira se estão implementados');
  console.log('   3. Se dados estão vazios, verifique se há registros no banco');
  console.log('   4. Abra o console do navegador (F12) para mais detalhes');
  console.log();
}

// Executar testes
runTests().catch(console.error);
