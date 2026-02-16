# 📋 Documentação de Endpoints - Sistema de Pedidos

## 🎯 Visão Geral

Sistema completo de gerenciamento de pedidos com autenticação JWT e controle de acesso baseado em perfis de usuário.

---

## 🔐 Autenticação

**Todas as rotas requerem autenticação via JWT Token no header:**

```
Authorization: Bearer {token}
```

---

## 📡 Endpoints Disponíveis

### 1. **Listar Todos os Pedidos (Executivo)**

```http
GET /api/pedidos
```

**Permissão:** Apenas usuários com nível `executivo`

**Query Parameters:**
- `status` - Filtrar por status (pendente, confirmado, em_separacao, em_transito, entregue, cancelado)
- `data_inicio` - Data inicial (formato: YYYY-MM-DD)
- `data_fim` - Data final (formato: YYYY-MM-DD)

**Função Frontend:**
```javascript
import { getAllPedidos } from './services/api';

const pedidos = await getAllPedidos({ 
  status: 'pendente',
  data_inicio: '2026-01-01' 
});
```

**Resposta:**
```json
{
  "success": true,
  "pedidos": [
    {
      "id": 1,
      "usuario_id": 5,
      "fornecedor_id": 2,
      "status": "pendente",
      "valor_total": 299.90,
      "itens": [...],
      "endereco_entrega": "...",
      "criado_em": "2026-02-15T10:30:00Z"
    }
  ],
  "total": 150
}
```

---

### 2. **Meus Pedidos (Usuário Comum)**

```http
GET /api/pedidos/meus
```

**Permissão:** Qualquer usuário autenticado

**Query Parameters:**
- `status` - Filtrar por status
- `limite` - Número de resultados (padrão: 50)

**Função Frontend:**
```javascript
import { getMeusPedidos } from './services/api';

const meusPedidos = await getMeusPedidos({ status: 'em_transito' });
```

**Resposta:**
```json
{
  "success": true,
  "pedidos": [
    {
      "id": 10,
      "produto_nome": "Tênis Nike Air Max",
      "fornecedor_nome": "Nike Store",
      "status": "em_transito",
      "quantidade": 1,
      "preco_unitario": 299.90,
      "valor_total": 299.90,
      "endereco_entrega": "Rua das Flores, 123",
      "criado_em": "2026-02-15T10:30:00Z"
    }
  ]
}
```

---

### 3. **Pedidos Recebidos (Fornecedor)**

```http
GET /api/pedidos/recebidos
```

**Permissão:** Apenas usuários com nível `fornecedor`

**Query Parameters:**
- `status` - Filtrar por status
- `limite` - Número de resultados

**Função Frontend:**
```javascript
import { getPedidosRecebidos } from './services/api';

const pedidosRecebidos = await getPedidosRecebidos({ status: 'pendente' });
```

**Resposta:**
```json
{
  "success": true,
  "pedidos": [
    {
      "id": 10,
      "cliente_nome": "João Silva",
      "produto_nome": "Tênis Nike Air Max",
      "status": "pendente",
      "quantidade": 2,
      "valor_total": 599.80,
      "telefone_contato": "(11) 99999-9999",
      "criado_em": "2026-02-15T10:30:00Z"
    }
  ]
}
```

---

### 4. **Detalhes do Pedido**

```http
GET /api/pedidos/{id}
```

**Permissão:** 
- Cliente: apenas seus próprios pedidos
- Fornecedor: pedidos de seus produtos
- Executivo: qualquer pedido

**Função Frontend:**
```javascript
import { getPedido } from './services/api';

const pedido = await getPedido(10);
```

**Resposta:**
```json
{
  "success": true,
  "pedido": {
    "id": 10,
    "usuario_id": 5,
    "fornecedor_id": 2,
    "status": "confirmado",
    "itens": [
      {
        "produto_id": 15,
        "produto_nome": "Tênis Nike Air Max",
        "quantidade": 2,
        "preco_unitario": 299.90
      }
    ],
    "valor_total": 599.80,
    "endereco_entrega": "Rua das Flores, 123, São Paulo-SP",
    "telefone_contato": "(11) 99999-9999",
    "observacoes": "Entregar após 18h",
    "criado_em": "2026-02-15T10:30:00Z",
    "atualizado_em": "2026-02-15T11:00:00Z"
  }
}
```

---

### 5. **Criar Novo Pedido**

```http
POST /api/pedidos
```

**Permissão:** Usuários com nível `comum`

