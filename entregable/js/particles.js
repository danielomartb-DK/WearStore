/**
 * js/particles.js - Sistema de partículas de alto rendimiento con Canvas API
 * Reacciona al tema actual de WearStore (Día = Chispas Rengoku, Noche = Magia Jin-Woo)
 */

class HeroParticles {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;

        this.ctx = this.canvas.getContext('2d', { alpha: true });
        this.particles = [];
        this.isDarkTheme = document.documentElement.classList.contains('dark');

        // Ajustar tamaño del canvas
        this.resize();
        window.addEventListener('resize', () => this.resize());

        // Escuchar cambios de tema usando el MutationObserver que usaremos o chequeo manual
        this.themeObserver = new MutationObserver(() => this.checkTheme());
        this.themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

        // Configuración según el tema activo
        this.updateConfig();

        // Inicializar partículas
        this.initParticles();

        // Loop de animación
        this.animate();
    }

    checkTheme() {
        const currentlyDark = document.documentElement.classList.contains('dark');
        if (currentlyDark !== this.isDarkTheme) {
            this.isDarkTheme = currentlyDark;
            this.updateConfig();
        }
    }

    updateConfig() {
        if (this.isDarkTheme) {
            // Modo Jin-Woo (Noche) - Energía / Magia Azul oscura y Cyan
            this.config = {
                count: 60, // Menos partículas pero más notables
                colors: [
                    'rgba(0, 183, 255, alpha)',    // Cyan brillante
                    'rgba(14, 116, 255, alpha)',   // Azul medio
                    'rgba(111, 0, 255, alpha)',    // Púrpura/Indigo
                ],
                sizeMin: 1.5,
                sizeMax: 4,
                speedYMin: 0.2, // Suben más lento (como magia)
                speedYMax: 0.8,
                speedXMin: -0.3, // Movimiento lateral más errático
                speedXMax: 0.3,
                lifeDecrease: 0.005, // Viven más tiempo
                glow: true,
                glowColor: 'rgba(0, 183, 255, 0.4)'
            };
        } else {
            // Modo Rengoku (Día) - Chispas / Fuego
            this.config = {
                count: 100, // Más partículas para efecto chispa
                colors: [
                    'rgba(255, 153, 0, alpha)',   // Naranja puro
                    'rgba(255, 102, 0, alpha)',   // Naranja rojizo
                    'rgba(255, 204, 0, alpha)',   // Amarillo/Dorado
                ],
                sizeMin: 1,
                sizeMax: 3.5,
                speedYMin: 0.8, // Suben rápido como calor
                speedYMax: 2.0,
                speedXMin: -0.5, // Movimiento lateral moderado
                speedXMax: 0.5,
                lifeDecrease: 0.01, // Mueren más rápido, parpadeo
                glow: true,
                glowColor: 'rgba(255, 102, 0, 0.5)'
            };
        }
    }

    resize() {
        // Obtenemos las dimensiones con getBoundingClientRect para evitar borrosidad
        const rect = this.canvas.parentElement.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;
    }

    createParticle() {
        // Seleccionar un color base del array y reemplazar "alpha" por el valor inicial
        const colorBase = this.config.colors[Math.floor(Math.random() * this.config.colors.length)];

        return {
            x: Math.random() * this.canvas.width,
            y: this.canvas.height + Math.random() * 20, // Empiezan desde justo abajo
            size: this.config.sizeMin + Math.random() * (this.config.sizeMax - this.config.sizeMin),
            speedX: this.config.speedXMin + Math.random() * (this.config.speedXMax - this.config.speedXMin),
            speedY: this.config.speedYMin + Math.random() * (this.config.speedYMax - this.config.speedYMin),
            life: Math.random() * 0.5 + 0.5, // Vida inicial entre 0.5 y 1.0
            colorTemplate: colorBase,
            wobble: Math.random() * Math.PI * 2,
            wobbleSpeed: Math.random() * 0.05
        };
    }

    initParticles() {
        this.particles = [];
        for (let i = 0; i < this.config.count; i++) {
            // Para la inyección inicial, esparcimos en toda la altura en lugar de solo abajo
            const p = this.createParticle();
            p.y = Math.random() * this.canvas.height;
            this.particles.push(p);
        }
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        // Limpiamos con un poco de opacidad residual para trails
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Si hay una discrepancia en cuenta de partículas (al cambiar de tema), ajustamos
        if (this.particles.length > this.config.count) {
            this.particles.splice(0, this.particles.length - this.config.count);
        } else while (this.particles.length < this.config.count) {
            this.particles.push(this.createParticle());
        }

        for (let i = 0; i < this.particles.length; i++) {
            let p = this.particles[i];

            // Movimiento Oscilante (Wobble) para parecer realista
            p.wobble += p.wobbleSpeed;
            p.y -= p.speedY;
            p.x += Math.cos(p.wobble) * 0.5 + p.speedX; // Combinamos ruido con velocidad X constante

            p.life -= this.config.lifeDecrease;

            // Si muere o sale de la pantalla, reiniciar abajo
            if (p.life <= 0 || p.y < -10) {
                this.particles[i] = this.createParticle();
                p = this.particles[i]; // Actualizar la variable local referenciada
            }

            // Dibujar
            this.ctx.beginPath();
            // Desvanecimiento suave en los bordes de la vida útil
            let currentAlpha = p.life < 0.2 ? (p.life / 0.2) : p.life;
            this.ctx.fillStyle = p.colorTemplate.replace('alpha', currentAlpha.toFixed(2));

            if (this.config.glow) {
                this.ctx.shadowBlur = 10;
                this.ctx.shadowColor = this.config.glowColor;
            } else {
                this.ctx.shadowBlur = 0;
            }

            this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.shadowBlur = 0; // Reset para el siguiente
        }
    }
}

// Inicializar cuando DOM cargue
document.addEventListener('DOMContentLoaded', () => {
    // Breve retraso para asegurar que los rects esten consolidados (en flex/grids a veces requiere un frame)
    setTimeout(() => {
        if (document.getElementById('hero-particles')) {
            window.heroParticlesSystem = new HeroParticles('hero-particles');
        }
    }, 100);
});


