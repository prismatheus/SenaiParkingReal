// src/components/BackButton.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import './BackButton.css'; // Estilos específicos para o botão de voltar
import exitIcon from '../../assets/homeIcon.png'; // Importa a imagem do ícone de seta para trás

/**
 * Componente reutilizável para um botão de "Voltar".
 * Ao ser clicado, navega para a página anterior no histórico do navegador.
 * Usa uma imagem como ícone.
 *
 * @returns {JSX.Element} Um elemento de botão configurado para voltar.
 */
const BackButton = () => {
    const navigate = useNavigate(); // Hook do React Router para navegação

    /**
     * Lida com o evento de clique, navegando para a página anterior.
     */
    const handleGoBack = () => {
        navigate(-1); // Navega um passo para trás no histórico
    };

    return (
        <button onClick={handleGoBack} className="back-button" title="Voltar para a página anterior">
            {/* O ícone da seta para trás */}
            <img src={exitIcon} alt="Voltar" className="back-icon" />
        </button>
    );
};

export default BackButton;
