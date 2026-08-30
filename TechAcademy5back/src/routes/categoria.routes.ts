import { Router } from "express";
import {
  criarCategoria,
  listarCategorias,
  buscarCategoria,
  atualizarCategoria,
  deletarCategoria,
} from "../controllers/categoria.controller";
import { authMiddleware, authorizeRole } from "../config/auth.middleware";

const router = Router();

// Rotas publicas
router.get("/", listarCategorias);
router.get("/:id", buscarCategoria);

//  (somente admin)
router.post("/", authMiddleware, authorizeRole(["admin"]), criarCategoria);
router.put("/:id", authMiddleware, authorizeRole(["admin"]), atualizarCategoria);
router.delete("/:id", authMiddleware, authorizeRole(["admin"]), deletarCategoria);

export default router;
