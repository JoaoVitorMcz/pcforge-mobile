/**
 * Regra de estoque no servico de pedidos.
 *
 * pedido.test.ts mocka pedido.service inteiro, entao a regra que mais importa
 * do dominio — nao vender o que nao existe e nao deixar estoque preso — nunca
 * era exercitada. Aqui os models sao mockados e o servico roda de verdade.
 */
jest.mock("../config/database", () => ({
  __esModule: true,
  default: { transaction: jest.fn() },
}));
jest.mock("../models/Produto", () => ({
  __esModule: true,
  default: { findAll: jest.fn(), decrement: jest.fn() },
}));
jest.mock("../models/Pedido", () => ({
  __esModule: true,
  default: { create: jest.fn(), findByPk: jest.fn() },
}));
jest.mock("../models/Itempedido", () => ({
  __esModule: true,
  default: { bulkCreate: jest.fn() },
}));
jest.mock("../models/Endereco", () => ({
  __esModule: true,
  default: { findByPk: jest.fn() },
}));
jest.mock("../models/Cliente", () => ({ __esModule: true, default: {} }));

import sequelize from "../config/database";
import Produto from "../models/Produto";
import Pedido from "../models/Pedido";
import ItemPedido from "../models/Itempedido";
import Endereco from "../models/Endereco";
import { criarPedidoComItens, HttpError } from "../services/pedido.service";

const ID_CLIENTE = 1;
const ID_ENDERECO = 10;

let transactionMock: { commit: jest.Mock; rollback: jest.Mock };

/** Produto com o estoque que o teste quiser, ja no formato do findAll. */
const produtoComEstoque = (estoque: number) => ({
  id_produto: 5,
  nome: "RTX 4070",
  valor: 100,
  estoque,
});

beforeEach(() => {
  jest.clearAllMocks();

  // clearAllMocks zera chamadas mas nao implementacoes: sem redefinir aqui, o
  // mockRejectedValue de um teste vaza para os seguintes.
  (Produto.decrement as jest.Mock).mockResolvedValue([1]);

  transactionMock = { commit: jest.fn(), rollback: jest.fn() };
  (sequelize.transaction as jest.Mock).mockResolvedValue(transactionMock);
  (Endereco.findByPk as jest.Mock).mockResolvedValue({
    id_endereco: ID_ENDERECO,
    id_cliente: ID_CLIENTE,
  });
  (Pedido.create as jest.Mock).mockResolvedValue({ id_pedido: 99 });
  (ItemPedido.bulkCreate as jest.Mock).mockResolvedValue([]);
  (Pedido.findByPk as jest.Mock).mockResolvedValue({ id_pedido: 99, status: "pendente" });
});

describe("criarPedidoComItens - regra de estoque", () => {
  it("1. baixa o estoque exatamente pela quantidade pedida", async () => {
    (Produto.findAll as jest.Mock).mockResolvedValue([produtoComEstoque(10)]);

    await criarPedidoComItens({
      id_cliente: ID_CLIENTE,
      id_endereco_entrega: ID_ENDERECO,
      itens: [{ id_produto: 5, quantidade: 3 }],
    });

    expect(Produto.decrement).toHaveBeenCalledWith(
      "estoque",
      expect.objectContaining({ by: 3, where: { id_produto: 5 } })
    );
    expect(transactionMock.commit).toHaveBeenCalled();
  });

  it("2. baixa dentro da mesma transacao do pedido e dos itens", async () => {
    (Produto.findAll as jest.Mock).mockResolvedValue([produtoComEstoque(10)]);

    await criarPedidoComItens({
      id_cliente: ID_CLIENTE,
      id_endereco_entrega: ID_ENDERECO,
      itens: [{ id_produto: 5, quantidade: 2 }],
    });

    // Se a baixa ficasse fora da transacao, um rollback do pedido deixaria o
    // estoque descontado sem venda correspondente.
    const chamada = (Produto.decrement as jest.Mock).mock.calls[0][1];
    expect(chamada.transaction).toBe(transactionMock);
  });

  it("3. recusa com 409 quando falta estoque, sem gravar nada", async () => {
    (Produto.findAll as jest.Mock).mockResolvedValue([produtoComEstoque(2)]);

    await expect(
      criarPedidoComItens({
        id_cliente: ID_CLIENTE,
        id_endereco_entrega: ID_ENDERECO,
        itens: [{ id_produto: 5, quantidade: 5 }],
      })
    ).rejects.toMatchObject({ statusCode: 409 });

    expect(Pedido.create).not.toHaveBeenCalled();
    expect(ItemPedido.bulkCreate).not.toHaveBeenCalled();
    expect(Produto.decrement).not.toHaveBeenCalled();
  });

  it("4. soma as quantidades do mesmo produto antes de conferir o estoque", async () => {
    (Produto.findAll as jest.Mock).mockResolvedValue([produtoComEstoque(4)]);

    // 3 + 3 = 6 para um estoque de 4: separadamente cada linha passaria.
    await expect(
      criarPedidoComItens({
        id_cliente: ID_CLIENTE,
        id_endereco_entrega: ID_ENDERECO,
        itens: [
          { id_produto: 5, quantidade: 3 },
          { id_produto: 5, quantidade: 3 },
        ],
      })
    ).rejects.toBeInstanceOf(HttpError);

    expect(Produto.decrement).not.toHaveBeenCalled();
  });

  it("5. desfaz a transacao quando a baixa de estoque falha", async () => {
    (Produto.findAll as jest.Mock).mockResolvedValue([produtoComEstoque(10)]);
    (Produto.decrement as jest.Mock).mockRejectedValue(new Error("falha no banco"));

    await expect(
      criarPedidoComItens({
        id_cliente: ID_CLIENTE,
        id_endereco_entrega: ID_ENDERECO,
        itens: [{ id_produto: 5, quantidade: 1 }],
      })
    ).rejects.toThrow("falha no banco");

    expect(transactionMock.rollback).toHaveBeenCalled();
    expect(transactionMock.commit).not.toHaveBeenCalled();
  });

  it("6. congela o preco vigente no item do pedido", async () => {
    (Produto.findAll as jest.Mock).mockResolvedValue([produtoComEstoque(10)]);

    await criarPedidoComItens({
      id_cliente: ID_CLIENTE,
      id_endereco_entrega: ID_ENDERECO,
      itens: [{ id_produto: 5, quantidade: 2 }],
    });

    expect(ItemPedido.bulkCreate).toHaveBeenCalledWith(
      [expect.objectContaining({ id_produto: 5, quantidade: 2, preco_unitario: 100 })],
      expect.objectContaining({ transaction: transactionMock })
    );
  });

  it("7. recusa endereco que nao pertence ao cliente, antes de tocar no estoque", async () => {
    (Produto.findAll as jest.Mock).mockResolvedValue([produtoComEstoque(10)]);
    (Endereco.findByPk as jest.Mock).mockResolvedValue({
      id_endereco: ID_ENDERECO,
      id_cliente: 999,
    });

    await expect(
      criarPedidoComItens({
        id_cliente: ID_CLIENTE,
        id_endereco_entrega: ID_ENDERECO,
        itens: [{ id_produto: 5, quantidade: 1 }],
      })
    ).rejects.toMatchObject({ statusCode: 403 });

    expect(Produto.decrement).not.toHaveBeenCalled();
  });
});
