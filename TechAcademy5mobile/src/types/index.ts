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

export type StatusPedido =
  | "pendente"
  | "pago"
  | "em_preparacao"
  | "enviado"
  | "entregue"
  | "cancelado";

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
