import { Router } from "express";
import * as ProdutoController from "../controllers/produto.controller";
import { authMiddleware, adminMiddleware } from "../config/auth.middleware";

const router = Router();

// Rotas públicas
router.get("/", ProdutoController.listarProdutos);
router.get("/destaque", ProdutoController.listarProdutosDestaque); // ← adicionar ANTES de /:id
router.get("/buscar", ProdutoController.buscarProdutosPorNome);   // ← se já usar essa
router.get("/:id", ProdutoController.buscarProdutoPorId);

// (somente admin)
router.post("/", authMiddleware, adminMiddleware, ProdutoController.criarProduto);
router.put("/:id", authMiddleware, adminMiddleware, ProdutoController.atualizarProduto);
router.delete("/:id", authMiddleware, adminMiddleware, ProdutoController.desativarProduto);

export default router;