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
