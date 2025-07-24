// Obtiene la fecha actual y la formatea a una cadena ISO (ej. "AAAA-MM-DD")
const today = new Date();
const todayISO = today.toISOString().split('T')[0];

// Define la estructura de datos principal de la aplicación
let appData = {
    fixedSeats: 0, // Asientos fijos totales
    rotativeSeats: 0, // Asientos rotativos totales
    equipment: [], // Lista centralizada de todos los equipos/grupos programados
};

// Contador para los IDs únicos de equipos
let equipmentIdCounter = 1;

/**
 * Carga los datos guardados de la aplicación y el contador de IDs de equipos desde el almacenamiento local.
 * Esto asegura la persistencia de los datos entre sesiones del navegador.
 */
function loadData() {
    const savedAppData = localStorage.getItem('appData');
    if (savedAppData) {
        appData = JSON.parse(savedAppData); // Parsea la cadena JSON de vuelta a un objeto
    }
    const savedCounter = localStorage.getItem('equipmentIdCounter');
    if (savedCounter) {
        equipmentIdCounter = parseInt(savedCounter); // Parsea la cadena de vuelta a un entero
    }
}

/**
 * Guarda los datos actuales de la aplicación y el contador de IDs de equipos en el almacenamiento local.
 * Los datos se convierten a una cadena JSON para su almacenamiento.
 */
function saveData() {
    localStorage.setItem('appData', JSON.stringify(appData));
    localStorage.setItem('equipmentIdCounter', equipmentIdCounter.toString());
}

/**
 * Actualiza la fecha actual mostrada en la página web.
 * La fecha se formatea para el idioma español.
 */
function updateCurrentDate() {
    const today = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('currentDate').textContent =
        today.toLocaleDateString('es-ES', options);
}

/**
 * Actualiza varias estadísticas mostradas en el panel de control, como:
 * - Total de asientos (rotativos + fijos)
 * - Asientos fijos
 * - Asientos rotativos
 * - Asientos rotativos disponibles para hoy
 * - Número de equipos/grupos programados para hoy
 */
function updateStats() {
    const today = new Date().toISOString().split('T')[0];

    const totalSeats = appData.fixedSeats + appData.rotativeSeats;

    let occupiedRotativeSeats = 0;
    let todayEquipmentCount = 0;

    // Itera a través de todos los equipos
    appData.equipment.forEach(equipment => {
        // Comprueba si el equipo está programado para hoy y su estado es "presente"
        if (equipment.date === today && equipment.status === 'presente') {
            occupiedRotativeSeats += equipment.people || 0; // Suma el número de personas
            todayEquipmentCount++;
        }
    });

    // Actualiza los elementos HTML con las estadísticas calculadas
    document.getElementById('totalSeats').textContent = totalSeats;
    document.getElementById('fixedSeatsDisplay').textContent = appData.fixedSeats;
    document.getElementById('rotativeSeatsDisplay').textContent = appData.rotativeSeats;
    // Asegura que los asientos disponibles no sean negativos
    document.getElementById('availableSeats').textContent = Math.max(appData.rotativeSeats - occupiedRotativeSeats, 0);
    document.getElementById('todayEquipment').textContent = todayEquipmentCount;
}

/**
 * Actualiza el número total de asientos rotativos.
 */
function updateOverallRotativeSeats() {
    appData.rotativeSeats = parseInt(document.getElementById('rotativeSeatsInput').value) || 0;
    saveData();
    updateStats();
}

/**
 * Actualiza el número total de asientos fijos.
 */
function updateOverallFixedSeats() {
    appData.fixedSeats = parseInt(document.getElementById('fixedSeatsInput').value) || 0;
    saveData();
    updateStats();
}

/**
 * Obtiene el día de la semana para una cadena de fecha dada.
 * @param {string} dateString - La fecha en formato 'AAAA-MM-DD'.
 * @returns {string} El día de la semana en español.
 */
function getDayOfWeek(dateString) {
    // Añade 'T00:00:00' para asegurar que la fecha se analiza en hora local, evitando problemas de zona horaria
    const date = new Date(dateString + 'T00:00:00');
    const options = { weekday: 'long' };
    return date.toLocaleDateString('es-ES', options);
}

/**
 * Renderiza la lista de equipos/grupos programados para hoy.
 * Muestra su nombre, estado, número de personas y fecha.
 */
