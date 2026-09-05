import { requisitar } from "./api";
import type { Paginado, Pedido, StatusPedido } from "@/types";

/**
 * Transicoes de status aceitas pela API.
 *
 * Espelha TRANSICOES_DE_STATUS em pedido.controller.ts. Duplicar a tabela e
 * proposital: a tela so oferece o que vai ser aceito, em vez de deixar o admin
 * tentar e levar 409. O backend continua sendo quem decide — esta copia e
 * conveniencia de interface, nao a regra.
 */
export const TRANSICOES: Record<StatusPedido, StatusPedido[]> = {
  pendente: ["pago", "cancelado"],
  pago: ["em_preparacao", "cancelado"],
  em_preparacao: ["enviado", "cancelado"],
  enviado: ["entregue"],
  entregue: [],
  cancelado: [],
};

export const ROTULO_STATUS: Record<StatusPedido, string> = {
  pendente: "Pendente",
  pago: "Pago",
  em_preparacao: "Em preparação",
  enviado: "Enviado",
  entregue: "Entregue",
  cancelado: "Cancelado",
};

/** GET /pedidos e restrito a admin; a API alterna entre array e paginado. */
export async function listarPedidos(token: string): Promise<Pedido[]> {
  const resposta = await requisitar<Pedido[] | Paginado<Pedido>>("/pedidos", { token });
  const lista = Array.isArray(resposta) ? resposta : resposta.dados;

  // valor chega como string decimal do MySQL em alguns casos.
  return lista.map((pedido) => ({ ...pedido, valor: Number(pedido.valor ?? 0) }));
}

export async function buscarPedido(token: string, id: number): Promise<Pedido> {
  const pedido = await requisitar<Pedido>(`/pedidos/${id}`, { token });
  return { ...pedido, valor: Number(pedido.valor ?? 0) };
}

export const atualizarStatus = (
  token: string,
  id: number,
  status: StatusPedido
): Promise<{ pedido: Pedido }> =>
  requisitar<{ pedido: Pedido }>(`/pedidos/${id}/status`, {
    metodo: "PATCH",
    corpo: { status },
    token,
  });

/** Itens que o checkout envia: o backend resolve preco e valida estoque. */
export interface ItemDoPedido {
  id_produto: number;
  quantidade: number;
}

/**
 * Cria o pedido a partir do carrinho.
 *
 * POST /pedidos aceita os itens no proprio corpo, entao o carrinho e local e
 * /itens-pedido nao entra no checkout. O backend confere estoque, congela o
 * preco e da baixa, tudo em uma transacao.
 *
 * Exige a permissao pedido:criar, que o papel "cliente" recebe no cadastro.
 */
export const criarPedido = (
  token: string,
  dados: { id_endereco_entrega: number; itens: ItemDoPedido[] }
): Promise<{ pedido: Pedido }> =>
  requisitar<{ pedido: Pedido }>("/pedidos", { metodo: "POST", corpo: dados, token });

/** Pedidos do proprio cliente. A rota e protegida por selfOrAdminMiddleware. */
export async function listarPedidosDoCliente(token: string, idCliente: number): Promise<Pedido[]> {
  const resposta = await requisitar<Pedido[] | Paginado<Pedido>>(
    `/pedidos/cliente/${idCliente}`,
    { token }
  );
  const lista = Array.isArray(resposta) ? resposta : resposta.dados;

  return lista.map((pedido) => ({ ...pedido, valor: Number(pedido.valor ?? 0) }));
}

/** Cancelar devolve o estoque no backend; so vale para pedidos nao enviados. */
export const cancelarPedido = (token: string, idPedido: number): Promise<{ mensagem: string }> =>
  requisitar<{ mensagem: string }>(`/pedidos/${idPedido}/cancelar`, { metodo: "PATCH", token });
