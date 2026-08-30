import fs from "fs";
import os from "os";
import path from "path";

/**
 * Roda antes de qualquer modulo de teste ser carregado (jest.config.js ->
 * setupFiles). Aponta UPLOAD_DIR para uma pasta temporaria exclusiva desta
 * suite, para que rodar os testes nunca apague as imagens reais gravadas em
 * TechAcademy5back/uploads.
 */
process.env.UPLOAD_DIR = fs.mkdtempSync(path.join(os.tmpdir(), "pcforge-uploads-test-"));
