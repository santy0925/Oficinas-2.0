// Obtiene la fecha actual y la formatea a una cadena ISO (ej. "AAAA-MM-DD")
const today = new Date();
const todayISO = today.toISOString().split('T')[0];

// Define la estructura de datos principal de la aplicación
let officeData = {
    office1: {
        fixedSeats: 0,
        rotativeSeats: 0,
        equipment: []
    },
    office2: {
        fixedSeats: 0,
        rotativeSeats: 0,
        equipment: []
    }
};

let equipmentIdCounter = 1;

/**
 * Carga los datos guardados de la aplicación desde el almacenamiento local.
 */
function loadData() {
    const savedOfficeData = localStorage.getItem('officeData');
    if (savedOfficeData) {
        appData = JSON.parse(savedOfficeData); // Error en la copia: debería ser officeData = JSON.parse(savedOfficeData);
        // Corrección:
        officeData = JSON.parse(savedOfficeData);
    }
    const savedCounter = localStorage.getItem('equipmentIdCounter');
    if (savedCounter) {
        equipmentIdCounter = parseInt(savedCounter);
    }
}

/**
 * Guarda los datos actuales de la aplicación en el almacenamiento local.
 */
function saveData() {
    localStorage.setItem('officeData', JSON.stringify(officeData));
    localStorage.setItem('equipmentIdCounter', equipmentIdCounter.toString());
}

/**
 * Actualiza la fecha actual mostrada en la página web.
 */
function updateCurrentDate() {
    const today = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('currentDate').textContent =
        today.toLocaleDateString('es-ES', options);
}

/**
 * Actualiza varias estadísticas mostradas en el panel de control.
 */
function updateStats() {
    const today = new Date().toISOString().split('T')[0];

    let totalFixedSeats = officeData.office1.fixedSeats + officeData.office2.fixedSeats;
    let totalRotativeSeats = officeData.office1.rotativeSeats + officeData.office2.rotativeSeats;
    let totalSeats = totalFixedSeats + totalRotativeSeats;

    let totalOccupiedRotativeSeatsToday = 0;
    let totalTodayEquipment = 0;

    // Suma los equipos y personas para hoy de ambas oficinas
    [officeData.office1, officeData.office2].forEach(office => {
        office.equipment.forEach(item => {
            if (item.date === today && item.status === 'presente') {
                totalOccupiedRotativeSeatsToday += item.people || 0;
                totalTodayEquipment++;
            }
        });
    });

    document.getElementById('totalSeats').textContent = totalSeats;
    document.getElementById('availableSeats').textContent = Math.max(totalRotativeSeats - totalOccupiedRotativeSeatsToday, 0);
    document.getElementById('todayEquipment').textContent = totalTodayEquipment;

    // Actualiza los displays individuales para cada oficina
    document.getElementById('fixedSeats701').textContent = officeData.office1.fixedSeats;
    document.getElementById('rotativeSeats701').textContent = officeData.office1.rotativeSeats;
    document.getElementById('fixedSeats702').textContent = officeData.office2.fixedSeats;
    document.getElementById('rotativeSeats702').textContent = officeData.office2.rotativeSeats;
}

/**
 * Actualiza los asientos fijos o rotativos de una oficina específica.
 * @param {number} officeNum - El número de la oficina (1 o 2).
 * @param {string} seatType - El tipo de asiento ('fixed' o 'rotative').
 * @param {string} value - El nuevo valor para los asientos.
 */
function updateOfficeSeats(officeNum, seatType, value) {
    const parsedValue = parseInt(value) || 0;
    if (officeNum === 1) {
        if (seatType === 'fixed') {
            officeData.office1.fixedSeats = parsedValue;
        } else {
            officeData.office1.rotativeSeats = parsedValue;
        }
    } else if (officeNum === 2) {
        if (seatType === 'fixed') {
            officeData.office2.fixedSeats = parsedValue;
        } else {
            officeData.office2.rotativeSeats = parsedValue;
        }
    }
    saveData();
    updateStats();
}

/**
 * Obtiene el día de la semana para una cadena de fecha dada.
 * @param {string} dateString - La fecha en formato 'AAAA-MM-DD'.
 * @returns {string} El día de la semana en español.
 */
function getDayOfWeek(dateString) {
    const date = new Date(dateString + 'T00:00:00'); // Añade 'T00:00:00' para evitar problemas de zona horaria
    const options = { weekday: 'long' };
    return date.toLocaleDateString('es-ES', options);
}

