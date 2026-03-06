/**
 * JS/PixelConfirm.js - Modal de Confirmación Anime Custom
 * Reemplaza los feos confirm() nativos del navegador con un modal temático.
 */

window.pixelConfirm = function (mensaje, opciones = {}) {
    return new Promise((resolve) => {
        const {
            titulo = '⚔️ Confirmación',
            btnConfirm = 'Confirmar',
            btnCancel = 'Cancelar',
            tipo = 'warning' // 'warning', 'danger', 'info'
        } = opciones;

        const colores = {
            warning: { grad: 'from-amber-500 to-orange-600', icon: 'warning', iconColor: 'text-amber-400', border: 'border-amber-500/30', glow: 'shadow-[0_0_30px_rgba(245,158,11,0.2)]' },
            danger: { grad: 'from-red-500 to-rose-700', icon: 'cancel', iconColor: 'text-red-400', border: 'border-red-500/30', glow: 'shadow-[0_0_30px_rgba(239,68,68,0.2)]' },
            info: { grad: 'from-cyan-500 to-blue-600', icon: 'info', iconColor: 'text-cyan-400', border: 'border-cyan-500/30', glow: 'shadow-[0_0_30px_rgba(6,182,212,0.2)]' }
        };
        const c = colores[tipo] || colores.warning;

        // Crear dialog
        const dialog = document.createElement('dialog');
        dialog.id = 'pixelConfirmDialog';
        dialog.className = 'bg-transparent border-none p-0 m-auto backdrop:bg-black/70 backdrop:backdrop-blur-sm';
        dialog.innerHTML = `
            <div class="bg-slate-900 ${c.border} border-2 rounded-2xl ${c.glow} w-[380px] max-w-[90vw] overflow-hidden animate-[scaleIn_0.2s_ease-out]">
                <!-- Header -->
                <div class="bg-gradient-to-r ${c.grad} p-4 flex items-center gap-3">
                    <span class="material-symbols-outlined text-white text-3xl">${c.icon}</span>
                    <h3 class="text-white font-black text-lg tracking-wide">${titulo}</h3>
                </div>
                <!-- Body -->
                <div class="p-6">
                    <p class="text-slate-300 text-sm leading-relaxed">${mensaje}</p>
                </div>
                <!-- Botones -->
                <div class="px-6 pb-5 flex gap-3 justify-end">
                    <button id="pixelConfirmNo" class="px-5 py-2.5 rounded-xl font-bold text-sm bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white border border-slate-700 transition-all">
                        ${btnCancel}
                    </button>
                    <button id="pixelConfirmYes" class="px-5 py-2.5 rounded-xl font-bold text-sm bg-gradient-to-r ${c.grad} text-white hover:brightness-110 transition-all shadow-lg">
                        ${btnConfirm}
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(dialog);
        dialog.showModal();

        const cleanup = (result) => {
            dialog.close();
            dialog.remove();
            resolve(result);
        };

        dialog.querySelector('#pixelConfirmYes').addEventListener('click', () => cleanup(true));
        dialog.querySelector('#pixelConfirmNo').addEventListener('click', () => cleanup(false));
        dialog.addEventListener('cancel', () => cleanup(false)); // ESC key
    });
};

// CSS animation
if (!document.getElementById('pixelConfirmStyles')) {
    const style = document.createElement('style');
    style.id = 'pixelConfirmStyles';
    style.textContent = `@keyframes scaleIn { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }`;
    document.head.appendChild(style);
}
