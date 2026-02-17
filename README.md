# Virtual Market (Sistema de Gestão - Tênis Club)

Este projeto é uma plataforma de marketplace que conecta fornecedores a produtos, permitindo a gestão de vendas, estoques e vínculos entre lojas e fabricantes.

## 🚀 Tecnologias Utilizadas

### Frontend (Pasta `front/`)
- **React.js** (Create React App)
- **Axios** para requisições HTTP
- **Jquery**  jQuery simplifica e unifica a manipulação do DOM, eventos, animações e AJAX
- **React Router** para navegação
- **Chart.js** para gráficos e relatórios
- **CSS Modules** para estilização

### Backend (Pasta `../back end/`)
- **PHP** (Vanilla / MVC Pattern)
- **PDO** para conexão com banco de dados
- **MySQL** como banco de dados principal
- Suporte a **SQLite** (configurável)

---

## 🛠️ Como Rodar o Projeto

### Pré-requisitos
- Node.js e npm instalados
- PHP 7.4 ou superior
- MySQL Server

### 1. Configuração do Banco de Dados
1. Crie um banco de dados MySQL chamado `tenis_club`.
2. Importe o arquivo SQL localizado em:
   `../back end/config/database.sql`
3. (Opcional) Configure as credenciais no arquivo `../back end/config/database.php` se forem diferentes do padrão (User: `root`, Pass: vazio).

### 2. Iniciando o Backend
Navegue até a pasta do backend e inicie o servidor PHP embutido:

```bash
cd "../back end"
php -S localhost:8000
```
*O backend rodará em `http://localhost:8000`.*

### 3. Iniciando o Frontend
Navegue até a pasta do frontend (`front/`), instale as dependências e inicie o servidor de desenvolvimento:

```bash
npm install
npm start
```
*O frontend abrirá automaticamente em `http://localhost:3000`.*

---

## 📦 Como Funciona

### Perfis de Usuário
- **Executivo**: Administrador do sistema. Pode gerenciar todos os produtos, fornecedores e vínculos.
- **Fornecedor**: Usuário que possui uma loja. Pode cadastrar seus próprios produtos ou vender produtos de terceiros (Marketplace).

### Funcionalidades Principais

#### 1. Marketplace de Produtos (Novo)
Área onde fornecedores podem encontrar produtos disponíveis no sistema para revenda.
- Lista produtos que não são de autoria do fornecedor e que ainda não foram vinculados.
- Permite vincular-se a um produto com um clique ("Quero Vender").

#### 2. Minha Loja (Atualizado)
Painel central do fornecedor para gerenciar seu catálogo.
- **Produtos Próprios**: Produtos cadastrados pelo fornecedor. Podem ser editados ou excluídos.
- **Produtos Vinculados (Revenda)**: Produtos de outros fabricantes que o fornecedor vende.
  - Identificados com selo "Revenda".
  - Ação de "Desvincular" (remove da lista, mas mantém o produto original).

#### 3. Gestão de Vínculos
- Permite definir fornecedores "Principais" para produtos.
- Histórico de alterações de vínculos (quem vinculou, quando, preço).
- Suporte a múltiplos fornecedores para o mesmo produto.

#### 4. Pedidos e Relatórios
- Acompanhamento de vendas.
- Gráficos de desempenho e estoque.

---

## 📂 Estrutura de Pastas

```
virtual market/
├── back end/           # API e Lógica do Servidor
│   ├── api/            # Endpoints Públicos
│   ├── config/         # Configuração de DB
│   ├── controllers/    # Controladores das Rotas
│   ├── models/         # Modelos de Dados
│   └── uploads/        # Imagens de Produtos
│
└── front/              # Aplicação React
    ├── public/
    └── src/
        ├── components/ # Componentes Reutilizáveis
        ├── pages/      # Telas da Aplicação
        ├── services/   # Integração com API (Axios)
        └── hooks/      # Hooks Customizados
```
