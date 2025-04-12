/**
 * Módulo para manejar perfiles de usuario
 */

// Perfiles predefinidos
export const profiles = {
  jefer: {
    userId: "jefer",
    dni: "72879376",
    codigo: "2020101668A",
    name: "Jefer",
  },
  danny: {
    userId: "danny",
    dni: "75908353",
    codigo: "2021101385B",
    name: "Danny",
  },
  alexis: {
    userId: "alexis",
    dni: "73435865",
    codigo: "2019200797H",
    name: "Alexis",
  },
  Stefano: {
    userId: "stefano",
    dni: "71648837",
    codigo: "2018200461L",
    name: "Stefano",
  },
  custom: {
    userId: "custom",
    dni: "",
    codigo: "",
    name: "Personalizado",
  },
};

// Convertir el objeto de perfiles a un array para facilitar la iteración
export const profilesList = Object.values(profiles);

/**
 * Guarda la configuración global en localStorage
 * @param {Object} config - Configuración global a guardar
 * @returns {boolean} - Verdadero si se guardó correctamente
 */
export function saveGlobalConfig(config) {
  try {
    localStorage.setItem("uncp-global-config", JSON.stringify(config));
    return true;
  } catch (error) {
    console.error("Error al guardar la configuración global:", error);
    return false;
  }
}

/**
 * Carga configuración global desde localStorage
 * @returns {Object|null} - La configuración global guardada o null si no existe
 */
export function loadGlobalConfig() {
  try {
    return (
      JSON.parse(localStorage.getItem("uncp-global-config")) || {
        numSolicitudes: 10,
        intervalo: 100,
        horaInicio: "07:00",
      }
    );
  } catch (error) {
    console.error("Error al cargar la configuración global:", error);
    return {
      numSolicitudes: 10,
      intervalo: 100,
      horaInicio: "07:00",
    };
  }
}

/**
 * Guarda todas las configuraciones de usuarios
 * @param {Object} userConfigs - Mapa de userId a configuraciones
 * @returns {boolean} - Verdadero si se guardó correctamente
 */
export function saveUserConfigs(userConfigs) {
  try {
    localStorage.setItem("uncp-user-configs", JSON.stringify(userConfigs));
    return true;
  } catch (error) {
    console.error("Error al guardar configuraciones de usuarios:", error);
    return false;
  }
}

/**
 * Carga todas las configuraciones de usuarios
 * @returns {Object} - Mapa de userId a configuraciones o objeto vacío si no existe
 */
export function loadUserConfigs() {
  try {
    return JSON.parse(localStorage.getItem("uncp-user-configs")) || {};
  } catch (error) {
    console.error("Error al cargar configuraciones de usuarios:", error);
    return {};
  }
}

/**
 * Guarda la lista de usuarios seleccionados
 * @param {Array<string>} selectedUserIds - IDs de usuarios seleccionados
 * @returns {boolean} - Verdadero si se guardó correctamente
 */
export function saveSelectedUsers(selectedUserIds) {
  try {
    localStorage.setItem(
      "uncp-selected-users",
      JSON.stringify(selectedUserIds)
    );
    return true;
  } catch (error) {
    console.error("Error al guardar usuarios seleccionados:", error);
    return false;
  }
}

/**
 * Carga la lista de usuarios seleccionados
 * @returns {Array<string>} - Array de IDs de usuarios seleccionados o array vacío si no existe
 */
export function loadSelectedUsers() {
  try {
    return JSON.parse(localStorage.getItem("uncp-selected-users")) || [];
  } catch (error) {
    console.error("Error al cargar usuarios seleccionados:", error);
    return [];
  }
}

/**
 * Determina el perfil correspondiente según DNI y código
 * @param {string} dni - DNI del usuario
 * @param {string} codigo - Código del usuario
 * @returns {string} - ID del perfil o "custom" si no coincide
 */
export function determineProfile(dni, codigo) {
  for (const profileId in profiles) {
    const profile = profiles[profileId];
    if (profile.dni === dni && profile.codigo === codigo) {
      return profileId;
    }
  }
  return "custom";
}

/**
 * Inicializa todas las configuraciones de usuarios a partir de los perfiles
 * @returns {Object} - Mapa de userId a configuración
 */
export function initializeUserConfigs() {
  const userConfigs = loadUserConfigs();

  // Asegurarse de que todos los perfiles tengan una configuración
  Object.values(profiles).forEach((profile) => {
    if (profile.userId !== "custom" && !userConfigs[profile.userId]) {
      userConfigs[profile.userId] = {
        dni: profile.dni,
        codigo: profile.codigo,
      };
    }
  });

  return userConfigs;
}
