import { Request, Response, NextFunction } from "express";
import {
  authMiddleware,
  authorizeRole,
  authorizePermission,
} from "../config/auth.middleware";
import jwt from "jsonwebtoken";
import type { JwtPayload } from "jsonwebtoken";
import { getJwtSecret, TokenPayload } from "../config/jwt";

jest.mock("../config/jwt");

const mockRequest = (headers: Record<string, string> = {}): Partial<Request> => ({
  headers,
  params: {},
  body: {},
});

const mockResponse = (): Partial<Response> => {
  const res: Partial<Response> = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const mockNext: NextFunction = jest.fn();

const PERMISSOES_INSUFICIENTES = {
  mensagem: "Permissoes insuficientes para acessar este recurso.",
};

describe("RBAC - autorizacao dinamica por papel e permissao", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getJwtSecret as jest.Mock).mockReturnValue("test-secret-key");
  });

  describe("authorizeRole", () => {
    it("1. Permite admin em rota restrita a admin", () => {
      const req = mockRequest() as Request;
      req.cliente = {
        id_cliente: 1,
        email: "admin@test.com",
        admin: true,
        roles: ["admin"],
      };
      const res = mockResponse() as Response;

      authorizeRole(["admin"])(req, res, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it("2. Bloqueia cliente comum com 403 em rota de admin", () => {
      const req = mockRequest() as Request;
      req.cliente = {
        id_cliente: 2,
        email: "cliente@test.com",
        admin: false,
        roles: ["cliente"],
      };
      const res = mockResponse() as Response;

      authorizeRole(["admin"])(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(PERMISSOES_INSUFICIENTES);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("3. Aceita qualquer papel da lista: 'editor' passa em ['admin','editor']", () => {
      const req = mockRequest() as Request;
      req.cliente = {
        id_cliente: 3,
        email: "editor@test.com",
        admin: false,
        roles: ["editor"],
      };
      const res = mockResponse() as Response;

      authorizeRole(["admin", "editor"])(req, res, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it("4. Bloqueia papel fora da lista, mesmo com varios papeis permitidos", () => {
      const req = mockRequest() as Request;
      req.cliente = {
        id_cliente: 4,
        email: "cliente@test.com",
        admin: false,
        roles: ["cliente"],
      };
      const res = mockResponse() as Response;

      authorizeRole(["admin", "editor"])(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("5. Usuario com varios papeis passa se UM deles estiver na lista", () => {
      const req = mockRequest() as Request;
      req.cliente = {
        id_cliente: 5,
        email: "multi@test.com",
        admin: false,
        roles: ["cliente", "editor"],
      };
      const res = mockResponse() as Response;

      authorizeRole(["editor"])(req, res, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it("6. E uma funcao de ordem superior: devolve um middleware reutilizavel", () => {
      const somenteAdmin = authorizeRole(["admin"]);

      expect(typeof somenteAdmin).toBe("function");
      expect(somenteAdmin.length).toBe(3); // (req, res, next)
    });
  });

  describe("Ordem dos middlewares", () => {
    it("7. authorizeRole ANTES de authMiddleware responde 401 em vez de quebrar", () => {
      // req.cliente ainda nao existe: sem a guarda, seria TypeError lendo
      // propriedade de undefined e a aplicacao cairia com 500.
      const req = mockRequest() as Request;
      const res = mockResponse() as Response;

      expect(() => authorizeRole(["admin"])(req, res, mockNext)).not.toThrow();

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ mensagem: "Usuario nao autenticado." });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("8. Na ordem correta, authMiddleware popula req.cliente e authorizeRole aprova", () => {
      const payload: TokenPayload = {
        id_cliente: 1,
        email: "admin@test.com",
        admin: true,
        roles: ["admin"],
        permissoes: ["produto:criar"],
      };

      jest.spyOn(jwt, "verify").mockImplementation(() => payload as unknown as JwtPayload);

      const req = mockRequest({ authorization: "Bearer admin-token" }) as Request;
      const res = mockResponse() as Response;

      authMiddleware(req, res, mockNext);
      expect(req.cliente?.roles).toEqual(["admin"]);

      authorizeRole(["admin"])(req, res, mockNext);
      expect(res.status).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledTimes(2);
    });
  });

  describe("Compatibilidade com o boolean admin", () => {
    it("9. Token antigo sem roles, com admin=true, passa em authorizeRole(['admin'])", () => {
      const req = mockRequest() as Request;
      req.cliente = { id_cliente: 1, email: "admin@test.com", admin: true };
      const res = mockResponse() as Response;

      authorizeRole(["admin"])(req, res, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it("10. Token antigo sem roles, com admin=false, cai no papel 'cliente'", () => {
      const req = mockRequest() as Request;
      req.cliente = { id_cliente: 2, email: "user@test.com", admin: false };
      const res = mockResponse() as Response;

      authorizeRole(["cliente"])(req, res, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it("11. Token antigo com admin=false e bloqueado em rota de admin", () => {
      const req = mockRequest() as Request;
      req.cliente = { id_cliente: 2, email: "user@test.com", admin: false };
      const res = mockResponse() as Response;

      authorizeRole(["admin"])(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  describe("authorizePermission", () => {
    it("12. Permite quem tem a permissao exigida", () => {
      const req = mockRequest() as Request;
      req.cliente = {
        id_cliente: 3,
        email: "editor@test.com",
        admin: false,
        roles: ["editor"],
        permissoes: ["produto:criar", "produto:ler"],
      };
      const res = mockResponse() as Response;

      authorizePermission(["produto:criar"])(req, res, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it("13. Bloqueia com 403 quem nao tem a permissao", () => {
      const req = mockRequest() as Request;
      req.cliente = {
        id_cliente: 2,
        email: "cliente@test.com",
        admin: false,
        roles: ["cliente"],
        permissoes: ["produto:ler"],
      };
      const res = mockResponse() as Response;

      authorizePermission(["produto:criar"])(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(PERMISSOES_INSUFICIENTES);
    });

    it("14. Exige TODAS as permissoes da lista, nao apenas uma", () => {
      const req = mockRequest() as Request;
      req.cliente = {
        id_cliente: 3,
        email: "editor@test.com",
        admin: false,
        roles: ["editor"],
        permissoes: ["produto:criar"],
      };
      const res = mockResponse() as Response;

      authorizePermission(["produto:criar", "produto:deletar"])(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("15. Admin passa sem depender da lista de permissoes do token", () => {
      const req = mockRequest() as Request;
      req.cliente = { id_cliente: 1, email: "admin@test.com", admin: true, roles: ["admin"] };
      const res = mockResponse() as Response;

      authorizePermission(["produto:deletar"])(req, res, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it("16. Sem autenticacao responde 401", () => {
      const req = mockRequest() as Request;
      const res = mockResponse() as Response;

      authorizePermission(["produto:criar"])(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });
});
