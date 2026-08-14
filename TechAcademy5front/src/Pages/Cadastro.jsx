import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { sendJson } from "../config/api";
import { useUsuario } from "../context/UsuarioContext";
import { useCarrinho } from "../context/CarrinhoContext";
import "./Cadastro.css";

// Máscara CPF
const formatarCPF = (valor) => {
  if (!valor) return "";
  const apenasNumeros = valor.replace(/\D/g, "");

  if (apenasNumeros.length <= 3) return apenasNumeros;
  if (apenasNumeros.length <= 6)
    return `${apenasNumeros.slice(0, 3)}.${apenasNumeros.slice(3)}`;
  if (apenasNumeros.length <= 9)
    return `${apenasNumeros.slice(0, 3)}.${apenasNumeros.slice(
      3,
      6
    )}.${apenasNumeros.slice(6)}`;

  return `${apenasNumeros.slice(0, 3)}.${apenasNumeros.slice(
    3,
    6
  )}.${apenasNumeros.slice(6, 9)}-${apenasNumeros.slice(9, 11)}`;
};

// Máscara Telefone
const formatarTelefone = (valor) => {
  if (!valor) return "";
  const apenasNumeros = valor.replace(/\D/g, "");

  if (apenasNumeros.length <= 2) return `(${apenasNumeros}`;
  if (apenasNumeros.length <= 7)
    return `(${apenasNumeros.slice(0, 2)}) ${apenasNumeros.slice(2)}`;

  return `(${apenasNumeros.slice(0, 2)}) ${apenasNumeros.slice(
    2,
    7
  )}-${apenasNumeros.slice(7, 11)}`;
};

