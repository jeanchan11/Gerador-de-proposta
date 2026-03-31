import express from "express";
import path from "path";
import cors from "cors";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
// Serve os arquivos estáticos da pasta dist
app.use(express.static(path.join(__dirname, "dist")));

// Rota para o Health Check (ajuda a Hostinger a saber que o app está vivo)
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// Qualquer outra rota redireciona para o index.html (essencial para React)
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
