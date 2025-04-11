/**
 * Componentes de la interfaz de usuario
 */

/**
 * Actualiza el reloj con la hora actual
 * @param {HTMLElement} clockElement - Elemento DOM donde se muestra el reloj
 */
export function updateClock(clockElement) {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");
  clockElement.textContent = `${hours}:${minutes}:${seconds}`;
}

/**
 * Inicia el reloj y devuelve el identificador del intervalo
 * @param {HTMLElement} clockElement - Elemento DOM donde se muestra el reloj
 * @returns {number} - ID del intervalo para poder cancelarlo si es necesario
 */
export function initClock(clockElement) {
  updateClock(clockElement);
  return setInterval(() => updateClock(clockElement), 1000);
}

/**
 * Establece el estado visual
 * @param {HTMLElement} statusElement - Elemento de estado
 * @param {string} type - Tipo de estado (active, scheduled, error, inactive)
 * @param {string} text - Texto a mostrar
 */
export function setStatus(statusElement, type, text) {
  statusElement.textContent = text;
  statusElement.className = "status-indicator";

  if (type === "active") {
    statusElement.classList.add("status-active");
  } else if (type === "scheduled") {
    statusElement.classList.add("status-scheduled");
  } else if (type === "error") {
    statusElement.classList.add("status-error");
  }
}

/**
 * Añade un mensaje al área de resultados
 * @param {HTMLElement} resultsElement - Elemento donde se muestran los resultados
 * @param {string} message - Mensaje a añadir
 */
export function addToResults(resultsElement, message) {
  const timestamp = new Date().toLocaleTimeString();
  resultsElement.textContent = `[${timestamp}] ${message}\n${resultsElement.textContent}`;
}

/**
 * Limpia el área de resultados
 * @param {HTMLElement} resultsElement - Elemento de resultados
 */
export function clearResults(resultsElement) {
  resultsElement.textContent = "Los resultados se mostrarán aquí...";
}

/**
 * Formatea una fecha para mostrarla al usuario
 * @param {Date} date - Fecha a formatear
 * @returns {string} - Fecha formateada
 */
export function formatDate(date) {
  return date.toLocaleString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });
}
