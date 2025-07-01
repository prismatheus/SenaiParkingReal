// controllers/userController.js
import Users from '../models/user.js'; // Seu modelo de usuário (Sequelize, Mongoose, etc.)
import jwt from 'jsonwebtoken';
import 'dotenv/config'; // Garante que as variáveis de ambiente sejam carregadas

const secret = process.env.KEYWORD; // Sua chave secreta do arquivo .env

export const getUserById = async (req, res) => {
    const { id } = req.params;
    try {
        const user = await Users.findByPk(id);
        if (!user) {
            return res.status(404).json({ error: 'Usuário não encontrado.' });
        }
        res.status(200).json(user);
    } catch (error) {
        console.error("Erro ao buscar usuário:", error);
        res.status(500).json({ error: 'Erro ao buscar usuário.' });
    }
};

export const registerUser = async (req, res) => {
    // --- ALTERAÇÃO AQUI: PEGUE O 'type' DO req.body ---
    const { name, email, password, type } = req.body; 

    console.log("Tentando cadastrar:", name, email, password, "Tipo:", type); // Adicione o tipo para depuração

    if (!email || !password || !name || !type) { // Adicione 'type' à validação
        return res.status(400).json({ error: 'Nome, email, senha e tipo de usuário são obrigatórios.' });
    }

    // Validação extra para garantir que o tipo é 'user' ou 'admin'
    if (!['user', 'admin'].includes(type)) {
        return res.status(400).json({ error: 'Tipo de usuário inválido. Deve ser "user" ou "admin".' });
    }

    try {
        const userExists = await Users.findOne({ where: { email } });

        if (userExists) {
            console.log("Usuário já existe:", email);
            return res.status(409).json({ error: 'Email já cadastrado.' });
        }
    
        // --- REMOVIDA: A linha 'const type = 'user';' foi removida ---
        // Cria o usuário com o tipo recebido do frontend
        const user = await Users.create({ name, email, password, type });

        console.log("Usuário criado:", user.toJSON());

        // GERAÇÃO DO TOKEN: Inclui o ID e o TIPO do usuário no payload do JWT
        const token = jwt.sign({ id: user.id, type: user.type }, secret, { expiresIn: '1h' });
        res.status(201).json({ token, user }); // Retorna o token e os dados do usuário
    } catch (error) {
        console.error("Erro ao registrar:", error);
        res.status(500).json({ error: 'Erro ao registrar usuário.' });
    }
};

export const loginUser = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email e senha são obrigatórios.' });
    }

    try {
        const user = await Users.findOne({ where: { email } });

        if (!user || user.password !== password) {
            return res.status(401).json({ error: 'Email ou senha inválidos.' });
        }

        // GERAÇÃO DO TOKEN: Inclui o ID e o TIPO do usuário no payload do JWT
        const token = jwt.sign({ id: user.id, type: user.type }, secret, { expiresIn: '1h' });
        res.status(200).json({ token, user }); // Retorna o token e os dados do usuário
    } catch (error) {
        console.error("Erro ao fazer login:", error);
        res.status(500).json({ error: 'Erro ao fazer login.' });
    }
};

export const getUserType = async (req, res) => {
    // Acessa o ID do usuário diretamente de req.user
    const authenticatedUserId = req.user.id; 
    const authenticatedUserType = req.user.type; // Acessa o tipo do usuário diretamente de req.user

    if (!authenticatedUserId) {
        return res.status(401).json({ error: 'Usuário não autenticado.' });
    }

    try {
        const user = await Users.findByPk(authenticatedUserId, { attributes: ['type'] });
        if (!user) {
            return res.status(404).json({ error: 'Usuário não encontrado.' });
        }
        res.status(200).json({ type: user.type });
    } catch (error) {
        console.error("Erro ao buscar tipo de usuário:", error);
        res.status(500).json({ error: 'Erro ao buscar tipo de usuário.' });
    }
};

