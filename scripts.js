// Hero background uses CSS Ken Burns animation — no JS required

// Initialize AOS animations
AOS.init({
    duration: 800,
    easing: "ease-in-out",
    once: true,
});

// Initialize Feather Icons, ONLY on elements with the 'data-feather' attribute
feather.replace({
    targetAttr: "data-feather",
});

// Mobile menu toggle
const mobileMenuButton = document.getElementById("mobile-menu-button");
const mobileMenu = document.getElementById("mobile-menu");
const mobileMenuIcon = document.getElementById("mobile-menu-icon");

mobileMenuButton.addEventListener("click", () => {
    mobileMenu.classList.toggle("hidden");
    const iconElement = document.getElementById("mobile-menu-icon");

    if (mobileMenu.classList.contains("hidden")) {
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
const initialNavTop = mainNav.offsetTop;

window.addEventListener("scroll", () => {
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
// Keyboard shortcuts
// R → open booking modal
// Escape → close booking modal
// ? → toggle shortcuts hint
// ============================================================
(function initKeyboardShortcuts() {
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
    hint.innerHTML = [
        "<strong style='color:#bf8e50;display:block;margin-bottom:0.5rem'>Atajos de teclado</strong>",
        "<kbd style='background:rgba(255,255,255,0.1);border-radius:4px;padding:1px 6px'>R</kbd> &nbsp;Reservar una hora",
        "<br>",
        "<kbd style='background:rgba(255,255,255,0.1);border-radius:4px;padding:1px 6px'>Esc</kbd> Cerrar",
        "<br>",
        "<kbd style='background:rgba(255,255,255,0.1);border-radius:4px;padding:1px 6px'>?</kbd> &nbsp;Mostrar esta ayuda",
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

    document.addEventListener("keydown", function (e) {
        // Ignore shortcuts when typing inside an input, textarea or select
        const tag = document.activeElement && document.activeElement.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

        const modal = document.getElementById("booking-modal");
        const modalOpen = modal && !modal.classList.contains("hidden");

        if (e.key === "Escape") {
            if (modalOpen) {
                if (typeof closeBookingModal === "function") closeBookingModal();
            }
            if (hintVisible) hideHint();
            return;
        }

        if (e.key === "?") {
            hintVisible ? hideHint() : showHint(false);
            return;
        }

        if ((e.key === "r" || e.key === "R") && !modalOpen && !e.metaKey && !e.ctrlKey) {
            if (typeof openBookingModal === "function") openBookingModal();
            return;
        }
    });
})();
