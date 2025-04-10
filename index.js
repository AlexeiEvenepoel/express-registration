require("dotenv").config();
const express = require("express");
const axios = require("axios");
const cron = require("node-cron");
const FormData = require("form-data");
const path = require("path");
const fs = require("fs");

// Configuración de la aplicación Express
const app = express();
const PORT = process.env.PORT || 3000;

// Conexiones de clientes SSE (Server-Sent Events)
const clients = [];

// Estado del registro
let registroActivo = false;
let tareaRegistro = null;

// Middleware
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());

// Cargar valores iniciales desde .env
let config = {
  dni: process.env.DNI || "",
  codigo: process.env.CODIGO || "",
  numSolicitudes: parseInt(process.env.NUM_SOLICITUDES) || 10,
  intervalo: parseInt(process.env.INTERVALO_MS) || 100,
  horaInicio: process.env.HORA_INICIO || "07:00",
};

// Endpoint para recibir eventos del servidor (SSE)
app.get("/api/events", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  // Enviar un evento inicial
  const data = JSON.stringify({
    message: "Conexión establecida con el servidor",
  });
  res.write(`data: ${data}\n\n`);

  // Registrar cliente
  const clientId = Date.now();
  const newClient = {
    id: clientId,
    res,
  };
  clients.push(newClient);

  // Eliminar cliente cuando se desconecte
  req.on("close", () => {
    const index = clients.findIndex((c) => c.id === clientId);
    if (index !== -1) {
      clients.splice(index, 1);
    }
  });
});

