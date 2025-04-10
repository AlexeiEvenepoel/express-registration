require("dotenv").config();
const axios = require("axios");
const cron = require("node-cron");
const FormData = require("form-data"); // Importar FormData

// Datos para el registro
const dni = process.env.DNI;
const codigo = process.env.CODIGO;
const numSolicitudes = parseInt(process.env.NUM_SOLICITUDES) || 50;
const intervalo = parseInt(process.env.INTERVALO_MS) || 100;
const horaInicio = process.env.HORA_INICIO || "07:00";

// URL del endpoint
const apiUrl = "https://comensales.uncp.edu.pe/api/registros";

// Datos para enviar
const postData = {
  t1_id: null,
  t1_dni: dni,
  t1_codigo: codigo,
  t1_nombres: "",
  t1_escuela: "",
  t1_estado: null,
  t3_periodos_t3_id: null,
};

// Modifica la función enviarSolicitud para usar FormData
async function enviarSolicitud(indice) {
  try {
    console.log(`Enviando solicitud ${indice + 1}/${numSolicitudes}...`);

    // Crear un FormData y añadir el campo "data" con el JSON
    const form = new FormData();
    form.append("data", JSON.stringify(postData));

    console.log("Datos enviados:", JSON.stringify(postData));

    const response = await axios.post(apiUrl, form, {
      headers: {
        ...form.getHeaders(),
        Referer: "https://comensales.uncp.edu.pe/",
      },
    });

    console.log(`Respuesta ${indice + 1}: `, response.data);
    return response.data;
  } catch (error) {
    console.error(`Error en solicitud ${indice + 1}:`, error.message);
    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Headers:", error.response.headers);
      console.error("Datos de respuesta:", error.response.data);
    }
    return null;
  }
}

// Función para enviar múltiples solicitudes con intervalo
async function enviarMultiplesSolicitudes() {
  console.log(
    `Iniciando envío de ${numSolicitudes} solicitudes con intervalo de ${intervalo}ms`
  );

  let exitosoCount = 0;
  const resultados = [];

  for (let i = 0; i < numSolicitudes; i++) {
    const resultado = await enviarSolicitud(i);

    if (resultado) {
      resultados.push(resultado);
      if (resultado.code !== 500) {
        exitosoCount++;
      }
    }

    // Esperar el intervalo antes de la siguiente solicitud
    if (i < numSolicitudes - 1) {
      await new Promise((resolve) => setTimeout(resolve, intervalo));
    }
  }

  console.log(`Proceso completado. ${exitosoCount} solicitudes exitosas.`);
  return resultados;
}

// Función para ejecutar inmediatamente sin esperar programación
function ejecutarAhora() {
  console.log("Ejecutando solicitudes inmediatamente...");
  enviarMultiplesSolicitudes()
    .then(() => {
      console.log("Ejecución inmediata completada");
    })
    .catch((err) => {
      console.error("Error en ejecución inmediata:", err);
    });
}

// Programar las solicitudes a las 7:00 AM
function programarEjecucion() {
  const [hora, minuto] = horaInicio.split(":").map(Number);

  // Formato cron: segundos minutos horas día-del-mes mes día-de-la-semana
  // Días de la semana: 1-5 representa Lunes a Viernes
  const cronExpression = `0 ${minuto} ${hora} * * 1-5`;

  console.log(
    `Solicitudes programadas para ejecutarse a las ${horaInicio} de Lunes a Viernes.`
  );
  console.log(`Configuración cron: ${cronExpression}`);

  cron.schedule(
    cronExpression,
    () => {
      console.log(
        `¡Es hora! Ejecutando solicitudes programadas a las ${new Date().toLocaleTimeString()}...`
      );
      enviarMultiplesSolicitudes()
        .then(() => {
          console.log("Ejecución programada completada");
        })
        .catch((err) => {
          console.error("Error en ejecución programada:", err);
        });
    },
    {
      timezone: "America/Lima", // Zona horaria del Perú
    }
  );
}

// Modo de ejecución basado en argumentos
if (process.argv.includes("--ahora")) {
  ejecutarAhora();
} else {
  programarEjecucion();
  console.log(
    "Aplicación iniciada en modo programado. Use --ahora para ejecutar inmediatamente."
  );
}

// Mantener la aplicación en ejecución
process.stdin.resume();
console.log("Presione Ctrl+C para finalizar el programa.");
