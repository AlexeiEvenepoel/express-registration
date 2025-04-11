# Sistema de Registro Automatizado - Comedor UNCP

Sistema de registro automatizado para el comedor de la Universidad Nacional del Centro del Perú (UNCP), que permite programar y automatizar el envío de solicitudes de registro.

## Estructura del Proyecto

```
express-registration/
├── src/                     # Código fuente principal
│   ├── config/              # Configuraciones de la aplicación
│   ├── controllers/         # Controladores de la lógica de negocio
│   ├── routes/              # Definición de rutas API
│   ├── services/            # Servicios de automatización y registro
│   ├── utils/               # Utilidades (SSE, etc.)
│   └── app.js               # Configuración de la aplicación Express
├── public/                  # Archivos estáticos
│   ├── css/                 # Estilos CSS
│   ├── js/                  # Scripts del cliente
│   └── index.html           # Página principal
├── .env                     # Variables de entorno (no incluido en git)
├── .env.example             # Ejemplo de variables de entorno
├── index.js                 # Punto de entrada de la aplicación
├── package.json             # Dependencias y scripts
└── Procfile                 # Configuración para despliegue
```

## Requisitos

- Node.js 16.0.0 o superior
- NPM o Yarn

## Instalación

1. Clona el repositorio:

   ```bash
   git clone https://github.com/tu-usuario/express-registration.git
   cd express-registration
   ```

2. Instala las dependencias:

   ```bash
   npm install
   ```

3. Crea un archivo `.env` basado en `.env.example`:

   ```bash
   cp .env.example .env
   ```

4. Edita el archivo `.env` con tu configuración personal.

## Uso

### Iniciar el servidor

```bash
npm start
```

El servidor estará disponible en http://localhost:3000 (o el puerto definido en tu archivo .env).

### Ejecución inmediata desde línea de comandos

Para ejecutar inmediatamente el registro sin usar la interfaz web:

```bash
npm run now
```

## Funcionalidades

- **Configuración de perfiles**: Guarda y carga perfiles de usuario con DNI y código.
- **Ejecución inmediata**: Envía múltiples solicitudes de registro de forma automática.
- **Programación**: Programa el envío automático para una fecha y hora específica.
- **Monitoreo en tiempo real**: Visualiza el estado y resultados de las solicitudes en tiempo real.

## Estructura de la lógica de automatización

El sistema utiliza una arquitectura modular para manejar la automatización de envíos:

1. **Services**:

   - `registration-service.js`: Maneja la lógica de envío de solicitudes
   - `scheduler-service.js`: Gestiona la programación de tareas

2. **Controllers**:

   - `registration-controller.js`: Coordina las operaciones entre la API y los servicios

3. **Utils**:
   - `sse-utils.js`: Permite comunicación en tiempo real con el cliente

## Contribuir

1. Haz un fork del proyecto
2. Crea tu rama de características (`git checkout -b feature/amazing-feature`)
3. Haz commit de tus cambios (`git commit -m 'Add some amazing feature'`)
4. Haz push a la rama (`git push origin feature/amazing-feature`)
5. Abre un Pull Request
