/**
 * Config Component
 * Handles all configuration settings and persistence
 */

export class ConfigComponent {
  constructor(onMessage) {
    this.onMessage = onMessage;
    this.configSection = null;
    this.configBody = null;
    this.isExpanded = false;
    this.isPinned = false;
  }

  /**
   * Initialize the component
   */
  init() {
    this.configSection = document.getElementById("configContainer");
    if (!this.configSection) return;

    // Cargar estado guardado
    this.loadConfigState();

    // Inicializar UI
    this.setupEventListeners();

    // Aplicar estado inicial
    if (this.isPinned) {
      this.toggleExpand(true);
    }

    // Load saved configuration
    this.loadSavedConfig();
  }

  /**
   * Load saved configuration state from localStorage
   */
  loadConfigState() {
    try {
      const savedState = localStorage.getItem("config-state");
      if (savedState) {
        const { isExpanded, isPinned } = JSON.parse(savedState);
        this.isExpanded = isExpanded;
        this.isPinned = isPinned;
      }
    } catch (error) {
      console.error("Error loading config state:", error);
    }
  }

  /**
   * Save configuration state to localStorage
   */
  saveConfigState() {
    try {
      localStorage.setItem(
        "config-state",
        JSON.stringify({
          isExpanded: this.isExpanded,
          isPinned: this.isPinned,
        })
      );
    } catch (error) {
      console.error("Error saving config state:", error);
    }
  }

  /**
   * Set up event listeners for configuration interactions
   */
  setupEventListeners() {
    // Click en el header para expandir/colapsar
    const header = this.configSection.querySelector(".config-header");
    const configBody = this.configSection.querySelector(".config-body");

    header.addEventListener("click", (e) => {
      if (!e.target.closest(".pin-config-btn")) {
        if (!this.isPinned) {
          this.toggleExpand();
        }
      }
    });

    // Botón de fijar
    const pinBtn = this.configSection.querySelector(".pin-config-btn");
    pinBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      this.togglePin();
    });

    // Formulario de configuración
    const configForm = this.configSection.querySelector("#configForm");
    configForm.addEventListener("submit", (e) => {
      e.preventDefault();
      this.handleSaveConfig();
    });

    // Cerrar al hacer clic fuera si no está fijado
    document.addEventListener("click", (e) => {
      if (
        !this.isPinned &&
        this.isExpanded &&
        !this.configSection.contains(e.target)
      ) {
        this.toggleExpand(false);
      }
    });

    // Guardar el configBody para uso posterior
    this.configBody = configBody;
  }

  /**
   * Toggle configuration panel expansion
   * @param {boolean} value - Whether to expand or collapse
   */
  toggleExpand(value = !this.isExpanded) {
    this.isExpanded = value;

    const cogIcon = this.configSection.querySelector(".fa-cog");
    cogIcon.style.transform = this.isExpanded ? "rotate(180deg)" : "";

    if (this.configBody) {
      this.configBody.classList.toggle("max-h-0", !this.isExpanded);
      this.configBody.classList.toggle("opacity-0", !this.isExpanded);
      this.configBody.classList.toggle("max-h-[500px]", this.isExpanded);
      this.configBody.classList.toggle("opacity-100", this.isExpanded);
    }

    if (this.isPinned) {
      this.saveConfigState();
    }
  }

  /**
   * Toggle pin state
   */
  togglePin() {
    this.isPinned = !this.isPinned;

    const pinBtn = this.configSection.querySelector(".pin-config-btn");
    const pinIcon = pinBtn.querySelector(".fa-thumbtack");

    pinBtn.classList.toggle("text-primary", this.isPinned);
    pinBtn.classList.toggle("text-gray-400", !this.isPinned);
    pinIcon.classList.toggle("rotate-45", !this.isPinned);

    pinBtn.title = this.isPinned ? "Unpin configuration" : "Pin configuration";

    if (!this.isPinned && this.isExpanded) {
      this.toggleExpand(false);
    }

    this.saveConfigState();
  }

  /**
   * Handle saving configuration
   */
  handleSaveConfig() {
    const config = this.getGlobalConfig();

    try {
      // Save to localStorage
      localStorage.setItem("uncp-global-config", JSON.stringify(config));

      // Update UI to show success
      const saveBtn = document.querySelector(".save-config-btn");
      const saveIcon = saveBtn.querySelector("i");
      const saveText = saveBtn.querySelector("span");

      // Change to success state
      saveBtn.classList.add("success");
      saveIcon.classList.remove("fa-save");
      saveIcon.classList.add("fa-check");
      saveText.textContent = "Saved!";

      this.onMessage?.("✅ Configuration saved successfully");

      // Reset button after animation
      setTimeout(() => {
        saveBtn.classList.remove("success");
        saveIcon.classList.remove("fa-check");
        saveIcon.classList.add("fa-save");
        saveText.textContent = "Save Config";
      }, 1500);

      // Load saved config when component initializes
      this.loadSavedConfig();
    } catch (error) {
      console.error("Error saving config:", error);
      this.onMessage?.("❌ Error saving configuration");
    }
  }

  /**
   * Load saved configuration from localStorage
   */
  loadSavedConfig() {
    try {
      const savedConfig = localStorage.getItem("uncp-global-config");
      if (savedConfig) {
        const config = JSON.parse(savedConfig);

        // Update input values
        const numSolicitudesInput = document.getElementById("numSolicitudes");
        const intervaloInput = document.getElementById("intervalo");

        if (numSolicitudesInput) {
          numSolicitudesInput.value = config.numSolicitudes || 10;
        }

        if (intervaloInput) {
          intervaloInput.value = config.intervalo || 100;
        }
      }
    } catch (error) {
      console.error("Error loading saved config:", error);
    }
  }

  /**
   * Get the current global configuration from form inputs
   * @returns {Object} The global configuration object
   */
  getGlobalConfig() {
    // Get values from form inputs
    const numSolicitudes =
      parseInt(document.getElementById("numSolicitudes").value) || 10;
    const intervalo =
      parseInt(document.getElementById("intervalo").value) || 100;
    const horaInicio = document.getElementById("horaInicio")?.value || "07:00";

    return {
      numSolicitudes,
      intervalo,
      horaInicio,
    };
  }
}
