// @ts-check

import { createContext, useContext, useState, useEffect, useRef } from "react";
import { useUsuario } from "./UsuarioContext";

/**
 * @typedef {Object} CarrinhoContextValue
 * @property {ItemCarrinho[]} itens
 * @property {(produto: Omit<ItemCarrinho, "quantidade">) => void} adicionarAoCarrinho
 * @property {(id: number) => void} aumentar
 * @property {(id: number) => void} diminuir
 * @property {(id: number) => void} remover
 * @property {() => void} limparCarrinho
 * @property {() => void} recarregarCarrinho
 * @property {number} total
 */

/**
 * @typedef {{ estoque?: number | string | null }} ItemComEstoque
 */

const CarrinhoContext =
  /** @type {import("react").Context<CarrinhoContextValue | null>} */ (createContext(null));

/**
 * @param {ItemComEstoque | null | undefined} produto
 */
function getEstoqueLimite(produto) {
  const estoque = Number.parseInt(String(produto?.estoque ?? ""), 10);
  return Number.isFinite(estoque) ? estoque : null;
}

/**
 * @param {{ children: import("react").ReactNode }} props
 */
export const CarrinhoProvider = ({ children }) => {
  const { cliente } = useUsuario();

  const getCarrinhoKey = () =>
    cliente?.id_cliente ? `carrinho_${cliente.id_cliente}` : "carrinho_anonimo";

  const [itens, setItens] = useState(() => {
    try {
      const key = cliente?.id_cliente
        ? `carrinho_${cliente.id_cliente}`
        : "carrinho_anonimo";
      const salvo = localStorage.getItem(key);
      return salvo ? /** @type {ItemCarrinho[]} */ (JSON.parse(salvo)) : [];
    } catch {
      /** @type {ItemCarrinho[]} */
      return [];
    }
  });

  const inicializado = useRef(false);

  // Recarrega carrinho quando cliente muda (login/logout)
  useEffect(() => {
    try {
      const salvo = localStorage.getItem(getCarrinhoKey());
      setItens(salvo ? /** @type {ItemCarrinho[]} */ (JSON.parse(salvo)) : []);
    } catch {
      setItens([]);
    }
  }, [cliente?.id_cliente]);

  // Salva no localStorage quando itens mudam
  useEffect(() => {
    if (!inicializado.current) {
      inicializado.current = true;
      return;
    }
    try {
      localStorage.setItem(getCarrinhoKey(), JSON.stringify(itens));
    } catch (error) {
      console.error("Erro ao salvar carrinho:", error);
    }
  }, [itens]);

  /** @param {Omit<ItemCarrinho, "quantidade">} produto */
  const adicionarAoCarrinho = (produto) => {
    setItens((prev) => {
      const estoqueLimite = getEstoqueLimite(produto);
      if (estoqueLimite !== null && estoqueLimite <= 0) return prev;

      const itemExistente = prev.find((item) => item.id_produto === produto.id_produto);
      if (itemExistente) {
        if (estoqueLimite !== null && itemExistente.quantidade >= estoqueLimite) return prev;
        return prev.map((item) =>
          item.id_produto !== produto.id_produto
            ? item
            : { ...item, estoque: estoqueLimite ?? item.estoque ?? null, quantidade: item.quantidade + 1 }
        );
      }
      return [...prev, { ...produto, quantidade: 1 }];
    });
  };

  /** @param {number} id */
  const aumentar = (id) => {
    setItens((prev) =>
      prev.map((item) => {
        if (item.id_produto !== id) return item;
        const estoqueLimite = getEstoqueLimite(item);
        if (estoqueLimite !== null && item.quantidade >= estoqueLimite) return item;
        return { ...item, quantidade: item.quantidade + 1 };
      })
    );
  };

  /** @param {number} id */
  const diminuir = (id) => {
    setItens((prev) =>
      prev.map((item) =>
        item.id_produto === id && item.quantidade > 1
          ? { ...item, quantidade: item.quantidade - 1 }
          : item
      )
    );
  };

  /** @param {number} id */
  const remover = (id) => {
    setItens((prev) => prev.filter((item) => item.id_produto !== id));
  };

  const limparCarrinho = () => {
    setItens([]);
    localStorage.removeItem(getCarrinhoKey());
  };

  const recarregarCarrinho = () => {
    try {
      const salvo = localStorage.getItem(getCarrinhoKey());
      setItens(salvo ? /** @type {ItemCarrinho[]} */ (JSON.parse(salvo)) : []);
    } catch {
      setItens([]);
    }
  };

  const total = itens.reduce((acc, item) => {
    const preco = Number(item.valor || item.preco || 0);
    return acc + preco * item.quantidade;
  }, 0);

  /** @type {CarrinhoContextValue} */
  const value = {
    itens,
    adicionarAoCarrinho,
    aumentar,
    diminuir,
    remover,
    limparCarrinho,
    recarregarCarrinho,
    total,
  };

  return (
    <CarrinhoContext.Provider
      value={value}
    >
      {children}
    </CarrinhoContext.Provider>
  );
};

/** @returns {CarrinhoContextValue} */
export const useCarrinho = () => {
  const context = useContext(CarrinhoContext);
  if (!context) throw new Error("useCarrinho deve ser usado dentro de CarrinhoProvider");
  return context;
};
