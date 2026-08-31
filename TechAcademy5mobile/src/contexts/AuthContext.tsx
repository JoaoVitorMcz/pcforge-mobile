import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import { login as loginNaApi } from "@/services/clientes";
import type { Cliente } from "@/types";

const CHAVE_TOKEN = "pcforge.token";
const CHAVE_CLIENTE = "pcforge.cliente";

/**
 * Persistencia da sessao por plataforma.
 *
 * expo-secure-store nao existe no web: encosta no Keychain do iOS e no
 * Keystore do Android, que nao tem equivalente no navegador. A build web cai
 * no localStorage, que e legivel por qualquer script da pagina — aceitavel
 * porque o web e so a versao de demonstracao. O entregavel nativo continua no
 * armazenamento seguro do sistema.
 */
const lerSessao = async (chave: string): Promise<string | null> =>
  Platform.OS === "web" ? localStorage.getItem(chave) : SecureStore.getItemAsync(chave);

const salvarSessao = async (chave: string, valor: string): Promise<void> => {
  if (Platform.OS === "web") {
    localStorage.setItem(chave, valor);
    return;
  }

  await SecureStore.setItemAsync(chave, valor);
};

const removerSessao = async (chave: string): Promise<void> => {
  if (Platform.OS === "web") {
    localStorage.removeItem(chave);
    return;
  }

  await SecureStore.deleteItemAsync(chave);
};

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

/**
 * Credenciais corretas, mas a conta nao e de administrador.
 *
 * Este app e o painel da loja; cliente comum compra pela web. A recusa
 * acontece aqui, antes de gravar a sessao, para nao existir estado logado de
 * quem nao pode usar o app — o layout do painel e a API sao as outras duas
 * camadas, nao a unica.
 */
export class AcessoRestritoError extends Error {
  constructor() {
    super("Este aplicativo e restrito a administradores.");
    this.name = "AcessoRestritoError";
  }
}

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

    if (!ehAdmin(resposta.cliente)) {
      throw new AcessoRestritoError();
    }

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
