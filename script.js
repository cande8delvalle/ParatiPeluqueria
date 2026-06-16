fetch("navbar.html")
  .then(res => res.text())
  .then(data => {
    const navbarEl = document.getElementById("navbar");
    if (!navbarEl) return;
    navbarEl.innerHTML = data;

    const isIndex = window.location.pathname.endsWith("index.html") || 
                    window.location.pathname === "/" || 
                    window.location.pathname.endsWith("/");
    if (!isIndex) {
      const navLinks = document.querySelectorAll("#navbar .nav-link, #navbar .navbar-brand");
      navLinks.forEach(link => {
        const href = link.getAttribute("href");
        if (href && href.startsWith("#")) {
          link.setAttribute("href", "index.html" + href);
        }
      });
    }
    
    //  menú hamburguesa
    const hamburger = document.getElementById('hamburger-menu');
    const navbarMenu = document.getElementById('navbar-menu');
    const navMobile = document.getElementById('nav-mobile');
    
    if (hamburger && navbarMenu) {
      hamburger.addEventListener('click', function() {
        this.classList.toggle('active');
        navbarMenu.classList.toggle('active');
      });

      // cierra el menu alk hacer click en un link
      if (navMobile) {
        const mobileLinks = navMobile.querySelectorAll('a');
        mobileLinks.forEach(link => {
          link.addEventListener('click', function() {
            hamburger.classList.remove('active');
            navbarMenu.classList.remove('active');
          });
        });
      }
    }
  });

fetch("footer.html")
  .then(res => res.text())
  .then(data => {
    const footerEl = document.getElementById("footer");
    if (footerEl) {
      footerEl.innerHTML = data;
    }
  });

// CONFIGURACIÓN GLOBAL DE EMAILJS
const EMAILJS_PUBLIC_KEY = 'nT3RJhFUfjBhzDJI8';
const EMAILJS_SERVICE_ID = 'service_2pchi1s';
const EMAILJS_TEMPLATE_ID = 'template_h3chgdh'; // Para recuperación de contraseña
const EMAILJS_TEMPLATE_SOLICITADO_ID = 'template_solicitado'; // Para nuevo turno solicitado
const EMAILJS_TEMPLATE_CONFIRMADO_ID = 'template_confirmado'; // Para turno confirmado

// Inicializar EmailJS si está disponible
if (typeof window.emailjs !== "undefined" && typeof window.emailjs.init === "function") {
  emailjs.init(EMAILJS_PUBLIC_KEY);
  console.log('EmailJS inicializado correctamente a nivel global.');
}


// Días laborables: 0=Dom, 1=Lun, 2=Mar, 3=Mié, 4=Jue, 5=Vie, 6=Sáb
// Ajustar según los días que trabaja el salón (por ej. sin lunes → quitar el 1)
const WORKING_DAYS = [2, 3, 4, 5, 6]; // Mar a Sáb (sin Lunes = día del peluquero)

// Horarios de trabajo disponibles
const ALL_TIMES = [
    "09:00 - 09:30",
    "09:30 - 10:00",
    "10:00 - 10:30",
    "10:30 - 11:00",
    "11:00 - 11:30",
    "11:30 - 12:00",
    "14:00 - 14:30",
    "14:30 - 15:00",
    "15:00 - 15:30",
    "15:30 - 16:00",
    "16:00 - 16:30",
    "16:30 - 17:00"
];


const today = new Date();
today.setHours(0, 0, 0, 0);

let currentYear  = today.getFullYear();
let currentMonth = today.getMonth();
let selectedDate = null;
let selectedTime = null;
let currentStep  = 1;

// Listado de servicios dinámicos con precio y duración
const SERVICES_DATA = [
    {
        id: "semipermanente",
        name: "Semipermanente",
        price: 15000,
        duration: "45 min",
        desc: "Color duradero y brillo perfecto por más tiempo.",
        img: "img/corte.jpg"
    },
    {
        id: "tradicional",
        name: "Esmaltado Tradicional",
        price: 10000,
        duration: "30 min",
        desc: "Opción clásica y delicada para un look natural.",
        img: "img/tradii.jpeg"
    },
    {
        id: "capping",
        name: "Capping U-Dip",
        price: 18000,
        duration: "60 min",
        desc: "Refuerza tus uñas naturales con mayor resistencia y duración.",
        img: "img/cappiPortada.jpeg"
    },
    {
        id: "construccion",
        name: "Sistema de Construcción",
        price: 25000,
        duration: "90 min",
        desc: "Largo, forma y estructura para uñas más definidas y duraderas.",
        img: "img/contrucion.jpeg"
    },
    {
        id: "spa_manos",
        name: "Spa de Manos",
        price: 12000,
        duration: "40 min",
        desc: "Cuidado, hidratación y suavidad para manos impecables.",
        img: "img/spamanos.jpeg"
    },
    {
        id: "spa_pies",
        name: "Spa de Pies",
        price: 15000,
        duration: "50 min",
        desc: "Relajación y cuidado profundo para lucir pies impecables.",
        img: "img/spaP.jpeg"
    }
];

let selectedServices = []; // Almacena los IDs de servicios seleccionados

// Cache de feriados: { "YYYY": Set(["YYYY-MM-DD", ...]) }
const holidaysCache = {};

const MONTH_NAMES = [
    "Enero","Febrero","Marzo","Abril","Mayo","Junio",
    "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"
];
const DAY_LETTERS = ["D","L","M","M","J","V","S"];

// Feriados obtengo de API: https://date.nager.at/swagger/index.html

