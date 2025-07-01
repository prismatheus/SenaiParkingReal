import React, { useState, useEffect, useCallback } from 'react';
import './parkingRegister.css';
import logo from '../../assets/logo-senai.png';
import BackButton from '../../components/BackButton/BackButton.jsx';

const ParkingRegisterPage = () => {
    // --- ALTERADO: Estados para armazenar nome do usuário e placa do carro ---
    const [userNameInput, setUserNameInput] = useState('');
    const [carPlateInput, setCarPlateInput] = useState('');
    
    // Estado para armazenar registros enriquecidos com detalhes de carro e usuário
    const [parkingRecords, setParkingRecords] = useState([]);
    const [message, setMessage] = useState(''); // Para mensagens de sucesso/erro do registro
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(''); // Para erros ao buscar a lista

    const API_BASE_URL = 'http://localhost:3000';

    // Função auxiliar para buscar detalhes de um carro por ID
    const fetchCarDetails = useCallback(async (carId, authToken) => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/cars/${carId}`, {
                headers: { 'Authorization': `Bearer ${authToken}` }
            });
            if (!response.ok) {
                return { id: carId, modelo: 'Desconhecido', cor: 'Desconhecida' };
            }
            const data = await response.json();
            return {
                id: data.id,
                modelo: data.model,
                cor: data.color
            };
        } catch (err) {
            console.error(`Erro ao buscar detalhes do carro ${carId}:`, err);
            return { id: carId, modelo: 'Desconhecido', cor: 'Desconhecida' };
        }
    }, []);

    // Função auxiliar para buscar detalhes de um usuário por ID
    const fetchUserDetails = useCallback(async (userId, authToken) => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/users/${userId}`, {
                headers: { 'Authorization': `Bearer ${authToken}` }
            });
            if (!response.ok) {
                return { id: userId, nome: 'Usuário Desconhecido' };
            }
            const data = await response.json();
            return {
                id: data.id,
                nome: data.name || 'Usuário Desconhecido'
            };
        } catch (err) {
            console.error(`Erro ao buscar detalhes do usuário ${userId}:`, err);
            return { id: userId, nome: 'Usuário Desconhecido' };
        }
    }, []);

    // Função principal para buscar os registros de estacionamento e enriquecê-los
    const fetchParkingRecords = useCallback(async () => {
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
                headers: { 'Authorization': `Bearer ${authToken}` },
            });

            if (!recordsResponse.ok) {
                const errorData = await recordsResponse.json();
                throw new Error(errorData.error || `Erro HTTP! Status: ${recordsResponse.status}`);
            }

            const rawRecords = await recordsResponse.json();
            
            // Se não houver registros, define a lista como vazia e para a execução
            if (rawRecords.length === 0) {
                setParkingRecords([]);
                setLoading(false);
                return;
            }

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
    }, [fetchCarDetails, fetchUserDetails]);

    // Função para lidar com o registro (entrada ou saída)
    const handleRegisterAction = async (type) => {
        setMessage('');
        // --- ALTERADO: Valida os novos campos de input ---
        if (!userNameInput || !carPlateInput) {
            setMessage('Por favor, preencha o Nome do Usuário e a Placa do Carro.');
            return;
        }

        try {
            const authToken = localStorage.getItem('authToken');
            if (!authToken) {
                setMessage('Autenticação necessária para registrar.');
                return;
            }

            // --- ALTERADO: Payload enviado para a API com nome e placa ---
            const payload = { userName: userNameInput, carPlate: carPlateInput };
            const endpoint = type === 'entry' ? '/api/garage/entry' : '/api/garage/exit';

            const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`,
                },
                body: JSON.stringify(payload),
            });
            
            const responseData = await response.json();

            if (!response.ok) {
                // Usa a mensagem de erro vinda da API, se disponível
                throw new Error(responseData.error || `Falha no registro de ${type === 'entry' ? 'entrada' : 'saída'}.`);
            }

            setMessage(`Registro de ${type === 'entry' ? 'entrada' : 'saída'} realizado com sucesso!`);
            // --- ALTERADO: Limpa os inputs corretos ---
            setUserNameInput('');
            setCarPlateInput('');
            fetchParkingRecords(); // Atualiza a lista após o registro bem-sucedido

        } catch (err) {
            console.error('Erro durante o registro:', err);
            setMessage(err.message); // Exibe a mensagem de erro para o usuário
        }
    };

    // Busca registros ao montar o componente
    useEffect(() => {
        fetchParkingRecords();
    }, [fetchParkingRecords]);

    return (
        <div className="body-parking-register">
            <div className="parking-register-header">
                <img src={logo} alt="Logo SENAI" className="parking-register-logo" />
                <BackButton />
            </div>

            <div className="main-content-register">
                <div className="left-section-buttons">
                    <h2>Registrar Evento</h2>
                    {message && (
                        <div className={`message-box ${message.includes('sucesso') ? 'success' : 'error'}`}>
                            {message}
                        </div>
                    )}
                    {/* --- ALTERADO: Input para Nome do Usuário --- */}
                    <input
                        type="text"
                        placeholder="Nome do Usuário"
                        className="register-input"
                        value={userNameInput}
                        onChange={(e) => setUserNameInput(e.target.value)}
                    />
                    {/* --- ALTERADO: Input para Placa do Carro --- */}
                    <input
                        type="text"
                        placeholder="Placa do Carro"
                        className="register-input"
                        value={carPlateInput}
                        onChange={(e) => setCarPlateInput(e.target.value)}
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

                <div className="vertical-separator"></div>

                <div className="right-section-list">
                    <h2>Registros de Estacionamento</h2>
                    {error && <div className="message-box error">{error}</div>}
                    {loading ? (
                        <p>Carregando registros...</p>
                    ) : parkingRecords.length > 0 ? (
                        parkingRecords.map((record) => {
                            const recordType = typeof record.tipo === 'string' ? record.tipo.toLowerCase() : '';
                            return (
                                <div
                                    key={record.id} // Use um ID único do registro como chave
                                    className={`list-item-container ${recordType === 'entrada' ? 'entry' : recordType === 'saida' ? 'exit' : ''}`}
                                >
                                    {/* O `userId` no registro da garagem é o ID do admin que registrou */}
                                    <p><strong>Admin:</strong> {record.userDetails.nome || `ID: ${record.userId}`}</p>
                                    <p><strong>Carro:</strong> {record.carDetails.modelo || `ID: ${record.carId}`} ({record.carDetails.cor || 'Cor Desconhecida'})</p>
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
