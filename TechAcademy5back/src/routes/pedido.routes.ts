import { Router } from "express";
import {
  listarPedidos,
  listarPedidosPorCliente,
  buscarPedidoPorId,
  criarPedido,
  atualizarStatusPedido,
  cancelarPedido
} from "../controllers/pedido.controller";
import { authMiddleware, adminMiddleware, selfOrAdminMiddleware } from "../config/auth.middleware";

const router = Router();

router.get("/", authMiddleware, adminMiddleware, listarPedidos);
router.get("/cliente/:id_cliente", authMiddleware, selfOrAdminMiddleware("id_cliente"), listarPedidosPorCliente);
router.get("/:id", authMiddleware, buscarPedidoPorId);
router.post("/", authMiddleware, criarPedido);
router.patch("/:id/status", authMiddleware, adminMiddleware, atualizarStatusPedido);
router.patch("/:id/cancelar", authMiddleware, cancelarPedido);

export default router;
