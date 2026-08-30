import multer from "multer";
import path from "node:path";
import fs from "fs";
import { UploadValidationError } from "../utils/upload.errors";

/**
 * Pasta onde as imagens sao gravadas. Configuravel por UPLOAD_DIR para que os
 * testes gravem em uma pasta temporaria e nunca toquem nos uploads reais.
 */
export const uploadDir = process.env.UPLOAD_DIR
  ? path.resolve(process.env.UPLOAD_DIR)
  : path.resolve(__dirname, "..", "..", "uploads");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const nome = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, nome);
  },
});

const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".gif"];
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

const fileFilter = (
  _req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const ext = path.extname(file.originalname).toLowerCase();

  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return cb(new UploadValidationError(`Extensão não permitida: ${ext || "sem extensão"}`));
  }

  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    return cb(new UploadValidationError(`Tipo de arquivo não permitido: ${file.mimetype}`));
  }

  cb(null, true);
};

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});
