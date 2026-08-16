import "dotenv/config";
import express, { Request, Response, NextFunction } from "express";
import multer from "multer";
import sequelize from "./config/database/index";
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

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use("/uploads", express.static(uploadDir));

// Rotas
app.use("/clientes", clienteRoutes);
app.use("/produtos", produtoRoutes);
app.use("/categorias", categoriaRoutes);
app.use("/enderecos", enderecoRoutes);
app.use("/pedidos", pedidoRoutes);
app.use("/itens-pedido", itemPedidoRoutes);
app.use("/upload", uploadRoutes);
app.use("/pagamentos", pagamentoRoutes);

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
