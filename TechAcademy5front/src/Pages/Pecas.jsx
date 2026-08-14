import React, { useState, useEffect } from "react";
import FiltroCatalogo from "../Componentes/FiltroCatalogo";
import CatalogoPaginado from "../Componentes/CatalogoPaginado";
import { fetchJson } from "../config/api";
import "./pecas.css";

const PERIFERICOS_KEYWORDS = [
  "periferico",
  "acessorio",
  "mouse",
  "teclado",
  "headset",
  "fone",
  "monitor",
  "webcam",
  "microfone",
  "controle",
];

function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function isCategoriaPeriferico(categoria) {
  const text = normalizeText(
    [categoria?.nome, categoria?.slug, categoria?.tipo, categoria?.grupo]
      .filter(Boolean)
      .join(" ")
  );

  return PERIFERICOS_KEYWORDS.some((keyword) => text.includes(keyword));
}

function Pecas() {
  const [produtos, setProdutos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    const carregar = async () => {
      try {
        setErro("");

        const [cats, prods] = await Promise.all([
          fetchJson("/categorias"),
          fetchJson("/produtos"),
        ]);

        const categoriasHardware = (Array.isArray(cats) ? cats : []).filter(
          (categoria) => categoria?.ativo !== false && !isCategoriaPeriferico(categoria)
        );

        const idsHardware = new Set(
          categoriasHardware.map((categoria) => String(categoria.id_categoria))
        );

        const produtosHardware = (Array.isArray(prods) ? prods : []).filter((produto) =>
          idsHardware.has(String(produto.id_categoria))
        );

        setProdutos(produtosHardware);
      } catch (err) {
        console.error("Erro ao carregar dados:", err);
        setErro("N\u00e3o foi poss\u00edvel carregar os dados. Verifique a API.");
      } finally {
        setLoading(false);
      }
    };

    carregar();
  }, []);

  if (loading) {
    return (
      <div className="pecas-loading">
        <span>Carregando</span>
      </div>
    );
  }

  if (erro) {
    return (
      <div className="pecas-loading">
        <span>{erro}</span>
      </div>
    );
  }

  return (
    <div className="pecas-page">
      <div className="pecas-header">
        <h1>PEÇAS <span>& COMPONENTES</span></h1>
      </div>

      <div className="pecas-layout">
        <FiltroCatalogo
          produtos={produtos}
          precoInicial={5000}
          precoMin={100}
          precoLimite={5000}
          precoPasso={100}
        >
          {(produtosFiltrados) => (
            <CatalogoPaginado
              produtos={produtosFiltrados}
              itensPorPagina={12}
              emptyMessage="Nenhum produto encontrado."
            />
          )}
        </FiltroCatalogo>
      </div>
    </div>
  );
}

export default Pecas;
