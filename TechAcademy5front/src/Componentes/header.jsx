import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FiChevronDown, FiShoppingCart, FiUser, FiEdit2, FiLogOut, FiMenu, FiX } from "react-icons/fi";
import { useCarrinho } from "../context/CarrinhoContext";
import "./Header.css";

function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const { itens, recarregarCarrinho } = useCarrinho();
  const [clienteNome, setClienteNome] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [menuAberto, setMenuAberto] = useState(false);
  const [navAberto, setNavAberto] = useState(false);

  useEffect(() => {
    try {
      const clienteSalvo = window.localStorage.getItem("cliente");
      if (!clienteSalvo) { setClienteNome(""); setIsAdmin(false); return; }
      const cliente = JSON.parse(clienteSalvo);
      setClienteNome(cliente?.nome || "");
      setIsAdmin(cliente?.admin === true || cliente?.admin === "true");
    } catch {
      setClienteNome(""); setIsAdmin(false);
    }
  }, [location.pathname]);

  useEffect(() => {
    setMenuAberto(false);
    setNavAberto(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!menuAberto) return;
    const fechar = (e) => {
      if (!e.target.closest(".user-menu")) setMenuAberto(false);
    };
    document.addEventListener("mousedown", fechar);
    return () => document.removeEventListener("mousedown", fechar);
  }, [menuAberto]);

  const handleLogout = () => {
    window.localStorage.removeItem("token");
    window.localStorage.removeItem("cliente");
    setClienteNome("");
    setIsAdmin(false);
    setMenuAberto(false);
    setNavAberto(false);
    recarregarCarrinho();
    navigate("/");
  };

  return (
    <header className="header">
      <div className="logo">
        <img src="/logoheader.png" alt="Logo" />
      </div>

      {/* Botão menu mobile */}
      <button
        type="button"
        className="menu-toggle"
        onClick={() => setNavAberto((prev) => !prev)}
        aria-label="Menu"
      >
        {navAberto ? <FiX /> : <FiMenu />}
      </button>

      <nav className={`nav ${navAberto ? "aberto" : ""}`}>
        <Link to="/">HOME</Link>
        <Link to="/pecas">PEÇAS</Link>
        <Link to="/perifericos">PERIFÉRICOS</Link>
        <Link to="/suporte">SUPORTE</Link>
        {isAdmin && <Link to="/admin">ADMIN</Link>}
      </nav>

      <div className="actions">
        {clienteNome ? (
          <div className="user-menu">
            <button
              type="button"
              className="login login-button"
              onClick={() => setMenuAberto((aberto) => !aberto)}
            >
              <FiUser />
              <span>Olá, {clienteNome}</span>
              <FiChevronDown className={`chevron ${menuAberto ? "open" : ""}`} />
            </button>

            {menuAberto && (
              <div className="user-dropdown">
                <Link to="/perfil/editar" className="dropdown-item" onClick={() => setMenuAberto(false)}>
                  <FiEdit2 size={14} />
                  <span>Editar perfil</span>
                </Link>
                <div className="dropdown-divider" />
                <button type="button" className="logout-button" onClick={handleLogout}>
                  <FiLogOut size={14} />
                  <span>Sair</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <Link to="/Login" className="login">
            <FiUser />
          </Link>
        )}

        <Link to="/carrinho" className="cart">
          <FiShoppingCart />
          {itens.length > 0 && <span className="cart-badge">{itens.length}</span>}
        </Link>
      </div>
    </header>
  );
}

export default Header;