**Body:**
```json
{
  "itens": [
    {
      "produto_id": 15,
      "quantidade": 2,
      "preco_unitario": 299.90
    }
  ],
  "endereco_entrega": "Rua das Flores, 123, Bairro Centro, São Paulo-SP, 01234-567",
  "telefone_contato": "(11) 99999-9999",
  "observacoes": "Entregar após 18h"
}
```

**Função Frontend:**
```javascript
import { createPedido } from './services/api';

const novoPedido = await createPedido({
  itens: [
    {
      produto_id: 15,
      quantidade: 2,
      preco_unitario: 299.90
    }
  ],
  endereco_entrega: "Rua das Flores, 123, Bairro Centro, São Paulo-SP, 01234-567",
  telefone_contato: "(11) 99999-9999",
  observacoes: "Entregar após 18h"
});
```

**Validações Frontend:**
- ✅ Itens não podem estar vazios
- ✅ Endereço de entrega é obrigatório (deve ser string completa)
- ✅ Telefone de contato é obrigatório

**Resposta:**
```json
{
  "success": true,
  "message": "Pedido criado com sucesso",
  "pedido_id": 10,
  "valor_total": 599.80
}
```

---

### 6. **Atualizar Status do Pedido**

```http
PUT /api/pedidos/{id}/status
```

**Permissão:**
- Fornecedor: pedidos de seus produtos
- Executivo: qualquer pedido

**Body:**
```json
{
  "status": "em_separacao",
  "observacao": "Produto separado, aguardando transportadora"
}
```

**Status Válidos:**
- `pendente` - Aguardando confirmação do fornecedor
- `confirmado` - Pedido confirmado pelo fornecedor
- `em_separacao` - Produto sendo separado
- `em_transito` - Em rota de entrega
- `entregue` - Entregue ao cliente
- `cancelado` - Pedido cancelado

**Função Frontend:**
```javascript
import { updateStatusPedido } from './services/api';

await updateStatusPedido(10, 'em_separacao', 'Produto separado');
```

**Validações:**
- ✅ Status deve estar na lista de valores válidos
- ✅ Transições de status devem seguir fluxo lógico

**Resposta:**
```json
{
  "success": true,
  "message": "Status atualizado com sucesso",
  "status_anterior": "confirmado",
  "status_novo": "em_separacao"
}
```

---

### 7. **Cancelar Pedido**

```http
PUT /api/pedidos/{id}/cancelar
```

**Permissão:** 
- Cliente: apenas seus próprios pedidos (antes de "em_transito")
- Executivo: qualquer pedido

**Body:**
```json
{
  "motivo": "Cliente desistiu da compra"
}
```

**Função Frontend:**
```javascript
import { cancelarPedido } from './services/api';

await cancelarPedido(10, 'Cliente desistiu da compra');
```

**Restrições:**
- ❌ Pedidos com status "entregue" não podem ser cancelados
- ❌ Pedidos "em_transito" só podem ser cancelados por executivos

**Resposta:**
```json
{
  "success": true,
  "message": "Pedido cancelado com sucesso",
  "pedido_id": 10,
  "motivo_cancelamento": "Cliente desistiu da compra"
}
```

---

## 🔒 Regras de Segurança

### Controle de Acesso por Nível

| Recurso | Comum | Fornecedor | Executivo |
|---------|-------|------------|-----------|
| Criar pedido | ✅ | ❌ | ✅ |
| Ver meus pedidos | ✅ | ✅ | ✅ |
| Ver pedidos recebidos | ❌ | ✅ | ✅ |
| Ver todos os pedidos | ❌ | ❌ | ✅ |
| Atualizar status | ❌ | ✅ (seus) | ✅ (todos) |
| Cancelar pedido | ✅ (seus) | ❌ | ✅ (todos) |

---

## 📊 Log de Atividades

Todas as operações são registradas com:

- 🛒 Criação de pedidos
- 🔄 Mudanças de status
- ❌ Cancelamentos
- 🔍 Consultas de pedidos
- ⚠️ Tentativas de acesso não autorizado

**Exemplo de Log:**
```
[2026-02-15 10:30:00] [API] 🛒 Criando pedido com 2 item(ns)
[2026-02-15 10:30:01] [API] ✅ Pedido criado com sucesso - ID: 10
[2026-02-15 11:00:00] [API] 🔄 Atualizando status do pedido: 10 para: confirmado
[2026-02-15 11:00:01] [API] ✅ Status do pedido 10 atualizado para: confirmado
```

