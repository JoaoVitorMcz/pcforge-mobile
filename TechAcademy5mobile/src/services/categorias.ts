import { requisitar } from "./api";
import type { Categoria, Paginado } from "@/types";

/** Mesma normalizacao de /produtos: a API alterna entre array e paginado. */
export async function listarCategorias(): Promise<Categoria[]> {
  const resposta = await requisitar<Categoria[] | Paginado<Categoria>>("/categorias");
  return Array.isArray(resposta) ? resposta : resposta.dados;
}
