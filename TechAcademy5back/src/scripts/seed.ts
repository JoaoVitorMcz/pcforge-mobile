import "dotenv/config";
import bcrypt from "bcrypt";
import sequelize from "../config/database";
import Cliente from "../models/Cliente";
import Categoria from "../models/Categoria";
import Produto from "../models/Produto";
import Role from "../models/Role";
import Permissao from "../models/Permissao";
import ClienteRole from "../models/ClienteRole";
import RolePermissao from "../models/RolePermissao";
import "../models/rbac.associations";

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

const CONTAS = [
  {
    nome: "Administrador PC Forge",
    email: "admin@pcforge.com",
    cpf: "111.111.111-11",
    admin: true,
    role: "admin",
  },
  {
    nome: "Cliente Teste",
    email: "cliente@pcforge.com",
    cpf: "222.222.222-22",
    admin: false,
    role: "cliente",
  },
];

/** Recursos que a API expoe hoje, com as acoes que cada um aceita. */
const PERMISSOES_POR_RECURSO: Record<string, string[]> = {
  produto: ["criar", "ler", "atualizar", "deletar"],
  categoria: ["criar", "ler", "atualizar", "deletar"],
  pedido: ["criar", "ler", "atualizar", "deletar"],
  cliente: ["criar", "ler", "atualizar", "deletar"],
  endereco: ["criar", "ler", "atualizar", "deletar"],
  upload: ["criar"],
  dashboard: ["ler"],
};

const ROLES: { nome: string; descricao: string; permissoes: string[] | "todas" }[] = [
  {
    nome: "admin",
    descricao: "Acesso total ao sistema.",
    permissoes: "todas",
  },
  {
    nome: "cliente",
    descricao: "Compra pela loja e gerencia os proprios dados.",
    permissoes: [
      "produto:ler",
      "categoria:ler",
      "pedido:criar",
      "pedido:ler",
      "pedido:atualizar",
      "endereco:criar",
      "endereco:ler",
      "endereco:atualizar",
      "endereco:deletar",
      "cliente:ler",
      "cliente:atualizar",
    ],
  },
];

const CATEGORIAS = [
  { nome: "Processadores", descricao: "CPUs para desktop" },
  { nome: "Placas de vídeo", descricao: "GPUs dedicadas" },
  { nome: "Placas-mãe", descricao: "Placas-mãe para computadores" },
  { nome: "Memórias", descricao: "Módulos de memória RAM" },
  { nome: "Armazenamento", descricao: "SSDs para armazenamento" },
  { nome: "Fontes", descricao: "Fontes de alimentação" },
  { nome: "Gabinetes", descricao: "Gabinetes para montagem" },
  { nome: "Refrigeração", descricao: "Coolers e water coolers" },
  { nome: "Monitores", descricao: "Monitores para computadores" },
  { nome: "Periféricos", descricao: "Teclados, mouses e headsets" },
  { nome: "Acessórios", descricao: "Acessórios para setup" },
];

/**
 * `imagem` guarda so o nome do arquivo servido pela web em
 * TechAcademy5front/public/imagens/produtos/. Quem renderiza e o ProdutoCard,
 * que cai em placeholder.png quando o campo vem vazio — por isso os itens sem
 * foto correspondente ficam em null em vez de apontar para um arquivo errado.
 *
 * Os nomes dos produtos aqui sao genericos e as fotos sao de modelos reais do
 * mesmo tipo: a associacao e por categoria de produto, nao por SKU.
 */
