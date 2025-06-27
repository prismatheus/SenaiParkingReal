  // controllers/garage.js
  import Garages from "../models/garage.js";
  import jwt from "jsonwebtoken";
  import "dotenv/config";
  // Import the async function directly
  import { VAGAS_MAXIMAS, getVagasDisponiveis } from "../Services/vagas.js";
  const secret = process.env.KEYWORD;

  export const registerGarageEntry = async (req, res) => {
    const { carId } = req.body; // carId is for the entry being registered
    const userId = req.user.id; // The admin user who is performing the action

    if (req.user.type !== "admin") {
      console.log(req.user);
      
      return res
        .status(403)
        .json({
          error:
            "Acesso negado. Apenas administradores podem registrar entradas.",
        });
    }
    if (!carId) {
      return res.status(400).json({ error: "ID do carro é obrigatório." });
    }

    try {
      // --- 1. Check for available spots using the service ---
      const vagasDisponiveis = await getVagasDisponiveis(); // AWAIT the async function

      if (vagasDisponiveis <= 0) {
        return res
          .status(400)
          .json({ error: "Garagem cheia. Não há vagas disponíveis." });
      }

      // --- 2. Check if the car is already currently in the garage ---
      // We need to count existing active 'entrada' records that haven't been 'balanced' by a 'saida'
      // This logic will depend on how you pair entrada/saida.
      // If each 'entrada' corresponds to a 'saida' for the same car, we need to check that.
      // A simple check: does an 'entrada' for this car exist without a corresponding 'saida' yet?
      // This is the tricky part with 'tipo' based system. Let's assume a car is 'in' if its last event was an 'entrada'.

      // Find the last event for this car
      const lastCarEvent = await Garages.findOne({
        where: { carId },
        order: [["timestamp", "DESC"]], // Assuming 'timestamp' field exists in Garages model
      });

      if (
        lastCarEvent &&
        lastCarEvent.tipo === "entrada" &&
        lastCarEvent.autorizado === true
      ) {
        return res
          .status(400)
          .json({
            error:
              "Este carro já está estacionado na garagem (último evento foi uma entrada autorizada).",
          });
      }

      // --- 3. Create the new 'entrada' record ---
      const newEntry = await Garages.create({
        carId,
        userId, // The admin registering
        tipo: "entrada",
        autorizado: true, // Assuming registration means it's authorized
        timestamp: new Date(), // Record the event time
      });

      res.status(201).json(newEntry);
    } catch (error) {
      console.error("Erro ao registrar entrada na garagem:", error);
      res.status(500).json({ error: "Erro ao registrar entrada na garagem." });
    }
  };

  // --- New function for registering car exit based on 'tipo: "saida"' ---
  export const registerGarageExit = async (req, res) => {
    const { carId } = req.body; // We need the carId to register an exit
    const userId = req.user.id; // The admin user who is performing the action

    if (req.user.type !== "admin") {
      return res
        .status(403)
        .json({
          error: "Acesso negado. Apenas administradores podem registrar saídas.",
        });
    }
    if (!carId) {
      return res.status(400).json({ error: "ID do carro é obrigatório." });
    }

    try {
      // Find the last authorized entry for this car that hasn't been exited yet
      // This logic assumes a simple "last in, first out" or that each entry needs a specific exit.
      // It's more robust to find the LATEST *entrada* for this car that is *still balanced by a "saida" record*.
      // The getVagasDisponiveis calculates (entradas - saidas), so we need to ensure this car is indeed "in".

      // More robust check for car presence:
      // Count entries and exits for this car. If entries > exits, car is inside.
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
            error:
              "Este carro não está atualmente na garagem (ou já registrou saída).",
          });
      }

      // Create the new 'saida' record
      const newExit = await Garages.create({
        carId,
        userId, // The admin registering
        tipo: "saida",
        autorizado: true, // Assuming registration means it's authorized
        timestamp: new Date(), // Record the event time
      });

      res.status(201).json(newExit);
    } catch (error) {
      console.error("Erro ao registrar saída da garagem:", error);
      res.status(500).json({ error: "Erro ao registrar saída da garagem." });
    }
  };

  export const getGarageEntries = async (req, res) => {
    const userId = req.user.id; // Assuming admin's ID
    try {
      // You can fetch all entries for the single garage
      const garageEntries = await Garages.findAll({
        // Optionally, filter by userId if an admin only sees entries they registered
        // where: { userId: userId },
        order: [["timestamp", "DESC"]], // Order by most recent event
      });

      if (garageEntries.length === 0) {
        return res
          .status(404)
          .json({ error: "Nenhuma entrada/saída na garagem encontrada." });
      }
      res.status(200).json(garageEntries);
    } catch (error) {
      console.error("Erro ao buscar entradas da garagem:", error);
      res.status(500).json({ error: "Erro ao buscar entradas da garagem." });
    }
  };

  export const getGarageAvailableSpots = async (req, res) => {
    try {
      const vagasDisponiveis = await getVagasDisponiveis(); // AWAIT the async function
      res.status(200).json({ vagasDisponiveis });
    } catch (error) {
      console.error("Erro ao obter vagas disponíveis:", error);
      res.status(500).json({ error: "Erro ao obter vagas disponíveis." });
    }
  }
