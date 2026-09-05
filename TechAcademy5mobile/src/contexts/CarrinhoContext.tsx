import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { listarProdutos } from "@/services/produtos";
import { lerSessao, removerSessao, salvarSessao } from "@/services/sessao";
import { useAuth } from "./AuthContext";
import type { ItemCarrinho, Produto } from "@/types";

/** O que vai para o disco: so o essencial para reconstruir o carrinho. */
interface ItemGravado {
  id_produto: number;
  quantidade: number;
}

interface CarrinhoContextValue {
  itens: ItemCarrinho[];
  /** true enquanto o carrinho gravado ainda esta sendo lido e hidratado. */
  carregando: boolean;
  quantidadeTotal: number;
  total: number;
  adicionar: (produto: Produto) => void;
  aumentar: (idProduto: number) => void;
  diminuir: (idProduto: number) => void;
  remover: (idProduto: number) => void;
  limpar: () => void;
}

const CarrinhoContext = createContext<CarrinhoContextValue | null>(null);

/**
 * Carrinho separado por cliente, como no front web: o carrinho de quem estava
 * navegando sem login nao vaza para a conta que entrar depois.
 */
const chaveDoCarrinho = (idCliente?: number): string =>
  idCliente ? `pcforge.carrinho.${idCliente}` : "pcforge.carrinho.anonimo";

/**
 * Carrinho local do cliente.
 *
 * Porta as regras de TechAcademy5front/src/context/CarrinhoContext.jsx, com
 * duas diferencas deliberadas:
 *
 * 1. Persiste apenas { id_produto, quantidade } e hidrata nome, preco e
 *    estoque contra o catalogo ao abrir. A web guarda o snapshot inteiro e
 *    acaba servindo preco velho; alem disso o SecureStore do Android
 *    recomenda menos de 2 KB por valor, que um carrinho com snapshot estoura.
 * 2. Usa os helpers de services/sessao.ts, que resolvem SecureStore no nativo
 *    e localStorage no web — os mesmos que a sessao usa.
 *
 * O estoque e o teto de quantidade, mas so vale como primeira barreira: a
 * decisao final e do backend, que responde 409 no checkout se o estoque tiver
 * mudado nesse meio-tempo.
 */
export function CarrinhoProvider({ children }: { children: React.ReactNode }) {
  const { cliente } = useAuth();
  const idCliente = cliente?.id_cliente;

  const [itens, setItens] = useState<ItemCarrinho[]>([]);

  /**
   * De qual cliente a lista de itens e, neste momento.
   *
   * Enquanto nao bater com o cliente atual, a hidratacao ainda esta em curso.
   * Derivar o estado de carregamento disso, em vez de guardar um booleano,
   * evita marcar estado de forma sincrona dentro do efeito — e serve de
   * guarda para a persistencia nao gravar a lista vazia inicial por cima do
   * carrinho que ainda esta sendo lido.
   */
  const [hidratadoPara, setHidratadoPara] = useState<number | null | undefined>(undefined);
  const carregando = hidratadoPara !== (idCliente ?? null);

  useEffect(() => {
    let cancelado = false;

    (async () => {
      try {
        const bruto = await lerSessao(chaveDoCarrinho(idCliente));
        const gravados: ItemGravado[] = bruto ? JSON.parse(bruto) : [];

        if (gravados.length === 0) {
          if (!cancelado) setItens([]);
          return;
        }

        // Hidrata contra o catalogo: preco e estoque sempre atuais, e produto
        // que saiu do ar simplesmente nao volta para o carrinho.
        const catalogo = await listarProdutos();
        const porId = new Map(catalogo.map((produto) => [produto.id_produto, produto]));

        const reconstruido = gravados.flatMap<ItemCarrinho>((gravado) => {
          const produto = porId.get(gravado.id_produto);
          if (!produto) return [];

          return [{ produto, quantidade: Math.min(gravado.quantidade, produto.estoque) }];
        });

        if (!cancelado) setItens(reconstruido.filter((item) => item.quantidade > 0));
      } catch {
        // Carrinho corrompido ou catalogo fora do ar: comeca vazio.
        if (!cancelado) setItens([]);
      } finally {
        if (!cancelado) setHidratadoPara(idCliente ?? null);
      }
    })();

    return () => {
      cancelado = true;
    };
  }, [idCliente]);

  useEffect(() => {
    // Enquanto hidrata, nao grava: gravaria a lista vazia inicial por cima
    // do carrinho que ainda esta sendo lido do disco.
    if (carregando) return;

    const chave = chaveDoCarrinho(idCliente);
    const gravados: ItemGravado[] = itens.map((item) => ({
      id_produto: item.produto.id_produto,
      quantidade: item.quantidade,
    }));

    void (gravados.length > 0
      ? salvarSessao(chave, JSON.stringify(gravados))
      : removerSessao(chave));
  }, [itens, idCliente, carregando]);

  const adicionar = useCallback((produto: Produto) => {
    if (produto.estoque <= 0) return;

    setItens((atual) => {
      const existente = atual.find((item) => item.produto.id_produto === produto.id_produto);

      if (!existente) {
        return [...atual, { produto, quantidade: 1 }];
      }

      if (existente.quantidade >= produto.estoque) {
        return atual;
      }

      return atual.map((item) =>
        item.produto.id_produto === produto.id_produto
          ? { produto, quantidade: item.quantidade + 1 }
          : item
      );
    });
  }, []);

  const aumentar = useCallback((idProduto: number) => {
    setItens((atual) =>
      atual.map((item) =>
        item.produto.id_produto === idProduto && item.quantidade < item.produto.estoque
          ? { ...item, quantidade: item.quantidade + 1 }
          : item
      )
    );
  }, []);

  const diminuir = useCallback((idProduto: number) => {
    setItens((atual) =>
      atual.map((item) =>
        item.produto.id_produto === idProduto && item.quantidade > 1
          ? { ...item, quantidade: item.quantidade - 1 }
          : item
      )
    );
  }, []);

  const remover = useCallback((idProduto: number) => {
    setItens((atual) => atual.filter((item) => item.produto.id_produto !== idProduto));
  }, []);

  const limpar = useCallback(() => setItens([]), []);

  const valor = useMemo<CarrinhoContextValue>(() => {
    const quantidadeTotal = itens.reduce((soma, item) => soma + item.quantidade, 0);
    const total = itens.reduce(
      (soma, item) => soma + Number(item.produto.valor) * item.quantidade,
      0
    );

    return {
      itens,
      carregando,
      quantidadeTotal,
      total,
      adicionar,
      aumentar,
      diminuir,
      remover,
      limpar,
    };
  }, [itens, carregando, adicionar, aumentar, diminuir, remover, limpar]);

  return <CarrinhoContext.Provider value={valor}>{children}</CarrinhoContext.Provider>;
}

export function useCarrinho(): CarrinhoContextValue {
  const contexto = useContext(CarrinhoContext);

  if (!contexto) {
    throw new Error("useCarrinho precisa estar dentro de CarrinhoProvider.");
  }

  return contexto;
}
