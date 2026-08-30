import { Request, Response, NextFunction } from "express";
import { authMiddleware, authorizeRole, selfOrAdminMiddleware } from "../config/auth.middleware";
import jwt from "jsonwebtoken";
import type { JwtPayload } from "jsonwebtoken";
import { getJwtSecret, TokenPayload } from "../config/jwt";

jest.mock("../config/jwt");

const mockRequest = (
  headers: Record<string, string> = {},
  params: Record<string, string> = {},
  body: unknown = {}
): Partial<Request> => ({
  headers,
  params,
  body,
});

const mockResponse = (): Partial<Response> => {
  const res: Partial<Response> = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const mockNext: NextFunction = jest.fn();

describe("Auth Middleware - Autenticação e Autorização Admin", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getJwtSecret as jest.Mock).mockReturnValue("test-secret-key");
  });

  describe("authMiddleware", () => {
    it("1. Rejeita requisição sem Authorization header", () => {
      const req = mockRequest({}) as Request;
      const res = mockResponse() as Response;

      authMiddleware(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ mensagem: "Token nao fornecido." });
    });

    it("2. Rejeita requisição sem Bearer prefix", () => {
      const req = mockRequest({ authorization: "InvalidToken123" }) as Request;
      const res = mockResponse() as Response;

      authMiddleware(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ mensagem: "Token nao fornecido." });
    });

    it("3. Rejeita token inválido", () => {
      jest.spyOn(jwt, "verify").mockImplementation(() => {
        throw new Error("Token inválido");
      });

      const req = mockRequest({ authorization: "Bearer invalid.token.here" }) as Request;
      const res = mockResponse() as Response;

      authMiddleware(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ mensagem: "Token invalido ou expirado." });
    });

    it("4. Aceita token válido e popula req.cliente", () => {
      const tokenPayload: TokenPayload = {
        id_cliente: 1,
        email: "admin@test.com",
        admin: true,
      };

      jest.spyOn(jwt, "verify").mockImplementation(() => tokenPayload as unknown as JwtPayload);

      const req = mockRequest({ authorization: "Bearer valid.token.here" }) as Request;
      const res = mockResponse() as Response;

      authMiddleware(req, res, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(req.cliente).toEqual(tokenPayload);
    });

    it("5. Rejeita token que retorna string (inválido)", () => {
      jest.spyOn(jwt, "verify").mockImplementation(() => "string-token");

      const req = mockRequest({ authorization: "Bearer token" }) as Request;
      const res = mockResponse() as Response;

      authMiddleware(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ mensagem: "Token invalido." });
    });
  });

  describe("authorizeRole com papel admin", () => {
    it("6. Bloqueia usuário sem admin flag", () => {
      const req = mockRequest() as Request;
      req.cliente = { id_cliente: 2, email: "user@test.com", admin: false };
      const res = mockResponse() as Response;

      authorizeRole(["admin"])(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        mensagem: "Permissoes insuficientes para acessar este recurso.",
      });
    });

    it("7. Bloqueia requisição sem req.cliente com 401, nao 403", () => {
      const req = mockRequest() as Request;
      const res = mockResponse() as Response;

      // Ordem invertida (autorizacao antes da autenticacao): req.cliente ainda
      // nao existe. E falta de autenticacao, por isso 401 e nao 403.
      authorizeRole(["admin"])(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ mensagem: "Usuario nao autenticado." });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("8. Permite acesso a usuário admin", () => {
      const req = mockRequest() as Request;
      req.cliente = { id_cliente: 1, email: "admin@test.com", admin: true };
      const res = mockResponse() as Response;

      authorizeRole(["admin"])(req, res, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe("selfOrAdminMiddleware", () => {
    it("9. Bloqueia requisição sem autenticação", () => {
      const req = mockRequest({}, { id: "1" }) as Request;
      const res = mockResponse() as Response;

      selfOrAdminMiddleware("id")(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        mensagem: "Usuario nao autenticado.",
      });
    });

    it("10. Bloqueia ID inválido no parâmetro", () => {
      const req = mockRequest({}, { id: "invalid" }) as Request;
      req.cliente = { id_cliente: 1, email: "user@test.com", admin: false };
      const res = mockResponse() as Response;

      selfOrAdminMiddleware("id")(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        mensagem: "ID invalido.",
      });
    });

    it("11. Permite usuário acessar seus próprios dados", () => {
      const req = mockRequest({}, { id: "1" }) as Request;
      req.cliente = { id_cliente: 1, email: "user@test.com", admin: false };
      const res = mockResponse() as Response;

      selfOrAdminMiddleware("id")(req, res, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it("12. Bloqueia usuário tentando acessar dados de outro", () => {
      const req = mockRequest({}, { id: "2" }) as Request;
      req.cliente = { id_cliente: 1, email: "user@test.com", admin: false };
      const res = mockResponse() as Response;

      selfOrAdminMiddleware("id")(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        mensagem: "Voce nao tem permissao para acessar este recurso.",
      });
    });

    it("13. Permite admin acessar dados de outro usuário", () => {
      const req = mockRequest({}, { id: "2" }) as Request;
      req.cliente = { id_cliente: 1, email: "admin@test.com", admin: true };
      const res = mockResponse() as Response;

      selfOrAdminMiddleware("id")(req, res, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it("14. Suporta parâmetro customizado", () => {
      const req = mockRequest({}, { clienteId: "1" }) as Request;
      req.cliente = { id_cliente: 1, email: "user@test.com", admin: false };
      const res = mockResponse() as Response;

      selfOrAdminMiddleware("clienteId")(req, res, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe("Cenários integrados - Produto CRUD com Auth", () => {
    it("15. Admin pode criar produto (teria token válido com admin=true)", () => {
      const adminToken: TokenPayload = {
        id_cliente: 1,
        email: "admin@test.com",
        admin: true,
      };

      jest.spyOn(jwt, "verify").mockImplementation(() => adminToken as unknown as JwtPayload);

      const req = mockRequest(
        { authorization: "Bearer admin-token" },
        {},
        { nome: "RTX 4070", valor: 3899 }
      ) as Request;
      const res = mockResponse() as Response;

      // Simula passagem por authMiddleware
      authMiddleware(req, res, mockNext);
      expect(req.cliente?.admin).toBe(true);

      // Simula passagem por authorizeRole(["admin"])
      authorizeRole(["admin"])(req, res, mockNext);
      expect(mockNext).toHaveBeenCalled();
    });

    it("16. Cliente comum é bloqueado ao criar produto (token com admin=false)", () => {
      const userToken: TokenPayload = {
        id_cliente: 2,
        email: "user@test.com",
        admin: false,
      };

      jest.spyOn(jwt, "verify").mockImplementation(() => userToken as unknown as JwtPayload);

      const req = mockRequest(
        { authorization: "Bearer user-token" },
        {},
        { nome: "RTX 4070", valor: 3899 }
      ) as Request;
      const res = mockResponse() as Response;

      // Passa por authMiddleware
      authMiddleware(req, res, mockNext);
      expect(req.cliente?.admin).toBe(false);

      // Bloqueado por authorizeRole(["admin"])
      jest.clearAllMocks();
      authorizeRole(["admin"])(req, res, mockNext);
      expect(res.status).toHaveBeenCalledWith(403);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });
});
