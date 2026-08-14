import { Router } from "express";
import {
  criarCategoria,
  listarCategorias,
  buscarCategoria,
  atualizarCategoria,
  deletarCategoria,
} from "../controllers/categoria.controller";
import { authMiddleware, adminMiddleware } from "../config/auth.middleware";

const router = Router();

// Rotas publicas
router.get("/", listarCategorias);
router.get("/:id", buscarCategoria);

//  (somente admin)
router.post("/", authMiddleware, adminMiddleware, criarCategoria);
router.put("/:id", authMiddleware, adminMiddleware, atualizarCategoria);
router.delete("/:id", authMiddleware, adminMiddleware, deletarCategoria);

export default router;
