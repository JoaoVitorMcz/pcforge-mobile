import { Router } from "express";
import * as ClienteController from "../controllers/cliente.controller";
import {
  authMiddleware,
  adminMiddleware,
  selfOrAdminMiddleware,
} from "../config/auth.middleware";

const router = Router();

// Rotas públicas
router.post("/", ClienteController.criarCliente);
router.post("/login", ClienteController.loginCliente);

//  (cliente autenticado)
router.get("/:id", authMiddleware, selfOrAdminMiddleware(), ClienteController.buscarClientePorId);
router.put("/:id", authMiddleware, selfOrAdminMiddleware(), ClienteController.atualizarCliente);
router.delete("/:id", authMiddleware, selfOrAdminMiddleware(), ClienteController.desativarCliente);

//  (só admin)
router.get("/", authMiddleware, adminMiddleware, ClienteController.listarClientes);

export default router;
