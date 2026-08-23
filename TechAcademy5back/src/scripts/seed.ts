import "dotenv/config";
import bcrypt from "bcrypt";
import sequelize from "../config/database";
import Cliente from "../models/Cliente";
import Categoria from "../models/Categoria";
import Produto from "../models/Produto";

/**
 * Popula o banco com dados minimos para desenvolvimento e demonstracao.
 *
 * O primeiro admin so pode nascer aqui: criarCliente em cliente.controller.ts
 * so permite marcar admin: true quem ja esta logado como admin, entao pela API
 * nao ha como sair do zero.
 *
 * Idempotente: identifica cada registro por um campo unico e usa findOrCreate,
 * entao rodar varias vezes nao duplica nada.
 */

const SENHA_PADRAO = "Senha@123";

const CATEGORIAS = [
  { nome: "Processadores", descricao: "CPUs para desktop" },
  { nome: "Placas de vídeo", descricao: "GPUs dedicadas" },
  { nome: "Memórias", descricao: "Módulos de memória RAM" },
  { nome: "Periféricos", descricao: "Teclados, mouses e headsets" },
];

const PRODUTOS = [
  { nome: "Ryzen 5 5600", categoria: "Processadores", valor: 899.9, estoque: 12, destaque: true },
  { nome: "Ryzen 7 5800X", categoria: "Processadores", valor: 1499.9, estoque: 6, destaque: false },
  { nome: "Intel Core i5-12400F", categoria: "Processadores", valor: 1049.0, estoque: 3, destaque: false },
  { nome: "GeForce RTX 4060", categoria: "Placas de vídeo", valor: 2199.0, estoque: 5, destaque: true },
  { nome: "GeForce RTX 4070 Super", categoria: "Placas de vídeo", valor: 4599.0, estoque: 2, destaque: true },
  { nome: "Radeon RX 7600", categoria: "Placas de vídeo", valor: 1899.0, estoque: 8, destaque: false },
  { nome: "Memória DDR4 16GB 3200MHz", categoria: "Memórias", valor: 289.9, estoque: 30, destaque: false },
  { nome: "Memória DDR5 32GB 6000MHz", categoria: "Memórias", valor: 899.0, estoque: 4, destaque: true },
  { nome: "Teclado Mecânico RGB ABNT2", categoria: "Periféricos", valor: 349.9, estoque: 15, destaque: false },
  { nome: "Mouse Gamer 16000 DPI", categoria: "Periféricos", valor: 199.9, estoque: 22, destaque: false },
  { nome: "Headset 7.1 Surround", categoria: "Periféricos", valor: 429.0, estoque: 1, destaque: false },
  { nome: "Mousepad Speed XL", categoria: "Periféricos", valor: 89.9, estoque: 40, destaque: false },
];

async function semearClientes(): Promise<void> {
  const senhaCriptografada = await bcrypt.hash(SENHA_PADRAO, 10);

  const contas = [
    { nome: "Administrador PC Forge", email: "admin@pcforge.com", cpf: "111.111.111-11", admin: true },
    { nome: "Cliente Teste", email: "cliente@pcforge.com", cpf: "222.222.222-22", admin: false },
  ];

  for (const conta of contas) {
    const [, criado] = await Cliente.findOrCreate({
      where: { email: conta.email },
      defaults: {
        ...conta,
        senha: senhaCriptografada,
        telefone: "(11) 90000-0000",
        ativo: true,
      },
    });

    console.log(`${criado ? "criado" : "ja existia"}: ${conta.email}${conta.admin ? " (admin)" : ""}`);
  }
}

async function semearCatalogo(): Promise<void> {
  const idsPorCategoria = new Map<string, number>();

  for (const categoria of CATEGORIAS) {
    const [registro] = await Categoria.findOrCreate({
      where: { nome: categoria.nome },
      defaults: { ...categoria, ativo: true },
    });

    idsPorCategoria.set(categoria.nome, registro.id_categoria);
  }

  console.log(`categorias: ${idsPorCategoria.size}`);

  let novos = 0;

  for (const produto of PRODUTOS) {
    const [, criado] = await Produto.findOrCreate({
      where: { nome: produto.nome },
      defaults: {
        nome: produto.nome,
        descricao: `${produto.nome} - componente para montagem de PC.`,
        valor: produto.valor,
        estoque: produto.estoque,
        destaque: produto.destaque,
        id_categoria: idsPorCategoria.get(produto.categoria) ?? null,
        imagem: null,
        ativo: true,
      },
    });

    if (criado) novos += 1;
  }

  console.log(`produtos: ${novos} criados, ${PRODUTOS.length - novos} ja existiam`);
}

async function seed(): Promise<void> {
  await sequelize.authenticate();
  await sequelize.sync();

  await semearClientes();
  await semearCatalogo();

  console.log(`\nSeed concluido. Senha das duas contas: ${SENHA_PADRAO}`);
}

seed()
  .then(() => sequelize.close())
  .catch(async (erro) => {
    console.error("Falha ao popular o banco:", erro);
    await sequelize.close();
    process.exit(1);
  });
