// controllers/garage.js

// Importa os modelos necessários para fazer as buscas no banco de dados
import Garages from "../models/garage.js";
import Users from "../models/user.js"; // <-- NECESSÁRIO para buscar usuário por nome
import Cars from "../models/car.js";   // <-- NECESSÁRIO para buscar carro por placa

import jwt from "jsonwebtoken";
import "dotenv/config";
import { getVagasDisponiveis } from "../Services/vagas.js";

const secret = process.env.KEYWORD;

/**
 * Registra a entrada de um carro na garagem.
 * Recebe o nome do usuário e a placa do carro, busca os IDs correspondentes,
 * e então cria um novo registro de 'entrada'.
 */
export const registerGarageEntry = async (req, res) => {
  // --- ALTERADO: Recebe nome do usuário e placa do carro do corpo da requisição ---
  const { userName, carPlate } = req.body;
  const adminUserId = req.user.id; // O ID do administrador que está realizando a ação

  // Verifica se o usuário logado é um administrador
  if (req.user.type !== "admin") {
    return res
      .status(403)
      .json({
        error: "Acesso negado. Apenas administradores podem registrar entradas.",
      });
  }

  // --- ALTERADO: Valida os novos campos de entrada ---
  if (!userName || !carPlate) {
    return res.status(400).json({ error: "Nome do usuário e placa do carro são obrigatórios." });
  }

  try {
    // --- 1. Buscar o ID do usuário pelo nome ---
    const user = await Users.findOne({ where: { name: userName } });
    if (!user) {
      return res.status(404).json({ error: `Usuário com o nome '${userName}' não encontrado.` });
    }

    // --- 2. Buscar o carro pela placa E pelo ID do usuário encontrado ---
    // Isso garante que estamos pegando o carro correto do usuário correto.
    const car = await Cars.findOne({ where: { plate: carPlate, userId: user.id } });
    if (!car) {
      return res.status(404).json({ error: `Carro com placa '${carPlate}' não encontrado para o usuário '${userName}'.` });
    }

    // --- 3. A partir daqui, usamos o car.id encontrado e continuamos com a lógica original ---
    const carId = car.id;

    // Verifica se há vagas disponíveis
    const vagasDisponiveis = await getVagasDisponiveis();
    if (vagasDisponiveis <= 0) {
      return res
        .status(400)
        .json({ error: "Garagem cheia. Não há vagas disponíveis." });
    }

    // Verifica se o carro já está na garagem (último evento foi uma entrada)
    const lastCarEvent = await Garages.findOne({
      where: { carId },
      order: [["timestamp", "DESC"]],
    });

    if (lastCarEvent && lastCarEvent.tipo === "entrada" && lastCarEvent.autorizado === true) {
      return res
        .status(400)
        .json({
          error: "Este carro já está estacionado na garagem (último evento foi uma entrada autorizada).",
        });
    }

    // --- 4. Cria o novo registro de 'entrada' ---
    const newEntry = await Garages.create({
      carId,              // O ID do carro que encontramos
      userId: adminUserId, // O ID do admin que está registrando
      tipo: "entrada",
      autorizado: true,
      timestamp: new Date(),
    });

    res.status(201).json(newEntry);
  } catch (error) {
    console.error("Erro ao registrar entrada na garagem:", error);
    res.status(500).json({ error: "Erro interno ao registrar entrada na garagem." });
  }
};

/**
 * Registra a saída de um carro da garagem.
 * Recebe o nome do usuário e a placa do carro, busca os IDs correspondentes,
 * e então cria um novo registro de 'saida'.
 */
export const registerGarageExit = async (req, res) => {
  // --- ALTERADO: Recebe nome do usuário e placa do carro ---
  const { userName, carPlate } = req.body;
  const adminUserId = req.user.id; // ID do admin logado

  if (req.user.type !== "admin") {
    return res
      .status(403)
      .json({
        error: "Acesso negado. Apenas administradores podem registrar saídas.",
      });
  }

  if (!userName || !carPlate) {
    return res.status(400).json({ error: "Nome do usuário e placa do carro são obrigatórios." });
  }

  try {
    // --- 1. Lógica de busca de IDs (idêntica à de entrada) ---
    const user = await Users.findOne({ where: { name: userName } });
    if (!user) {
      return res.status(404).json({ error: `Usuário com o nome '${userName}' não encontrado.` });
    }

    const car = await Cars.findOne({ where: { plate: carPlate, userId: user.id } });
    if (!car) {
      return res.status(404).json({ error: `Carro com placa '${carPlate}' não encontrado para o usuário '${userName}'.` });
    }

    // --- 2. Usa o car.id encontrado para a lógica existente ---
    const carId = car.id;

    // Verifica se o carro está realmente na garagem (entradas > saídas)
    const entryCount = await Garages.count({
      where: { carId, tipo: "entrada", autorizado: true },
    });
    const exitCount = await Garages.count({
      where: { carId, tipo: "saida", autorizado: true },
    });

    if (entryCount <= exitCount) {
      return res
        .status(400)
        .json({
          error: "Este carro não está atualmente na garagem (ou já registrou saída).",
        });
    }

    // --- 3. Cria o novo registro de 'saida' ---
    const newExit = await Garages.create({
      carId,              // O ID do carro que encontramos
      userId: adminUserId, // O ID do admin que está registrando
      tipo: "saida",
      autorizado: true,
      timestamp: new Date(),
    });

    res.status(201).json(newExit);
  } catch (error) {
    console.error("Erro ao registrar saída da garagem:", error);
    res.status(500).json({ error: "Erro interno ao registrar saída da garagem." });
  }
};

/**
 * Retorna todos os registros de entrada e saída da garagem.
 */
export const getGarageEntries = async (req, res) => {
  try {
    const garageEntries = await Garages.findAll({
      order: [["timestamp", "DESC"]],
    });

    if (garageEntries.length === 0) {
      // Retorna um array vazio com status 200 em vez de 404 para o frontend lidar com a lista vazia
      return res.status(200).json([]);
    }
    res.status(200).json(garageEntries);
  } catch (error) {
    console.error("Erro ao buscar entradas da garagem:", error);
    res.status(500).json({ error: "Erro ao buscar entradas da garagem." });
  }
};

/**
 * Retorna o número de vagas disponíveis na garagem.
 */
export const getGarageAvailableSpots = async (req, res) => {
  try {
    const vagasDisponiveis = await getVagasDisponiveis();
    res.status(200).json({ vagasDisponiveis });
  } catch (error) {
    console.error("Erro ao obter vagas disponíveis:", error);
    res.status(500).json({ error: "Erro ao obter vagas disponíveis." });
  }
};
