import React from "react";
import { useNavigate } from "react-router-dom";
import {
  FiBox,
  FiMinus,
  FiPlus,
  FiShoppingCart,
  FiTrash2,
} from "react-icons/fi";
import { useCarrinho } from "../context/CarrinhoContext";
import "./Carrinho.css";

function formatCurrency(value) {
  return value.toLocaleString("pt-BR", { minimumFractionDigits: 2 });
}

function getEstoqueDisponivel(item) {
  const estoque = Number.parseInt(item?.estoque, 10);
  return Number.isFinite(estoque) ? estoque : null;
}

function Carrinho() {
  const navigate = useNavigate();
  const { itens, aumentar, diminuir, remover, total } = useCarrinho();

  const handleFinalizarCompra = () => {
    const clienteSalvo = localStorage.getItem("cliente");
    if (!clienteSalvo) {
      navigate("/Login");
      return;
    }
    navigate("/checkout");
  };

  if (itens.length === 0) {
    return (
      <div className="carrinho-page">
        <div className="carrinho-vazio">
          <FiShoppingCart className="carrinho-vazio-icone" aria-hidden="true" />
          <h2>Seu carrinho está vazio</h2>
          <p>Adicione produtos para continuar comprando.</p>
          <button type="button" onClick={() => navigate("/pecas")}>
            Ver Peças
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="carrinho-page">
      <div className="carrinho-header">
        <h1>MEU <span>CARRINHO</span></h1>
        <p>{itens.length} item(ns) adicionado(s)</p>
      </div>

      <div className="carrinho-layout">
        <div className="carrinho-itens">
          {itens.map((item) => {
            const unitPrice = item.valor || item.preco;
            const subtotal = unitPrice * item.quantidade;
            const estoqueDisponivel = getEstoqueDisponivel(item);
            const limiteAtingido =
              estoqueDisponivel !== null && item.quantidade >= estoqueDisponivel;

            return (
              <div key={item.id_produto} className="carrinho-item">
                <div className="item-img">
                  {item.imagem ? (
                    <img src={item.imagem} alt={item.nome} />
                  ) : (
                    <FiBox className="item-img-placeholder" aria-hidden="true" />
                  )}
                </div>

                <div className="item-info">
                  <h4>{item.nome}</h4>
                  <p className="item-preco-unit">
                    R$ {formatCurrency(unitPrice)} / un.
                  </p>
                  {estoqueDisponivel !== null && (
                    <p className="item-estoque">
                      Estoque disponível: {estoqueDisponivel}
                    </p>
                  )}
                </div>

                <div className="item-quantidade">
                  <button
                    type="button"
                    onClick={() => diminuir(item.id_produto)}
                    aria-label={`Diminuir quantidade de ${item.nome}`}
                  >
                    <FiMinus />
                  </button>
                  <span>{item.quantidade}</span>
                  <button
                    type="button"
                    onClick={() => aumentar(item.id_produto)}
                    aria-label={`Aumentar quantidade de ${item.nome}`}
                    disabled={limiteAtingido}
                    title={limiteAtingido ? "Limite de estoque atingido" : ""}
                  >
                    <FiPlus />
                  </button>
                </div>

                <div className="item-subtotal">R$ {formatCurrency(subtotal)}</div>

                <button
                  type="button"
                  className="item-remover"
                  onClick={() => remover(item.id_produto)}
                  aria-label={`Remover ${item.nome} do carrinho`}
                >
                  <FiTrash2 />
                </button>
              </div>
            );
          })}
        </div>

        <div className="carrinho-resumo">
          <h3>RESUMO DO PEDIDO</h3>

          <div className="resumo-linhas">
            {itens.map((item) => {
              const unitPrice = item.valor || item.preco;
              const subtotal = unitPrice * item.quantidade;
              return (
                <div key={item.id_produto} className="resumo-linha">
                  <span>{item.nome} x{item.quantidade}</span>
                  <span>R$ {formatCurrency(subtotal)}</span>
                </div>
              );
            })}
          </div>

          <div className="resumo-divider" />

          <div className="resumo-total">
            <span>Total</span>
            <span>R$ {formatCurrency(total)}</span>
          </div>

          <button
            type="button"
            className="btn-finalizar"
            onClick={handleFinalizarCompra}
          >
            Finalizar Compra
          </button>

          <button
            type="button"
            className="btn-continuar"
            onClick={() => navigate("/pecas")}
          >
            Continuar Comprando
          </button>
        </div>
      </div>
    </div>
  );
}

export default Carrinho;