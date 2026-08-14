import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchJson, sendJson } from "../config/api";
import "./Editarperfil.css";

function EditarPerfil() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    nome: "",
    telefone: "",
    senha: "",
    confirmarSenha: "",
  });

  const [clienteInfo, setClienteInfo] = useState(null);
  const [erros, setErros] = useState({});
  const [erroGeral, setErroGeral] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    const clienteSalvo = localStorage.getItem("cliente");
    if (!clienteSalvo) {
      navigate("/Login");
      return;
    }

    const cliente = JSON.parse(clienteSalvo);

    fetchJson(`/clientes/${cliente.id_cliente}`)
      .then((data) => {
        setClienteInfo(data);

        setForm((prev) => ({
          ...prev,
          nome: data.nome || "",
          telefone: formatarTelefone(data.telefone || ""),
        }));
      })
      .catch(() => {
        setErroGeral("Não foi possível carregar seus dados.");
      })
      .finally(() => setLoading(false));
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    let novoValor = value;

    if (name === "telefone") {
      novoValor = formatarTelefone(value);
    }

    setForm((prev) => ({ ...prev, [name]: novoValor }));

    setErros((prev) => ({ ...prev, [name]: "" }));
    setSucesso("");
    setErroGeral("");
  };

  const validar = () => {
    const novosErros = {};

    if (!form.nome.trim()) {
      novosErros.nome = "Nome é obrigatório.";
    } else if (form.nome.trim().length < 3) {
      novosErros.nome = "Nome deve ter pelo menos 3 caracteres.";
    }

    if (form.telefone && form.telefone.replace(/\D/g, "").length < 10) {
      novosErros.telefone = "Telefone inválido.";
    }

    if (form.senha) {
      const senhaForteRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

      if (!senhaForteRegex.test(form.senha)) {
        novosErros.senha =
          "Senha deve ter no mínimo 8 caracteres, letra maiúscula, minúscula e número.";
      }

      if (!form.confirmarSenha) {
        novosErros.confirmarSenha = "Confirme sua nova senha.";
      } else if (form.senha !== form.confirmarSenha) {
        novosErros.confirmarSenha = "As senhas não coincidem.";
      }
    }

    return novosErros;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setSucesso("");
    setErroGeral("");

    if (!clienteInfo) {
      setErroGeral("Dados do perfil não carregados. Recarregue a página.");
      return;
    }

    const errosEncontrados = validar();

    if (Object.keys(errosEncontrados).length > 0) {
      setErros(errosEncontrados);
      return;
    }

    setSalvando(true);

    const payload = {
      nome: form.nome.trim(),
      telefone: form.telefone.replace(/\D/g, "") || null,
      cpf: clienteInfo?.cpf || null,
    };

    if (form.senha) {
      payload.senha = form.senha;
    }

    try {
      await sendJson(`/clientes/${clienteInfo.id_cliente}`, "PUT", payload);

      const clienteSalvo = JSON.parse(localStorage.getItem("cliente") || "{}");

      localStorage.setItem(
        "cliente",
        JSON.stringify({ ...clienteSalvo, nome: form.nome.trim() })
      );

      setSucesso("Perfil atualizado com sucesso!");

      setForm((prev) => ({
        ...prev,
        senha: "",
        confirmarSenha: "",
      }));
    } catch (err) {
      if (err.message.includes("400")) {
        const detail = err.message.split(" - ")[1];
        setErroGeral(detail || "Dados inválidos.");
      } else if (err.message.includes("403")) {
        setErroGeral("Você não tem permissão para editar este perfil.");
      } else {
        setErroGeral("Erro ao salvar. Tente novamente.");
      }
    } finally {
      setSalvando(false);
    }
  };

  if (loading) {
    return (
      <div className="perfil-container">
        <div className="perfil-box">
          <p style={{ color: "#7a8fa6" }}>Carregando dados...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="perfil-container">
      <div className="perfil-box">
        <h1>
          Meu <span>Perfil</span>
        </h1>

        <p className="perfil-subtitulo">
          Edite suas informações pessoais abaixo.
        </p>

        <form onSubmit={handleSubmit} noValidate>

          <p className="perfil-section-label">Dados pessoais</p>

          <div className="campo">
            <label htmlFor="nome">Nome completo</label>
            <input
              id="nome"
              type="text"
              name="nome"
              value={form.nome}
              onChange={handleChange}
            />
            {erros.nome && <span className="erro">{erros.nome}</span>}
          </div>

          <div className="campo">
            <label htmlFor="telefone">Telefone</label>
            <input
              id="telefone"
              type="text"
              name="telefone"
              value={form.telefone}
              onChange={handleChange}
              placeholder="(44) 99999-9999"
            />
            {erros.telefone && <span className="erro">{erros.telefone}</span>}
          </div>

          <div className="campo">
            <label>E-mail</label>
            <input type="email" value={clienteInfo?.email || ""} disabled />
          </div>

          <div className="campo">
            <label>CPF</label>
            <input
              type="text"
              value={formatarCPF(clienteInfo?.cpf)}
              disabled
            />
          </div>

          <div className="perfil-divider" />

          <p className="perfil-section-label">Alterar senha</p>

          <div className="campo">
            <label>Nova senha</label>
            <input
              type="password"
              name="senha"
              value={form.senha}
              onChange={handleChange}
            />
            {erros.senha && <span className="erro">{erros.senha}</span>}
          </div>

          <div className="campo">
            <label>Confirmar nova senha</label>
            <input
              type="password"
              name="confirmarSenha"
              value={form.confirmarSenha}
              onChange={handleChange}
            />
            {erros.confirmarSenha && (
              <span className="erro">{erros.confirmarSenha}</span>
            )}
          </div>

          {erroGeral && <div className="msg-erro-geral">{erroGeral}</div>}
          {sucesso && <div className="msg-sucesso">{sucesso}</div>}

          <button type="submit" disabled={salvando}>
            {salvando ? "Salvando..." : "Salvar alterações"}
          </button>

          <button
            type="button"
            className="btn-voltar"
            onClick={() => navigate(-1)}
          >
            Voltar
          </button>

        </form>
      </div>
    </div>
  );
}

// ✅ Máscara de telefone BR
const formatarTelefone = (valor) => {
  if (!valor) return "";

  const numeros = valor.replace(/\D/g, "").slice(0, 11);

  if (numeros.length <= 10) {
    return numeros
      .replace(/^(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{4})(\d)/, "$1-$2");
  } else {
    return numeros
      .replace(/^(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{5})(\d)/, "$1-$2");
  }
};

const formatarCPF = (cpf) => {
  if (!cpf) return "";

  const numeros = cpf.replace(/\D/g, "");

  return numeros
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1-$2")
    .slice(0, 14);
};

export default EditarPerfil;