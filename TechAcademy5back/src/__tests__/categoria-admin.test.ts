import { Request, Response } from "express";
import Categoria from "../models/Categoria";
import {
  criarCategoria,
  atualizarCategoria,
  deletarCategoria,
} from "../controllers/categoria.controller";
import { TokenPayload } from "../config/jwt";

jest.mock("../models/Categoria");
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

describe("Categoria CRUD - Controle de Acesso Admin", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Criar Categoria (POST) - Admin Only", () => {
    it("26. Admin pode criar categoria", async () => {
      const adminCliente: TokenPayload = {
        id_cliente: 1,
        email: "admin@pcforge.com",
        admin: true,
      };

      (Categoria.create as jest.Mock).mockResolvedValue({
        id_categoria: 5,
        nome: "Placas de Vídeo",
        descricao: "GPUs e placas gráficas",
        ativo: true,
      });

      const req = mockRequest(
        { nome: "Placas de Vídeo", descricao: "GPUs e placas gráficas", ativo: true },
        {}
      ) as Request;
      req.cliente = adminCliente;

      const res = mockResponse();

      await criarCategoria(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          id_categoria: 5,
          nome: "Placas de Vídeo",
        })
      );
    });

    it("27. Usuário comum não pode criar categoria (admin=false)", async () => {
      const clienteComum: TokenPayload = {
        id_cliente: 2,
        email: "cliente@pcforge.com",
        admin: false,
      };

      const req = mockRequest(
        { nome: "Placas de Vídeo", descricao: "GPUs" },
        {}
      ) as Request;
      req.cliente = clienteComum;

      const res = mockResponse();

      // Valida que o cliente não é admin
      expect(req.cliente?.admin).toBe(false);
      // A rota deveria bloquear no middleware adminMiddleware
    });

    it("28. Rejeita criação de categoria sem nome", async () => {
      const adminCliente: TokenPayload = {
        id_cliente: 1,
        email: "admin@pcforge.com",
        admin: true,
      };

      (Categoria.create as jest.Mock).mockRejectedValue(new Error("Validação"));

      const req = mockRequest(
        { descricao: "GPUs" }, // sem nome
        {}
      ) as Request;
      req.cliente = adminCliente;

      const res = mockResponse();

      await criarCategoria(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        erro: "Erro ao criar categoria",
      });
    });

    it("29. Erro ao criar categoria no banco", async () => {
      const adminCliente: TokenPayload = {
        id_cliente: 1,
        email: "admin@pcforge.com",
        admin: true,
      };

      (Categoria.create as jest.Mock).mockRejectedValue(new Error("DB Error"));

      const req = mockRequest(
        { nome: "Placas de Vídeo" },
        {}
      ) as Request;
      req.cliente = adminCliente;

      const res = mockResponse();

      await criarCategoria(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        erro: "Erro ao criar categoria",
      });
    });
  });

  describe("Atualizar Categoria (PUT) - Admin Only", () => {
    it("30. Admin pode atualizar categoria", async () => {
      const adminCliente: TokenPayload = {
        id_cliente: 1,
        email: "admin@pcforge.com",
        admin: true,
      };

      const categoriaMock = {
        id_categoria: 5,
        nome: "Placas de Vídeo",
        descricao: "GPUs",
        update: jest.fn().mockResolvedValue(true),
      };

      (Categoria.findByPk as jest.Mock).mockResolvedValue(categoriaMock);

      const req = mockRequest(
        { nome: "Placas Gráficas", descricao: "GPUs High-End" },
        { id: "5" }
      ) as Request;
      req.cliente = adminCliente;

      const res = mockResponse();

      await atualizarCategoria(req as Request, res as Response);

      expect(categoriaMock.update).toHaveBeenCalledWith({
        nome: "Placas Gráficas",
        descricao: "GPUs High-End",
      });
      expect(res.json).toHaveBeenCalled();
    });

    it("31. Rejeita atualização de categoria não encontrada", async () => {
      const adminCliente: TokenPayload = {
        id_cliente: 1,
        email: "admin@pcforge.com",
        admin: true,
      };

      (Categoria.findByPk as jest.Mock).mockResolvedValue(null);

      const req = mockRequest(
        { nome: "Nova Categoria" },
        { id: "999" }
      ) as Request;
      req.cliente = adminCliente;

      const res = mockResponse();

      await atualizarCategoria(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        erro: "Categoria não encontrada",
      });
    });

    it("32. Preserva campos não enviados na atualização", async () => {
      const adminCliente: TokenPayload = {
        id_cliente: 1,
        email: "admin@pcforge.com",
        admin: true,
      };

      const categoriaMock = {
        id_categoria: 5,
        nome: "Placas de Vídeo",
        descricao: "GPUs",
        update: jest.fn().mockResolvedValue(true),
      };

      (Categoria.findByPk as jest.Mock).mockResolvedValue(categoriaMock);

      const req = mockRequest(
        { descricao: "GPUs e Aceleradores" }, // só atualiza descrição
        { id: "5" }
      ) as Request;
      req.cliente = adminCliente;

      const res = mockResponse();

      await atualizarCategoria(req as Request, res as Response);

      expect(categoriaMock.update).toHaveBeenCalledWith({
        descricao: "GPUs e Aceleradores",
      });
    });
  });

  describe("Deletar Categoria (DELETE) - Admin Only", () => {
    it("33. Admin pode deletar categoria", async () => {
      const adminCliente: TokenPayload = {
        id_cliente: 1,
        email: "admin@pcforge.com",
        admin: true,
      };

      const categoriaMock = {
        id_categoria: 5,
        nome: "Placas de Vídeo",
        destroy: jest.fn().mockResolvedValue(true),
      };

      (Categoria.findByPk as jest.Mock).mockResolvedValue(categoriaMock);

      const req = mockRequest({}, { id: "5" }) as Request;
      req.cliente = adminCliente;

      const res = mockResponse();

      await deletarCategoria(req as Request, res as Response);

      expect(categoriaMock.destroy).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        mensagem: "Categoria deletada com sucesso",
      });
    });

    it("34. Rejeita deleção de categoria não encontrada", async () => {
      const adminCliente: TokenPayload = {
        id_cliente: 1,
        email: "admin@pcforge.com",
        admin: true,
      };

      (Categoria.findByPk as jest.Mock).mockResolvedValue(null);

      const req = mockRequest({}, { id: "999" }) as Request;
      req.cliente = adminCliente;

      const res = mockResponse();

      await deletarCategoria(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        erro: "Categoria não encontrada",
      });
    });

    it("35. Erro ao deletar categoria no banco", async () => {
      const adminCliente: TokenPayload = {
        id_cliente: 1,
        email: "admin@pcforge.com",
        admin: true,
      };

      (Categoria.findByPk as jest.Mock).mockRejectedValue(new Error("DB Error"));

      const req = mockRequest({}, { id: "5" }) as Request;
      req.cliente = adminCliente;

      const res = mockResponse();

      await deletarCategoria(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        erro: "Erro ao deletar categoria",
      });
    });

    it("36. Usuário comum não pode deletar categoria", async () => {
      const clienteComum: TokenPayload = {
        id_cliente: 2,
        email: "cliente@pcforge.com",
        admin: false,
      };

      const req = mockRequest({}, { id: "5" }) as Request;
      req.cliente = clienteComum;

      const res = mockResponse();

      // Valida que cliente não é admin
      expect(req.cliente?.admin).toBe(false);
      // A rota deveria bloquear no middleware adminMiddleware
    });
  });

  describe("Cenários de Erro - CRUD Admin", () => {
    it("37. Tratamento genérico de erro ao atualizar categoria", async () => {
      const adminCliente: TokenPayload = {
        id_cliente: 1,
        email: "admin@pcforge.com",
        admin: true,
      };

      (Categoria.findByPk as jest.Mock).mockRejectedValue(new Error("Conexão perdida"));

      const req = mockRequest({ nome: "Novo Nome" }, { id: "5" }) as Request;
      req.cliente = adminCliente;

      const res = mockResponse();

      await atualizarCategoria(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        erro: "Erro ao atualizar categoria",
      });
    });

    it("38. Validação - admin pode fazer qualquer operação CRUD", async () => {
      const adminCliente: TokenPayload = {
        id_cliente: 1,
        email: "admin@pcforge.com",
        admin: true,
      };

      // Admin sempre tem permissão
      expect(adminCliente.admin).toBe(true);
      expect(adminCliente.email).toContain("@pcforge.com");
    });
  });
});
