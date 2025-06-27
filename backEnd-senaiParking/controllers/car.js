import Cars from '../models/car.js';
import jwt from 'jsonwebtoken';
import 'dotenv/config';
const secret = process.env.KEYWORD;

export const registerCar = async (req, res) => {
    // 1. Remove userId from the initial check. It will come from the authenticated user.
    if (!req.body.manufacturer || !req.body.model || !req.body.year || !req.body.plate || !req.body.color) {
        return res.status(400).json({ error: 'Todos os campos, exceto o userId, são obrigatórios no corpo da requisição.' });
    }

    // Check if the user is authenticated
    if (!req.user || !req.user.id) {
        return res.status(401).json({ error: 'Usuário não autenticado. Não é possível registrar o carro.' });
    }

    try {
        // 2. Get the userId from the authenticated user attached by the middleware (e.g., req.user.id).
        const userId = req.user.id; 
        const { manufacturer, model, year, plate, color } = req.body;

        // 3. Create the car with the correct, validated userId.
        const car = await Cars.create({ manufacturer, model, year, plate, color, userId });
        
        res.status(201).json(car);
    } catch (error) {
        // Add more detailed error logging to help debug in the future
        console.error("Detailed error on car registration:", error); 
        res.status(500).json({ error: 'Erro ao registrar carro.', details: error.message });
    }
}

// ... (o restante do seu código getAllCars, getCarById, etc. permanece o mesmo)

export const getAllCars = async (req, res) => {
    try {
        const cars = await Cars.findAll();
        res.status(200).json(cars);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar carros.' });
    }
}

export const getCarById = async (req, res) => {
    const { id } = req.params;
    try {
        const car = await Cars.findByPk(id);
        if (!car) {
            return res.status(404).json({ error: 'Carro não encontrado.' });
        }
        res.status(200).json(car);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar carro.' });
    }
}

export const updateCar = async (req, res) => {
    const { id } = req.params;
    try {
        const [updated] = await Cars.update(req.body, { where: { id } });
        if (!updated) {
            return res.status(404).json({ error: 'Carro não encontrado.' });
        }
        const updatedCar = await Cars.findByPk(id);
        res.status(200).json(updatedCar);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao atualizar carro.' });
    }
}

export const deleteCar = async (req, res) => {
    const { id } = req.params;
    try {
        const deleted = await Cars.destroy({ where: { id } });
        if (!deleted) {
            return res.status(404).json({ error: 'Carro não encontrado.' });
        }
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: 'Erro ao deletar carro.' });
    }
}

export const getCarsByUserId = async (req, res) => {
    // --- ADICIONE ESTES CONSOLE.LOGS ---
    console.log("DEBUG [getCarsByUserId]: Requisição recebida.");
    console.log("DEBUG [getCarsByUserId]: Conteúdo de req.user:", req.user); // VERIFIQUE ISTO!
    // --- FIM DOS CONSOLE.LOGS ---

    if (!req.user || !req.user.id) {
        console.error("DEBUG [getCarsByUserId]: Usuário não autenticado ou ID ausente."); // Adicione este log
        return res.status(401).json({ error: 'Usuário não autenticado. Não é possível buscar carros.' });
    }

    const userId = req.user.id;
    console.log("DEBUG [getCarsByUserId]: Filtrando por userId:", userId); // VERIFIQUE SE O userId É VÁLIDO

    try {
        const cars = await Cars.findAll({
            where: { userId: userId } // Garanta que 'userId' é a coluna correta no seu modelo de Carro
        });
        console.log(`DEBUG [getCarsByUserId]: Encontrados ${cars.length} carros para o userId ${userId}.`); // Adicione este log

        res.status(200).json(cars);
    } catch (error) {
        // ESTE É O CONSOLE.ERROR QUE PRECISO VER NO SEU TERMINAL
        console.error("Erro ao buscar carros do usuário:", error); 
        res.status(500).json({ error: 'Erro ao buscar carros do usuário.' });
    }
}

export const getCarsForSpecificUser = async (req, res) => {
    // O ID do usuário cujos carros queremos ver (vem da URL, ex: /cars/user/123)
    const { id: targetUserId } = req.params; 
    
    // ID e TIPO do usuário que ESTÁ AUTENTICADO (o admin fazendo a requisição)
    const authenticatedUserId = req.user.id; 
    const authenticatedUserType = req.user.type; 

    // console.log para depuração no backend
    console.log(`DEBUG [getCarsForSpecificUser]: Requisição recebida para usuário ${targetUserId}.`);
    console.log(`DEBUG [getCarsForSpecificUser]: Admin autenticado: ID ${authenticatedUserId}, Tipo ${authenticatedUserType}.`);

    // Validação de Permissão: Apenas administradores podem usar esta rota
    if (!authenticatedUserType || authenticatedUserType !== 'admin') {
        console.warn(`Acesso não autorizado: Usuário ${authenticatedUserId} (Tipo: ${authenticatedUserType}) tentou acessar carros de ${targetUserId}.`);
        return res.status(403).json({ error: 'Acesso negado. Apenas administradores podem visualizar os carros de outros usuários.' });
    }

    try {
        // Busca os carros associados ao targetUserId (o ID da URL)
        const cars = await Cars.findAll({
            where: { userId: targetUserId } 
        });
        console.log(`DEBUG [getCarsForSpecificUser]: Encontrados ${cars.length} carros para o usuário ${targetUserId}.`);
        res.status(200).json(cars);
    } catch (error) {
        console.error(`Erro ao buscar carros para o usuário ${targetUserId}:`, error);
        res.status(500).json({ error: 'Erro ao buscar carros do usuário.' });
    }
};