function renderTodayEquipment() {
    const today = new Date().toISOString().split('T')[0];
    const container = document.getElementById('todayEquipmentList');
    const todayEquipments = [];
    let totalTodayPeople = 0;

    // Recopila los equipos programados para hoy
    appData.equipment.forEach(item => {
        if (item.date === today) {
            todayEquipments.push(item);
            totalTodayPeople += item.people || 0;
        }
    });

    document.getElementById('todayEquipmentDetail').textContent = todayEquipments.length;
    document.getElementById('todayPeople').textContent = totalTodayPeople;
    container.innerHTML = ''; // Limpia el contenido anterior

    // Muestra un mensaje si no hay equipos programados para hoy
    if (todayEquipments.length === 0) {
        container.innerHTML = '<div style="text-align: center; color: #666; padding: 20px;">No hay equipos programados para hoy</div>';
        return;
    }

    // Renderiza una tarjeta para cada equipo programado para hoy
    todayEquipments.forEach(item => {
        const card = document.createElement('div');
        card.className = 'equipment-card today-equipment';
        const dayOfWeek = getDayOfWeek(item.date);
        card.innerHTML = `
            <div class="equipment-header">
                <div class="equipment-name">${item.name}</div>
            </div>
            <div class="status-badge status-${item.status}">
                ${item.status === 'presente' ? '✅ Presente' : '❌ Ausente'}
            </div>
            ${item.people ? `<div style="margin-top: 5px; font-size: 0.9em; color: #555;">👥 Personas: ${item.people}</div>` : ''}
            <div style="margin-top: 10px; color: #27ae60; font-weight: bold;">${item.date} (${dayOfWeek})</div>
        `;
        container.appendChild(card);
    });
}

/**
 * Renderiza los equipos/grupos programados para días pasados y futuros (hasta 10 días en cada dirección).
 */
function renderAdjacentDayEquipment() {
    const today = new Date();
    const todayISO = today.toISOString().split('T')[0];
    const yesterdayContainer = document.getElementById('yesterdayEquipmentList');
    const yesterdayCount = document.getElementById('yesterdayCount');
    const yesterdayPeople = document.getElementById('yesterdayPeople');

    yesterdayContainer.innerHTML = ''; // Limpia el contenido anterior

    const previousEquipments = [];
    let totalPreviousPeople = 0;
    const formatDate = date => date.toISOString().split('T')[0];

    // Recopila equipos de los últimos 10 días
    for (let i = 1; i <= 10; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() - i); // Resta 'i' días a la fecha actual
        const dateStr = formatDate(date);
        appData.equipment.forEach(item => {
            if (item.date === dateStr) {
                // Añade una etiqueta para indicar cuántos días atrás fue
                previousEquipments.push({ ...item, label: `Hace ${i} día${i > 1 ? 's' : ''}` });
                totalPreviousPeople += item.people || 0;
            }
        });
    }

    /**
     * Función auxiliar para crear una tarjeta de equipo para días pasados/futuros.
     * @param {object} item - El elemento del equipo.
     * @returns {HTMLElement} El elemento de la tarjeta creado.
     */
    const renderCard = (item) => {
        const card = document.createElement('div');
        card.className = 'equipment-card';
        const dayOfWeek = getDayOfWeek(item.date);
        card.innerHTML = `
            <div class="equipment-header">
                <div class="equipment-name">${item.name}</div>
            </div>
            <div class="status-badge status-absent">
                ❌ Ausente
            </div>
            ${item.people ? `<div style="margin-top: 5px; font-size: 0.9em; color: #555;">👥 Personas: ${item.people}</div>` : ''}
            <div style="margin-top: 10px; color: #e67e22; font-weight: bold;">${item.date} (${dayOfWeek}) - ${item.label}</div>
        `;
        return card;
    };

    yesterdayCount.textContent = previousEquipments.length;
    yesterdayPeople.textContent = totalPreviousPeople;

    // Muestra un mensaje o renderiza las tarjetas para los días anteriores
    if (previousEquipments.length === 0) {
        yesterdayContainer.innerHTML = '<div style="text-align: center; color: #666; padding: 20px;">No hubo equipos en los últimos días</div>';
    } else {
        // Sort by date ascending for better readability
        previousEquipments.sort((a, b) => new Date(b.date) - new Date(a.date));
        previousEquipments.forEach(item => {
            yesterdayContainer.appendChild(renderCard(item));
        });
    }

    // --- Renderizar Días Siguientes ---
    const nextDaysContainer = document.getElementById('tomorrowEquipmentList');
    const nextDaysCount = document.getElementById('tomorrowCount');
    const nextDaysPeople = document.getElementById('tomorrowPeople');

    nextDaysContainer.innerHTML = ''; // Limpia el contenido anterior
    const nextDaysEquipments = [];
    let totalNextDaysPeople = 0;

    // Recopila equipos de los próximos 10 días
    for (let i = 1; i <= 10; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i); // Suma 'i' días a la fecha actual
        const dateStr = formatDate(date);

        appData.equipment.forEach(item => {
            if (item.date === dateStr) {
                const dayLabel = i === 1 ? 'Mañana' : `En ${i} días`;
                nextDaysEquipments.push({ ...item, label: dayLabel, daysFromToday: i });
                totalNextDaysPeople += item.people || 0;
            }
        });
    }

    /**
     * Función auxiliar para crear una tarjeta de equipo para los próximos días.
     * @param {object} item - El elemento del equipo.
     * @returns {HTMLElement} El elemento de la tarjeta creado.
     */
    const renderNextDaysCard = (item) => {
        const card = document.createElement('div');
        card.className = 'equipment-card';
        const dayOfWeek = getDayOfWeek(item.date);
        card.innerHTML = `
            <div class="equipment-header">
                <div class="equipment-name">${item.name}</div>
            </div>
            <div class="status-badge status-absent">
                ❌ Ausente
            </div>
            ${item.people ? `<div style="margin-top: 5px; font-size: 0.9em; color: #555;">👥 Personas: ${item.people}</div>` : ''}
            <div style="margin-top: 10px; color: #3498db; font-weight: bold;">📅 ${item.date} (${dayOfWeek}) - ${item.label}</div>
        `;
        return card;
    };

    nextDaysCount.textContent = nextDaysEquipments.length;
    nextDaysPeople.textContent = totalNextDaysPeople;

    // Muestra un mensaje o renderiza las tarjetas para los próximos días
    if (nextDaysEquipments.length === 0) {
        nextDaysContainer.innerHTML = '<div style="text-align: center; color: #666; padding: 20px;">No hay equipos programados para los próximos días</div>';
    } else {
        // Ordena los equipos próximos por su proximidad a hoy
        nextDaysEquipments.sort((a, b) => a.daysFromToday - b.daysFromToday);
        nextDaysEquipments.forEach(item => {
            nextDaysContainer.appendChild(renderNextDaysCard(item));
        });
    }
}

