// Aplicación principal del sistema de registro automatizado
const express = require("express");
const path = require("path");
const { PORT, defaultConfig } = require("./config/app-config");
const apiRoutes = require("./routes/api-routes");
const registrationService = require("./services/registration-service");

// Crear la aplicación Express
const app = express();

// Middleware
app.use(express.static(path.join(__dirname, "..", "public")));
app.use(express.json());

// Inicializar servicios
registrationService.initialize(defaultConfig);

// Rutas de la API
app.use("/api", apiRoutes);

// Ruta para servir el archivo HTML principal
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "index.html"));
});

// Manejo de comandos de línea para la ejecución inmediata
const args = process.argv.slice(2);
if (args.includes("--ahora")) {
  console.log("Ejecutando registro inmediato desde la línea de comandos");
  registrationService
    .enviarMultiplesSolicitudes()
    .then(() => {
      console.log("Proceso de registro inmediato completado desde CLI");
    })
    .catch((err) => {
      console.error("Error en registro inmediato desde CLI:", err);
    });
}

module.exports = app;
