/**
 * Servicio para comunicación con la API
 */

/**
 * Ejecuta solicitudes de registro inmediatamente
 * @param {Object} params - Parámetros para el registro
 * @returns {Promise<Object>} - Respuesta del servidor
 */
export async function runNowRequest(params) {
  try {
    const response = await fetch("/api/run-now", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(params),
    });
    return await response.json();
  } catch (error) {
    console.error("Error al ejecutar las solicitudes:", error);
    throw error;
  }
}

/**
 * Programa solicitudes de registro para una fecha específica
 * @param {Object} params - Parámetros para el registro
 * @param {Date} scheduleTime - Fecha y hora programada
 * @returns {Promise<Object>} - Respuesta del servidor
 */
export async function scheduleRequest(params, scheduleTime) {
  try {
    const response = await fetch("/api/schedule", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...params,
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
 * Cancela la programación de solicitudes
 * @returns {Promise<Object>} - Respuesta del servidor
 */
export async function cancelSchedule() {
  try {
    const response = await fetch("/api/cancel", { method: "POST" });
    return await response.json();
  } catch (error) {
    console.error("Error al cancelar la programación:", error);
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
