import React from "react";
import "./Footer.css";

function Footer() {
  const anoAtual = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-brand">
          <img src="/logoheader.png" alt="PC Forge" className="footer-logo" />
          <p>
            Performance, estilo e confiabilidade para montar o setup que voce
            imaginou.
          </p>
        </div>

        <div className="footer-about">
          <h3>Quem somos</h3>
          <p>
            A PC Forge e uma loja focada em pecas e perifericos para quem quer
            montar, evoluir e aproveitar melhor o proprio setup.
          </p>
        </div>

        <div className="footer-contact">
          <h3>Contato</h3>
          <p>Atendimento para tirar duvidas sobre pedidos, pecas e suporte.</p>
          <a href="mailto:contato@pcforge.com">contato@pcforge.com</a>
          <span>(44) 98411-2718</span>
        </div>
      </div>

      <div className="footer-bottom">
        <span>© {anoAtual} PC Forge. Todos os direitos reservados.</span>
      </div>
    </footer>
  );
}

export default Footer;