/**
 * Añade un nuevo equipo a la lista centralizada.
 * Valida los campos de entrada antes de añadir.
 */
function addCompanyTeam() {
    const name = document.getElementById("companyName").value.trim();
    const date = document.getElementById("companyDate").value;
    const status = document.getElementById("companyStatus").value;
    const people = parseInt(document.getElementById("companyPeople").value) || 0;

    // Validación de entrada
    if (!name || !date) {
        alert('Por favor, completa los campos de Nombre y Fecha.');
        return;
    }

    // Crea un nuevo objeto de equipo
    const newEquipment = {
        id: equipmentIdCounter++, // Asigna un ID único e incrementa el contador
        name,
        date,
        status,
        people
    };
    appData.equipment.push(newEquipment);

    // Limpia los campos de entrada después de añadir
    document.getElementById("companyName").value = '';
    document.getElementById("companyDate").value = '';
    document.getElementById("companyStatus").value = 'presente';
    document.getElementById("companyPeople").value = '1';

    saveData(); // Guarda los cambios
    renderCompanyTeams(); // Vuelve a renderizar la lista de equipos
    renderTodayEquipment(); // Actualiza la lista de equipos de hoy
    updateStats(); // Actualiza las estadísticas del panel de control
    renderAdjacentDayEquipment(); // Actualiza la lista de equipos de días adyacentes
}

/**
 * Elimina un equipo de la lista centralizada basándose en su ID.
 * Incluye una solicitud de confirmación.
 * @param {number} equipmentId - El ID del equipo a eliminar.
 */
function deleteEquipment(equipmentId) {
    if (confirm('¿Estás seguro de que quieres eliminar este equipo?')) {
        // Filtra el equipo a eliminar
        appData.equipment = appData.equipment.filter(item => item.id !== equipmentId);
        saveData();
        renderCompanyTeams();
        renderTodayEquipment();
        updateStats();
        renderAdjacentDayEquipment();
    }
}

/**
 * Actualiza la fecha de un elemento de equipo específico.
 * @param {number} equipmentId - El ID del equipo.
 * @param {string} newDate - La nueva fecha.
 */
function updateEquipmentDate(equipmentId, newDate) {
    const equipment = appData.equipment.find(item => item.id === equipmentId);
    if (equipment) {
        equipment.date = newDate;
        saveData();
        renderCompanyTeams();
        renderTodayEquipment();
        updateStats();
        renderAdjacentDayEquipment();
    }
}

