import { API_BASE_URL } from "./config";

/** Erro de resposta da API, carregando o status para quem quiser tratar. */
export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, mensagem: string) {
    super(mensagem);
    this.name = "ApiError";
    this.status = status;
  }
}

type Metodo = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

interface Opcoes {
  metodo?: Metodo;
  corpo?: unknown;
  token?: string | null;
}

/** Mensagem de erro da API; cai para um texto generico quando nao vier JSON. */
async function extrairMensagem(resposta: Response): Promise<string> {
  try {
    const corpo = await resposta.json();
    return corpo?.mensagem ?? corpo?.error ?? `Erro ${resposta.status}`;
  } catch {
    return `Erro ${resposta.status}`;
  }
}

/**
 * Chamada HTTP para a API. Mesma ideia do wrapper usado no front web
 * (TechAcademy5front/src/config/api.js), adaptada para tipagem e token vindo
 * do SecureStore em vez do localStorage.
 */
export async function requisitar<T>(caminho: string, opcoes: Opcoes = {}): Promise<T> {
  const { metodo = "GET", corpo, token } = opcoes;

  const resposta = await fetch(`${API_BASE_URL}${caminho}`, {
    method: metodo,
    headers: {
      ...(corpo !== undefined && { "Content-Type": "application/json" }),
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: corpo !== undefined ? JSON.stringify(corpo) : undefined,
  });

  if (!resposta.ok) {
    throw new ApiError(resposta.status, await extrairMensagem(resposta));
  }

  if (resposta.status === 204) {
    return undefined as T;
  }

  const tipo = resposta.headers.get("content-type") ?? "";
  return tipo.includes("application/json") ? ((await resposta.json()) as T) : (undefined as T);
}
