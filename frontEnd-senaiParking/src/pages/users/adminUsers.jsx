import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './adminUsers.css';
import logo from '../../assets/logo-senai.png'; // Adjust path to your logo
import BackButton from '../../components/BackButton/BackButton.jsx';
const AdminUsersPage = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [loggedInUser, setLoggedInUser] = useState(null);
    const [expandedUserCars, setExpandedUserCars] = useState({}); // State to manage dropdown for each user {userId: true/false}
    
    // New states for inline editing
    const [editingUserId, setEditingUserId] = useState(null); // ID of the user being edited
    const [editUserData, setEditUserData] = useState({ name: '', email: '', type: '' }); // Temporary data for the editing user

    const navigate = useNavigate();

    const API_BASE_URL = 'http://localhost:3000';

    // Fetch logged-in user details and check for admin role
    useEffect(() => {
        const storedUserData = localStorage.getItem('userData');
        if (storedUserData) {
            try {
                const user = JSON.parse(storedUserData);
                setLoggedInUser(user);
                if (user.type !== 'admin') {
                    setError('Acesso negado. Apenas administradores podem visualizar esta página.');
                    setLoading(false);
                }
            } catch (e) {
                console.error("Falha ao analisar os dados do usuário do localStorage:", e);
                setError('Erro: Dados do usuário corrompidos. Faça login novamente.');
                setLoading(false);
            }
        } else {
            setError('Você não está logado. Por favor, faça login para acessar esta página.');
            setLoading(false);
        }
    }, []);

    // Fetch all users
    useEffect(() => {
        const fetchUsers = async () => {
            if (!loggedInUser || loggedInUser.type !== 'admin') {
                return; // Do not fetch if not admin or user data not loaded yet
            }

            setLoading(true);
            setError('');
            try {
                const authToken = localStorage.getItem('authToken');
                if (!authToken) {
                    setError('Autenticação necessária para carregar usuários.');
                    setLoading(false);
                    return;
                }

                const response = await fetch(`${API_BASE_URL}/api/users`, { // Assuming this endpoint for all users
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${authToken}`,
                    },
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido.' }));
                    throw new Error(errorData.error || `Erro HTTP! Status: ${response.status}`);
                }

                const data = await response.json();
                // Initialize each user with an empty cars array
                const usersWithCars = data.map(user => ({ ...user, cars: [] }));
                setUsers(usersWithCars);

            } catch (err) {
                console.error('Erro ao carregar usuários:', err);
                setError(`Erro ao carregar usuários: ${err.message}.`);
            } finally {
                setLoading(false);
            }
        };

        if (loggedInUser) { // Only fetch if loggedInUser is set (and checked for admin role)
            fetchUsers();
        }
    }, [loggedInUser]); // Re-run when loggedInUser changes

    // Fetch cars for a specific user when their dropdown is expanded
    const toggleUserCarsDropdown = async (userId, userIndex) => {
        setExpandedUserCars(prevState => ({
            ...prevState,
            [userId]: !prevState[userId]
        }));

        // If expanding and cars are not already loaded for this user
        if (!expandedUserCars[userId] && users[userIndex] && users[userIndex].cars.length === 0) {
            try {
                const authToken = localStorage.getItem('authToken');
                if (!authToken) {
                    setError('Autenticação necessária para carregar carros do usuário.');
                    return;
                }

                // A chamada da API está correta para a nova rota no backend: /api/cars/user/:id
                const response = await fetch(`${API_BASE_URL}/api/cars/user/${userId}`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${authToken}`,
                    },
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({ error: 'Erro ao buscar carros.' }));
                    throw new Error(errorData.error || `Erro ao carregar carros do usuário ${userId}: Status ${response.status}`);
                }

                const userCarsData = await response.json();
                // Update the specific user's cars array in the 'users' state
                setUsers(prevUsers => {
                    const updatedUsers = [...prevUsers];
                    updatedUsers[userIndex].cars = userCarsData;
                    return updatedUsers;
                });

            } catch (err) {
                console.error(`Erro ao carregar carros para o usuário ${userId}:`, err);
                setError(`Erro ao carregar carros para o usuário: ${err.message}`);
                // Optionally collapse dropdown if there's an error loading cars
                setExpandedUserCars(prevState => ({ ...prevState, [userId]: false }));
            }
        }
    };

    // --- New/Modified functions for inline editing ---

    // Function to toggle edit mode for a user
    const handleEditToggle = (user) => {
        if (editingUserId === user.id) {
            // If already editing this user, cancel editing
            setEditingUserId(null);
            setEditUserData({ name: '', email: '', type: '' });
        } else {
            // Start editing this user, pre-fill temporary state
            setEditingUserId(user.id);
            // Ensure properties exist, provide fallbacks
            setEditUserData({
                name: user.name || user.username || '', // Adjust based on your user model's actual name field
                email: user.email || '',
                type: user.type || '',
            });
        }
    };

    // Function to handle input changes for the user being edited
    const handleUserInputChange = (e, field) => {
        setEditUserData({
            ...editUserData,
            [field]: e.target.value
        });
    };

    // Function to save changes to a user
    const handleSaveUser = async (userIdToUpdate) => {
        setError(''); // Clear previous errors
        try {
            const authToken = localStorage.getItem('authToken');
            if (!authToken) {
                setError('Autenticação necessária para atualizar usuário.');
                return;
            }

            const response = await fetch(`${API_BASE_URL}/api/users/${userIdToUpdate}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`,
                },
                body: JSON.stringify(editUserData), // Send the temporary edited data
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido ao atualizar.' }));
                throw new Error(errorData.error || `Falha ao atualizar usuário: Status ${response.status}`);
            }

            // Update the user in the main 'users' state
            setUsers(prevUsers =>
                prevUsers.map(user =>
                    user.id === userIdToUpdate ? { ...user, ...editUserData } : user
                )
            );
            setEditingUserId(null); // Exit edit mode
            setEditUserData({ name: '', email: '', type: '' }); // Clear temporary data
            setError('Usuário atualizado com sucesso!'); // Use error state for general messages here
        } catch (err) {
            console.error('Erro ao atualizar usuário:', err);
            setError(`Erro ao atualizar usuário: ${err.message}`);
        }
    };

    // Handle Delete User
    const handleDeleteUser = async (userIdToDelete) => {
        if (!window.confirm('Tem certeza que deseja deletar este usuário? Esta ação é irreversível.')) {
            return;
        }

        setError('');
        try {
            const authToken = localStorage.getItem('authToken');
            if (!authToken) {
                setError('Autenticação necessária para deletar usuário.');
                return;
            }

            const response = await fetch(`${API_BASE_URL}/api/users/${userIdToDelete}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                },
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido ao deletar.' }));
                throw new Error(errorData.error || `Falha ao deletar usuário: Status ${response.status}`);
            }

            // Remove the deleted user from the state
            setUsers(prevUsers => prevUsers.filter(user => user.id !== userIdToDelete));
            setError('Usuário deletado com sucesso!'); // Use error state for general messages here
        } catch (err) {
            console.error('Erro ao deletar usuário:', err);
            setError(`Erro ao deletar usuário: ${err.message}`);
        }
    };


    if (loading) {
        return (
            <div className="body-admin-users">
                <div className="admin-users-header">
                    <img src={logo} alt="Logo SENAI" className="admin-users-logo" />
                    <BackButton /> 
                </div>
                <div className="admin-users-container">
                    <p>Carregando dados...</p>
                </div>
            </div>
        );
    }

    if (error && (!loggedInUser || loggedInUser.type !== 'admin')) { // Check if error is due to access denial
        return (
            
            <div className="body-admin-users">
                <div className="admin-users-header">
                    <img src={logo} alt="Logo SENAI" className="admin-users-logo" />
                    <BackButton /> 
                </div>
                <div className="admin-users-container">
                    <h2 className="admin-users-title">Acesso Negado</h2>
                    <div className="message-box error">
                        {error}
                    </div>
                </div>
            </div>
        );
    }
    
    // If loaded but no users found AND no error (e.g., initial fetch was empty)
    if (!loading && users.length === 0 && !error) {
        return (
            <div className="body-admin-users">
                <div className="admin-users-header">
                    <img src={logo} alt="Logo SENAI" className="admin-users-logo" />
                    <BackButton /> 
                </div>
                <div className="admin-users-container">
                    <h2 className="admin-users-title">Administração de Usuários</h2>
                    <p>Nenhum usuário encontrado.</p>
                </div>
            </div>
        );
    }


    return (
        <div className="body-admin-users">
            {/* Header com Logo */}
            <div className="admin-users-header">
                <img src={logo} alt="Logo SENAI" className="admin-users-logo" />
                <BackButton /> 
            </div>

            <div className="admin-users-container">
                <h2 className="admin-users-title">Administração de Usuários</h2>

                {/* Exibe mensagens de erro ou sucesso geral */}
                {error && (
                    <div className="message-box error">
                        {error}
                    </div>
                )}

                <div className="user-list">
                    {users.length > 0 ? ( // Check if there are users before mapping
                        users.map((user, index) => (
                            <div key={user.id} className={`user-list-item ${user.type === 'admin' ? 'admin' : ''}`}>
                                <div className="user-details">
                                    <div className="user-info">
                                        <p><strong>ID:</strong> {user.id}</p>
                                        {/* Name Field */}
                                        <p>
                                            <strong>Nome:</strong>{' '}
                                            {editingUserId === user.id ? (
                                                <input
                                                    type="text"
                                                    className="editable-input"
                                                    value={editUserData.name}
                                                    onChange={(e) => handleUserInputChange(e, 'name')}
                                                />
                                            ) : (
                                                user.name || user.username || 'N/A'
                                            )}
                                        </p>
                                        {/* Email Field */}
                                        <p>
                                            <strong>Email:</strong>{' '}
                                            {editingUserId === user.id ? (
                                                <input
                                                    type="email"
                                                    className="editable-input"
                                                    value={editUserData.email}
                                                    onChange={(e) => handleUserInputChange(e, 'email')}
                                                />
                                            ) : (
                                                user.email || 'N/A'
                                            )}
                                        </p>
                                        {/* Type Field (e.g., dropdown for 'admin'/'user') */}
                                        <p>
                                            <strong>Tipo:</strong>{' '}
                                            {editingUserId === user.id ? (
                                                <select
                                                    className="editable-input"
                                                    value={editUserData.type}
                                                    onChange={(e) => handleUserInputChange(e, 'type')}
                                                >
                                                    <option value="user">user</option>
                                                    <option value="admin">admin</option>
                                                </select>
                                            ) : (
                                                user.type || 'N/A'
                                            )}
                                        </p>
                                    </div>
                                    <button
                                        className={`dropdown-toggle-button ${expandedUserCars[user.id] ? 'expanded' : ''}`}
                                        onClick={() => toggleUserCarsDropdown(user.id, index)}
                                        title={expandedUserCars[user.id] ? 'Esconder Carros' : 'Mostrar Carros'}
                                    >
                                        &#9654; {/* Right arrow HTML entity */}
                                    </button>
                                </div>

                                {expandedUserCars[user.id] && (
                                    <div className="user-cars-dropdown">
                                        <h4>Carros Registrados:</h4>
                                        {user.cars && user.cars.length > 0 ? (
                                            user.cars.map(car => (
                                                <div key={car.id} className="dropdown-car-item">
                                                    <p><strong>Modelo:</strong> {car.model}</p>
                                                    <p><strong>Cor:</strong> {car.color}</p>
                                                    <p><strong>Placa:</strong> {car.plate}</p>
                                                </div>
                                            ))
                                        ) : (
                                            <p>Nenhum carro registrado.</p>
                                        )}
                                    </div>
                                )}

                                <div className="user-actions">
                                    {editingUserId === user.id ? (
                                        <>
                                            <button
                                                onClick={() => handleSaveUser(user.id)}
                                                className="action-button save"
                                            >
                                                Salvar
                                            </button>
                                            <button
                                                onClick={() => handleEditToggle(user)} // Use toggle to cancel
                                                className="action-button cancel"
                                            >
                                                Cancelar
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <button
                                                onClick={() => handleEditToggle(user)}
                                                className="action-button edit"
                                            >
                                                Editar
                                            </button>
                                            <button
                                                onClick={() => handleDeleteUser(user.id)}
                                                className="action-button delete"
                                            >
                                                Deletar
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        ))
                    ) : ( // This closing part of the ternary was simplified for better readability
                        // This block will now only show if users.length is 0 AND no initial error
                        <p>Nenhum usuário encontrado.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminUsersPage;