/**
 * Actualiza el estado (presente/ausente) de un elemento de equipo específico.
 * @param {number} equipmentId - El ID del equipo.
 * @param {string} newStatus - El nuevo estado.
 */
function updateEquipmentStatus(equipmentId, newStatus) {
    const equipment = appData.equipment.find(item => item.id === equipmentId);
    if (equipment) {
        equipment.status = newStatus;
        saveData();
        renderCompanyTeams();
        renderTodayEquipment();
        updateStats();
        renderAdjacentDayEquipment();
    }
}

/**
 * Actualiza el número de personas asociadas con un elemento de equipo específico.
 * @param {number} equipmentId - El ID del equipo.
 * @param {string} newPeople - El nuevo número de personas (se analizará como entero).
 */
function updateEquipmentPeople(equipmentId, newPeople) {
    const equipment = appData.equipment.find(item => item.id === equipmentId);
    if (equipment) {
        equipment.people = parseInt(newPeople) || 0; // Parsea a entero, por defecto 0 si es inválido
        saveData();
        renderCompanyTeams();
        renderTodayEquipment();
        updateStats();
        renderAdjacentDayEquipment();
    }
}

/**
 * Renderiza la lista de equipos en la sección de gestión de equipos.
 * Permite editar la fecha, el estado y el número de personas, y eliminar equipos.
 */
function renderCompanyTeams() {
    const container = document.getElementById("companyTeamsList");
    container.innerHTML = ""; // Limpia el contenido anterior

    // Sort by date ascending for better management
    appData.equipment.sort((a, b) => new Date(a.date) - new Date(b.date));

    appData.equipment.forEach(item => {
        const card = document.createElement('div');
        card.className = 'equipment-card';
        const dayOfWeek = getDayOfWeek(item.date);
        card.innerHTML = `
            <div class="equipment-header">
                <div class="equipment-name">${item.name}</div>
                <button class="delete-btn" onclick="deleteEquipment(${item.id})">🗑️</button>
            </div>
            <div class="form-group">
                <label>Fecha:</label>
                <input type="date" value="${item.date}" onchange="updateEquipmentDate(${item.id}, this.value)">
            </div>
            <div class="form-group">
                <label>Estado:</label>
                <select onchange="updateEquipmentStatus(${item.id}, this.value)">
                    <option value="presente" ${item.status === 'presente' ? 'selected' : ''}>Presente</option>
                    <option value="ausente" ${item.status === 'ausente' ? 'selected' : ''}>Ausente</option>
                </select>
            </div>
            <div class="form-group">
                <label>Personas:</label>
                <input type="number" min="0" value="${item.people || ''}" onchange="updateEquipmentPeople(${item.id}, this.value)">
            </div>
            <div style="margin-top: 10px; color: #555; font-weight: bold;">${item.date} (${dayOfWeek})</div>
        `;
        container.appendChild(card);
    });
    // If there are no teams, display a message
    if (appData.equipment.length === 0) {
        container.innerHTML = '<div style="text-align: center; color: #666; padding: 20px;">No hay equipos programados. Agrega uno nuevo.</div>';
    }
}

/**
 * Inicializa la aplicación:
 * - Carga los datos del almacenamiento local.
 * - Actualiza la visualización de la fecha actual.
 * - Establece los valores iniciales para las entradas de asientos.
 * - Establece la fecha predeterminada para el nuevo equipo a la fecha actual.
 * - Renderiza todas las listas de equipos y actualiza las estadísticas.
 */
function init() {
    loadData(); // Carga datos al iniciar
    updateCurrentDate(); // Actualiza la fecha mostrada

    // Establece los valores iniciales para los campos de entrada de asientos desde los datos cargados
    document.getElementById('fixedSeatsInput').value = appData.fixedSeats;
    document.getElementById('rotativeSeatsInput').value = appData.rotativeSeats;

    // Establece la fecha predeterminada para las nuevas entradas de equipo a la fecha de hoy
    const todayLocal = new Date();
    const year = todayLocal.getFullYear();
    const month = (todayLocal.getMonth() + 1).toString().padStart(2, '0'); // El mes es de 0 a 11, por eso +1
    const day = todayLocal.getDate().toString().padStart(2, '0');
    const formattedToday = `${year}-${month}-${day}`;

    document.getElementById('companyDate').value = formattedToday;

    // Renderización inicial de todos los componentes
    renderCompanyTeams();
    renderTodayEquipment();
    renderAdjacentDayEquipment();
    updateStats();
}

// Escuchador de eventos para inicializar la gestión principal de oficinas/equipos cuando la ventana se carga
window.onload = init;s