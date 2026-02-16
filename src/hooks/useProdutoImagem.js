import { useState, useEffect } from 'react';
import { getProdutoImagemPrincipal } from '../services/api';

// Cache global de imagens para evitar requests desnecessários
const imagemCache = new Map();

// Hook para buscar imagem principal de um produto
export const useProdutoImagem = (produtoId) => {
  const [imagem, setImagem] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!produtoId) {
      setImagem(null);
      return;
    }

    // Verificar cache primeiro
    if (imagemCache.has(produtoId)) {
      setImagem(imagemCache.get(produtoId));
      return;
    }

    // Buscar imagem da API
    const buscarImagem = async () => {
      setLoading(true);
      try {
        const imagemData = await getProdutoImagemPrincipal(produtoId);
        
        // Salvar no cache
        imagemCache.set(produtoId, imagemData);
        setImagem(imagemData);
      } catch (error) {
        console.error('[useProdutoImagem] Erro:', error);
        // Cache null para evitar requests repetidos
        imagemCache.set(produtoId, null);
        setImagem(null);
      } finally {
        setLoading(false);
      }
    };

    buscarImagem();
  }, [produtoId]);

  return { imagem, loading };
};

// Hook para buscar múltiplas imagens de uma vez (para listas de produtos)
export const useProdutoImagens = (produtos) => {
  const [imagens, setImagens] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!produtos || produtos.length === 0) {
      setImagens({});
      return;
    }

    const buscarImagens = async () => {
      setLoading(true);
      const novasImagens = {};
      
      // Buscar imagens que ainda não estão em cache
      const promisesBusca = produtos
        .filter(produto => produto.id && !imagemCache.has(produto.id))
        .map(async (produto) => {
          try {
            const imagemData = await getProdutoImagemPrincipal(produto.id);
            imagemCache.set(produto.id, imagemData);
            novasImagens[produto.id] = imagemData;
          } catch (error) {
            console.error('[useProdutoImagens] Erro produto', produto.id, error);
            imagemCache.set(produto.id, null);
            novasImagens[produto.id] = null;
          }
        });

      // Adicionar imagens do cache
      produtos.forEach(produto => {
        if (produto.id && imagemCache.has(produto.id)) {
          novasImagens[produto.id] = imagemCache.get(produto.id);
        }
      });

      // Aguardar todas as buscas
      if (promisesBusca.length > 0) {
        await Promise.all(promisesBusca);
      }

      setImagens(novasImagens);
      setLoading(false);
    };

    buscarImagens();
  }, [produtos]); // Removei 'imagens' da dependência

  return { imagens, loading };
};

// Função para limpar cache (útil quando imagens são atualizadas)
export const limparCacheImagem = (produtoId) => {
  if (produtoId) {
    imagemCache.delete(produtoId);
  } else {
    // Limpar todo o cache
    imagemCache.clear();
  }
};