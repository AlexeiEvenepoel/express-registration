// Controlador para manejar las operaciones de registro
const registrationService = require("../services/registration-service");
const schedulerService = require("../services/scheduler-service");
const { sendToAllClients } = require("../utils/sse-utils");

/**
 * Maneja la conexión SSE de un cliente
 * @param {object} req - Solicitud
 * @param {object} res - Respuesta
 * @param {function} next - Siguiente middleware
 * @param {number} clientId - ID del cliente
 */
exports.handleEvents = (req, res, clientId) => {
  // Enviar un evento inicial con el estado actual
  const initialData = {
    message: "Conexión establecida con el servidor",
    initialState: {
      isScheduled: schedulerService.getEstadoProgramacion().isScheduled,
      scheduleTime: schedulerService.getEstadoProgramacion().scheduleTime,
      config: registrationService.getConfig(),
    },
  };
  res.write(`data: ${JSON.stringify(initialData)}\n\n`);
};

/**
 * Ejecuta el registro inmediatamente
 * @param {object} req - Solicitud
 * @param {object} res - Respuesta
 */
exports.runNow = (req, res) => {
  try {
    // Actualizar configuración con datos del cliente
    registrationService.updateConfig(req.body);

    // Iniciar proceso en segundo plano
    registrationService
      .enviarMultiplesSolicitudes()
      .then(() => {
        sendToAllClients({
          message: "Proceso completado",
          complete: true,
        });
      })
      .catch((err) => {
        sendToAllClients({
          message: `Error en ejecución: ${err.message}`,
          status: { type: "error", text: "Error" },
          complete: true,
        });
      });

    // Respuesta inmediata al cliente
    const config = registrationService.getConfig();
    res.json({
      success: true,
      message: `Iniciando envío de ${config.numSolicitudes} solicitudes`,
    });
  } catch (error) {
    console.error("Error al ejecutar solicitudes:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Programa el registro para una fecha futura
 * @param {object} req - Solicitud
 * @param {object} res - Respuesta
 */
exports.schedule = (req, res) => {
  try {
    // Actualizar configuración con datos del cliente
    registrationService.updateConfig(req.body);

    // Programar tarea
    const scheduleTime = new Date(req.body.scheduleTime);
    schedulerService.programarEjecucion(scheduleTime);

    res.json({
      success: true,
      message: `Programación guardada para ${scheduleTime.toLocaleString()}`,
    });
  } catch (error) {
    console.error("Error al programar solicitudes:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Cancela una programación activa
 * @param {object} req - Solicitud
 * @param {object} res - Respuesta
 */
exports.cancel = (req, res) => {
  try {
    // Cancelar tarea programada
    const resultado = schedulerService.cancelarProgramacion();

    res.json({
      success: true,
      message: resultado
        ? "Programación cancelada"
        : "No hay programación activa para cancelar",
    });
  } catch (error) {
    console.error("Error al cancelar programación:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};
