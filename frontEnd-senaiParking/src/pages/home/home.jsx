import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
// Ícones Lucide-React REMOVIDOS, pois agora usamos uma imagem para o botão de usuário.
import './home.css'; // Importa o arquivo CSS para os estilos
import logo from '../../assets/logo-senai.png'; // Caminho CORRIGIDO para a logo do SENAI
import exitIcon from '../../assets/exitIcon.png'; // Importa a imagem do ícone de saída (logout)
import userIconForHeader from '../../assets/userMenuIcon.png'; // Importa a imagem do ícone de usuário para o cabeçalho

const HomePage = () => {
    const navigate = useNavigate();
    // Estado para armazenar o tipo de usuário (admin, user), inicializado como null.
    const [userType, setUserType] = useState(null);
    // Estado para exibir mensagens de feedback ao usuário (sucesso, erro, alerta).
    const [message, setMessage] = useState('');

    // Efeito para carregar os dados do usuário do localStorage na montagem do componente.
    useEffect(() => {
        const storedUserData = localStorage.getItem('userData');
        if (storedUserData) {
            try {
                const user = JSON.parse(storedUserData);
                // Assume que o objeto de usuário tem uma propriedade 'type' (ex: 'admin' ou 'user').
                setUserType(user.type);
            } catch (e) {
                console.error("Falha ao analisar dados do usuário do localStorage:", e);
                // Se os dados estiverem corrompidos, remove-os para evitar problemas futuros.
                localStorage.removeItem('userData');
            }
        } else {
            // Se não houver dados de usuário, define o tipo como 'user' por padrão
            // ou pode ser null para forçar um redirecionamento se todas as rotas forem protegidas.
            setUserType('user'); 
        }
    }, []); // Array de dependências vazio significa que este efeito é executado apenas uma vez na montagem.

    /**
     * Função genérica para lidar com a navegação entre as páginas.
     * Pode opcionalmente exigir que o usuário seja um administrador.
     * @param {string} path - O caminho da rota para onde navegar.
     * @param {boolean} [requiresAdmin=false] - Se a navegação exige que o usuário seja 'admin'.
     */
    const handleNavigation = (path, requiresAdmin = false) => {
        setMessage(''); // Limpa quaisquer mensagens de feedback anteriores.

        // Verifica a permissão se a rota exigir admin e o usuário não for.
        if (requiresAdmin && userType !== 'admin') {
            setMessage('Apenas administradores permitidos!');
            return; // Impede a navegação e exibe a mensagem de erro.
        }
        navigate(path); // Navega para o caminho especificado.
    };

    /**
     * Lida com o clique no botão "Editar Perfil".
     * Redireciona o usuário para a página de edição de perfil.
     */
    const handleEditUser = () => {
        navigate('/editUser'); // Navega para a página de edição de usuário.
    };

    /**
     * Lida com o processo de logout do usuário.
     * Remove o token de autenticação e os dados do usuário do localStorage e redireciona para a página de login.
     */
    const handleLogout = () => {
        localStorage.removeItem('authToken'); // Remove o token JWT.
        localStorage.removeItem('userData'); // Remove os dados do usuário.
        navigate('/login'); // Redireciona para a página de login.
    };

    return (
        <div className="body-home">
            {/* Cabeçalho principal da página, contendo a logo e os botões de ação. */}
            <div className="header-home">
                <img src={logo} alt="Logo SENAI" className="logo-home" />
                
                {/* Grupo de botões de ação no canto superior direito do cabeçalho. */}
                <div className="header-buttons-group">
                    {/* Botão para editar o perfil do usuário. */}
                    <button
                        onClick={handleEditUser}
                        className="header-action-button" // Classe geral de estilo para botões de ação no cabeçalho.
                    >
                        {/* Imagem do ícone de usuário. A classe 'button-icon' é crucial para o estilo da imagem. */}
                        <img src={userIconForHeader} alt="Editar Usuário" className="button-icon" />
                    </button>
                    {/* Botão para realizar o logout da aplicação. */}
                    <button
                        onClick={handleLogout}
                        className="header-action-button logout-button" // Classe geral e classe específica para o botão de logout.
                    >
                        <img src={exitIcon} alt="Logout" className="button-icon" />
                    </button>
                </div>
            </div>

            {/* Conteúdo principal da página, centralizado. */}
            <div className="main-content">
                <h1 className="title-home">Bem-vindo ao SENAI Parking</h1>

                {/* Caixa de mensagem condicional para exibir alertas ou informações. */}
                {message && (
                    <div className={`message-box ${message.includes('administradores permitidos') ? 'error' : 'info'}`}>
                        {message}
                    </div>
                )}          
                {/* Contêiner para organizar os botões principais em colunas. */}
                <div className="button-columns-container">
                    {/* COLUNA ESQUERDA: Botões relacionados a carros. */}
                    <div className="button-column">
                        <button
                            onClick={() => handleNavigation('/car')}
                            className="home-button"
                        >
                            Ver seus Carros
                        </button>
                        <button
                            onClick={() => handleNavigation('/car/register')}
                            className="home-button"
                        >
                            Registrar Carro
                        </button>
                    </div>

                    {/* COLUNA DO MEIO: Botão de acesso à garagem. */}
                    <div className="button-column">
                        <button
                            onClick={() => handleNavigation('/parking')}
                            className="home-button"
                        >
                            Ver Garagem
                        </button>
                    </div>

                    {/* COLUNA DIREITA: Botões de administração (alguns restritos a admins). */}
                    <div className="button-column">
                        <button
                            onClick={() => handleNavigation('/parkingRegister', true)} // Requer admin
                            className="home-button"
                        >
                            Registrar Entrada/Saída
                        </button>
                        <button
                            onClick={() => handleNavigation('/viewAllUsers', true)} // Requer admin
                            className="home-button"
                        >
                            Ver Todos os Usuários
                        </button>
                    </div>
                </div>
            </div>
            {userType && <p className='user-type-text'>Tipo de Usuário Atual: {userType.toUpperCase()}</p>}

        </div>
    );
}

export default HomePage;
