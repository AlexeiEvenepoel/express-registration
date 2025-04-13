// Punto de entrada de la aplicación
const app = require("./src/app");
const { PORT } = require("./src/config/app-config");
const registrationService = require("./src/services/registration-service");
const { profiles } = require("./src/config/user-profiles");

// Inicializar el servicio de registro con usuarios predefinidos
const initializeUserProfiles = () => {
  console.log("Inicializando perfiles de usuarios...");

  const userConfigs = {};
  // Configurar perfiles predefinidos
  Object.entries(profiles).forEach(([userId, profile]) => {
    userConfigs[userId] = {
      dni: profile.dni,
      codigo: profile.codigo,
      numSolicitudes: 10, // valores por defecto
      intervalo: 100,
      horaInicio: "07:00",
    };
  });

  // Inicializar servicio con todos los usuarios
  registrationService.initializeUsers(userConfigs);
  console.log(
    `${Object.keys(userConfigs).length} perfiles de usuario inicializados`
  );
};

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Servidor iniciado en el puerto localhost:${PORT}`);
  console.log(
    process.env.NODE_ENV === "production"
      ? "Ejecutando en modo producción"
      : "Ejecutando en modo desarrollo - Presione Ctrl+C para finalizar el programa."
  );

  // Inicializar perfiles de usuarios
  initializeUserProfiles();
});
