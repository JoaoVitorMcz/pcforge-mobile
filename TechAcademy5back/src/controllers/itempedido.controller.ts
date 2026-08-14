import { Request, Response } from "express";
import ItemPedido from "../models/Itempedido";
import Pedido from "../models/Pedido";
import Produto from "../models/Produto";
import sequelize from "../config/database";
import { buildPaginatedResponse, getPaginationParams } from "../utils/pagination";

const getClienteAutenticado = (req: Request, res: Response) => {
  if (!req.cliente) {
    res.status(401).json({ mensagem: "Usuario nao autenticado." });
    return null;
  }

  return req.cliente;
};

const validarAcessoAoPedido = (req: Request, res: Response, idClientePedido: number) => {
  const clienteLogado = getClienteAutenticado(req, res);

  if (!clienteLogado) {
    return false;
  }

  if (!clienteLogado.admin && idClientePedido !== clienteLogado.id_cliente) {
    res.status(403).json({ mensagem: "Voce nao tem permissao para acessar este pedido." });
    return false;
  }

  return true;
};


export const listarItensDoPedido = async (req: Request, res: Response): Promise<void> => {
  try {
    const id_pedido = Number(req.params.id_pedido);
    const { page, limit, offset } = getPaginationParams(req);
    const shouldPaginate = req.query.page !== undefined || req.query.limit !== undefined;

    const pedido = await Pedido.findByPk(id_pedido);

    if (!pedido) {
      res.status(404).json({ mensagem: "Pedido nao encontrado." });
      return;
    }

    if (!validarAcessoAoPedido(req, res, pedido.id_cliente)) {
      return;
    }

    const baseOptions = {
      where: { id_pedido },
      include: [
        {
          model: Produto,
          as: "produto",
          attributes: ["id_produto", "nome", "descricao", "valor", "imagem"],
        },
      ],
      distinct: true,
    };

    const { rows: itens, count } = shouldPaginate
      ? await ItemPedido.findAndCountAll({
          ...baseOptions,
          limit,
          offset,
        })
      : await ItemPedido.findAndCountAll(baseOptions);

    res.status(200).json(shouldPaginate ? buildPaginatedResponse(itens, count, page, limit) : itens);
  } catch (error) {
    console.error("Erro ao listar itens do pedido:", error);
    res.status(500).json({ mensagem: "Erro interno ao listar itens do pedido." });
  }
};


export const buscarItemPorId = async (req: Request, res: Response): Promise<void> => {
  try {
    const id_item = Number(req.params.id);

    const item = await ItemPedido.findByPk(id_item, {
      include: [
        {
          model: Produto,
          as: "produto",
          attributes: ["id_produto", "nome", "descricao", "valor", "imagem"],
        },
      ],
    });

    if (!item) {
      res.status(404).json({ mensagem: "Item nao encontrado." });
      return;
    }

    const pedido = await Pedido.findByPk(item.id_pedido);

    if (!pedido) {
      res.status(404).json({ mensagem: "Pedido nao encontrado." });
      return;
    }

    if (!validarAcessoAoPedido(req, res, pedido.id_cliente)) {
      return;
    }

    res.status(200).json(item);
  } catch (error) {
    console.error("Erro ao buscar item:", error);
    res.status(500).json({ mensagem: "Erro interno ao buscar item." });
  }
};


export const adicionarItem = async (req: Request, res: Response): Promise<void> => {
  const transaction = await sequelize.transaction();

  try {
    const id_pedido = Number(req.params.id_pedido);
    const { id_produto, quantidade, preco_unitario } = req.body;

    if (!id_produto || !quantidade || !preco_unitario) {
      await transaction.rollback();
      res.status(400).json({ mensagem: "id_produto, quantidade e preco_unitario sao obrigatorios." });
      return;
    }

    const pedido = await Pedido.findByPk(id_pedido, { transaction });

    if (!pedido) {
      await transaction.rollback();
      res.status(404).json({ mensagem: "Pedido nao encontrado." });
      return;
    }

    if (!validarAcessoAoPedido(req, res, pedido.id_cliente)) {
      await transaction.rollback();
      return;
    }

    const statusBloqueados = ["enviado", "entregue", "cancelado"];
    if (statusBloqueados.includes(pedido.status ?? "")) {
      await transaction.rollback();
      res.status(409).json({
        mensagem: `Nao e possivel adicionar itens a um pedido com status "${pedido.status}".`,
      });
      return;
    }

    const produto = await Produto.findOne({
      where: { id_produto: Number(id_produto), ativo: true },
      transaction,
    });

    if (!produto) {
      await transaction.rollback();
      res.status(404).json({ mensagem: "Produto nao encontrado ou inativo." });
      return;
    }

    const itemExistente = await ItemPedido.findOne({
      where: { id_pedido, id_produto: Number(id_produto) },
      transaction,
    });

    let item: ItemPedido;

    if (itemExistente) {
      await itemExistente.update(
        { quantidade: itemExistente.quantidade + Number(quantidade) },
        { transaction }
      );
      item = itemExistente;
    } else {
      item = await ItemPedido.create(
        {
          id_pedido,
          id_produto: Number(id_produto),
          quantidade: Number(quantidade),
          preco_unitario: Number(preco_unitario),
        },
        { transaction }
      );
    }

    const todosItens = await ItemPedido.findAll({ where: { id_pedido }, transaction });
    const novoTotal = todosItens.reduce(
      (acc, i) => acc + i.quantidade * Number(i.preco_unitario),
      0
    );
    await pedido.update({ valor: novoTotal }, { transaction });

    await transaction.commit();

    res.status(201).json({ mensagem: "Item adicionado ao pedido.", item });
  } catch (error) {
    await transaction.rollback();
    console.error("Erro ao adicionar item:", error);
    res.status(500).json({ mensagem: "Erro interno ao adicionar item." });
  }
};


