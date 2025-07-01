import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './register.css';
import logo from '../../assets/logo-senai.png';

const RegisterPage = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [type, setType] = useState('user'); // Default type to 'user' on frontend
    const [message, setMessage] = useState('');
    const navigate = useNavigate();

    const handleRegister = async () => {
        setMessage('');
        try {
            const response = await fetch('http://localhost:3000/api/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name, email, password, type }), // This sends the 'type' value from state
            });

            const data = await response.json();

            if (response.ok) {
                setMessage('Registration successful! Redirecting to login...'); // Updated message
                console.log('Registration successful:', data);
                // --- ALTERAÇÃO AQUI: Redireciona para /login ---
                setTimeout(() => navigate('/login'), 1500); 
            } else {
                setMessage(data.message || 'Registration failed. Please try again.');
                console.error('Registration failed:', data);
            }
        } catch (error) {
            setMessage('Network error. Could not connect to the server.');
            console.error('Error during registration:', error);
        }
    };

    return (
        <div className="body-register">
            <div className="register-container">
                <img src={logo} alt="Logo" className="logo-image" />
                {message && (
                    <div className={`message ${message.includes('successful') ? 'success' : 'error'}`}>
                        {message}
                    </div>
                )}
                <div className="input-button-wrapper">
                    <input type="text" placeholder="Usuário" className="register-input" value={name} onChange={(e) => setName(e.target.value)} />
                    <input type="email" placeholder="Email" className="register-input" value={email} onChange={(e) => setEmail(e.target.value)} />
                    <input type="password" placeholder="Senha" className="register-input" value={password} onChange={(e) => setPassword(e.target.value)} />
                    <select className="register-input" value={type} onChange={(e) => setType(e.target.value)}>
                        <option value="user">user</option>
                        <option value="admin">admin</option>
                    </select>
                    <button onClick={handleRegister} className="register-button">
                        Registrar
                    </button>
                </div>
            </div>
        </div>
    );
}

export default RegisterPage;