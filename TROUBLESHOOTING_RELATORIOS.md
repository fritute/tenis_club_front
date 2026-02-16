# 🔧 Troubleshooting - Relatórios não Listam Dados

## Problema Relatado
Os relatórios não estão exibindo dados quando você acessa a página de Relatórios.

---

## ✅ Checklist de Diagnóstico

### 1. **Backend está rodando?**

Verifique se o backend PHP está ativo:

```bash
# No diretório do backend, execute:
php -S localhost:8000 -t public
```

Ou se usar outro método, certifique-se que está na **porta 8000**.

**Teste rápido:** Abra no navegador: `http://localhost:8000/api/relatorios`

---

### 2. **Endpoints de Relatórios implementados?**

Verifique se o backend tem os seguintes endpoints:

```
GET /api/relatorios              ← Lista tipos disponíveis
GET /api/relatorios/dashboard    ← KPIs principais
GET /api/relatorios/fornecedores ← Relatório de fornecedores
GET /api/relatorios/produtos     ← Relatório de produtos
GET /api/relatorios/categorias   ← Relatório de categorias
GET /api/relatorios/vinculos     ← Vínculos produto-fornecedor
GET /api/relatorios/financeiro   ← Análise financeira
```

**Como verificar:**
1. Abra o **Postman** ou **Insomnia**
2. Faça uma requisição GET para cada endpoint
3. Veja se retorna JSON com dados

---

### 3. **CORS configurado no backend?**

O backend precisa permitir requisições do frontend.

**No PHP, adicione no início dos arquivos da API:**

```php
<?php
header('Access-Control-Allow-Origin: http://localhost:3000');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Credentials: true');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}
```

---

### 4. **Dados existem no banco?**

Verifique se há registros nas tabelas:

```sql
SELECT COUNT(*) FROM fornecedores;
SELECT COUNT(*) FROM produtos;
SELECT COUNT(*) FROM categorias;
```

Se as tabelas estão vazias, os relatórios não terão dados para exibir.

---

### 5. **Console do Navegador**

Abra o **DevTools** (F12) e vá na aba **Console**:

1. Faça login no sistema
2. Acesse a página **Relatórios**
3. Veja se aparece algum erro vermelho

**Erros comuns:**

- ❌ `Network Error` → Backend não está rodando
- ❌ `CORS Error` → Configuração CORS faltando no backend
- ❌ `404 Not Found` → Endpoint não implementado
- ❌ `401 Unauthorized` → Token JWT inválido
- ❌ `500 Internal Server Error` → Erro no código PHP

---

### 6. **Aba Network do DevTools**

1. Abra **DevTools > Network**
2. Recarregue a página de Relatórios
3. Procure por requisições para `/api/relatorios/*`
4. Clique em cada requisição e veja:
   - **Status:** Deve ser `200 OK`
   - **Response:** Veja o JSON retornado
   - **Headers:** Verifique se CORS está configurado

---

## 🔍 Debugging Passo a Passo

### Teste 1: Backend está vivo?

```bash
curl http://localhost:8000/api/relatorios
```

**Resposta esperada:** JSON com lista de relatórios disponíveis

---

### Teste 2: Dashboard retorna dados?

```bash
curl http://localhost:8000/api/relatorios/dashboard
```

**Resposta esperada:**

```json
{
  "fornecedores_total": 10,
  "produtos_total": 50,
  "categorias_total": 5,
  "top_fornecedores": [...]
}
```

---

### Teste 3: Frontend está fazendo a requisição?

No arquivo [Relatorios.js](src/pages/Relatorios/Relatorios.js), adicione logs:

```javascript
const loadRelatorio = async (tipo) => {
  console.log('🔄 Carregando relatório:', tipo);
  
  try {
    // ... código existente ...
    console.log('✅ Dados recebidos:', data);
  } catch (error) {
    console.error('❌ Erro:', error);
    console.error('📋 Detalhes:', error.response);
  }
};
```

Agora abra o console e veja os logs quando acessar Relatórios.

