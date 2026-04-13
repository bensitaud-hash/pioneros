/* ============================================================
   PIONEROS AUTOMOTRIZ — Admin Panel
   admin.js
   ============================================================
   Requires: Supabase JS v2 (loaded via CDN in admin.html)
   Update SUPABASE_URL and SUPABASE_ANON_KEY to match booking.js.
   The admin login uses a native Supabase Auth user — create one
   in your Supabase project under Authentication → Users.
   ============================================================ */

// ── Configuration ────────────────────────────────────────────
const SUPABASE_URL = "https://YOUR_PROJECT_ID.supabase.co"; // ← replace
const SUPABASE_ANON_KEY = "YOUR_ANON_PUBLIC_KEY"; // ← replace

const SLOT_HOURS = ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00"];

// ── Supabase Init ─────────────────────────────────────────────
const {createClient} = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Active row for detail modal
let activeBookingId = null;

// ── Boot: check auth state ────────────────────────────────────
(async () => {
    const {
        data: {session},
    } = await db.auth.getSession();
    if (session) {
        showPanel(session.user.email);
    }
})();

// Keep listening for auth changes (e.g. session expiry)
db.auth.onAuthStateChange((_event, session) => {
    if (!session) {
        document.getElementById("admin-panel").classList.add("hidden");
        document.getElementById("login-screen").classList.remove("hidden");
    }
});

// ── Login ─────────────────────────────────────────────────────
async function handleLogin() {
    const email = document.getElementById("login-email").value.trim();
    const password = document.getElementById("login-password").value;
    const btn = document.getElementById("login-btn");
    const errEl = document.getElementById("login-error");

    if (!email || !password) {
        showLoginError("Completa email y contraseña.");
        return;
    }

    btn.disabled = true;
    btn.textContent = "Ingresando...";
    errEl.classList.add("hidden");

    const {data, error} = await db.auth.signInWithPassword({email, password});

    if (error) {
        showLoginError("Credenciales incorrectas. Verifica e intenta de nuevo.");
        btn.disabled = false;
        btn.textContent = "Iniciar sesión";
        return;
    }

    showPanel(data.user.email);
}

function showLoginError(msg) {
    const el = document.getElementById("login-error");
    el.textContent = msg;
    el.classList.remove("hidden");
}

function showPanel(email) {
    document.getElementById("login-screen").classList.add("hidden");
    document.getElementById("admin-panel").classList.remove("hidden");
    const badge = document.getElementById("admin-email-badge");
    if (badge) badge.textContent = email;

    // Populate block-slot dropdown
    const slotSel = document.getElementById("block-slot");
    SLOT_HOURS.forEach((h) => {
        const opt = document.createElement("option");
        opt.value = h;
        opt.textContent = h;
        slotSel.appendChild(opt);
    });

    loadBookings();
    subscribeToRealtime();
}

// ── Logout ────────────────────────────────────────────────────
async function handleLogout() {
    await db.auth.signOut();
    document.getElementById("admin-panel").classList.add("hidden");
    document.getElementById("login-screen").classList.remove("hidden");
}

// ── Load / Render Bookings ────────────────────────────────────
async function loadBookings() {
    const tbody = document.getElementById("bookings-tbody");
    const filterDate = document.getElementById("filter-date").value;
    const filterStatus = document.getElementById("filter-status").value;

    tbody.innerHTML = `<tr><td colspan="7" class="text-center py-10 text-gray-400">Cargando...</td></tr>`;

    if (SUPABASE_URL.includes("YOUR_PROJECT_ID")) {
        renderDemoBookings(tbody);
        return;
    }

    let query = db
    .from("bookings")
    .select("*")
    .order("booking_date", {ascending: true})
    .order("time_slot", {ascending: true});
    if (filterDate) query = query.eq("booking_date", filterDate);
    if (filterStatus) query = query.eq("status", filterStatus);

    const {data, error} = await query;

    if (error) {
        tbody.innerHTML = `<tr><td colspan="7" class="text-center py-10 text-red-600 font-medium">Error al cargar datos.</td></tr>`;
        return;
    }

    updateStats(data);
    renderBookings(tbody, data);
}

function updateStats(rows) {
    const counts = {pending: 0, confirmed: 0, cancelled: 0};
    rows.forEach((r) => {
        if (counts[r.status] !== undefined) counts[r.status]++;
    });
    setText("stat-total", rows.length);
    setText("stat-pending", counts.pending);
    setText("stat-confirmed", counts.confirmed);
    setText("stat-cancelled", counts.cancelled);
}

