import { useEffect } from "react";
import { act, render } from "@testing-library/react-native";
import { CarrinhoProvider, useCarrinho } from "@/contexts/CarrinhoContext";
import { lerSessao } from "@/services/sessao";
import { listarProdutos } from "@/services/produtos";
import type { Produto } from "@/types";

// O carrinho toca disco (SecureStore) e rede (catalogo). Os dois viram mock:
// o que esta sob teste e a regra de estoque, nao a persistencia.
jest.mock("@/services/sessao", () => ({
  lerSessao: jest.fn(),
  salvarSessao: jest.fn(),
  removerSessao: jest.fn(),
}));

jest.mock("@/services/produtos", () => ({
  listarProdutos: jest.fn(),
}));

// O carrinho e por cliente, entao depende do AuthContext. Basta o id.
jest.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ cliente: { id_cliente: 7, nome: "Cliente", email: "c@pcforge.com" } }),
}));

const lerSessaoMock = lerSessao as jest.MockedFunction<typeof lerSessao>;
const listarProdutosMock = listarProdutos as jest.MockedFunction<typeof listarProdutos>;

const produto = (parcial: Partial<Produto> = {}): Produto => ({
  id_produto: 1,
  nome: "RTX 4060",
  valor: 2000,
  estoque: 2,
  ...parcial,
});

/**
 * Expoe o contexto para o teste dirigir as acoes e ler o estado, sem depender
 * da tela do carrinho — que tem checkout, endereco e navegacao junto.
 *
 * A sonda nao renderiza nada: o alvo do teste e o valor do contexto, nao a
 * arvore. Assim a suite tambem nao depende de consulta por testID.
 *
 * A captura acontece num efeito, nao no corpo do componente: escrever em algo
 * declarado fora durante o render e efeito colateral, e as regras do
 * react-hooks reprovam. O efeito nao tem lista de dependencias de proposito,
 * para publicar o valor de todo render.
 */
const sonda: { carrinho: ReturnType<typeof useCarrinho> | null } = { carrinho: null };

function Sonda() {
  const valor = useCarrinho();

  useEffect(() => {
    sonda.carrinho = valor;
  });

  return null;
}

/** O contexto do ultimo render, ja hidratado. */
const carrinho = () => sonda.carrinho!;

const montar = async () => {
  // render do RNTL 14 devolve promessa: sem o await, o teste leria o estado
  // antes do primeiro render, e nao depois da hidratacao.
  await render(
    <CarrinhoProvider>
      <Sonda />
    </CarrinhoProvider>
  );

  // A hidratacao encadeia duas promessas (lerSessao e listarProdutos). Cada
  // act vazio drena uma rodada de microtarefas; sem as duas, o teste leria o
  // estado inicial vazio no lugar do carrinho ja reconstruido.
  await act(async () => {});
  await act(async () => {});
};

beforeEach(() => {
  jest.clearAllMocks();
  lerSessaoMock.mockResolvedValue(null);
  listarProdutosMock.mockResolvedValue([]);
});

describe("CarrinhoContext — o estoque e o teto da quantidade", () => {
  it("adiciona o produto e soma o total", async () => {
    await montar();

    await act(async () => carrinho().adicionar(produto()));

    expect(carrinho().itens).toHaveLength(1);
    expect(carrinho().quantidadeTotal).toBe(1);
    expect(carrinho().total).toBe(2000);
  });

  it("nao adiciona produto sem estoque", async () => {
    await montar();

    await act(async () => carrinho().adicionar(produto({ estoque: 0 })));

    expect(carrinho().itens).toHaveLength(0);
  });

  it("nao passa do estoque ao adicionar o mesmo produto de novo", async () => {
    await montar();
    const rtx = produto({ estoque: 2 });

    await act(async () => carrinho().adicionar(rtx));
    await act(async () => carrinho().adicionar(rtx));
    await act(async () => carrinho().adicionar(rtx));

    expect(carrinho().quantidadeTotal).toBe(2);
  });

  it("aumentar para no estoque e diminuir nao passa de 1", async () => {
    await montar();

    await act(async () => carrinho().adicionar(produto({ estoque: 2 })));
    await act(async () => carrinho().aumentar(1));
    await act(async () => carrinho().aumentar(1));
    expect(carrinho().quantidadeTotal).toBe(2);

    await act(async () => carrinho().diminuir(1));
    await act(async () => carrinho().diminuir(1));
    await act(async () => carrinho().diminuir(1));
    expect(carrinho().quantidadeTotal).toBe(1);
  });

  it("remover tira o item e limpar esvazia o carrinho", async () => {
    await montar();

    await act(async () => carrinho().adicionar(produto()));
    await act(async () => carrinho().adicionar(produto({ id_produto: 2, nome: "Ryzen 5" })));
    expect(carrinho().itens).toHaveLength(2);

    await act(async () => carrinho().remover(1));
    expect(carrinho().itens).toHaveLength(1);

    await act(async () => carrinho().limpar());
    expect(carrinho().itens).toHaveLength(0);
  });
});

describe("CarrinhoContext — hidratacao contra o catalogo", () => {
  it("usa o preco atual do catalogo, nao o que estava gravado", async () => {
    lerSessaoMock.mockResolvedValue(JSON.stringify([{ id_produto: 1, quantidade: 1 }]));
    listarProdutosMock.mockResolvedValue([produto({ valor: 2500 })]);

    await montar();

    expect(carrinho().total).toBe(2500);
  });

  it("descarta o produto que saiu do catalogo", async () => {
    lerSessaoMock.mockResolvedValue(
      JSON.stringify([
        { id_produto: 1, quantidade: 1 },
        { id_produto: 99, quantidade: 1 },
      ])
    );
    listarProdutosMock.mockResolvedValue([produto()]);

    await montar();

    expect(carrinho().itens).toHaveLength(1);
    expect(carrinho().itens[0].produto.id_produto).toBe(1);
  });

  it("corta a quantidade gravada quando o estoque caiu enquanto o app estava fechado", async () => {
    lerSessaoMock.mockResolvedValue(JSON.stringify([{ id_produto: 1, quantidade: 5 }]));
    listarProdutosMock.mockResolvedValue([produto({ estoque: 2 })]);

    await montar();

    expect(carrinho().quantidadeTotal).toBe(2);
  });

  it("comeca vazio quando o carrinho gravado esta corrompido", async () => {
    lerSessaoMock.mockResolvedValue("{ isso nao e json");

    await montar();

    expect(carrinho().itens).toHaveLength(0);
  });
});
