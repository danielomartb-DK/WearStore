/**
 * js/magnetic.js
 * Añade un efecto interactivo moderno "magnético" a todos los botones principales de la tienda.
 * Se activará el resplandor, la atracción dinámica y ahora: ¡Partículas de Avatar emanando del Puntero!
 */

document.addEventListener('DOMContentLoaded', () => {
    // --- MOTOR DE PARTÍCULAS DEL CURSOR ---
    const cursorCanvas = document.createElement('canvas');
    cursorCanvas.id = 'cursorMagicCanvas';
    cursorCanvas.style.position = 'fixed';
    cursorCanvas.style.top = '0';
    cursorCanvas.style.left = '0';
    cursorCanvas.style.width = '100vw';
    cursorCanvas.style.height = '100vh';
    cursorCanvas.style.pointerEvents = 'none';
    cursorCanvas.style.zIndex = '9999';
    document.body.appendChild(cursorCanvas);

    const ctx = cursorCanvas.getContext('2d');
    let width, height;
    let particles = [];
        let isEmitting = false;
    let mouseX = 0;
    let mouseY = 0;

    const resizeCanvas = () => {
        width = window.innerWidth;
        height = window.innerHeight;
        cursorCanvas.width = width;
        cursorCanvas.height = height;
    };
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    // --- RASTREO GLOBAL DEL RATÓN (ESTELAS ÉPICAS) ---
    let emitTimeout;
    window.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
        isEmitting = true; // Activa estela mientras el mouse se mueve

        // Si el mouse se detiene medio segundo, deja de quemar/emitir energía estática
        clearTimeout(emitTimeout);
        emitTimeout = setTimeout(() => {
            isEmitting = false;
        }, 150);
    });

    // --- FIN RASTREO GLOBAL ---

    const emitCursorParticles = () => {
        if (!isEmitting) return;

        const isDark = document.documentElement.classList.contains('dark');

        // Emitir 2-3 partículas por frame
        for (let i = 0; i < 2; i++) {
            if (isDark) {
                // Neón Cyan (Jin Woo Style)
                particles.push({
                    x: mouseX + (Math.random() * 10 - 5),
                    y: mouseY + (Math.random() * 10 - 5),
                    size: Math.random() * 4 + 1.5,
                    speedX: (Math.random() - 0.5) * 1.5,
                    speedY: (Math.random() - 0.5) * 1.5 - 0.5, // Tiende a subir levemente
                    life: 1,
                    decay: Math.random() * 0.03 + 0.02,
                    hue: Math.random() * 40 + 190, // Cyan a Azul
                    type: 'shadow'
                });
            } else {
                // Fuego Sólido (Rengoku Style)
                particles.push({
                    x: mouseX + (Math.random() * 10 - 5),
                    y: mouseY + (Math.random() * 10 - 5),
                    size: Math.random() * 3 + 1,
                    speedX: (Math.random() - 0.5) * 1.5,
                    speedY: (Math.random() - 0.5) * 1.5 - 1,   // Sube como el fuego
                    life: 1,
                    decay: Math.random() * 0.03 + 0.02,
                    hue: Math.random() * 25 + 5, // Naranja a Rojo
                    type: 'fire'
                });
            }
        }
    };

    const animateCursorParticles = () => {
        ctx.clearRect(0, 0, width, height);
        emitCursorParticles();

        ctx.globalCompositeOperation = 'screen';

        for (let i = particles.length - 1; i >= 0; i--) {
            let p = particles[i];
            p.x += p.speedX;
            p.y += p.speedY;
            p.life -= p.decay;

            if (p.life <= 0) {
                particles.splice(i, 1);
                continue;
            }

            ctx.beginPath();
            let currentSize = p.size * p.life;
            if (currentSize < 0) currentSize = 0;

            if (p.type === 'fire') {
                // Dibujo Puntillista Sólido del Fuego
                ctx.arc(p.x, p.y, currentSize, 0, Math.PI * 2);
                let currentHue = p.hue + (1 - p.life) * 35;
                ctx.fillStyle = `hsla(${currentHue}, 100%, 65%, ${p.life})`;
                ctx.fill();
            } else {
                // Dibujo Neón Glaciar
                ctx.arc(p.x, p.y, currentSize, 0, Math.PI * 2);
                let currentHue = p.hue + (1 - p.life) * 20;
                let gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, currentSize);
                gradient.addColorStop(0, `hsla(${currentHue}, 100%, 75%, ${p.life})`);
                gradient.addColorStop(0.4, `hsla(${currentHue}, 100%, 55%, ${p.life * 0.9})`);
                gradient.addColorStop(1, `hsla(${currentHue}, 100%, 50%, 0)`);
                ctx.fillStyle = gradient;
                ctx.fill();
            }
        }

        

        requestAnimationFrame(animateCursorParticles);
    };
    animateCursorParticles();
    // --- FIN MOTOR ---

    // Función para suscribir un botón individual al efecto magnético
    const bindMagneticEffect = (el) => {
        // Evita re-inicializar el mismo botón
        if (el.dataset.magneticBound === 'true') return;
        el.dataset.magneticBound = 'true';

        // Estilos CSS inline garantizados para suavidad
        el.style.transition = 'transform 0.25s cubic-bezier(0.25, 1, 0.5, 1), box-shadow 0.25s ease';

        el.addEventListener('mousemove', (e) => {
            const rect = el.getBoundingClientRect();

            // Determinar coordenadas relativas al centro exacto del botón
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;

            // Factor magnético (distancia que se mueve).
            // A 0.15 se siente suave y no entorpece el clic.
            const moveX = x * 0.15;
            const moveY = y * 0.15;

            el.style.transform = `translate(${moveX}px, ${moveY}px) scale(1.05)`;

            // Sombra neón tech/futurista dependiente del color corporativo original del botón
            if (el.classList.contains('bg-cyan-500') || el.classList.contains('text-brand-blue') || document.documentElement.classList.contains('dark')) {
                // Glow azul/cyan característico de la tienda
                el.style.boxShadow = `0px 10px 25px -5px rgba(6, 182, 212, 0.4)`;
            } else {
                // Glow sutil para botones normales/neutros
                el.style.boxShadow = `0px 10px 20px -5px rgba(0, 0, 0, 0.2)`;
            }
        });

        el.addEventListener('mouseleave', () => {
            // Regreso elástico a la posición original
            el.style.transform = 'translate(0px, 0px) scale(1)';
            el.style.boxShadow = ''; // Libera el glow dinámico
        });
    };

    /**
     * Barreleta del DOM para cazar elementos de botón
     * Incluimos <button>, enlaces con aspecto de botón (ej. Tailwind class bg-primary, etc.)
     */
    const initMagneticButtons = () => {
        const query = 'button, .btn, a.bg-primary, a.bg-cyan-500, a.bg-slate-800, a.bg-red-500, input[type="submit"]';
        const iterables = document.querySelectorAll(query);
        iterables.forEach(bindMagneticEffect);
    };

    // 1. Desencadenar la inicialización nativa en elementos HTML iniciales
    initMagneticButtons();

    // 2. Observer Reactivo (MutationObserver) para afectar a tarjetas de Producto inyectadas por Supabase
    const observer = new MutationObserver((mutations) => {
        let requireRebind = false;
        mutations.forEach((mutation) => {
            if (mutation.addedNodes.length > 0) {
                // Si JavaScript inyecta nuevos productos/tarjetas, debemos aplicarles el efecto
                requireRebind = true;
            }
        });

        if (requireRebind) {
            initMagneticButtons();
        }
    });

    observer.observe(document.body, { childList: true, subtree: true });
});

