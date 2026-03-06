/**
 * JS/Holo.js - Holographic 3D Card Tilt Effect
 * Aplica inclinación 3D interactiva y destello de luz a las tarjetas de producto.
 * Solo activo en desktop (>768px). Desactivado automáticamente en móvil.
 */

function initHoloCards() {
    // Solo activar en pantallas desktop
    if (window.innerWidth < 768) return;

    const cards = document.querySelectorAll('[data-holo]');

    cards.forEach(card => {
        // Inyectar capa de glare si no existe
        if (!card.querySelector('.holo-glare')) {
            const glare = document.createElement('div');
            glare.classList.add('holo-glare');
            card.appendChild(glare);
        }

        card.addEventListener('mousemove', handleHoloMove);
        card.addEventListener('mouseleave', handleHoloLeave);
        card.addEventListener('mouseenter', handleHoloEnter);
    });
}

function handleHoloEnter(e) {
    const card = e.currentTarget;
    card.style.transition = 'none'; // Cortar transición para respuesta inmediata
}

function handleHoloMove(e) {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const cardW = rect.width;
    const cardH = rect.height;

    // Posición del cursor relativa al centro de la tarjeta (-0.5 a 0.5)
    const x = (e.clientX - rect.left) / cardW - 0.5;
    const y = (e.clientY - rect.top) / cardH - 0.5;

    // Inclinación máxima de ±8 grados
    const maxTilt = 8;
    const rotateY = x * maxTilt;  // Eje Y = movimiento horizontal
    const rotateX = -y * maxTilt; // Eje X = movimiento vertical (invertido)

    card.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.03, 1.03, 1.03)`;

    // Mover el glare proporcionalmente al cursor
    const glare = card.querySelector('.holo-glare');
    if (glare) {
        const glareX = (x + 0.5) * 100;
        const glareY = (y + 0.5) * 100;
        glare.style.background = `radial-gradient(circle at ${glareX}% ${glareY}%, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.06) 40%, transparent 70%)`;
    }
}

function handleHoloLeave(e) {
    const card = e.currentTarget;
    // Restaurar con transición elástica suave
    card.style.transition = 'transform 0.6s cubic-bezier(0.23, 1, 0.32, 1), box-shadow 0.6s ease';
    card.style.transform = 'rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';

    const glare = card.querySelector('.holo-glare');
    if (glare) {
        glare.style.background = '';
    }
}

// Re-inicializar si se redimensiona la ventana (ej. rotar tablet)
let holoResizeTimer;
window.addEventListener('resize', () => {
    clearTimeout(holoResizeTimer);
    holoResizeTimer = setTimeout(() => {
        // Limpiar listeners actuales y re-evaluar
        document.querySelectorAll('[data-holo]').forEach(card => {
            card.removeEventListener('mousemove', handleHoloMove);
            card.removeEventListener('mouseleave', handleHoloLeave);
            card.removeEventListener('mouseenter', handleHoloEnter);
            card.style.transform = '';
        });
        initHoloCards();
    }, 300);
});
