// Servicio para programar tareas de registro
const cron = require("node-cron");
const { timezone } = require("../config/app-config");
const { sendToAllClients } = require("../utils/sse-utils");
const registrationService = require("./registration-service");

// Estado de programación
let tareaRegistro = null;
let programacionActiva = false;
let programacionFecha = null;

/**
 * Programa una tarea para ejecutarse en una fecha específica
 * @param {Date} fechaHora - Fecha y hora de ejecución
 */
function programarEjecucion(fechaHora) {
  // Si ya hay una tarea programada, cancelarla
  if (tareaRegistro) {
    tareaRegistro.stop();
  }

  // Actualizar estado global de programación
  programacionActiva = true;
  programacionFecha = fechaHora;

  // Verificar si la fecha ya pasó
  const ahora = new Date();
  if (fechaHora < ahora) {
    console.log("La fecha programada ya pasó. Ejecutando inmediatamente...");
    sendToAllClients({
      message: "La fecha programada ya pasó. Ejecutando inmediatamente...",
    });

    // Ejecutar inmediatamente en lugar de programar
    registrationService
      .enviarMultiplesSolicitudes()
      .then(() => {
        // Limpiar estado de programación
        programacionActiva = false;
        programacionFecha = null;
      })
      .catch((err) => {
        console.error("Error en ejecución inmediata:", err);
      });

    return;
  }

  // Obtener componentes de la fecha
  const minuto = fechaHora.getMinutes();
  const hora = fechaHora.getHours();
  const dia = fechaHora.getDate();
  const mes = fechaHora.getMonth() + 1; // JavaScript meses son 0-11

  // Formato cron: segundos minutos horas día-del-mes mes día-de-la-semana
  const cronExpression = `0 ${minuto} ${hora} ${dia} ${mes} *`;

  console.log(
    `Solicitud programada para: ${fechaHora.toLocaleString()} (${cronExpression})`
  );
  sendToAllClients({
    message: `Programación confirmada en el servidor para: ${fechaHora.toLocaleString()}`,
    status: {
      type: "scheduled",
      text: `Programado para: ${fechaHora.toLocaleString()}`,
    },
  });

  // Crear nueva tarea cron
  tareaRegistro = cron.schedule(
    cronExpression,
    () => {
      console.log(
        `¡Es hora! Ejecutando solicitudes programadas a las ${new Date().toLocaleTimeString()}...`
      );

      registrationService
        .enviarMultiplesSolicitudes()
        .then(() => {
          // Limpiar estado de programación después de ejecutar
          programacionActiva = false;
          programacionFecha = null;
        })
        .catch((err) => {
          console.error("Error en ejecución programada:", err);
        });
    },
    {
      scheduled: true,
      timezone: timezone, // Zona horaria del Perú
    }
  );

  // Iniciar la tarea
  tareaRegistro.start();
}

/**
 * Cancela la tarea programada
 */
function cancelarProgramacion() {
  if (tareaRegistro) {
    tareaRegistro.stop();
    tareaRegistro = null;

    // Limpiar estado global de programación
    programacionActiva = false;
    programacionFecha = null;

    sendToAllClients({
      message: "Programación cancelada",
      status: { type: "inactive", text: "Inactivo" },
    });

    return true;
  }
  return false;
}

/**
 * Obtiene el estado actual de programación
 */
function getEstadoProgramacion() {
  return {
    isScheduled: programacionActiva,
    scheduleTime: programacionFecha ? programacionFecha.toISOString() : null,
  };
}

module.exports = {
  programarEjecucion,
  cancelarProgramacion,
  getEstadoProgramacion,
};
