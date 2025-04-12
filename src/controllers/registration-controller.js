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
  // Obtener información de programación para todos los usuarios
  const estadoProgramacion = schedulerService.getEstadoProgramacion();

  // Enviar un evento inicial con el estado actual
  const initialData = {
    message: "Conexión establecida con el servidor",
    initialState: {
      scheduledUsers: estadoProgramacion.scheduledUsers || [],
      scheduleInfo: estadoProgramacion.scheduleInfo || {},
      usersConfig: registrationService.getAllConfigs(),
    },
  };
  res.write(`data: ${JSON.stringify(initialData)}\n\n`);
};

/**
 * Ejecuta el registro inmediatamente para usuarios seleccionados
 * @param {object} req - Solicitud
 * @param {object} res - Respuesta
 */
exports.runNow = (req, res) => {
  try {
    const { selectedUsers, globalConfig, userConfigs } = req.body;

    if (
      !selectedUsers ||
      !Array.isArray(selectedUsers) ||
      selectedUsers.length === 0
    ) {
      return res.status(400).json({
        success: false,
        error: "No se han seleccionado usuarios",
      });
    }

    console.log("Configuración global recibida:", globalConfig);

    // Actualizar configuraciones para cada usuario seleccionado
    selectedUsers.forEach((userId) => {
      // Primero verificar que los valores sean numéricos
      const numSolicitudes = parseInt(globalConfig.numSolicitudes, 10) || 10;
      const intervalo = parseInt(globalConfig.intervalo, 10) || 100;

      const userConfig = {
        ...((userConfigs && userConfigs[userId]) || {}), // Datos específicos del usuario (dni, codigo)
        numSolicitudes: numSolicitudes, // Importante: usar valores validados
        intervalo: intervalo, // Importante: usar valores validados
        horaInicio: globalConfig.horaInicio,
      };

      console.log(`Actualizando configuración para ${userId}:`, userConfig);
      registrationService.updateConfig(userId, userConfig);
    });

    // Iniciar proceso en segundo plano para los usuarios seleccionados
    registrationService
      .enviarMultiplesSolicitudes(selectedUsers)
      .then(() => {
        sendToAllClients({
          message: "Proceso completado para todos los usuarios seleccionados",
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
    res.json({
      success: true,
      message: `Iniciando envío de solicitudes para ${
        selectedUsers.length
      } usuarios: ${selectedUsers.join(", ")}`,
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
 * Programa el registro para una fecha futura para usuarios seleccionados
 * @param {object} req - Solicitud
 * @param {object} res - Respuesta
 */
exports.schedule = (req, res) => {
  try {
    const { selectedUsers, scheduleTime, globalConfig, userConfigs } = req.body;

    if (
      !selectedUsers ||
      !Array.isArray(selectedUsers) ||
      selectedUsers.length === 0
    ) {
      return res.status(400).json({
        success: false,
        error: "No se han seleccionado usuarios para programar",
      });
    }

    if (!scheduleTime) {
      return res.status(400).json({
        success: false,
        error: "No se ha especificado una hora para programar",
      });
    }

    // Parsear explícitamente los valores numéricos
    const numSolicitudes = parseInt(globalConfig.numSolicitudes, 10) || 10;
    const intervalo = parseInt(globalConfig.intervalo, 10) || 100;

    console.log("Programando con configuración:", {
      numSolicitudes,
      intervalo,
      scheduleTime,
    });

    // Actualizar configuraciones para cada usuario seleccionado
    selectedUsers.forEach((userId) => {
      const userConfig = {
        ...((userConfigs && userConfigs[userId]) || {}), // Datos específicos del usuario (dni, codigo)
        numSolicitudes: numSolicitudes, // Usar valores globales parseados
        intervalo: intervalo,
        horaInicio: globalConfig.horaInicio,
      };

      console.log(
        `Actualizando configuración para programación de ${userId}:`,
        userConfig
      );
      registrationService.updateConfig(userId, userConfig);
    });

    // Convertir la hora programada a un objeto Date
    const scheduleDatetime = new Date(scheduleTime);

    // Programar tarea para los usuarios seleccionados
    schedulerService.programarEjecucion(selectedUsers, scheduleDatetime);

    res.json({
      success: true,
      message: `Programación guardada para ${
        selectedUsers.length
      } usuarios a las ${scheduleDatetime.toLocaleString()}`,
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
 * Cancela una programación activa para usuarios específicos
 * @param {object} req - Solicitud
 * @param {object} res - Respuesta
 */
exports.cancel = (req, res) => {
  try {
    const { selectedUsers } = req.body;

    // Si no se especifican usuarios, se cancelan todas las programaciones
    const resultado = schedulerService.cancelarProgramacion(selectedUsers);

    res.json({
      success: true,
      message: resultado
        ? "Programación cancelada para los usuarios seleccionados"
        : "No hay programaciones activas para cancelar",
    });
  } catch (error) {
    console.error("Error al cancelar programación:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Detiene la ejecución actual para usuarios específicos
 * @param {object} req - Solicitud
 * @param {object} res - Respuesta
 */
exports.stop = (req, res) => {
  try {
    const { selectedUsers } = req.body;

    // Si no se especifican usuarios, se detienen todos los procesos
    if (
      selectedUsers &&
      Array.isArray(selectedUsers) &&
      selectedUsers.length > 0
    ) {
      selectedUsers.forEach((userId) => {
        registrationService.detenerProceso(userId);
      });

      res.json({
        success: true,
        message: `Proceso detenido para los usuarios: ${selectedUsers.join(
          ", "
        )}`,
      });
    } else {
      registrationService.detenerTodosProcesos();

      res.json({
        success: true,
        message: "Todos los procesos han sido detenidos",
      });
    }
  } catch (error) {
    console.error("Error al detener procesos:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Guarda o actualiza configuraciones de usuario
 * @param {object} req - Solicitud
 * @param {object} res - Respuesta
 */
exports.saveUserConfigs = (req, res) => {
  try {
    const { userConfigs, globalConfig } = req.body;

    console.log("Recibida configuración global para guardar:", globalConfig);
    console.log(
      "Valores específicos - numSolicitudes:",
      globalConfig.numSolicitudes,
      "intervalo:",
      globalConfig.intervalo
    );

    // Determinar los valores numéricos para asegurar que sean correctos
    const numSolicitudes = parseInt(globalConfig.numSolicitudes, 10) || 10;
    const intervalo = parseInt(globalConfig.intervalo, 10) || 100;

    console.log(
      "Valores parseados - numSolicitudes:",
      numSolicitudes,
      "intervalo:",
      intervalo
    );

    // Guardar configuraciones globales para usuarios existentes
    Object.keys(registrationService.getAllConfigs()).forEach((userId) => {
      registrationService.updateConfig(userId, {
        numSolicitudes: numSolicitudes,
        intervalo: intervalo,
        horaInicio: globalConfig.horaInicio,
      });
    });

    // Guardar configuraciones específicas para cada usuario
    if (userConfigs) {
      Object.entries(userConfigs).forEach(([userId, config]) => {
        registrationService.updateConfig(userId, {
          ...config,
          numSolicitudes: numSolicitudes,
          intervalo: intervalo,
        });
      });
    }

    res.json({
      success: true,
      message: `Configuraciones actualizadas: ${numSolicitudes} solicitudes, ${intervalo}ms`,
      configs: registrationService.getAllConfigs(),
    });
  } catch (error) {
    console.error("Error al guardar configuraciones:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};
