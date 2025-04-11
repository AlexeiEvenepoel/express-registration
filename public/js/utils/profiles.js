/**
 * Módulo para manejar perfiles de usuario
 */

// Perfiles predefinidos
export const profiles = {
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

/**
 * Guarda la configuración en localStorage
 * @param {Object} config - Configuración a guardar
 * @returns {boolean} - Verdadero si se guardó correctamente
 */
export function saveConfig(config) {
  try {
    localStorage.setItem("uncp-config", JSON.stringify(config));
    return true;
  } catch (error) {
    console.error("Error al guardar la configuración:", error);
    return false;
  }
}

/**
 * Carga configuración desde localStorage
 * @returns {Object|null} - La configuración guardada o null si no existe
 */
export function loadConfig() {
  try {
    return JSON.parse(localStorage.getItem("uncp-config"));
  } catch (error) {
    console.error("Error al cargar la configuración:", error);
    return null;
  }
}

/**
 * Determina el perfil correspondiente según DNI y código
 * @param {string} dni - DNI del usuario
 * @param {string} codigo - Código del usuario
 * @returns {string} - Nombre del perfil o "custom" si no coincide
 */
export function determineProfile(dni, codigo) {
  let currentProfile = "custom";

  if (dni === profiles.jefer.dni && codigo === profiles.jefer.codigo) {
    currentProfile = "jefer";
  } else if (dni === profiles.danny.dni && codigo === profiles.danny.codigo) {
    currentProfile = "danny";
  } else if (dni === profiles.Alexis.dni && codigo === profiles.Alexis.codigo) {
    currentProfile = "Alexis";
  } else if (
    dni === profiles.nuevoUsuario.dni &&
    codigo === profiles.nuevoUsuario.codigo
  ) {
    currentProfile = "nuevoUsuario";
  }

  return currentProfile;
}
