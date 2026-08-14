import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { getJwtSecret, TokenPayload } from "./jwt";

declare global {
  namespace Express {
    interface Request {
      cliente?: TokenPayload;
    }
  }
}

export const authMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ mensagem: "Token nao fornecido." });
    return;
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, getJwtSecret());
 
    if (typeof decoded === "string") {
      res.status(401).json({ mensagem: "Token invalido." });
      return;
    }

    req.cliente = decoded as TokenPayload;
    next();
  } catch {
    res.status(401).json({ mensagem: "Token invalido ou expirado." });
  }
};

export const adminMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.cliente?.admin) {
    res.status(403).json({ mensagem: "Acesso restrito a administradores." });
    return;
  }

  next();
};

export const selfOrAdminMiddleware =
  (paramName = "id") =>
  (req: Request, res: Response, next: NextFunction): void => {
    const clienteLogado = req.cliente;
    const routeId = Number(req.params[paramName]);

    if (!clienteLogado) {
      res.status(401).json({ mensagem: "Usuario nao autenticado." });
      return;
    }

    if (Number.isNaN(routeId)) {
      res.status(400).json({ mensagem: "ID invalido." });
      return;
    }

    if (clienteLogado.id_cliente !== routeId && !clienteLogado.admin) {
      res.status(403).json({ mensagem: "Voce nao tem permissao para acessar este recurso." });
      return;
    }

    next();
  };
