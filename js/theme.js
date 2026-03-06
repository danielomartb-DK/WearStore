/**
 * js/theme.js - Gestión del Modo Oscuro/Claro (WearStore - Minimalist Tech)
 */

// Inicialización inmediata del tema
(function () {
    const savedTheme = localStorage.getItem('WearStore_theme');
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
})();

window.toggleTheme = function () { };

function actualizarIconosTema() {
    const isDark = document.documentElement.classList.contains('dark');
    const themeIcons = document.querySelectorAll('.theme-icon-toggle');

    // --- TOGGLE ICON (Minimalista - Material Design) ---
    themeIcons.forEach(icon => {
        icon.classList.remove('material-symbols-outlined');
        if (isDark) {
            icon.innerHTML = `
                <canvas class="avatarAnimeCanvas pointer-events-none z-[-1]" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 120px; height: 120px;" width="120" height="120"></canvas>
                <span class="material-symbols-outlined relative z-10 text-3xl text-cyan-400 drop-shadow-[0_0_8px_rgba(6,182,212,0.6)] transition-transform duration-300 group-hover:scale-110" style="font-size: 32px; font-variation-settings: 'FILL' 1;">dark_mode</span>
            `;
        } else {
            icon.innerHTML = `
                <canvas class="avatarAnimeCanvas pointer-events-none z-[-1]" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 120px; height: 120px;" width="120" height="120"></canvas>
                <span class="material-symbols-outlined relative z-10 text-3xl text-amber-500 drop-shadow-[0_0_8px_rgba(245,158,11,0.6)] transition-transform duration-300 group-hover:scale-110" style="font-size: 32px; font-variation-settings: 'FILL' 1;">light_mode</span>
            `;
        }

        const avatarCanvas = icon.querySelector('.avatarAnimeCanvas');
        if (avatarCanvas) {
            if (icon.avatarEngine) icon.avatarEngine.stop();
            icon.avatarEngine = new AvatarParticleEngine(avatarCanvas, isDark ? 'shadow' : 'fire', isDark ? 0.35 : 1);
        }
    });
}

// --- Motor de Partículas para Avatares (Auras Toggle) ---
class AvatarParticleEngine {
    constructor(canvas, type = 'fire', densityMultiplier = 1) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.type = type;
        this.densityMultiplier = densityMultiplier;
        this.particles = [];
        this.isActive = true;
        this.resize();
        this.resizeHandler = () => this.resize();
        window.addEventListener('resize', this.resizeHandler);
        this.animate = this.animate.bind(this);
        this.animationId = requestAnimationFrame(this.animate);
    }

    stop() {
        this.isActive = false;
        window.removeEventListener('resize', this.resizeHandler);
        cancelAnimationFrame(this.animationId);
    }

    resize() {
        if (!this.canvas.parentElement) return;
        const rect = this.canvas.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        const parentRect = this.canvas.parentElement.getBoundingClientRect();
        this.avatarRadius = parentRect.width / 2;
        this.centerX = this.width / 2;
        this.centerY = this.height / 2;
    }

    emit() {
        if (this.width === 0) this.resize();
        if (this.width === 0) return;
        if (Math.random() < 0.9) {
            const angle = Math.random() * Math.PI * 2;
            const r = this.avatarRadius + (Math.random() * 2 - 1);
            this.particles.push({
                x: this.centerX + Math.cos(angle) * r,
                y: this.centerY + Math.sin(angle) * r,
                size: this.type === 'fire' ? Math.random() * 2 + 0.75 : Math.random() * 6 + 2,
                speedX: Math.cos(angle) * 0.8 + (Math.random() - 0.5),
                speedY: Math.sin(angle) * 0.8 - Math.random() * 1.5,
                life: 1,
                decay: Math.random() * 0.02 + 0.015,
                hue: this.type === 'fire' ? Math.random() * 25 + 5 : Math.random() * 40 + 190
            });
        }
    }

    animate() {
        if (!this.isActive) return;
        this.ctx.clearRect(0, 0, this.width, this.height);

        for (let i = 0; i < Math.floor(3 * this.densityMultiplier); i++) { this.emit(); }
        if (Math.random() < ((3 * this.densityMultiplier) % 1)) { this.emit(); }

        this.ctx.globalCompositeOperation = 'screen';
        for (let i = this.particles.length - 1; i >= 0; i--) {
            let p = this.particles[i];
            p.x += p.speedX;
            p.y += p.speedY;
            p.life -= p.decay;
            if (p.life <= 0) { this.particles.splice(i, 1); continue; }

            this.ctx.beginPath();
            let currentSize = Math.max(0, p.size * p.life);
            this.ctx.arc(p.x, p.y, currentSize, 0, Math.PI * 2);
            let currentHue = p.hue + (1 - p.life) * (this.type === 'fire' ? 35 : 20);

            if (this.type === 'fire') {
                this.ctx.fillStyle = `hsla(${currentHue}, 100%, 85%, ${p.life})`;
                this.ctx.fill();
                this.ctx.fill();
            } else {
                let gradient = this.ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, currentSize);
                gradient.addColorStop(0, `hsla(${currentHue}, 100%, 75%, ${p.life})`);
                gradient.addColorStop(0.4, `hsla(${currentHue}, 100%, 55%, ${p.life * 0.9})`);
                gradient.addColorStop(1, `hsla(${currentHue}, 100%, 50%, 0)`);
                this.ctx.fillStyle = gradient;
                this.ctx.fill();
            }
        }
        this.animationId = requestAnimationFrame(this.animate);
    }
}