async function fetchHolidays(year) {
    if (holidaysCache[year]) return holidaysCache[year]; // ya en caché

    try {
        const res = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${year}/AR`);
        if (!res.ok) throw new Error("No se pudo obtener feriados");
        const data = await res.json();
        // Guardamos solo las fechas en un Set para búsqueda O(1)
        holidaysCache[year] = new Set(data.map(h => h.date)); // "YYYY-MM-DD"
    } catch (e) {
        console.warn("Feriados no disponibles, se usan solo días laborables:", e.message);
        holidaysCache[year] = new Set(); // fallback vacío → igual funciona
    }

    return holidaysCache[year];
}

function isHoliday(year, month, day, holidaySet) {
    const mm = String(month + 1).padStart(2, "0");
    const dd = String(day).padStart(2, "0");
    return holidaySet.has(`${year}-${mm}-${dd}`);
}

//disponibilidad- se podria ampliar para tomar desde backend o desde google calendar

function isDayFullyBooked(year, month, day) {
    const yStr = String(year);
    const mStr = String(month + 1).padStart(2, "0");
    const dStr = String(day).padStart(2, "0");
    const dateISO = `${yStr}-${mStr}-${dStr}`;
    
    // Considerar ocupados los turnos pendientes o aceptados
    const bookings = getBookings().filter(b => b.dateISO === dateISO && b.status !== "rejected");
    return bookings.length >= ALL_TIMES.length;
}

function isDateAvailable(year, month, day, holidaySet) {
    const date = new Date(year, month, day);
    date.setHours(0, 0, 0, 0);
    return (
        date >= today &&                              // no es pasado
        WORKING_DAYS.includes(date.getDay()) &&       // es día laborable
        !isHoliday(year, month, day, holidaySet) &&   // no es feriado
        !isDayFullyBooked(year, month, day)           // no está completamente ocupado
    );
}

//Calendario 
window.addEventListener("DOMContentLoaded", () => {
    // Solo corre en la página de reservas (verifica que el calendario exista)
    if (!document.getElementById("calendarGrid")) return;

    initBookingPage();
});

async function initBookingPage() {
    // Pre-carga feriados del año actual (y del siguiente por si el usuario navega)
    await fetchHolidays(currentYear);
    fetchHolidays(currentYear + 1); // en background, sin await

    renderServicesList();
    renderCalendar(currentYear, currentMonth);
    populateHours();
}

async function renderCalendar(year, month) {
    const holidays = await fetchHolidays(year);

    document.getElementById("calendarMonthYear").innerText =
        `${MONTH_NAMES[month]} ${year}`;

    const grid = document.getElementById("calendarGrid");
    grid.innerHTML = "";

    // Encabezado D L M M J V S
    const headerRow = document.createElement("div");
    headerRow.className = "calendar-row";
    DAY_LETTERS.forEach(d => {
        const cell = document.createElement("div");
        cell.className = "calendar-cell header";
        cell.innerText = d;
        headerRow.appendChild(cell);
    });
    grid.appendChild(headerRow);

    const firstWeekday = new Date(year, month, 1).getDay();
    const totalDays    = new Date(year, month + 1, 0).getDate();
    const prevTotal    = new Date(year, month, 0).getDate();

    let dayCounter = 1;
    for (let week = 0; week < 6; week++) {
        const row = document.createElement("div");
        row.className = "calendar-row";
        let rowHasDays = false;

        for (let col = 0; col < 7; col++) {
            const cell = document.createElement("div");
            cell.className = "calendar-cell";

            if (week === 0 && col < firstWeekday) {
                cell.innerText = prevTotal - firstWeekday + col + 1;
                cell.classList.add("day-disabled");
            } else if (dayCounter > totalDays) {
                cell.innerText = dayCounter - totalDays;
                cell.classList.add("day-disabled");
                dayCounter++;
            } else {
                rowHasDays = true;
                cell.innerText = dayCounter;

                if (isDateAvailable(year, month, dayCounter, holidays)) {
                    cell.classList.add("day-active");
                    const d = dayCounter;
                    cell.onclick = () => selectDate(year, month, d, cell);

                    if (selectedDate &&
                        selectedDate.getDate()     === d     &&
                        selectedDate.getMonth()    === month &&
                        selectedDate.getFullYear() === year) {
                        cell.classList.add("day-selected");
                    }
                } else {
                    cell.classList.add("day-disabled");
                }
                dayCounter++;
            }
            row.appendChild(cell);
        }

        if (rowHasDays || week < 5) grid.appendChild(row);
    }
}

function prevMonth() {
    if (currentMonth === 0) { currentMonth = 11; currentYear--; }
    else currentMonth--;
    renderCalendar(currentYear, currentMonth);
}

function nextMonth() {
    if (currentMonth === 11) { currentMonth = 0; currentYear++; }
    else currentMonth++;
    fetchHolidays(currentYear); // pre-fetch si cambiamos de año
    renderCalendar(currentYear, currentMonth);
}

function selectDate(year, month, day, cellEl) {
    selectedDate = new Date(year, month, day);
    document.querySelectorAll(".calendar-cell").forEach(c => c.classList.remove("day-selected"));
    cellEl.classList.add("day-selected");
    document.getElementById("btnNextToHours").disabled = false;
}

//Horarios


function populateHours() {
    const container = document.getElementById("hoursList");
    if (!container) return;
    container.innerHTML = "";

    // Filtrar horarios ya reservados para el día seleccionado
    let availableTimes = ALL_TIMES;
    if (selectedDate) {
        const y = selectedDate.getFullYear();
        const m = String(selectedDate.getMonth() + 1).padStart(2, "0");
        const d = String(selectedDate.getDate()).padStart(2, "0");
        const dateISO = `${y}-${m}-${d}`;
        
        const bookedTimes = getBookings()
            .filter(b => b.dateISO === dateISO && b.status !== "rejected")
            .map(b => b.time);
            
        availableTimes = ALL_TIMES.filter(time => !bookedTimes.includes(time));
    }

    if (availableTimes.length === 0) {
        container.innerHTML = `
            <div class="text-center py-4 text-muted">
                <i class="bi bi-exclamation-circle d-block mb-2" style="font-size: 1.5rem;"></i>
                No hay horarios disponibles para este día
            </div>`;
        return;
    }

    availableTimes.forEach(time => {
        const item = document.createElement("div");
        item.className = "hour-item" + (selectedTime === time ? " selected" : "");
        item.innerHTML = `
            <div class="d-flex align-items-center gap-3">
                <i class="bi bi-clock"></i>
                <span>${time}</span>
            </div>
            <i class="bi bi-chevron-right"></i>`;
        item.onclick = () => selectTime(time, item);
        container.appendChild(item);
    });
}

function selectTime(time, element) {
    selectedTime = time;
    document.querySelectorAll(".hour-item").forEach(i => i.classList.remove("selected"));
    element.classList.add("selected");
    document.getElementById("btnNextToData").disabled = false;
}

// Renderizado de servicios
function renderServicesList() {
    const container = document.getElementById("servicesGrid");
    if (!container) return;
    
    container.innerHTML = SERVICES_DATA.map(s => `
        <div class="col-12 col-sm-6">
            <div class="card service-select-card ${selectedServices.includes(s.id) ? 'selected' : ''}" data-service-id="${s.id}">
                <img src="${s.img}" class="card-img-top service-select-img" alt="${s.name}">
                <div class="card-body d-flex flex-column">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                        <h5 class="service-select-title">${s.name}</h5>
                        <div class="text-end">
                            <div class="service-select-price">$${s.price.toFixed(2).replace(".", ",")}</div>
                            <div class="service-select-duration">${s.duration}</div>
                        </div>
                    </div>
                    <p class="service-select-text">${s.desc}</p>
                    <button class="btn-select-service" type="button" onclick="toggleService('${s.id}')">SELECCIONAR</button>
                </div>
            </div>
        </div>
    `).join("");
}

function toggleService(id) {
    const idx = selectedServices.indexOf(id);
    if (idx === -1) {
        selectedServices.push(id);
    } else {
        selectedServices.splice(idx, 1);
    }
    
    // Cambiar clase selected
    const card = document.querySelector(`.service-select-card[data-service-id="${id}"]`);
    if (card) {
        card.classList.toggle("selected");
    }
    
    // Habilitar/deshabilitar botón Siguiente del Step 1
    const btnNext = document.getElementById("btnNextToCalendar");
    if (btnNext) {
        btnNext.disabled = selectedServices.length === 0;
    }
}

//navegacion step by step

function goToStep(step) {
    currentStep = step;
    document.querySelectorAll(".booking-step-content").forEach(c => c.classList.remove("active"));
    document.getElementById(`stepContent${step}`).classList.add("active");
    if (step === 2) goToCalendar();
    updateStepper(step);
}

function goToHours() {
    document.getElementById("subStepCalendar").style.display = "none";
    document.getElementById("subStepHours").style.display = "block";
    populateHours();
}

function goToCalendar() {
    document.getElementById("subStepHours").style.display = "none";
    document.getElementById("subStepCalendar").style.display = "block";
}

function backToHours() {
    goToStep(2);
    goToHours();
}

function updateStepper(step) {
    const fill = document.getElementById("stepperLineFill");
    [1, 2, 3].forEach(n => {
        const el = document.getElementById(`stepIndicator${n}`);
        el.classList.remove("active", "completed");
        if (n < step)  el.classList.add("completed");
        if (n === step) el.classList.add("active");
    });
    fill.style.width = step === 1 ? "0%" : step === 2 ? "50%" : "100%";
}



/* --- PERSISTENCIA EN LOCALSTORAGE ----------------------------------------- */

const LS_KEY = "paraTi_bookings";

function getBookings() {
    return JSON.parse(localStorage.getItem(LS_KEY) || "[]");
}

function saveBookings(bookings) {
    localStorage.setItem(LS_KEY, JSON.stringify(bookings));
}

/* --- CONFIRMACIÓN FINAL --------------------------------------------------- */

function confirmBooking(event) {
    event.preventDefault();

    const name  = document.getElementById("clientName").value;
    const email = document.getElementById("clientEmail").value;
    const phone = document.getElementById("clientPhone").value;
    const notes = document.getElementById("clientNotes").value;

    const options = { weekday: "long", year: "numeric", month: "long", day: "numeric" };
    let dateStr = selectedDate.toLocaleDateString("es-ES", options);
    dateStr = dateStr.charAt(0).toUpperCase() + dateStr.slice(1);

    // Obtener nombres de servicios seleccionados
    const serviceNames = selectedServices.map(id => {
        const s = SERVICES_DATA.find(x => x.id === id);
        return s ? s.name : id;
    });

    // Guardar en localStorage
    const booking = {
        id: Date.now(),                            // ID único por timestamp
        status: "pending",                         // pending | accepted | rejected
        dateISO: selectedDate.toISOString().split("T")[0],
        dateStr,
        time: selectedTime,
        services: serviceNames,
        name,
        email,
        phone,
        notes,
        createdAt: new Date().toLocaleString("es-ES")
    };

    const bookings = getBookings();
    bookings.push(booking);
    saveBookings(bookings);

    // Mostrar pantalla de éxito
    document.getElementById("summaryServices").innerText = serviceNames.join(", ");
    document.getElementById("summaryDate").innerText = dateStr;
    document.getElementById("summaryTime").innerText = selectedTime;
    document.getElementById("summaryName").innerText = name;

    document.querySelectorAll(".booking-step-content").forEach(c => c.classList.remove("active"));
    document.getElementById("stepContentSuccess").classList.add("active");
    document.querySelector(".stepper-container").style.display = "none";
}

/* --- ENVÍO DE EMAIL NOTIFICACIONES DE TURNOS (EMAILJS) --- */

function sendBookingConfirmationToClient(booking) {
    if (typeof window.emailjs === "undefined" || typeof window.emailjs.send !== "function") {
        console.warn("EmailJS no está disponible para enviar la confirmación al cliente.");
        return;
    }
    
    if (!booking.email) {
        console.warn("El turno no tiene un correo de cliente asociado.");
        return;
    }

    const servicesText = Array.isArray(booking.services) 
        ? booking.services.join(", ") 
        : (booking.services || "Sin especificar");

    const messageText = `¡Hola ${booking.name}!\n\n` +
        `Nos complace informarte que tu turno en Para Ti Peluquería ha sido confirmado.\n\n` +
        `Detalles del turno:\n` +
        `- Servicio(s): ${servicesText}\n` +
        `- Fecha: ${booking.dateStr}\n` +
        `- Hora: ${booking.time}\n\n` +
        `¡Te esperamos en el salón Raquel Rodríguez!`;

    const templateParams = {
        subject: "Confirmación de Turno - Para Ti Peluquería",
        message: messageText,
        to_email: booking.email,
        from_email: "paratipeluqueria04@gmail.com",
        
        // Variables individuales específicas para plantillas dedicadas
        client_name: booking.name,
        services: servicesText,
        date_str: booking.dateStr,
        time_str: booking.time
    };

    console.log("Enviando correo de confirmación al cliente con parámetros:", templateParams);

    emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_CONFIRMADO_ID, templateParams)
        .then(() => console.log(`Confirmación de turno enviada con éxito al cliente: ${booking.email}`))
        .catch(err => console.error(`Error enviando confirmación a ${booking.email}:`, err));
}





/* =============================================================================
   ADMIN PANEL — Solo corre en admin.html
   LS_KEY, MONTH_NAMES, getBookings, saveBookings ya están declarados arriba.
   ============================================================================= */

const LS_AUTH        = "paraTi_adminAuth";

/* --- Autenticación --- */
function doLogout() {
    sessionStorage.removeItem(LS_AUTH);
    window.location.href = "login.html";
}

function showAdmin() {
    const adminShell = document.getElementById("adminShell");
    if (adminShell) {
        adminShell.style.display = "block";
    }

    // Carga navbar (que ya sabe mostrarse en modo admin por body.admin-page)
    fetch("navbar.html")
        .then(r => r.text())
        .then(html => {
            const navbarEl = document.getElementById("navbar");
            if (navbarEl) {
                navbarEl.innerHTML = html;
            }
        });

    renderAll();
    renderAdminCalendar(calYear, calMonth);
}

/* --- Gestión de estado de turnos --- */
function updateBookingStatus(id, status) {
    const bookings = getBookings();
    const booking = bookings.find(b => b.id === id);
    if (booking) {
        booking.status = status;
        saveBookings(bookings);
        renderAll();
        renderAdminCalendar(calYear, calMonth);

        // Enviar email al cliente si el turno es confirmado
        if (status === "accepted") {
            sendBookingConfirmationToClient(booking);
        }
    }
}

/* --- Navegación de secciones (navbar + sidebar) --- */
function switchSection(section) {
    // Navbar links
    document.querySelectorAll(".admin-nav-link").forEach(l => l.classList.remove("active"));
    const navLink = document.querySelector(`.admin-nav-link[onclick*="'${section}'"]`);
    if (navLink) navLink.classList.add("active");

    // Sidebar links
    ["sidebarServicios", "sidebarTurnos"].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.remove("active");
    });
    const sidebarId = section === "turnos" ? "sidebarTurnos" : "sidebarServicios";
    const sidebarEl = document.getElementById(sidebarId);
    if (sidebarEl) sidebarEl.classList.add("active");

    // Submenú turnos visible solo cuando la sección es turnos
    const submenu = document.getElementById("submenuTurnos");
    if (submenu) submenu.classList.toggle("open", section === "turnos");

    // Sections
    document.querySelectorAll(".admin-section").forEach(s => s.classList.remove("active"));
    const sectionEl = document.getElementById(`section${section.charAt(0).toUpperCase() + section.slice(1)}`);
    if (sectionEl) sectionEl.classList.add("active");

    // Si cambia a turnos, activar Pendientes por default
    if (section === "turnos") switchSubPanel("turnos", "pending");
}

/* --- Navegación de sub-paneles (sidebar sub-items) --- */
function switchSubPanel(section, panel) {
    // Sub-links del sidebar
    ["subPending", "subCalendar", "subHistory"].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.remove("active");
    });
    const subMap = { pending: "subPending", calendar: "subCalendar", history: "subHistory" };
    const subEl = document.getElementById(subMap[panel]);
    if (subEl) subEl.classList.add("active");

    // Sub-paneles de contenido
    document.querySelectorAll(".admin-sub-panel").forEach(p => p.classList.remove("active"));
    const panelMap = { pending: "panelPending", calendar: "panelCalendar", history: "panelHistory" };
    const panelEl = document.getElementById(panelMap[panel]);
    if (panelEl) panelEl.classList.add("active");
}

/* --- LEGACY: switchTab alias (por compatibilidad) --- */
function switchTab(name) { switchSubPanel("turnos", name); }

/* --- Render listas --- */
function renderAll() {
    const bookings = getBookings();
    const pending  = bookings.filter(b => b.status === "pending");
    const accepted = bookings.filter(b => b.status === "accepted");
    const rejected = bookings.filter(b => b.status === "rejected");

    const badge = document.getElementById("pendingCount");
    if (badge) badge.innerText = pending.length;

    renderList("pendingList", pending, true);
    renderList("historyList", [...accepted, ...rejected].sort((a, b) => b.id - a.id), false);
}

function renderList(containerId, bookings, showActions) {
    const container = document.getElementById(containerId);
    if (bookings.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="bi bi-inbox"></i>
                Sin turnos para mostrar
            </div>`;
        return;
    }
    container.innerHTML = bookings.map(b => bookingCard(b, showActions)).join("");
}

