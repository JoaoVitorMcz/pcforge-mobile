import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Banner.css";

function Banner() {
  const navigate = useNavigate();

  const banners = [
    {
      imagem: "/banner1.png",
      titulo: "DOMINE A PR\u00d3XIMA GERA\u00c7\u00c3O",
      descricao: "Performance extrema para entusiastas e criadores.",
    },
    {
      imagem: "/banner2.png",
      titulo: "MONTE O SETUP DOS SEUS SONHOS",
      descricao: "As melhores pe\u00e7as para o seu PC gamer.",
      botao: "Ver Peças",
    },
    {
      imagem: "/banner3.png",
      titulo: "PERIF\u00c9RICOS PROFISSIONAIS",
      descricao: "Teclados, mouses e headsets de alto desempenho.",
      botao: "Ver Perif\u00e9ricos",
    },
  ];

  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % banners.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [banners.length]);

  const nextSlide = () => {
    setIndex((index + 1) % banners.length);
  };

  const prevSlide = () => {
    setIndex((index - 1 + banners.length) % banners.length);
  };

  const handleButtonClick = () => {
    if (index === 1) {
      navigate("/pecas");
    } else if (index === 2) {
      navigate("/perifericos");
    }
  };

  return (
    <div className="banner">
      <img src={banners[index].imagem} alt="banner" />

      <div className="banner-content">
        <h1>{banners[index].titulo}</h1>
        <p>{banners[index].descricao}</p>
        {banners[index].botao && (
          <button onClick={handleButtonClick}>{banners[index].botao}</button>
        )}
      </div>

      <button className="prev" onClick={prevSlide}>
        ❮
      </button>

      <button className="next" onClick={nextSlide}>
        ❯
      </button>

      <div className="dots">
        {banners.map((_, i) => (
          <span
            key={i}
            className={index === i ? "dot active" : "dot"}
            onClick={() => setIndex(i)}
          ></span>
        ))}
      </div>
    </div>
  );
}

export default Banner;
