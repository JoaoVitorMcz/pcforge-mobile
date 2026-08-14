import { NextFunction, Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import Cliente from "../models/Cliente";
import {
  buscarClientePorId,
  criarCliente,
  listarClientes,
  loginCliente,
} from "../controllers/cliente.controller";

jest.mock("../models/Cliente");
jest.mock("bcrypt");
jest.mock("jsonwebtoken");


beforeAll(() => {
  process.env.JWT_SECRET = "segredo_teste";
});


beforeEach(() => {
  jest.clearAllMocks();

  (jwt.sign as jest.Mock).mockReturnValue("token_fake");
  (jwt.verify as jest.Mock).mockReturnValue({
    id_cliente: 1,
    email: "joao@email.com",
    admin: false,
  });
});

const mockRequest = (body = {}, params = {}, query = {}): Partial<Request> => ({
  body,
  params,
  query,
});

const mockResponse = (): Partial<Response> => {
  const res: Partial<Response> = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe("cliente.controller", () => {
  it("1. Login com sucesso retorna token", async () => {
    const clienteMock = {
      id_cliente: 1,
      email: "joao@email.com",
      senha: "hashSenha",
      admin: false,
      toJSON: () => ({
        id_cliente: 1,
        email: "joao@email.com",
        senha: "hashSenha",
      }),
    };

    (Cliente.findOne as jest.Mock).mockResolvedValue(clienteMock);
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);

    const req = mockRequest({
      email: "joao@email.com",
      senha: "Senha123",
    });
    const res = mockResponse();

    await loginCliente(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ token: "token_fake" })
    );
  });

  it("2. Rota protegida com token valido chama next()", () => {
    const { authMiddleware } = require("../config/auth.middleware");

    const req = {
      headers: { authorization: "Bearer token_fake" },
    } as unknown as Request;

    const res = mockResponse();
    const next = jest.fn() as NextFunction;

    authMiddleware(req, res as Response, next);

    expect(next).toHaveBeenCalled();
  });

  it("3. Bloqueia acesso ao perfil de outro cliente", () => {
    
    const { selfOrAdminMiddleware } = require("../config/auth.middleware");

    const req = {
      cliente: {
        id_cliente: 1,
        email: "joao@email.com",
        admin: false,
      },
      params: { id: "2" },
    } as unknown as Request;

    const res = mockResponse();
    const next = jest.fn() as NextFunction;

    selfOrAdminMiddleware()(req, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it("4. Nao permite cadastro sem campos obrigatorios", async () => {
    const req = mockRequest({ nome: "Joao" });
    const res = mockResponse();

    await criarCliente(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      mensagem: "Nome, email, senha e CPF sao obrigatorios.",
    });
  });

  it("5. Nao permite email invalido", async () => {
    const req = mockRequest({
      nome: "Joao",
      email: "email-invalido",
      senha: "Senha123",
      cpf: "12345678901",
    });
    const res = mockResponse();

    await criarCliente(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      mensagem: "E-mail invalido.",
    });
  });

  it("6. Senha e armazenada criptografada", async () => {
    (Cliente.findOne as jest.Mock)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null);

    (bcrypt.hash as jest.Mock).mockResolvedValue("senhaHash");

    const novoCliente = {
      toJSON: () => ({
        id_cliente: 1,
        nome: "Joao",
        email: "joao@email.com",
        senha: "senhaHash",
      }),
    };

    (Cliente.create as jest.Mock).mockResolvedValue(novoCliente);

    const req = mockRequest({
      nome: "Joao",
      email: "joao@email.com",
      senha: "Senha123",
      cpf: "123.456.789-01",
    });

    const res = mockResponse();

    await criarCliente(req as Request, res as Response);

    expect(bcrypt.hash).toHaveBeenCalledWith("Senha123", 10);
    expect(Cliente.create).toHaveBeenCalledWith(
      expect.objectContaining({ cpf: "12345678901" })
    );
  });

  it("7. Retorna 404 quando cliente nao existe", async () => {
    (Cliente.findOne as jest.Mock).mockResolvedValue(null);

    const req = mockRequest({}, { id: "999" });
    const res = mockResponse();

    await buscarClientePorId(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it("8. Lista clientes com paginacao", async () => {
    (Cliente.findAndCountAll as jest.Mock).mockResolvedValue({
      rows: [{ id_cliente: 1, nome: "Joao" }],
      count: 1,
    });

    const req = mockRequest({}, {}, { page: "1", limit: "10" });
    const res = mockResponse();

    await listarClientes(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      dados: [{ id_cliente: 1, nome: "Joao" }],
      paginacao: {
        paginaAtual: 1,
        porPagina: 10,
        totalItens: 1,
        totalPaginas: 1,
      },
    });
  });
});