function Cadastro() {
  const navigate = useNavigate();
  const { login } = useUsuario();
  const { recarregarCarrinho } = useCarrinho();

  const [form, setForm] = useState({
    nome: "",
    email: "",
    senha: "",
    confirmarSenha: "",
    cpf: "",
    telefone: "",
    dataNascimento: "",
  });

  const [erros, setErros] = useState({});
  const [erroGeral, setErroGeral] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    let novoValor = value;

    if (name === "cpf") novoValor = formatarCPF(value);
    if (name === "telefone") novoValor = formatarTelefone(value);

    setForm((prev) => ({ ...prev, [name]: novoValor }));
    setErros((prev) => ({ ...prev, [name]: "" }));
  };

  const validar = () => {
    const novosErros = {};

    if (!form.nome.trim()) {
      novosErros.nome = "Nome é obrigatório.";
    } else if (form.nome.trim().length < 3) {
      novosErros.nome = "Nome deve ter pelo menos 3 caracteres.";
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!form.email.trim()) {
      novosErros.email = "Email é obrigatório.";
    } else if (!emailRegex.test(form.email)) {
      novosErros.email = "Email inválido.";
    }

    if (!form.senha) {
      novosErros.senha = "Senha é obrigatória.";
    } else if (form.senha.length < 8) {
      novosErros.senha = "Senha deve ter pelo menos 8 caracteres.";
    }

    if (!form.confirmarSenha) {
      novosErros.confirmarSenha = "Confirme sua senha.";
    } else if (form.senha !== form.confirmarSenha) {
      novosErros.confirmarSenha = "As senhas não coincidem.";
    }

    const cpfLimpo = form.cpf.replace(/\D/g, "");

    if (!form.cpf.trim()) {
      novosErros.cpf = "CPF é obrigatório.";
    } else if (cpfLimpo.length !== 11) {
      novosErros.cpf = "CPF inválido. Digite 11 dígitos.";
    }

    if (!form.telefone.trim()) {
      novosErros.telefone = "Telefone é obrigatório.";
    } else if (form.telefone.replace(/\D/g, "").length < 10) {
      novosErros.telefone = "Telefone inválido.";
    }

    if (!form.dataNascimento) {
      novosErros.dataNascimento = "Data de nascimento é obrigatória.";
    } else {
      const nascimento = new Date(form.dataNascimento);
      const hoje = new Date();

      let idade = hoje.getFullYear() - nascimento.getFullYear();
      const mes = hoje.getMonth() - nascimento.getMonth();

      if (mes < 0 || (mes === 0 && hoje.getDate() < nascimento.getDate())) {
        idade--;
      }

      if (idade < 18) {
        novosErros.dataNascimento = "É necessário ter pelo menos 18 anos.";
      }
    }

    return novosErros;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErroGeral("");

    const errosEncontrados = validar();

    if (Object.keys(errosEncontrados).length > 0) {
      setErros(errosEncontrados);
      return;
    }

    setLoading(true);

    const cpfLimpo = form.cpf.replace(/\D/g, "");
    const telefoneLimpo = form.telefone.replace(/\D/g, "");

    try {
      // cria conta
      await sendJson("/clientes", "POST", {
        nome: form.nome,
        email: form.email,
        senha: form.senha,
        cpf: cpfLimpo,
        telefone: telefoneLimpo,
        dataNascimento: form.dataNascimento,
      });

      // login automático
      const data = await sendJson("/clientes/login", "POST", {
        email: form.email,
        senha: form.senha,
      });

      login(data);
      recarregarCarrinho();

      // redireciona
      navigate("/login");

    } catch (err) {
      if (err.message.includes("409")) {
        setErroGeral("E-mail ou CPF já cadastrado.");
      } else if (err.message.includes("400")) {
        const detail = err.message.split(" - ")[1];
        setErroGeral(detail || "Dados inválidos.");
      } else {
        setErroGeral("Erro ao criar conta. Tente novamente.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="cadastro-container">
      <div className="cadastro-box">
        <h1>Criar Conta</h1>

        <form onSubmit={handleSubmit} noValidate>

          <div className="campo">
            <label>Nome completo</label>
            <input
              type="text"
              name="nome"
              placeholder="Seu nome completo"
              value={form.nome}
              onChange={handleChange}
            />
            {erros.nome && <span className="erro">{erros.nome}</span>}
          </div>

          <div className="campo">
            <label>Email</label>
            <input
              type="email"
              name="email"
              placeholder="seu@email.com"
              value={form.email}
              onChange={handleChange}
            />
            {erros.email && <span className="erro">{erros.email}</span>}
          </div>

          <div className="campo">
            <label>CPF</label>
            <input
              type="text"
              name="cpf"
              placeholder="000.000.000-00"
              value={form.cpf}
              onChange={handleChange}
              maxLength={14}
            />
            {erros.cpf && <span className="erro">{erros.cpf}</span>}
          </div>

          <div className="campo">
            <label>Telefone</label>
            <input
              type="text"
              name="telefone"
              placeholder="(00) 00000-0000"
              value={form.telefone}
              onChange={handleChange}
              maxLength={15}
            />
            {erros.telefone && <span className="erro">{erros.telefone}</span>}
          </div>

          <div className="campo">
            <label>Data de nascimento</label>
            <input
              type="date"
              name="dataNascimento"
              value={form.dataNascimento}
              onChange={handleChange}
            />
            {erros.dataNascimento && (
              <span className="erro">{erros.dataNascimento}</span>
            )}
          </div>

          <div className="campo">
            <label>Senha</label>
            <input
              type="password"
              name="senha"
              placeholder="Mínimo 8 caracteres"
              value={form.senha}
              onChange={handleChange}
            />
            {erros.senha && <span className="erro">{erros.senha}</span>}
          </div>

          <div className="campo">
            <label>Confirmar senha</label>
            <input
              type="password"
              name="confirmarSenha"
              placeholder="Repita sua senha"
              value={form.confirmarSenha}
              onChange={handleChange}
            />
            {erros.confirmarSenha && (
              <span className="erro">{erros.confirmarSenha}</span>
            )}
          </div>

          {erroGeral && <span className="erro erro-geral">{erroGeral}</span>}

          <button type="submit" disabled={loading}>
            {loading ? "Criando conta..." : "Criar conta"}
          </button>

        </form>

        <p>
          Já tem conta? <a href="/Login">Fazer login</a>
        </p>

      </div>
    </div>
  );
}

export default Cadastro;