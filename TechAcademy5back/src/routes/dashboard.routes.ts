import { Router } from "express";
import { obterDashboard } from "../controllers/dashboard.controller";
import { authMiddleware, authorizeRole } from "../config/auth.middleware";

const router = Router();

// (somente admin)
router.get("/dashboard", authMiddleware, authorizeRole(["admin"]), obterDashboard);

export default router;
