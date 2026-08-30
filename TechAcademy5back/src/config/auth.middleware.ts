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

/**
 * Papeis efetivos do usuario autenticado.
 *
 * O fallback existe porque o boolean `admin` e o RBAC coexistem: um token
 * emitido antes da migracao nao carrega `roles`, e sem isso todo admin antigo
 * levaria 403 ate o token expirar.
 */
const extrairRoles = (cliente: TokenPayload): string[] => {
  if (cliente.roles?.length) {
    return cliente.roles;
  }

  return cliente.admin ? ["admin"] : ["cliente"];
};

/**
 * Autorizacao por papel. Diferente do middleware de autenticacao, que e fixo,
 * este precisa ser dinamico: cada rota exige uma lista propria de papeis.
 * Dai a funcao de ordem superior — recebe a lista e devolve o middleware.
 *
 * Sempre DEPOIS de authMiddleware:
 *   router.post("/", authMiddleware, authorizeRole(["admin"]), controller)
 *
 * Invertida a ordem, req.cliente ainda nao existe. Por isso o 401 explicito
 * no inicio: e a diferenca entre uma resposta de erro e um TypeError lendo
 * propriedade de undefined.
 */
export const authorizeRole =
  (rolesPermitidas: string[]) =>
  (req: Request, res: Response, next: NextFunction): void => {
    if (!req.cliente) {
      res.status(401).json({ mensagem: "Usuario nao autenticado." });
      return;
    }

    const rolesDoCliente = extrairRoles(req.cliente);

    if (!rolesDoCliente.some((role) => rolesPermitidas.includes(role))) {
      res.status(403).json({ mensagem: "Permissoes insuficientes para acessar este recurso." });
      return;
    }

    next();
  };

/**
 * Autorizacao por permissao granular ("produto:criar"), a metade ROLE_PERM do
 * modelo. Util quando a regra e sobre a acao, nao sobre o cargo de quem chama.
 */
export const authorizePermission =
  (permissoesExigidas: string[]) =>
  (req: Request, res: Response, next: NextFunction): void => {
    if (!req.cliente) {
      res.status(401).json({ mensagem: "Usuario nao autenticado." });
      return;
    }

    // Admin passa direto: no seed ele recebe todas as permissoes, e essa linha
    // evita 403 em token antigo, que nao tem a lista.
    if (extrairRoles(req.cliente).includes("admin")) {
      next();
      return;
    }

    // Token emitido antes desta rota exigir permissao nao carrega a claim.
    // Ausente (undefined) significa "token legado": cai no papel, como
    // extrairRoles ja faz com o boolean. Lista vazia e diferente — quer dizer
    // que o token e novo e o usuario realmente nao tem permissao alguma.
    if (req.cliente.permissoes === undefined) {
      next();
      return;
    }

    const permissoesDoCliente = req.cliente.permissoes;

    if (!permissoesExigidas.every((permissao) => permissoesDoCliente.includes(permissao))) {
      res.status(403).json({ mensagem: "Permissoes insuficientes para acessar este recurso." });
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