const PRODUTOS: {
  nome: string;
  categoria: string;
  valor: number;
  estoque: number;
  destaque: boolean;
  imagem: string | null;
}[] = [
  { nome: "Ryzen 5 5600", categoria: "Processadores", valor: 899.9, estoque: 12, destaque: true, imagem: null },
  { nome: "Ryzen 7 5800X", categoria: "Processadores", valor: 1499.9, estoque: 6, destaque: false, imagem: null },
  { nome: "Intel Core i5-12400F", categoria: "Processadores", valor: 1049.0, estoque: 3, destaque: false, imagem: null },
  { nome: "AMD Ryzen 5 5600X", categoria: "Processadores", valor: 999.9, estoque: 10, destaque: false, imagem: "Processador-AMD-Ryzen-5-5600X.png" },
  { nome: "Intel Core i7-13700K", categoria: "Processadores", valor: 2399.0, estoque: 5, destaque: true, imagem: "Processador-Intel-Core-i7-13700K.png" },
  { nome: "GeForce RTX 4060", categoria: "Placas de vídeo", valor: 2199.0, estoque: 5, destaque: true, imagem: null },
  { nome: "GeForce RTX 4070 Super", categoria: "Placas de vídeo", valor: 4599.0, estoque: 2, destaque: true, imagem: null },
  { nome: "Radeon RX 7600", categoria: "Placas de vídeo", valor: 1899.0, estoque: 8, destaque: false, imagem: "Placa-de-Video-AMD-Radeon-RX-7600-8GB.png" },
  { nome: "GeForce RTX 3060 12GB", categoria: "Placas de vídeo", valor: 1799.0, estoque: 7, destaque: false, imagem: "Placa-de-Video-NVIDIA-RTX-3060-12GB.png" },
  { nome: "ASUS TUF Gaming B550M-Plus", categoria: "Placas-mãe", valor: 949.9, estoque: 6, destaque: false, imagem: "Placa-Mae-ASUS-TUF-Gaming-B550M-Plus.png" },
  { nome: "MSI PRO B660M-A", categoria: "Placas-mãe", valor: 899.9, estoque: 4, destaque: false, imagem: "Placa-Mae-MSI-PRO-B660M-A.png" },
  { nome: "Memória DDR4 16GB 3200MHz", categoria: "Memórias", valor: 289.9, estoque: 30, destaque: false, imagem: "Memoria-RAM-Kingston-FURY-Beast-16GB.png" },
  { nome: "Memória DDR5 32GB 6000MHz", categoria: "Memórias", valor: 899.0, estoque: 4, destaque: true, imagem: "Memoria-RAM-Corsair-Vengeance-32GB.png" },
  { nome: "SSD NVMe M.2 WD Blue SN570 1TB", categoria: "Armazenamento", valor: 499.9, estoque: 14, destaque: false, imagem: "SSD-NVMe-M-2-WD-Blue-SN570-1TB.png" },
  { nome: "SSD SATA III Crucial BX500 500GB", categoria: "Armazenamento", valor: 269.9, estoque: 18, destaque: false, imagem: "SSD-SATA-III-Crucial-BX500-500GB.png" },
  { nome: "Fonte Corsair CV650 650W", categoria: "Fontes", valor: 399.9, estoque: 9, destaque: false, imagem: "Fonte-Corsair-CV650-650W.png" },
  { nome: "Fonte XPG Core Reactor 850W", categoria: "Fontes", valor: 849.9, estoque: 5, destaque: true, imagem: "Fonte-XPG-Core-Reactor-850W.png" },
  { nome: "Gabinete Gamer NZXT H510 Flow", categoria: "Gabinetes", valor: 699.9, estoque: 8, destaque: false, imagem: "Gabinete-Gamer-NZXT-H510-Flow.png" },
  { nome: "Air Cooler DeepCool AK400", categoria: "Refrigeração", valor: 249.9, estoque: 13, destaque: false, imagem: "Air-Cooler-DeepCool-AK400.png" },
  { nome: "Water Cooler Corsair H100i RGB", categoria: "Refrigeração", valor: 899.9, estoque: 3, destaque: true, imagem: "Water-Cooler-Corsair-H100i-RGB.png" },
  { nome: "Monitor AOC Hero", categoria: "Monitores", valor: 1299.0, estoque: 6, destaque: false, imagem: "AOC-Hero.png" },
  { nome: "Monitor LG 29", categoria: "Monitores", valor: 1599.0, estoque: 4, destaque: false, imagem: "LG-29.png" },
  { nome: "Suporte de monitor ELG F80N", categoria: "Monitores", valor: 399.0, estoque: 7, destaque: false, imagem: "ELG-F80N.png" },
  { nome: "Teclado Mecânico RGB ABNT2", categoria: "Periféricos", valor: 349.9, estoque: 15, destaque: false, imagem: "Blackwidow-V3.png" },
  { nome: "Mouse Gamer 16000 DPI", categoria: "Periféricos", valor: 199.9, estoque: 22, destaque: false, imagem: "Deathadder-V2.png" },
  { nome: "Headset 7.1 Surround", categoria: "Periféricos", valor: 429.0, estoque: 1, destaque: false, imagem: "Cloud-Stinger-2.png" },
  { nome: "Mousepad Speed XL", categoria: "Periféricos", valor: 89.9, estoque: 40, destaque: false, imagem: "Fury-S.png" },
  { nome: "Mouse Logitech G203", categoria: "Periféricos", valor: 149.9, estoque: 20, destaque: false, imagem: "G203.png" },
  { nome: "Headset Logitech G733", categoria: "Periféricos", valor: 699.9, estoque: 6, destaque: false, imagem: "G733.png" },
  { nome: "Teclado Redragon Kumara", categoria: "Periféricos", valor: 249.9, estoque: 12, destaque: false, imagem: "Kumara.png" },
  { nome: "Webcam Logitech C920s", categoria: "Periféricos", valor: 499.9, estoque: 8, destaque: false, imagem: "C920s.png" },
  { nome: "Caixa de som Edifier R1000", categoria: "Periféricos", valor: 599.9, estoque: 5, destaque: false, imagem: "Edifier-R1000.png" },
  { nome: "Microfone HyperX QuadCast S", categoria: "Periféricos", valor: 999.9, estoque: 3, destaque: true, imagem: "QuadCast-S.png" },
  { nome: "Controle Xbox", categoria: "Acessórios", valor: 399.9, estoque: 10, destaque: false, imagem: "Xbox-Controller.png" },
  { nome: "Cadeira Gamer Husky Snow", categoria: "Acessórios", valor: 1199.0, estoque: 2, destaque: false, imagem: "Husky-Snow.png" },
];

