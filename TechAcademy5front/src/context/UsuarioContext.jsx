
import { createContext, useContext, useState } from "react";

/**
 * @typedef {import("../types").Cliente} Cliente
 */

/**
 * Estado interno de autenticação
 * @typedef {Object} AuthState
 * @property {Cliente | null} cliente
 * @property {string | null} token
 */

/**
 * Payload recebido no login
 * @typedef {Object} LoginPayload
 * @property {Cliente} cliente
 * @property {string} token
 */

/**
 * Valor disponível no contexto
 * @typedef {Object} UsuarioContextValue
 * @property {Cliente | null} cliente
 * @property {string | null} token
 * @property {boolean} isAuthenticated
 * @property {boolean} isAdmin
 * @property {(data: LoginPayload) => void} login
 * @property {() => void} logout
 * @property {(novosDados: Partial<Cliente>) => void} atualizarCliente
 */

/** @type {import("react").Context<UsuarioContextValue | null>} */
const UsuarioContext = createContext(null);

/** @returns {AuthState} */
function carregarDoStorage() {
  try {
    const cliente = localStorage.getItem("cliente");
    const token = localStorage.getItem("token");

    return {
      cliente: cliente ? JSON.parse(cliente) : null,
      token: token || null,
    };
  } catch {
    return {
      cliente: null,
      token: null,
    };
  }
}

/**
 * Provider do contexto
 * @param {{ children: import("react").ReactNode }} props
 */
export function UsuarioProvider({ children }) {
  /** @type {[AuthState, Function]} */
  const [{ cliente, token }, setAuth] = useState(carregarDoStorage);

  /** @param {LoginPayload} data */
  const login = (data) => {
    localStorage.setItem("token", data.token);
    localStorage.setItem("cliente", JSON.stringify(data.cliente));

    setAuth({
      cliente: data.cliente,
      token: data.token,
    });
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("cliente");

    setAuth({
      cliente: null,
      token: null,
    });
  };

  /** @param {Partial<Cliente>} novosDados */
  const atualizarCliente = (novosDados) => {
    if (!cliente) return;

    const clienteAtualizado = {
      ...cliente,
      ...novosDados,
    };

    localStorage.setItem("cliente", JSON.stringify(clienteAtualizado));

    setAuth((prev) => ({
      ...prev,
      cliente: clienteAtualizado,
    }));
  };

  /** @type {UsuarioContextValue} */
  const value = {
    cliente,
    token,

    isAuthenticated: !!token && !!cliente,

    isAdmin:
      cliente?.admin === true ||
      cliente?.admin === "true" ||
      cliente?.admin === 1,

    login,
    logout,
    atualizarCliente,
  };

  return (
    <UsuarioContext.Provider value={value}>
      {children}
    </UsuarioContext.Provider>
  );
}

/** Hook para usar o contexto */
export function useUsuario() {
  const context = useContext(UsuarioContext);

  if (!context) {
    throw new Error("useUsuario deve ser usado dentro de UsuarioProvider");
  }

  return context;
}

