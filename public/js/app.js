/**
 * Aplicación principal del sistema de registro automatizado
 */
import {
  profiles,
  saveConfig,
  loadConfig,
  determineProfile,
} from "./utils/profiles.js";
import {
  runNowRequest,
  scheduleRequest,
  cancelSchedule,
  setupEventSource,
} from "./services/api-service.js";
import {
  initClock,
  setStatus,
  addToResults,
  clearResults,
  formatDate,
} from "./components/ui-components.js";

document.addEventListener("DOMContentLoaded", function () {
  // Referencias a elementos DOM
  const clockElement = document.getElementById("clock");
  const dniInput = document.getElementById("dni");
  const codigoInput = document.getElementById("codigo");
  const numSolicitudesInput = document.getElementById("numSolicitudes");
  const intervaloInput = document.getElementById("intervalo");
  const horaInicioInput = document.getElementById("horaInicio");
  const scheduleDateInput = document.getElementById("scheduleDateInput");
  const userProfileSelect = document.getElementById("userProfile");
  const loadProfileBtn = document.getElementById("loadProfileBtn");
  const configForm = document.getElementById("configForm");
  const runNowBtn = document.getElementById("runNowBtn");
  const scheduleBtn = document.getElementById("scheduleBtn");
  const stopBtn = document.getElementById("stopBtn");
  const statusElement = document.getElementById("status");
  const nextExecutionElement = document.getElementById("nextExecution");
  const resultsElement = document.getElementById("results");
  const clearResultsBtn = document.getElementById("clearResultsBtn");

  // Estado de la aplicación
  const appState = {
    isRunning: false,
    isScheduled: false,
    scheduleTime: null,
  };

  // Establecer fecha de hoy en el selector de fecha
  const today = new Date();
  scheduleDateInput.valueAsDate = today;

  // Inicializar reloj
  initClock(clockElement);

  // Cargar configuración almacenada
  loadSavedConfig();

  // Eventos de los botones
  configForm.addEventListener("submit", handleSaveConfig);
  loadProfileBtn.addEventListener("click", loadSelectedProfile);
  runNowBtn.addEventListener("click", handleRunNow);
  scheduleBtn.addEventListener("click", handleScheduleExecution);
  stopBtn.addEventListener("click", handleStopExecution);
  clearResultsBtn.addEventListener("click", () => clearResults(resultsElement));

  // Cargar perfil seleccionado cuando cambie el selector
  userProfileSelect.addEventListener("change", function () {
    if (this.value !== "custom") {
      loadProfile(this.value);
    }
  });

  /**
   * Carga configuración desde localStorage
   */
  function loadSavedConfig() {
    const config = loadConfig();
    if (config) {
      dniInput.value = config.dni || "";
      codigoInput.value = config.codigo || "";
      numSolicitudesInput.value = config.numSolicitudes || 10;
      intervaloInput.value = config.intervalo || 100;
      horaInicioInput.value = config.horaInicio || "07:00";

      // Determinar qué perfil está cargado actualmente
      userProfileSelect.value = determineProfile(config.dni, config.codigo);
    } else {
      // Si no hay configuración almacenada, cargar el perfil por defecto (Jefer)
      loadProfile("jefer");
    }
  }

  /**
   * Carga el perfil seleccionado en el dropdown
   */
  function loadSelectedProfile() {
    const selectedProfile = userProfileSelect.value;
    loadProfile(selectedProfile);
    addToResults(
      resultsElement,
      `✅ Perfil de ${profiles[selectedProfile].name} cargado`
    );
  }

  /**
   * Carga un perfil específico
   * @param {string} profileName - Nombre del perfil
   */
  function loadProfile(profileName) {
    if (profiles[profileName]) {
      dniInput.value = profiles[profileName].dni;
      codigoInput.value = profiles[profileName].codigo;
      userProfileSelect.value = profileName;
    }
  }

  /**
   * Guarda la configuración en localStorage
   * @param {Event} event - Evento del formulario
   */
  function handleSaveConfig(event) {
    event.preventDefault();

    const config = {
      dni: dniInput.value,
      codigo: codigoInput.value,
      numSolicitudes: numSolicitudesInput.value,
      intervalo: intervaloInput.value,
      horaInicio: horaInicioInput.value,
    };

    if (saveConfig(config)) {
      addToResults(resultsElement, "✅ Configuración guardada correctamente");
    } else {
      addToResults(resultsElement, "❌ Error al guardar la configuración");
    }
  }

  /**
   * Ejecuta solicitudes inmediatamente
   */
  async function handleRunNow() {
    if (!validateInputs()) return;

    setStatus(statusElement, "active", "Ejecutando solicitudes...");
    appState.isRunning = true;

    try {
      // Obtener valores actuales
      const params = getRequestParams();

      // Llamada a la API para ejecutar ahora
      const data = await runNowRequest(params);

      addToResults(resultsElement, "✅ Solicitud de ejecución enviada");

      if (data.success) {
        addToResults(
          resultsElement,
          `📊 ${data.message || "Proceso iniciado"}`
        );
      } else {
        setStatus(statusElement, "error", "Error al ejecutar");
        addToResults(
          resultsElement,
          `❌ Error: ${data.error || "Error desconocido"}`
        );
      }
    } catch (error) {
      setStatus(statusElement, "error", "Error de conexión");
      addToResults(resultsElement, `❌ Error: ${error.message}`);
    } finally {
      appState.isRunning = false;
      if (!appState.isScheduled) {
        setStatus(statusElement, "inactive", "Inactivo");
      }
    }
  }

  /**
   * Programa ejecución para una fecha y hora específicas
   */
  async function handleScheduleExecution() {
    if (!validateInputs()) return;

    const horaInicio = horaInicioInput.value;
    const scheduleDate = scheduleDateInput.value;

    if (!horaInicio || !scheduleDate) {
      addToResults(resultsElement, "❌ Debe ingresar una fecha y hora válidas");
      return;
    }

    // Calcular la fecha y hora de la próxima ejecución
    const [hours, minutes] = horaInicio.split(":").map(Number);

    // Crear una nueva fecha con la fecha seleccionada para evitar problemas de zona horaria
    const dateParts = scheduleDate.split("-").map(Number);
    const selectedDate = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);

    // Establecer la hora en la fecha seleccionada
    selectedDate.setHours(hours, minutes, 0, 0);

    // Verificar que la fecha sea futura
    if (selectedDate < new Date()) {
      addToResults(
        resultsElement,
        "⚠️ Advertencia: La fecha y hora seleccionada ya pasó. Seleccione una futura."
      );
      return;
    }

    appState.scheduleTime = selectedDate;
    appState.isScheduled = true;

    // Mostrar la fecha y hora programadas
    const formattedDate = formatDate(selectedDate);

    setStatus(statusElement, "scheduled", "Programado");
    nextExecutionElement.textContent = `Próxima ejecución: ${formattedDate}`;
    addToResults(
      resultsElement,
      `🕒 Ejecución programada para ${formattedDate}`
    );

    try {
      // Guardar en el servidor
      const params = getRequestParams();
      const data = await scheduleRequest(params, selectedDate);

      if (!data.success) {
        addToResults(
          resultsElement,
          `⚠️ Advertencia: ${data.error || "Error al guardar en servidor"}`
        );
      }
    } catch (error) {
      addToResults(resultsElement, `⚠️ Advertencia: ${error.message}`);
    }
  }

  /**
   * Ejecuta el proceso programado
   */
  function executeScheduled() {
    if (appState.isScheduled) {
      appState.isScheduled = false;
      nextExecutionElement.textContent = "";
      handleRunNow();
    }
  }

  /**
   * Detiene la ejecución programada
   */
  async function handleStopExecution() {
    appState.isScheduled = false;
    appState.scheduleTime = null;

    setStatus(statusElement, "inactive", "Inactivo");
    nextExecutionElement.textContent = "";
    addToResults(resultsElement, "🛑 Ejecución programada cancelada");

    try {
      // Cancelar en el servidor
      await cancelSchedule();
    } catch (error) {
      console.error("Error al cancelar programación:", error);
    }
  }

  /**
   * Validar entradas
   * @returns {boolean} - Verdadero si las entradas son válidas
   */
  function validateInputs() {
    if (!dniInput.value || !codigoInput.value) {
      addToResults(
        resultsElement,
        "❌ Debe ingresar DNI y Código de Matrícula"
      );
      return false;
    }
    return true;
  }

  /**
   * Obtener parámetros para las solicitudes
   * @returns {Object} - Parámetros para las solicitudes
   */
  function getRequestParams() {
    return {
      dni: dniInput.value,
      codigo: codigoInput.value,
      numSolicitudes: parseInt(numSolicitudesInput.value),
      intervalo: parseInt(intervaloInput.value),
      horaInicio: horaInicioInput.value,
    };
  }

  /**
   * Configura el listener para recibir actualizaciones del servidor
   */
  function setupServerUpdates() {
    setupEventSource(
      // Manejador de mensajes
      (data) => {
        // Manejar el estado inicial cuando se conecta
        if (data.initialState) {
          if (data.initialState.isScheduled && data.initialState.scheduleTime) {
            // Recuperar la programación
            const scheduledTime = new Date(data.initialState.scheduleTime);

            // Actualizar el estado de la aplicación
            appState.isScheduled = true;
            appState.scheduleTime = scheduledTime;

            // Actualizar la interfaz
            setStatus(statusElement, "scheduled", "Programado");

            // Mostrar la fecha y hora programadas
            const formattedDate = formatDate(scheduledTime);
            nextExecutionElement.textContent = `Próxima ejecución: ${formattedDate}`;
            addToResults(
              resultsElement,
              `🔄 Recuperada programación para ${formattedDate}`
            );

            // Si hay configuración, actualizarla
            if (data.initialState.config) {
              dniInput.value = data.initialState.config.dni;
              codigoInput.value = data.initialState.config.codigo;
              numSolicitudesInput.value =
                data.initialState.config.numSolicitudes;
              intervaloInput.value = data.initialState.config.intervalo;
              horaInicioInput.value = data.initialState.config.horaInicio;

              // Determinar perfil actual
              updateProfileSelector();
            }
          }
        }

        // Procesar mensaje normal
        if (data.message) {
          addToResults(resultsElement, data.message);
        }

        if (data.status) {
          setStatus(statusElement, data.status.type, data.status.text);
        }

        if (data.complete) {
          if (!appState.isScheduled) {
            setStatus(statusElement, "inactive", "Inactivo");
          }
        }
      },
      // Manejador de errores
      () => {
        // Reintentar cada 5 segundos
        setTimeout(setupServerUpdates, 5000);
      }
    );
  }

  /**
   * Actualiza el selector de perfiles basado en el DNI y código actual
   */
  function updateProfileSelector() {
    const currentDni = dniInput.value;
    const currentCodigo = codigoInput.value;
    userProfileSelect.value = determineProfile(currentDni, currentCodigo);
  }

  // Verificar si hay programación activa en cada actualización del reloj
  setInterval(() => {
    if (appState.isScheduled && appState.scheduleTime) {
      const now = new Date();
      now.setSeconds(0, 0); // Ignorar segundos para comparar solo horas y minutos

      if (appState.scheduleTime <= now) {
        executeScheduled();
      }
    }
  }, 1000);

  // Iniciar escucha de eventos del servidor
  setupServerUpdates();
});
