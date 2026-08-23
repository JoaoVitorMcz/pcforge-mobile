import request from "supertest";
import jwt from "jsonwebtoken";
import app from "../index";
import Cliente from "../models/Cliente";
import Produto from "../models/Produto";
import Pedido from "../models/Pedido";

// Middleware e rota reais: o objetivo do teste e justamente provar que o
// authMiddleware/adminMiddleware estao ligados nesta rota.
//
// Os models sao interceptados com spyOn e nao com jest.mock: o automock
// substituiria as classes por objetos que nao sao subclasse de Model, e
// Endereco.belongsTo(Cliente) roda no import de index.ts, quebrando a suite.
const SEGREDO = "segredo-de-teste";

const tokenPara = (admin: boolean): string =>
  jwt.sign({ id_cliente: admin ? 1 : 2, email: "x@pcforge.com", admin }, SEGREDO);

describe("GET /admin/dashboard - controle de acesso e agregacoes", () => {
  beforeAll(() => {
    process.env.JWT_SECRET = SEGREDO;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  beforeEach(() => {
    jest.spyOn(Pedido, "findAll").mockResolvedValue([
      { status: "pendente", total: 2 },
      { status: "pago", total: 3 },
      { status: "entregue", total: 1 },
    ] as never);
    jest.spyOn(Pedido, "sum").mockResolvedValue(1500.5);
    jest.spyOn(Cliente, "count").mockResolvedValue(7);
    jest.spyOn(Produto, "count").mockResolvedValue(12);
    jest
      .spyOn(Produto, "findAll")
      .mockResolvedValue([{ id_produto: 9, nome: "Headset 7.1 Surround", estoque: 1 }] as never);
  });

  it("sem token retorna 401", async () => {
    const res = await request(app).get("/admin/dashboard");

    expect(res.status).toBe(401);
  });

  it("usuario comum retorna 403", async () => {
    const res = await request(app)
      .get("/admin/dashboard")
      .set("Authorization", `Bearer ${tokenPara(false)}`);

    expect(res.status).toBe(403);
  });

  it("admin retorna 200 com os agregados", async () => {
    const res = await request(app)
      .get("/admin/dashboard")
      .set("Authorization", `Bearer ${tokenPara(true)}`);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      totalPedidos: 6,
      faturamento: 1500.5,
      totalClientesAtivos: 7,
      totalProdutosAtivos: 12,
    });
    expect(res.body.produtosEstoqueBaixo).toHaveLength(1);
  });

  it("todo status conhecido aparece, mesmo zerado", async () => {
    const res = await request(app)
      .get("/admin/dashboard")
      .set("Authorization", `Bearer ${tokenPara(true)}`);

    // O app nao deveria precisar tratar chave ausente ao montar os cards.
    expect(res.body.pedidosPorStatus).toEqual({
      pendente: 2,
      pago: 3,
      em_preparacao: 0,
      enviado: 0,
      entregue: 1,
      cancelado: 0,
    });
  });

  it("faturamento vira 0 quando nao ha pedidos faturados", async () => {
    jest.spyOn(Pedido, "sum").mockResolvedValue(null as never);

    const res = await request(app)
      .get("/admin/dashboard")
      .set("Authorization", `Bearer ${tokenPara(true)}`);

    expect(res.body.faturamento).toBe(0);
  });
});
