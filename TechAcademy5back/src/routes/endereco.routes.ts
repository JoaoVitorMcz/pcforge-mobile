import { Router } from "express";
import {
  listarEnderecos,
  listarEnderecosPorCliente,
  buscarEnderecoPorId,
  criarEndereco,
  atualizarEndereco,
  deletarEndereco
} from "../controllers/endereco.controller";
import {
  authMiddleware,
  authorizeRole,
  authorizePermission,
  selfOrAdminMiddleware,
} from "../config/auth.middleware";

const router = Router();

router.get("/", authMiddleware, authorizeRole(["admin"]), listarEnderecos);
router.get("/cliente/:id_cliente", authMiddleware, selfOrAdminMiddleware("id_cliente"), listarEnderecosPorCliente);
router.get("/:id", authMiddleware, buscarEnderecoPorId);
router.post("/", authMiddleware, authorizePermission(["endereco:criar"]), criarEndereco);
router.put("/:id", authMiddleware, atualizarEndereco);
router.delete("/:id", authMiddleware, deletarEndereco);

export default router;
