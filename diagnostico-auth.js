/**
 * 🔍 Script de Diagnóstico - Autenticação
 * 
 * Execute este código no console do navegador (F12) para diagnosticar problemas de autenticação
 * 
 * Como usar:
 * 1. Abra o navegador em http://localhost:3000
 * 2. Pressione F12 para abrir DevTools
 * 3. Vá na aba "Console"
 * 4. Cole todo este código e pressione Enter
 */

(async function diagnosticarAutenticacao() {
  console.clear();
  console.log('='.repeat(70));
  console.log('🔍 DIAGNÓSTICO DE AUTENTICAÇÃO - TÊNIS CLUB');
  console.log('='.repeat(70));
  console.log();

  // 1. Verificar localStorage
  console.log('📦 PASSO 1: Verificando localStorage');
  console.log('-'.repeat(70));
  
  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');
  
  if (!token) {
    console.error('❌ Token NÃO encontrado no localStorage');
    console.log('💡 Solução: Faça login novamente');
    console.log();
  } else {
    console.log('✅ Token encontrado:', token.substring(0, 50) + '...');
    
    // Tentar decodificar o token
    try {
      const parts = token.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(atob(parts[1]));
        console.log('📄 Payload do token:', payload);
        
        if (payload.exp) {
          const expDate = new Date(payload.exp * 1000);
          const now = new Date();
          const isExpired = expDate < now;
          
          console.log('⏰ Expiração:', expDate.toLocaleString());
          console.log(isExpired ? '❌ Token EXPIRADO' : '✅ Token VÁLIDO');
        }
      }
    } catch (e) {
      console.warn('⚠️  Não foi possível decodificar o token:', e.message);
    }
  }
  
  if (userStr) {
    console.log('👤 Dados do usuário no localStorage:');
    console.log(JSON.parse(userStr));
  } else {
    console.warn('⚠️  Dados do usuário não encontrados no localStorage');
  }
  console.log();

  // 2. Testar conexão com backend
  console.log('🌐 PASSO 2: Testando conexão com o backend');
  console.log('-'.repeat(70));
  
  try {
    const backendUrl = 'http://localhost:8000/api/usuarios/validar-token';
    console.log('🔗 URL:', backendUrl);
    console.log('🔑 Token:', token ? 'Enviando...' : 'Nenhum token para enviar');
    
    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
      }
    });
    
    console.log('📡 Status da resposta:', response.status, response.statusText);
    
    if (response.status === 501) {
      console.error('❌ ERRO 501 - Not Implemented');
      console.log();
      console.log('🔧 O PROBLEMA:');
      console.log('   O backend PHP não implementou o endpoint /api/usuarios/validar-token');
      console.log();
      console.log('💡 SOLUÇÃO:');
      console.log('   1. Abra o arquivo: IMPLEMENTAR_VALIDAR_TOKEN.md');
      console.log('   2. Copie o código PHP fornecido');
      console.log('   3. Crie o endpoint no backend');
      console.log('   4. Reinicie o servidor PHP');
      console.log();
    } else if (response.status === 200) {
      const data = await response.json();
      console.log('✅ Resposta bem-sucedida!');
      console.log('📦 Dados recebidos:', data);
      
      if (data.valid) {
        console.log('🎉 Token VÁLIDO!');
        console.log('👤 Usuário:', data.user);
      } else {
        console.warn('⚠️  Token inválido segundo o backend');
      }
    } else if (response.status === 401) {
      console.warn('⚠️  Backend retornou 401 Unauthorized');
      const data = await response.json();
      console.log('📦 Mensagem:', data);
      console.log('💡 O token pode estar expirado ou inválido');
    } else if (response.status === 404) {
      console.error('❌ ERRO 404 - Endpoint não encontrado');
      console.log('🔧 Verifique se o backend tem a rota: /api/usuarios/validar-token');
    } else {
      const text = await response.text();
      console.warn('⚠️  Resposta inesperada:', text);
    }
    
  } catch (error) {
    console.error('❌ ERRO ao conectar com o backend:', error.message);
    
    if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
      console.log();
      console.log('🔧 O PROBLEMA:');
      console.log('   O backend PHP não está rodando ou não está acessível');
      console.log();
      console.log('💡 SOLUÇÕES:');
      console.log('   1. Verifique se o backend está rodando na porta 8000');
      console.log('   2. Comando: php -S localhost:8000 -t caminho/do/backend');
      console.log('   3. Teste manualmente: http://localhost:8000');
      console.log();
    }
  }
  console.log();

  // 3. Verificar CORS
  console.log('🌍 PASSO 3: Verificando CORS');
  console.log('-'.repeat(70));
  
  try {
    const response = await fetch('http://localhost:8000/api/usuarios/validar-token', {
      method: 'OPTIONS',
      headers: {
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'authorization'
      }
    });
    
    const corsHeaders = {
      'Access-Control-Allow-Origin': response.headers.get('Access-Control-Allow-Origin'),
      'Access-Control-Allow-Methods': response.headers.get('Access-Control-Allow-Methods'),
      'Access-Control-Allow-Headers': response.headers.get('Access-Control-Allow-Headers'),
    };
    
    console.log('📋 Headers CORS:', corsHeaders);
    
    if (corsHeaders['Access-Control-Allow-Origin']) {
      console.log('✅ CORS configurado');
    } else {
      console.warn('⚠️  CORS pode não estar configurado corretamente');
    }
  } catch (error) {
    console.warn('⚠️  Não foi possível verificar CORS:', error.message);
  }
  console.log();

  // 4. Resumo e Recomendações
  console.log('='.repeat(70));
  console.log('📊 RESUMO E RECOMENDAÇÕES');
  console.log('='.repeat(70));
  
  const problems = [];
  const solutions = [];
  
  if (!token) {
    problems.push('❌ Token não encontrado no localStorage');
    solutions.push('Faça login novamente no sistema');
  }
  
  console.log();
  console.log('🔍 PROBLEMAS IDENTIFICADOS:');
  if (problems.length === 0) {
    console.log('   ✅ Nenhum problema crítico no frontend');
    console.log('   ⚠️  O problema está no BACKEND: endpoint não implementado (501)');
  } else {
    problems.forEach(p => console.log('   ' + p));
  }
  
  console.log();
  console.log('💡 PRÓXIMOS PASSOS:');
  console.log('   1. Leia o arquivo: IMPLEMENTAR_VALIDAR_TOKEN.md');
  console.log('   2. Implemente o endpoint no backend PHP');
  console.log('   3. Configure os headers CORS no backend');
  console.log('   4. Reinicie o servidor backend');
  console.log('   5. Recarregue esta página (Ctrl+R)');
  console.log('   6. Execute este script novamente');
  
  console.log();
  console.log('='.repeat(70));
  console.log('✅ DIAGNÓSTICO CONCLUÍDO');
  console.log('='.repeat(70));
  console.log();
  console.log('💬 Cole a saída acima ao reportar problemas!');
  console.log();
})();
