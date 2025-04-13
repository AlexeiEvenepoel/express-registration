// Servicio para manejar el registro automatizado en el comedor UNCP
const axios = require("axios");
const FormData = require("form-data");
const { apiUrl } = require("../config/app-config");
const { sendToAllClients } = require("../utils/sse-utils");

// Estado del registro
const registrosActivos = new Map(); // userId -> boolean
const userConfigs = new Map(); // userId -> configuración
const procesosActuales = new Map(); // userId -> info de proceso en ejecución

/**
 * Actualiza la configuración del servicio para un usuario específico
 * @param {string} userId - ID del usuario
 * @param {object} newConfig - Nueva configuración
 */
function updateConfig(userId, newConfig) {
  if (!userConfigs.has(userId)) {
    userConfigs.set(userId, {});
  }

  const currentConfig = userConfigs.get(userId);

  if (newConfig) {
    // Siempre convertir explícitamente a números enteros
    let numSolicitudes = 10;
    let intervalo = 100;

    if (newConfig.numSolicitudes !== undefined) {
      numSolicitudes = parseInt(newConfig.numSolicitudes, 10);
      if (isNaN(numSolicitudes)) numSolicitudes = 10;
    } else if (currentConfig.numSolicitudes) {
      numSolicitudes = parseInt(currentConfig.numSolicitudes, 10);
    }

    if (newConfig.intervalo !== undefined) {
      intervalo = parseInt(newConfig.intervalo, 10);
      if (isNaN(intervalo)) intervalo = 100;
    } else if (currentConfig.intervalo) {
      intervalo = parseInt(currentConfig.intervalo, 10);
    }

    console.log(`Actualizando configuración para ${userId}:`, {
      numSolicitudes,
      intervalo,
      prevNumSolicitudes: currentConfig.numSolicitudes,
      prevIntervalo: currentConfig.intervalo,
    });

    userConfigs.set(userId, {
      ...currentConfig,
      dni: newConfig.dni ?? currentConfig.dni,
      codigo: newConfig.codigo ?? currentConfig.codigo,
      numSolicitudes: numSolicitudes,
      intervalo: intervalo,
      horaInicio: newConfig.horaInicio ?? currentConfig.horaInicio,
    });

    console.log(`Configuración actualizada para ${userId}:`, {
      numSolicitudes,
      intervalo,
    });
  }
}

/**
 * Inicializa la configuración por defecto para un usuario específico
 * @param {string} userId - ID del usuario
 * @param {object} defaultConfig - Configuración por defecto
 */
function initialize(userId, defaultConfig) {
  userConfigs.set(userId, { ...defaultConfig });
  registrosActivos.set(userId, false);
}

/**
 * Inicializa múltiples usuarios a partir de un objeto de configuraciones
 * @param {Object} configs - Objeto con userId como clave y configuración como valor
 */
function initializeUsers(configs) {
  if (!configs) return;

  Object.entries(configs).forEach(([userId, config]) => {
    initialize(userId, config);
  });
}

/**
 * Realiza una solicitud al servidor del comedor
 * @param {string} userId - ID del usuario
 * @param {number} indice - Índice de la solicitud actual
 * @returns {Promise<object|null>} - Resultado de la solicitud o null en caso de error
 */
