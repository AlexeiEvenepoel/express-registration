// Configuración de la aplicación
require("dotenv").config();

// Exportar configuración
module.exports = {
  // Configuración de la aplicación Express
  PORT: process.env.PORT || 3000,

  // Valores por defecto para la automatización
  defaultConfig: {
    dni: process.env.DNI || "72879376", // Por defecto usar DNI de Jefer
    codigo: process.env.CODIGO || "2020101668A", // Por defecto usar código de Jefer
    numSolicitudes: parseInt(process.env.NUM_SOLICITUDES) || 50,
    intervalo: parseInt(process.env.INTERVALO_MS) || 100,
    horaInicio: process.env.HORA_INICIO || "07:00",
  },

  // URL del endpoint del comedor
  apiUrl: "https://comensales.uncp.edu.pe/api/registros",

  // Configuración del timezone
  timezone: "America/Lima",
};
