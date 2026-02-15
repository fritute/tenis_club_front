# 👟 Tênis Club - Frontend

Sistema completo de gestão de produtos e fornecedores desenvolvido com **React**, **jQuery** e integração com API REST PHP.

![React](https://img.shields.io/badge/React-18.2.0-blue)
![jQuery](https://img.shields.io/badge/jQuery-3.7.1-yellow)
![Status](https://img.shields.io/badge/Status-Produção-green)

---

## 🎨 **Design & Estilo**

### Tema Tênis Club
- **Cores Principais:**
  - 🔵 Azul Nike: `#1e40af`
  - 🟠 Laranja Energia: `#ff6b35`
  - 🟢 Verde Limão: `#84cc16`
  - ⚫ Azul Escuro: `#0f172a`

### Características Visuais
- Design moderno e responsivo
- Animações suaves com jQuery
- Interface intuitiva e profissional
- Totalmente adaptável para mobile

---

## 🚀 **Instalação**

### Pré-requisitos
- Node.js 16+ instalado
- NPM ou Yarn
- Backend PHP rodando em `http://localhost:8000`

### Passo 1: Clone/Navegue até o diretório
```bash
cd "C:\Users\Gustavo\Documents\Codigos\virtual market\front"
```

### Passo 2: Instale as dependências
```bash
npm install
```

### Passo 3: Inicie o servidor de desenvolvimento
```bash
npm start
```

O aplicativo será aberto automaticamente em `http://localhost:3000`

---

## 📦 **Build para Produção**

Para criar uma versão otimizada para produção:

```bash
npm run build
```

Os arquivos otimizados estarão na pasta `build/`

---

## 🏗️ **Estrutura do Projeto**

```
front/
├── public/
│   └── index.html              # HTML principal
├── src/
│   ├── components/             # Componentes React
│   │   ├── Auth/
│   │   │   ├── Login.js       # Página de login
│   │   │   └── Login.css
│   │   ├── Dashboard/
│   │   │   ├── Dashboard.js   # Dashboard principal
│   │   │   └── Dashboard.css
│   │   └── Layout/
│   │       ├── Layout.js      # Layout com sidebar
│   │       └── Layout.css
│   ├── pages/                  # Páginas principais
│   │   ├── Fornecedores/
│   │   │   ├── Fornecedores.js
│   │   │   └── Fornecedores.css
│   │   ├── Produtos/
│   │   │   ├── Produtos.js    # Com upload de imagens
│   │   │   └── Produtos.css
│   │   ├── Categorias/
│   │   │   ├── Categorias.js
│   │   │   └── Categorias.css
│   │   └── Relatorios/
│   │       ├── Relatorios.js  # 5 tipos de relatórios
│   │       └── Relatorios.css
│   ├── services/
│   │   └── api.js              # Integração com API
│   ├── App.js                  # Componente principal
│   ├── App.css                 # Estilos globais da app
│   ├── index.js                # Entry point
│   └── index.css               # Estilos globais do sistema
├── package.json
└── README.md
```

---

## 🔐 **Autenticação**

### Usuários de Demonstração

| Email | Senha | Nível | Descrição |
|-------|-------|-------|-----------|
| admin@sistema.com | admin123 | Executivo | Acesso total ao sistema |
| fornecedor@teste.com | forn123 | Fornecedor | Pode gerenciar produtos |
| usuario@teste.com | user123 | Comum | Acesso limitado |

### Fluxo de Autenticação
1. Login com email e senha
2. Sistema valida na API PHP
3. Recebe token JWT
4. Token armazenado no localStorage
5. Token incluído em todas as requisições

---

## 🎯 **Funcionalidades**

### 1. **Dashboard** 📊
- Estatísticas em tempo real
- Visão geral do sistema
- Top fornecedores
- Ações rápidas
- Contadores animados (jQuery)

### 2. **Fornecedores** 🚚
- ✅ Listar todos os fornecedores
- ✅ Criar novo fornecedor
- ✅ Editar fornecedor existente
- ✅ Excluir fornecedor
- ✅ Busca em tempo real
- ✅ Validação de CNPJ
- ✅ Status Ativo/Inativo

### 3. **Produtos** 👟
- ✅ CRUD completo de produtos
- ✅ Upload de múltiplas imagens
- ✅ Definir imagem principal
- ✅ Excluir imagens
- ✅ Visualização em grid
- ✅ Vinculação com categorias
- ✅ Preço base
- ✅ Código interno
- ✅ Busca avançada

### 4. **Categorias** 🏷️
- ✅ Gerenciamento de categorias
- ✅ Visualização em cards
- ✅ Descrição detalhada
- ✅ Status e controle

### 5. **Relatórios** 📈
- ✅ Dashboard executivo
- ✅ Relatório de fornecedores
- ✅ Relatório de produtos
- ✅ Relatório de categorias
- ✅ Análise financeira
- ✅ Exportação para JSON

---

## 🔌 **Integração com API**

### Configuração da API
O sistema está configurado para se conectar com:
```
API Base URL: http://localhost:8000/api
```

### Modificar URL da API
Edite o arquivo `src/services/api.js`:
```javascript
const API_BASE_URL = 'http://localhost:8000/api';
```

### Endpoints Utilizados

#### Autenticação
- `POST /api/usuarios/login`
- `POST /api/usuarios/validar-token`

#### Fornecedores
- `GET /api/fornecedores`
- `POST /api/fornecedores`
- `PUT /api/fornecedores/{id}`
- `DELETE /api/fornecedores/{id}`

#### Produtos
- `GET /api/produtos`
- `POST /api/produtos`
- `PUT /api/produtos/{id}`
- `DELETE /api/produtos/{id}`

#### Imagens de Produtos
- `GET /api/produtos/imagens?produto_id={id}`
- `POST /api/produtos/imagens`
- `PUT /api/produtos/imagens/{id}/principal`
- `DELETE /api/produtos/imagens/{id}`

#### Categorias
- `GET /api/categorias`
- `POST /api/categorias`
- `PUT /api/categorias/{id}`
- `DELETE /api/categorias/{id}`

#### Relatórios
- `GET /api/relatorios/dashboard`
- `GET /api/relatorios/fornecedores`
- `GET /api/relatorios/produtos`
- `GET /api/relatorios/categorias`
- `GET /api/relatorios/financeiro`

---

## 💡 **Recursos jQuery**

### Animações Implementadas
```javascript
// Contador animado no dashboard
$('.stat-number').animate({ countNum: value }, 1500);

// Modal com animação
$('.modal').addClass('show');

// Notificações
showNotification('Mensagem', 'success');

// Click nos cards
$('.card').on('click', handler);
```

### Efeitos Visuais
- Fade in/out
- Slide up/down
- Pulse animations
- Shake on error
- Counter animations

---

## 🎨 **Customização de Cores**

Para alterar o tema de cores, edite `src/index.css`:

```css
:root {
  --primary-blue: #1e40af;
  --primary-orange: #ff6b35;
  --primary-green: #84cc16;
  --dark-navy: #0f172a;
}
```

---

## 📱 **Responsividade**

O sistema é totalmente responsivo e funciona perfeitamente em:
- 💻 Desktop (1920px+)
- 💻 Laptop (1366px - 1920px)
- 📱 Tablet (768px - 1366px)
- 📱 Mobile (320px - 768px)

### Breakpoints
```css
@media (max-width: 1024px) { /* Tablet landscape */ }
@media (max-width: 768px)  { /* Tablet portrait / Mobile */ }
@media (max-width: 480px)  { /* Mobile small */ }
```

---

## 🐛 **Troubleshooting**

### Problema: "Cannot connect to API"
**Solução:** Certifique-se de que o backend PHP está rodando em `http://localhost:8000`

### Problema: Imagens não aparecem
**Solução:** Verifique se o caminho da imagem está correto e se o backend está servindo os arquivos estáticos

### Problema: "Module not found"
**Solução:** Execute `npm install` novamente

### Problema: Porta 3000 já está em uso
**Solução:** Altere a porta ou mate o processo:
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Ou use outra porta
PORT=3001 npm start
```

---

## 🚀 **Deploy**

### Deploy com Netlify/Vercel
1. Build do projeto: `npm run build`
2. Conecte seu repositório
3. Configure variáveis de ambiente se necessário
4. Deploy automático

### Deploy Manual
1. `npm run build`
2. Copie a pasta `build/` para seu servidor web
3. Configure um servidor HTTP (Apache, Nginx, etc.)
4. Aponte o domínio para a pasta `build/`

---

## 📊 **Bibliotecas Utilizadas**

| Biblioteca | Versão | Uso |
|------------|--------|-----|
| React | 18.2.0 | Framework principal |
| React Router | 6.20.0 | Roteamento |
| Axios | 1.6.2 | Requisições HTTP |
| jQuery | 3.7.1 | Animações e manipulação DOM |
| Font Awesome | 6.4.0 | Ícones |
| Google Fonts | Latest | Typography (Poppins) |

---

## 🎯 **Próximos Passos**

### Melhorias Futuras
- [ ] Dashboard com gráficos (Chart.js)
- [ ] Modo escuro
- [ ] Internacionalização (i18n)
- [ ] PWA (Progressive Web App)
- [ ] Notificações push
- [ ] Drag and drop para reordenar imagens
- [ ] Filtros avançados
- [ ] Exportação de relatórios em PDF

---

## 📝 **Licença**

Sistema desenvolvido para gestão de produtos e fornecedores. Uso educacional e comercial permitido.

---

## 👨‍💻 **Desenvolvedor**

**Sistema Tênis Club**  
Frontend desenvolvido com React + jQuery  
Backend PHP com armazenamento JSON

---

## 🆘 **Suporte**

Para dúvidas ou problemas:
1. Verifique a documentação do backend
2. Confira o console do navegador (F12)
3. Verifique os logs do terminal
4. Teste os endpoints da API manualmente

---

## ✅ **Checklist de Instalação**

- [ ] Node.js instalado
- [ ] Dependências instaladas (`npm install`)
- [ ] Backend PHP rodando na porta 8000
- [ ] Navegador atualizado
- [ ] Frontend rodando (`npm start`)
- [ ] Login funcionando
- [ ] API respondendo

---

**🎉 Sistema Tênis Club - Gestão Moderna de E-commerce**

*Desenvolvido com ❤️ usando React, jQuery e PHP*
#   t e n i s _ c l u b _ f r o n t  
 