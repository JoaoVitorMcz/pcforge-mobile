import React, { useEffect, useMemo, useState } from "react";
import ProdutoCard from "./ProdutoCard";

function CatalogoPaginado({
  produtos,
  itensPorPagina = 8,
  emptyMessage = "Nenhum produto encontrado.",
}) {
  const produtosValidos = useMemo(
    () => (Array.isArray(produtos) ? produtos : []),
    [produtos]
  );
  const [paginaAtual, setPaginaAtual] = useState(1);

  useEffect(() => {
    setPaginaAtual(1);
  }, [produtosValidos]);

  const totalPaginas = Math.max(
    1,
    Math.ceil(produtosValidos.length / itensPorPagina)
  );

  useEffect(() => {
    if (paginaAtual > totalPaginas) {
      setPaginaAtual(totalPaginas);
    }
  }, [paginaAtual, totalPaginas]);

  if (produtosValidos.length === 0) {
    return <p className="sem-produtos">{emptyMessage}</p>;
  }

  const indiceInicial = (paginaAtual - 1) * itensPorPagina;
  const indiceFinal = indiceInicial + itensPorPagina;
  const produtosPaginados = produtosValidos.slice(indiceInicial, indiceFinal);

  return (
    <div className="catalogo-wrapper">
      <div className="catalogo-meta">
        <span>
          Exibindo {indiceInicial + 1}-{indiceInicial + produtosPaginados.length} de{" "}
          {produtosValidos.length} produtos
        </span>
        <span>
          Pagina {paginaAtual} de {totalPaginas}
        </span>
      </div>

      <div className="produtos-grid">
        {produtosPaginados.map((produto) => (
          <ProdutoCard key={produto.id_produto} produto={produto} />
        ))}
      </div>

      {totalPaginas > 1 && (
        <div className="catalogo-paginacao">
          <button
            type="button"
            className="catalogo-pagina-btn"
            onClick={() => setPaginaAtual((prev) => Math.max(prev - 1, 1))}
            disabled={paginaAtual === 1}
          >
            Anterior
          </button>

          <div className="catalogo-paginas">
            {Array.from({ length: totalPaginas }, (_, index) => {
              const pagina = index + 1;

              return (
                <button
                  key={pagina}
                  type="button"
                  className={`catalogo-pagina-btn ${
                    pagina === paginaAtual ? "active" : ""
                  }`}
                  onClick={() => setPaginaAtual(pagina)}
                >
                  {pagina}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            className="catalogo-pagina-btn"
            onClick={() =>
              setPaginaAtual((prev) => Math.min(prev + 1, totalPaginas))
            }
            disabled={paginaAtual === totalPaginas}
          >
            Proxima
          </button>
        </div>
      )}
    </div>
  );
}

export default CatalogoPaginado;
