import express from "express";
import database from "./database.js";
import "dotenv/config";
import cors from "cors";

const PORT = process.env.PORT || 3000;

import carRouter from "./routes/car.js";
import userRouter from "./routes/user.js";
import garageRouter from "./routes/garage.js";
import auth from "./middlewares/authMiddleware.js";

const app = express();

// 1. First add CORS middleware
app.use(cors({
  origin: 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// 2. Then add other middleware
app.use(express.json());

// 3. Then add your routes
app.use("/api", carRouter);
app.use("/api", userRouter);
app.use("/api", auth, garageRouter);

app.get("/", (req, res) => {
  res.json({ message: "Bem-vindo à API de Garagem!" });
});

app.listen(PORT, async () => {
  try {
    await database.authenticate();
    database
      .sync({ force: false }) // Use { force: false } to avoid dropping tables
      // .sync({ force: true }) // Use this only if you want to reset the database
      .then(() => console.log("Banco sincronizado!"))
      .catch((err) => console.error("Erro ao sincronizar banco:", err));
    console.log("Conexão com o banco de dados estabelecida com sucesso.");
  } catch (error) {
    console.error("Erro ao conectar ao banco de dados:", error);
  }
  console.log(`Servidor rodando em localhost:${PORT}`);
});

export default app;