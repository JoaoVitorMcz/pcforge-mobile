import React, { useState } from "react";

function getPrecoProduto(produto) {
  const rawPrice = produto?.preco ?? produto?.valor ?? 0;
  const numericPrice =
    typeof rawPrice === "number" ? rawPrice : Number.parseFloat(rawPrice);

  return Number.isFinite(numericPrice) ? numericPrice : 0;
}

function FiltroCatalogo({
  produtos,
  precoInicial,
  precoMin,
  precoLimite,
  precoPasso,
  children,
}) {
  const [precoMax, setPrecoMax] = useState(precoInicial);
  const [ordem, setOrdem] = useState("padrao");

  const limparFiltros = () => {
    setPrecoMax(precoInicial);
    setOrdem("padrao");
  };

  const produtosFiltrados = (Array.isArray(produtos) ? produtos : [])
    .filter((produto) => getPrecoProduto(produto) <= precoMax)
    .sort((a, b) => {
      if (ordem === "menor") return getPrecoProduto(a) - getPrecoProduto(b);
      if (ordem === "maior") return getPrecoProduto(b) - getPrecoProduto(a);
      return 0;
    });

  return (
    <>
      <aside className="filtros">
        <div className="filtro-bloco">
          <h3>Preço máximo</h3>
          <input
            type="range"
            min={precoMin}
            max={precoLimite}
            step={precoPasso}
            value={precoMax}
            onChange={(e) => setPrecoMax(Number(e.target.value))}
          />
          <span className="preco-valor">
            até R$ {precoMax.toLocaleString("pt-BR")}
          </span>
        </div>

        <div className="filtro-bloco">
          <h3>Ordenar por</h3>
          <ul>
            <li className={ordem === "padrao" ? "active" : ""} onClick={() => setOrdem("padrao")}>
              Padrão
            </li>
            <li className={ordem === "menor" ? "active" : ""} onClick={() => setOrdem("menor")}>
              Menor preço
            </li>
            <li className={ordem === "maior" ? "active" : ""} onClick={() => setOrdem("maior")}>
              Maior preço
            </li>
          </ul>
        </div>

        <button className="filtro-limpar" onClick={limparFiltros}>
          Limpar filtros
        </button>
      </aside>

      {children(produtosFiltrados)}
    </>
  );
}

export default FiltroCatalogo;
