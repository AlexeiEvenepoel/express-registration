document.addEventListener('DOMContentLoaded', function() {
    // Referencias a elementos DOM
    const clockElement = document.getElementById('clock');
    const dniInput = document.getElementById('dni');
    const codigoInput = document.getElementById('codigo');
    const numSolicitudesInput = document.getElementById('numSolicitudes');
    const intervaloInput = document.getElementById('intervalo');
    const horaInicioInput = document.getElementById('horaInicio');
    const configForm = document.getElementById('configForm');
    const runNowBtn = document.getElementById('runNowBtn');
    const scheduleBtn = document.getElementById('scheduleBtn');
    const stopBtn = document.getElementById('stopBtn');
    const statusElement = document.getElementById('status');
    const nextExecutionElement = document.getElementById('nextExecution');
    const resultsElement = document.getElementById('results');
    const clearResultsBtn = document.getElementById('clearResultsBtn');

    // Estado de la aplicación
    const appState = {
        isRunning: false,
        isScheduled: false,
        scheduleTime: null
    };

    // Inicializar reloj
    initClock();
    
    // Cargar configuración almacenada
    loadConfig();

    // Eventos de los botones
    configForm.addEventListener('submit', saveConfig);
    runNowBtn.addEventListener('click', runNow);
    scheduleBtn.addEventListener('click', scheduleExecution);
    stopBtn.addEventListener('click', stopExecution);
    clearResultsBtn.addEventListener('click', clearResults);

    // Función para inicializar el reloj
    function initClock() {
        updateClock();
        setInterval(updateClock, 1000);
    }

    // Actualizar el reloj con la hora actual
    function updateClock() {
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        clockElement.textContent = `${hours}:${minutes}:${seconds}`;

        // Si hay una programación activa, verificar si es hora de ejecutar
        if (appState.isScheduled && appState.scheduleTime) {
            const scheduleTime = new Date(appState.scheduleTime);
            const currentTime = new Date();
            currentTime.setSeconds(0, 0); // Ignorar segundos para comparar solo horas y minutos
            
            if (scheduleTime <= currentTime) {
                executeScheduled();
            }
        }
    }

    // Cargar configuración desde localStorage
    function loadConfig() {
        try {
            const config = JSON.parse(localStorage.getItem('uncp-config'));
            if (config) {
                dniInput.value = config.dni || '';
                codigoInput.value = config.codigo || '';
                numSolicitudesInput.value = config.numSolicitudes || 10;
                intervaloInput.value = config.intervalo || 100;
                horaInicioInput.value = config.horaInicio || '07:00';
            }
        } catch (error) {
            console.error('Error al cargar la configuración:', error);
        }
    }

    // Guardar configuración en localStorage
    function saveConfig(event) {
        event.preventDefault();
        
        const config = {
            dni: dniInput.value,
            codigo: codigoInput.value,
            numSolicitudes: numSolicitudesInput.value,
            intervalo: intervaloInput.value,
            horaInicio: horaInicioInput.value
        };
        
        try {
            localStorage.setItem('uncp-config', JSON.stringify(config));
            addToResults('✅ Configuración guardada correctamente');
        } catch (error) {
            addToResults('❌ Error al guardar la configuración: ' + error.message);
        }
    }

    // Ejecutar solicitudes inmediatamente
    function runNow() {
        if (validateInputs()) {
            setStatus('active', 'Ejecutando solicitudes...');
            appState.isRunning = true;
            
            // Obtener valores actuales
            const params = getRequestParams();
            
            // Llamada a la API para ejecutar ahora
            fetch('/api/run-now', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(params)
            })
            .then(response => response.json())
            .then(data => {
                addToResults('✅ Solicitud de ejecución enviada');
                
                if (data.success) {
                    addToResults(`📊 ${data.message || 'Proceso iniciado'}`);
                } else {
                    setStatus('error', 'Error al ejecutar');
                    addToResults(`❌ Error: ${data.error || 'Error desconocido'}`);
                }
            })
            .catch(error => {
                setStatus('error', 'Error de conexión');
                addToResults(`❌ Error: ${error.message}`);
            })
            .finally(() => {
                appState.isRunning = false;
                if (!appState.isScheduled) {
                    setStatus('inactive', 'Inactivo');
                }
            });
        }
    }

    // Programar ejecución para una hora específica
    function scheduleExecution() {
        if (!validateInputs()) return;
        
        const horaInicio = horaInicioInput.value;
        if (!horaInicio) {
            addToResults('❌ Debe ingresar una hora válida');
            return;
        }
        
        // Calcular la fecha y hora de la próxima ejecución
        const [hours, minutes] = horaInicio.split(':').map(Number);
        const scheduleDate = new Date();
        
        scheduleDate.setHours(hours, minutes, 0, 0);
        
        // Si la hora ya pasó hoy, programar para mañana
        if (scheduleDate < new Date()) {
            scheduleDate.setDate(scheduleDate.getDate() + 1);
        }
        
        appState.scheduleTime = scheduleDate;
        appState.isScheduled = true;
        
        // Mostrar la hora programada
        const formattedDate = scheduleDate.toLocaleString('es-ES', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        setStatus('scheduled', 'Programado');
        nextExecutionElement.textContent = `Próxima ejecución: ${formattedDate}`;
        addToResults(`🕒 Ejecución programada para ${formattedDate}`);
        
        // Guardar en el servidor
        const params = getRequestParams();
        
        fetch('/api/schedule', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                ...params,
                scheduleTime: scheduleDate.toISOString() 
            })
        })
        .then(response => response.json())
        .then(data => {
            if (!data.success) {
                addToResults(`⚠️ Advertencia: ${data.error || 'Error al guardar en servidor'}`);
            }
        })
        .catch(error => {
            addToResults(`⚠️ Advertencia: ${error.message}`);
        });
    }

    // Ejecutar el proceso programado
    function executeScheduled() {
        if (appState.isScheduled) {
            appState.isScheduled = false;
            nextExecutionElement.textContent = '';
            runNow();
        }
    }

    // Detener la ejecución programada
    function stopExecution() {
        appState.isScheduled = false;
        appState.scheduleTime = null;
        
        setStatus('inactive', 'Inactivo');
        nextExecutionElement.textContent = '';
        addToResults('🛑 Ejecución programada cancelada');
        
        // Cancelar en el servidor
        fetch('/api/cancel', { method: 'POST' })
            .catch(error => console.error('Error al cancelar programación:', error));
    }

    // Cambiar estado visual
    function setStatus(type, text) {
        statusElement.textContent = text;
        statusElement.className = 'status-indicator';
        
        if (type === 'active') {
            statusElement.classList.add('status-active');
        } else if (type === 'scheduled') {
            statusElement.classList.add('status-scheduled');
        } else if (type === 'error') {
            statusElement.classList.add('status-error');
        }
    }

    // Validar entradas
    function validateInputs() {
        if (!dniInput.value || !codigoInput.value) {
            addToResults('❌ Debe ingresar DNI y Código de Matrícula');
            return false;
        }
        return true;
    }

    // Obtener parámetros para las solicitudes
    function getRequestParams() {
        return {
            dni: dniInput.value,
            codigo: codigoInput.value,
            numSolicitudes: parseInt(numSolicitudesInput.value),
            intervalo: parseInt(intervaloInput.value),
            horaInicio: horaInicioInput.value
        };
    }

    // Añadir mensaje a resultados
    function addToResults(message) {
        const timestamp = new Date().toLocaleTimeString();
        resultsElement.textContent = `[${timestamp}] ${message}\n${resultsElement.textContent}`;
    }

    // Limpiar resultados
    function clearResults() {
        resultsElement.textContent = 'Los resultados se mostrarán aquí...';
    }
    
    // Para recibir actualizaciones del servidor (usando EventSource o WebSockets)
    function setupServerUpdates() {
        // Crear fuente de eventos del servidor
        const eventSource = new EventSource('/api/events');
        
        // Escuchar eventos
        eventSource.onmessage = function(event) {
            const data = JSON.parse(event.data);
            addToResults(data.message);
            
            if (data.status) {
                setStatus(data.status.type, data.status.text);
            }
            
            if (data.complete) {
                if (!appState.isScheduled) {
                    setStatus('inactive', 'Inactivo');
                }
            }
        };
        
        // Manejar errores
        eventSource.onerror = function() {
            eventSource.close();
            setTimeout(setupServerUpdates, 5000); // Reintentar cada 5 segundos
        };
    }
    
    // Iniciar escucha de eventos del servidor
    setupServerUpdates();
});