function bookingCard(b, showActions) {
    const badge = b.status === "accepted"
        ? `<span class="status-badge status-accepted"><i class="bi bi-check-circle me-1"></i>Aceptado</span>`
        : b.status === "rejected"
        ? `<span class="status-badge status-rejected"><i class="bi bi-x-circle me-1"></i>Rechazado</span>`
        : "";

    const actions = showActions ? `
        <div class="booking-item-actions">
            <button class="btn-accept" onclick="updateBookingStatus(${b.id},'accepted')">
                <i class="bi bi-check-lg"></i> Aceptar
            </button>
            <button class="btn-reject" onclick="updateBookingStatus(${b.id},'rejected')">
                <i class="bi bi-x-lg"></i> Rechazar
            </button>
        </div>` : `<div style="padding-top:4px">${badge}</div>`;

    return `
    <div class="booking-item">
        <div class="booking-item-icon"><i class="bi bi-person-fill"></i></div>
        <div class="booking-item-body">
            <div class="booking-item-name">${b.name}</div>
            <div class="booking-item-meta">
                <span><i class="bi bi-calendar3 me-1"></i>${b.dateStr}</span>
                <span><i class="bi bi-clock me-1"></i>${b.time}</span>
            </div>
            <div class="booking-item-meta">
                <span><i class="bi bi-scissors me-1"></i>${b.services ? b.services.join(", ") : "Sin especificar"}</span>
            </div>
            <div class="booking-item-meta">
                <span><i class="bi bi-envelope me-1"></i>${b.email}</span>
                <span><i class="bi bi-whatsapp me-1"></i>${b.phone}</span>
            </div>
            ${b.notes ? `<div class="booking-item-notes"><i class="bi bi-chat-left-text me-1"></i>${b.notes}</div>` : ""}
            <div style="font-size:0.75rem;color:#bbb;margin-top:4px">Solicitado: ${b.createdAt}</div>
        </div>
        ${actions}
    </div>`;
}