---

## 🚨 Tratamento de Erros

### Códigos de Status HTTP

| Código | Significado | Tratamento |
|--------|-------------|------------|
| 200 | Sucesso | Operação concluída |
| 400 | Bad Request | Dados inválidos |
| 401 | Unauthorized | Token inválido/expirado |
| 403 | Forbidden | Sem permissão |
| 404 | Not Found | Recurso não encontrado |
| 500 | Server Error | Erro no servidor |

### Mensagens de Erro Frontend

```javascript
try {
  await createPedido(data);
} catch (error) {
  // Erros específicos tratados no frontend:
  // - "O pedido deve conter pelo menos um item"
  // - "Endereço de entrega é obrigatório"
  // - "Telefone de contato é obrigatório"
  // - "Dados do pedido inválidos"
  // - "Você não tem permissão para criar pedidos"
  
  console.error('Erro ao criar pedido:', error.message);
}
```

---

## 💡 Exemplos de Uso Completo

### Fluxo de Compra (Usuário Comum)

```javascript
import { createPedido, getMeusPedidos } from './services/api';

// 1. Criar pedido
const pedido = await createPedido({
  itens: [{ produto_id: 15, quantidade: 2, preco_unitario: 299.90 }],
  endereco_entrega: "Rua das Flores, 123, Centro, São Paulo-SP, 01234-567",
  telefone_contato: "(11) 99999-9999"
});

console.log('Pedido criado:', pedido.pedido_id);

// 2. Acompanhar pedidos
const meusPedidos = await getMeusPedidos();
console.log('Meus pedidos:', meusPedidos.pedidos);
```

### Gerenciamento (Fornecedor)

```javascript
import { getPedidosRecebidos, updateStatusPedido } from './services/api';

// 1. Ver pedidos pendentes
const pedidosPendentes = await getPedidosRecebidos({ status: 'pendente' });

// 2. Confirmar pedido
await updateStatusPedido(10, 'confirmado', 'Produto disponível em estoque');

// 3. Atualizar para em separação
await updateStatusPedido(10, 'em_separacao', 'Separando itens do pedido');
```

### Administração (Executivo)

```javascript
import { getAllPedidos, getPedido, cancelarPedido } from './services/api';

// 1. Ver todos os pedidos
const todosPedidos = await getAllPedidos({ status: 'pendente' });

// 2. Ver detalhes específicos
const pedido = await getPedido(10);

// 3. Cancelar se necessário
await cancelarPedido(10, 'Fraude detectada');
```

---

## 🔄 Fluxo de Status do Pedido

```
pendente → confirmado → em_separacao → em_transito → entregue
    ↓           ↓             ↓              ↓
          cancelado ←←←←←←←←←←←
```

**Regras de Transição:**
- Pedidos entregues não podem ser cancelados
- Apenas fornecedores podem mover para "confirmado"
- Apenas fornecedores podem mover para "em_separacao"
- Status deve seguir ordem lógica

---

## 📈 Estatísticas (Fornecedor)

```javascript
import { getEstatisticasPedidos } from './services/api';

const stats = await getEstatisticasPedidos('30d');
console.log('Total de pedidos:', stats.total_pedidos);
console.log('Receita total:', stats.receita_total);
```

**Resposta:**
```json
{
  "total_pedidos": 150,
  "pedidos_pendentes": 12,
  "pedidos_confirmados": 35,
  "pedidos_entregues": 98,
  "pedidos_cancelados": 5,
  "receita_total": 45750.80,
  "receita_mes_atual": 8945.50,
  "ticket_medio": 305.00
}
```

---

## ✅ Checklist de Implementação

- [x] **GET** /api/pedidos - getAllPedidos()
- [x] **GET** /api/pedidos/meus - getMeusPedidos()
- [x] **GET** /api/pedidos/recebidos - getPedidosRecebidos()
- [x] **GET** /api/pedidos/{id} - getPedido()
- [x] **POST** /api/pedidos - createPedido()
- [x] **PUT** /api/pedidos/{id}/status - updateStatusPedido()
- [x] **PUT** /api/pedidos/{id}/cancelar - cancelarPedido()
- [x] Validações frontend
- [x] Tratamento de erros
- [x] Log de atividades
- [x] Documentação completa

---

**Última Atualização:** 15 de fevereiro de 2026  
**Versão:** 1.0.0  
**Status:** ✅ Totalmente Implementado e Testado