function renderBookings(tbody, rows) {
    const noResults = document.getElementById("no-results");

    if (!rows.length) {
        tbody.innerHTML = "";
        noResults.classList.remove("hidden");
        return;
    }

    noResults.classList.add("hidden");
    tbody.innerHTML = "";

    rows.forEach((b) => {
        const [y, m, d] = b.booking_date.split("-");
        const dateStr = `${d}/${m}/${y}`;
        const statusClass = `status-${b.status}`;
        const statusLabel =
            {pending: "Pendiente", confirmed: "Confirmada", cancelled: "Cancelada"}[b.status] || b.status;

        const tr = document.createElement("tr");
        tr.className = "tbl-row border-b border-deep cursor-pointer";
        tr.innerHTML = `
      <td class="px-4 py-3 text-dark font-medium">${dateStr}</td>
      <td class="px-4 py-3 text-dark">${b.time_slot}</td>
      <td class="px-4 py-3">
        <div class="font-medium text-dark">${escHtml(b.name)}</div>
        <div class="text-gray-400">${escHtml(b.phone)}</div>
      </td>
      <td class="px-4 py-3 text-dark hidden sm:table-cell">
        <div class="font-medium">${escHtml(b.license_plate)}</div>
        <div class="text-gray-400 text-xs">${escHtml(b.vehicle)}</div>
      </td>
      <td class="px-4 py-3 text-dark hidden md:table-cell">${escHtml(b.service)}</td>
      <td class="px-4 py-3">
        <span class="inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${statusClass}">${statusLabel}</span>
      </td>
      <td class="px-4 py-3">
        <div class="flex gap-2">
          ${
              b.status !== "confirmed"
                  ? `<button onclick="quickAction(event,'${b.id}','confirmed')" title="Confirmar" class="text-emerald-700 hover:text-emerald-900 transition-colors"><svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg></button>`
                  : ""
          }
          ${
              b.status !== "cancelled"
                  ? `<button onclick="quickAction(event,'${b.id}','cancelled')" title="Cancelar" class="text-red-500 hover:text-red-700 transition-colors"><svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>`
                  : ""
          }
          <button onclick="openDetailModal(event,'${
              b.id
          }')" title="Ver detalle" class="text-gray-400 hover:text-dark transition-colors"><svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg></button>
        </div>
      </td>
    `;
        tbody.appendChild(tr);
    });

    // Store rows for detail lookup
    window._adminRows = rows;
}

// Demo mode (no Supabase)
function renderDemoBookings(tbody) {
    const demo = [
        {
            id: "demo-1",
            name: "Juan Pérez",
            phone: "+56 9 1234 5678",
            license_plate: "ABCD12",
            vehicle: "Toyota Hilux",
            service: "Cambio de Aceite",
            booking_date: "2026-04-14",
            time_slot: "09:00",
            status: "pending",
            notes: "",
        },
        {
            id: "demo-2",
            name: "María González",
            phone: "+56 9 8765 4321",
            license_plate: "AB1234",
            vehicle: "Subaru Outback",
            service: "Mantención Premium",
            booking_date: "2026-04-14",
            time_slot: "11:00",
            status: "confirmed",
            notes: "Revisión completa",
        },
        {
            id: "demo-3",
            name: "Carlos Ruiz",
            phone: "+56 9 5555 0000",
            license_plate: "XY9876",
            vehicle: "Ford F-150",
            service: "Servicio de Frenos",
            booking_date: "2026-04-15",
            time_slot: "10:00",
            status: "cancelled",
            notes: "",
        },
    ];
    updateStats(demo);
    renderBookings(tbody, demo);
    showToast("⚠ Modo demo — conecta Supabase para datos reales.");
}

// ── Quick action (confirm/cancel) from table ──────────────────
async function quickAction(event, bookingId, newStatus) {
    event.stopPropagation();
    if (SUPABASE_URL.includes("YOUR_PROJECT_ID")) {
        showToast("Conecta Supabase para usar esta función.");
        return;
    }
    await updateBookingStatus(bookingId, newStatus);
}