---

## 🎯 Estrutura Esperada dos Dados

### Dashboard (`/api/relatorios/dashboard`)

```json
{
  "fornecedores_total": 15,
  "produtos_total": 120,
  "categorias_total": 8,
  "top_fornecedores": [
    {
      "nome": "Nike Brasil",
      "total_produtos": 45
    }
  ]
}
```

### Fornecedores (`/api/relatorios/fornecedores`)

```json
{
  "fornecedores": [
    {
      "nome": "Adidas Sports",
      "email": "contato@adidas.com",
      "cnpj": "12.345.678/0001-90",
      "total_produtos": 30,
      "avaliacao": "4.5",
      "status": "Ativo"
    }
  ]
}
```

### Produtos (`/api/relatorios/produtos`)

```json
{
  "produtos": [
    {
      "nome": "Tênis Air Max",
      "categoria_nome": "Esportivo",
      "preco_base": "299.90",
      "total_fornecedores": 3,
      "status": "Ativo"
    }
  ]
}
```

### Categorias (`/api/relatorios/categorias`)

```json
{
  "categorias": [
    {
      "nome": "Casual",
      "total_produtos": 25,
      "preco_minimo": "89.90",
      "preco_maximo": "599.90",
      "preco_medio": "245.50",
      "status": "Ativo"
    }
  ]
}
```

### Financeiro (`/api/relatorios/financeiro`)

```json
{
  "economia_potencial": "R$ 1.250,00 de economia identificada",
  "produtos_multi_fornecedores": [
    {
      "produto_nome": "Tênis Run",
      "total_fornecedores": 5
    }
  ]
}
```

---

## 🚀 Solução Rápida

Se você **ainda não implementou** os endpoints de relatórios no backend:

### Backend PHP - Exemplo Mínimo

Crie o arquivo `/api/relatorios/index.php`:

```php
<?php
require_once '../conexao.php';
require_once '../auth.php';

// CORS
header('Access-Control-Allow-Origin: http://localhost:3000');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json');

// Validar token
$usuario = validarToken();
if (!$usuario) {
    http_response_code(401);
    echo json_encode(['error' => 'Token inválido']);
    exit;
}

// Pegar tipo de relatório
$path = $_SERVER['REQUEST_URI'];
$tipo = basename($path);

switch ($tipo) {
    case 'dashboard':
        echo json_encode([
            'fornecedores_total' => 0,
            'produtos_total' => 0,
            'categorias_total' => 0,
            'top_fornecedores' => []
        ]);
        break;
        
    case 'fornecedores':
        echo json_encode([
            'fornecedores' => []
        ]);
        break;
        
    case 'produtos':
        echo json_encode([
            'produtos' => []
        ]);
        break;
        
    case 'categorias':
        echo json_encode([
            'categorias' => []
        ]);
        break;
        
    case 'financeiro':
        echo json_encode([
            'economia_potencial' => null,
            'produtos_multi_fornecedores' => []
        ]);
        break;
        
    default:
        echo json_encode([
            'relatorios_disponiveis' => [
                'dashboard',
                'fornecedores',
                'produtos',
                'categorias',
                'financeiro'
            ]
        ]);
}
```

---

## 📞 Próximos Passos

1. ✅ Execute o teste: `node test-backend.js`
2. ✅ Abra o DevTools (F12) e veja o console
3. ✅ Verifique a aba Network
4. ✅ Teste os endpoints manualmente no navegador
5. ✅ Leia os logs adicionados ao `Relatorios.js`

---

## 💡 Dica Final

Se os dados ainda não aparecem e **não há erros no console**:

- Verifique se o backend retorna arrays **vazios** (nenhum dado no banco)
- Adicione dados de teste nas tabelas
- Confira o formato JSON retornado
- Teste com um cliente REST (Postman/Insomnia)

---

**Precisa de mais ajuda?** Envie:
- Screenshot do console (F12)
- Screenshot da aba Network
- Saída do comando `node test-backend.js`
