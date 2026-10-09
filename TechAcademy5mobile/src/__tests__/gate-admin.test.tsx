import { render } from "@testing-library/react-native";
import LayoutAdmin from "@/app/(loja)/admin/_layout";
import { Redirect } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Guarda da area administrativa.
 *
 * Esconder a aba no layout de tabs e cosmetico — quem souber a rota chega por
 * navegacao direta. Este teste cobre a segunda das tres camadas de controle de
 * acesso: o redirect do layout. A terceira, o 403 da API, esta coberta em
 * TechAcademy5back/src/__tests__/rbac-authorize.test.ts.
 */
jest.mock("@/contexts/AuthContext", () => ({
  useAuth: jest.fn(),
}));

// Redirect e Stack viram mocks que nao renderizam nada: o teste pergunta para
// onde o layout mandou o usuario, e o componente real exigiria o roteador
// montado. Asserir sobre a chamada, e nao sobre a arvore, tambem evita
// depender de consulta por testID.
jest.mock("expo-router", () => {
  // Funcoes nomeadas: componente anonimo em mock reprova no react/display-name.
  function Stack({ children }: { children?: React.ReactNode }) {
    return children ?? null;
  }
  Stack.Screen = function StackScreen() {
    return null;
  };

  return { Stack, Redirect: jest.fn(() => null) };
});

const useAuthMock = useAuth as jest.MockedFunction<typeof useAuth>;
const RedirectMock = Redirect as unknown as jest.Mock;

const sessao = (parcial: Partial<ReturnType<typeof useAuth>>) =>
  useAuthMock.mockReturnValue({
    cliente: null,
    token: null,
    carregando: false,
    autenticado: false,
    isAdmin: false,
    entrar: jest.fn(),
    sair: jest.fn(),
    ...parcial,
  });

/** Para onde o layout redirecionou, ou null se deixou passar. */
const destino = (): string | null =>
  RedirectMock.mock.calls.length > 0 ? RedirectMock.mock.calls[0][0].href : null;

beforeEach(() => jest.clearAllMocks());

describe("gate da area administrativa", () => {
  it("manda para o login quem nao esta autenticado", async () => {
    sessao({ autenticado: false });

    await render(<LayoutAdmin />);

    expect(destino()).toBe("/(auth)/login");
  });

  it("devolve o cliente comum para a loja em vez de abrir o painel", async () => {
    sessao({ autenticado: true, isAdmin: false });

    await render(<LayoutAdmin />);

    expect(destino()).toBe("/(loja)");
  });

  it("deixa o admin entrar", async () => {
    sessao({ autenticado: true, isAdmin: true });

    await render(<LayoutAdmin />);

    expect(destino()).toBeNull();
  });

  it("nao decide nada enquanto a sessao gravada ainda esta sendo lida", async () => {
    // Sem esta guarda o layout leria autenticado = false no primeiro render e
    // chutaria para o login quem ja estava logado.
    sessao({ carregando: true, autenticado: true, isAdmin: true });

    await render(<LayoutAdmin />);

    expect(destino()).toBeNull();
  });
});