async function enviarSolicitud(userId, indice) {
  const config = userConfigs.get(userId);
  if (!config) {
    sendToAllClients({
      message: `Error: No hay configuración para el usuario ${userId}`,
      userId,
      status: { type: "error", text: "Error de configuración" },
    });
    return null;
  }

  try {
    console.log(
      `[Usuario ${userId}] Enviando solicitud ${indice + 1}/${
        config.numSolicitudes
      }...`
    );

    // Datos para enviar
    const postData = {
      t1_id: null,
      t1_dni: config.dni,
      t1_codigo: config.codigo,
      t1_nombres: "",
      t1_escuela: "",
      t1_estado: null,
      t3_periodos_t3_id: null,
    };

    // Crear un FormData y añadir el campo "data" con el JSON
    const form = new FormData();
    form.append("data", JSON.stringify(postData));

    const response = await axios.post(apiUrl, form, {
      headers: {
        ...form.getHeaders(),
        Referer: "https://comensales.uncp.edu.pe/",
      },
    });

    const mensaje = `[Usuario ${userId}] Solicitud ${
      indice + 1
    }: ${JSON.stringify(response.data)}`;
    console.log(mensaje);
    sendToAllClients({
      message: mensaje,
      userId,
    });

    return response.data;
  } catch (error) {
    console.error(
      `[Usuario ${userId}] Error en solicitud ${indice + 1}:`,
      error.message
    );

    let errorMsg = `[Usuario ${userId}] Error en solicitud ${indice + 1}: ${
      error.message
    }`;
    if (error.response) {
      errorMsg += ` - ${JSON.stringify(error.response.data)}`;
    }

    sendToAllClients({
      message: errorMsg,
      userId,
      status: { type: "error", text: "Error" },
    });
    return null;
  }
}

/**
 * Envía múltiples solicitudes con un intervalo específico para un usuario
 * @param {string} userId - ID del usuario
 * @returns {Promise<Array>} - Resultados de las solicitudes
 */
async function enviarMultiplesSolicitudesPorUsuario(userId) {
  const config = userConfigs.get(userId);
  if (!config) {
    sendToAllClients({
      message: `Error: No hay configuración para el usuario ${userId}`,
      userId,
      status: { type: "error", text: "Error de configuración" },
    });
    return [];
  }

  // Asegurar la conversión a números y registrar para depuración
  console.log(`Configuración para ${userId} antes de enviar:`, config);

  // Obtener valores numéricos asegurando el parseo correcto
  let numSolicitudes = config.numSolicitudes;
  try {
    numSolicitudes = parseInt(config.numSolicitudes, 10);
    if (isNaN(numSolicitudes)) numSolicitudes = 10;
  } catch (e) {
    numSolicitudes = 10;
    console.error(`Error al parsear numSolicitudes para ${userId}:`, e);
  }

  let intervalo = config.intervalo;
  try {
    intervalo = parseInt(config.intervalo, 10);
    if (isNaN(intervalo)) intervalo = 100;
  } catch (e) {
    intervalo = 100;
    console.error(`Error al parsear intervalo para ${userId}:`, e);
  }

  console.log(
    `[Usuario ${userId}] Valores finales: numSolicitudes=${numSolicitudes}, intervalo=${intervalo}`
  );

  console.log(
    `[Usuario ${userId}] Iniciando envío de ${numSolicitudes} solicitudes con intervalo de ${intervalo}ms`
  );

  sendToAllClients({
    message: `[Usuario ${userId}] Iniciando envío de ${numSolicitudes} solicitudes con intervalo de ${intervalo}ms`,
    userId,
    status: { type: "active", text: "Ejecutando solicitudes..." },
  });

  let exitosoCount = 0;
  const resultados = [];

  // Establecer estado activo para este usuario
  registrosActivos.set(userId, true);

  // Guardar información del proceso
  procesosActuales.set(userId, {
    startTime: new Date(),
    totalSolicitudes: numSolicitudes,
    completadas: 0,
    exitosas: 0,
  });

  for (let i = 0; i < numSolicitudes; i++) {
    // Verificar si se detuvo el proceso para este usuario específico
    if (!registrosActivos.get(userId)) {
      sendToAllClients({
        message: `[Usuario ${userId}] Proceso cancelado por el usuario`,
        userId,
        status: { type: "inactive", text: "Cancelado" },
      });
      break;
    }

    const resultado = await enviarSolicitud(userId, i);

    // Actualizar información del proceso
    const procesoInfo = procesosActuales.get(userId);
    if (procesoInfo) {
      procesoInfo.completadas++;
    }

    if (resultado) {
      resultados.push(resultado);
      if (resultado.code !== 500) {
        exitosoCount++;
        if (procesoInfo) {
          procesoInfo.exitosas++;
        }
      }
    }

    // Esperar el intervalo antes de la siguiente solicitud
    if (i < numSolicitudes - 1 && registrosActivos.get(userId)) {
      await new Promise((resolve) => setTimeout(resolve, intervalo));
    }
  }

  const mensaje = `[Usuario ${userId}] Proceso completado. ${exitosoCount} de ${numSolicitudes} solicitudes exitosas.`;
  console.log(mensaje);
  sendToAllClients({
    message: mensaje,
    userId,
    complete: true,
    status: { type: "inactive", text: "Inactivo" },
  });

  // Restablecer estado para este usuario
  registrosActivos.set(userId, false);
  procesosActuales.delete(userId);

  return resultados;
}

