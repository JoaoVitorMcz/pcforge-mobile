import { BrowserRouter, Routes, Route } from "react-router-dom";
import { UsuarioProvider } from "./context/UsuarioContext";
import { CarrinhoProvider } from "./context/CarrinhoContext";

import Header from "./Componentes/header";
import Footer from "./Componentes/Footer";
import Home from "./Pages/Home";
import Pecas from "./Pages/Pecas";
import Perifericos from "./Pages/Perifericos";
import Suporte from "./Pages/Suporte";
import Login from "./Pages/Login";
import Cadastro from "./Pages/Cadastro";
import Carrinho from "./Pages/Carrinho";
import Admin from "./Pages/Admin";
import EditarPerfil from "./Pages/Editarperfil";
import Checkout from "./Pages/Checkout";
import CheckoutRetorno from "./Pages/CheckoutRetorno";

function App() {
  return (
    <UsuarioProvider>
      <CarrinhoProvider>
        <BrowserRouter>
          <Header />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/pecas" element={<Pecas />} />
            <Route path="/perifericos" element={<Perifericos />} />
            <Route path="/suporte" element={<Suporte />} />
            <Route path="/Login" element={<Login />} />
            <Route path="/cadastro" element={<Cadastro />} />
            <Route path="/carrinho" element={<Carrinho />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/checkout/retorno" element={<CheckoutRetorno />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/perfil/editar" element={<EditarPerfil />} />
          </Routes>
          <Footer />
        </BrowserRouter>
      </CarrinhoProvider>
    </UsuarioProvider>
  );
}

export default App;