// --- Motor de Partículas para el Theme Toggle Track ---
class ThemeParticleEngine {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.particles = [];
        this.resize();
        window.addEventListener('resize', () => this.resize());
        this.animate = this.animate.bind(this);
        requestAnimationFrame(this.animate);
    }

    resize() {
        const rect = this.canvas.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;
        this.width = this.canvas.width;
        this.height = this.canvas.height;
    }

    triggerBurst(isDark) {
        const burstCount = 120;
        for (let i = 0; i < burstCount; i++) {
            const x = Math.random() * this.width;
            const y = Math.random() * this.height;
            const speedX = (Math.random() - 0.5) * 4;
            const speedY = (Math.random() - 0.5) * 2;
            const size = Math.random() * 8 + 4;

            this.particles.push({
                type: isDark ? 'burst_shadow' : 'burst_fire',
                x, y, size, speedX, speedY,
                life: 1,
                decay: Math.random() * 0.015 + 0.005,
                hue: isDark ? 200 : Math.random() * 20 + 20
            });
        }
    }

    emitFire(inner = false) {
        if (Math.random() < (inner ? 0.3 : 0.6)) {
            let x, y, speedX, speedY;
            if (inner) {
                const r = this.height / 2;
                x = (this.width - r);
                y = r + (Math.random() - 0.5) * this.height * 0.4;
                speedX = -Math.random() * 0.4 - 0.1;
                speedY = (Math.random() - 0.5) * 0.2;
            } else {
                const p = Math.random();
                if (p < 0.45) {
                    x = Math.random() * this.width;
                    y = Math.random() > 0.5 ? Math.random() * 4 : this.height - Math.random() * 4;
                } else {
                    const angle = Math.random() * Math.PI;
                    const r = this.height / 2;
                    const isRight = Math.random() > 0.5;
                    x = isRight ? (this.width - r) + Math.sin(angle) * r : r - Math.sin(angle) * r;
                    y = r + Math.cos(angle) * r;
                }
                speedX = (Math.random() - 0.5) * 0.3;
                speedY = (Math.random() - 0.5) * 0.3;
            }
            this.particles.push({
                type: 'fire', x, y,
                size: inner ? Math.random() * 8 + 3 : Math.random() * 4 + 1,
                speedY, speedX, life: 1,
                decay: inner ? Math.random() * 0.008 + 0.004 : Math.random() * 0.03 + 0.02,
                hue: Math.random() * 30 + 10
            });
        }
    }

    emitShadow(inner = false) {
        if (Math.random() < (inner ? 0.4 : 0.6)) {
            let x, y, speedX, speedY;
            if (inner) {
                const r = this.height / 2;
                x = r;
                y = r + (Math.random() - 0.5) * this.height * 0.4;
                speedX = Math.random() * 0.4 + 0.1;
                speedY = (Math.random() - 0.5) * 0.2;
            } else {
                const p = Math.random();
                if (p < 0.45) {
                    x = Math.random() * this.width;
                    y = Math.random() > 0.5 ? Math.random() * 4 : this.height - Math.random() * 4;
                } else {
                    const angle = Math.random() * Math.PI;
                    const r = this.height / 2;
                    const isRight = Math.random() > 0.5;
                    x = isRight ? (this.width - r) + Math.sin(angle) * r : r - Math.sin(angle) * r;
                    y = r + Math.cos(angle) * r;
                }
                speedX = (Math.random() - 0.5) * 0.3;
                speedY = (Math.random() - 0.5) * 0.3;
            }
            this.particles.push({
                type: 'shadow', x, y,
                size: inner ? Math.random() * 6 + 3 : Math.random() * 3 + 1.5,
                speedY, speedX, life: 1,
                decay: inner ? Math.random() * 0.008 + 0.004 : Math.random() * 0.03 + 0.02
            });
        }
    }

    animate() {
        this.ctx.clearRect(0, 0, this.width, this.height);
        const isDark = document.documentElement.classList.contains('dark');

        if (isDark) {
            this.emitShadow(false);
            for (let i = 0; i < 35; i++) { this.emitFire(true); }
        } else {
            this.emitFire(false);
            for (let i = 0; i < 15; i++) { this.emitShadow(true); }
        }

        // Fire rendering
        this.ctx.globalCompositeOperation = 'screen';
        for (let i = this.particles.length - 1; i >= 0; i--) {
            let p = this.particles[i];
            if (p.type === 'fire' || p.type === 'burst_fire') {
                p.x += p.speedX; p.y += p.speedY; p.life -= p.decay;
                if (p.life <= 0) { this.particles.splice(i, 1); continue; }
                this.ctx.beginPath();
                let s = Math.max(0, p.size * p.life);
                this.ctx.arc(p.x, p.y, s, 0, Math.PI * 2);
                let h = (p.hue || 25) + (1 - p.life) * 35;
                let g = this.ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, s);
                g.addColorStop(0, `hsla(${h}, 100%, 75%, ${p.life})`);
                g.addColorStop(0.4, `hsla(${h - 15}, 100%, 55%, ${p.life * 0.9})`);
                g.addColorStop(1, `hsla(${h - 25}, 100%, 50%, 0)`);
                this.ctx.fillStyle = g;
                this.ctx.fill();
            }
        }

        // Shadow rendering
        this.ctx.globalCompositeOperation = 'source-over';
        for (let i = this.particles.length - 1; i >= 0; i--) {
            let p = this.particles[i];
            if (p.type === 'shadow') {
                p.x += p.speedX; p.y += p.speedY; p.life -= p.decay;
                if (p.life <= 0) { this.particles.splice(i, 1); continue; }
                this.ctx.beginPath();
                let s = Math.max(0, p.size * p.life * 2.5);
                this.ctx.arc(p.x, p.y, s, 0, Math.PI * 2);
                let g = this.ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, s);
                g.addColorStop(0, `rgba(10, 5, 25, ${p.life * 0.7})`);
                g.addColorStop(0.4, `rgba(30, 20, 60, ${p.life * 0.4})`);
                g.addColorStop(1, `rgba(40, 20, 80, 0)`);
                this.ctx.fillStyle = g;
                this.ctx.fill();
            }
            if (p.type === 'burst_shadow') {
                p.x += p.speedX; p.y += p.speedY; p.life -= p.decay;
                if (p.life <= 0) { this.particles.splice(i, 1); continue; }
                this.ctx.beginPath();
                let s = Math.max(0, p.size * p.life);
                this.ctx.arc(p.x, p.y, s, 0, Math.PI * 2);
                this.ctx.globalCompositeOperation = 'screen';
                let g = this.ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, s);
                g.addColorStop(0, `rgba(96, 165, 250, ${p.life})`);
                g.addColorStop(0.5, `rgba(37, 99, 235, ${p.life * 0.8})`);
                g.addColorStop(1, `rgba(30, 58, 138, 0)`);
                this.ctx.fillStyle = g;
                this.ctx.fill();
            }
        }

        requestAnimationFrame(this.animate);
    }
}

// Variables Globales
window.appThemeEngines = [];

document.addEventListener('DOMContentLoaded', () => {
    actualizarIconosTema();
    document.querySelectorAll('.themeAnimeCanvas').forEach(canvas => {
        const eng = new ThemeParticleEngine(canvas);
        window.appThemeEngines.push(eng);
    });
});

window.toggleTheme = function () {
    const isDark = document.documentElement.classList.contains('dark');
    const newStateDark = !isDark;
    if (isDark) {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('WearStore_theme', 'light');
    } else {
        document.documentElement.classList.add('dark');
        localStorage.setItem('WearStore_theme', 'dark');
    }
    window.appThemeEngines.forEach(eng => eng.triggerBurst(newStateDark));
    actualizarIconosTema();
};

window.AvatarParticleEngine = AvatarParticleEngine;
