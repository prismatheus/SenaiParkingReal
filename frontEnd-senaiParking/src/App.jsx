import React, { useState } from "react"; // 'useState' mantido, mas 'count' não é usado diretamente no contexto do roteamento.
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

// Importe suas páginas
import LoginPage from "./pages/login/login.jsx";
import RegisterPage from "./pages/register/register.jsx";
import HomePage from "./pages/home/home.jsx";
import ParkingPage from "./pages/parking/parking.jsx";
import ParkingRegisterPage from "./pages/parking/parkingRegister.jsx";
import CarRegisterPage from "./pages/car/carRegister.jsx";
import UserCarsPage from "./pages/car/userCars.jsx";
import AdminUsersPage from "./pages/users/adminUsers.jsx";
import EditUserPage from "./pages/users/editUser.jsx";

// Importe o componente PrivateRoute
import PrivateRoute from "./components/PrivateRoute.jsx"; // Caminho para o seu PrivateRoute.jsx

// Importe os estilos globais da aplicação
import "./App.css";

/**
 * Componente principal da aplicação que define as rotas.
 * Implementa rotas protegidas que exigem autenti cação.
 */
function App() {
  // O estado 'count' não é usado na lógica de roteamento e pode ser removido
  // se não for utilizado em outras partes do componente App.
  const [count, setCount] = useState(0);

  return (
    <Router>
      {/*
        A propriedade 'basename="/parking"' deve ser utilizada no BrowserRouter, não no Routes.
        Se seu aplicativo é implantado em um subdiretório '/parking', isso é crucial.
        A propriedade 'className="router-body"' em <Routes> é sintaticamente incorreta em React Router v6.
        A classe deve ser aplicada a um elemento DOM real que envolva o conteúdo, não diretamente ao componente Routes.
        Será removido ou ignorado pelo React Router.
      */}
      <Routes>
        {/* Rota raiz: Redireciona para a página de login por padrão. */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Rotas Públicas: Acessíveis por qualquer usuário, mesmo sem login.
            Estas rotas NÃO são envolvidas pelo PrivateRoute.
        */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Rotas Protegidas: Exigem que o usuário esteja logado.
            Cada componente de página é envolvido pelo PrivateRoute.
            Se o usuário tentar acessar estas rotas sem um token, será redirecionado para /login.
        */}
        <Route
          path="/home"
          element={
            <PrivateRoute>
              <HomePage />
            </PrivateRoute>
          }
        />
        <Route
          path="/parking"
          element={
            <PrivateRoute>
              <ParkingPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/car/register"
          element={
            <PrivateRoute>
              <CarRegisterPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/parkingRegister"
          element={
            <PrivateRoute>
              <ParkingRegisterPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/car"
          element={
            <PrivateRoute>
              <UserCarsPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/viewAllUsers"
          element={
            <PrivateRoute>
              <AdminUsersPage />
            </PrivateRoute>
          }
        />

        <Route
          path="/editUser"
          element={
            <PrivateRoute>
              <EditUserPage />
            </PrivateRoute>
          }
        />

        {/* Adicione outras rotas protegidas aqui da mesma forma */}
      </Routes>
    </Router>
  );
}

export default App;
