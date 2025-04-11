// Servicio para manejar el registro automatizado en el comedor UNCP
const axios = require("axios");
const FormData = require("form-data");
const { apiUrl } = require("../config/app-config");
const { sendToAllClients } = require("../utils/sse-utils");

// Estado del registro
let registroActivo = false;
let config = {};

/**
 * Actualiza la configuración del servicio
 * @param {object} newConfig - Nueva configuración
 */
function updateConfig(newConfig) {
  if (newConfig) {
    config = {
      ...config,
      dni: newConfig.dni || config.dni,
      codigo: newConfig.codigo || config.codigo,
      numSolicitudes: newConfig.numSolicitudes || config.numSolicitudes,
      intervalo: newConfig.intervalo || config.intervalo,
      horaInicio: newConfig.horaInicio || config.horaInicio,
    };
  }
}

/**
 * Inicializa el servicio con la configuración por defecto
 * @param {object} defaultConfig - Configuración por defecto
 */
function initialize(defaultConfig) {
  config = { ...defaultConfig };
}

/**
 * Realiza una solicitud al servidor del comedor
 * @param {number} indice - Índice de la solicitud actual
 * @returns {Promise<object|null>} - Resultado de la solicitud o null en caso de error
 */
async function enviarSolicitud(indice) {
  try {
    console.log(`Enviando solicitud ${indice + 1}/${config.numSolicitudes}...`);

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

    const mensaje = `Solicitud ${indice + 1}: ${JSON.stringify(response.data)}`;
    console.log(mensaje);
    sendToAllClients({ message: mensaje });

    return response.data;
  } catch (error) {
    console.error(`Error en solicitud ${indice + 1}:`, error.message);

    let errorMsg = `Error en solicitud ${indice + 1}: ${error.message}`;
    if (error.response) {
      errorMsg += ` - ${JSON.stringify(error.response.data)}`;
    }

    sendToAllClients({ message: errorMsg });
    return null;
  }
}

/**
 * Envía múltiples solicitudes con un intervalo específico
 * @returns {Promise<Array>} - Resultados de las solicitudes
 */
async function enviarMultiplesSolicitudes() {
  const numSolicitudes = config.numSolicitudes;
  const intervalo = config.intervalo;

  console.log(
    `Iniciando envío de ${numSolicitudes} solicitudes con intervalo de ${intervalo}ms`
  );

  sendToAllClients({
    message: `Iniciando envío de ${numSolicitudes} solicitudes con intervalo de ${intervalo}ms`,
    status: { type: "active", text: "Ejecutando solicitudes..." },
  });

  let exitosoCount = 0;
  const resultados = [];

  // Establecer estado activo
  registroActivo = true;

  for (let i = 0; i < numSolicitudes; i++) {
    if (!registroActivo) {
      sendToAllClients({
        message: "Proceso cancelado por el usuario",
      });
      break;
    }

    const resultado = await enviarSolicitud(i);

    if (resultado) {
      resultados.push(resultado);
      if (resultado.code !== 500) {
        exitosoCount++;
      }
    }

    // Esperar el intervalo antes de la siguiente solicitud
    if (i < numSolicitudes - 1 && registroActivo) {
      await new Promise((resolve) => setTimeout(resolve, intervalo));
    }
  }

  const mensaje = `Proceso completado. ${exitosoCount} de ${numSolicitudes} solicitudes exitosas.`;
  console.log(mensaje);
  sendToAllClients({
    message: mensaje,
    complete: true,
    status: { type: "inactive", text: "Inactivo" },
  });

  // Restablecer estado
  registroActivo = false;

  return resultados;
}

/**
 * Detiene el proceso de envío de solicitudes
 */
function detenerProceso() {
  registroActivo = false;
}

/**
 * Obtiene la configuración actual
 * @returns {object} - Configuración actual
 */
function getConfig() {
  return { ...config };
}

module.exports = {
  initialize,
  updateConfig,
  enviarSolicitud,
  enviarMultiplesSolicitudes,
  detenerProceso,
  getConfig,
};
