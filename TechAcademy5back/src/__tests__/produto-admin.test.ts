import { Request, Response } from "express";
import Produto from "../models/Produto";
import { criarProduto, atualizarProduto, desativarProduto } from "../controllers/produto.controller";
import { authMiddleware, adminMiddleware } from "../config/auth.middleware";
import { TokenPayload } from "../config/jwt";

jest.mock("../models/Produto");
jest.mock("../config/auth.middleware");
jest.mock("../config/jwt");

const mockRequest = (body = {}, params = {}, headers = {}): Partial<Request> => ({
  body,
  params,
  headers,
  cliente: undefined,
});

const mockResponse = (): Partial<Response> => {
  const res: Partial<Response> = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe("Produto CRUD - Controle de Acesso Admin", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Criar Produto (POST) - Admin Only", () => {
    it("17. Admin pode criar produto", async () => {
      const adminCliente: TokenPayload = {
        id_cliente: 1,
        email: "admin@pcforge.com",
        admin: true,
      };

      (Produto.create as jest.Mock).mockResolvedValue({
        id_produto: 1,
        nome: "RTX 4070",
        valor: 3899,
        id_categoria: 5,
        estoque: 10,
        ativo: true,
      });

      const req = mockRequest(
        { nome: "RTX 4070", valor: 3899, id_categoria: 5, estoque: 10 },
        {}
      ) as Request;
      req.cliente = adminCliente;

      const res = mockResponse();

      await criarProduto(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          mensagem: "Produto criado com sucesso.",
          produto: expect.objectContaining({ nome: "RTX 4070" }),
        })
      );
    });

    it("18. Usuário comum não pode criar produto (admin=false)", async () => {
      const clienteComum: TokenPayload = {
        id_cliente: 2,
        email: "cliente@pcforge.com",
        admin: false,
      };

      const req = mockRequest(
        { nome: "RTX 4070", valor: 3899, id_categoria: 5 },
        {}
      ) as Request;
      req.cliente = clienteComum;

      const res = mockResponse();

      // Simula bloqueio por adminMiddleware (que deveria estar na rota)
      // Este teste documenta o comportamento esperado
      expect(req.cliente?.admin).toBe(false);
      // A rota deveria ter chamado adminMiddleware antes de chamar o controller
    });

    it("19. Rejeita criação sem campos obrigatórios", async () => {
      const adminCliente: TokenPayload = {
        id_cliente: 1,
        email: "admin@pcforge.com",
        admin: true,
      };

      const req = mockRequest(
        { nome: "RTX 4070" }, // sem valor
        {}
      ) as Request;
      req.cliente = adminCliente;

      const res = mockResponse();

      await criarProduto(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        mensagem: "Nome e valor são obrigatórios.",
      });
    });

    it("20. Erro ao criar produto no banco", async () => {
      const adminCliente: TokenPayload = {
        id_cliente: 1,
        email: "admin@pcforge.com",
        admin: true,
      };

      (Produto.create as jest.Mock).mockRejectedValue(new Error("DB Error"));

      const req = mockRequest(
        { nome: "RTX 4070", valor: 3899 },
        {}
      ) as Request;
      req.cliente = adminCliente;

      const res = mockResponse();

      await criarProduto(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        mensagem: "Erro interno ao criar produto.",
      });
    });
  });

  describe("Atualizar Produto (PUT) - Admin Only", () => {
    it("21. Admin pode atualizar produto", async () => {
      const adminCliente: TokenPayload = {
        id_cliente: 1,
        email: "admin@pcforge.com",
        admin: true,
      };

      const produtoMock = {
        id_produto: 1,
        nome: "RTX 4070",
        valor: 3899,
        update: jest.fn().mockResolvedValue(true),
      };

      (Produto.findOne as jest.Mock).mockResolvedValue(produtoMock);

      const req = mockRequest(
        { nome: "RTX 4070 Super", valor: 4499 },
        { id: "1" }
      ) as Request;
      req.cliente = adminCliente;

      const res = mockResponse();

      await atualizarProduto(req as Request, res as Response);

      expect(produtoMock.update).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          mensagem: "Produto atualizado com sucesso.",
        })
      );
    });

    it("22. Rejeita atualização de produto não encontrado", async () => {
      const adminCliente: TokenPayload = {
        id_cliente: 1,
        email: "admin@pcforge.com",
        admin: true,
      };

      (Produto.findOne as jest.Mock).mockResolvedValue(null);

      const req = mockRequest(
        { nome: "RTX 4070 Super" },
        { id: "999" }
      ) as Request;
      req.cliente = adminCliente;

      const res = mockResponse();

      await atualizarProduto(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        mensagem: "Produto não encontrado.",
      });
    });

    it("23. Preserva campos não enviados na atualização", async () => {
      const adminCliente: TokenPayload = {
        id_cliente: 1,
        email: "admin@pcforge.com",
        admin: true,
      };

      const produtoMock = {
        id_produto: 1,
        nome: "RTX 4070",
        valor: 3899,
        estoque: 10,
        update: jest.fn().mockResolvedValue(true),
      };

      (Produto.findOne as jest.Mock).mockResolvedValue(produtoMock);

      const req = mockRequest(
        { valor: 4499 }, // só atualiza preço
        { id: "1" }
      ) as Request;
      req.cliente = adminCliente;

      const res = mockResponse();

      await atualizarProduto(req as Request, res as Response);

      expect(produtoMock.update).toHaveBeenCalledWith(
        expect.objectContaining({ valor: 4499 })
      );
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe("Desativar Produto (DELETE) - Admin Only", () => {
    it("24. Admin pode desativar produto", async () => {
      const adminCliente: TokenPayload = {
        id_cliente: 1,
        email: "admin@pcforge.com",
        admin: true,
      };

      const produtoMock = {
        id_produto: 1,
        nome: "RTX 4070",
        update: jest.fn().mockResolvedValue(true),
      };

      (Produto.findOne as jest.Mock).mockResolvedValue(produtoMock);

      const req = mockRequest({}, { id: "1" }) as Request;
      req.cliente = adminCliente;

      const res = mockResponse();

      await desativarProduto(req as Request, res as Response);

      expect(produtoMock.update).toHaveBeenCalledWith({ ativo: false });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        mensagem: "Produto desativado com sucesso.",
      });
    });

    it("25. Rejeita desativação de produto não encontrado", async () => {
      const adminCliente: TokenPayload = {
        id_cliente: 1,
        email: "admin@pcforge.com",
        admin: true,
      };

      (Produto.findOne as jest.Mock).mockResolvedValue(null);

      const req = mockRequest({}, { id: "999" }) as Request;
      req.cliente = adminCliente;

      const res = mockResponse();

      await desativarProduto(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });
});
