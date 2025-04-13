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
 * Añade un usuario personalizado
 * @param {Object} userData - Datos del usuario (name, dni, codigo)
 * @returns {string} - ID del usuario creado
 */
export function addCustomUser(userData) {
  if (!userData.name || !userData.dni || !userData.codigo) {
    throw new Error("Todos los campos son obligatorios");
  }

  const userId = `custom_${Date.now()}`;
  const customUser = {
    userId,
    dni: userData.dni,
    codigo: userData.codigo,
    name: userData.name,
  };

  // Guardar en localStorage
  const customUsers = loadCustomUsers();
  customUsers[userId] = customUser;

  try {
    localStorage.setItem("uncp-custom-users", JSON.stringify(customUsers));
    console.log("Usuario personalizado guardado:", customUser);
  } catch (error) {
    console.error("Error al guardar usuario personalizado:", error);
    throw new Error("No se pudo guardar el usuario. Error de almacenamiento.");
  }

  return userId;
}

/**
 * Carga los usuarios personalizados
 * @returns {Object} - Mapa de usuarios personalizados
 */
export function loadCustomUsers() {
  try {
    return JSON.parse(localStorage.getItem("uncp-custom-users")) || {};
  } catch (error) {
    console.error("Error al cargar usuarios personalizados:", error);
    return {};
  }
}

/**
 * Elimina un usuario personalizado
 * @param {string} userId - ID del usuario a eliminar
 * @returns {boolean} - true si se eliminó correctamente
 */
export function removeCustomUser(userId) {
  try {
    const customUsers = loadCustomUsers();
    if (customUsers[userId]) {
      delete customUsers[userId];
      localStorage.setItem("uncp-custom-users", JSON.stringify(customUsers));
      return true;
    }
    return false;
  } catch (error) {
    console.error("Error al eliminar usuario personalizado:", error);
    return false;
  }
}

/**
 * Inicializa todas las configuraciones de usuarios a partir de los perfiles
 * @returns {Object} - Mapa de userId a configuración
 */
export function initializeUserConfigs() {
  const userConfigs = loadUserConfigs();
  const customUsers = loadCustomUsers();

  // Configurar perfiles predefinidos
  Object.values(profiles).forEach((profile) => {
    if (profile.userId !== "custom" && !userConfigs[profile.userId]) {
      userConfigs[profile.userId] = {
        dni: profile.dni,
        codigo: profile.codigo,
      };
    }
  });

  // Añadir usuarios personalizados
  Object.values(customUsers).forEach((user) => {
    if (!userConfigs[user.userId]) {
      userConfigs[user.userId] = {
        dni: user.dni,
        codigo: user.codigo,
      };
    }
  });

  return userConfigs;
}
