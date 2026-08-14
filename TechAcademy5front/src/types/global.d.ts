export {};

declare global {
  interface Cliente {
    id_cliente: number;
    nome: string;
    email: string;
    telefone: string | null;
    cpf: string | null;
    ativo: boolean;
    admin: boolean | string;
  }

  interface Produto {
    id_produto: number;
    nome: string;
    descricao: string | null;
    valor: number;
    preco?: number | string | null;
    estoque: number | string | null;
    imagem: string | null;
    id_categoria: number | null;
    tag?: string | null;
    destaque: boolean;
    ativo: boolean;
  }

  interface ItemCarrinho {
    id_produto: number;
    nome: string;
    valor: number | string;
    preco?: number | string | null;
    quantidade: number;
    imagem: string | null;
    estoque: number | string | null;
  }

  interface Endereco {
    id_endereco: number;
    id_cliente: number;
    numero: string | null;
    complemento: string | null;
    bairro: string | null;
    cidade: string | null;
    estado: string | null;
    cep: string | null;
  }

  interface Pedido {
    id_pedido: number;
    id_cliente: number;
    valor: number;
    status: string;
    data_pedido: string | null;
    itens: ItemPedido[];
  }

  interface ItemPedido {
    id_item: number;
    id_pedido: number;
    id_produto: number;
    quantidade: number;
    preco_unitario: number;
    produto: Produto;
  }
}