// ── Detail modal ──────────────────────────────────────────────
function openDetailModal(event, bookingId) {
    event.stopPropagation();
    const rows = window._adminRows || [];
    const b = rows.find((r) => r.id === bookingId);
    if (!b) return;

    activeBookingId = bookingId;
    const [y, m, d] = b.booking_date.split("-");
    const statusLabel = {pending: "Pendiente", confirmed: "Confirmada", cancelled: "Cancelada"}[b.status] || b.status;

    const pairs = [
        ["Fecha", `${d}/${m}/${y}`],
        ["Horario", b.time_slot],
        ["Servicio", b.service],
        ["Cliente", b.name],
        ["Email", b.email],
        ["Teléfono", b.phone],
        ["Vehículo", `${b.license_plate} — ${b.vehicle}`],
        ["Estado", statusLabel],
        ["Observaciones", b.notes || "Sin observaciones"],
    ];

    const body = document.getElementById("detail-body");
    body.innerHTML = pairs
    .map(
        ([label, val]) =>
            `<div class="flex justify-between gap-4"><span class="text-gray-400 flex-shrink-0">${label}</span><span class="font-medium text-dark text-right">${escHtml(
                val
            )}</span></div>`
    )
    .join("");

    document.getElementById("detail-confirm-btn").classList.toggle("hidden", b.status === "confirmed");
    document.getElementById("detail-cancel-btn").classList.toggle("hidden", b.status === "cancelled");
    document.getElementById("detail-modal").classList.remove("hidden");
}

function closeDetailModal() {
    document.getElementById("detail-modal").classList.add("hidden");
    activeBookingId = null;
}

async function detailAction(newStatus) {
    if (!activeBookingId) return;
    if (SUPABASE_URL.includes("YOUR_PROJECT_ID")) {
        showToast("Conecta Supabase para usar esta función.");
        return;
    }
    await updateBookingStatus(activeBookingId, newStatus);
    closeDetailModal();
}

// ── Update booking status ─────────────────────────────────────
async function updateBookingStatus(bookingId, newStatus) {
    const {error} = await db.from("bookings").update({status: newStatus}).eq("id", bookingId);
    if (error) {
        showToast("Error al actualizar estado.");
        console.error(error);
        return;
    }
    const labels = {confirmed: "Confirmada", cancelled: "Cancelada", pending: "Pendiente"};
    showToast(`Reserva ${labels[newStatus] || newStatus} ✓`);
    loadBookings();
}

// ── Block slot modal ──────────────────────────────────────────
function openBlockModal() {
    document.getElementById("block-modal").classList.remove("hidden");
    document.getElementById("block-error").classList.add("hidden");
}
function closeBlockModal() {
    document.getElementById("block-modal").classList.add("hidden");
    ["block-date", "block-reason"].forEach((id) => {
        document.getElementById(id).value = "";
    });
    document.getElementById("block-slot").selectedIndex = 0;
}

async function handleBlockSlot() {
    const date = document.getElementById("block-date").value;
    const slot = document.getElementById("block-slot").value;
    const reason = document.getElementById("block-reason").value.trim();
    const errEl = document.getElementById("block-error");

    if (!date || !slot) {
        errEl.textContent = "Selecciona fecha y horario.";
        errEl.classList.remove("hidden");
        return;
    }
    errEl.classList.add("hidden");

    if (SUPABASE_URL.includes("YOUR_PROJECT_ID")) {
        showToast("Conecta Supabase para usar esta función.");
        closeBlockModal();
        return;
    }

    const {error} = await db.from("blocked_slots").insert([{blocked_date: date, time_slot: slot, reason}]);
    if (error) {
        errEl.textContent = "Error al bloquear horario. Intenta de nuevo.";
        errEl.classList.remove("hidden");
        console.error(error);
        return;
    }

    showToast("Horario bloqueado ✓");
    closeBlockModal();
    loadBookings();
}

// ── Realtime subscription ─────────────────────────────────────
function subscribeToRealtime() {
    if (SUPABASE_URL.includes("YOUR_PROJECT_ID")) return;

    db.channel("admin-bookings")
    .on("postgres_changes", {event: "*", schema: "public", table: "bookings"}, () => {
        loadBookings();
    })
    .subscribe();
}

// ── Utility helpers ───────────────────────────────────────────
function setText(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
}

function escHtml(str) {
    if (!str) return "";
    return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

let toastTimer;
function showToast(msg) {
    const t = document.getElementById("toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("show"), 3000);
}
