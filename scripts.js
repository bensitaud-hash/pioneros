// Hero background uses CSS Ken Burns animation — no JS required

// Initialize AOS animations when the library is available
if (typeof AOS !== "undefined") {
    AOS.init({
        duration: 800,
        easing: "ease-in-out",
        once: true,
    });
} else {
    console.warn("AOS library not loaded before scripts.js. Ensure scripts.js is deferred after AOS.");
}

// Initialize Feather Icons, ONLY on elements with the 'data-feather' attribute
if (typeof feather !== "undefined") {
    feather.replace({
        targetAttr: "data-feather",
    });
} else {
    console.warn("Feather Icons library not loaded before scripts.js.");
}

// Mobile menu toggle
const mobileMenuButton = document.getElementById("mobile-menu-button");
const mobileMenu = document.getElementById("mobile-menu");
const mobileMenuIcon = document.getElementById("mobile-menu-icon");

mobileMenuButton.addEventListener("click", () => {
    const isHidden = mobileMenu.classList.toggle("hidden");
    mobileMenu.setAttribute("aria-hidden", String(isHidden));
    mobileMenuButton.setAttribute("aria-expanded", String(!isHidden));

    const iconElement = document.getElementById("mobile-menu-icon");
    if (isHidden) {
        iconElement.setAttribute("data-feather", "menu");
    } else {
        iconElement.setAttribute("data-feather", "x");
    }

    feather.replace({
        target: iconElement,
        targetAttr: "data-feather",
    });
});

// Sticky Navigation Bar on Scroll
const mainNav = document.getElementById("main-nav");
const navSpacer = document.getElementById("nav-spacer");
let initialNavTop = mainNav.offsetTop;

// Parallax for about section hero image
const aboutParallaxImg = document.querySelector(".about-image-bg");
const aboutPanel = document.querySelector(".about-image-panel");

function updateAboutParallax() {
    if (!aboutParallaxImg || !aboutPanel) return;
    const rect = aboutPanel.getBoundingClientRect();
    if (rect.bottom < -200 || rect.top > window.innerHeight + 200) return;
    // progress: 0 when panel top hits bottom of viewport, 1 when panel bottom hits top
    const totalTravel = window.innerHeight + rect.height;
    const scrolled = window.innerHeight - rect.top;
    const progress = scrolled / totalTravel; // 0 → 1 as section scrolls through
    const shift = (progress - 0.5) * 280; // ±140px at extremes
    aboutParallaxImg.style.transform = `translateY(${shift}px) scale(1.10)`;
}

window.addEventListener("scroll", () => {
    updateAboutParallax();
    // Re-read nav position while not sticky so closing the promo bar doesn't stale the threshold
    if (!mainNav.classList.contains("sticky-nav")) {
        initialNavTop = mainNav.offsetTop;
    }
    if (window.scrollY > initialNavTop) {
        mainNav.classList.add("sticky-nav", "shadow-lg");
        navSpacer.classList.remove("hidden");
        navSpacer.style.height = mainNav.offsetHeight + "px";
    } else {
        mainNav.classList.remove("sticky-nav", "shadow-lg");
        navSpacer.classList.add("hidden");
        navSpacer.style.height = "0";
    }
});

updateAboutParallax();

function validateRut(rut) {
    if (typeof rut !== "string") return false;
    rut = rut.toUpperCase().replace(/[^0-9Kk]/g, "");
    let dv = rut.slice(-1);
    let rut_without_dv = parseInt(rut.slice(0, -1));
    if (isNaN(rut_without_dv) || rut_without_dv === 0) return false;

    let suma = 0;
    let factor = 2;
    for (let i = rut_without_dv.toString().length - 1; i >= 0; i--) {
        suma += parseInt(rut_without_dv.toString().charAt(i)) * factor;
        factor = factor === 7 ? 2 : factor + 1;
    }
    let resultado = 11 - (suma % 11);
    let dv_valido = resultado === 11 ? "0" : resultado === 10 ? "K" : resultado.toString();
    return dv === dv_valido;
}

const contactForm = document.querySelector("form");
const rutInput = document.getElementById("RUT");

if (contactForm && rutInput) {
    contactForm.addEventListener("submit", function (event) {
        if (!validateRut(rutInput.value)) {
            event.preventDefault();
            alert("Por favor, ingrese un R.U.T. válido.");
            rutInput.focus();
        }
    });
}