// Endpoint para ejecutar solicitudes inmediatamente
app.post("/api/run-now", async (req, res) => {
  try {
    // Actualizar configuración con datos del cliente
    updateConfig(req.body);

    // Iniciar proceso en segundo plano
    registroActivo = true;
    enviarMultiplesSolicitudes()
      .then(() => {
        registroActivo = false;
        sendToAllClients({
          message: "Proceso completado",
          complete: true,
        });
      })
      .catch((err) => {
        registroActivo = false;
        sendToAllClients({
          message: `Error en ejecución: ${err.message}`,
          status: { type: "error", text: "Error" },
          complete: true,
        });
      });

    // Respuesta inmediata al cliente
    res.json({
      success: true,
      message: `Iniciando envío de ${config.numSolicitudes} solicitudes`,
    });
  } catch (error) {
    console.error("Error al ejecutar solicitudes:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Endpoint para programar solicitudes
app.post("/api/schedule", (req, res) => {
  try {
    // Actualizar configuración con datos del cliente
    updateConfig(req.body);

    // Programar tarea
    const scheduleTime = new Date(req.body.scheduleTime);
    programarEjecucion(scheduleTime);

    res.json({
      success: true,
      message: `Programación guardada para ${scheduleTime.toLocaleString()}`,
    });
  } catch (error) {
    console.error("Error al programar solicitudes:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Endpoint para cancelar programación
app.post("/api/cancel", (req, res) => {
  try {
    // Cancelar tarea programada
    if (tareaRegistro) {
      tareaRegistro.stop();
      tareaRegistro = null;
      sendToAllClients({
        message: "Programación cancelada",
        status: { type: "inactive", text: "Inactivo" },
      });
    }

    res.json({
      success: true,
      message: "Programación cancelada",
    });
  } catch (error) {
    console.error("Error al cancelar programación:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Actualizar configuración con datos del cliente
function updateConfig(newConfig) {
  if (newConfig) {
    config.dni = newConfig.dni || config.dni;
    config.codigo = newConfig.codigo || config.codigo;
    config.numSolicitudes = newConfig.numSolicitudes || config.numSolicitudes;
    config.intervalo = newConfig.intervalo || config.intervalo;
    config.horaInicio = newConfig.horaInicio || config.horaInicio;
  }
}

// Enviar evento a todos los clientes
function sendToAllClients(data) {
  clients.forEach((client) => {
    client.res.write(`data: ${JSON.stringify(data)}\n\n`);
  });
}

// URL del endpoint del comedor
const apiUrl = "https://comensales.uncp.edu.pe/api/registros";

// Función para realizar una solicitud
async function enviarSolicitud(indice) {
  try {
    console.log(`Enviando solicitud ${indice + 1}/${config.numSolicitudes}...`);

    // Datos para enviar
    const postData = {
      t1_id: null,
      t1_dni: config.dni,
      t1_codigo: config.codigo,
      t1_nombres: "",
      t1_escuela: "",
      t1_estado: null,
      t3_periodos_t3_id: null,
    };

    // Crear un FormData y añadir el campo "data" con el JSON
    const form = new FormData();
    form.append("data", JSON.stringify(postData));

    const response = await axios.post(apiUrl, form, {
      headers: {
        ...form.getHeaders(),
        Referer: "https://comensales.uncp.edu.pe/",
      },
    });

    const mensaje = `Solicitud ${indice + 1}: ${JSON.stringify(response.data)}`;
    console.log(mensaje);
    sendToAllClients({ message: mensaje });

    return response.data;
  } catch (error) {
    console.error(`Error en solicitud ${indice + 1}:`, error.message);
    
    let errorMsg = `Error en solicitud ${indice + 1}: ${error.message}`;
    if (error.response) {
      errorMsg += ` - ${JSON.stringify(error.response.data)}`;
    }
    
    sendToAllClients({ message: errorMsg });
    return null;
  }
}

// Función para enviar múltiples solicitudes con intervalo
async function enviarMultiplesSolicitudes() {
  const numSolicitudes = config.numSolicitudes;
  const intervalo = config.intervalo;
  
  console.log(
    `Iniciando envío de ${numSolicitudes} solicitudes con intervalo de ${intervalo}ms`
  );
  
  sendToAllClients({
    message: `Iniciando envío de ${numSolicitudes} solicitudes con intervalo de ${intervalo}ms`,
    status: { type: "active", text: "Ejecutando solicitudes..." },
  });

  let exitosoCount = 0;
  const resultados = [];

  for (let i = 0; i < numSolicitudes; i++) {
    if (!registroActivo) {
      sendToAllClients({ 
        message: "Proceso cancelado por el usuario" 
      });
      break;
    }
    
    const resultado = await enviarSolicitud(i);

    if (resultado) {
      resultados.push(resultado);
      if (resultado.code !== 500) {
        exitosoCount++;
      }
    }

    // Esperar el intervalo antes de la siguiente solicitud
    if (i < numSolicitudes - 1 && registroActivo) {
      await new Promise((resolve) => setTimeout(resolve, intervalo));
    }
  }

  const mensaje = `Proceso completado. ${exitosoCount} de ${numSolicitudes} solicitudes exitosas.`;
  console.log(mensaje);
  sendToAllClients({ 
    message: mensaje,
    complete: true
  });
  
  return resultados;
}

// Programar tarea para una fecha específica
function programarEjecucion(fechaHora) {
  // Si ya hay una tarea programada, cancelarla
  if (tareaRegistro) {
    tareaRegistro.stop();
  }

  // Obtener componentes de la fecha
  const minuto = fechaHora.getMinutes();
  const hora = fechaHora.getHours();
  const dia = fechaHora.getDate();
  const mes = fechaHora.getMonth() + 1;
  const diaSemana = fechaHora.getDay();

  // Formato cron: segundos minutos horas día-del-mes mes día-de-la-semana
  const cronExpression = `0 ${minuto} ${hora} ${dia} ${mes} ${diaSemana}`;

  console.log(
    `Solicitud programada para: ${fechaHora.toLocaleString()} (${cronExpression})`
  );

  // Crear nueva tarea cron
  tareaRegistro = cron.schedule(
    cronExpression,
    () => {
      console.log(
        `¡Es hora! Ejecutando solicitudes programadas a las ${new Date().toLocaleTimeString()}...`
      );
      
      registroActivo = true;
      enviarMultiplesSolicitudes()
        .then(() => {
          registroActivo = false;
        })
        .catch((err) => {
          registroActivo = false;
          console.error("Error en ejecución programada:", err);
        });
    },
    {
      scheduled: true,
      timezone: "America/Lima", // Zona horaria del Perú
    }
  );

  // Iniciar la tarea
  tareaRegistro.start();
}

// Ruta para servir el archivo HTML principal
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Servidor iniciado en http://localhost:${PORT}`);
  console.log("Presione Ctrl+C para finalizar el programa.");
});
