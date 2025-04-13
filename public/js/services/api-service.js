/**
 * Servicio para comunicación con la API
 */

/**
 * Ejecuta solicitudes de registro inmediatamente para usuarios seleccionados
 * @param {Array<string>} selectedUsers - IDs de los usuarios seleccionados
 * @param {Object} globalConfig - Configuración global (intervalo, numSolicitudes)
 * @param {Object} userConfigs - Configuraciones específicas de usuarios
 * @returns {Promise<Object>} - Respuesta del servidor
 */
export async function runNowRequest(selectedUsers, globalConfig, userConfigs) {
  try {
    const response = await fetch("/api/run-now", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        selectedUsers,
        globalConfig,
        userConfigs,
      }),
    });
    return await response.json();
  } catch (error) {
    console.error("Error al ejecutar las solicitudes:", error);
    throw error;
  }
}

/**
 * Programa solicitudes de registro para una fecha específica para usuarios seleccionados
 * @param {Array<string>} selectedUsers - IDs de los usuarios seleccionados
 * @param {Object} globalConfig - Configuración global (intervalo, numSolicitudes)
 * @param {Object} userConfigs - Configuraciones específicas de usuarios
 * @param {Date} scheduleTime - Fecha y hora programada
 * @returns {Promise<Object>} - Respuesta del servidor
 */
export async function scheduleRequest(
  selectedUsers,
  globalConfig,
  userConfigs,
  scheduleTime
) {
  try {
    const response = await fetch("/api/schedule", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        selectedUsers,
        globalConfig,
        userConfigs,
        scheduleTime: scheduleTime.toISOString(),
      }),
    });
    return await response.json();
  } catch (error) {
    console.error("Error al programar las solicitudes:", error);
    throw error;
  }
}

/**
 * Cancela la programación de solicitudes para usuarios específicos
 * @param {Array<string>} selectedUsers - IDs de los usuarios seleccionados (opcional)
 * @returns {Promise<Object>} - Respuesta del servidor
 */
export async function cancelSchedule(selectedUsers) {
  try {
    const response = await fetch("/api/cancel", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ selectedUsers }),
    });
    return await response.json();
  } catch (error) {
    console.error("Error al cancelar la programación:", error);
    throw error;
  }
}

/**
 * Detiene procesos en ejecución para usuarios específicos
 * @param {Array<string>} selectedUsers - IDs de los usuarios seleccionados (opcional)
 * @returns {Promise<Object>} - Respuesta del servidor
 */
export async function stopExecution(selectedUsers) {
  try {
    const response = await fetch("/api/stop", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ selectedUsers }),
    });
    return await response.json();
  } catch (error) {
    console.error("Error al detener los procesos:", error);
    throw error;
  }
}

/**
 * Guarda configuraciones de usuario
 * @param {Object} userConfigs - Mapa de ID de usuario a su configuración específica
 * @param {Object} globalConfig - Configuración global
 * @returns {Promise<Object>} - Respuesta del servidor
 */
export async function saveUserConfigs(userConfigs, globalConfig) {
  try {
    const response = await fetch("/api/save-configs", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userConfigs,
        globalConfig,
      }),
    });
    return await response.json();
  } catch (error) {
    console.error("Error al guardar configuraciones:", error);
    throw error;
  }
}

/**
 * Configura el listener de eventos SSE
 * @param {Function} onMessage - Función que maneja los mensajes recibidos
 * @param {Function} onError - Función que maneja los errores
 * @returns {EventSource} - Instancia de EventSource
 */
export function setupEventSource(onMessage, onError) {
  const eventSource = new EventSource("/api/events");

  // Configurar manejador de mensajes
  eventSource.onmessage = (event) => {
    const data = JSON.parse(event.data);
    onMessage(data);
  };

  // Configurar manejador de errores
  eventSource.onerror = (error) => {
    eventSource.close();
    if (onError) {
      onError(error);
    }
  };

  return eventSource;
}
