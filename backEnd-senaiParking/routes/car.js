import { Router } from "express";
import {
    registerCar,
    getAllCars,
    getCarById,
    updateCar,
    deleteCar,
    getCarsByUserId,
    getCarsForSpecificUser // Certifique-se de importar esta função
} from "../controllers/car.js";
import auth from "../middlewares/authMiddleware.js";

const router = Router();

// --- ROTAS DO CARRO ---

// 1. Rota para os carros do usuário logado (MAIS ESPECÍFICA - DEVE VIR PRIMEIRO)
router.get("/cars/user", auth, getCarsByUserId); // Esta deve ser a primeira rota que começa com /cars

// 2. Rota para buscar um carro por ID (MAIS GENÉRICA - DEVE VIR DEPOIS)
router.get("/cars/:id", getCarById); // Se esta rota estiver antes, ela "captura" /cars/user

// Outras rotas (a ordem delas não importa tanto em relação às duas acima)
router.get("/cars/user/:id", auth, getCarsForSpecificUser); // Rota para obter carros de um usuário específico
router.post("/registerCar", auth, registerCar);
router.get("/cars", getAllCars); // Pega todos os carros
router.put("/cars/:id", auth, updateCar);
router.delete("/cars/:id", auth, deleteCar);

export default router;