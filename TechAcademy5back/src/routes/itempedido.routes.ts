import { Router } from "express";
import {
  listarItensDoPedido,
  buscarItemPorId,
  adicionarItem,
  atualizarQuantidadeItem,
  removerItem
} from "../controllers/itempedido.controller";
import { authMiddleware } from "../config/auth.middleware";

const router = Router();

router.get("/pedido/:id_pedido", authMiddleware, listarItensDoPedido);
router.get("/:id", authMiddleware, buscarItemPorId);
router.post("/pedido/:id_pedido", authMiddleware, adicionarItem);
router.patch("/:id", authMiddleware, atualizarQuantidadeItem);
router.delete("/:id", authMiddleware, removerItem);

export default router;
