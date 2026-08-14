import { Request, Response } from "express";
import Endereco from "../models/Endereco";
import Cliente from "../models/Cliente";
import { buildPaginatedResponse, getPaginationParams } from "../utils/pagination";

const getClienteAutenticado = (req: Request, res: Response) => {
  if (!req.cliente) {
    res.status(401).json({ mensagem: "Usuario nao autenticado." });
    return null;
  }

  return req.cliente;
};



export const listarEnderecos = async (req: Request, res: Response): Promise<void> => {
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
      ],
      distinct: true,
      order: [["id_endereco", "DESC"]] as [["id_endereco", "DESC"]],
    };

    const { rows: enderecos, count } = shouldPaginate
      ? await Endereco.findAndCountAll({
          ...baseOptions,
          limit,
          offset,
        })
      : await Endereco.findAndCountAll(baseOptions);

    res
      .status(200)
      .json(shouldPaginate ? buildPaginatedResponse(enderecos, count, page, limit) : enderecos);
  } catch (error) {
    console.error("Erro ao listar enderecos:", error);
    res.status(500).json({ mensagem: "Erro interno ao listar enderecos." });
  }
};



export const listarEnderecosPorCliente = async (req: Request, res: Response): Promise<void> => {
  try {
    const id_cliente = Number(req.params.id_cliente);
    const { page, limit, offset } = getPaginationParams(req);
    const shouldPaginate = req.query.page !== undefined || req.query.limit !== undefined;
    const baseOptions = {
      where: { id_cliente },
      order: [["id_endereco", "DESC"]] as [["id_endereco", "DESC"]],
    };

    const { rows: enderecos, count } = shouldPaginate
      ? await Endereco.findAndCountAll({
          ...baseOptions,
          limit,
          offset,
        })
      : await Endereco.findAndCountAll(baseOptions);

    res
      .status(200)
      .json(shouldPaginate ? buildPaginatedResponse(enderecos, count, page, limit) : enderecos);
  } catch (error) {
    console.error("Erro ao listar enderecos do cliente:", error);
    res.status(500).json({ mensagem: "Erro interno ao listar enderecos do cliente." });
  }
};


export const buscarEnderecoPorId = async (req: Request, res: Response): Promise<void> => {
  try {
    const id_endereco = Number(req.params.id);
    const clienteLogado = getClienteAutenticado(req, res);

    if (!clienteLogado) {
      return;
    }

    const endereco = await Endereco.findByPk(id_endereco, {
      include: [
        {
          model: Cliente,
          as: "cliente",
          attributes: ["id_cliente", "nome", "email"],
        },
      ],
    });

    if (!endereco) {
      res.status(404).json({ mensagem: "Endereco nao encontrado." });
      return;
    }

    if (!clienteLogado.admin && endereco.id_cliente !== clienteLogado.id_cliente) {
      res.status(403).json({ mensagem: "Voce nao tem permissao para acessar este endereco." });
      return;
    }

    res.status(200).json(endereco);
  } catch (error) {
    console.error("Erro ao buscar endereco:", error);
    res.status(500).json({ mensagem: "Erro interno ao buscar endereco." });
  }
};


export const criarEndereco = async (req: Request, res: Response): Promise<void> => {
  try {
    const clienteLogado = getClienteAutenticado(req, res);

    if (!clienteLogado) {
      return;
    }

    const { id_cliente, numero, complemento, bairro, cidade, estado, cep } = req.body;
    const idClienteBody = id_cliente !== undefined ? Number(id_cliente) : undefined;
    const idCliente = clienteLogado.admin ? idClienteBody : clienteLogado.id_cliente;

    if (!idCliente) {
      res.status(400).json({ mensagem: "O id_cliente e obrigatorio." });
      return;
    }

    if (!clienteLogado.admin && idClienteBody !== undefined && idClienteBody !== clienteLogado.id_cliente) {
      res.status(403).json({ mensagem: "Voce nao pode criar endereco para outro cliente." });
      return;
    }

    const cliente = await Cliente.findByPk(idCliente);

    if (!cliente) {
      res.status(404).json({ mensagem: "Cliente nao encontrado." });
      return;
    }

    const novoEndereco = await Endereco.create({
      id_cliente: idCliente,
      numero,
      complemento,
      bairro,
      cidade,
      estado,
      cep,
    });

    res.status(201).json({
      mensagem: "Endereco criado com sucesso.",
      endereco: novoEndereco,
    });
  } catch (error) {
    console.error("Erro ao criar endereco:", error);
    res.status(500).json({ mensagem: "Erro interno ao criar endereco." });
  }
};


export const atualizarEndereco = async (req: Request, res: Response): Promise<void> => {
  try {
    const id_endereco = Number(req.params.id);
    const clienteLogado = getClienteAutenticado(req, res);

    if (!clienteLogado) {
      return;
    }

    const endereco = await Endereco.findByPk(id_endereco);

    if (!endereco) {
      res.status(404).json({ mensagem: "Endereco nao encontrado." });
      return;
    }

    if (!clienteLogado.admin && endereco.id_cliente !== clienteLogado.id_cliente) {
      res.status(403).json({ mensagem: "Voce nao tem permissao para atualizar este endereco." });
      return;
    }

    const { numero, complemento, bairro, cidade, estado, cep } = req.body;

    await endereco.update({
      numero,
      complemento,
      bairro,
      cidade,
      estado,
      cep,
    });

    res.status(200).json({
      mensagem: "Endereco atualizado com sucesso.",
      endereco,
    });
  } catch (error) {
    console.error("Erro ao atualizar endereco:", error);
    res.status(500).json({ mensagem: "Erro interno ao atualizar endereco." });
  }
};


export const deletarEndereco = async (req: Request, res: Response): Promise<void> => {
  try {
    const id_endereco = Number(req.params.id);
    const clienteLogado = getClienteAutenticado(req, res);

    if (!clienteLogado) {
      return;
    }

    const endereco = await Endereco.findByPk(id_endereco);

    if (!endereco) {
      res.status(404).json({ mensagem: "Endereco nao encontrado." });
      return;
    }

    if (!clienteLogado.admin && endereco.id_cliente !== clienteLogado.id_cliente) {
      res.status(403).json({ mensagem: "Voce nao tem permissao para deletar este endereco." });
      return;
    }

    await endereco.destroy();

    res.status(200).json({ mensagem: "Endereco deletado com sucesso." });
  } catch (error) {
    console.error("Erro ao deletar endereco:", error);
    res.status(500).json({ mensagem: "Erro interno ao deletar endereco." });
  }
};