async function semearClientes(): Promise<void> {
  const senhaCriptografada = await bcrypt.hash(SENHA_PADRAO, 10);

  for (const conta of CONTAS) {
    // `role` fica fora do defaults: e do vinculo em cliente_role, nao da tabela cliente.
    const { role: _role, ...dadosDaConta } = conta;

    const [, criado] = await Cliente.findOrCreate({
      where: { email: conta.email },
      defaults: {
        ...dadosDaConta,
        senha: senhaCriptografada,
        telefone: "(11) 90000-0000",
        ativo: true,
      },
    });

    console.log(`${criado ? "criado" : "ja existia"}: ${conta.email}${conta.admin ? " (admin)" : ""}`);
  }
}

/**
 * Papeis, permissoes e os vinculos N:N do RBAC.
 *
 * Roda DEPOIS de semearClientes porque precisa das duas contas ja gravadas
 * para preencher cliente_role.
 */
async function semearRbac(): Promise<void> {
  const idsPorPermissao = new Map<string, number>();

  for (const [recurso, acoes] of Object.entries(PERMISSOES_POR_RECURSO)) {
    for (const acao of acoes) {
      const nome = `${recurso}:${acao}`;
      const [registro] = await Permissao.findOrCreate({
        where: { nome },
        defaults: { nome, recurso, acao, descricao: `Permite ${acao} em ${recurso}.` },
      });

      idsPorPermissao.set(nome, registro.id_permissao);
    }
  }

  console.log(`permissoes: ${idsPorPermissao.size}`);

  for (const papel of ROLES) {
    const [role] = await Role.findOrCreate({
      where: { nome: papel.nome },
      defaults: { nome: papel.nome, descricao: papel.descricao },
    });

    // "admin" recebe tudo; os demais, so a lista declarada em ROLES.
    const permissoesDoPapel =
      papel.permissoes === "todas" ? [...idsPorPermissao.keys()] : papel.permissoes;

    for (const nomePermissao of permissoesDoPapel) {
      const idPermissao = idsPorPermissao.get(nomePermissao);
      if (!idPermissao) continue;

      await RolePermissao.findOrCreate({
        where: { id_role: role.id_role, id_permissao: idPermissao },
        defaults: { id_role: role.id_role, id_permissao: idPermissao },
      });
    }

    console.log(`role ${papel.nome}: ${permissoesDoPapel.length} permissoes`);

    // Vincula as contas do seed que pedem este papel.
    for (const conta of CONTAS.filter((c) => c.role === papel.nome)) {
      const cliente = await Cliente.findOne({ where: { email: conta.email } });
      if (!cliente) continue;

      await ClienteRole.findOrCreate({
        where: { id_cliente: cliente.id_cliente, id_role: role.id_role },
        defaults: { id_cliente: cliente.id_cliente, id_role: role.id_role },
      });

      console.log(`  ${conta.email} -> ${papel.nome}`);
    }
  }

  await vincularClientesSemPapel();
}

