/* ============================================================
   PIONEROS AUTOMOTRIZ — Booking System
   booking.js
   ============================================================
   SETUP REQUIRED:
   1. Create a free Supabase project → https://supabase.com
      a. Create table "bookings" (see README or admin SQL below)
      b. Create table "blocked_slots" (see README or admin SQL below)
      c. Enable RLS and add policies (see below)
      d. Copy your Project URL + anon key into SUPABASE_URL / SUPABASE_ANON_KEY

   2. Create a free EmailJS account → https://www.emailjs.com
      a. Add your email service (Gmail, Outlook, etc.)
      b. Create template "template_owner_notify" (variables: client_name, client_email,
         client_phone, license_plate, vehicle, service, booking_date, time_slot, notes)
      c. Create template "template_cust_confirm" (variables: to_name, to_email,
         service, booking_date, time_slot, workshop_name, workshop_address, workshop_phone)
      d. Copy your Public Key, Service ID, and template IDs below.

   SUPABASE SQL (run once in SQL Editor):
   ──────────────────────────────────────
   create table bookings (
     id uuid primary key default gen_random_uuid(),
     created_at timestamptz default now(),
     name text not null,
     email text not null,
     phone text not null,
     license_plate text not null,
     vehicle text not null,
     service text not null,
     booking_date date not null,
     time_slot text not null,
     status text not null default 'pending',
     notes text
   );

   create table blocked_slots (
     id uuid primary key default gen_random_uuid(),
     blocked_date date not null,
     time_slot text not null,
     reason text
   );

   -- RLS: allow public inserts on bookings
   alter table bookings enable row level security;
   create policy "public can insert bookings"
     on bookings for insert to anon with check (true);

   -- RLS: allow public to read blocked_slots
   alter table blocked_slots enable row level security;
   create policy "public can read blocked slots"
     on blocked_slots for select to anon using (true);

   -- RLS: allow public to read bookings (for slot count query)
   create policy "public can read bookings"
     on bookings for select to anon using (true);
   ============================================================ */

// ============================================================
// CONFIGURATION — Replace placeholder values with your own
// ============================================================
const SUPABASE_URL = "https://YOUR_PROJECT_ID.supabase.co"; // ← replace
const SUPABASE_ANON_KEY = "YOUR_ANON_PUBLIC_KEY"; // ← replace
const EMAILJS_PUBLIC_KEY = "YOUR_EMAILJS_PUBLIC_KEY"; // ← replace
const EMAILJS_SERVICE_ID = "YOUR_SERVICE_ID"; // ← replace
const OWNER_TEMPLATE_ID = "template_owner_notify"; // ← replace if different
const CUSTOMER_TEMPLATE_ID = "template_cust_confirm"; // ← replace if different

const WORKSHOP_WHATSAPP = "56965430123";
const WORKSHOP_NAME = "Pioneros Automotriz";
const WORKSHOP_ADDRESS = "Av. Automotriz 123, Colina - Santiago";
const WORKSHOP_PHONE = "+56 9 6543 0123";

// ============================================================
// BOOKING CONFIG
// ============================================================
const SLOT_HOURS = ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00"];
const MAX_PER_SLOT = 2; // max concurrent bookings per time slot

// ============================================================
// INIT
// ============================================================
const {createClient} = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

emailjs.init(EMAILJS_PUBLIC_KEY);

// Booking state (single source of truth)
const bookingState = {
    step: 1,
    service: "",
    date: "",
    timeSlot: "",
    name: "",
    email: "",
    phone: "",
    patente: "",
    vehicle: "",
    notes: "",
};

// ============================================================
// MODAL OPEN / CLOSE
// ============================================================
function openBookingModal(service) {
    resetBooking();
    document.getElementById("booking-modal").classList.remove("hidden");
    document.body.style.overflow = "hidden";
    setMinDate();
    if (service) {
        document.getElementById("bk-service").value = service;
    }
}

function closeBookingModal() {
    document.getElementById("booking-modal").classList.add("hidden");
    document.body.style.overflow = "";
}

