import { Request, Response } from "express";
import Pedido from "../models/Pedido";
import ItemPedido from "../models/Itempedido";
import Produto from "../models/Produto";
import Cliente from "../models/Cliente";
import Endereco from "../models/Endereco";
import { buildPaginatedResponse, getPaginationParams } from "../utils/pagination";
import { criarPedidoComItens, HttpError } from "../services/pedido.service";

const getClienteAutenticado = (req: Request, res: Response) => {
  if (!req.cliente) {
    res.status(401).json({ mensagem: "Usuario nao autenticado." });
    return null;
  }

  return req.cliente;
};


export const listarPedidos = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page, limit, offset } = getPaginationParams(req);
    const shouldPaginate = req.query.page !== undefined || req.query.limit !== undefined;
    const baseOptions = {
      include: [
        {
          model: Cliente,
          as: "cliente",
          attributes: ["id_cliente", "nome", "email"],
        },
        {
          model: Endereco,
          as: "endereco_entrega",
        },
        {
          model: ItemPedido,
          as: "itens",
          include: [
            {
              model: Produto,
              as: "produto",
              attributes: ["id_produto", "nome", "valor"],
            },
          ],
        },
      ],
      order: [["data_pedido", "DESC"]] as [["data_pedido", "DESC"]],
      distinct: true,
    };

    const { rows: pedidos, count } = shouldPaginate
      ? await Pedido.findAndCountAll({
          ...baseOptions,
          limit,
          offset,
        })
      : await Pedido.findAndCountAll(baseOptions);

    res
      .status(200)
      .json(shouldPaginate ? buildPaginatedResponse(pedidos, count, page, limit) : pedidos);
  } catch (error) {
    console.error("Erro ao listar pedidos:", error);
    res.status(500).json({ mensagem: "Erro interno ao listar pedidos." });
  }
};


export const listarPedidosPorCliente = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const id_cliente = Number(req.params.id_cliente);
    const { page, limit, offset } = getPaginationParams(req);
    const shouldPaginate = req.query.page !== undefined || req.query.limit !== undefined;
    const baseOptions = {
      where: { id_cliente },
      include: [
        {
          model: Endereco,
          as: "endereco_entrega",
        },
        {
          model: ItemPedido,
          as: "itens",
          include: [
            {
              model: Produto,
              as: "produto",
              attributes: ["id_produto", "nome", "valor", "imagem"],
            },
          ],
        },
      ],
      order: [["data_pedido", "DESC"]] as [["data_pedido", "DESC"]],
      distinct: true,
    };

    const { rows: pedidos, count } = shouldPaginate
      ? await Pedido.findAndCountAll({
          ...baseOptions,
          limit,
          offset,
        })
      : await Pedido.findAndCountAll(baseOptions);

    res
      .status(200)
      .json(shouldPaginate ? buildPaginatedResponse(pedidos, count, page, limit) : pedidos);
  } catch (error) {
    console.error("Erro ao listar pedidos do cliente:", error);
    res.status(500).json({ mensagem: "Erro interno ao listar pedidos do cliente." });
  }
};


export const buscarPedidoPorId = async (req: Request, res: Response): Promise<void> => {
  try {
    const id_pedido = Number(req.params.id);
    const clienteLogado = getClienteAutenticado(req, res);

    if (!clienteLogado) {
      return;
    }

    const pedido = await Pedido.findByPk(id_pedido, {
      include: [
        {
          model: Cliente,
          as: "cliente",
          attributes: ["id_cliente", "nome", "email", "telefone"],
        },
        {
          model: Endereco,
          as: "endereco_entrega",
        },
        {
          model: ItemPedido,
          as: "itens",
          include: [
            {
              model: Produto,
              as: "produto",
              attributes: ["id_produto", "nome", "valor", "imagem"],
            },
          ],
        },
      ],
    });

    if (!pedido) {
      res.status(404).json({ mensagem: "Pedido nao encontrado." });
      return;
    }

    if (!clienteLogado.admin && pedido.id_cliente !== clienteLogado.id_cliente) {
      res.status(403).json({ mensagem: "Voce nao tem permissao para acessar este pedido." });
      return;
    }

    res.status(200).json(pedido);
  } catch (error) {
    console.error("Erro ao buscar pedido:", error);
    res.status(500).json({ mensagem: "Erro interno ao buscar pedido." });
  }
};


