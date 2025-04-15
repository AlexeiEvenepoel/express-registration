/**
 * Clasificación y gestión de tipos de mensajes
 */
import { getMessageType } from "../../utils/message-utils.js";

/**
 * Obtiene los estilos Tailwind para un tipo de mensaje
 * @param {string} type - Tipo de mensaje (success, error, warning, info)
 * @returns {Object} - Objeto con clases y estilos
 */
export function getMessageClasses(type) {
  switch (type) {
    case "success":
      return {
        border: "border-l-green-500",
        icon: "fa-check-circle text-green-500",
        bgHover: "hover:bg-green-500/5",
      };
    case "error":
      return {
        border: "border-l-red-500",
        icon: "fa-times-circle text-red-500",
        bgHover: "hover:bg-red-500/5",
      };
    case "warning":
      return {
        border: "border-l-yellow-500",
        icon: "fa-exclamation-triangle text-yellow-500",
        bgHover: "hover:bg-yellow-500/5",
      };
    case "info":
    default:
      return {
        border: "border-l-blue-500",
        icon: "fa-info-circle text-blue-500",
        bgHover: "hover:bg-blue-500/5",
      };
  }
}

/**
 * Filtra mensajes según criterios
 * @param {Array} messages - Lista de mensajes a filtrar
 * @param {Array} activeTypes - Tipos de mensajes activos
 * @param {string} searchTerm - Término de búsqueda
 * @returns {Array} - Mensajes filtrados
 */
export function filterMessages(messages, activeTypes, searchTerm = "") {
  return messages.filter((msg) => {
    const typeMatch = activeTypes.includes(msg.type);
    const searchMatch =
      !searchTerm ||
      msg.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      msg.timestamp.toLowerCase().includes(searchTerm.toLowerCase());

    return typeMatch && searchMatch;
  });
}

/**
 * Cuenta mensajes por tipo
 * @param {Array} messages - Lista de mensajes
 * @returns {Object} - Conteo por tipo
 */
export function countMessagesByType(messages) {
  return messages.reduce(
    (counts, msg) => {
      counts[msg.type] = (counts[msg.type] || 0) + 1;
      return counts;
    },
    {
      success: 0,
      error: 0,
      warning: 0,
      info: 0,
    }
  );
}
