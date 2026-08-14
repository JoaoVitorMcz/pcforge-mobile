import "dotenv/config";
import express from "express";
import path from "path";
import sequelize from "./config/database/index";
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
app.use("/uploads", express.static(path.resolve(__dirname, "..", "uploads")));

// Rotas
app.use("/clientes", clienteRoutes);
app.use("/produtos", produtoRoutes);
app.use("/categorias", categoriaRoutes);
app.use("/enderecos", enderecoRoutes);
app.use("/pedidos", pedidoRoutes);
app.use("/itens-pedido", itemPedidoRoutes);
app.use("/upload", uploadRoutes);
app.use("/pagamentos", pagamentoRoutes);

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