export const criarPedido = async (req: Request, res: Response): Promise<void> => {
  try {
    const clienteAutenticado = req.cliente;
    const isAdmin = clienteAutenticado?.admin === true;
    const idCliente =
      isAdmin && req.body.id_cliente
        ? Number(req.body.id_cliente)
        : Number(clienteAutenticado?.id_cliente);

    if (!idCliente) {
      res.status(401).json({ mensagem: "Usuario nao autenticado." });
      return;
    }

    const pedidoCriado = await criarPedidoComItens(
      {
        id_cliente: idCliente,
        id_endereco_entrega: Number(req.body.id_endereco_entrega),
        metodo: req.body.metodo || null,
        itens: req.body.itens,
      },
      isAdmin
    );

    res.status(201).json({ mensagem: "Pedido criado com sucesso.", pedido: pedidoCriado });
  } catch (error) {
    if (error instanceof HttpError) {
      res.status(error.statusCode).json({ mensagem: error.message });
      return;
    }

    console.error("Erro ao criar pedido:", error);
    res.status(500).json({ mensagem: "Erro interno ao criar pedido." });
  }
};

interface PedidoUpdateData {
  status: string;
  data_pagamento?: Date;
}


export const atualizarStatusPedido = async (req: Request, res: Response): Promise<void> => {
  try {
    const clienteLogado = getClienteAutenticado(req, res);

    if (!clienteLogado) {
      return;
    }

    if (!clienteLogado.admin) {
      res.status(403).json({ mensagem: "Acesso restrito a administradores." });
      return;
    }

    const id_pedido = Number(req.params.id);
    const { status, data_pagamento } = req.body;

    const statusValidos = [
      "pendente",
      "pago",
      "em_preparacao",
      "enviado",
      "entregue",
      "cancelado",
    ];

    if (!status || !statusValidos.includes(status)) {
      res.status(400).json({
        mensagem: `Status invalido. Use um dos seguintes: ${statusValidos.join(", ")}.`,
      });
      return;
    }

    const pedido = await Pedido.findByPk(id_pedido);

    if (!pedido) {
      res.status(404).json({ mensagem: "Pedido nao encontrado." });
      return;
    }

    const dadosAtualizados: PedidoUpdateData = { status };

    if (status === "pago" && !pedido.data_pagamento) {
      dadosAtualizados.data_pagamento = data_pagamento ? new Date(data_pagamento) : new Date();
    }

    await pedido.update(dadosAtualizados);

    res.status(200).json({ mensagem: "Status do pedido atualizado.", pedido });
  } catch (error) {
    console.error("Erro ao atualizar status do pedido:", error);
    res.status(500).json({ mensagem: "Erro interno ao atualizar status." });
  }
};


export const cancelarPedido = async (req: Request, res: Response): Promise<void> => {
  try {
    const id_pedido = Number(req.params.id);
    const clienteLogado = getClienteAutenticado(req, res);

    if (!clienteLogado) {
      return;
    }

    const pedido = await Pedido.findByPk(id_pedido);

    if (!pedido) {
      res.status(404).json({ mensagem: "Pedido nao encontrado." });
      return;
    }

    if (!clienteLogado.admin && pedido.id_cliente !== clienteLogado.id_cliente) {
      res.status(403).json({ mensagem: "Voce nao tem permissao para cancelar este pedido." });
      return;
    }

    const statusNaoCancelaveis = ["enviado", "entregue", "cancelado"];

    if (statusNaoCancelaveis.includes(pedido.status ?? "")) {
      res.status(409).json({
        mensagem: `Pedido com status "${pedido.status}" nao pode ser cancelado.`,
      });
      return;
    }

    await pedido.update({ status: "cancelado" });

    res.status(200).json({ mensagem: "Pedido cancelado com sucesso." });
  } catch (error) {
    console.error("Erro ao cancelar pedido:", error);
    res.status(500).json({ mensagem: "Erro interno ao cancelar pedido." });
  }
};