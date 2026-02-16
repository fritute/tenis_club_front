# CORREÇÕES NECESSÁRIAS NO BACKEND

## 🚨 Problemas Identificados nos Logs

### 1. **Warnings PHP Corrompendo JSON** ⚠️
**Problema**: O backend está retornando HTML warnings misturado com JSON
```
<b>Warning</b>: Undefined array key "nivel" in <b>C:\Users\Gustavo\Documents\Codigos\virtual market\back end\models\UsuarioModel.php</b> on line <b>164</b><br />
```

**Solução**: No arquivo `UsuarioModel.php` linha 164:
```php
// ❌ Antes (causa warning)
$nivel = $dados['nivel'];

// ✅ Depois (sem warning)  
$nivel = $dados['nivel'] ?? null;
// ou
$nivel = isset($dados['nivel']) ? $dados['nivel'] : null;
```

### 2. **Headers Já Enviados** ⚠️
**Problema**: 
```
Warning: http_response_code(): Cannot set response code - headers already sent
Warning: Cannot modify header information - headers already sent
```

**Solução**: No `BaseController.php` e outros arquivos PHP:
- Certifique-se que não há `echo`, `print`, ou output antes de `json_encode()` 
- Use `ob_start()` no início dos arquivos se necessário
- Remova qualquer BOM ou espaços em branco no início dos arquivos PHP

### 3. **CORS Não Configurado** 🔒
**Problema**: 
```
Access to XMLHttpRequest from origin 'http://localhost:3000' has been blocked by CORS policy
```

**Solução**: Adicionar no `.htaccess` do backend ou no arquivo principal:
```apache
# .htaccess
Header always set Access-Control-Allow-Origin "http://localhost:3000"
Header always set Access-Control-Allow-Methods "GET, POST, OPTIONS, DELETE, PUT"
Header always set Access-Control-Allow-Headers "Content-Type, Authorization"
Header always set Access-Control-Allow-Credentials "true"

# Para requisições OPTIONS (preflight)
RewriteCond %{REQUEST_METHOD} OPTIONS
RewriteRule ^(.*)$ $1 [R=200,L]
```

**OU** no PHP (início de cada arquivo de API):
```php
<?php
// Configurar CORS
header('Access-Control-Allow-Origin: http://localhost:3000');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS, DELETE, PUT');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Credentials: true');

// Tratar requisições OPTIONS (preflight)
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}
?>
```

### 4. **Field 'nivel' Ausente na Base de Dados** 🗄️
**Problema**: O campo `nivel` não existe ou não está sendo definido

**Solução**: 
1. **Verificar tabela de usuários**:
```sql
ALTER TABLE usuarios ADD COLUMN nivel ENUM('comum', 'fornecedor', 'executivo') DEFAULT 'comum';
```

2. **Atualizar usuários existentes**:
```sql
UPDATE usuarios SET nivel = 'comum' WHERE nivel IS NULL;
```

### 5. **Rotas Não Implementadas** 🛤️
**Problema**: Algumas rotas retornam 404:
- `/api/pedidos/meus` - não implementada
- `/api/pedidos` (POST) - criação de pedidos não implementada
- `/api/produtos` - problemas de CORS
- `/api/usuarios/cadastro` - cadastro de usuários não implementado
- `/api/fornecedores/loja` - cadastro de loja para fornecedores não implementado

**Solução**: Implementar as rotas faltantes no backend

### 6. **Rota de Criação de Pedidos** 🛒
**Problema**: 
```
Failed to load resource: the server responded with a status of 404 (Not Found)
[API Response] 404 /pedidos
```

**Solução**: Implementar no backend:
```php
// POST /api/pedidos
// Estrutura esperada:
{
  "produto_id": 1,
  "quantidade": 2,
  "endereco_entrega": "...",
  "telefone_contato": "...",
  "observacoes": "..."
}
```

### 7. **Rotas de Cadastro de Usuários** 👥
**Problema**: Sistema de cadastro implementado no frontend mas rotas não existem

