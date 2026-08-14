import { Request, Response } from "express";
import { Op } from "sequelize";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import Cliente from "../models/Cliente";
import { getJwtSecret } from "../config/jwt";
import { buildPaginatedResponse, getPaginationParams } from "../utils/pagination";
import {
  isStrongPassword,
  isValidCpf,
  isValidEmail,
  sanitizeCpf,
} from "../utils/cliente.validation";

export const listarClientes = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page, limit, offset } = getPaginationParams(req);
    const shouldPaginate = req.query.page !== undefined || req.query.limit !== undefined;
    const incluirInativos = req.query.incluir_inativos === "true" || req.query.all === "true";

    const queryOptions: {
      attributes: { exclude: string[] };
      where: { ativo?: boolean };
      order: [string, string][];
      limit?: number;
      offset?: number;
    } = {
      attributes: { exclude: ["senha"] },
      where: incluirInativos ? {} : { ativo: true },
      order: [["id_cliente", "ASC"]],
    };

    if (shouldPaginate) {
      queryOptions.limit = limit;
      queryOptions.offset = offset;
    }

    const { rows: clientes, count } = await Cliente.findAndCountAll(queryOptions);

    res.status(200).json(shouldPaginate ? buildPaginatedResponse(clientes, count, page, limit) : clientes);
  } catch (error) {
    console.error("Erro ao listar clientes:", error);
    res.status(500).json({ mensagem: "Erro interno ao listar clientes." });
  }
};

export const buscarClientePorId = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const cliente = await Cliente.findOne({
      where: { id_cliente: id, ativo: true },
      attributes: { exclude: ["senha"] },
    });

    if (!cliente) {
      res.status(404).json({ mensagem: "Cliente nao encontrado." });
      return;
    }

    res.status(200).json(cliente);
  } catch (error) {
    console.error("Erro ao buscar cliente:", error);
    res.status(500).json({ mensagem: "Erro interno ao buscar cliente." });
  }
};

export const criarCliente = async (req: Request, res: Response): Promise<void> => {
  try {
    const { nome, email, senha, telefone, cpf, admin } = req.body;
    const clienteLogado = req.cliente;

    if (!nome || !email || !senha || !cpf) {
      res.status(400).json({ mensagem: "Nome, email, senha e CPF sao obrigatorios." });
      return;
    }

    if (!isValidEmail(email)) {
      res.status(400).json({ mensagem: "E-mail invalido." });
      return;
    }

    if (!isValidCpf(cpf)) {
      res.status(400).json({ mensagem: "CPF invalido." });
      return;
    }

    if (!isStrongPassword(senha)) {
      res.status(400).json({
        mensagem: "A senha deve ter no minimo 8 caracteres, incluindo letra maiuscula, minuscula e numero.",
      });
      return;
    }

    const clienteExistente = await Cliente.findOne({ where: { email } });

    if (clienteExistente) {
      res.status(409).json({ mensagem: "E-mail ja cadastrado." });
      return;
    }

    const cpfSanitizado = sanitizeCpf(cpf);
    const cpfEmUso = await Cliente.findOne({ where: { cpf: cpfSanitizado } });

    if (cpfEmUso) {
      res.status(409).json({ mensagem: "CPF ja cadastrado." });
      return;
    }

    const senhaCriptografada = await bcrypt.hash(senha, 10);

    
    const isAdmin = clienteLogado?.admin === true && admin === true;

    const novoCliente = await Cliente.create({
      nome,
      email,
      senha: senhaCriptografada,
      telefone: telefone || null,
      cpf: cpfSanitizado,
      ativo: true,
      admin: isAdmin,
    });

    const { senha: _senha, ...clienteSemSenha } = novoCliente.toJSON();

    res.status(201).json({ mensagem: "Cliente criado com sucesso.", cliente: clienteSemSenha });
  } catch (error) {
    console.error("Erro ao criar cliente:", error);
    res.status(500).json({ mensagem: "Erro interno ao criar cliente." });
  }
};

export const atualizarCliente = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { nome, email, telefone, cpf, senha, admin, ativo } = req.body;
    const clienteLogado = req.cliente;

    if (!clienteLogado) {
      res.status(401).json({ mensagem: "Usuario nao autenticado." });
      return;
    }

    if (clienteLogado.id_cliente !== Number(id) && !clienteLogado.admin) {
      res.status(403).json({ mensagem: "Voce nao tem permissao para editar este cliente." });
      return;
    }

   
    const whereClause = clienteLogado.admin
      ? { id_cliente: id }
      : { id_cliente: id, ativo: true };

    const cliente = await Cliente.findOne({ where: whereClause });

    if (!cliente) {
      res.status(404).json({ mensagem: "Cliente nao encontrado." });
      return;
    }

