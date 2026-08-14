import { Request, Response } from "express";
import Categoria from "../models/Categoria";
import {
  atualizarCategoria,
  buscarCategoria,
  criarCategoria,
  deletarCategoria,
  listarCategorias,
} from "../controllers/categoria.controller";

jest.mock("../models/Categoria");

const mockRequest = (body = {}, params = {}, query = {}): Partial<Request> => ({ body, params, query });

const mockResponse = (): Partial<Response> => {
  const res: Partial<Response> = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe("categoria.controller", () => {
  it("1. cria categoria com sucesso", async () => {
    (Categoria.create as jest.Mock).mockResolvedValue({ id_categoria: 1, nome: "Placa de video" });
    const req = mockRequest({ nome: "Placa de video" });
    const res = mockResponse();

    await criarCategoria(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(201);
  });

  it("2. lista categorias com paginacao", async () => {
    (Categoria.findAndCountAll as jest.Mock).mockResolvedValue({
      rows: [{ id_categoria: 1, nome: "Placa de video" }],
      count: 1,
    });
    const req = mockRequest();
    const res = mockResponse();

    await listarCategorias(req as Request, res as Response);

    expect(res.json).toHaveBeenCalledWith([{ id_categoria: 1, nome: "Placa de video" }]);
  });

  it("3. busca categoria por id", async () => {
    (Categoria.findByPk as jest.Mock).mockResolvedValue({ id_categoria: 1, nome: "Placa de video" });
    const req = mockRequest({}, { id: "1" });
    const res = mockResponse();

    await buscarCategoria(req as Request, res as Response);

    expect(res.json).toHaveBeenCalled();
  });

  it("4. atualiza categoria existente", async () => {
    const categoriaMock = { update: jest.fn().mockResolvedValue(true) };
    (Categoria.findByPk as jest.Mock).mockResolvedValue(categoriaMock);
    const req = mockRequest({ nome: "SSD" }, { id: "1" });
    const res = mockResponse();

    await atualizarCategoria(req as Request, res as Response);

    expect(categoriaMock.update).toHaveBeenCalledWith({ nome: "SSD" });
  });

  it("5. deleta categoria existente", async () => {
    const categoriaMock = { destroy: jest.fn().mockResolvedValue(true) };
    (Categoria.findByPk as jest.Mock).mockResolvedValue(categoriaMock);
    const req = mockRequest({}, { id: "1" });
    const res = mockResponse();

    await deletarCategoria(req as Request, res as Response);

    expect(categoriaMock.destroy).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({ mensagem: "Categoria deletada com sucesso" });
  });
});
