# 🚀 GUIA RÁPIDO - Tênis Club Frontend

## ⚡ Instalação Rápida (3 passos)

### 1. Instalar Dependências
```bash
cd "C:\Users\Gustavo\Documents\Codigos\virtual market\front"
npm install
```

### 2. Verificar Backend
Certifique-se de que o backend está rodando:
```bash
# Em outro terminal
cd "C:\Users\Gustavo\Documents\Codigos\virtual market\back end"
php -S localhost:8000 router.php
```

### 3. Iniciar Frontend
```bash
npm start
```

**✅ Pronto!** O sistema abrirá em `http://localhost:3000`

---

## 🔐 Login Rápido

Use um dos usuários de demonstração:

**ADMIN (Acesso Total)**
- Email: `admin@sistema.com`
- Senha: `admin123`

**FORNECEDOR (Gestão de Produtos)**
- Email: `fornecedor@teste.com`
- Senha: `forn123`

**USUÁRIO (Visualização)**
- Email: `usuario@teste.com`
- Senha: `user123`

---

## 📋 Funcionalidades Disponíveis

### ✅ Dashboard
- Estatísticas em tempo real
- Visão geral do sistema
- Top fornecedores

### ✅ Fornecedores
- Criar, editar e excluir
- Busca em tempo real
- Gerenciamento de contatos

### ✅ Produtos
- CRUD completo
- **Upload de múltiplas imagens**
- Definir imagem principal
- Vinculação com categorias

### ✅ Categorias
- Organização de produtos
- Visualização em cards

### ✅ Relatórios
- 5 tipos de relatórios
- Exportação para JSON
- Análise completa

---

## 🎨 Estrutura de Páginas

```
/                → Dashboard
/fornecedores    → Gestão de Fornecedores
/produtos        → Gestão de Produtos + Imagens
/categorias      → Gestão de Categorias
/relatorios      → Sistema de Relatórios
```

---

## 🔧 Comandos Úteis

### Desenvolvimento
```bash
npm start          # Inicia servidor de desenvolvimento
```

### Produção
```bash
npm run build      # Gera build de produção
npm test           # Executa testes
```

### Limpeza
```bash
rm -rf node_modules
npm install        # Reinstala dependências
```

---

## 🐛 Problemas Comuns

### ❌ "Cannot connect to API"
**Solução:** Backend não está rodando
```bash
cd "../back end"
php -S localhost:8000 router.php
```

### ❌ "Port 3000 already in use"
**Solução:** Mate o processo ou use outra porta
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Ou use porta diferente
PORT=3001 npm start
```

### ❌ "Module not found"
**Solução:** Reinstale dependências
```bash
npm install
```

---

## 📸 Upload de Imagens

### Como fazer upload:
1. Vá em **Produtos**
2. Clique no botão **Imagens** (ícone)
3. Arraste ou clique para selecionar
4. Aceita: **JPEG, PNG, WebP** (máx. 5MB)

### Recursos:
- ✅ Múltiplas imagens por produto
- ✅ Definir imagem principal
- ✅ Excluir imagens
- ✅ Preview instantâneo

---

## 🎯 Checklist Inicial

- [ ] Node.js instalado
- [ ] Backend rodando (porta 8000)
- [ ] `npm install` executado
- [ ] `npm start` executado
- [ ] Navegador abriu em localhost:3000
- [ ] Login funcionando
- [ ] Dashboard carregando

---

## 📞 Precisa de Ajuda?

1. **Console do Navegador:** Pressione F12
2. **Logs do Terminal:** Verifique erros no terminal
3. **API:** Teste `http://localhost:8000/api/produtos`
4. **Documentação:** Veja README.md completo

---

## ✅ Sistema Pronto!

**Tênis Club** está funcionando perfeitamente com:
- ✅ React 18.2.0
- ✅ jQuery 3.7.1
- ✅ Design moderno responsivo
- ✅ Integração completa com API
- ✅ Upload de imagens
- ✅ Sistema de relatórios

**🎉 Bom uso!**