/**
 * Da o papel "cliente" a quem ficou sem nenhum.
 *
 * Ate a correcao no criarCliente, so o seed escrevia em cliente_role, entao
 * todo mundo que se cadastrou pela API ficou sem papel e com o token sem
 * permissoes. Isto conserta as bases que ja existem; o cadastro novo ja nasce
 * vinculado.
 */
async function vincularClientesSemPapel(): Promise<void> {
  const roleCliente = await Role.findOne({ where: { nome: "cliente" } });

  if (!roleCliente) {
    return;
  }

  const vinculos = await ClienteRole.findAll({ attributes: ["id_cliente"] });
  const jaTemPapel = new Set(vinculos.map((vinculo) => vinculo.id_cliente));

  const clientes = await Cliente.findAll({ attributes: ["id_cliente", "email"] });
  const orfaos = clientes.filter((cliente) => !jaTemPapel.has(cliente.id_cliente));

  for (const cliente of orfaos) {
    await ClienteRole.create({ id_cliente: cliente.id_cliente, id_role: roleCliente.id_role });
    console.log(`  ${cliente.email} -> cliente (retroativo)`);
  }

  if (orfaos.length === 0) {
    console.log("nenhum cliente sem papel");
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
  let imagensPreenchidas = 0;

  for (const produto of PRODUTOS) {
    const [registro, criado] = await Produto.findOrCreate({
      where: { nome: produto.nome },
      defaults: {
        nome: produto.nome,
        descricao: `${produto.nome} - componente para montagem de PC.`,
        valor: produto.valor,
        estoque: produto.estoque,
        destaque: produto.destaque,
        id_categoria: idsPorCategoria.get(produto.categoria) ?? null,
        imagem: produto.imagem,
        ativo: true,
      },
    });

    if (criado) {
      novos += 1;
      continue;
    }

    // findOrCreate nao toca em quem ja existe, entao um banco semeado antes de
    // as imagens entrarem ficaria com a vitrine toda em placeholder. So
    // preenche quando o produto esta sem foto: uma imagem enviada pelo admin
    // no painel nunca e sobrescrita por rodar o seed de novo.
    if (produto.imagem && !registro.imagem) {
      await registro.update({ imagem: produto.imagem });
      imagensPreenchidas += 1;
    }
  }

  console.log(`produtos: ${novos} criados, ${PRODUTOS.length - novos} ja existiam`);

  if (imagensPreenchidas > 0) {
    console.log(`imagens preenchidas em produtos existentes: ${imagensPreenchidas}`);
  }
}

async function seed(): Promise<void> {
  await sequelize.authenticate();
  await sequelize.sync();

  await semearClientes();
  await semearRbac();
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