/* --- Calendario admin --- */
const adminToday = new Date();
let calYear  = adminToday.getFullYear();
let calMonth = adminToday.getMonth();

function calPrev() {
    if (calMonth === 0) { calMonth = 11; calYear--; } else calMonth--;
    renderAdminCalendar(calYear, calMonth);
}

function calNext() {
    if (calMonth === 11) { calMonth = 0; calYear++; } else calMonth++;
    renderAdminCalendar(calYear, calMonth);
}

function renderAdminCalendar(year, month) {
    const label = document.getElementById("calMonthLabel");
    if (!label) return;
    label.innerText = `${MONTH_NAMES[month]} ${year}`;

    const grid = document.getElementById("adminCalGrid");
    grid.innerHTML = "";

    const dayLetters = ["D", "L", "M", "M", "J", "V", "S"];
    dayLetters.forEach(d => {
        const h = document.createElement("div");
        h.className = "cal-cell cal-header";
        h.innerText = d;
        grid.appendChild(h);
    });

    const accepted = getBookings()
        .filter(b => b.status === "accepted")
        .map(b => b.dateISO);

    const firstDay  = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    const todayStr  = adminToday.toISOString().split("T")[0];

    for (let i = 0; i < firstDay; i++) {
        const e = document.createElement("div");
        e.className = "cal-cell cal-empty";
        grid.appendChild(e);
    }

    for (let d = 1; d <= totalDays; d++) {
        const mm     = String(month + 1).padStart(2, "0");
        const dd     = String(d).padStart(2, "0");
        const isoStr = `${year}-${mm}-${dd}`;
        const count  = accepted.filter(x => x === isoStr).length;

        const cell = document.createElement("div");
        cell.className = "cal-cell";
        cell.innerText = d;

        if (isoStr === todayStr) cell.classList.add("cal-today");
        if (count > 0) {
            cell.classList.add("cal-has-booking");
            cell.title = `${count} turno(s)`;
            cell.onclick = () => showDayBookings(isoStr);
        }
        grid.appendChild(cell);
    }

    document.getElementById("dayBookingsList").innerHTML = "";
}