if (!nome || !telefone || !cpf) {
  res.status(400).json({
    mensagem: "Nome, telefone e CPF sao obrigatorios para editar o perfil.",
  });
  return;
}

    if (email && email !== cliente.email) {
      res.status(400).json({ mensagem: "Nao e permitido alterar o e-mail." });
      return;
    }

    if (cpf && cpf !== cliente.cpf) {
      if (!isValidCpf(cpf)) {
        res.status(400).json({ mensagem: "CPF invalido." });
        return;
      }

      const cpfSanitizado = sanitizeCpf(cpf);
      const cpfEmUso = await Cliente.findOne({
        where: { cpf: cpfSanitizado, id_cliente: { [Op.ne]: Number(id) } },
      });

      if (cpfEmUso) {
        res.status(409).json({ mensagem: "CPF ja esta em uso por outro cliente." });
        return;
      }
    }

    const dadosAtualizados: Partial<{
      nome: string;
      telefone: string | null;
      cpf: string | null;
      senha: string;
      admin: boolean;
      ativo: boolean;
    }> = {};

    if (nome) dadosAtualizados.nome = nome;
    if (telefone !== undefined) dadosAtualizados.telefone = telefone;
    if (cpf) dadosAtualizados.cpf = sanitizeCpf(cpf);

    if (senha) {
      if (!isStrongPassword(senha)) {
        res.status(400).json({
          mensagem: "A senha deve ter no minimo 8 caracteres, incluindo letra maiuscula, minuscula e numero.",
        });
        return;
      }
      dadosAtualizados.senha = await bcrypt.hash(senha, 10);
    }

    
    if (clienteLogado.admin) {
      if (admin !== undefined) dadosAtualizados.admin = Boolean(admin);
      if (ativo !== undefined) dadosAtualizados.ativo = Boolean(ativo);
    }

    await cliente.update(dadosAtualizados);

    const { senha: _senha, ...clienteSemSenha } = cliente.toJSON();

    res.status(200).json({ mensagem: "Cliente atualizado com sucesso.", cliente: clienteSemSenha });
  } catch (error) {
    console.error("Erro ao atualizar cliente:", error);
    res.status(500).json({ mensagem: "Erro interno ao atualizar cliente." });
  }
};

export const desativarCliente = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const clienteLogado = req.cliente;

    if (!clienteLogado) {
      res.status(401).json({ mensagem: "Usuario nao autenticado." });
      return;
    }

    if (clienteLogado.id_cliente !== Number(id) && !clienteLogado.admin) {
      res.status(403).json({ mensagem: "Voce nao tem permissao para desativar este cliente." });
      return;
    }

    const cliente = await Cliente.findOne({ where: { id_cliente: id, ativo: true } });

    if (!cliente) {
      res.status(404).json({ mensagem: "Cliente nao encontrado ou ja inativo." });
      return;
    }

    await cliente.update({ ativo: false });

    res.status(200).json({ mensagem: "Cliente desativado com sucesso." });
  } catch (error) {
    console.error("Erro ao desativar cliente:", error);
    res.status(500).json({ mensagem: "Erro interno ao desativar cliente." });
  }
};

export const loginCliente = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, senha } = req.body;

    if (!email || !senha) {
      res.status(400).json({ mensagem: "E-mail e senha sao obrigatorios." });
      return;
    }

    const cliente = await Cliente.findOne({ where: { email, ativo: true } });

    if (!cliente) {
      res.status(401).json({ mensagem: "Credenciais invalidas." });
      return;
    }

    const senhaCorreta = await bcrypt.compare(senha, cliente.senha);

    if (!senhaCorreta) {
      res.status(401).json({ mensagem: "Credenciais invalidas." });
      return;
    }

    const { senha: _senha, ...clienteSemSenha } = cliente.toJSON();

    const token = jwt.sign(
      { id_cliente: cliente.id_cliente, email: cliente.email, admin: cliente.admin },
      getJwtSecret(),
      { expiresIn: "1d" }
    );

    res.status(200).json({ mensagem: "Login realizado com sucesso.", token, cliente: clienteSemSenha });
  } catch (error) {
    console.error("Erro no login:", error);
    res.status(500).json({ mensagem: "Erro interno no login." });
  }
};