# 🗃️ Schema do Banco de Dados - Sistema Atual

## 📋 Visão Geral
O sistema foi atualizado para usar o novo schema do banco de dados `tenis_club` com relacionamentos adequados entre usuários e fornecedores.

## 🏗️ Estrutura Principal

### 👥 Tabela `usuarios`
```sql
CREATE TABLE usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL,
    nivel ENUM('comum', 'fornecedor', 'executivo') NOT NULL DEFAULT 'comum',
    fornecedor_id INT NULL, -- 🔑 CHAVE PARA RELACIONAMENTO
    status ENUM('ativo', 'inativo', 'suspenso') NOT NULL DEFAULT 'ativo',
    -- outros campos...
)
```

### 🏪 Tabela `fornecedores`
```sql
CREATE TABLE fornecedores (
    id INT AUTO_INCREMENT PRIMARY KEY, -- 🔗 REFERENCIADO POR usuarios.fornecedor_id
    nome VARCHAR(150) NOT NULL,
    cnpj VARCHAR(20),
    email VARCHAR(150),
    telefone VARCHAR(30),
    endereco VARCHAR(255),
    status ENUM('Ativo', 'Inativo') NOT NULL DEFAULT 'Ativo',
    -- outros campos...
)
```

## 🔗 Relacionamento JWT → Usuário → Fornecedor

### 🔄 Fluxo de Autenticação
1. **Login:** Usuário faz login → Recebe JWT
2. **JWT:** Contém `user_id`, `nivel`, `fornecedor_id` (se existir)
3. **Validação:** Sistema busca dados em `usuarios` onde `id = user_id`
4. **Loja:** Se `usuarios.fornecedor_id != NULL`, busca em `fornecedores` onde `id = fornecedor_id`

### 📊 Cenários Possíveis

| Situação | usuarios.nivel | usuarios.fornecedor_id | Resultado |
|----------|----------------|------------------------|-----------|
| **Usuário Comum** | `comum` | `NULL` | Acesso limitado |
| **Fornecedor sem Loja** | `fornecedor` | `NULL` | ⚠️ Precisa cadastrar loja |
| **Fornecedor com Loja** | `fornecedor` | `123` | ✅ Acesso completo ao painel |

## 🐛 Debugging - Usuário HUGO

### 🔍 Situação Atual
- ✅ **JWT:** Válido e ativo
- ✅ **Nível:** `fornecedor` 
- ❌ **fornecedor_id:** Provavelmente `NULL`
- 🏪 **Status:** Sem loja associada

### 💡 Solução
```javascript
// 1. Cadastrar loja via FormulárioAtualizarCADASTRAR LOJA
// 2. Backend deve:
//    a) Criar registro em `fornecedores`
//    b) Atualizar `usuarios.fornecedor_id = fornecedores.id`
//    c) Regenerar JWT com novo fornecedor_id
```

## 🛠️ Ferramentas de Debug

### 🧪 Console do Navegador
```javascript
// Testar dados do usuário
window.debugMinhaLoja?.dadosUsuario();

// Validar schema do banco
window.debugMinhaLoja?.validarEsquemaBanco();

// Testar endpoints
window.debugMinhaLoja?.testarEndpoints();

// Diagnóstico completo
window.debugMinhaLoja?.testarConexaoBD();
```

### 📋 Verificações Manuais
1. **F12 → Console:** Executar funções de debug
2. **Network Tab:** Verificar requests para `/api/fornecedores/minha-loja`
3. **Application Tab:** Verificar JWT no localStorage

## 🚀 Próximos Passos

### Para o Usuário HUGO:
1. **Clicar em:** "🏪 Cadastrar Minha Loja Agora"
2. **Preencher:** Dados da loja (nome, email, CNPJ, telefone)
3. **Aguardar:** Criação do registro + atualização do usuário
4. **Acessar:** Painel completo em "Minha Loja"

### Para Desenvolvimento:
- [ ] Verificar se backend atualiza `usuarios.fornecedor_id` após cadastro
- [ ] Confirmar regeneração de JWT com novo `fornecedor_id`
- [ ] Testar cenário completo: Cadastro → Login → Painel

## 🔧 Comandos Úteis

### SQL para Verificação Manual
```sql
-- Ver usuário específico
SELECT * FROM usuarios WHERE email = 'hugo@email.com';

-- Ver fornecedores
SELECT * FROM fornecedores ORDER BY id DESC;

-- Verificar relacionamento
SELECT u.nome, u.nivel, u.fornecedor_id, f.nome as loja_nome 
FROM usuarios u 
LEFT JOIN fornecedores f ON u.fornecedor_id = f.id 
WHERE u.email = 'hugo@email.com';
```

---
📅 **Última atualização:** 15 de fevereiro de 2026
🏗️ **Schema:** `tenis_club` database
🔧 **Status:** Sistema otimizado para novo schema