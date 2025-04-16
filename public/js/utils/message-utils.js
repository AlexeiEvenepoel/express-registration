/**
 * Utilidades para procesamiento y formateo de mensajes
 */

/**
 * Determina el tipo de mensaje basado en su contenido
 * @param {string} message - Texto del mensaje
 * @returns {string} - Tipo de mensaje (success, error, warning, info)
 */
export function getMessageType(message) {
  if (!message) return "info";

  // Verifica indicadores de éxito
  if (
    message.includes("✅") ||
    message.includes("completado") ||
    message.includes("exitosas") ||
    message.includes("success") ||
    message.includes("éxito")
  ) {
    return "success";
  }

  // Verifica indicadores de error
  if (
    message.includes("❌") ||
    message.includes("error") ||
    message.includes("Error") ||
    message.includes("failed") ||
    message.includes("falló")
  ) {
    return "error";
  }

  // Verifica indicadores de advertencia
  if (
    message.includes("⚠️") ||
    message.includes("warning") ||
    message.includes("Warning") ||
    message.includes("advertencia") ||
    message.includes("atención")
  ) {
    return "warning";
  }

  // Por defecto, es un mensaje informativo
  return "info";
}

/**
 * Extrae el usuario del mensaje si está presente
 * @param {string} message - Texto del mensaje
 * @returns {string|null} - ID del usuario o null si no se encuentra
 */
export function extractUserFromMessage(message) {
  if (!message) return null;

  // Patrones comunes para mensajes relacionados con usuarios
  const patterns = [
    /\[Usuario\s+([^\]]+)\]/i,
    /usuario\s+([^:]+):/i,
    /para\s+(?:el)?\s*usuario\s*([^:,\s]+)/i,
    /para\s+(\d+)\s+usuarios?:\s*([^\s,]+)/i,
    /users?:\s*([^\s,]+)/i,
  ];

  for (const pattern of patterns) {
    const match = message.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }

  return null;
}

/**
 * Destaca términos de búsqueda en un texto
 * @param {string} text - Texto original
 * @param {string} searchTerm - Término a destacar
 * @returns {string} - Texto con términos destacados con HTML
 */
export function highlightSearchTerm(text, searchTerm) {
  if (!searchTerm || !text) return text;

  try {
    // Escapar caracteres especiales en regex
    const escapedTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`(${escapedTerm})`, "gi");

    return text.replace(
      regex,
      '<span class="bg-yellow-300/30 text-white px-0.5 rounded">$1</span>'
    );
  } catch (error) {
    console.error("Error al destacar términos de búsqueda:", error);
    return text;
  }
}

/**
 * Verifica si un mensaje debe ser expandible (contiene JSON o es largo)
 * @param {string} message - Texto del mensaje
 * @returns {boolean} - Verdadero si el mensaje debería ser expandible
 */
export function isExpandableMessage(message) {
  return (
    (message.includes("{") && message.includes("}")) ||
    message.length > 100 ||
    message.includes("\n")
  );
}

/**
 * Extrae contenido JSON de un mensaje si existe
 * @param {string} message - Texto del mensaje
 * @returns {string|null} - JSON formateado o null si no hay JSON
 */
export function extractJsonContent(message) {
  try {
    const jsonPattern = /{[^{}]*({[^{}]*})*[^{}]*}/g;
    const match = message.match(jsonPattern);

    if (match) {
      const jsonStr = match[0];
      const data = JSON.parse(jsonStr);
      return JSON.stringify(data, null, 2);
    }
    return null;
  } catch (error) {
    return null;
  }
}