// ============================================================
// Scrollspy — highlight active nav link based on current section
// ============================================================
(function initScrollspy() {
    // Map section id → desktop nav href
    const sectionIds = ["hero-section", "services", "about", "team", "contact"];
    const navLinks = document.querySelectorAll(".hidden.md\\:block .nav-link[href]");

    const setActive = (id) => {
        navLinks.forEach((link) => {
            const href = link.getAttribute("href");
            const matchesSection = href === "#" + id || (id === "hero-section" && href === "#");
            link.classList.toggle("nav-active", matchesSection);
        });
    };

    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    setActive(entry.target.id);
                }
            });
        },
        {
            // Trigger when section occupies the upper-middle portion of the viewport
            rootMargin: "-20% 0px -60% 0px",
            threshold: 0,
        }
    );

    sectionIds.forEach((id) => {
        const el = document.getElementById(id);
        if (el) observer.observe(el);
    });
})();

// FAQ Collapsible Logic
document.querySelectorAll(".faq-toggle").forEach((button) => {
    button.addEventListener("click", () => {
        const content = button.nextElementSibling;
        const icon = button.querySelector(".faq-icon");

        document.querySelectorAll(".faq-toggle").forEach((otherButton) => {
            if (otherButton !== button) {
                const otherContent = otherButton.nextElementSibling;
                const otherIcon = otherButton.querySelector(".faq-icon");
                if (otherContent.style.maxHeight) {
                    otherContent.style.maxHeight = null;
                    otherButton.setAttribute("aria-expanded", "false");
                    otherIcon.style.transform = "rotate(0deg)";
                }
            }
        });

        if (content.style.maxHeight) {
            content.style.maxHeight = null;
            button.setAttribute("aria-expanded", "false");
            icon.style.transform = "rotate(0deg)";
        } else {
            content.style.maxHeight = content.scrollHeight + "px";
            button.setAttribute("aria-expanded", "true");
            icon.style.transform = "rotate(180deg)";
        }
    });
});

