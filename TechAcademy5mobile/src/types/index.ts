export interface Cliente {
  id_cliente: number;
  nome: string;
  email: string;
  telefone?: string | null;
  cpf?: string | null;
  ativo?: boolean;
  admin?: boolean | string | number;
}

export interface Produto {
  id_produto: number;
  nome: string;
  descricao?: string | null;
  valor: number;
  estoque: number;
  destaque?: boolean;
  imagem?: string | null;
  id_categoria?: number | null;
}

export interface Endereco {
  id_endereco: number;
  id_cliente: number;
  numero?: string | null;
  complemento?: string | null;
  bairro?: string | null;
  cidade?: string | null;
  estado?: string | null;
  cep?: string | null;
}

/** Campos que o formulario de endereco manipula (sem os ids). */
export type EnderecoFormulario = Omit<Endereco, "id_endereco" | "id_cliente">;

export interface Categoria {
  id_categoria: number;
  nome: string;
  descricao?: string | null;
  ativo?: boolean;
}

export type StatusPedido =
  | "pendente"
  | "pago"
  | "em_preparacao"
  | "enviado"
  | "entregue"
  | "cancelado";

export interface ItemPedido {
  id_item: number;
  id_pedido: number;
  id_produto: number;
  quantidade: number;
  preco_unitario: number;
  produto?: Pick<Produto, "id_produto" | "nome" | "valor" | "imagem" | "estoque">;
}

export interface Pedido {
  id_pedido: number;
  id_cliente: number;
  id_endereco_entrega: number;
  data_pedido?: string | null;
  valor?: number | null;
  status?: StatusPedido | null;
  metodo?: string | null;
  data_pagamento?: string | null;
  cliente?: Pick<Cliente, "id_cliente" | "nome" | "email" | "telefone">;
  endereco_entrega?: Endereco;
  itens?: ItemPedido[];
}

/** Item do carrinho local: o produto hidratado mais a quantidade escolhida. */
export interface ItemCarrinho {
  produto: Produto;
  quantidade: number;
}

export interface Dashboard {
  totalPedidos: number;
  pedidosPorStatus: Record<StatusPedido, number>;
  faturamento: number;
  totalClientesAtivos: number;
  totalProdutosAtivos: number;
  produtosEstoqueBaixo: { id_produto: number; nome: string; estoque: number }[];
}

/** Resposta paginada da API quando a query traz page/limit. */
export interface Paginado<T> {
  dados: T[];
  paginacao: {
    paginaAtual: number;
    porPagina: number;
    totalItens: number;
    totalPaginas: number;
  };
}
