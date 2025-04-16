/**
 * Componente Results
 * Gestiona la visualización de resultados con funcionalidades avanzadas
 */
import {
  getMessageType,
  extractUserFromMessage,
} from "../../utils/message-utils.js";
import { filterMessages, countMessagesByType } from "./results-types.js";
import { createMessageElement } from "./results-formatter.js";
import { groupMessagesByUser, createUserGroups } from "./results-grouper.js";

export class ResultsComponent {
  constructor() {
    // Referencias DOM
    this.resultsListElement = null;
    this.resultsContainer = null;
    this.userGroupsContainer = null;
    this.clearResultsBtn = null;
    this.toggleViewBtn = null;
    this.filterBtn = null;
    this.filterMenu = null;
    this.searchToggleBtn = null;
    this.searchInput = null;
    this.searchBar = null;
    this.autoScrollBtn = null;
    this.groupByUserCheckbox = null;
    this.compactModeCheckbox = null;
    this.messageCounter = null;
    this.lastUpdateTime = null;
    this.searchResultsCount = null;

    // Estado interno
    this.messages = [];
    this.activeFilters = ["success", "error", "warning", "info"];
    this.autoScrollEnabled = true;
    this.compactMode = false;
    this.groupByUser = false;
    this.searchTerm = "";
    this.isInitialized = false;
  }

  /**
   * Inicializa el componente
   */
  init() {
    // Obtener referencias DOM
    this.resultsListElement = document.getElementById("resultsList");
    this.resultsContainer = document.getElementById("resultsContainer");
    this.userGroupsContainer = document.getElementById("userGroupsContainer");
    this.clearResultsBtn = document.getElementById("clearResultsBtn");
    this.toggleViewBtn = document.getElementById("toggleViewBtn");
    this.filterBtn = document.getElementById("resultsFilterBtn");
    this.filterMenu = document.getElementById("resultsFilterMenu");
    this.searchToggleBtn = document.getElementById("searchToggleBtn");
    this.searchInput = document.getElementById("searchInput");
    this.searchBar = document.getElementById("searchBar");
    this.autoScrollBtn = document.getElementById("autoScrollBtn");
    this.groupByUserCheckbox = document.getElementById("groupByUserCheckbox");
    this.compactModeCheckbox = document.getElementById("compactModeCheckbox");
    this.messageCounter = document.getElementById("messageCounter");
    this.lastUpdateTime = document.getElementById("lastUpdateTime");
    this.searchResultsCount = document.getElementById("searchResultsCount");

    // Configurar event handlers
    this.setupEventHandlers();

    // Marcar como inicializado
    this.isInitialized = true;
  }

  /**
   * Configura los event handlers
   */
  setupEventHandlers() {
    // Botón para limpiar resultados
    if (this.clearResultsBtn) {
      this.clearResultsBtn.addEventListener("click", () => this.clear());
    }

    // Botón para cambiar modo de visualización
    if (this.toggleViewBtn) {
      this.toggleViewBtn.addEventListener("click", () => {
        this.compactMode = !this.compactMode;
        this.resultsContainer.classList.toggle(
          "compact-mode",
          this.compactMode
        );

        // Sincronizar con checkbox
        if (this.compactModeCheckbox) {
          this.compactModeCheckbox.checked = this.compactMode;
        }

        // Actualizar icono
        this.toggleViewBtn.querySelector("i").className = this.compactMode
          ? "fas fa-expand-alt"
          : "fas fa-list-ul";

        this.renderMessages();
      });
    }

    // Botón para filtros
    if (this.filterBtn && this.filterMenu) {
      this.filterBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        this.filterMenu.classList.toggle("hidden");
      });

      // Cerrar menú al hacer clic fuera
      document.addEventListener("click", (e) => {
        if (
          !this.filterMenu.contains(e.target) &&
          !this.filterBtn.contains(e.target)
        ) {
          this.filterMenu.classList.add("hidden");
        }
      });

