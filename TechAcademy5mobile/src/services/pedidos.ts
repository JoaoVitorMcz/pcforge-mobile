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
