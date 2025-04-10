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

  // Perfiles predefinidos
  const profiles = {
    jefer: {
      dni: "72879376",
      codigo: "2020101668A",
      name: "Jefer",
    },
    danny: {
      dni: "75908353",
      codigo: "2021101385B",
      name: "Danny",
    },
    Alexis: {
      dni: "73435865",
      codigo: "2019200797H",
      name: "Alexis",
    },
    // Añadir un nuevo usuario aquí
    nuevoUsuario: {
      dni: "12345678",
      codigo: "2023123456X",
      name: "Nombre del Usuario",
    },
    custom: {
      dni: "",
      codigo: "",
      name: "Personalizado",
    },
  };

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
  initClock();

  // Cargar configuración almacenada
  loadConfig();

  // Eventos de los botones
  configForm.addEventListener("submit", saveConfig);
  loadProfileBtn.addEventListener("click", loadSelectedProfile);
  runNowBtn.addEventListener("click", runNow);
  scheduleBtn.addEventListener("click", scheduleExecution);
  stopBtn.addEventListener("click", stopExecution);
  clearResultsBtn.addEventListener("click", clearResults);

  // Cargar perfil seleccionado cuando cambie el selector
  userProfileSelect.addEventListener("change", function () {
    if (this.value !== "custom") {
      loadProfile(this.value);
    }
  });

  // Función para inicializar el reloj
  function initClock() {
    updateClock();
    setInterval(updateClock, 1000);
  }

  // Actualizar el reloj con la hora actual
  function updateClock() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const seconds = String(now.getSeconds()).padStart(2, "0");
    clockElement.textContent = `${hours}:${minutes}:${seconds}`;

    // Si hay una programación activa, verificar si es hora de ejecutar
    if (appState.isScheduled && appState.scheduleTime) {
      const scheduleTime = new Date(appState.scheduleTime);
      const currentTime = new Date();
      currentTime.setSeconds(0, 0); // Ignorar segundos para comparar solo horas y minutos

      if (scheduleTime <= currentTime) {
        executeScheduled();
      }
    }
  }

  // Cargar configuración desde localStorage
  function loadConfig() {
    try {
      const config = JSON.parse(localStorage.getItem("uncp-config"));
      if (config) {
        dniInput.value = config.dni || "";
        codigoInput.value = config.codigo || "";
        numSolicitudesInput.value = config.numSolicitudes || 10;
        intervaloInput.value = config.intervalo || 100;
        horaInicioInput.value = config.horaInicio || "07:00";

        // Determinar qué perfil está cargado actualmente
        let currentProfile = "custom";
        if (
          config.dni === profiles.jefer.dni &&
          config.codigo === profiles.jefer.codigo
        ) {
          currentProfile = "jefer";
        } else if (
          config.dni === profiles.danny.dni &&
          config.codigo === profiles.danny.codigo
        ) {
          currentProfile = "danny";
        } else if (
          config.dni === profiles.Alexis.dni &&
          config.codigo === profiles.Alexis.codigo
        ) {
          currentProfile = "Alexis";
        }
        // Añadir condición para el nuevo usuario aquí
        else if (
          config.dni === profiles.nuevoUsuario.dni &&
          config.codigo === profiles.nuevoUsuario.codigo
        ) {
          currentProfile = "nuevoUsuario";
        }
        userProfileSelect.value = currentProfile;
      } else {
        // Si no hay configuración almacenada, cargar el perfil por defecto (Jefer)
        loadProfile("jefer");
      }
    } catch (error) {
      console.error("Error al cargar la configuración:", error);
      // En caso de error, cargar el perfil por defecto
      loadProfile("jefer");
    }
  }

  // Cargar perfil seleccionado en el dropdown
  function loadSelectedProfile() {
    const selectedProfile = userProfileSelect.value;
    loadProfile(selectedProfile);
    addToResults(`✅ Perfil de ${profiles[selectedProfile].name} cargado`);
  }

  // Cargar perfil específico
  function loadProfile(profileName) {
    if (profiles[profileName]) {
      dniInput.value = profiles[profileName].dni;
      codigoInput.value = profiles[profileName].codigo;
      userProfileSelect.value = profileName;
    }
  }

  // Guardar configuración en localStorage
  function saveConfig(event) {
    event.preventDefault();

    const config = {
      dni: dniInput.value,
      codigo: codigoInput.value,
      numSolicitudes: numSolicitudesInput.value,
      intervalo: intervaloInput.value,
      horaInicio: horaInicioInput.value,
    };

    try {
      localStorage.setItem("uncp-config", JSON.stringify(config));
      addToResults("✅ Configuración guardada correctamente");
    } catch (error) {
      addToResults("❌ Error al guardar la configuración: " + error.message);
    }
  }

  // Ejecutar solicitudes inmediatamente
  function runNow() {
    if (validateInputs()) {
      setStatus("active", "Ejecutando solicitudes...");
      appState.isRunning = true;

      // Obtener valores actuales
      const params = getRequestParams();

      // Llamada a la API para ejecutar ahora
      fetch("/api/run-now", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(params),
      })
        .then((response) => response.json())
        .then((data) => {
          addToResults("✅ Solicitud de ejecución enviada");

          if (data.success) {
            addToResults(`📊 ${data.message || "Proceso iniciado"}`);
          } else {
            setStatus("error", "Error al ejecutar");
            addToResults(`❌ Error: ${data.error || "Error desconocido"}`);
          }
        })
        .catch((error) => {
          setStatus("error", "Error de conexión");
          addToResults(`❌ Error: ${error.message}`);
        })
        .finally(() => {
          appState.isRunning = false;
          if (!appState.isScheduled) {
            setStatus("inactive", "Inactivo");
          }
        });
    }
  }

  // Programar ejecución para una fecha y hora específicas
  function scheduleExecution() {
    if (!validateInputs()) return;

    const horaInicio = horaInicioInput.value;
    const scheduleDate = scheduleDateInput.value;

    if (!horaInicio || !scheduleDate) {
      addToResults("❌ Debe ingresar una fecha y hora válidas");
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
        "⚠️ Advertencia: La fecha y hora seleccionada ya pasó. Seleccione una futura."
      );
      return;
    }

    appState.scheduleTime = selectedDate;
    appState.isScheduled = true;

    // Mostrar la fecha y hora programadas
    const formattedDate = selectedDate.toLocaleString("es-ES", {
      weekday: "long",
      day: "numeric",
      month: "long",
      hour: "2-digit",
      minute: "2-digit",
    });

    setStatus("scheduled", "Programado");
    nextExecutionElement.textContent = `Próxima ejecución: ${formattedDate}`;
    addToResults(`🕒 Ejecución programada para ${formattedDate}`);

    // Guardar en el servidor
    const params = getRequestParams();

    fetch("/api/schedule", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...params,
        scheduleTime: selectedDate.toISOString(),
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (!data.success) {
          addToResults(
            `⚠️ Advertencia: ${data.error || "Error al guardar en servidor"}`
          );
        }
      })
      .catch((error) => {
        addToResults(`⚠️ Advertencia: ${error.message}`);
      });
  }

  // Ejecutar el proceso programado
  function executeScheduled() {
    if (appState.isScheduled) {
      appState.isScheduled = false;
      nextExecutionElement.textContent = "";
      runNow();
    }
  }

  // Detener la ejecución programada
  function stopExecution() {
    appState.isScheduled = false;
    appState.scheduleTime = null;

    setStatus("inactive", "Inactivo");
    nextExecutionElement.textContent = "";
    addToResults("🛑 Ejecución programada cancelada");

    // Cancelar en el servidor
    fetch("/api/cancel", { method: "POST" }).catch((error) =>
      console.error("Error al cancelar programación:", error)
    );
  }

  // Cambiar estado visual
  function setStatus(type, text) {
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

  // Validar entradas
  function validateInputs() {
    if (!dniInput.value || !codigoInput.value) {
      addToResults("❌ Debe ingresar DNI y Código de Matrícula");
      return false;
    }
    return true;
  }

  // Obtener parámetros para las solicitudes
  function getRequestParams() {
    return {
      dni: dniInput.value,
      codigo: codigoInput.value,
      numSolicitudes: parseInt(numSolicitudesInput.value),
      intervalo: parseInt(intervaloInput.value),
      horaInicio: horaInicioInput.value,
    };
  }

  // Añadir mensaje a resultados
  function addToResults(message) {
    const timestamp = new Date().toLocaleTimeString();
    resultsElement.textContent = `[${timestamp}] ${message}\n${resultsElement.textContent}`;
  }

  // Limpiar resultados
  function clearResults() {
    resultsElement.textContent = "Los resultados se mostrarán aquí...";
  }

  // Para recibir actualizaciones del servidor (usando EventSource o WebSockets)
  function setupServerUpdates() {
    // Crear fuente de eventos del servidor
    const eventSource = new EventSource("/api/events");

    // Escuchar eventos
    eventSource.onmessage = function (event) {
      const data = JSON.parse(event.data);

      // Manejar el estado inicial cuando se conecta
      if (data.initialState) {
        if (data.initialState.isScheduled && data.initialState.scheduleTime) {
          // Recuperar la programación
          const scheduledTime = new Date(data.initialState.scheduleTime);

          // Actualizar el estado de la aplicación
          appState.isScheduled = true;
          appState.scheduleTime = scheduledTime;

          // Actualizar la interfaz
          setStatus("scheduled", "Programado");

          // Mostrar la fecha y hora programadas
          const formattedDate = scheduledTime.toLocaleString("es-ES", {
            weekday: "long",
            day: "numeric",
            month: "long",
            hour: "2-digit",
            minute: "2-digit",
          });

          nextExecutionElement.textContent = `Próxima ejecución: ${formattedDate}`;
          addToResults(`🔄 Recuperada programación para ${formattedDate}`);

          // Si hay configuración, actualizarla
          if (data.initialState.config) {
            dniInput.value = data.initialState.config.dni;
            codigoInput.value = data.initialState.config.codigo;
            numSolicitudesInput.value = data.initialState.config.numSolicitudes;
            intervaloInput.value = data.initialState.config.intervalo;
            horaInicioInput.value = data.initialState.config.horaInicio;

            // Determinar perfil actual
            updateProfileSelector();
          }
        }
      }

      // Procesar mensaje normal
      if (data.message) {
        addToResults(data.message);
      }

      if (data.status) {
        setStatus(data.status.type, data.status.text);
      }

      if (data.complete) {
        if (!appState.isScheduled) {
          setStatus("inactive", "Inactivo");
        }
      }
    };

    // Manejar errores
    eventSource.onerror = function () {
      eventSource.close();
      setTimeout(setupServerUpdates, 5000); // Reintentar cada 5 segundos
    };
  }

  // Función para actualizar el selector de perfiles basado en el DNI y código actual
  function updateProfileSelector() {
    const currentDni = dniInput.value;
    const currentCodigo = codigoInput.value;

    // Determinar qué perfil está cargado actualmente
    let currentProfile = "custom";

    if (
      currentDni === profiles.jefer.dni &&
      currentCodigo === profiles.jefer.codigo
    ) {
      currentProfile = "jefer";
    } else if (
      currentDni === profiles.danny.dni &&
      currentCodigo === profiles.danny.codigo
    ) {
      currentProfile = "danny";
    } else if (
      currentDni === profiles.Alexis.dni &&
      currentCodigo === profiles.Alexis.codigo
    ) {
      currentProfile = "Alexis";
    } else if (
      currentDni === profiles.nuevoUsuario.dni &&
      currentCodigo === profiles.nuevoUsuario.codigo
    ) {
      currentProfile = "nuevoUsuario";
    }

    userProfileSelect.value = currentProfile;
  }

  // Iniciar escucha de eventos del servidor
  setupServerUpdates();
});
