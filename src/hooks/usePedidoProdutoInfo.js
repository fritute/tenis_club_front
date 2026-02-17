import { useEffect, useState } from 'react';
import { getProduto } from '../services/api';

// Hook para buscar informações do produto pelo ID
export function usePedidoProdutoInfo(produtoId) {
  const [produto, setProduto] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!produtoId) return;
    setLoading(true);
    getProduto(produtoId)
      .then(setProduto)
      .catch(() => setProduto(null))
      .finally(() => setLoading(false));
  }, [produtoId]);

  return { produto, loading };
}