export const atualizarQuantidadeItem = async (req: Request, res: Response): Promise<void> => {
  const transaction = await sequelize.transaction();

  try {
    const id_item = Number(req.params.id);
    const { quantidade } = req.body;

    if (!quantidade || Number(quantidade) < 1) {
      await transaction.rollback();
      res.status(400).json({ mensagem: "Quantidade deve ser maior que zero." });
      return;
    }

    const item = await ItemPedido.findByPk(id_item, { transaction });

    if (!item) {
      await transaction.rollback();
      res.status(404).json({ mensagem: "Item nao encontrado." });
      return;
    }

    const pedido = await Pedido.findByPk(item.id_pedido, { transaction });

    if (!pedido) {
      await transaction.rollback();
      res.status(404).json({ mensagem: "Pedido nao encontrado." });
      return;
    }

    if (!validarAcessoAoPedido(req, res, pedido.id_cliente)) {
      await transaction.rollback();
      return;
    }

    const statusBloqueados = ["enviado", "entregue", "cancelado"];
    if (statusBloqueados.includes(pedido.status ?? "")) {
      await transaction.rollback();
      res.status(409).json({
        mensagem: `Nao e possivel editar itens de um pedido com status "${pedido.status}".`,
      });
      return;
    }

    await item.update({ quantidade: Number(quantidade) }, { transaction });

    const todosItens = await ItemPedido.findAll({ where: { id_pedido: item.id_pedido }, transaction });
    const novoTotal = todosItens.reduce(
      (acc, i) => acc + i.quantidade * Number(i.preco_unitario),
      0
    );
    await pedido.update({ valor: novoTotal }, { transaction });

    await transaction.commit();

    res.status(200).json({ mensagem: "Quantidade atualizada.", item });
  } catch (error) {
    await transaction.rollback();
    console.error("Erro ao atualizar item:", error);
    res.status(500).json({ mensagem: "Erro interno ao atualizar item." });
  }
};


export const removerItem = async (req: Request, res: Response): Promise<void> => {
  const transaction = await sequelize.transaction();

  try {
    const id_item = Number(req.params.id);

    const item = await ItemPedido.findByPk(id_item, { transaction });

    if (!item) {
      await transaction.rollback();
      res.status(404).json({ mensagem: "Item nao encontrado." });
      return;
    }

    const pedido = await Pedido.findByPk(item.id_pedido, { transaction });

    if (!pedido) {
      await transaction.rollback();
      res.status(404).json({ mensagem: "Pedido nao encontrado." });
      return;
    }

    if (!validarAcessoAoPedido(req, res, pedido.id_cliente)) {
      await transaction.rollback();
      return;
    }

    const statusBloqueados = ["enviado", "entregue", "cancelado"];
    if (statusBloqueados.includes(pedido.status ?? "")) {
      await transaction.rollback();
      res.status(409).json({
        mensagem: `Nao e possivel remover itens de um pedido com status "${pedido.status}".`,
      });
      return;
    }

    await item.destroy({ transaction });

    const itensRestantes = await ItemPedido.findAll({ where: { id_pedido: item.id_pedido }, transaction });
    const novoTotal = itensRestantes.reduce(
      (acc, i) => acc + i.quantidade * Number(i.preco_unitario),
      0
    );
    await pedido.update({ valor: novoTotal }, { transaction });

    await transaction.commit();

    res.status(200).json({ mensagem: "Item removido do pedido." });
  } catch (error) {
    await transaction.rollback();
    console.error("Erro ao remover item:", error);
    res.status(500).json({ mensagem: "Erro interno ao remover item." });
  }
};