function showDayBookings(isoStr) {
    const bookings = getBookings().filter(b => b.status === "accepted" && b.dateISO === isoStr);
    const container = document.getElementById("dayBookingsList");

    const [y, m, d] = isoStr.split("-");
    const dateLabel = new Date(+y, +m - 1, +d)
        .toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

    container.innerHTML = `
        <h5 style="font-family:'DM Serif Display',serif;color:#5A2A3A;margin-bottom:1rem;text-transform:capitalize">${dateLabel}</h5>
        ${bookings.map(b => bookingCard(b, false)).join("")}`;
}

/* --- Init admin (solo en admin.html) --- */
window.addEventListener("DOMContentLoaded", () => {
    if (!document.getElementById("adminShell")) return; // guard: no es admin.html

    if (sessionStorage.getItem(LS_AUTH) === "1") {
        showAdmin();
    } else {
        window.location.href = "login.html";
    }
});

/* --- Toggle sidebar --- */
function toggleSidebar() {
    const sidebar = document.getElementById("adminSidebar");
    const icon    = document.getElementById("sidebarToggleIcon");
    if (!sidebar) return;

    sidebar.classList.toggle("collapsed");
    const isCollapsed = sidebar.classList.contains("collapsed");
    icon.className = isCollapsed ? "bi bi-chevron-right" : "bi bi-chevron-left";
}


function safeBtoa(str) {
  try {
    return btoa(unescape(encodeURIComponent(str)));
  } catch (e) {
    console.error('Error encoding Base64:', e);
    return btoa(str);
  }
}

function safeAtob(str) {
  try {
    return decodeURIComponent(escape(atob(str)));
  } catch (e) {
    console.error('Error decoding Base64:', e);
    return atob(str);
  }
}

const LS_ACCOUNTS = "paraTi_adminAccounts";

function getAdminAccounts() {
  let accounts = [];
  try {
    const data = localStorage.getItem(LS_ACCOUNTS);
    if (data) {
      accounts = JSON.parse(data);
    }
  } catch (e) {
    console.error("Error parsing accounts:", e);
  }
  
  // Si la lista está vacía o no es válida, insertamos los valores por defecto
  if (!Array.isArray(accounts) || accounts.length === 0) {
    accounts = [
      {
        name: safeBtoa("peluquera123"),
        email: safeBtoa("peluqueria123@gmail.com"),
        password: safeBtoa("peluquera123")
      },
      {
        name: safeBtoa("peluquera123"),
        email: safeBtoa("paratipeluqueria04@gmail.com"),
        password: safeBtoa("peluquera123")
      }
    ];
    saveAdminAccounts(accounts);
  }
  return accounts;
}

function saveAdminAccounts(accounts) {
  localStorage.setItem(LS_ACCOUNTS, JSON.stringify(accounts));
}

function registerOrUpdateAccount(name, email, password) {
  const accounts = getAdminAccounts();
  const existingIndex = accounts.findIndex(acc => acc.email === email);
  if (existingIndex !== -1) {
    accounts[existingIndex].name = name;
    accounts[existingIndex].password = password;
  } else {
    accounts.push({ name, email, password });
  }
  saveAdminAccounts(accounts);
}

