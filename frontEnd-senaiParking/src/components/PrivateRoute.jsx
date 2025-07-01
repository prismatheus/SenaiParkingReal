// src/components/PrivateRoute.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';

/**
 * Componente PrivateRoute para proteger rotas.
 * Redireciona o usuário para a página de login se não estiver autenticado.
 *
 * @param {object} props - As propriedades do componente.
 * @param {React.ReactNode} props.children - Os componentes filhos (as rotas protegidas).
 * @returns {React.ReactNode} O componente filho se autenticado, ou um redirecionamento para o login.
 */
const PrivateRoute = ({ children }) => {
    // Verifica a existência do token de autenticação no localStorage.
    // Em um cenário de produção, seria ideal também verificar a validade (expiração) do token.
    const isAuthenticated = localStorage.getItem('authToken');

    // Se o usuário estiver autenticado, renderiza os componentes filhos.
    // Caso contrário, redireciona-o para a página de login.
    // O 'replace' garante que a página de login substitua a entrada atual no histórico,
    // impedindo que o usuário volte para a página protegida pelo botão "voltar" do navegador.
    return isAuthenticated ? children : <Navigate to="/login" replace />;
};

export default PrivateRoute;