// ============================================================
// Command Palette (ï¼Slash or Ctrl+K)
// ============================================================
(function initCommandPalette() {
    // ---- Index of searchable items ----
    const ITEMS = [
        // Sections
        {
            label: "Inicio",
            sub: "Ir al inicio de la página",
            icon: "home",
            action: () => window.scrollTo({top: 0, behavior: "smooth"}),
        },
        {label: "Servicios", sub: "Ver todos los servicios", icon: "tool", action: () => scrollTo("services")},
        {label: "Quiénes somos", sub: "Sección Nosotros", icon: "info", action: () => scrollTo("about")},
        {label: "Nuestro Equipo", sub: "Conoce al equipo Pioneros", icon: "users", action: () => scrollTo("team")},
        {
            label: "Testimonios",
            sub: "Lo que dicen nuestros clientes",
            icon: "star",
            action: () => scrollTo("testimonials"),
        },
        {label: "Preguntas frecuentes", sub: "FAQ", icon: "help-circle", action: () => scrollTo("faq")},
        {label: "Contacto", sub: "Envíanos un mensaje", icon: "mail", action: () => scrollTo("contact")},
        {
            label: "Blog",
            sub: "Artículos y consejos automotrices",
            icon: "book-open",
            action: () => {
                window.location.href = "blog.html";
            },
        },
        // Booking shortcuts
        {
            label: "Reservar hora",
            sub: "Abrir formulario de reserva",
            icon: "calendar",
            action: () => openBookingModal(),
        },
        {
            label: "Reservar — Cambio de Aceite",
            sub: "Total Quartz — 45 min garantizados",
            icon: "calendar",
            action: () => openBookingModal("Cambio de Aceite Total Quartz \u2014 45 min"),
        },
        {
            label: "Reservar — Mantención Premium",
            sub: "Diagnóstico computarizado + repuestos premium",
            icon: "calendar",
            action: () => openBookingModal("Mantención Premium"),
        },
        {
            label: "Reservar — Mantención Standard",
            sub: "Servicios esenciales de mantención",
            icon: "calendar",
            action: () => openBookingModal("Mantención Standard"),
        },
        {
            label: "Reservar — Frenos",
            sub: "Inspección y reemplazo de frenos",
            icon: "calendar",
            action: () => openBookingModal("Servicio de Frenos"),
        },
        {
            label: "Reservar — GPS",
            sub: "Instalación de GPS",
            icon: "calendar",
            action: () => openBookingModal("Instalación G.P.S."),
        },
        {
            label: "Reservar — Láminas",
            sub: "Instalación de láminas de seguridad",
            icon: "calendar",
            action: () => openBookingModal("Instalación Láminas de Seguridad"),
        },
        {
            label: "Reservar — Grabado de Patente",
            sub: "Cumple con la ley de grabado",
            icon: "calendar",
            action: () => openBookingModal("Grabado de Patente"),
        },
        {
            label: "Reservar — Accesorios",
            sub: "Personaliza tu vehículo",
            icon: "calendar",
            action: () => openBookingModal("Accesorios"),
        },
        // Contact actions
        {
            label: "WhatsApp",
            sub: "+56 9 6543 0123",
            icon: "message-circle",
            action: () => window.open("https://wa.me/56965430123", "_blank", "noopener"),
        },
        {
            label: "Llamar",
            sub: "+56 9 6543 0123",
            icon: "phone",
            action: () => {
                window.location.href = "tel:+56965430123";
            },
        },
        {
            label: "Email",
            sub: "service@pioneros.com",
            icon: "mail",
            action: () => {
                window.location.href = "mailto:service@pioneros.com";
            },
        },
        {
            label: "Cómo llegar",
            sub: "Abrir Google Maps",
            icon: "map-pin",
            action: () => window.open("https://maps.app.goo.gl/jNfNdUakfvuCQq8D9", "_blank", "noopener"),
        },
    ];

    function scrollTo(id) {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({behavior: "smooth", block: "start"});
    }

    // ---- Build DOM ----
    const overlay = document.createElement("div");
    overlay.id = "cmd-overlay";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-label", "Buscar");
    overlay.style.cssText = [
        "position:fixed",
        "inset:0",
        "z-index:10000",
        "background:rgba(0,0,0,0.55)",
        "backdrop-filter:blur(4px)",
        "display:flex",
        "align-items:flex-start",
        "justify-content:center",
        "padding-top:6rem",
        "padding-left:1rem",
        "padding-right:1rem",
    ].join(";");
    overlay.style.display = "none";

    const panel = document.createElement("div");
    panel.style.cssText = [
        "background:#f0ebe4",
        "border-radius:1rem",
        "width:100%",
        "max-width:36rem",
        "box-shadow:0 24px 64px rgba(0,0,0,0.35)",
        "overflow:hidden",
        "border:1px solid rgba(191,142,80,0.22)",
        "font-family:Figtree,sans-serif",
    ].join(";");

    const inputWrap = document.createElement("div");
    inputWrap.style.cssText =
        "display:flex;align-items:center;gap:0.625rem;padding:0.875rem 1rem;border-bottom:1px solid #dad3ca";

    const searchIcon = document.createElement("span");
    searchIcon.innerHTML = `<svg width="18" height="18" fill="none" stroke="#bf8e50" stroke-width="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`;
    searchIcon.style.flexShrink = "0";

    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = "Buscar servicio, sección, acción…";
    input.setAttribute("aria-label", "Buscar");
    input.setAttribute("autocomplete", "off");
    input.style.cssText = [
        "flex:1",
        "border:none",
        "outline:none",
        "background:transparent",
        "font-size:1rem",
        "font-family:Figtree,sans-serif",
        "color:#3d3730",
        "min-width:0",
    ].join(";");

    const kbdClose = document.createElement("kbd");
    kbdClose.textContent = "Esc";
    kbdClose.style.cssText =
        "font-size:0.7rem;padding:2px 6px;border-radius:4px;background:#dad3ca;color:#5a5650;font-family:monospace;flex-shrink:0";

    inputWrap.appendChild(searchIcon);
    inputWrap.appendChild(input);
    inputWrap.appendChild(kbdClose);

    const list = document.createElement("ul");
    list.setAttribute("role", "listbox");
    list.style.cssText = "list-style:none;margin:0;padding:0.375rem 0;max-height:20rem;overflow-y:auto";

    const footer = document.createElement("div");
    footer.style.cssText =
        "padding:0.5rem 1rem;border-top:1px solid #dad3ca;font-size:0.7rem;color:#9c9690;display:flex;gap:1rem";
    footer.innerHTML =
        "<span><kbd style='background:#dad3ca;border-radius:3px;padding:1px 5px;font-family:monospace'>↑↓</kbd> navegar</span><span><kbd style='background:#dad3ca;border-radius:3px;padding:1px 5px;font-family:monospace'>Enter</kbd> seleccionar</span><span><kbd style='background:#dad3ca;border-radius:3px;padding:1px 5px;font-family:monospace'>Esc</kbd> cerrar</span>";

    panel.appendChild(inputWrap);
    panel.appendChild(list);
    panel.appendChild(footer);
    overlay.appendChild(panel);
    document.body.appendChild(overlay);

    // ---- State ----
    let activeIdx = 0;
    let filtered = [];

    function highlight(text, query) {
        if (!query) return text;
        const re = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
        return text.replace(
            re,
            "<mark style='background:rgba(191,142,80,0.28);border-radius:2px;padding:0 1px'>$1</mark>"
        );
    }

    function renderItems(query) {
        const q = (query || "").trim().toLowerCase();
        filtered = q ? ITEMS.filter((it) => (it.label + " " + it.sub).toLowerCase().includes(q)) : ITEMS.slice(0, 8);
        activeIdx = 0;
        list.innerHTML = "";
        if (filtered.length === 0) {
            const empty = document.createElement("li");
            empty.style.cssText = "padding:1.5rem;text-align:center;color:#9c9690;font-size:0.875rem";
            empty.textContent = "Sin resultados";
            list.appendChild(empty);
            return;
        }
        filtered.forEach((item, i) => {
            const li = document.createElement("li");
            li.setAttribute("role", "option");
            li.setAttribute("aria-selected", i === 0 ? "true" : "false");
            li.style.cssText = [
                "display:flex",
                "align-items:center",
                "gap:0.75rem",
                "padding:0.625rem 1rem",
                "cursor:pointer",
                "transition:background 0.1s ease",
                i === 0 ? "background:#dad3ca" : "",
            ].join(";");
            const iconWrap = document.createElement("span");
            iconWrap.innerHTML = `<svg width="16" height="16" fill="none" stroke="#bf8e50" stroke-width="2" viewBox="0 0 24 24" style="flex-shrink:0" data-feather="${item.icon}"></svg>`;
            const text = document.createElement("span");
            text.style.cssText = "flex:1;min-width:0";
            text.innerHTML = `<span style="display:block;font-weight:500;color:#3d3730;font-size:0.9rem">${highlight(
                item.label,
                q
            )}</span><span style="display:block;font-size:0.75rem;color:#9c9690;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${highlight(
                item.sub,
                q
            )}</span>`;
            li.appendChild(iconWrap);
            li.appendChild(text);
            li.addEventListener("mouseenter", () => setActive(i));
            li.addEventListener("click", () => runItem(i));
            list.appendChild(li);
        });
        // Replace feather icons inside palette
        if (window.feather) feather.replace({targetAttr: "data-feather"});
    }

    function setActive(i) {
        activeIdx = Math.max(0, Math.min(i, filtered.length - 1));
        Array.from(list.children).forEach((li, idx) => {
            const active = idx === activeIdx;
            li.style.background = active ? "#dad3ca" : "";
            li.setAttribute("aria-selected", active ? "true" : "false");
        });
        // Scroll into view
        const activeLi = list.children[activeIdx];
        if (activeLi) activeLi.scrollIntoView({block: "nearest"});
    }

    function runItem(i) {
        const item = filtered[i];
        if (!item) return;
        close();
        item.action();
    }

    function open() {
        overlay.style.display = "flex";
        input.value = "";
        renderItems("");
        requestAnimationFrame(() => input.focus());
    }

    function close() {
        overlay.style.display = "none";
        input.value = "";
    }

    function isOpen() {
        return overlay.style.display !== "none";
    }

    // Input events
    input.addEventListener("input", () => renderItems(input.value));
    input.addEventListener("keydown", (e) => {
        if (e.key === "ArrowDown") {
            e.preventDefault();
            setActive(activeIdx + 1);
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActive(activeIdx - 1);
        } else if (e.key === "Enter") {
            e.preventDefault();
            runItem(activeIdx);
        } else if (e.key === "Escape") {
            e.preventDefault();
            close();
        }
    });

    // Click backdrop to close
    overlay.addEventListener("click", (e) => {
        if (e.target === overlay) close();
    });

    // Expose for key handler
    window._cmdPalette = {open, close, isOpen};
})();

