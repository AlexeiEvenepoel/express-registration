/**
 * Aplicación principal del sistema de registro automatizado
 */
import {
  profiles,
  profilesList,
  saveGlobalConfig,
  loadGlobalConfig,
  saveUserConfigs,
  loadUserConfigs,
  saveSelectedUsers,
  loadSelectedUsers,
  initializeUserConfigs,
} from "./utils/profiles.js";
import {
  runNowRequest,
  scheduleRequest,
  cancelSchedule,
  stopExecution,
  saveUserConfigs as apiSaveUserConfigs,
  setupEventSource,
} from "./services/api-service.js";
import {
  initClock,
  setStatus,
  setUserStatus,
  addToResults,
  clearResults,
  formatDate,
  renderUserList,
} from "./components/ui-components.js";

document.addEventListener("DOMContentLoaded", function () {
  // Referencias a elementos DOM
  const clockElement = document.getElementById("clock");
  const numSolicitudesInput = document.getElementById("numSolicitudes");
  const intervaloInput = document.getElementById("intervalo");
  const horaInicioInput = document.getElementById("horaInicio");
  const scheduleDateInput = document.getElementById("scheduleDateInput");
  const configForm = document.getElementById("configForm");
  const runNowBtn = document.getElementById("runNowBtn");
  const scheduleBtn = document.getElementById("scheduleBtn");
  const stopBtn = document.getElementById("stopBtn");
  const statusElement = document.getElementById("status");
  const nextExecutionElement = document.getElementById("nextExecution");
  const resultsElement = document.getElementById("results");
  const clearResultsBtn = document.getElementById("clearResultsBtn");
  const userListContainer = document.getElementById("userList");

  // Estado de la aplicación
  const appState = {
    isRunning: false,
    isScheduled: false,
    scheduleTime: null,
    selectedUsers: [],
    userConfigs: {},
    userStates: {},
  };

  // Establecer fecha de hoy en el selector de fecha
  const today = new Date();
  scheduleDateInput.valueAsDate = today;

  // Inicializar reloj
  initClock(clockElement);

  // Cargar configuración guardada
  loadSavedConfig();

  // Eventos de los botones
  configForm.addEventListener("submit", handleSaveConfig);
  runNowBtn.addEventListener("click", handleRunNow);
  scheduleBtn.addEventListener("click", handleScheduleExecution);
  stopBtn.addEventListener("click", handleStopExecution);
  clearResultsBtn.addEventListener("click", () => clearResults(resultsElement));

  /**
   * Carga configuración desde localStorage
   */
  function loadSavedConfig() {
    // Cargar configuración global
    const globalConfig = loadGlobalConfig();

    // Cargar valores globales
    numSolicitudesInput.value = globalConfig.numSolicitudes || 10;
    intervaloInput.value = globalConfig.intervalo || 100;
    horaInicioInput.value = globalConfig.horaInicio || "07:00";

    // Cargar configuraciones de usuario
    appState.userConfigs = initializeUserConfigs();

    // Cargar selección de usuarios
    appState.selectedUsers = loadSelectedUsers();

    // Renderizar lista de usuarios
    renderUserList(
      userListContainer,
      profilesList,
      appState.selectedUsers,
      appState.userStates,
      handleUserSelect
    );
  }

  /**
   * Maneja la selección de un usuario
   * @param {string} userId - ID del usuario
   * @param {boolean} isSelected - Si está seleccionado
   */
  function handleUserSelect(userId, isSelected) {
    if (isSelected && !appState.selectedUsers.includes(userId)) {
      appState.selectedUsers.push(userId);
    } else if (!isSelected) {
      appState.selectedUsers = appState.selectedUsers.filter(
        (id) => id !== userId
      );
    }

    // Guardar usuarios seleccionados
    saveSelectedUsers(appState.selectedUsers);
  }

  /**
   * Guarda la configuración global en localStorage
   * @param {Event} event - Evento del formulario
   */
  function handleSaveConfig(event) {
    event.preventDefault();

    const globalConfig = {
      numSolicitudes: parseInt(numSolicitudesInput.value, 10),
      intervalo: parseInt(intervaloInput.value, 10),
      horaInicio: horaInicioInput.value,
    };

    console.log("Guardando configuración global:", globalConfig);

    // Guardar configuración global
    if (saveGlobalConfig(globalConfig)) {
      addToResults(
        resultsElement,
        `✅ Configuración global guardada correctamente: ${globalConfig.numSolicitudes} solicitudes, ${globalConfig.intervalo}ms`
      );

      // Guardar configuraciones en el servidor
      apiSaveUserConfigs(appState.userConfigs, globalConfig)
        .then((response) => {
          if (response.success) {
            console.log(
              "Configuración sincronizada con el servidor:",
              response
            );
            addToResults(
              resultsElement,
              "✅ Configuraciones sincronizadas con el servidor"
            );
          }
        })
        .catch((error) => {
          addToResults(
            resultsElement,
            `❌ Error al sincronizar con el servidor: ${error.message}`
          );
        });
    } else {
      addToResults(
        resultsElement,
        "❌ Error al guardar la configuración global"
      );
    }
  }

  /**
   * Ejecuta solicitudes inmediatamente para los usuarios seleccionados
   */
  async function handleRunNow() {
    if (appState.selectedUsers.length === 0) {
      addToResults(resultsElement, "❌ Debe seleccionar al menos un usuario");
      return;
    }

    setStatus(statusElement, "active", "Ejecutando solicitudes...");
    appState.isRunning = true;

    try {
      // Obtener configuración global y asegurarse que los valores sean números
      const globalConfig = {
        numSolicitudes: parseInt(numSolicitudesInput.value, 10),
        intervalo: parseInt(intervaloInput.value, 10),
        horaInicio: horaInicioInput.value,
      };

      // Primero guardar la configuración antes de ejecutar
      await apiSaveUserConfigs(appState.userConfigs, globalConfig);

      // Llamada a la API para ejecutar ahora
      const data = await runNowRequest(
        appState.selectedUsers,
        globalConfig,
        appState.userConfigs
      );

      addToResults(
        resultsElement,
        `✅ Solicitud de ejecución enviada para ${
          appState.selectedUsers.length
        } usuarios: ${appState.selectedUsers.join(", ")}`
      );

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
    }
  }

  /**
   * Programa ejecución para usuarios seleccionados en una fecha y hora específicas
   */
  async function handleScheduleExecution() {
    if (appState.selectedUsers.length === 0) {
      addToResults(resultsElement, "❌ Debe seleccionar al menos un usuario");
      return;
    }

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
      `🕒 Ejecución programada para ${appState.selectedUsers.length} usuarios a las ${formattedDate}`
    );

    try {
      // Obtener configuración global con valores numéricos explícitos
      const globalConfig = {
        numSolicitudes: parseInt(numSolicitudesInput.value, 10),
        intervalo: parseInt(intervaloInput.value, 10),
        horaInicio: horaInicioInput.value,
      };

      // Primero guardar la configuración antes de programar
      await apiSaveUserConfigs(appState.userConfigs, globalConfig);

      console.log("Programando con config global:", globalConfig);

      // Guardar en el servidor
      const data = await scheduleRequest(
        appState.selectedUsers,
        globalConfig,
        appState.userConfigs,
        selectedDate
      );

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
   * Detiene la ejecución programada o en curso
   */
  async function handleStopExecution() {
    if (appState.selectedUsers.length === 0) {
      addToResults(
        resultsElement,
        "❌ Debe seleccionar al menos un usuario para detener"
      );
      return;
    }

    try {
      // Cancelar en el servidor
      const response = await stopExecution(appState.selectedUsers);

      if (response.success) {
        setStatus(statusElement, "inactive", "Inactivo");
        nextExecutionElement.textContent = "";

        addToResults(
          resultsElement,
          `🛑 Ejecución detenida para ${
            appState.selectedUsers.length
          } usuarios: ${appState.selectedUsers.join(", ")}`
        );

        // Si había una programación, cancelarla también
        if (appState.isScheduled) {
          const cancelResponse = await cancelSchedule(appState.selectedUsers);
          if (cancelResponse.success) {
            appState.isScheduled = false;
            appState.scheduleTime = null;
            addToResults(
              resultsElement,
              "🛑 Programación también ha sido cancelada"
            );
          }
        }
      } else {
        addToResults(
          resultsElement,
          `⚠️ ${response.message || "No se pudo detener la ejecución"}`
        );
      }
    } catch (error) {
      addToResults(resultsElement, `❌ Error al detener: ${error.message}`);
    }
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
          // Recuperar configuraciones de usuarios del servidor si están disponibles
          if (data.initialState.usersConfig) {
            appState.userConfigs = {
              ...appState.userConfigs,
              ...data.initialState.usersConfig,
            };

            // Guardar localmente
            saveUserConfigs(appState.userConfigs);
          }

          // Recuperar usuarios programados
          if (
            data.initialState.scheduledUsers &&
            data.initialState.scheduledUsers.length > 0
          ) {
            const scheduledUsers = data.initialState.scheduledUsers;

            // Actualizar estados de los usuarios programados
            const scheduleInfo = data.initialState.scheduleInfo || {};
            let scheduleTimeStr = null;

            scheduledUsers.forEach((userId) => {
              if (scheduleInfo[userId]) {
                const scheduleTime = new Date(
                  scheduleInfo[userId].scheduleTime
                );
                scheduleTimeStr = scheduleTimeStr || scheduleTime;

                // Actualizar estado del usuario
                appState.userStates[userId] = {
                  type: "scheduled",
                  text: `Programado para: ${formatDate(scheduleTime)}`,
                };
              }
            });

            // Si hay al menos un usuario programado, actualizar el estado general
            if (scheduleTimeStr) {
              appState.isScheduled = true;
              appState.scheduleTime = scheduleTimeStr;
              setStatus(statusElement, "scheduled", "Programado");
              nextExecutionElement.textContent = `Próxima ejecución: ${formatDate(
                scheduleTimeStr
              )}`;

              addToResults(
                resultsElement,
                `🔄 Recuperada programación para ${scheduledUsers.length} usuarios`
              );
            }

            // Re-renderizar lista de usuarios con sus estados
            renderUserList(
              userListContainer,
              profilesList,
              appState.selectedUsers,
              appState.userStates,
              handleUserSelect
            );
          }
        }

        // Procesar mensaje normal
        if (data.message) {
          addToResults(resultsElement, data.message);
        }

        // Actualizar estado global
        if (data.status) {
          setStatus(statusElement, data.status.type, data.status.text);
        }

        // Actualizar estado de un usuario específico
        if (data.userId) {
          appState.userStates[data.userId] = {
            type: data.status ? data.status.type : "inactive",
            text: data.status ? data.status.text : "Inactivo",
          };

          setUserStatus(
            data.userId,
            appState.userStates[data.userId].type,
            appState.userStates[data.userId].text
          );
        }

        // Usuarios que han sido programados
        if (data.scheduledUsers) {
          const scheduleTime = data.scheduleTime
            ? new Date(data.scheduleTime)
            : null;
          if (scheduleTime) {
            data.scheduledUsers.forEach((userId) => {
              appState.userStates[userId] = {
                type: "scheduled",
                text: `Programado para: ${formatDate(scheduleTime)}`,
              };
            });

            // Re-renderizar lista de usuarios
            renderUserList(
              userListContainer,
              profilesList,
              appState.selectedUsers,
              appState.userStates,
              handleUserSelect
            );
          }
        }

        // Usuarios cuya programación ha sido cancelada
        if (data.cancelledUsers) {
          data.cancelledUsers.forEach((userId) => {
            appState.userStates[userId] = {
              type: "inactive",
              text: "Inactivo",
            };
          });

          // Re-renderizar lista de usuarios
          renderUserList(
            userListContainer,
            profilesList,
            appState.selectedUsers,
            appState.userStates,
            handleUserSelect
          );
        }

        // Si es un mensaje de finalización
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

  // Iniciar escucha de eventos del servidor
  setupServerUpdates();
});
