import { requisitar } from "./api";
import type { Paginado, Produto } from "@/types";

/**
 * A API devolve um array puro em /produtos e um objeto paginado quando a query
 * traz page/limit. Normalizamos aqui para a tela lidar sempre com uma lista.
 */
export async function listarProdutos(pagina?: number): Promise<Produto[]> {
  const caminho = pagina ? `/produtos?page=${pagina}&limit=20` : "/produtos";
  const resposta = await requisitar<Produto[] | Paginado<Produto>>(caminho);

  const lista = Array.isArray(resposta) ? resposta : resposta.dados;

  // valor chega como string decimal do MySQL em alguns casos.
  return lista.map((produto) => ({ ...produto, valor: Number(produto.valor) }));
}
