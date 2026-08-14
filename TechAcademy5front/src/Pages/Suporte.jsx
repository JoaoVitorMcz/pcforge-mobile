import { useRef, useState } from "react";
import emailjs from "emailjs-com";
import "./Suporte.css";

const TAGS = [
  "Dúvida sobre produto",
  "Problema com pedido",
  "Compatibilidade",
  "Troca / Devolução",
  "Garantia",
  "Outro",
];

const Suporte = () => {
  const formRef = useRef(null);
  const [tagAtiva, setTagAtiva] = useState("Dúvida sobre produto");
  const [status, setStatus] = useState("idle");

  const handleSubmit = (e) => {
    e.preventDefault();
    setStatus("enviando");

    emailjs
      .sendForm(
        "service_qsrb1yg",      
        "template_ptttpck",      
        formRef.current,
        "Jeki9fnqeSMjQdvgA"      
      )
      .then(
        () => {
          setStatus("sucesso");
          formRef.current.reset();
        },
        (error) => {
          console.error("Erro:", error);
          setStatus("erro");
        }
      );
  };

  return (
    <div className="suporte-page">
      <div className="suporte-wrap">

        <div className="suporte-header">
          <div className="suporte-header-text">
            <h2>Suporte Técnico</h2>
            <p>Resposta em até 24h úteis · suporte@pcForge.com.br</p>
          </div>
        </div>

        <p className="suporte-subtitulo">Selecione o tipo de solicitação:</p>

        <div className="tags-row">
          {TAGS.map((tag) => (
            <span
              key={tag}
              className={`tag ${tagAtiva === tag ? "active" : ""}`}
              onClick={() => setTagAtiva(tag)}
            >
              {tag}
            </span>
          ))}
        </div>

        <div className="divider" />

        <form ref={formRef} onSubmit={handleSubmit}>
          <div className="form-grid">

            <div className="form-field">
              <label>Nome</label>
              <input name="nome" type="text" placeholder="Seu nome completo" required />
            </div>

            <div className="form-field">
              <label>E-mail</label>
              <input name="email" type="email" placeholder="seu@email.com" required />
            </div>

            <div className="form-field">
              <label>Número do pedido</label>
              <input name="pedido" type="text" placeholder="Ex: #00123 (opcional)" />
            </div>

            <div className="form-field">
              <label>Produto relacionado</label>
              <input name="produto" type="text" placeholder="Ex: RTX 4070, Ryzen 7..." />
            </div>

            <div className="form-field full">
              <label>Descreva o problema</label>
              <textarea
                name="mensagem"
                placeholder="Conte com detalhes o que está acontecendo."
                required
              />
            </div>

          </div>

          <div className="form-footer">
            <span className="form-footer-note">
              Campos obrigatórios: nome, e-mail e mensagem.
            </span>
            <button type="submit" className="btn-enviar" disabled={status === "enviando"}>
              {status === "enviando" ? "Enviando..." : "Enviar"}
            </button>
          </div>

          {status === "sucesso" && (
            <div className="status-msg sucesso">
              Mensagem enviada! Responderemos em até 24h no e-mail informado.
            </div>
          )}

          {status === "erro" && (
            <div className="status-msg erro">
              Erro ao enviar. Tente novamente.
            </div>
          )}
        </form>

      </div>
    </div>
  );
};

export default Suporte;