      // Opciones de filtro
      document.querySelectorAll(".filter-option").forEach((checkbox) => {
        checkbox.addEventListener("change", (e) => {
          const type = e.target.dataset.type;

          if (e.target.checked) {
            if (!this.activeFilters.includes(type)) {
              this.activeFilters.push(type);
            }
          } else {
            this.activeFilters = this.activeFilters.filter((t) => t !== type);
          }

          this.applyFilters();
        });
      });
    }

    // Botón para auto-scroll
    if (this.autoScrollBtn) {
      this.autoScrollBtn.addEventListener("click", () => {
        this.autoScrollEnabled = !this.autoScrollEnabled;
        this.autoScrollBtn.classList.toggle("active", this.autoScrollEnabled);

        if (this.autoScrollEnabled) {
          this.autoScrollBtn.querySelector("i").classList.add("text-primary");
        } else {
          this.autoScrollBtn
            .querySelector("i")
            .classList.remove("text-primary");
        }
      });
    }

    // Botón para mostrar/ocultar búsqueda
    if (this.searchToggleBtn && this.searchBar) {
      this.searchToggleBtn.addEventListener("click", () => {
        this.searchBar.classList.toggle("hidden");
        if (!this.searchBar.classList.contains("hidden")) {
          this.searchInput.focus();
        } else {
          // Al cerrar la búsqueda, limpiar el término
          this.searchInput.value = "";
          this.searchTerm = "";
          this.applyFilters();
        }
      });
    }

    // Input de búsqueda
    if (this.searchInput) {
      this.searchInput.addEventListener("input", (e) => {
        this.searchTerm = e.target.value.trim();
        this.applyFilters();

        // Actualizar contador de resultados
        this.updateSearchResultsCount();
      });
    }

    // Checkbox para agrupar por usuario
    if (this.groupByUserCheckbox) {
      this.groupByUserCheckbox.addEventListener("change", (e) => {
        this.groupByUser = e.target.checked;
        this.toggleGroupView();
      });
    }

    // Checkbox para modo compacto
    if (this.compactModeCheckbox) {
      this.compactModeCheckbox.addEventListener("change", (e) => {
        this.compactMode = e.target.checked;
        this.resultsContainer.classList.toggle(
          "compact-mode",
          this.compactMode
        );

        // Sincronizar con botón
        if (this.toggleViewBtn) {
          this.toggleViewBtn.querySelector("i").className = this.compactMode
            ? "fas fa-expand-alt"
            : "fas fa-list-ul";
        }

        this.renderMessages();
      });
    }
  }

  /**
   * Agrega un mensaje a los resultados
   * @param {string} message - Mensaje para agregar
   */
  addMessage(message) {
    if (!this.isInitialized || !this.resultsListElement) return;

    // Obtener datos del mensaje
    const timestamp = new Date().toLocaleTimeString();
    const type = getMessageType(message);
    const userId = extractUserFromMessage(message);

    // Crear objeto de mensaje
    const messageData = {
      id: Date.now(),
      timestamp,
      message,
      type,
      userId,
    };

    // Guardar mensaje en memoria
    this.messages.unshift(messageData);

    // Actualizar contadores
    this.updateMessageCounter();

    // Actualizar última actualización
    if (this.lastUpdateTime) {
      this.lastUpdateTime.textContent = timestamp;
    }

    // Renderizar según configuración actual
    if (this.groupByUser) {
      this.renderGroupedMessages();
    } else {
      // Verificar si el mensaje pasa los filtros
      if (
        this.activeFilters.includes(type) &&
        (!this.searchTerm ||
          message.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
          timestamp.includes(this.searchTerm))
      ) {
        // Crear elemento para el mensaje
        const messageEl = createMessageElement(
          messageData,
          this.searchTerm,
          this.compactMode
        );

        // Insertar al inicio
        if (this.resultsListElement.firstChild) {
          this.resultsListElement.insertBefore(
            messageEl,
            this.resultsListElement.firstChild
          );
        } else {
          this.resultsListElement.appendChild(messageEl);
        }

        // Eliminar texto "Results will be displayed here..." si existe
        const defaultTextEl = this.resultsListElement.querySelector(
          ".text-gray-500.italic"
        );
        if (defaultTextEl) {
          defaultTextEl.remove();
        }

        // Auto-scroll
        if (this.autoScrollEnabled && this.resultsContainer) {
          this.resultsContainer.scrollTop = 0;
        }
      }
    }
  }

  /**
   * Renderiza todos los mensajes según filtros
   */
  renderMessages() {
    if (!this.resultsListElement) return;

    // Limpiar contenedor
    this.resultsListElement.innerHTML = "";

    // Si no hay mensajes, mostrar texto por defecto
    if (this.messages.length === 0) {
      this.resultsListElement.innerHTML =
        '<div class="text-gray-500 italic text-center py-4">Results will be displayed here...</div>';
      return;
    }

    // Filtrar mensajes
    const filteredMessages = filterMessages(
      this.messages,
      this.activeFilters,
      this.searchTerm
    );

    // Si no hay mensajes después del filtrado
    if (filteredMessages.length === 0) {
      this.resultsListElement.innerHTML =
        '<div class="text-gray-500 italic text-center py-4">No messages match current filters</div>';
      return;
    }

    // Crear fragmento para mejor rendimiento
    const fragment = document.createDocumentFragment();

    // Agregar mensajes al fragmento
    filteredMessages.forEach((msg) => {
      fragment.appendChild(
        createMessageElement(msg, this.searchTerm, this.compactMode)
      );
    });

    // Agregar fragmento al DOM
    this.resultsListElement.appendChild(fragment);

    // Actualizar contador de resultados de búsqueda
    this.updateSearchResultsCount();
  }

  /**
   * Renderiza mensajes agrupados por usuario
   */
  renderGroupedMessages() {
    if (!this.userGroupsContainer) return;

    // Limpiar contenedor
    this.userGroupsContainer.innerHTML = "";

    // Si no hay mensajes, mostrar texto por defecto
    if (this.messages.length === 0) {
      this.userGroupsContainer.innerHTML =
        '<div class="text-gray-500 italic text-center py-4">No messages to display</div>';
      return;
    }

    // Agrupar mensajes por usuario
    const groups = groupMessagesByUser(this.messages);

    // Crear elementos para grupos
    const fragment = createUserGroups(
      groups,
      this.activeFilters,
      this.searchTerm,
      this.compactMode
    );

    // Si no hay grupos después del filtrado
    if (fragment.childElementCount === 0) {
      this.userGroupsContainer.innerHTML =
        '<div class="text-gray-500 italic text-center py-4">No messages match current filters</div>';
      return;
    }

    // Agregar al DOM
    this.userGroupsContainer.appendChild(fragment);
  }

  /**
   * Aplica los filtros actuales
   */
  applyFilters() {
    if (this.groupByUser) {
      this.renderGroupedMessages();
    } else {
      this.renderMessages();
    }
  }

  /**
   * Alterna entre vista agrupada y plana
   */
  toggleGroupView() {
    this.userGroupsContainer.classList.toggle("hidden", !this.groupByUser);
    const mainView = this.resultsContainer.closest(".results-main-view");

    if (mainView) {
      mainView.classList.toggle("hidden", this.groupByUser);
    }

    if (this.groupByUser) {
      this.renderGroupedMessages();
    } else {
      this.renderMessages();
    }
  }

  /**
   * Actualiza el contador de mensajes
   */
  updateMessageCounter() {
    if (!this.messageCounter) return;

    // Actualizar contador total
    const total = this.messages.length;
    this.messageCounter.textContent = total;

    // Contar por tipo
    const counts = countMessagesByType(this.messages);

    // Actualizar tooltip
    const tooltip = `Total: ${total} | Success: ${counts.success} | Errors: ${counts.error} | Warnings: ${counts.warning} | Info: ${counts.info}`;
    this.messageCounter.setAttribute("title", tooltip);
  }

  /**
   * Actualiza el contador de resultados de búsqueda
   */
  updateSearchResultsCount() {
    if (!this.searchResultsCount || !this.searchTerm) {
      this.searchResultsCount.textContent = "";
      return;
    }

    // Contar mensajes visibles
    const filteredCount = filterMessages(
      this.messages,
      this.activeFilters,
      this.searchTerm
    ).length;
    this.searchResultsCount.textContent = `${filteredCount} result${
      filteredCount !== 1 ? "s" : ""
    }`;
  }

  /**
   * Limpia todos los resultados
   */
  clear() {
    // Reiniciar estado
    this.messages = [];

    // Actualizar UI
    this.updateMessageCounter();

    if (this.resultsListElement) {
      this.resultsListElement.innerHTML =
        '<div class="text-gray-500 italic text-center py-4">Results will be displayed here...</div>';
    }

    if (this.userGroupsContainer) {
      this.userGroupsContainer.innerHTML =
        '<div class="text-gray-500 italic text-center py-4">No messages to display</div>';
    }

    // Reiniciar última actualización
    if (this.lastUpdateTime) {
      this.lastUpdateTime.textContent = "--:--:--";
    }

    // Reiniciar contador de búsqueda
    if (this.searchResultsCount) {
      this.searchResultsCount.textContent = "";
    }
  }
}
