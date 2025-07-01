import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './userCars.css';
import logo from '../../assets/logo-senai.png'; // Ajuste o caminho para o seu logo conforme necessário
import BackButton from '../../components/BackButton/BackButton.jsx'; // Importa o componente de botão de voltar

const UserCarsPage = () => {
    const [userCars, setUserCars] = useState([]);
    const [userId, setUserId] = useState(null); // Para armazenar o ID do usuário logado
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const API_BASE_URL = 'http://localhost:3000';

    // Efeito para obter o ID do usuário logado do localStorage
    useEffect(() => {
        const storedUserData = localStorage.getItem('userData');
        if (storedUserData) {
            try {
                const user = JSON.parse(storedUserData);
                if (user && user.id) {
                    setUserId(user.id);
                } else {
                    setError('Erro: ID do usuário logado não encontrado. Faça login novamente.');
                    // Opcionalmente redirecionar para o login se o ID estiver faltando
                    // navigate('/login');
                }
            } catch (e) {
                console.error("Falha ao analisar os dados do usuário do localStorage:", e);
                setError('Erro: Dados do usuário corrompidos. Faça login novamente.');
                // localStorage.removeItem('userData'); // Limpar dados corrompidos
                // navigate('/login');
            }
        } else {
            setError('Você não está logado. Por favor, faça login para ver seus carros.');
            // navigate('/login'); // Redirecionar para o login se não autenticado
        }
    }, []);

    // Efeito para buscar os carros do usuário assim que o userId estiver disponível
    useEffect(() => {
        const fetchUserCars = async () => {
            if (!userId) {
                setLoading(false);
                return;
            }

            setLoading(true);
            setError('');
            try {
                const authToken = localStorage.getItem('authToken');
                if (!authToken) {
                    setError('Autenticação necessária para carregar seus carros.');
                    setLoading(false);
                    return;
                }

                // Faz a chamada da API para obter os carros do usuário
                const response = await fetch(`${API_BASE_URL}/api/cars/user`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${authToken}`,
                    },
                });

                console.log('[fetchUserCars] Resposta bruta:', response);

                if (!response.ok) {
                    const contentType = response.headers.get("content-type");
                    if (contentType && contentType.indexOf("application/json") !== -1) {
                        const errorData = await response.json();
                        throw new Error(errorData.error || `Erro HTTP! Status: ${response.status}`);
                    } else {
                        const errorText = await response.text();
                        console.error("Resposta de erro não-JSON do servidor (ao buscar carros do usuário):", errorText);
                        throw new Error(`O servidor respondeu com conteúdo não-JSON (Status: ${response.status}). Por favor, verifique a rota da API.`);
                    }
                }

                const data = await response.json();
                console.log('Carros do usuário recebidos do backend:', data);
                setUserCars(data);

            } catch (err) {
                console.error('Erro ao carregar carros do usuário:', err);
                setError(`Erro ao carregar seus carros: ${err.message}. Verifique se você está logado e o servidor está online.`);
                setUserCars([]); // Limpa os carros em caso de erro
            } finally {
                setLoading(false);
            }
        };

        fetchUserCars();

        // Opcional: Configura um intervalo para atualizar os dados periodicamente, se necessário
        // const intervalId = setInterval(fetchUserCars, 15000); // Atualiza a cada 15 segundos
        // return () => clearInterval(intervalId); // Limpa o intervalo ao desmontar

    }, [userId]); // Executa este efeito novamente quando o userId muda

    // Função para lidar com o clique no botão Editar
    const handleEditCar = (car) => {
        // Armazena o objeto completo do carro no localStorage para a CarRegisterPage
        localStorage.setItem('editingCar', JSON.stringify(car));
        // Navega para a página de registro de carro
        navigate('/car/register');
    };

    return (
        <div className="body-user-cars">
            {/* Cabeçalho com Logo */}
            <div className="user-cars-header">
                <img src={logo} alt="Logo SENAI" className="user-cars-logo" />
                <BackButton /> {/* Botão de voltar */}
            </div>

            <div className="user-cars-container">
                <h2 className="user-cars-title">Seus Carros Registrados</h2>

                {error && (
                    <div className="message-box error">
                        {error}
                    </div>
                )}

                {loading ? (
                    <p>Carregando seus carros...</p>
                ) : userCars.length > 0 ? (
                    <div className="car-list">
                        {userCars.map((car) => (
                            <div key={car.id} className="car-list-item">
                                <p><strong>Fabricante:</strong> {car.manufacturer}</p>
                                <p><strong>Modelo:</strong> {car.model}</p>
                                <p><strong>Ano:</strong> {car.year}</p>
                                <p><strong>Placa:</strong> {car.plate}</p>
                                <p><strong>Cor:</strong> {car.color}</p>
                                {/* Botão Editar */}
                                <div className="car-actions">
                                    <button
                                        onClick={() => handleEditCar(car)}
                                        className="action-button edit"
                                    >
                                        Editar
                                    </button>
                                    {/* Adicionar outros botões de ação aqui se necessário (ex: Deletar) */}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p>Você ainda não tem carros registrados.</p>
                )}
            </div>
        </div>
    );
};

export default UserCarsPage;
