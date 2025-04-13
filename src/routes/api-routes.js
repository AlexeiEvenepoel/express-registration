// Rutas de la API para el sistema de registro
const express = require("express");
const router = express.Router();
const registrationController = require("../controllers/registration-controller");
const { registerClient, removeClient } = require("../utils/sse-utils");

// Endpoint para recibir eventos del servidor (SSE)
router.get("/events", (req, res) => {
  // Registrar cliente
  const clientId = registerClient(res);

  // Usar el controlador para manejar la conexión inicial
  registrationController.handleEvents(req, res, clientId);

  // Eliminar cliente cuando se desconecte
  req.on("close", () => {
    removeClient(clientId);
  });
});

// Endpoint para ejecutar solicitudes inmediatamente con usuarios seleccionados
router.post("/run-now", registrationController.runNow);

// Endpoint para programar solicitudes para usuarios seleccionados
router.post("/schedule", registrationController.schedule);

// Endpoint para cancelar programación de usuarios seleccionados
router.post("/cancel", registrationController.cancel);

// Nuevo endpoint para detener procesos en ejecución
router.post("/stop", registrationController.stop);

// Nuevo endpoint para guardar configuraciones de usuarios
router.post("/save-configs", registrationController.saveUserConfigs);

module.exports = router;
