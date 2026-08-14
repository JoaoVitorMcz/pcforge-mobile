
import React, { useEffect, useState } from "react";
import Banner from "../Componentes/Banner";
import ProdutoCard from "../Componentes/ProdutoCard";
import { fetchJson } from "../config/api";
import "./Home.css";

function Home() {
  const [produtos, setProdutos] = useState(/** @type {Produto[]} */ ([]));
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    const carregarProdutos = async () => {
      try {
        setErro("");
        const data = await fetchJson("/produtos/destaque"); // ← só isso mudou
        const produtosCarregados = Array.isArray(data) ? data : [];
        setProdutos(produtosCarregados);
      } catch (err) {
        console.error("Erro ao carregar produtos em destaque:", err);
        setErro("Nao foi possivel carregar os produtos em destaque.");
      } finally {
        setLoading(false);
      }
    };

    carregarProdutos();
  }, []);

  return (
    <div className="home">
      <Banner />

      <section className="produtos-section">
        <h2 className="section-title">
          <span>PRODUTOS</span> EM DESTAQUE
        </h2>

        <div className="produtos-layout">
          <div className="produtos-grid">
            {loading ? (
              <p className="sem-produtos">Carregando produtos...</p>
            ) : erro ? (
              <p className="sem-produtos">{erro}</p>
            ) : produtos.length === 0 ? (
              <p className="sem-produtos">Nenhum produto em destaque no momento.</p>
            ) : (
              produtos.map((produto) => (
                <ProdutoCard key={produto.id_produto} produto={produto} />
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

export default Home;