export const deleteUser = async (req, res) => {
    const { id } = req.params; // ID do usuário a ser deletado (da URL)
    
    // Acesse authenticatedUserId e authenticatedUserType de req.user
    const authenticatedUserId = req.user.id; 
    const authenticatedUserType = req.user.type; 

    try {
        const userToDelete = await Users.findByPk(id);

        if (!userToDelete) {
            return res.status(404).json({ error: 'Usuário não encontrado.' });
        }

        // Lógica de Permissão
        if (authenticatedUserType === 'admin') {
            // Se o usuário autenticado é um admin
            if (userToDelete.type === 'admin' && authenticatedUserId !== parseInt(id)) {
                // Admin não pode deletar outro admin (a menos que seja ele mesmo)
                return res.status(403).json({ error: 'Admins não podem deletar outras contas de admin.' });
            }
            // Admin pode deletar usuários normais ou a si mesmo
        } else if (authenticatedUserType === 'user') {
            // Se o usuário autenticado é um usuário comum
            if (authenticatedUserId !== parseInt(id)) {
                // Usuário comum só pode deletar a própria conta
                return res.status(403).json({ error: 'Você não tem permissão para deletar esta conta.' });
            }
        } else {
            // Para qualquer outro tipo de usuário ou caso inesperado (inclui 'undefined' aqui)
            return res.status(403).json({ error: 'Seu tipo de usuário não tem permissão para deletar contas.' });
        }

        // Com `onDelete: 'CASCADE'` configurado na associação do Sequelize,
        // os carros associados a este usuário serão automaticamente deletados.
        await userToDelete.destroy();
        res.status(204).send(); // 204 No Content para exclusão bem-sucedida

    } catch (error) {
        console.error("Erro ao deletar usuário:", error);
        // O erro '23503' (violação de FK) não deveria mais ocorrer se CASCADE estiver correto.
        // Se ainda ocorrer, verifique se o banco de dados foi sincronizado/migrado corretamente.
        res.status(500).json({ error: 'Erro ao deletar usuário.' });
    }
};

export const updateUser = async (req, res) => {
    const { id } = req.params; // ID do usuário a ser atualizado (da URL)
    
    // Acesse authenticatedUserId e authenticatedUserType de req.user
    const authenticatedUserId = req.user.id; 
    const authenticatedUserType = req.user.type; 

    try {
        const userToUpdate = await Users.findByPk(id);

        if (!userToUpdate) {
            return res.status(404).json({ error: 'Usuário não encontrado.' });
        }

        // Lógica de Permissão
        if (authenticatedUserType === 'admin') {
            // Se o usuário autenticado é um admin
            if (userToUpdate.type === 'admin' && authenticatedUserId !== parseInt(id)) {
                // Admin não pode atualizar outro admin (a menos que seja ele mesmo)
                return res.status(403).json({ error: 'Admins não podem atualizar outras contas de admin.' });
            }
            // Admin pode atualizar usuários normais ou a si mesmo
        } else if (authenticatedUserType === 'user') {
            // Se o usuário autenticado é um usuário comum
            if (authenticatedUserId !== parseInt(id)) {
                // Usuário comum só pode atualizar a própria conta
                return res.status(403).json({ error: 'Você não tem permissão para atualizar esta conta.' });
            }
        } else {
            // Para qualquer outro tipo de usuário ou caso inesperado (inclui 'undefined' aqui)
            return res.status(403).json({ error: 'Seu tipo de usuário não tem permissão para atualizar contas.' });
        }

        // Atualiza os dados do usuário com os dados recebidos na requisição
        const { name, email, password, type } = req.body;
        await userToUpdate.update({ 
            name: name !== undefined ? name : userToUpdate.name,
            email: email !== undefined ? email : userToUpdate.email,
            password: password !== undefined ? password : userToUpdate.password, // Considere hashing de senha aqui
            type: type !== undefined ? type : userToUpdate.type
        });

        res.status(200).json(userToUpdate); // Retorna o usuário atualizado

    } catch (error) {
        console.error("Erro ao atualizar usuário:", error);
        res.status(500).json({ error: 'Erro ao atualizar usuário.' });
    }
};

export const getAllUsers = async (req, res) => {
    try {
        const users = await Users.findAll();
        res.status(200).json(users);
    } catch (error) {
        console.error("Erro ao buscar todos os usuários:", error);
        res.status(500).json({ error: 'Erro ao buscar usuários.' });
    }
}

export const editOwnProfile = async (req, res) => {
    const authenticatedUserId = req.user.id; // ID do usuário autenticado
    const { name, email, password } = req.body; // Dados para atualizar

    try {
        const userToEdit = await Users.findByPk(authenticatedUserId);

        if (!userToEdit) {
            return res.status(404).json({ error: 'Usuário não encontrado.' });
        }

        // Atualiza os dados do usuário com os dados recebidos na requisição
        await userToEdit.update({ 
            name: name !== undefined ? name : userToEdit.name,
            email: email !== undefined ? email : userToEdit.email,
            password: password !== undefined ? password : userToEdit.password // Considere hashing de senha aqui
        });

        res.status(200).json(userToEdit); // Retorna o usuário atualizado

    } catch (error) {
        console.error("Erro ao editar perfil:", error);
        res.status(500).json({ error: 'Erro ao editar perfil.' });
    }
}
