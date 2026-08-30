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

/** Busca um produto pelo id, para a tela de edicao. */
export async function buscarProduto(id: number): Promise<Produto> {
  const produto = await requisitar<Produto>(`/produtos/${id}`);
  return { ...produto, valor: Number(produto.valor) };
}

/** Campos que o formulario do painel envia. O id e o ativo ficam com a API. */
export interface ProdutoFormulario {
  nome: string;
  descricao: string | null;
  valor: number;
  estoque: number;
  id_categoria: number | null;
  imagem: string | null;
  destaque: boolean;
}

export const criarProduto = (token: string, dados: ProdutoFormulario): Promise<{ produto: Produto }> =>
  requisitar<{ produto: Produto }>("/produtos", { metodo: "POST", corpo: dados, token });

export const atualizarProduto = (
  token: string,
  id: number,
  dados: ProdutoFormulario
): Promise<{ produto: Produto }> =>
  requisitar<{ produto: Produto }>(`/produtos/${id}`, { metodo: "PUT", corpo: dados, token });

/**
 * DELETE /produtos/:id e exclusao logica no backend: marca ativo = false.
 * O produto some da vitrine mas continua existindo para os pedidos que ja o
 * referenciam.
 */
export const desativarProduto = (token: string, id: number): Promise<void> =>
  requisitar<void>(`/produtos/${id}`, { metodo: "DELETE", token });