// Floating Action Button (FAB) logic
document.addEventListener("DOMContentLoaded", () => {
    const fabMain = document.getElementById("fab-main");
    const fabOptions = document.getElementById("fab-options");
    const iconCalendar = document.getElementById("fab-icon-car");
    const iconClose = document.getElementById("fab-icon-close");

    if (fabMain) {
        fabMain.addEventListener("click", (e) => {
            e.stopPropagation();
            const isOpen = fabOptions.classList.toggle("active");
            // Toggle icons
            if (isOpen) {
                iconCalendar.classList.add("hidden");
                iconClose.classList.remove("hidden");
            } else {
                iconCalendar.classList.remove("hidden");
                iconClose.classList.add("hidden");
            }
            // Update accessible state
            fabMain.setAttribute("aria-expanded", isOpen ? "true" : "false");
            fabMain.setAttribute("aria-label", isOpen ? "Cerrar menú" : "Reservar hora");
        });
    }

    // Close when clicking outside
    document.addEventListener("click", (e) => {
        if (fabOptions && !fabMain.contains(e.target) && !fabOptions.contains(e.target)) {
            fabOptions.classList.remove("active");
            iconCalendar.classList.remove("hidden");
            iconClose.classList.add("hidden");
            fabMain.setAttribute("aria-expanded", "false");
            fabMain.setAttribute("aria-label", "Reservar hora");
        }
    });
});

