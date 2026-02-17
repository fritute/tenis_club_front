-- 🔧 SCRIPT DE CORREÇÃO DO BANCO DE DADOS
-- 
-- O erro 500 ocorre porque o backend (código) espera o status 'em_transito',
-- mas o seu banco de dados (tabela) só aceita 'enviado'.
--
-- Para corrigir, execute o comando abaixo no seu banco de dados MySQL (phpMyAdmin ou terminal):
didos MODIFY COLUMN status ENUM('pendente', 'confirmado', 'em_separacao', 'em_tr
ALTER TABLE peansito', 'entregue', 'cancelado', 'enviado') NOT NULL DEFAULT 'pendente';

-- Explicação:
-- Isso adiciona 'em_separacao' e 'em_transito' à lista de status permitidos,
-- resolvendo o conflito entre o código e o banco.
