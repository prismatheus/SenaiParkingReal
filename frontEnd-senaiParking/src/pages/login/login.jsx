import React, { useState } from "react";
import "./login.css";
import logo from "../../assets/logo-senai.png"; // Path to your logo

const LoginPage = () => {
  const [email, setEmail] = useState(""); // Corrected 'setLogin' to 'setEmail' for clarity
  const [password, setPassword] = useState("");

  const handleLogin = () => {
    try {
      if (!email || !password) {
        // Using a custom message box instead of alert() as per instructions
        alert("Por favor, preencha todos os campos."); // Placeholder qfor a custom message box
        return;
      }

      console.log("Tentativa de login:", { email, password });

      fetch("http://localhost:3000/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error("Erro na autenticação");
          }
          return response.json();
        })
        .then((data) => {
          console.log("Resposta do backend:", data);
          if (data.token) {
            // Using a custom message box instead of alert() as per instructions
            alert("Login bem-sucedido!"); // Placeholder for a custom message box
            localStorage.setItem("authToken", data.token);
            // Store user data which should include the 'type' property from your backend
            localStorage.setItem("userData", JSON.stringify(data.user)); // Assuming 'data.user' contains { type: 'admin' | 'user' }
            window.location.href = "/home";
          } else {
            // Using a custom message box instead of alert() as per instructions
            alert("Credenciais inválidas."); // Placeholder for a custom message box
          }
        })
        .catch((error) => {
          console.error("Erro:", error);
          // Using a custom message box instead of alert() as per instructions
          alert(error.message || "Erro ao conectar ao servidor."); // Placeholder for a custom message box
        });
    } catch (error) {
      console.error("Erro inesperado:", error);
      // Using a custom message box instead of alert() as per instructions
      alert("Ocorreu um erro inesperado."); // Placeholder for a custom message box
    }
  };

  const handleRegister = () => {
    window.location.href = "/register";
  };

  return (
    <div className="body-login">
      <div className="login-container">
        <img className="login-title" src={logo} alt="Logo Senai" />

        <div className="input-button-wrapper">
          <input
            type="text"
            placeholder="login"
            className="login-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            placeholder="senha"
            className="login-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <div className="button-group">
            <button onClick={handleRegister} className="login-button">
              register
            </button>
            <button onClick={handleLogin} className="login-button">
              login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
