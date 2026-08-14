import React, { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { FiAlertCircle, FiCheckCircle, FiClock, FiRefreshCw } from "react-icons/fi";
import { sendJson } from "../config/api";
import { useCarrinho } from "../context/CarrinhoContext";
import "./Checkout.css";

function resolveVisualState(paymentStatus, pedidoStatus) {
  if (pedidoStatus === "pago" || paymentStatus === "approved") {
    return {
      icon: FiCheckCircle,
      className: "checkout-result-success",
      title: "Pagamento aprovado",
      description:
        "Seu pedido foi confirmado e ja esta registrado como pago no sistema.",
    };
  }

  if (["pending", "in_process", "in_mediation"].includes(paymentStatus)) {
    return {
      icon: FiClock,
      className: "checkout-result-pending",
      title: "Pagamento em analise",
      description:
        "O Mercado Pago ainda esta processando o pagamento. Voce pode acompanhar novamente em alguns instantes.",
    };
  }

  return {
    icon: FiAlertCircle,
    className: "checkout-result-error",
    title: "Pagamento nao concluido",
    description:
      "O pagamento nao foi aprovado. Voce pode gerar um novo link para tentar novamente.",
  };
}

function CheckoutRetorno() {
  const [searchParams] = useSearchParams();
  const { limparCarrinho } = useCarrinho();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retrying, setRetrying] = useState(false);
  const [result, setResult] = useState(null);

  const pedidoId = useMemo(
    () =>
      searchParams.get("pedido") ||
      searchParams.get("external_reference") ||
      "",
    [searchParams]
  );
  const paymentId = useMemo(
    () =>
      searchParams.get("payment_id") ||
      searchParams.get("collection_id") ||
      "",
    [searchParams]
  );
  const status = useMemo(
    () =>
      searchParams.get("status") ||
      searchParams.get("collection_status") ||
      "",
    [searchParams]
  );

  useEffect(() => {
    const confirmarRetorno = async () => {
      if (!pedidoId) {
        setError("Nao foi possivel identificar o pedido retornado pelo Mercado Pago.");
        setLoading(false);
        return;
      }

      try {
        const response = await sendJson("/pagamentos/mercado-pago/confirmar", "POST", {
          pedido_id: Number(pedidoId),
          payment_id: paymentId ? Number(paymentId) : null,
          status,
        });

        setResult(response);

        if (response?.pedido?.status === "pago" || response?.paymentStatus === "approved") {
          limparCarrinho();
          window.localStorage.removeItem("checkout_pedido_aberto");
        }
      } catch (err) {
        console.error("Erro ao confirmar retorno do Mercado Pago:", err);
        setError(err.message || "Nao foi possivel validar o status do pagamento.");
      } finally {
        setLoading(false);
      }
    };

    void confirmarRetorno();
  }, [limparCarrinho, paymentId, pedidoId, status]);

  const handleRetryPayment = async () => {
    if (!pedidoId) {
      return;
    }

    try {
      setRetrying(true);
      setError("");

      const response = await sendJson(
        `/pagamentos/mercado-pago/pedido/${pedidoId}/preference`,
        "POST",
        {
          frontend_url: window.location.origin,
        }
      );

      const initPoint = response?.init_point || response?.sandbox_init_point;

      if (!initPoint) {
        throw new Error("A API nao retornou um novo link de pagamento.");
      }

      window.location.assign(initPoint);
    } catch (err) {
      console.error("Erro ao gerar novo link do Mercado Pago:", err);
      setError(err.message || "Nao foi possivel gerar um novo link de pagamento.");
    } finally {
      setRetrying(false);
    }
  };

  if (loading) {
    return (
      <main className="checkout-page">
        <section className="checkout-shell checkout-loading">
          <p>Validando o retorno do Mercado Pago...</p>
        </section>
      </main>
    );
  }

  const paymentStatus = result?.paymentStatus || status || "desconhecido";
  const pedidoStatus = result?.pedido?.status || "pendente";
  const visualState = resolveVisualState(paymentStatus, pedidoStatus);
  const Icon = visualState.icon;

  return (
    <main className="checkout-page">
      <section className="checkout-shell">
        <div className={`checkout-result-card ${visualState.className}`}>
          <div className="checkout-result-icon">
            <Icon aria-hidden="true" />
          </div>

          <h1>{visualState.title}</h1>
          <p>{visualState.description}</p>

          <div className="checkout-result-meta">
            <span>Pedido: #{result?.pedido?.id_pedido || pedidoId || "--"}</span>
            <span>Status do pedido: {pedidoStatus}</span>
            <span>Status do pagamento: {paymentStatus}</span>
          </div>

          {error && <p className="checkout-feedback checkout-feedback-error">{error}</p>}

          <div className="checkout-result-actions">
            {pedidoStatus !== "pago" && (
              <button
                type="button"
                className="checkout-primary-button"
                onClick={handleRetryPayment}
                disabled={retrying}
              >
                <FiRefreshCw aria-hidden="true" />
                {retrying ? "Gerando novo link..." : "Tentar pagamento novamente"}
              </button>
            )}

            <Link to="/pecas" className="checkout-ghost-link">
              Continuar comprando
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

export default CheckoutRetorno;
