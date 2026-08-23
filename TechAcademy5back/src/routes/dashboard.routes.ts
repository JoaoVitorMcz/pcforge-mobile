import { Router } from "express";
import { obterDashboard } from "../controllers/dashboard.controller";
import { authMiddleware, adminMiddleware } from "../config/auth.middleware";

const router = Router();

// (somente admin)
router.get("/dashboard", authMiddleware, adminMiddleware, obterDashboard);

export default router;
