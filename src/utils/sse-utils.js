// Utilidades para manejar eventos SSE (Server-Sent Events)

// Almacenamiento de clientes conectados mediante SSE
const clients = [];

/**
 * Registra un nuevo cliente SSE
 * @param {object} res - Objeto de respuesta Express
 * @returns {number} ID del cliente
 */
function registerClient(res) {
  // Configurar headers para SSE
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  // Registrar cliente con ID único
  const clientId = Date.now();
  const newClient = {
    id: clientId,
    res,
  };
  clients.push(newClient);

  return clientId;
}

/**
 * Elimina un cliente de la lista
 * @param {number} clientId - ID del cliente a eliminar
 */
function removeClient(clientId) {
  const index = clients.findIndex((c) => c.id === clientId);
  if (index !== -1) {
    clients.splice(index, 1);
  }
}

/**
 * Envía datos a todos los clientes conectados
 * @param {object} data - Datos a enviar
 */
function sendToAllClients(data) {
  clients.forEach((client) => {
    client.res.write(`data: ${JSON.stringify(data)}\n\n`);
  });
}

/**
 * Envía datos a un cliente específico
 * @param {number} clientId - ID del cliente
 * @param {object} data - Datos a enviar
 */
function sendToClient(clientId, data) {
  const client = clients.find((c) => c.id === clientId);
  if (client) {
    client.res.write(`data: ${JSON.stringify(data)}\n\n`);
  }
}

module.exports = {
  clients,
  registerClient,
  removeClient,
  sendToAllClients,
  sendToClient,
};