function resetBooking() {
    Object.assign(bookingState, {
        step: 1,
        service: "",
        date: "",
        timeSlot: "",
        name: "",
        email: "",
        phone: "",
        patente: "",
        vehicle: "",
        notes: "",
    });
    const svc = document.getElementById("bk-service");
    const dt = document.getElementById("bk-date");
    if (svc) svc.selectedIndex = 0;
    if (dt) dt.value = "";
    ["bk-name", "bk-email", "bk-phone", "bk-patente", "bk-vehicle", "bk-notes"].forEach((id) => {
        const el = document.getElementById(id);
        if (el) el.value = "";
    });
    showStep(1);
}

// ============================================================
// STEP MANAGEMENT
// ============================================================
function showStep(n) {
    bookingState.step = n;

    [1, 2, 3, 4].forEach((i) => {
        const stepEl = document.getElementById(`bk-step-${i}`);
        if (stepEl) stepEl.classList.toggle("hidden", i !== n);

        const dot = document.getElementById(`progress-dot-${i}`);
        if (!dot) return;
        dot.classList.remove("bk-progress-active", "bk-progress-done", "bk-progress-idle");
        if (i < n) dot.classList.add("bk-progress-done");
        else if (i === n) dot.classList.add("bk-progress-active");
        else dot.classList.add("bk-progress-idle");
    });
}

function setMinDate() {
    const input = document.getElementById("bk-date");
    if (!input) return;
    const today = new Date();
    input.min = today.toISOString().split("T")[0];
}

// ============================================================
// STEP 1 → STEP 2: Validate then load slots
// ============================================================
async function goToStep2() {
    const service = document.getElementById("bk-service").value;
    const date = document.getElementById("bk-date").value;

    if (!service) {
        showError("bk-error-1", "Por favor selecciona un servicio.");
        return;
    }
    if (!date) {
        showError("bk-error-1", "Por favor selecciona una fecha.");
        return;
    }
    // noon to avoid DST edge-cases
    const dayOfWeek = new Date(`${date}T12:00:00`).getDay();
    if (dayOfWeek === 0) {
        showError("bk-error-1", "Lo sentimos, no atendemos los domingos. Selecciona otro día.");
        return;
    }

    clearError("bk-error-1");
    bookingState.service = service;
    bookingState.date = date;
    bookingState.timeSlot = "";

    // Show human-readable date in step 2 header
    const [y, m, d] = date.split("-");
    const display = document.getElementById("bk-date-display");
    if (display) {
        const names = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
        const dayName = names[dayOfWeek];
        display.textContent = `${dayName} ${d}/${m}/${y} — ${service}`;
    }

    showStep(2);
    await loadAvailableSlots(date);
}

// ============================================================
// LOAD AVAILABLE SLOTS FROM SUPABASE
// ============================================================
async function loadAvailableSlots(date) {
    const container = document.getElementById("bk-slots-container");
    container.innerHTML =
        '<p class="text-gray-400 col-span-full text-center py-6">Cargando horarios disponibles...</p>';

    // Detect if Supabase credentials are still placeholders
    if (SUPABASE_URL.includes("YOUR_PROJECT_ID")) {
        renderDemoSlots(container);
        return;
    }

    try {
        const [{data: existingBookings, error: bErr}, {data: blockedSlots, error: blErr}] = await Promise.all([
            db.from("bookings").select("time_slot").eq("booking_date", date).neq("status", "cancelled"),
            db.from("blocked_slots").select("time_slot").eq("blocked_date", date),
        ]);

        if (bErr) throw bErr;
        if (blErr) throw blErr;

        const counts = {};
        existingBookings.forEach((b) => {
            counts[b.time_slot] = (counts[b.time_slot] || 0) + 1;
        });
        const blockedSet = new Set(blockedSlots.map((b) => b.time_slot));

        renderSlots(container, counts, blockedSet);
    } catch (err) {
        console.error("Error loading slots:", err);
        container.innerHTML =
            '<p class="text-red-600 col-span-full text-center py-4 text-sm font-medium">Error al cargar horarios. Intenta de nuevo o contáctanos por WhatsApp.</p>';
    }
}

