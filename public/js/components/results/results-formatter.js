/**
 * Formateo y presentación de mensajes
 */
import { getMessageClasses } from "./results-types.js";
import {
  highlightSearchTerm,
  isExpandableMessage,
  extractJsonContent,
} from "../../utils/message-utils.js";

/**
 * Formatea una marca de tiempo
 * @param {string} timestamp - Timestamp en formato HH:MM:SS
 * @returns {string} - HTML formateado
 */
export function formatTimestamp(timestamp) {
  if (!timestamp) return "";

  // Separa la hora de los segundos para destacar la hora
  return timestamp.replace(
    /(\d+):(\d+):(\d+)/,
    '<span class="text-primary">$1:$2</span><span class="text-gray-500">:$3</span>'
  );
}

/**
 * Crea un elemento de mensaje para mostrar en la lista
 * @param {Object} messageData - Datos del mensaje
 * @param {string} searchTerm - Término de búsqueda actual
 * @param {boolean} isCompactMode - Si está en modo compacto
 * @returns {HTMLElement} - Elemento del mensaje
 */
export function createMessageElement(
  messageData,
  searchTerm = "",
  isCompactMode = false
) {
  const { id, timestamp, message, type } = messageData;

  // Crear contenedor del mensaje
  const messageEl = document.createElement("div");

  // Obtener clases según el tipo
  const classes = getMessageClasses(type);

  // Establecer clases base
  messageEl.className = `border-l-4 ${classes.border} rounded-r-md p-2 ${classes.bgHover} transition-all duration-200 relative group`;
  messageEl.id = `message-${id}`;

  // Si es un mensaje reciente (menos de 2 segundos), agregar clase de animación
  if (Date.now() - id < 2000) {
    messageEl.classList.add("animate-pulse-once");
  }

  // Si está en modo compacto, ajustar espaciado
  if (isCompactMode) {
    messageEl.classList.add("py-1", "text-xs");
  }

  // Formatear el contenido
  let messageContent = message;
  if (searchTerm) {
    messageContent = highlightSearchTerm(messageContent, searchTerm);
  }

  // Determinar si el mensaje debe ser expandible
  const expandable = isExpandableMessage(message);

  if (expandable) {
    // Extraer JSON si existe
    const jsonContent = extractJsonContent(message);

    // Crear estructura para mensaje expandible
    messageEl.innerHTML = `
      <div class="flex items-start">
        <span class="text-gray-400 text-xs mr-2">${formatTimestamp(
          timestamp
        )}</span>
        <i class="fas ${classes.icon} mx-1.5 ${
      isCompactMode ? "text-xs" : ""
    }"></i>
        <div class="flex-1">
          <div class="flex justify-between items-start">
            <div class="message-content text-white">${messageContent}</div>
            <button class="expand-toggle text-gray-400 hover:text-white ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <i class="fas fa-chevron-down text-xs"></i>
            </button>
          </div>
          <div class="message-details hidden mt-2 pt-2 border-t border-gray-700">
            ${
              jsonContent
                ? `<pre class="bg-gray-800 p-2 rounded text-xs overflow-x-auto">${jsonContent}</pre>`
                : ""
            }
          </div>
        </div>
      </div>
    `;

    // Agregar evento para expandir/contraer
    const toggleBtn = messageEl.querySelector(".expand-toggle");
    const detailsSection = messageEl.querySelector(".message-details");

    toggleBtn.addEventListener("click", () => {
      detailsSection.classList.toggle("hidden");
      toggleBtn.querySelector("i").classList.toggle("fa-chevron-down");
      toggleBtn.querySelector("i").classList.toggle("fa-chevron-up");
    });
  } else {
    // Mensaje normal (no expandible)
    messageEl.innerHTML = `
      <div class="flex items-start">
      <span class="text-gray-400 text-xs mr-2">${formatTimestamp(
        timestamp
      )}</span>
      <i class="fas ${classes.icon} mx-1.5 ${
      isCompactMode ? "text-xs" : ""
    }"></i>
      <div class="message-content text-white">${messageContent}</div>
      </div>
    `;
  }

  return messageEl;
}

/**
 * Crea un badge para mostrar contador por tipo de mensaje
 * @param {string} type - Tipo de mensaje
 * @param {number} count - Cantidad
 * @returns {HTMLElement} - Elemento badge
 */
export function createTypeBadge(type, count) {
  const badge = document.createElement("span");

  // Estilos según tipo
  let classes = "text-xs px-1.5 py-0.5 rounded-full font-medium";

  switch (type) {
    case "success":
      classes += " bg-green-100 text-green-800";
      break;
    case "error":
      classes += " bg-red-100 text-red-800";
      break;
    case "warning":
      classes += " bg-yellow-100 text-yellow-800";
      break;
    case "info":
      classes += " bg-blue-100 text-blue-800";
      break;
  }

  badge.className = classes;
  badge.textContent = count;

  return badge;
}