/**
 * Envía solicitudes para múltiples usuarios en paralelo
 * @param {Array<string>} userIds - Lista de IDs de usuario
 * @returns {Promise<Object>} - Resultados por usuario
 */
async function enviarMultiplesSolicitudes(userIds) {
  if (!Array.isArray(userIds) || userIds.length === 0) {
    console.error("No se han proporcionado usuarios para enviar solicitudes");
    return {};
  }

  sendToAllClients({
    message: `📊 Iniciando envío de solicitudes para ${
      userIds.length
    } usuarios: ${userIds.join(", ")}`,
  });

  // Procesar cada usuario en paralelo usando Promise.all
  const resultados = await Promise.all(
    userIds.map(async (userId) => {
      const resultadoUsuario = await enviarMultiplesSolicitudesPorUsuario(
        userId
      );
      return { userId, resultados: resultadoUsuario };
    })
  );

  sendToAllClients({
    message: `Proceso completado para todos los usuarios: ${userIds.join(
      ", "
    )}`,
    complete: true,
  });

  // Convertir a un objeto donde las claves son los userIds
  return resultados.reduce((acc, { userId, resultados }) => {
    acc[userId] = resultados;
    return acc;
  }, {});
}

/**
 * Detiene el proceso de envío de solicitudes para un usuario específico o todos
 * @param {string} [userId] - ID del usuario (opcional, si no se especifica, detiene todos)
 */
function detenerProceso(userId) {
  if (userId) {
    registrosActivos.set(userId, false);
    console.log(`Proceso detenido para usuario: ${userId}`);
  } else {
    // Detener todos los procesos
    for (const [id, _] of registrosActivos) {
      registrosActivos.set(id, false);
    }
    console.log("Todos los procesos han sido detenidos");
  }
}

/**
 * Detiene todos los procesos activos
 */
function detenerTodosProcesos() {
  for (const [id, _] of registrosActivos) {
    registrosActivos.set(id, false);
  }
  console.log("Todos los procesos han sido detenidos");
}

/**
 * Obtiene la configuración actual para un usuario específico
 * @param {string} userId - ID del usuario
 * @returns {object|null} - Configuración actual o null si no existe
 */
function getConfig(userId) {
  return userConfigs.has(userId) ? { ...userConfigs.get(userId) } : null;
}

/**
 * Obtiene todas las configuraciones de usuarios
 * @returns {object} - Mapa de userId a configuración
 */
function getAllConfigs() {
  const configs = {};
  userConfigs.forEach((config, userId) => {
    configs[userId] = { ...config };
  });
  return configs;
}

/**
 * Verifica si un usuario tiene un proceso activo
 * @param {string} userId - ID del usuario
 * @returns {boolean} - true si está activo, false en caso contrario
 */
function isProcessActive(userId) {
  return registrosActivos.get(userId) === true;
}

/**
 * Obtiene información sobre los procesos activos
 * @returns {object} - Información de procesos activos por usuario
 */
function getActiveProcesses() {
  const activos = {};
  registrosActivos.forEach((isActive, userId) => {
    if (isActive) {
      activos[userId] = procesosActuales.get(userId) || { active: true };
    }
  });
  return activos;
}

module.exports = {
  initialize,
  initializeUsers,
  updateConfig,
  enviarSolicitud,
  enviarMultiplesSolicitudesPorUsuario,
  enviarMultiplesSolicitudes,
  detenerProceso,
  detenerTodosProcesos,
  getConfig,
  getAllConfigs,
  isProcessActive,
  getActiveProcesses,
};
