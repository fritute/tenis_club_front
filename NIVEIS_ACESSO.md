# 🔐 Níveis de Acesso - Tênis Club

## 👥 Tipos de Usuários

### 🔴 EXECUTIVO (Administrador)
**Acesso:** Total ao sistema

**Menu disponível:**
- ✅ Dashboard Executivo
- ✅ Fornecedores (CRUD completo + Ver Produtos)
- ✅ Produtos (CRUD completo, todos os produtos)
- ✅ Categorias (CRUD completo)
- ✅ Relatórios (todos os tipos)

**Funcionalidades:**
- Gerenciar todos os fornecedores
- **Ver produtos de qualquer fornecedor** via botão "Ver Produtos"
- Gerenciar todos os produtos do sistema
- Gerenciar categorias
- Visualizar relatórios completos:
  - Dashboard com KPIs gerais
  - Relatório de fornecedores
  - Relatório de produtos
  - Relatório de categorias
  - Relatório financeiro
  - Relatório de vínculos
- Aprovar/rejeitar cadastros
- Gerenciar usuários (futuro)

**Credenciais de teste:**
```
Email: admin@sistema.com
Senha: admin123
```

---

### 🟡 FORNECEDOR (Vendedor)
**Acesso:** Limitado aos próprios produtos

**Menu disponível:**
- ✅ Dashboard (Painel do Fornecedor)
- ✅ Meus Produtos (apenas produtos dele)
- ✅ Pedidos Recebidos (pedidos dos seus produtos)
- ✅ Categorias (visualização)

**Funcionalidades:**
- Visualizar dashboard com suas estatísticas
- **Gerenciar APENAS seus próprios produtos:**
  - Criar novos produtos
  - Editar seus produtos
  - Deletar seus produtos
  - Upload de múltiplas imagens
- **Visualizar outros fornecedores** e seus produtos via botão "Ver Produtos"
- **Gerenciar pedidos recebidos** dos seus produtos:
  - Ver detalhes dos pedidos
  - Confirmar/recusar pedidos pendentes
  - Marcar pedidos como entregues
  - Upload de imagens dos produtos
- Visualizar categorias disponíveis
- Ver seu desempenho individual

**Restrições:**
- ❌ Não pode ver produtos de outros fornecedores
- ❌ Não pode gerenciar outros fornecedores
- ❌ Não pode criar/editar categorias
- ❌ Não tem acesso a relatórios gerais

**Credenciais de teste:**
```
Email: fornecedor@teste.com
Senha: forn123
```

---

### 🟢 COMUM (Comprador)
**Acesso:** Visualização, compra e gerenciamento de pedidos

**Menu disponível:**
- ✅ Dashboard (Painel do Comprador)
- ✅ Fornecedores (**Ver Produtos** de cada fornecedor)
- ✅ Produtos (visualização + **botão Comprar**)
- ✅ Meus Pedidos (acompanhar pedidos realizados)

**Funcionalidades:**
- **Explorar fornecedores:**
  - Listar todos os fornecedores disponíveis
  - **Clicar em "Ver Produtos"** para ver detalhes da empresa
  - Visualizar informações completas: nome, email, telefone, CNPJ, endereço
  - **Ver todos os produtos disponíveis** daquele fornecedor
- **Navegar produtos:**
  - Visualizar todos os produtos do sistema
  - Ver detalhes: nome, descrição, preço, estoque, categoria
  - **Botão "Comprar"** em cada produto
- **Sistema de compras:**
  - **Modal de compra completo** com:
    - Informações do produto
    - Campo quantidade
    - Endereço de entrega obrigatório
    - Telefone para contato obrigatório
    - Observações opcionais
    - Resumo do pedido com total calculado
  - **Processamento automático** do pedido
- **Gerenciar pedidos:**
  - Ver **todos os pedidos realizados**
  - Status: Pendente → Confirmado → Entregue
  - Detalhes completos de cada pedido
  - **Cancelar pedidos pendentes**
  - Filtros por status e busca
- Visualizar dashboard personalizado
- Ver categorias disponíveis

