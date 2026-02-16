import React from 'react';
import { useProdutoImagem } from '../../hooks/useProdutoImagem';
import './ProdutoImagem.css';

const ProdutoImagem = ({ produtoId, produtoNome, className = '', size = 'medium' }) => {
  const { imagem, loading } = useProdutoImagem(produtoId);

  const getImageUrl = () => {
    if (imagem?.url) {
      // Se a URL é relativa, adicionar base URL do backend
      if (imagem.url.startsWith('/')) {
        return `http://localhost:8000${imagem.url}`;
      }
      return imagem.url;
    }
    return null;
  };

  if (loading) {
    return (
      <div className={`produto-imagem produto-imagem-${size} ${className}`}>
        <div className="produto-imagem-loading">
          <i className="fas fa-spinner fa-spin"></i>
        </div>
      </div>
    );
  }

  const imageUrl = getImageUrl();

  return (
    <div className={`produto-imagem produto-imagem-${size} ${className}`}>
      {imageUrl ? (
        <img 
          src={imageUrl} 
          alt={produtoNome || 'Produto'} 
          onError={(e) => {
            console.warn('[ProdutoImagem] Erro ao carregar:', imageUrl);
            e.target.style.display = 'none';
            e.target.nextSibling.style.display = 'flex';
          }}
        />
      ) : null}
      
      {/* Placeholder SVG inteligente */}
      <div 
        className="produto-imagem-placeholder" 
        style={{ display: imageUrl ? 'none' : 'flex' }}
      >
        <svg 
          viewBox="0 0 200 150" 
          className="produto-placeholder-svg"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Fundo gradiente */}
          <defs>
            <linearGradient id="placeholderGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f8f9fa" />
              <stop offset="100%" stopColor="#e9ecef" />
            </linearGradient>
          </defs>
          <rect width="200" height="150" fill="url(#placeholderGradient)" />
          
          {/* Ícone de produto */}
          <g transform="translate(100, 75)">
            <circle cx="0" cy="-15" r="25" fill="#dee2e6" opacity="0.7" />
            <path 
              d="M-15,-25 L15,-25 L20,-15 L20,20 L-20,20 L-20,-15 Z" 
              fill="#adb5bd" 
              opacity="0.8"
            />
            <circle cx="-8" cy="-10" r="3" fill="#6c757d" />
            <circle cx="8" cy="-10" r="3" fill="#6c757d" />
            <path d="M-10,5 Q0,15 10,5" stroke="#6c757d" strokeWidth="2" fill="none" />
          </g>
          
          {/* Nome do produto (se disponível) */}
          {produtoNome && (
            <text 
              x="100" 
              y="130" 
              textAnchor="middle" 
              fontSize="10" 
              fill="#6c757d" 
              fontFamily="Arial, sans-serif"
              opacity="0.6"
            >
              {produtoNome.length > 20 ? produtoNome.substring(0, 20) + '...' : produtoNome}
            </text>
          )}
        </svg>
        {size === 'large' && <span>Sem imagem</span>}
      </div>
    </div>
  );
};

export default ProdutoImagem;