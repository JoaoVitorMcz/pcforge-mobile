import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { login as loginNaApi } from "@/services/clientes";
import { aoReceber401 } from "@/services/api";
import { lerSessao, removerSessao, salvarSessao } from "@/services/sessao";
import type { Cliente } from "@/types";

const CHAVE_TOKEN = "pcforge.token";
const CHAVE_CLIENTE = "pcforge.cliente";

interface AuthContextValue {
  cliente: Cliente | null;
  token: string | null;
  /** true enquanto o token guardado ainda esta sendo lido do dispositivo. */
  carregando: boolean;
  autenticado: boolean;
  isAdmin: boolean;
  entrar: (email: string, senha: string) => Promise<void>;
  sair: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * A API devolve `admin` ora como boolean, ora como "true", ora como 1
 * (depende do driver). Mesma normalizacao usada no front web
 * (TechAcademy5front/src/context/UsuarioContext.jsx).
 */
const ehAdmin = (cliente: Cliente | null): boolean =>
  cliente?.admin === true || cliente?.admin === "true" || cliente?.admin === 1;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);

  // SecureStore e assincrono, diferente do localStorage do front web: a
  // navegacao precisa esperar esta leitura para nao piscar a tela de login
  // em quem ja esta autenticado.
  useEffect(() => {
    (async () => {
      try {
        const [tokenSalvo, clienteSalvo] = await Promise.all([
          lerSessao(CHAVE_TOKEN),
          lerSessao(CHAVE_CLIENTE),
        ]);

        if (tokenSalvo && clienteSalvo) {
          setToken(tokenSalvo);
          setCliente(JSON.parse(clienteSalvo) as Cliente);
        }
      } catch {
        // Sessao corrompida ou storage indisponivel: segue deslogado.
      } finally {
        setCarregando(false);
      }
    })();
  }, []);

  const entrar = useCallback(async (email: string, senha: string) => {
    const resposta = await loginNaApi(email, senha);

    await Promise.all([
      salvarSessao(CHAVE_TOKEN, resposta.token),
      salvarSessao(CHAVE_CLIENTE, JSON.stringify(resposta.cliente)),
    ]);

    setToken(resposta.token);
    setCliente(resposta.cliente);
  }, []);

  const sair = useCallback(async () => {
    await Promise.all([
      removerSessao(CHAVE_TOKEN),
      removerSessao(CHAVE_CLIENTE),
    ]);

    setToken(null);
    setCliente(null);
  }, []);

  useEffect(() => {
    return aoReceber401(() => {
      void sair();
    });
  }, [sair]);

  const valor = useMemo<AuthContextValue>(
    () => ({
      cliente,
      token,
      carregando,
      autenticado: Boolean(token && cliente),
      isAdmin: ehAdmin(cliente),
      entrar,
      sair,
    }),
    [cliente, token, carregando, entrar, sair]
  );

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const contexto = useContext(AuthContext);

  if (!contexto) {
    throw new Error("useAuth precisa estar dentro de AuthProvider.");
  }

  return contexto;
}
