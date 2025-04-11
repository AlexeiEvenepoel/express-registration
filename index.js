// Punto de entrada de la aplicación
const app = require("./src/app");
const { PORT } = require("./src/config/app-config");

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Servidor iniciado en el puerto localhost:${PORT}`);
  console.log(
    process.env.NODE_ENV === "production"
      ? "Ejecutando en modo producción"
      : "Ejecutando en modo desarrollo - Presione Ctrl+C para finalizar el programa."
  );
});