// ============================================================
// Keyboard shortcuts
// R → open booking modal
// Escape → close booking modal
// ? → toggle shortcuts hint
// ============================================================
(function initKeyboardShortcuts() {
    // Passive affordance badge — bottom-left corner, desktop only
    const badge = document.createElement("button");
    badge.id = "kb-badge";
    badge.type = "button";
    badge.title = "Atajos de teclado (?)";
    badge.setAttribute("aria-label", "Mostrar atajos de teclado");
    badge.textContent = "?";
    badge.style.cssText = [
        "position:fixed",
        "bottom:1rem",
        "right:1rem",
        "z-index:9998",
        "width:1.75rem",
        "height:1.75rem",
        "border-radius:50%",
        "background:rgba(191,142,80,0.05)",
        "border:1px solid rgba(191,142,80,0.25)",
        "color:#bf8e50",
        "font-size:0.775rem",
        "font-weight:700",
        "font-family:Figtree,sans-serif",
        "cursor:pointer",
        "display:none",
        "align-items:center",
        "justify-content:center",
        "transition:background 0.2s ease",
        "line-height:1",
    ].join(";");
    // CSS hides it on screens < 1024px (see styles.css #kb-badge rule)
    badge.style.display = "flex";
    badge.addEventListener("click", () => {
        hintVisible ? hideHint() : showHint(false);
    });
    badge.addEventListener("mouseenter", () => {
        badge.style.background = "rgba(191,142,80,0.28)";
    });
    badge.addEventListener("mouseleave", () => {
        badge.style.background = "rgba(191,142,80,0.05)";
    });
    document.body.appendChild(badge);

    // Build the hint overlay once
    const hint = document.createElement("div");
    hint.id = "kb-hint";
    hint.setAttribute("role", "dialog");
    hint.setAttribute("aria-label", "Atajos de teclado");
    hint.style.cssText = [
        "position:fixed",
        "bottom:1.25rem",
        "left:50%",
        "transform:translateX(-50%) translateY(1rem)",
        "background:#1f1e1a",
        "color:#f7f4ef",
        "border:1px solid rgba(191,142,80,0.35)",
        "border-radius:0.75rem",
        "padding:1rem 1.5rem",
        "font-family:Figtree,sans-serif",
        "font-size:0.8125rem",
        "line-height:1.6",
        "box-shadow:0 8px 32px rgba(0,0,0,0.35)",
        "z-index:9999",
        "opacity:0",
        "pointer-events:none",
        "transition:opacity 0.2s ease,transform 0.2s ease",
    ].join(";");
    const kbdStyle = "background:rgba(255,255,255,0.1);border-radius:4px;padding:1px 6px;font-family:monospace";
    hint.innerHTML = [
        "<strong style='color:#bf8e50;display:block;margin-bottom:0.6rem'>Atajos de teclado</strong>",
        "<div style='display:grid;grid-template-columns:auto 1fr;gap:0.25rem 0.75rem;align-items:center'>",
        `<kbd style='${kbdStyle}'>Ctrl K</kbd><span>Buscar sección o servicio</span>`,
        `<kbd style='${kbdStyle}'>/</kbd><span>Buscar sección o servicio</span>`,
        `<kbd style='${kbdStyle}'>R</kbd><span>Reservar una hora</span>`,
        `<kbd style='${kbdStyle}'>W</kbd><span>Contactar por WhatsApp</span>`,
        `<kbd style='${kbdStyle}'>G+S</kbd><span>Ir a Servicios</span>`,
        `<kbd style='${kbdStyle}'>G+N</kbd><span>Ir a Nosotros</span>`,
        `<kbd style='${kbdStyle}'>G+E</kbd><span>Ir a Equipo</span>`,
        `<kbd style='${kbdStyle}'>G+C</kbd><span>Ir a Contacto</span>`,
        `<kbd style='${kbdStyle}'>G+B</kbd><span>Ir al Blog</span>`,
        `<kbd style='${kbdStyle}'>Esc</kbd><span>Cerrar modal</span>`,
        `<kbd style='${kbdStyle}'>?</kbd><span>Mostrar/ocultar esta ayuda</span>`,
        "</div>",
        "<p style='margin-top:0.6rem;font-size:0.7rem;opacity:0.45'>Presiona G luego la letra de sección</p>",
    ].join("");
    document.body.appendChild(hint);

    let hintVisible = false;
    let hintTimer = null;

    function showHint(autohide) {
        hintVisible = true;
        hint.style.opacity = "1";
        hint.style.transform = "translateX(-50%) translateY(0)";
        hint.style.pointerEvents = "auto";
        clearTimeout(hintTimer);
        if (autohide) {
            hintTimer = setTimeout(hideHint, 3500);
        }
    }

    function hideHint() {
        hintVisible = false;
        hint.style.opacity = "0";
        hint.style.transform = "translateX(-50%) translateY(1rem)";
        hint.style.pointerEvents = "none";
    }

    let gPressed = false;
    let gTimer = null;

    // "Go to" section by id
    function goToSection(id) {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({behavior: "smooth", block: "start"});
    }

    document.addEventListener("keydown", function (e) {
        // Ignore shortcuts when typing inside an input, textarea or select
        const tag = document.activeElement && document.activeElement.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

        const modal = document.getElementById("booking-modal");
        const modalOpen = modal && !modal.classList.contains("hidden");

        if (e.key === "Escape") {
            if (window._cmdPalette && window._cmdPalette.isOpen()) {
                window._cmdPalette.close();
                return;
            }
            if (modalOpen) {
                if (typeof closeBookingModal === "function") closeBookingModal();
            }
            if (hintVisible) hideHint();
            gPressed = false;
            clearTimeout(gTimer);
            return;
        }

        // Ctrl+K or / → command palette
        if ((e.key === "k" && (e.ctrlKey || e.metaKey)) || (e.key === "/" && !modalOpen && !e.ctrlKey && !e.metaKey)) {
            e.preventDefault();
            if (window._cmdPalette)
                window._cmdPalette.isOpen() ? window._cmdPalette.close() : window._cmdPalette.open();
            return;
        }

        if (e.key === "?") {
            hintVisible ? hideHint() : showHint(false);
            return;
        }

        // W → WhatsApp
        if ((e.key === "w" || e.key === "W") && !modalOpen && !e.metaKey && !e.ctrlKey) {
            window.open("https://wa.me/56965430123", "_blank", "noopener");
            return;
        }

        if ((e.key === "r" || e.key === "R") && !modalOpen && !e.metaKey && !e.ctrlKey) {
            if (typeof openBookingModal === "function") openBookingModal();
            return;
        }

        // G-chord: press G then a section letter within 1s
        if ((e.key === "g" || e.key === "G") && !modalOpen && !e.metaKey && !e.ctrlKey) {
            gPressed = true;
            clearTimeout(gTimer);
            gTimer = setTimeout(() => {
                gPressed = false;
            }, 1000);
            return;
        }

        if (gPressed && !modalOpen) {
            gPressed = false;
            clearTimeout(gTimer);
            const key = e.key.toLowerCase();
            const sectionMap = {s: "services", n: "about", e: "team", c: "contact", b: null};
            if (key === "b") {
                window.location.href = "blog.html";
                return;
            }
            if (sectionMap[key] !== undefined) {
                goToSection(sectionMap[key]);
                return;
            }
        }
    });
})();
