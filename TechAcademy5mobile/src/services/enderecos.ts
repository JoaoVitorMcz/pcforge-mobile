import { requisitar } from "./api";
import type { Endereco, EnderecoFormulario } from "@/types";

export const listarEnderecos = (idCliente: number, token: string): Promise<Endereco[]> =>
  requisitar<Endereco[]>(`/enderecos/cliente/${idCliente}`, { token });

export const criarEndereco = (
  dados: EnderecoFormulario & { id_cliente: number },
  token: string
): Promise<Endereco> => requisitar<Endereco>("/enderecos", { metodo: "POST", corpo: dados, token });

export const atualizarEndereco = (
  id: number,
  dados: EnderecoFormulario,
  token: string
): Promise<Endereco> =>
  requisitar<Endereco>(`/enderecos/${id}`, { metodo: "PUT", corpo: dados, token });

export const excluirEndereco = (id: number, token: string): Promise<void> =>
  requisitar<void>(`/enderecos/${id}`, { metodo: "DELETE", token });
