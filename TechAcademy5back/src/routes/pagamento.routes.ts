import { Router } from "express";
import { authMiddleware } from "../config/auth.middleware";
import {
  confirmarPagamentoMercadoPago,
  gerarNovaPreferenciaMercadoPago,
  iniciarCheckoutMercadoPago,
} from "../controllers/pagamento.controller";

const router = Router();

router.post("/mercado-pago/checkout", authMiddleware, iniciarCheckoutMercadoPago);
router.post(
  "/mercado-pago/pedido/:id/preference",
  authMiddleware,
  gerarNovaPreferenciaMercadoPago
);
router.post("/mercado-pago/confirmar", authMiddleware, confirmarPagamentoMercadoPago);

export default router;
