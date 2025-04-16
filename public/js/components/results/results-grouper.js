/**
 * Funcionalidad para agrupar mensajes por usuario
 */
import { extractUserFromMessage } from "../../utils/message-utils.js";
import { createMessageElement, createTypeBadge } from "./results-formatter.js";
import { getMessageClasses } from "./results-types.js";

/**
 * Agrupa mensajes por usuario
 * @param {Array} messages - Lista de mensajes
 * @returns {Object} - Mensajes agrupados por usuario
 */
export function groupMessagesByUser(messages) {
  const groups = {
    general: [], // Mensajes sin usuario específico
  };

  messages.forEach((msg) => {
    const userId = msg.userId || extractUserFromMessage(msg.message);

    if (userId) {
      if (!groups[userId]) {
        groups[userId] = [];
      }
      groups[userId].push(msg);
    } else {
      groups.general.push(msg);
    }
  });

  return groups;
}

/**
 * Crea elementos HTML para grupos de usuarios
 * @param {Object} groups - Mensajes agrupados por usuario
 * @param {Array} activeTypes - Tipos de mensajes activos
 * @param {string} searchTerm - Término de búsqueda actual
 * @param {boolean} isCompactMode - Si está en modo compacto
 * @returns {DocumentFragment} - Fragmento con los grupos de usuarios
 */
export function createUserGroups(
  groups,
  activeTypes,
  searchTerm,
  isCompactMode
) {
  const fragment = document.createDocumentFragment();

  // Procesar cada grupo de usuarios
  Object.keys(groups).forEach((userId) => {
    // Filtrar mensajes según los tipos activos y búsqueda
    const messages = groups[userId].filter((msg) => {
      return (
        activeTypes.includes(msg.type) &&
        (!searchTerm ||
          msg.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
          msg.timestamp.includes(searchTerm))
      );
    });

    // Si no hay mensajes después del filtrado, no mostramos el grupo
    if (messages.length === 0) return;

    // Contar mensajes por tipo
    const typeCount = {
      success: messages.filter((m) => m.type === "success").length,
      error: messages.filter((m) => m.type === "error").length,
      warning: messages.filter((m) => m.type === "warning").length,
      info: messages.filter((m) => m.type === "info").length,
    };

    // Crear grupo
    const groupEl = document.createElement("div");
    groupEl.className =
      "border border-gray-700 rounded-lg overflow-hidden bg-gray-800/50";
    groupEl.dataset.userId = userId;

    // Crear encabezado del grupo
    const headerEl = document.createElement("div");
    headerEl.className =
      "bg-gray-800 px-3 py-2 flex justify-between items-center cursor-pointer hover:bg-gray-700 transition-colors duration-200";

    // Ícono y nombre del usuario
    headerEl.innerHTML = `
      <div class="flex items-center gap-2">
        <i class="fas fa-user text-gray-400"></i>
        <h4 class="font-medium text-white text-sm m-0">
          ${userId === "general" ? "General Messages" : `User: ${userId}`}
          <span class="text-gray-400 text-xs ml-1">(${messages.length})</span>
        </h4>
      </div>
      <div class="flex items-center gap-1">
        <!-- Badges se agregarán aquí -->
        <i class="fas fa-chevron-down text-gray-400 text-xs ml-2 transition-transform duration-200"></i>
      </div>
    `;

    // Agregar badges por tipo
    const badgeContainer = headerEl.querySelector(".flex.items-center.gap-1");

    if (typeCount.success > 0) {
      badgeContainer.insertBefore(
        createTypeBadge("success", typeCount.success),
        badgeContainer.firstChild
      );
    }

    if (typeCount.error > 0) {
      badgeContainer.insertBefore(
        createTypeBadge("error", typeCount.error),
        badgeContainer.firstChild
      );
    }

    if (typeCount.warning > 0) {
      badgeContainer.insertBefore(
        createTypeBadge("warning", typeCount.warning),
        badgeContainer.firstChild
      );
    }

    if (typeCount.info > 0) {
      badgeContainer.insertBefore(
        createTypeBadge("info", typeCount.info),
        badgeContainer.firstChild
      );
    }

    // Crear contenido del grupo
    const contentEl = document.createElement("div");
    contentEl.className =
      "divide-y divide-gray-700/50 max-h-[300px] overflow-y-auto";

    // Agregar mensajes al contenido
    messages.forEach((msg) => {
      const msgEl = createMessageElement(msg, searchTerm, isCompactMode);
      msgEl.classList.add(
        "rounded-none",
        "border-l-0",
        "border-t-0",
        "border-r-0",
        "border-b"
      );
      contentEl.appendChild(msgEl);
    });

    // Añadir funcionalidad para expandir/contraer
    headerEl.addEventListener("click", () => {
      contentEl.classList.toggle("hidden");
      const icon = headerEl.querySelector("i.fa-chevron-down, i.fa-chevron-up");
      icon.classList.toggle("fa-chevron-down");
      icon.classList.toggle("fa-chevron-up");
      icon.classList.toggle("rotate-180");
    });

    // Ensamblar el grupo
    groupEl.appendChild(headerEl);
    groupEl.appendChild(contentEl);

    fragment.appendChild(groupEl);
  });

  return fragment;
}
