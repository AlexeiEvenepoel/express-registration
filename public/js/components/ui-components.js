/**
 * Componentes de la interfaz de usuario
 */
import { removeCustomUser } from "../utils/profiles.js";

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
 * Actualiza el estado visual de un usuario específico
 * @param {string} userId - ID del usuario
 * @param {string} type - Tipo de estado (active, scheduled, error, inactive)
 * @param {string} text - Texto a mostrar
 */
export function setUserStatus(userId, type, text) {
  const statusElement = document.querySelector(`#user-${userId} .user-status`);
  if (statusElement) {
    statusElement.textContent = text;
    statusElement.className = "user-status";

    if (type === "active") {
      statusElement.classList.add("status-active");
    } else if (type === "scheduled") {
      statusElement.classList.add("status-scheduled");
    } else if (type === "error") {
      statusElement.classList.add("status-error");
    }
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

/**
 * Renderiza la lista de usuarios con casillas de verificación para selección
 * @param {HTMLElement} container - Contenedor donde se mostrarán los usuarios
 * @param {Array} profiles - Lista de perfiles de usuarios
 * @param {Array<string>} selectedUsers - Lista de IDs de usuarios seleccionados
 * @param {Object} userStates - Estado actual de cada usuario (active, scheduled, etc.)
 * @param {Function} onUserSelect - Función callback cuando se selecciona un usuario
 */
export function renderUserList(
  container,
  profiles,
  selectedUsers,
  userStates = {},
  onUserSelect
) {
  // Remover TODOS los botones "Seleccionar todos" existentes, no solo el primero
  const existingSelectAllBtns = document.querySelectorAll(
    ".select-all-container"
  );
  existingSelectAllBtns.forEach((btn) => btn.remove());

  // Limpiar el contenedor
  container.innerHTML = "";

  // Crear elementos para cada usuario (tanto predefinidos como personalizados)
  profiles.forEach((profile) => {
    if (profile.userId === "custom") return;

    const userDiv = document.createElement("div");
    userDiv.className = profile.userId.startsWith("custom_")
      ? "user-item custom-user"
      : "user-item";
    userDiv.id = `user-${profile.userId}`;

    // Casilla de verificación para selección
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.id = `checkbox-${profile.userId}`;
    checkbox.checked = selectedUsers.includes(profile.userId);
    checkbox.addEventListener("change", () => {
      if (onUserSelect) {
        onUserSelect(profile.userId, checkbox.checked);
      }
    });

    // Etiqueta para el usuario
    const label = document.createElement("label");
    label.htmlFor = `checkbox-${profile.userId}`;
    label.textContent = profile.name;

    // Mostrar DNI y código
    const details = document.createElement("div");
    details.className = "user-details";
    details.textContent = `DNI: ${profile.dni} | Código: ${profile.codigo}`;

    // Modificar la creación del indicador de estado
    const statusIndicator = document.createElement("span");
    statusIndicator.className = "user-status";

    // Asegurarse de que el estado tenga un valor por defecto
    if (userStates[profile.userId]) {
      const state = userStates[profile.userId];
      statusIndicator.textContent = state.text || "Inactivo";
      statusIndicator.className = `user-status ${
        state.type ? `status-${state.type}` : ""
      }`;
    } else {
      statusIndicator.textContent = "Inactivo";
    }

    // Asegurar que el statusIndicator tenga una altura mínima
    statusIndicator.style.minHeight = "24px";
    statusIndicator.style.display = "block";

    // Añadir botón de eliminar para usuarios personalizados
    if (profile.userId.startsWith("custom_")) {
      const deleteBtn = document.createElement("button");
      deleteBtn.className = "btn btn-sm btn-danger delete-user-btn";
      deleteBtn.innerHTML = "×";
      deleteBtn.title = "Eliminar usuario";
      deleteBtn.onclick = async (e) => {
        e.preventDefault();
        try {
          if (removeCustomUser(profile.userId)) {
            // Notificar que el usuario fue eliminado
            console.log(`Usuario ${profile.name} eliminado correctamente`);
            userDiv.remove();

            // Actualizar estado si es necesario
            if (selectedUsers.includes(profile.userId)) {
              onUserSelect(profile.userId, false);
            }
          }
        } catch (error) {
          console.error("Error al eliminar usuario:", error);
        }
      };
      userDiv.appendChild(deleteBtn);
    }

    // Agregar todo al contenedor de usuario
    userDiv.appendChild(checkbox);
    userDiv.appendChild(label);
    userDiv.appendChild(details);
    userDiv.appendChild(statusIndicator);

    // Agregar al contenedor principal
    container.appendChild(userDiv);
  });

  // Crear contenedor para el botón "Seleccionar todos" si no existe
  let selectAllDiv = document.querySelector(".select-all-container");
  if (!selectAllDiv) {
    selectAllDiv = document.createElement("div");
    selectAllDiv.className = "select-all-container";

    const selectAllBtn = document.createElement("button");
    selectAllBtn.type = "button";
    selectAllBtn.className = "btn btn-outline-primary btn-sm";
    selectAllBtn.textContent = "Seleccionar todos";

    selectAllBtn.addEventListener("click", () => {
      const checkboxes = container.querySelectorAll('input[type="checkbox"]');
      const anyUnchecked = Array.from(checkboxes).some((cb) => !cb.checked);

      checkboxes.forEach((cb) => {
        cb.checked = anyUnchecked;
        if (onUserSelect) {
          onUserSelect(cb.id.replace("checkbox-", ""), anyUnchecked);
        }
      });

      selectAllBtn.textContent = anyUnchecked
        ? "Deseleccionar todos"
        : "Seleccionar todos";
    });

    selectAllDiv.appendChild(selectAllBtn);
    container.insertAdjacentElement("beforebegin", selectAllDiv);
  }
}
