import React, { useState, useEffect } from 'react';
import './parkingRegister.css';
import logo from '../../assets/logo-senai.png'; // Ajuste o caminho para o seu logo conforme necessário
import BackButton from '../../components/BackButton/BackButton.jsx'; // Importa o componente de botão de voltar

const ParkingRegisterPage = () => {
    const [userIdInput, setUserIdInput] = useState('');
    const [carIdInput, setCarIdInput] = useState('');
    // Estado para armazenar registros enriquecidos com detalhes de carro e usuário
    const [parkingRecords, setParkingRecords] = useState([]);
    const [message, setMessage] = useState(''); // Para mensagens de sucesso/erro do registro
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(''); // Para erros ao buscar a lista

    const API_BASE_URL = 'http://localhost:3000';

    // Função auxiliar para buscar detalhes de um carro por ID
    const fetchCarDetails = async (carId, authToken) => {
        console.log(`[fetchCarDetails] Buscando detalhes para Carro ID: ${carId}`); // DEBUG: ID do carro
        try {
            const response = await fetch(`${API_BASE_URL}/api/cars/${carId}`, {
                headers: { 'Authorization': `Bearer ${authToken}` }
            });
            console.log(`[fetchCarDetails] Resposta para Carro ID ${carId}:`, response); // DEBUG: Resposta HTTP

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido ao buscar carro.' }));
                throw new Error(errorData.error || `Falha ao buscar detalhes do carro ${carId}: Status ${response.status}`);
            }
            const data = await response.json();
            console.log(`[fetchCarDetails] Dados recebidos para Carro ID ${carId}:`, data); // DEBUG: Dados JSON

            // Mapeia nomes de propriedades do backend (model, color) para o que o frontend espera (modelo, cor)
            return {
                id: data.id,
                modelo: data.model, // Corrigido: Usa data.model do backend
                cor: data.color     // Corrigido: Usa data.color do backend
            };
        } catch (err) {
            console.error(`[fetchCarDetails] Erro ao buscar detalhes do carro ${carId}:`, err); // DEBUG: Erro detalhado
            return { modelo: 'Desconhecido', cor: 'Desconhecida' }; // Retorna valores padrão em caso de erro
        }
    };

    // Função auxiliar para buscar detalhes de um usuário por ID
    const fetchUserDetails = async (userId, authToken) => {
        console.log(`[fetchUserDetails] Buscando detalhes para Usuário ID: ${userId}`); // DEBUG: ID do usuário
        try {
            const response = await fetch(`${API_BASE_URL}/api/users/${userId}`, {
                headers: { 'Authorization': `Bearer ${authToken}` }
            });
            console.log(`[fetchUserDetails] Resposta para Usuário ID ${userId}:`, response); // DEBUG: Resposta HTTP

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido ao buscar usuário.' }));
                throw new Error(errorData.error || `Falha ao buscar detalhes do usuário ${userId}: Status ${response.status}`);
            }
            const data = await response.json();
            console.log(`[fetchUserDetails] Dados recebidos para Usuário ID ${userId}:`, data); // DEBUG: Dados JSON

            // Assumindo que o modelo de usuário pode ter 'name' ou 'username' para o campo de nome
            return {
                id: data.id,
                nome: data.name || data.username || 'Usuário Desconhecido' // Tenta 'name', depois 'username', depois fallback
            };
        } catch (err) {
            console.error(`[fetchUserDetails] Erro ao buscar detalhes do usuário ${userId}:`, err); // DEBUG: Erro detalhado
            return { nome: 'Usuário Desconhecido' }; // Retorna valor padrão em caso de erro
        }
    };

    // Função principal para buscar os registros de estacionamento e enriquecê-los
    const fetchParkingRecords = async () => {
        setLoading(true);
        setError('');
        try {
            const authToken = localStorage.getItem('authToken');
            if (!authToken) {
                setError('Autenticação necessária para carregar registros.');
                setLoading(false);
                return;
            }

            // 1. Busca os registros de garagem
            const recordsResponse = await fetch(`${API_BASE_URL}/api/garage/records`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`,
                },
            });

            if (!recordsResponse.ok) {
                const contentType = recordsResponse.headers.get("content-type");
                if (contentType && contentType.indexOf("application/json") !== -1) {
                    const errorData = await recordsResponse.json();
                    throw new Error(errorData.error || `Erro HTTP! Status: ${recordsResponse.status}`);
                } else {
                    const errorText = await recordsResponse.text();
                    console.error("Resposta de erro não-JSON do servidor (ao buscar registros):", errorText);
                    throw new Error(`O servidor respondeu com conteúdo não-JSON (Status: ${recordsResponse.status}). Por favor, verifique a rota da API.`);
                }
            }

            const rawRecords = await recordsResponse.json();
            console.log('Dados brutos recebidos do backend para registros:', rawRecords); // DEBUG: Dados brutos

            // 2. Coleta IDs únicos para evitar requisições duplicadas
            const uniqueCarIds = [...new Set(rawRecords.map(record => record.carId))];
            const uniqueUserIds = [...new Set(rawRecords.map(record => record.userId))];

            // 3. Busca detalhes de todos os carros e usuários em paralelo
            const carDetailsPromises = uniqueCarIds.map(id => fetchCarDetails(id, authToken));
            const userDetailsPromises = uniqueUserIds.map(id => fetchUserDetails(id, authToken));

            const allCarDetails = await Promise.all(carDetailsPromises);
            const allUserDetails = await Promise.all(userDetailsPromises);

            // 4. Cria mapas para acesso rápido aos detalhes
            const carMap = new Map(allCarDetails.map(car => [car.id, car]));
            const userMap = new Map(allUserDetails.map(user => [user.id, user]));

            // 5. Enriquecce os registros com os detalhes
            const enrichedRecords = rawRecords.map(record => ({
                ...record,
                carDetails: carMap.get(record.carId) || { modelo: 'Desconhecido', cor: 'Desconhecida' },
                userDetails: userMap.get(record.userId) || { nome: 'Usuário Desconhecido' },
            }));

            setParkingRecords(enrichedRecords);

        } catch (err) {
            console.error('Erro ao buscar registros de estacionamento:', err);
            setError(`Erro ao carregar registros: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    // Função para lidar com o registro (entrada ou saída)
    const handleRegisterAction = async (type) => {
        setMessage(''); // Limpa mensagens anteriores
        if (!userIdInput || !carIdInput) {
            setMessage('Por favor, preencha o ID do Usuário e o ID do Carro.');
            return;
        }

        try {
            const authToken = localStorage.getItem('authToken');
            if (!authToken) {
                setMessage('Autenticação necessária para registrar.');
                return;
            }

            const payload = { userId: userIdInput, carId: carIdInput };
            const endpoint = type === 'entry' ? '/api/garage/entry' : '/api/garage/exit';

            const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`,
                },
                body: JSON.stringify(payload),
            });

            console.log(`[handleRegisterAction] Resposta para registro de ${type}:`, response); // DEBUG: Resposta HTTP

            if (!response.ok) {
                const contentType = response.headers.get("content-type");
                let errorDetails = `Falha no registro de ${type === 'entry' ? 'entrada' : 'saída'}.`;

                if (contentType && contentType.indexOf("application/json") !== -1) {
                    const errorData = await response.json();
                    errorDetails = errorData.error || errorDetails;
                } else {
                    const errorText = await response.text();
                    console.error("Resposta de erro não-JSON do servidor durante a ação:", errorText);
                    errorDetails += " Resposta inesperada do servidor.";
                }
                setMessage(errorDetails);
                return;
            }

            setMessage(`Registro de ${type === 'entry' ? 'entrada' : 'saída'} realizado com sucesso!`);
            setUserIdInput(''); // Limpa os inputs
            setCarIdInput('');
            fetchParkingRecords(); // Atualiza a lista após o registro bem-sucedido

        } catch (err) {
            console.error('Erro durante o registro (erro de rede, CORS, ou falha na leitura da resposta):', err);
            setMessage(`Erro ao conectar ao servidor para registrar ${type === 'entry' ? 'entrada' : 'saída'}. Verifique se o servidor está online.`);
        }
    };

    // Busca registros ao montar o componente e configura o intervalo de atualização
    useEffect(() => {
        fetchParkingRecords(); // Busca inicial
        const intervalId = setInterval(fetchParkingRecords, 10000); // Atualiza a cada 10 segundos
        return () => clearInterval(intervalId); // Limpa o intervalo ao desmontar o componente
    }, []);

    return (
        <div className="body-parking-register">
            {/* Cabeçalho com Logo */}
            <div className="parking-register-header">
                <img src={logo} alt="Logo SENAI" className="parking-register-logo" />
                <BackButton /> {/* Back button to navigate to the previous page */}
            </div>

            <div className="main-content-register">
                {/* Seção Esquerda - Botões e Inputs */}
                <div className="left-section-buttons">
                    <h2>Registrar Evento</h2>
                    {message && (
                        <div className={`message-box ${message.includes('sucesso') ? 'success' : 'error'}`}>
                            {message}
                        </div>
                    )}
                    <input
                        type="text"
                        placeholder="ID do Usuário"
                        className="register-input"
                        value={userIdInput}
                        onChange={(e) => setUserIdInput(e.target.value)}
                    />
                    <input
                        type="text"
                        placeholder="ID do Carro"
                        className="register-input"
                        value={carIdInput}
                        onChange={(e) => setCarIdInput(e.target.value)}
                    />
                    <button
                        onClick={() => handleRegisterAction('entry')}
                        className="register-action-button"
                    >
                        Registrar Entrada
                    </button>
                    <button
                        onClick={() => handleRegisterAction('exit')}
                        className="register-action-button"
                    >
                        Registrar Saída
                    </button>
                </div>

                {/* Separador Vertical */}
                <div className="vertical-separator"></div>

                {/* Seção Direita - Lista de Registros de Estacionamento */}
                <div className="right-section-list">
                    <h2>Registros de Estacionamento</h2>
                    {error && (
                        <div className="message-box error">
                            {error}
                        </div>
                    )}
                    {loading ? (
                        <p>Carregando registros...</p>
                    ) : parkingRecords.length > 0 ? (
                        parkingRecords.map((record, index) => {
                            const recordType = typeof record.tipo === 'string' ? record.tipo.toLowerCase() : '';

                            return (
                                <div
                                    key={index}
                                    className={`list-item-container ${recordType === 'entrada' ? 'entry' : recordType === 'saida' ? 'exit' : ''}`}
                                >
                                    {/* Exibe o nome do usuário em vez do ID */}
                                    <p><strong>Usuário:</strong> {record.userDetails.nome || record.userId}</p>
                                    {/* Exibe o modelo e a cor do carro em vez do ID */}
                                    <p><strong>Carro:</strong> {record.carDetails.modelo || record.carId} ({record.carDetails.cor || 'Cor Desconhecida'})</p>
                                    <p><strong>Tipo:</strong> {recordType === 'entrada' ? 'Entrada' : recordType === 'saida' ? 'Saída' : 'Desconhecido'}</p>
                                    {record.timestamp && (
                                        <p><strong>Hora:</strong> {new Date(record.timestamp).toLocaleString()}</p>
                                    )}
                                </div>
                            );
                        })
                    ) : (
                        <p>Nenhum registro de estacionamento encontrado.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ParkingRegisterPage;