document.addEventListener('DOMContentLoaded', () => {
  // --- Procesamiento de parámetros URL para compatibilidad file:// ---
  const urlParams = new URLSearchParams(window.location.search);
  let stateChanged = false;

  // 1. Registro exitoso recibido en login.html
  if (urlParams.has('reg') && urlParams.has('u') && urlParams.has('p') && urlParams.has('e')) {
    const u = urlParams.get('u');
    const p = urlParams.get('p');
    const e = urlParams.get('e');
    localStorage.setItem('adminName', u);
    localStorage.setItem('adminPassword', p);
    localStorage.setItem('adminEmail', e);
    sessionStorage.setItem('adminName', u);
    sessionStorage.setItem('adminPassword', p);
    sessionStorage.setItem('adminEmail', e);
    registerOrUpdateAccount(u, e, p);
    stateChanged = true;
    console.log('Parámetros de registro leídos e integrados en almacenamiento local.');
  }

  // 2. Cambio de contraseña recibido en login.html
  if (urlParams.has('passUpdate') && urlParams.has('p')) {
    const p = urlParams.get('p');
    const e = urlParams.get('e');
    localStorage.setItem('adminPassword', p);
    sessionStorage.setItem('adminPassword', p);
    const targetEmailEncoded = e || localStorage.getItem('verificationEmail') || sessionStorage.getItem('verificationEmail') || localStorage.getItem('lastResetEmail');
    if (targetEmailEncoded) {
      const accounts = getAdminAccounts();
      const accIndex = accounts.findIndex(acc => acc.email === targetEmailEncoded);
      if (accIndex !== -1) {
        accounts[accIndex].password = p;
        saveAdminAccounts(accounts);
      }
      localStorage.removeItem('lastResetEmail');
    }
    stateChanged = true;
    console.log('Cambio de contraseña leído e integrado en almacenamiento local.');
  }

  // 3. Recepción de código de verificación en verificacion.html
  if (urlParams.has('c') && urlParams.has('e')) {
    const c = urlParams.get('c');
    const e = urlParams.get('e');
    localStorage.setItem('verificationCode', c);
    localStorage.setItem('verificationEmail', e);
    localStorage.setItem('verificationTime', Date.now().toString());
    sessionStorage.setItem('verificationCode', c);
    sessionStorage.setItem('verificationEmail', e);
    sessionStorage.setItem('verificationTime', Date.now().toString());
    stateChanged = true;
    console.log('Código de verificación temporal leído e integrado.');
  }

  // 4. Recepción de autorización para registrarse o cambiar contraseña
  if (urlParams.has('codeVerified') && urlParams.get('codeVerified') === 'true') {
    sessionStorage.setItem('isAdminCodeVerified', 'true');
    stateChanged = true;
    console.log('Acceso de administrador autorizado por parámetro de URL.');
  }

  // Si leímos algún parámetro, limpiamos la barra de direcciones para mantener la estética y seguridad
  if (stateChanged) {
    try {
      window.history.replaceState({}, document.title, window.location.pathname);
    } catch (err) {
      console.warn('No se pudo limpiar la barra de direcciones:', err);
    }
  }
  // -------------------------------------------------------------

  const EMAILJS_AVAILABLE = typeof window.emailjs !== 'undefined' && typeof window.emailjs.send === 'function';

  function createCustomAlert() {
    if (document.getElementById('customAlertOverlay')) return;

    const overlay = document.createElement('div');
    overlay.id = 'customAlertOverlay';
    overlay.className = 'custom-alert-overlay hidden';
    overlay.innerHTML = `
      <div class="custom-alert-box">
        <h2 class="custom-alert-title" id="customAlertTitle"></h2>
        <div class="custom-alert-message" id="customAlertMessage"></div>
        <div class="custom-alert-actions">
          <button type="button" class="custom-alert-button" id="customAlertOk">Aceptar</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    overlay.querySelector('#customAlertOk').addEventListener('click', () => {
      overlay.classList.add('hidden');
      const callback = overlay.dataset.callback;
      if (callback === 'redirectLogin') {
        window.location.href = 'login.html';
      }
      if (callback === 'redirectLoginFromRegister') {
        const u = localStorage.getItem('adminName') || sessionStorage.getItem('adminName') || '';
        const p = localStorage.getItem('adminPassword') || sessionStorage.getItem('adminPassword') || '';
        const e = localStorage.getItem('adminEmail') || sessionStorage.getItem('adminEmail') || '';
        window.location.href = 'login.html?reg=1&u=' + encodeURIComponent(u) + '&p=' + encodeURIComponent(p) + '&e=' + encodeURIComponent(e);
      }
      if (callback === 'redirectLoginFromPasswordChange') {
        const p = localStorage.getItem('adminPassword') || sessionStorage.getItem('adminPassword') || '';
        const e = localStorage.getItem('lastResetEmail') || '';
        window.location.href = 'login.html?passUpdate=1&p=' + encodeURIComponent(p) + '&e=' + encodeURIComponent(e);
      }
      if (callback === 'redirectVerify') {
        const c = localStorage.getItem('verificationCode') || sessionStorage.getItem('verificationCode') || '';
        const e = localStorage.getItem('verificationEmail') || sessionStorage.getItem('verificationEmail') || '';
        window.location.href = 'verificacion.html?c=' + encodeURIComponent(c) + '&e=' + encodeURIComponent(e);
      }
      if (callback === 'redirectChangePassword') {
        window.location.href = 'cambiarcontrase\u00f1a.html?codeVerified=true';
      }
      overlay.dataset.callback = '';
    });
  }

  function showCustomAlert(title, message, action) {
    createCustomAlert();
    const overlay = document.getElementById('customAlertOverlay');
    document.getElementById('customAlertTitle').textContent = title;
    document.getElementById('customAlertMessage').innerHTML = message.replace(/\n/g, '<br>');
    overlay.classList.remove('hidden');
    overlay.dataset.callback = action || '';
  }

  function fallbackSendCode(email, verificationCode) {
    const encCode = safeBtoa(verificationCode);
    const encEmail = safeBtoa(email);
    const timeStr = Date.now().toString();
    localStorage.setItem('verificationCode', encCode);
    localStorage.setItem('verificationEmail', encEmail);
    localStorage.setItem('verificationTime', timeStr);
    sessionStorage.setItem('verificationCode', encCode);
    sessionStorage.setItem('verificationEmail', encEmail);
    sessionStorage.setItem('verificationTime', timeStr);
    showCustomAlert('Envío alternativo', 'No se pudo enviar el email automáticamente.\nCódigo de verificación: ' + verificationCode + '\nCorreo: ' + email, 'redirectVerify');
  }

  const verifyButton = document.getElementById('verifyAdminCodeButton');
  if (verifyButton) {
    verifyButton.addEventListener('click', () => {
      const code = document.getElementById('adminCodeInput').value.trim();
      const error = document.getElementById('adminCodeError');
      const modalEl = document.getElementById('adminCodeModal');
      const modal = bootstrap.Modal.getInstance(modalEl);
      const encodedAdminCode = 'UEVMVVFVRVJBMTIz';
      const adminCode = safeAtob(encodedAdminCode);

      if (code === adminCode) {
        error.classList.add('d-none');
        modal.hide();
        sessionStorage.setItem('isAdminCodeVerified', 'true');
        window.location.href = 'register.html?codeVerified=true';
      } else {
        error.classList.remove('d-none');
      }
    });
  }

  // Validación de email para restablecer contraseña
  const resetPasswordButton = document.getElementById('resetPasswordButton');
  if (resetPasswordButton) {
    resetPasswordButton.addEventListener('click', () => {
      const email = document.getElementById('resetEmailInput').value.trim();
      const error = document.getElementById('resetEmailError');
      
      const accounts = getAdminAccounts();
      const registeredEmails = accounts.map(acc => safeAtob(acc.email).toLowerCase());

      if (registeredEmails.includes(email.toLowerCase())) {
        error.classList.add('d-none');

        // Generar código aleatorio de 6 dígitos
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

        // Guardar en localStorage y sessionStorage de forma codificada
        const encCode = safeBtoa(verificationCode);
        const encEmail = safeBtoa(email);
        const timeStr = Date.now().toString();
        localStorage.setItem('verificationCode', encCode);
        localStorage.setItem('verificationEmail', encEmail);
        localStorage.setItem('verificationTime', timeStr);
        sessionStorage.setItem('verificationCode', encCode);
        sessionStorage.setItem('verificationEmail', encEmail);
        sessionStorage.setItem('verificationTime', timeStr);

        const templateParams = {
          email: email,
          to_email: email,
          from_email: 'paratipeluqueria04@gmail.com',
          verification_code: verificationCode,
          code: verificationCode
        };

        console.log('EmailJS enviar:', EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, templateParams);

        const sendCodePromise = EMAILJS_AVAILABLE
          ? emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, templateParams)
          : Promise.reject(new Error('EmailJS no disponible'));

        sendCodePromise.then(() => {
          showCustomAlert('Código enviado', 'Se envió el código a:\n' + email, 'redirectVerify');

          // Deshabilitar botón por 60 segundos
          resetPasswordButton.disabled = true;
          resetPasswordButton.classList.add('disabled');
          const cooldownTimer = document.getElementById('cooldownTimer');
          cooldownTimer.classList.remove('d-none');

          let remainingTime = 60;
          const countdownSpan = document.getElementById('countdown');
          const interval = setInterval(() => {
            remainingTime--;
            countdownSpan.textContent = remainingTime;

            if (remainingTime <= 0) {
              clearInterval(interval);
              resetPasswordButton.disabled = false;
              resetPasswordButton.classList.remove('disabled');
              cooldownTimer.classList.add('d-none');
            }
          }, 1000);
        }).catch(err => {
          console.error('Error enviando email:', err);
          fallbackSendCode(email, verificationCode);

          // Deshabilitar botón por 60 segundos incluso si el envío falla
          resetPasswordButton.disabled = true;
          resetPasswordButton.classList.add('disabled');
          const cooldownTimer = document.getElementById('cooldownTimer');
          cooldownTimer.classList.remove('d-none');

          let remainingTime = 60;
          const countdownSpan = document.getElementById('countdown');
          const interval = setInterval(() => {
            remainingTime--;
            countdownSpan.textContent = remainingTime;

            if (remainingTime <= 0) {
              clearInterval(interval);
              resetPasswordButton.disabled = false;
              resetPasswordButton.classList.remove('disabled');
              cooldownTimer.classList.add('d-none');
            }
          }, 1000);
        });
      } else {
        error.classList.remove('d-none');
        showCustomAlert('Email no válido', 'El email ingresado no está registrado.');
      }
    });
  }

  // Verificación de código
  const verifyCodeButton = document.getElementById('verifyCodeButton');
  if (verifyCodeButton) {
    verifyCodeButton.addEventListener('click', () => {
      const inputCode = document.getElementById('verificationCodeInput').value.trim();
      const error = document.getElementById('verificationError');
      const storedCodeEncoded = localStorage.getItem('verificationCode') || sessionStorage.getItem('verificationCode');
      const storedTime = localStorage.getItem('verificationTime') || sessionStorage.getItem('verificationTime');
      const storedCode = storedCodeEncoded ? safeAtob(storedCodeEncoded) : null;

      if (!storedCode) {
        showCustomAlert('Código no solicitado', 'No hay ningún código de verificación activo. Por favor solicita uno.');
        return;
      }

      // Validar duración de 10 minutos (10 * 60 * 1000 ms)
      const codeAgeMs = Date.now() - parseInt(storedTime || '0', 10);
      const tenMinutesMs = 10 * 60 * 1000;

      if (storedTime && codeAgeMs > tenMinutesMs) {
        showCustomAlert('Código expirado', 'El código de verificación ha expirado (duración máxima: 10 minutos). Por favor reenvía el código.');
        return;
      }

      if (inputCode === storedCode) {
        error.classList.add('d-none');
        localStorage.removeItem('verificationCode');
        localStorage.removeItem('verificationTime');
        sessionStorage.removeItem('verificationCode');
        sessionStorage.removeItem('verificationTime');
        showCustomAlert('Código verificado', 'El código es correcto.', 'redirectChangePassword');
      } else {
        showCustomAlert('Código incorrecto', 'El código que ingresaste no es válido. Por favor intenta de nuevo o reenvía el código.');
      }
    });
  }

  // Reenviar código
  const resendCodeButton = document.getElementById('resendCodeButton');
  if (resendCodeButton) {
    resendCodeButton.addEventListener('click', () => {
      const emailEncoded = localStorage.getItem('verificationEmail') || sessionStorage.getItem('verificationEmail');
      const email = emailEncoded ? safeAtob(emailEncoded) : null;

      if (email) {
        // Generar un código nuevo aleatorio de 6 dígitos para el reenvío
        const newCode = Math.floor(100000 + Math.random() * 900000).toString();
        const encCode = safeBtoa(newCode);
        const timeStr = Date.now().toString();

        // Guardar el nuevo código y marca de tiempo en localStorage y sessionStorage
        localStorage.setItem('verificationCode', encCode);
        localStorage.setItem('verificationTime', timeStr);
        sessionStorage.setItem('verificationCode', encCode);
        sessionStorage.setItem('verificationTime', timeStr);

        const templateParams = {
          email: email,
          to_email: email,
          from_email: 'paratipeluqueria04@gmail.com',
          verification_code: newCode,
          code: newCode
        };

        console.log('EmailJS reenviar nuevo código:', EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, templateParams);

        const sendCodePromise = EMAILJS_AVAILABLE
          ? emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, templateParams)
          : Promise.reject(new Error('EmailJS no disponible'));

        sendCodePromise.then(() => {
          showCustomAlert('Código reenviado', 'Se ha enviado un nuevo código a:\n' + email);

          // Deshabilitar botón por 60 segundos
          resendCodeButton.disabled = true;
          resendCodeButton.classList.add('disabled');
          const cooldown = document.getElementById('resendCooldown');
          cooldown.classList.remove('d-none');

          let remainingTime = 60;
          const countdownSpan = document.getElementById('resendCountdown');
          const interval = setInterval(() => {
            remainingTime--;
            countdownSpan.textContent = remainingTime;

            if (remainingTime <= 0) {
              clearInterval(interval);
              resendCodeButton.disabled = false;
              resendCodeButton.classList.remove('disabled');
              cooldown.classList.add('d-none');
            }
          }, 1000);
        }).catch(err => {
          console.error('Error reenviando código:', err);
          fallbackSendCode(email, newCode);

          resendCodeButton.disabled = true;
          resendCodeButton.classList.add('disabled');
          const cooldown = document.getElementById('resendCooldown');
          cooldown.classList.remove('d-none');

          let remainingTime = 60;
          const countdownSpan = document.getElementById('resendCountdown');
          const interval = setInterval(() => {
            remainingTime--;
            countdownSpan.textContent = remainingTime;

            if (remainingTime <= 0) {
              clearInterval(interval);
              resendCodeButton.disabled = false;
              resendCodeButton.classList.remove('disabled');
              cooldown.classList.add('d-none');
            }
          }, 1000);
        });
      }
    });
  }

  // Cambiar contrase\u00f1a
  const changePasswordForm = document.getElementById('changePasswordButton')?.closest('form');
  if (changePasswordForm) {
    changePasswordForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const newPassword = document.getElementById('newPasswordInput').value.trim();
      const confirmPassword = document.getElementById('confirmPasswordInput').value.trim();
      const error = document.getElementById('changePasswordError');

      if (!newPassword || !confirmPassword) {
        showCustomAlert('Campos incompletos', 'Por favor, completa ambos campos.');
        return;
      }

      if (newPassword === confirmPassword) {
        error.classList.add('d-none');
        
        const encPass = safeBtoa(newPassword);

        // Buscamos cuál fue el email verificado para actualizar su contraseña en el array
        const verifiedEmailEncoded = localStorage.getItem('verificationEmail') || sessionStorage.getItem('verificationEmail');
        if (verifiedEmailEncoded) {
          const accounts = getAdminAccounts();
          const accIndex = accounts.findIndex(acc => acc.email === verifiedEmailEncoded);
          if (accIndex !== -1) {
            accounts[accIndex].password = encPass;
            saveAdminAccounts(accounts);
          }
        }

        // Limpiamos los datos de verificación ya que completó el proceso
        localStorage.removeItem('verificationCode');
        localStorage.removeItem('verificationEmail');
        localStorage.removeItem('verificationTime');
        sessionStorage.removeItem('verificationCode');
        sessionStorage.removeItem('verificationEmail');
        sessionStorage.removeItem('verificationTime');

        // Actualizamos la contraseña de administrador registrada (codificada)
        localStorage.setItem('adminPassword', encPass);
        sessionStorage.setItem('adminPassword', encPass);

        showCustomAlert('Contraseña cambiada', 'Tu contraseña ha sido restablecida con éxito.', 'redirectLoginFromPasswordChange');
      } else {
        error.classList.remove('d-none');
        showCustomAlert('Las contrase\u00f1as no coinciden', 'Las contrase\u00f1as que ingresaste no son iguales. Por favor intenta de nuevo.');
      }
    });
  }

  // Registro de administrador
  const registerForm = document.getElementById('registerButton')?.closest('form');
  if (registerForm) {
    registerForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('registerNameInput').value.trim();
      const email = document.getElementById('registerEmailInput').value.trim();
      const password = document.getElementById('registerPasswordInput').value.trim();
      const confirmPassword = document.getElementById('registerConfirmPasswordInput').value.trim();
      const error = document.getElementById('registerError');

      if (!name || !email || !password || !confirmPassword) {
        showCustomAlert('Campos incompletos', 'Por favor, completa todos los campos.');
        return;
      }

      if (password !== confirmPassword) {
        error.classList.remove('d-none');
        showCustomAlert('Las contrase\u00f1as no coinciden', 'Por favor, aseg\u00farate de que ambas contrase\u00f1as sean iguales.');
        return;
      }

      error.classList.add('d-none');
      const encEmail = safeBtoa(email);
      const encPassword = safeBtoa(password);
      const encName = safeBtoa(name);
      localStorage.setItem('adminEmail', encEmail);
      localStorage.setItem('adminPassword', encPassword);
      localStorage.setItem('adminName', encName);
      sessionStorage.setItem('adminEmail', encEmail);
      sessionStorage.setItem('adminPassword', encPassword);
      sessionStorage.setItem('adminName', encName);
      registerOrUpdateAccount(encName, encEmail, encPassword);
      sessionStorage.removeItem('isAdminCodeVerified');

      console.log('Registro exitoso. Guardado en localStorage. adminName:', name);

      showCustomAlert('Cuenta creada', 'La cuenta de administradora ha sido creada con \u00e9xito.', 'redirectLoginFromRegister');
    });
  }

  // Inicio de sesión de administrador
  const loginForm = document.getElementById('loginButton')?.closest('form');
  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const username = document.getElementById('loginUserInput').value.trim();
      const password = document.getElementById('loginPasswordInput').value.trim();
      const error = document.getElementById('loginError');

      if (!username || !password) {
        showCustomAlert('Campos incompletos', 'Por favor, introduce tu usuario y contrase\u00f1a.');
        return;
      }

      // Validar contra la lista de cuentas
      const accounts = getAdminAccounts();
      const matchingAccount = accounts.find(acc => {
        const accName = safeAtob(acc.name);
        const accEmail = safeAtob(acc.email);
        const accPass = safeAtob(acc.password);
        return (username === accName || username === accEmail) && password === accPass;
      });

      if (matchingAccount) {
        error.classList.add('d-none');
        sessionStorage.setItem('paraTi_adminAuth', '1');
        
        // Guardamos los datos de la cuenta logueada en la sesión actual
        localStorage.setItem('adminName', matchingAccount.name);
        localStorage.setItem('adminEmail', matchingAccount.email);
        localStorage.setItem('adminPassword', matchingAccount.password);
        sessionStorage.setItem('adminName', matchingAccount.name);
        sessionStorage.setItem('adminEmail', matchingAccount.email);
        sessionStorage.setItem('adminPassword', matchingAccount.password);

        window.location.href = 'admin.html';
      } else {
        error.classList.remove('d-none');
        showCustomAlert('Error de acceso', 'Usuario o contrase\u00f1a incorrectos. Por favor intenta de nuevo.');
      }
    });
  }
});


