// Servicio para programar tareas de registro
const cron = require("node-cron");
const { timezone } = require("../config/app-config");
const { sendToAllClients } = require("../utils/sse-utils");
const registrationService = require("./registration-service");

// Estado de programación - ahora usando un mapa para múltiples programaciones
let tareasRegistro = new Map(); // userId -> tarea cron
let programacionesActivas = new Map(); // userId -> boolean
let programacionesFecha = new Map(); // userId -> fecha programada

/**
 * Programa una tarea para ejecutarse en una fecha específica para un usuario o usuarios específicos
 * @param {Array<string>} userIds - IDs de los usuarios
 * @param {Date} fechaHora - Fecha y hora de ejecución
 */
function programarEjecucion(userIds, fechaHora) {
  if (!Array.isArray(userIds) || userIds.length === 0) {
    console.error(
      "Error: No se han proporcionado IDs de usuarios para la programación"
    );
    sendToAllClients({
      message: "Error: No se han seleccionado usuarios para la programación",
      status: { type: "error", text: "Error: Sin usuarios" },
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

  // Verificar si la fecha ya pasó
  const ahora = new Date();
  if (fechaHora < ahora) {
    console.log("La fecha programada ya pasó. Ejecutando inmediatamente...");
    sendToAllClients({
      message: "La fecha programada ya pasó. Ejecutando inmediatamente...",
    });

    // Ejecutar inmediatamente en lugar de programar para todos los usuarios seleccionados
    registrationService
      .enviarMultiplesSolicitudes(userIds)
      .then(() => {
        // Limpiar estado de programación para todos
        userIds.forEach((userId) => {
          programacionesActivas.set(userId, false);
          programacionesFecha.set(userId, null);
        });
      })
      .catch((err) => {
        console.error("Error en ejecución inmediata:", err);
      });

    return;
  }

  // Programar para cada usuario
  userIds.forEach((userId) => {
    // Si ya hay una tarea programada para este usuario, cancelarla
    if (tareasRegistro.has(userId)) {
      tareasRegistro.get(userId).stop();
    }

    // Actualizar estado de programación para este usuario
    programacionesActivas.set(userId, true);
    programacionesFecha.set(userId, fechaHora);

    console.log(
      `[Usuario ${userId}] Solicitud programada para: ${fechaHora.toLocaleString()} (${cronExpression})`
    );
  });

  sendToAllClients({
    message: `Programación confirmada en el servidor para ${
      userIds.length
    } usuarios: ${userIds.join(", ")} - Fecha: ${fechaHora.toLocaleString()}`,
    status: {
      type: "scheduled",
      text: `Programado para: ${fechaHora.toLocaleString()}`,
    },
    scheduledUsers: userIds,
    scheduleTime: fechaHora.toISOString(),
  });

  // Crear una única tarea cron que ejecutará para todos los usuarios seleccionados
  const tareaGrupal = cron.schedule(
    cronExpression,
    () => {
      console.log(
        `¡Es hora! Ejecutando solicitudes programadas a las ${new Date().toLocaleTimeString()} para usuarios: ${userIds.join(
          ", "
        )}`
      );

      registrationService
        .enviarMultiplesSolicitudes(userIds)
        .then(() => {
          // Limpiar estado de programación después de ejecutar
          userIds.forEach((userId) => {
            programacionesActivas.set(userId, false);
            programacionesFecha.set(userId, null);
          });
        })
        .catch((err) => {
          console.error("Error en ejecución programada:", err);
        });
    },
    {
      scheduled: true,
      timezone: timezone, // Zona horaria configurada
    }
  );

  // Iniciar la tarea y guardar referencia para cada usuario
  tareaGrupal.start();
  userIds.forEach((userId) => {
    tareasRegistro.set(userId, tareaGrupal);
  });
}

/**
 * Cancela la tarea programada para usuarios específicos
 * @param {Array<string>} userIds - IDs de los usuarios (opcional, si no se proporciona, cancela todas)
 */
function cancelarProgramacion(userIds) {
  const usersToCancel = userIds || Array.from(tareasRegistro.keys());

  if (usersToCancel.length === 0) {
    return false;
  }

  // Obtener tareas únicas (ya que múltiples usuarios pueden compartir una tarea)
  const uniqueTasks = new Set();
  let cancelledCount = 0;

  usersToCancel.forEach((userId) => {
    if (tareasRegistro.has(userId)) {
      const task = tareasRegistro.get(userId);
      uniqueTasks.add(task);

      // Limpiar estado para este usuario
      tareasRegistro.delete(userId);
      programacionesActivas.set(userId, false);
      programacionesFecha.set(userId, null);

      cancelledCount++;
    }
  });

  // Detener tareas únicas
  uniqueTasks.forEach((task) => task.stop());

  if (cancelledCount > 0) {
    sendToAllClients({
      message: `Programación cancelada para ${cancelledCount} usuarios: ${usersToCancel.join(
        ", "
      )}`,
      status: { type: "inactive", text: "Inactivo" },
      cancelledUsers: usersToCancel,
    });

    return true;
  }

  return false;
}

/**
 * Obtiene el estado actual de programación para todos los usuarios
 */
function getEstadoProgramacion() {
  const scheduledUsers = [];
  const scheduleInfo = {};

  for (const [userId, isActive] of programacionesActivas.entries()) {
    if (isActive) {
      scheduledUsers.push(userId);
      scheduleInfo[userId] = {
        isScheduled: true,
        scheduleTime: programacionesFecha.get(userId)?.toISOString() || null,
      };
    }
  }

  return {
    scheduledUsers,
    scheduleInfo,
  };
}

module.exports = {
  programarEjecucion,
  cancelarProgramacion,
  getEstadoProgramacion,
};