function renderSlots(container, counts, blockedSet) {
    container.innerHTML = "";
    SLOT_HOURS.forEach((slot) => {
        const count = counts[slot] || 0;
        const isBlocked = blockedSet.has(slot);
        const isFull = count >= MAX_PER_SLOT;
        const available = !isBlocked && !isFull;

        const btn = document.createElement("button");
        btn.type = "button";
        btn.textContent = slot;
        btn.dataset.slot = slot;

        if (available) {
            btn.className = "bk-slot-btn";
            btn.addEventListener("click", () => selectSlot(slot, btn));
        } else {
            btn.className = "bk-slot-btn bk-slot-disabled";
            btn.disabled = true;
            btn.title = isBlocked ? "Horario bloqueado" : "Horario completo";
        }
        container.appendChild(btn);
    });
}

// Fallback when credentials are still placeholders (demo mode)
function renderDemoSlots(container) {
    const fakeFull = new Set(["09:00", "14:00"]);
    renderSlots(container, Object.fromEntries([...fakeFull].map((s) => [s, MAX_PER_SLOT])), new Set(["12:00"]));
    const notice = document.createElement("p");
    notice.className = "col-span-full text-center text-xs text-gray-400 mt-2";
    notice.textContent = "⚠ Modo demo – conecta Supabase para disponibilidad real.";
    container.appendChild(notice);
}

function selectSlot(slot, btn) {
    document.querySelectorAll(".bk-slot-btn").forEach((b) => b.classList.remove("bk-slot-selected"));
    btn.classList.add("bk-slot-selected");
    bookingState.timeSlot = slot;
    clearError("bk-error-2");
}

// ============================================================
// STEP 2 → STEP 3
// ============================================================
function goToStep3() {
    if (!bookingState.timeSlot) {
        showError("bk-error-2", "Por favor selecciona un horario.");
        return;
    }
    clearError("bk-error-2");
    showStep(3);
}

// ============================================================
// SUBMIT BOOKING
// ============================================================
const CHILE_PATENTE = /^[A-Z]{4}[0-9]{2}$|^[A-Z]{2}[0-9]{4}$/i;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function submitBooking() {
    const name = document.getElementById("bk-name").value.trim();
    const email = document.getElementById("bk-email").value.trim();
    const phone = document.getElementById("bk-phone").value.trim();
    const patente = document.getElementById("bk-patente").value.trim().toUpperCase();
    const vehicle = document.getElementById("bk-vehicle").value.trim();
    const notes = document.getElementById("bk-notes").value.trim();

    if (!name) {
        showError("bk-error-3", "Ingresa tu nombre completo.");
        return;
    }
    if (!EMAIL_RE.test(email)) {
        showError("bk-error-3", "Ingresa un email válido.");
        return;
    }
    if (!phone || phone.length < 8) {
        showError("bk-error-3", "Ingresa un teléfono válido (mínimo 8 dígitos).");
        return;
    }
    if (!CHILE_PATENTE.test(patente)) {
        showError("bk-error-3", "Patente inválida. Formatos: ABCD12 (nueva) o AB1234 (antigua).");
        return;
    }
    if (!vehicle) {
        showError("bk-error-3", "Ingresa la marca y modelo del vehículo.");
        return;
    }

    clearError("bk-error-3");
    Object.assign(bookingState, {name, email, phone, patente, vehicle, notes});

    const btn = document.getElementById("bk-submit-btn");
    btn.disabled = true;
    btn.textContent = "Enviando...";

    try {
        if (!SUPABASE_URL.includes("YOUR_PROJECT_ID")) {
            const {error} = await db.from("bookings").insert([
                {
                    name,
                    email,
                    phone,
                    license_plate: patente,
                    vehicle,
                    service: bookingState.service,
                    booking_date: bookingState.date,
                    time_slot: bookingState.timeSlot,
                    status: "pending",
                    notes,
                },
            ]);
            if (error) throw error;
        }

        // Send emails — failures are non-blocking
        if (!EMAILJS_PUBLIC_KEY.includes("YOUR_")) {
            Promise.allSettled([sendOwnerEmail(), sendCustomerEmail()]);
        }

        buildConfirmationStep();
        showStep(4);
    } catch (err) {
        console.error("Booking submit error:", err);
        showError(
            "bk-error-3",
            "Error al registrar la reserva. Por favor intenta de nuevo o contáctanos por WhatsApp."
        );
        btn.disabled = false;
        btn.textContent = "Confirmar Reserva";
    }
}

