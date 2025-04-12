/**
 * Configuración de perfiles de usuario predefinidos
 */

// Define los perfiles de usuarios disponibles en el sistema
exports.profiles = {
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
    name: "Nombre del Usuario",
  },
};

// Convierte el objeto de perfiles a una lista
exports.profilesList = Object.values(exports.profiles);
