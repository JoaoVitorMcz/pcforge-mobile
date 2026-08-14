// @ts-check

import React, { useState } from "react";
import { useCarrinho } from "../context/CarrinhoContext";
import { buildAssetUrl } from "../config/api";
import "./ProdutoCard.css";

/**
 * @param {{ produto: Produto }} props
 */
function ProdutoCard({ produto }) {
  const { itens, adicionarAoCarrinho } = useCarrinho();
  const [adicionado, setAdicionado] = useState(false);

  const precoCalculado = Number.isFinite(Number(produto.preco ?? produto.valor))
    ? Number(produto.preco ?? produto.valor)
    : 0;
  const estoqueCalculado = Number.parseInt(String(produto.estoque ?? ""), 10);
  const estoqueDisponivel = Number.isFinite(estoqueCalculado) ? estoqueCalculado : null;
  const quantidadeNoCarrinho =
    itens.find((item) => item.id_produto === produto.id_produto)?.quantidade ?? 0;
  const semEstoque = estoqueDisponivel !== null && estoqueDisponivel <= 0;
  const limiteAtingido =
    estoqueDisponivel !== null && quantidadeNoCarrinho >= estoqueDisponivel;
  const botaoDesabilitado = semEstoque || limiteAtingido;
  const textoEstoque =
    estoqueDisponivel === null
      ? "Estoque nao informado"
      : semEstoque
        ? "Indisponivel"
        : `Estoque: ${estoqueDisponivel}`;

  const imagemProduto = typeof produto.imagem === "string" ? produto.imagem.trim() : "";
  const caminhoImagem = !imagemProduto
    ? "/imagens/produtos/placeholder.png"
    : imagemProduto.startsWith("http://") || imagemProduto.startsWith("https://")
      ? imagemProduto
      : imagemProduto.startsWith("/")
        ? buildAssetUrl(imagemProduto)
        : `/imagens/produtos/${imagemProduto}`;

  const handleAdicionarAoCarrinho = () => {
    if (botaoDesabilitado) {
      return;
    }

    adicionarAoCarrinho({
      id_produto: produto.id_produto,
      nome: produto.nome,
      valor: precoCalculado,
      imagem: caminhoImagem,
      estoque: estoqueDisponivel,
    });

    setAdicionado(true);
    setTimeout(() => setAdicionado(false), 2000);
  };

  return (
    <div className={`produto-card ${semEstoque ? "indisponivel" : ""}`}>
      {produto.tag && <span className="produto-tag">{produto.tag}</span>}

      <div className="produto-img-container">
        <img
          src={caminhoImagem}
          alt={produto.nome}
          className="produto-img"
          onError={(event) => {
            const image = event.currentTarget;
            image.style.display = "none";
            if (image.parentElement) {
              image.parentElement.innerHTML = "<span>PC</span>";
            }
          }}
        />
      </div>

      <div className="produto-info">
        <h4>{produto.nome}</h4>
        <p className="produto-preco">
          R$ {precoCalculado.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
        </p>
        <p className={`produto-estoque ${semEstoque ? "indisponivel" : ""}`}>
          {textoEstoque}
        </p>
        <button
          className={`produto-btn ${adicionado ? "adicionado" : ""}`}
          onClick={handleAdicionarAoCarrinho}
          disabled={botaoDesabilitado}
        >
          {semEstoque
            ? "Indisponivel"
            : limiteAtingido && !adicionado
              ? "Limite de estoque"
              : adicionado
                ? "Adicionado!"
                : "Adicionar ao carrinho"}
        </button>
      </div>
    </div>
  );
}

export default ProdutoCard;