// ============================================================
// EMAIL HELPERS
// ============================================================
function formatDate(dateStr) {
    const [y, m, d] = dateStr.split("-");
    return `${d}/${m}/${y}`;
}

function sendOwnerEmail() {
    return emailjs.send(EMAILJS_SERVICE_ID, OWNER_TEMPLATE_ID, {
        client_name: bookingState.name,
        client_email: bookingState.email,
        client_phone: bookingState.phone,
        license_plate: bookingState.patente,
        vehicle: bookingState.vehicle,
        service: bookingState.service,
        booking_date: formatDate(bookingState.date),
        time_slot: bookingState.timeSlot,
        notes: bookingState.notes || "Sin observaciones",
        workshop_name: WORKSHOP_NAME,
    });
}

function sendCustomerEmail() {
    return emailjs.send(EMAILJS_SERVICE_ID, CUSTOMER_TEMPLATE_ID, {
        to_name: bookingState.name,
        to_email: bookingState.email,
        service: bookingState.service,
        booking_date: formatDate(bookingState.date),
        time_slot: bookingState.timeSlot,
        workshop_name: WORKSHOP_NAME,
        workshop_address: WORKSHOP_ADDRESS,
        workshop_phone: WORKSHOP_PHONE,
    });
}

// ============================================================
// CONFIRMATION STEP (Step 4)
// ============================================================
function buildConfirmationStep() {
    setText("bk-confirm-service", bookingState.service);
    setText("bk-confirm-date", formatDate(bookingState.date));
    setText("bk-confirm-time", bookingState.timeSlot);
    setText("bk-confirm-name", bookingState.name);
    setText("bk-confirm-vehicle", `${bookingState.patente} — ${bookingState.vehicle}`);

    const msg = encodeURIComponent(
        `¡Hola Pioneros! Acabo de hacer una reserva:\n` +
            `• Servicio: ${bookingState.service}\n` +
            `• Fecha: ${formatDate(bookingState.date)} a las ${bookingState.timeSlot} hrs\n` +
            `• Vehículo: ${bookingState.patente} — ${bookingState.vehicle}\n` +
            `• Nombre: ${bookingState.name}`
    );
    const waBtn = document.getElementById("bk-whatsapp-btn");
    if (waBtn) waBtn.href = `https://wa.me/${WORKSHOP_WHATSAPP}?text=${msg}`;
}

// ============================================================
// UTILITY HELPERS
// ============================================================
function showError(elId, msg) {
    const el = document.getElementById(elId);
    if (el) {
        el.textContent = msg;
        el.classList.remove("hidden");
    }
}

function clearError(elId) {
    const el = document.getElementById(elId);
    if (el) {
        el.textContent = "";
        el.classList.add("hidden");
    }
}

function setText(elId, value) {
    const el = document.getElementById(elId);
    if (el) el.textContent = value;
}

// ============================================================
// DOM READY LISTENERS
// ============================================================
document.addEventListener("DOMContentLoaded", () => {
    // Date input: reject Sundays inline
    const dateInput = document.getElementById("bk-date");
    if (dateInput) {
        dateInput.addEventListener("change", () => {
            if (!dateInput.value) return;
            const day = new Date(`${dateInput.value}T12:00:00`).getDay();
            if (day === 0) {
                dateInput.value = "";
                showError("bk-error-1", "No atendemos domingos. Por favor selecciona otro día.");
            } else {
                clearError("bk-error-1");
            }
        });
    }
});
