import "dotenv/config";
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import multer from "multer";
import path from "path";
import sequelize from "./config/database/index";
// Registra as quatro tabelas do RBAC e as duas relacoes N:N no sequelize.sync().
// Sem este import, o include de roles no login nao encontra a associacao.
import "./models/rbac.associations";
import { uploadDir } from "./config/upload";
import { UploadValidationError } from "./utils/upload.errors";
import clienteRoutes from "./routes/cliente.routes";
import produtoRoutes from "./routes/produto.routes";
import categoriaRoutes from "./routes/categoria.routes";
import enderecoRoutes from "./routes/endereco.routes";
import pedidoRoutes from "./routes/pedido.routes";
import itemPedidoRoutes from "./routes/itempedido.routes";
import uploadRoutes from "./routes/upload.routes";
import pagamentoRoutes from "./routes/pagamento.routes";
import dashboardRoutes from "./routes/dashboard.routes";

const app = express();
const PORT = process.env.PORT || 3000;

/**
 * Origens liberadas para o navegador, separadas por virgula em CORS_ORIGINS.
 * Sem a variavel definida a API aceita qualquer origem, para nao quebrar quem
 * acabou de clonar o projeto.
 *
 * O app mobile nativo nao envia header Origin e passa direto; a lista protege
 * o front web e o Expo rodando no navegador.
 */
const allowedOrigins = (process.env.CORS_ORIGINS ?? "")
  .split(",")
  .map((origem) => origem.trim())
  .filter(Boolean);

app.use(cors({ origin: allowedOrigins.length > 0 ? allowedOrigins : true }));

app.use(express.json());
app.use("/uploads", express.static(uploadDir));
app.use(
  "/imagens/produtos",
  express.static(
    process.env.LEGACY_IMAGES_DIR ??
      path.resolve(process.cwd(), "../TechAcademy5front/public/imagens/produtos")
  )
);

// Rotas
app.use("/clientes", clienteRoutes);
app.use("/produtos", produtoRoutes);
app.use("/categorias", categoriaRoutes);
app.use("/enderecos", enderecoRoutes);
app.use("/pedidos", pedidoRoutes);
app.use("/itens-pedido", itemPedidoRoutes);
app.use("/upload", uploadRoutes);
app.use("/pagamentos", pagamentoRoutes);
app.use("/admin", dashboardRoutes);

// Middleware de tratamento de erros para uploads (Multer)
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({ error: "Arquivo excede o tamanho máximo de 5MB." });
    }
    return res.status(400).json({ error: `Erro no upload: ${err.message}` });
  }

  if (err instanceof UploadValidationError) {
    return res.status(400).json({ error: err.message });
  }

  console.error(err);
  return res.status(500).json({ error: "Erro interno do servidor." });
});

export async function startServer() {
  try {
    await sequelize.sync();
    return app.listen(PORT, () => {
      console.log(`Servidor rodando na porta ${PORT}`);
    });
  } catch (error) {
    console.error("Erro ao sincronizar banco de dados:", error);
    throw error;
  }
}

if (require.main === module) {
  void startServer();
}

export default app;
