import { requisitar } from "./api";
import type { Cliente } from "@/types";

interface RespostaLogin {
  mensagem: string;
  token: string;
  cliente: Cliente;
}

export interface DadosCadastro {
  nome: string;
  email: string;
  senha: string;
  cpf: string;
  telefone?: string;
}

export const login = (email: string, senha: string): Promise<RespostaLogin> =>
  requisitar<RespostaLogin>("/clientes/login", { metodo: "POST", corpo: { email, senha } });

export const cadastrar = (dados: DadosCadastro): Promise<Cliente> =>
  requisitar<Cliente>("/clientes", { metodo: "POST", corpo: dados });