**Solução**: Implementar no backend:
```php
// POST /api/usuarios/cadastro
// Estrutura esperada:
{
  "nome": "João Silva",
  "email": "joao@email.com", 
  "senha": "123456",
  "nivel": "comum|fornecedor|executivo",
  "telefone": "(11) 99999-9999",
  "endereco": "Rua das Flores, 123"
}

// POST /api/fornecedores/loja  
// Estrutura esperada (para fornecedores):
{
  "fornecedor_id": 1,
  "razao_social": "Empresa LTDA",
  "nome_fantasia": "Loja Virtual",
  "cnpj": "00.000.000/0000-00",
  "descricao": "Descrição da loja",
  "telefone": "(11) 99999-9999",
  "endereco": {...},
  "categorias_produtos": [],
  "site": "https://...",
  "whatsapp": "(11) 99999-9999"
}
```

## ✅ Melhorias Implementadas no Frontend

1. **Limpeza de respostas JSON corrompidas** - `api.js` agora extrai JSON válido de respostas com warnings HTML
2. **Melhor tratamento de erros de login** - verificações mais robustas em `Login.js`
3. **Logs melhorados** - mensagens mais claras sobre problemas de CORS e conectividade
4. **Sistema de Cadastro Completo**:
   - 📝 Componente `Register.js` - Cadastro de usuários com 2 etapas
   - 🏪 Componente `CadastroLoja.js` - Cadastro específico para fornecedores
   - 🔄 Fluxo inteligente: usuários comuns → login direto, fornecedores → cadastro da loja
   - 🎨 Interface moderna com progress bar e validações
5. **Novas Funcionalidades**:
   - ✨ Cadastro de usuários (comum/fornecedor)
   - 🏢 Cadastro detalhado de loja para fornecedores
   - 📱 Formatação automática de CNPJ e CEP
   - 🏷️ Seleção de categorias de produtos
   - ⏭️ Opção de "Pular por Agora" no cadastro da loja

## 🔧 Instruções de Testes

### Diagnóstico Automático da API
Uma função de diagnóstico foi adicionada para facilitar a identificação de problemas:

1. **No console do navegador (F12)**, execute:
```javascript
diagnosticarAPI().then(resultado => console.table(resultado))
```

2. **Interprete os resultados**:
   - ✅ **Sucessos**: Funcionalidades que estão operando corretamente
   - ❌ **Problemas**: Erros identificados que precisam ser corrigidos
   - 🔧 **Recomendações**: Ações sugeridas para resolver os problemas

### Testes Manuais
1. **Após implementar as correções do backend**, teste o login
2. **Verifique se os warnings PHP desapareceram** dos logs
3. **Confirme se as rotas de produtos funcionam** sem erro CORS
4. **Teste diferentes níveis de usuário** (comum, fornecedor, executivo)
5. **Teste o sistema de cadastro**:
   - ✅ Cadastro de usuário comum → deve ir direto para o sistema
   - ✅ Cadastro de fornecedor → deve ir para tela de cadastro da loja
   - ✅ Opção "Pular por agora" → deve funcionar para fornecedores
   - ✅ Formatação automática de CNPJ e CEP
   - ✅ Seleção múltipla de categorias de produtos

### Ordem Recomendada de Correções
1. 🚨 **PHP Warnings** (mais urgente - corrompem o JSON)
2. 🔒 **CORS** (bloqueia requisições)
3. 🗄️ **Campo 'nivel'** (funcionalidade de usuários)
4. � **Rotas de cadastro** (POST /usuarios/cadastro e /fornecedores/loja)
5. 🛤️ **Outras rotas faltantes** (pedidos, etc.)

---

**Nota**: 
- ✅ **Frontend totalmente atualizado** com sistema completo de cadastro de usuários e lojas
- 🔧 **Backend precisa implementar** as rotas de cadastro documentadas acima
- 📋 **Consulte este documento** para resolver todos os problemas identificados
- 🎯 **Priorize a correção dos PHP Warnings** - eles corrompem todas as respostas JSON