**Restrições:**
- ❌ **Não pode** criar, editar ou deletar produtos
- ❌ **Não pode** criar, editar ou deletar fornecedores
- ❌ **Não pode** gerenciar categorias
- ❌ **Não tem** acesso a relatórios administrativos
- ❌ **Não pode** gerenciar pedidos de outros usuários
- ✅ **Pode** visualizar informações públicas (fornecedores, produtos, categorias)
- ✅ **Pode** realizar compras e gerenciar seus próprios pedidos

**Credenciais de teste:**
```
Email: usuario@teste.com
Senha: user123
```
  - Solicitar parceria com fornecedores
  - Negociar preços
  - Ver histórico de compras
- Dashboard com estatísticas personalizadas

**Restrições:**
- ❌ Não pode criar/editar produtos
- ❌ Não pode gerenciar fornecedores
- ❌ Não pode criar/editar categorias
- ❌ Não tem acesso a relatórios administrativos

**Credenciais de teste:**
```
Email: usuario@teste.com
Senha: user123
```

---

## 📊 Comparação de Funcionalidades

| Funcionalidade | Executivo | Fornecedor | Comum |
|----------------|-----------|------------|-------|
| Ver Dashboard | ✅ Completo | ✅ Próprio | ✅ Básico |
| Listar Fornecedores | ✅ CRUD | ❌ | ✅ Visualizar |
| Gerenciar Produtos | ✅ Todos | ✅ Próprios | ❌ |
| Visualizar Produtos | ✅ | ✅ | ✅ |
| Gerenciar Categorias | ✅ CRUD | ❌ | ❌ |
| Visualizar Categorias | ✅ | ✅ | ✅ |
| Relatórios | ✅ Todos | ❌ | ❌ |
| Criar Vínculos | ✅ | ❌ | ✅ (futuro) |
| Upload Imagens | ✅ Todos | ✅ Próprios | ❌ |

---

## 🎨 Identificação Visual

### Badges de Nível
- 🔴 **Executivo** - Badge vermelho
- 🟡 **Fornecedor** - Badge amarelo
- 🟢 **Comum** - Badge azul

### Banners Informativos
Cada tipo de usuário vê um banner específico no Dashboard:

**Executivo:**
```
🛡️ Acesso Executivo
Você tem acesso completo ao sistema incluindo gerenciamento de 
fornecedores, produtos, categorias e relatórios.
```

**Fornecedor:**
```
📦 Painel de Fornecedor
Gerencie seus produtos, categorias e visualize estatísticas 
do seu desempenho no sistema.
```

**Comum:**
```
🛒 Portal do Comprador
Explore fornecedores, visualize produtos e encontre as 
melhores ofertas para seu negócio.
```

---

## 🚀 Implementado

✅ Menus dinâmicos baseados no nível  
✅ Dashboard personalizado por nível  
✅ Banners informativos  
✅ Badges de identificação  
✅ Mensagens de boas-vindas customizadas  

---

## 🔮 Futuras Implementações

### Para Fornecedores:
- [ ] Filtrar produtos apenas do fornecedor logado
- [ ] Dashboard com KPIs específicos (total vendido, produtos mais vendidos)
- [ ] Notificações de novos pedidos
- [ ] Histórico de transações

### Para Compradores (Comum):
- [ ] Sistema de vínculos com fornecedores
- [ ] Carrinho de compras
- [ ] Histórico de pedidos
- [ ] Lista de favoritos
- [ ] Comparação de preços entre fornecedores

### Para Executivos:
- [ ] Gerenciamento de usuários (CRUD)
- [ ] Logs de auditoria
- [ ] Configurações do sistema
- [ ] Backup e restauração

---

## 📝 Notas Importantes

1. **Segurança:** O backend deve validar as permissões em cada endpoint
2. **Filtros:** Produtos de fornecedores devem ser filtrados por `fornecedor_id`
3. **Vínculos:** Sistema de vínculos será implementado na próxima versão
4. **UI/UX:** Interface adapta-se automaticamente ao nível do usuário

---

**Última atualização:** Fevereiro 2026  
**Versão:** 1.0.0
