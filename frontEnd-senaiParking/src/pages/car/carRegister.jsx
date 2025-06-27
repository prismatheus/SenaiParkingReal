import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './carRegister.css'; // Importa o novo arquivo CSS
import logo from '../../assets/logo-senai.png'; // Ajuste o caminho para o seu logo conforme necessário
import BackButton from '../../components/BackButton/BackButton.jsx'; // Importa o componente de botão de voltar

const CarRegisterPage = () => {
    const [manufacturer, setManufacturer] = useState('');
    const [model, setModel] = useState('');
    const [year, setYear] = useState('');
    const [plate, setPlate] = useState('');
    const [color, setColor] = useState('');
    const [userId, setUserId] = useState(null); // Para armazenar o ID do usuário logado
    const [message, setMessage] = useState(''); // Para mensagens de sucesso/erro
    const [editingCarId, setEditingCarId] = useState(null); // Armazena o ID do carro sendo editado
    const navigate = useNavigate();

    const API_BASE_URL = 'http://localhost:3000';

    // Efeito para obter o ID do usuário logado e verificar dados do carro para edição do localStorage
    useEffect(() => {
        const storedUserData = localStorage.getItem('userData');
        if (storedUserData) {
            try {
                const user = JSON.parse(storedUserData);
                if (user && user.id) {
                    setUserId(user.id);
                } else {
                    setMessage('Erro: ID do usuário logado não encontrado. Faça login novamente.');
                    // navigate('/login'); // Comentado para permitir que a mensagem seja vista. Descomente se quiser redirecionar imediatamente.
                }
            } catch (e) {
                console.error("Falha ao analisar os dados do usuário do localStorage:", e);
                setMessage('Erro: Dados do usuário corrompidos. Faça login novamente.');
                // localStorage.removeItem('userData'); // Comentado para depuração
                // navigate('/login'); // Comentado para depuração
            }
        } else {
            setMessage('Você não está logado. Por favor, faça login para registrar/editar um carro.');
            // navigate('/login'); // Comentado para depuração
        }

        // Verifica se há dados do carro no localStorage para pré-preencher para edição
        const storedEditingCar = localStorage.getItem('editingCar');
        if (storedEditingCar) {
            try {
                const carToEdit = JSON.parse(storedEditingCar);
                setEditingCarId(carToEdit.id);
                setManufacturer(carToEdit.manufacturer || '');
                setModel(carToEdit.model || '');
                setYear(carToEdit.year || ''); // Ano pode ser um número ou string
                setPlate(carToEdit.plate || '');
                setColor(carToEdit.color || '');
                setMessage('Editando informações do carro.');
                // Limpa o localStorage imediatamente após a leitura para evitar pré-preenchimento em carregamentos subsequentes
                localStorage.removeItem('editingCar');
            } catch (e) {
                console.error("Falha ao analisar os dados do carro para edição do localStorage:", e);
                setMessage('Erro: Dados do carro para edição corrompidos.');
                localStorage.removeItem('editingCar');
            }
        }
    }, []); // Executa uma vez na montagem do componente

    const handleRegisterCar = async () => {
        setMessage(''); // Limpa mensagens anteriores

        // Validação básica
        if (!manufacturer || !model || !year || !plate || !color) {
            setMessage('Por favor, preencha todos os campos.');
            return;
        }
        if (!userId) {
            setMessage('Erro: Usuário não identificado. Por favor, faça login.');
            return;
        }

        try {
            const authToken = localStorage.getItem('authToken');
            if (!authToken) {
                setMessage('Autenticação necessária para registrar/atualizar o carro.');
                return;
            }

            const payload = {
                manufacturer,
                model,
                year: parseInt(year), // Garante que o ano seja um número
                plate,
                color,
                userId // O ID do usuário logado atualmente
            };

            let response;
            if (editingCarId) {
                // Se editingCarId existe, realiza uma requisição PUT (Atualizar)
                response = await fetch(`${API_BASE_URL}/api/cars/${editingCarId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${authToken}`,
                    },
                    body: JSON.stringify(payload),
                });
            } else {
                // Caso contrário, realiza uma requisição POST (Registrar novo carro)
                response = await fetch(`${API_BASE_URL}/api/registerCar`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${authToken}`,
                    },
                    body: JSON.stringify(payload),
                });
            }

            console.log('[handleRegisterCar] Resposta bruta:', response);

            if (!response.ok) {
                const contentType = response.headers.get("content-type");
                let errorDetails = editingCarId ? 'Falha ao atualizar carro.' : 'Falha ao registrar carro.';

                if (contentType && contentType.indexOf("application/json") !== -1) {
                    const errorData = await response.json();
                    errorDetails = errorData.error || errorDetails;
                } else {
                    const errorText = await response.text();
                    console.error("Resposta de erro não-JSON do servidor durante a ação do carro:", errorText);
                    errorDetails += " Resposta inesperada do servidor.";
                }
                setMessage(errorDetails);
                return;
            }

            const data = await response.json();
            const successMessage = editingCarId ? 'Carro atualizado com sucesso!' : 'Carro registrado com sucesso!';
            setMessage(successMessage);
            console.log('Ação do carro bem-sucedida:', data);

            // Opcionalmente, limpa o formulário ou redireciona após o sucesso
            setManufacturer('');
            setModel('');
            setYear('');
            setPlate('');
            setColor('');
            setEditingCarId(null); // Reseta o estado de edição
            // Considera navegar de volta para a lista de carros do usuário após o sucesso
            navigate('/car'); // Assumindo que /car é a página da lista de carros do usuário
        } catch (err) {
            console.error('Erro durante a ação do carro:', err);
            setMessage(`Erro ao conectar ao servidor para ${editingCarId ? 'atualizar' : 'registrar'} o carro. Verifique se o servidor está online.`);
        }
    };

    return (
        <div className="body-car-register">
            {/* Cabeçalho com Logo e Botão de Voltar */}
            <div className="car-register-header">
                <img src={logo} alt="Logo SENAI" className="car-register-logo" />
                {/* Botão de Voltar posicionado no canto superior direito */}
                <BackButton /> 
            </div>
        
            <div className="car-register-container">
                <h2 className="car-register-title">
                    {editingCarId ? 'Editar Carro' : 'Registrar Novo Carro'}
                </h2>

                {message && (
                    <div className="message-box success"> {/* A classe 'success' ou 'error' será aplicada dinamicamente */}
                        {message}
                    </div>
                )}

                <div className="input-group-car">
                    <input
                        type="text"
                        placeholder="Fabricante"
                        className="car-register-input"
                        value={manufacturer}
                        onChange={(e) => setManufacturer(e.target.value)}
                    />
                    <input
                        type="text"
                        placeholder="Modelo"
                        className="car-register-input"
                        value={model}
                        onChange={(e) => setModel(e.target.value)}
                    />
                    <input
                        type="number"
                        placeholder="Ano"
                        className="car-register-input"
                        value={year}
                        onChange={(e) => setYear(e.target.value)}
                    />
                    <input
                        type="text"
                        placeholder="Placa"
                        className="car-register-input"
                        value={plate}
                        onChange={(e) => setPlate(e.target.value)}
                    />
                    <input
                        type="text"
                        placeholder="Cor"
                        className="car-register-input"
                        value={color}
                        onChange={(e) => setColor(e.target.value)}
                    />
                </div>

                <button
                    onClick={handleRegisterCar}
                    className="car-register-button"
                >
                    {editingCarId ? 'Atualizar Carro' : 'Registrar Carro'}
                </button>
            </div>
        </div>
    );
};

export default CarRegisterPage;
