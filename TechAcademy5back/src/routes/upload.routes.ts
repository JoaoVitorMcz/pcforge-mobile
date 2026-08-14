import { Router, Request, Response } from "express";
import { upload } from "../config/upload";
import { authMiddleware, adminMiddleware } from "../config/auth.middleware";

const router = Router();

router.post(
  "/imagem",
  authMiddleware,
  adminMiddleware,
  upload.single("imagem"),
  (req: Request, res: Response) => {
    if (!req.file) {
      res.status(400).json({ mensagem: "Nenhuma imagem enviada." });
      return;
    }

    const url = `/uploads/${req.file.filename}`;
    res.status(201).json({ mensagem: "Upload realizado com sucesso.", url });
  }
);

export default router;