// Las funciones renderOfficeEquipment, addEquipment, deleteEquipment, updateEquipmentDate,
// updateEquipmentStatus, updateEquipmentPeople ya no se usan directamente para renderizar dentro de las
// secciones de oficina 701/702, pero se mantienen para la lógica de datos y la sección de "Gestión de Equipos".

/**
 * Renderiza la lista de equipos/grupos programados para hoy.
 * Muestra su nombre, estado, número de personas y fecha, indicando la oficina.
 */
function renderTodayEquipment() {
    const today = new Date().toISOString().split('T')[0];
    const container = document.getElementById('todayEquipmentList');
    const todayEquipments = [];
    let totalTodayPeople = 0;

    // Recopila los equipos programados para hoy de ambas oficinas
    [officeData.office1, officeData.office2].forEach(office => {
        office.equipment.forEach(item => {
            if (item.date === today) {
                todayEquipments.push({ ...item, officeNum: office === officeData.office1 ? 1 : 2 });
                totalTodayPeople += item.people || 0;
            }
        });
    });

    document.getElementById('todayEquipmentDetail').textContent = todayEquipments.length;
    document.getElementById('todayPeople').textContent = totalTodayPeople;
    container.innerHTML = '';

    if (todayEquipments.length === 0) {
        container.innerHTML = '<div style="text-align: center; color: #666; padding: 20px;">No hay equipos programados para hoy</div>';
        return;
    }

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
            <div style="margin-top: 5px; font-size: 0.9em; color: #555;">📍 Oficina: 70${item.officeNum}</div>
            ${item.people ? `<div style="margin-top: 5px; font-size: 0.9em; color: #555;">👥 Personas: ${item.people}</div>` : ''}
            <div style="margin-top: 10px; color: #27ae60; font-weight: bold;">${item.date} (${dayOfWeek})</div>
        `;
        container.appendChild(card);
    });
}

/**
 * Renderiza los equipos/grupos programados para días pasados y futuros.
 */
function renderAdjacentDayEquipment() {
    const today = new Date();
    const todayISO = today.toISOString().split('T')[0];
    const yesterdayContainer = document.getElementById('yesterdayEquipmentList');
    const yesterdayCount = document.getElementById('yesterdayCount');
    const yesterdayPeople = document.getElementById('yesterdayPeople');

    yesterdayContainer.innerHTML = '';

    const previousEquipments = [];
    let totalPreviousPeople = 0;
    const formatDate = date => date.toISOString().split('T')[0];

    // Recopila equipos de los últimos 10 días de ambas oficinas
    for (let i = 1; i <= 10; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        const dateStr = formatDate(date);
        [officeData.office1, officeData.office2].forEach(office => {
            office.equipment.forEach(item => {
                if (item.date === dateStr) {
                    previousEquipments.push({ ...item, label: `Hace ${i} día${i > 1 ? 's' : ''}`, officeNum: office === officeData.office1 ? 1 : 2 });
                    totalPreviousPeople += item.people || 0;
                }
            });
        });
    }

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
            <div style="margin-top: 5px; font-size: 0.9em; color: #555;">📍 Oficina: 70${item.officeNum}</div>
            ${item.people ? `<div style="margin-top: 5px; font-size: 0.9em; color: #555;">👥 Personas: ${item.people}</div>` : ''}
            <div style="margin-top: 10px; color: #e67e22; font-weight: bold;">${item.date} (${dayOfWeek}) - ${item.label}</div>
        `;
        return card;
    };

    yesterdayCount.textContent = previousEquipments.length;
    yesterdayPeople.textContent = totalPreviousPeople;

    if (previousEquipments.length === 0) {
        yesterdayContainer.innerHTML = '<div style="text-align: center; color: #666; padding: 20px;">No hubo equipos en los últimos días</div>';
    } else {
        previousEquipments.sort((a, b) => new Date(b.date) - new Date(a.date));
        previousEquipments.forEach(item => {
            yesterdayContainer.appendChild(renderCard(item));
        });
    }

    const nextDaysContainer = document.getElementById('tomorrowEquipmentList');
    const nextDaysCount = document.getElementById('tomorrowCount');
    const nextDaysPeople = document.getElementById('tomorrowPeople');

    nextDaysContainer.innerHTML = '';
    const nextDaysEquipments = [];
    let totalNextDaysPeople = 0;

    for (let i = 1; i <= 10; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        const dateStr = formatDate(date);

        [officeData.office1, officeData.office2].forEach(office => {
            office.equipment.forEach(item => {
                if (item.date === dateStr) {
                    const dayLabel = i === 1 ? 'Mañana' : `En ${i} días`;
                    nextDaysEquipments.push({ ...item, label: dayLabel, daysFromToday: i, officeNum: office === officeData.office1 ? 1 : 2 });
                    totalNextDaysPeople += item.people || 0;
                }
            });
        });
    }

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
            <div style="margin-top: 5px; font-size: 0.9em; color: #555;">📍 Oficina: 70${item.officeNum}</div>
            ${item.people ? `<div style="margin-top: 5px; font-size: 0.9em; color: #555;">👥 Personas: ${item.people}</div>` : ''}
            <div style="margin-top: 10px; color: #3498db; font-weight: bold;">📅 ${item.date} (${dayOfWeek}) - ${item.label}</div>
        `;
        return card;
    };

    nextDaysCount.textContent = nextDaysEquipments.length;
    nextDaysPeople.textContent = totalNextDaysPeople;

    if (nextDaysEquipments.length === 0) {
        nextDaysContainer.innerHTML = '<div style="text-align: center; color: #666; padding: 20px;">No hay equipos programados para los próximos días</div>';
    } else {
        nextDaysEquipments.sort((a, b) => a.daysFromToday - b.daysToday);
        nextDaysEquipments.forEach(item => {
            nextDaysContainer.appendChild(renderNextDaysCard(item));
        });
    }
}


/**
 * Añade un nuevo equipo a la oficina seleccionada.
 */
function addEquipment() {
    const officeNum = parseInt(document.getElementById("selectOffice").value);
    const name = document.getElementById("companyName").value.trim();
    const date = document.getElementById("companyDate").value;
    const status = document.getElementById("companyStatus").value;
    const people = parseInt(document.getElementById("companyPeople").value) || 0;

    if (!name || !date) {
        alert('Por favor, completa el nombre y la fecha.');
        return;
    }

    const newEquipment = {
        id: equipmentIdCounter++,
        name,
        date,
        status,
        people
    };

    officeData[`office${officeNum}`].equipment.push(newEquipment);

    document.getElementById("companyName").value = '';
    document.getElementById("companyDate").value = '';
    document.getElementById("companyStatus").value = 'presente';
    document.getElementById("companyPeople").value = '1';

    saveData();
    // Ya no se llama a renderOfficeEquipment(1) o (2) aquí, ya que no listamos equipos en esas secciones
    renderCompanyTeams(); // Actualiza el resumen de equipos
    renderTodayEquipment();
    renderAdjacentDayEquipment();
    updateStats();
}

/**
 * Elimina un equipo de una oficina específica.
 * @param {number} officeNum - El número de la oficina.
 * @param {number} equipmentId - El ID del equipo a eliminar.
 */
function deleteEquipment(officeNum, equipmentId) {
    if (confirm('¿Estás seguro de que quieres eliminar este equipo?')) {
        const office = officeData[`office${officeNum}`];
        office.equipment = office.equipment.filter(item => item.id !== equipmentId);
        saveData();
        // Ya no se llama a renderOfficeEquipment(officeNum) aquí
        renderCompanyTeams();
        renderTodayEquipment();
        renderAdjacentDayEquipment();
        updateStats();
    }
}

// Las funciones updateEquipmentDate, updateEquipmentStatus, updateEquipmentPeople
// solo se necesitan si hay elementos editables para esos campos. Como el resumen en
// Gestión de Equipos es más pequeño, estas funciones no se usarán desde allí.
// Sin embargo, las mantengo porque la estructura de datos sigue manejándolos
// y podrían ser útiles si se expande la funcionalidad en el futuro.
/**
 * Actualiza la fecha de un equipo en una oficina específica.
 * @param {number} officeNum - El número de la oficina.
 * @param {number} equipmentId - El ID del equipo.
 * @param {string} newDate - La nueva fecha.
 */
function updateEquipmentDate(officeNum, equipmentId, newDate) {
    const office = officeData[`office${officeNum}`];
    const equipment = office.equipment.find(item => item.id === equipmentId);
    if (equipment) {
        equipment.date = newDate;
        saveData();
        // No se renderiza la oficina aquí
        renderCompanyTeams(); // Actualiza el resumen de equipos
        renderTodayEquipment();
        renderAdjacentDayEquipment();
        updateStats();
    }
}

/**
 * Actualiza el estado de un equipo en una oficina específica.
 * @param {number} officeNum - El número de la oficina.
 * @param {number} equipmentId - El ID del equipo.
 * @param {string} newStatus - El nuevo estado.
 */
function updateEquipmentStatus(officeNum, equipmentId, newStatus) {
    const office = officeData[`office${officeNum}`];
    const equipment = office.equipment.find(item => item.id === equipmentId);
    if (equipment) {
        equipment.status = newStatus;
        saveData();
        // No se renderiza la oficina aquí
        renderCompanyTeams(); // Actualiza el resumen de equipos
        renderTodayEquipment();
        renderAdjacentDayEquipment();
        updateStats();
    }
}

/**
 * Actualiza el número de personas para un equipo en una oficina específica.
 * @param {number} officeNum - El número de la oficina.
 * @param {number} equipmentId - El ID del equipo.
 * @param {string} newPeople - El nuevo número de personas.
 */
function updateEquipmentPeople(officeNum, equipmentId, newPeople) {
    const office = officeData[`office${officeNum}`];
    const equipment = office.equipment.find(item => item.id === equipmentId);
    if (equipment) {
        equipment.people = parseInt(newPeople) || 0;
        saveData();
        // No se renderiza la oficina aquí
        renderCompanyTeams(); // Actualiza el resumen de equipos
        renderTodayEquipment();
        renderAdjacentDayEquipment();
        updateStats();
    }
}

/**
 * Renderiza el resumen de equipos en la sección de "Gestión de Equipos".
 * Solo muestra el nombre, la oficina y la fecha de los equipos.
 */
function renderCompanyTeams() {
    const container = document.getElementById("companyTeamsList");
    container.innerHTML = "";

    let allEquipments = [];
    allEquipments = allEquipments.concat(officeData.office1.equipment.map(item => ({ ...item, officeNum: 1 })));
    allEquipments = allEquipments.concat(officeData.office2.equipment.map(item => ({ ...item, officeNum: 2 })));

    // Ordenar por fecha para una mejor gestión
    allEquipments.sort((a, b) => new Date(a.date) - new Date(b.date));

    if (allEquipments.length === 0) {
        container.innerHTML = '<div style="text-align: center; color: #666; padding: 20px;">No hay equipos programados. Agrega uno nuevo.</div>';
        return;
    }

    allEquipments.forEach(item => {
        const card = document.createElement('div');
        card.className = 'company-team'; // Usar la clase `company-team` para un resumen más pequeño
        const dayOfWeek = getDayOfWeek(item.date);
        card.innerHTML = `
            <span><strong>${item.name}</strong></span>
            <span>📍 Oficina 70${item.officeNum}</span>
            <span>📅 ${item.date} (${dayOfWeek})</span>
            <button class="delete-btn" onclick="deleteEquipment(${item.officeNum}, ${item.id})">🗑️</button>
        `;
        container.appendChild(card);
    });
}


/**
 * Inicializa la aplicación al cargar la página.
 */
function init() {
    loadData();
    updateCurrentDate();

    // Establece los valores iniciales para los inputs de asientos de cada oficina
    document.getElementById('fixedSeatsInput701').value = officeData.office1.fixedSeats;
    document.getElementById('rotativeSeatsInput701').value = officeData.office1.rotativeSeats;
    document.getElementById('fixedSeatsInput702').value = officeData.office2.fixedSeats;
    document.getElementById('rotativeSeatsInput702').value = officeData.office2.rotativeSeats;

    // Establece la fecha predeterminada para el nuevo equipo a la fecha de hoy
    const todayLocal = new Date();
    const year = todayLocal.getFullYear();
    const month = (todayLocal.getMonth() + 1).toString().padStart(2, '0');
    const day = todayLocal.getDate().toString().padStart(2, '0');
    const formattedToday = `${year}-${month}-${day}`;
    document.getElementById('companyDate').value = formattedToday;

    // Las llamadas a renderOfficeEquipment(1) y (2) se eliminan aquí
    renderTodayEquipment();
    renderAdjacentDayEquipment();
    renderCompanyTeams();
    updateStats();
}

window.onload = init;