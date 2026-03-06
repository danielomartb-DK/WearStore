/**
 * js/newsletter.js
 * Maneja la lógica de suscripción al boletín en el footer y envía el catálogo por correo
 * real usando EmailJS.
 */

// ==========================================================
// CONFIGURACIÓN DE EMAILJS (MODIFICA ESTOS 3 VALORES) 
// ==========================================================
// Regístrate gratis en https://www.emailjs.com/
// 1. Ve a "Email Services" y añade un servicio (ej: Gmail) para obtener el SERVICE_ID
// 2. Ve a "Email Templates" y crea un template para obtener el TEMPLATE_ID
// 3. Ve a "Account" > "API Keys" para obtener tu PUBLIC_KEY (Public Key)

const EMAILJS_PUBLIC_KEY = 'TU_PUBLIC_KEY';
const EMAILJS_SERVICE_ID = 'TU_SERVICE_ID';
const EMAILJS_TEMPLATE_ID = 'TU_TEMPLATE_ID';
// ==========================================================

document.addEventListener('DOMContentLoaded', () => {
    // 1. Cargar script de EmailJS dinámicamente
    if (typeof emailjs === 'undefined') {
        const script = document.createElement('script');
        script.src = "https://cdn.jsdelivr.net/npm/@emailjs/browser@3/dist/email.min.js";
        script.onload = () => {
            if (EMAILJS_PUBLIC_KEY !== 'TU_PUBLIC_KEY') {
                emailjs.init(EMAILJS_PUBLIC_KEY);
            }
        };
        document.head.appendChild(script);
    } else {
        if (EMAILJS_PUBLIC_KEY !== 'TU_PUBLIC_KEY') {
            emailjs.init(EMAILJS_PUBLIC_KEY);
        }
    }

    const newsletterForm = document.getElementById('newsletterForm');
    const newsletterEmail = document.getElementById('newsletterEmail');
    const newsletterBtn = document.getElementById('newsletterBtn');

    if (!newsletterForm || !newsletterEmail || !newsletterBtn) return;

    newsletterForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = newsletterEmail.value.trim();
        if (!email) return;

        // Validar formato de correo
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            mostrarToastFeedback('Por favor, ingresa un correo válido.', 'error');
            return;
        }

        // Estado de Carga
        const originalBtnHTML = newsletterBtn.innerHTML;
        newsletterBtn.disabled = true;
        newsletterBtn.innerHTML = `
            <span class="material-symbols-outlined animate-spin mr-2 text-[18px]">progress_activity</span>
            Enviando...
        `;
        newsletterBtn.classList.replace('bg-cyan-500', 'bg-slate-600');
        newsletterBtn.classList.replace('hover:bg-cyan-400', 'hover:bg-slate-500');
        newsletterBtn.classList.replace('text-black', 'text-white');

        try {
            // Animación de carga artificial para mejorar la percepción UX 
            // aunque falle instantáneamente por falta de credenciales.
            await new Promise(resolve => setTimeout(resolve, 1500));

            // Validar que el usuario configuró EmailJS
            if (EMAILJS_PUBLIC_KEY === 'TU_PUBLIC_KEY' || EMAILJS_SERVICE_ID === 'TU_SERVICE_ID') {
                throw new Error("Credenciales_Faltantes");
            }

            // ENVIAR EL CORREO REAL CON EMAILJS
            // NOTA: Asegúrate de que en el Email Template de EmailJS 
            // tengas una variable que se llame {{to_email}} para saber a quién enviar.
            await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
                to_email: email,
                reply_to: "contacto@WearStore.com",
            });

            // Estado de Éxito
            newsletterBtn.innerHTML = `
                <span class="material-symbols-outlined mr-1 text-[20px]">check_circle</span>
                Enviado
            `;
            newsletterBtn.classList.replace('bg-slate-600', 'bg-green-500');
            newsletterBtn.classList.replace('hover:bg-slate-500', 'hover:bg-green-400');

            mostrarToastFeedback(`¡El catálogo ha sido enviado a ${email}! Revisa tu bandeja de entrada o spam.`, 'success');

            // Limpiar input
            newsletterEmail.value = '';

            // Restaurar estilo del botón
            setTimeout(() => {
                newsletterBtn.disabled = false;
                newsletterBtn.innerHTML = originalBtnHTML;
                newsletterBtn.classList.replace('bg-green-500', 'bg-cyan-500');
                newsletterBtn.classList.replace('hover:bg-green-400', 'hover:bg-cyan-400');
                newsletterBtn.classList.replace('text-white', 'text-black');
            }, 4000);

        } catch (error) {
            // Manejo de Error
            newsletterBtn.disabled = false;
            newsletterBtn.innerHTML = originalBtnHTML;
            newsletterBtn.classList.replace('bg-slate-600', 'bg-cyan-500');
            newsletterBtn.classList.replace('hover:bg-slate-500', 'hover:bg-cyan-400');
            newsletterBtn.classList.replace('text-white', 'text-black');

            if (error && error.message === "Credenciales_Faltantes") {
                mostrarToastFeedback('Falta configurar las credenciales de EmailJS en el código fuente.', 'error');
            } else {
                console.error("Error EmailJS:", error);
                mostrarToastFeedback('Hubo un error al enviar el catálogo. Intenta de nuevo.', 'error');
            }
        }
    });

    // Función auxiliar para mostrar notificaciones Toast si no existe la global de app.js
    function mostrarToastFeedback(mensaje, tipo = 'success') {
        const globalToast = window.mostrarToast;
        if (typeof globalToast === 'function') {
            globalToast(mensaje, tipo);
        } else {
            // Fallback por si la función no está expuesta en alguna página
            const toastElement = document.getElementById('toast');
            const toastMessageElement = document.getElementById('toastMessage');
            if (toastElement && toastMessageElement) {
                toastMessageElement.textContent = mensaje;
                if (tipo === 'error') {
                    toastElement.classList.replace('bg-[#231b0f]', 'bg-red-900');
                    toastElement.classList.replace('text-[#ffffff]', 'text-white');
                } else {
                    toastElement.classList.replace('bg-red-900', 'bg-[#231b0f]');
                    toastElement.classList.replace('text-white', 'text-[#ffffff]');
                }
                toastElement.classList.add('show');
                setTimeout(() => toastElement.classList.remove('show'), 4000);
            } else {
                alert(mensaje);
            }
        }
    }
});


