// src/pages/users/editUser.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './editUser.css'; // Estilos específicos para esta página
import logo from '../../assets/logo-senai.png'; // Caminho para o seu logo
import BackButton from '../../components/BackButton/BackButton.jsx';

const EditUserPage = () => {
    const [userData, setUserData] = useState(null); // Estado para as informações do usuário atual
    const [editingData, setEditingData] = useState({ name: '', email: '' }); // Estado para dados em edição
    const [message, setMessage] = useState(''); // Estado para mensagens de feedback
    const [isEditing, setIsEditing] = useState(false); // Estado para controlar o modo de edição
    const navigate = useNavigate();

    const API_BASE_URL = 'http://localhost:3000';

    // Efeito para carregar os dados do usuário do localStorage na montagem do componente.
    useEffect(() => {
        const storedUserData = localStorage.getItem('userData');
        if (storedUserData) {
            try {
                const user = JSON.parse(storedUserData);
                setUserData(user); // Define os dados do usuário logado
                // Preenche os campos de edição com os dados atuais do usuário
                setEditingData({
                    name: user.name || '',
                    email: user.email || ''
                });
            } catch (e) {
                console.error("Falha ao analisar dados do usuário do localStorage:", e);
                setMessage('Erro: Dados do usuário corrompidos. Por favor, faça login novamente.');
                // Em caso de dados corrompidos, redireciona para login
                localStorage.removeItem('userData');
                localStorage.removeItem('authToken');
                navigate('/login');
            }
        } else {
            // Se não houver dados no localStorage, o usuário não está logado
            setMessage('Você não está logado. Redirecionando para a página de login...');
            navigate('/login');
        }
    }, [navigate]); // 'navigate' como dependência para evitar avisos do ESLint

    /**
     * Lida com a mudança nos inputs de edição.
     * @param {Event} e - O evento de mudança do input.
     * @param {string} field - O nome do campo que está sendo editado ('name' ou 'email').
     */
    const handleInputChange = (e, field) => {
        setEditingData(prevData => ({
            ...prevData,
            [field]: e.target.value
        }));
    };

    /**
     * Alterna o modo de edição.
     * Se estiver em modo de edição, cancela as alterações e volta para o modo de visualização.
     * Se não estiver em modo de edição, entra no modo de edição.
     */
    const handleToggleEdit = () => {
        if (isEditing) {
            // Se estiver editando e cancelar, resetar os dados de edição para os dados originais
            setEditingData({
                name: userData.name || '',
                email: userData.email || ''
            });
            setMessage(''); // Limpa qualquer mensagem
        }
        setIsEditing(prev => !prev); // Alterna o estado de edição
    };

    /**
     * Envia as alterações do perfil para o backend.
     */
    const handleSaveProfile = async () => {
        setMessage(''); // Limpa mensagens anteriores

        if (!editingData.name || !editingData.email) {
            setMessage('Nome e Email são campos obrigatórios.');
            return;
        }

        try {
            const authToken = localStorage.getItem('authToken');
            if (!authToken) {
                setMessage('Autenticação necessária para atualizar o perfil.');
                navigate('/login');
                return;
            }

            // O ID do usuário deve vir do userData, que foi carregado do localStorage
            const userId = userData.id; 
            if (!userId) {
                setMessage('Erro: ID do usuário não encontrado. Faça login novamente.');
                navigate('/login');
                return;
            }

            const response = await fetch(`${API_BASE_URL}/api/edit-profile`, { // Endpoint especificado pelo usuário
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`,
                },
                body: JSON.stringify({ 
                    id: userId, // Envia o ID do usuário para o backend
                    name: editingData.name, 
                    email: editingData.email 
                    // Você pode adicionar outros campos como 'password' se quiser permitir a mudança aqui,
                    // mas requereria mais inputs e tratamento de segurança.
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido ao atualizar perfil.' }));
                throw new Error(errorData.error || `Falha ao atualizar perfil: Status ${response.status}`);
            }

            const updatedUser = await response.json(); // O backend deve retornar o usuário atualizado
            setMessage('Perfil atualizado com sucesso!');
            console.log('Perfil atualizado:', updatedUser);

            // Atualiza o localStorage com os novos dados do usuário
            localStorage.setItem('userData', JSON.stringify(updatedUser));
            setUserData(updatedUser); // Atualiza o estado local com os novos dados
            setIsEditing(false); // Sai do modo de edição

        } catch (err) {
            console.error('Erro ao atualizar perfil:', err);
            setMessage(`Erro ao atualizar perfil: ${err.message}. Verifique a conexão.`);
        }
    };

    // Exibe uma mensagem de carregamento ou redirecionamento enquanto os dados são carregados
    if (!userData) {
        return (
            <div className="body-edit-user">
                <div className="edit-user-header">
                    <img src={logo} alt="Logo SENAI" className="edit-user-logo" />
                    <BackButton />
                </div>
                <div className="edit-user-container">
                    <p>{message || "Carregando informações do usuário..."}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="body-edit-user">
            {/* Cabeçalho com Logo no canto superior direito */}
            <div className="edit-user-header">
                {/* A logo será posicionada à direita no CSS */}
                <img src={logo} alt="Logo SENAI" className="edit-user-logo" />
                <BackButton />
            </div>
            
            <div className="edit-user-container">
                <h2 className="edit-user-title">Editar Perfil</h2>

                {/* Caixa de Mensagem */}
                {message && (
                    <div className={`message-box ${message.includes('sucesso') ? 'success' : 'error'}`}>
                        {message}
                    </div>
                )}

                <div className="profile-info-group">
                    <p><strong>ID:</strong> {userData.id}</p>
                    <p><strong>Tipo:</strong> {userData.type}</p>

                    <div className="profile-field">
                        <label>Nome:</label>
                        {isEditing ? (
                            <input
                                type="text"
                                className="edit-user-input"
                                value={editingData.name}
                                onChange={(e) => handleInputChange(e, 'name')}
                            />
                        ) : (
                            <span className="profile-display-text">{userData.name || 'N/A'}</span>
                        )}
                    </div>

                    <div className="profile-field">
                        <label>Email:</label>
                        {isEditing ? (
                            <input
                                type="email"
                                className="edit-user-input"
                                value={editingData.email}
                                onChange={(e) => handleInputChange(e, 'email')}
                            />
                        ) : (
                            <span className="profile-display-text">{userData.email || 'N/A'}</span>
                        )}
                    </div>
                </div>

                <div className="edit-actions">
                    {isEditing ? (
                        <>
                            <button onClick={handleSaveProfile} className="edit-save-button">
                                Salvar
                            </button>
                            <button onClick={handleToggleEdit} className="edit-cancel-button">
                                Cancelar
                            </button>
                        </>
                    ) : (
                        <button onClick={handleToggleEdit} className="edit-profile-button">
                            Editar Perfil
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default EditUserPage;
