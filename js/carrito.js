/**
 * JS/Carrito.js - Lógica del Carrito y Checkout
 * Maneja la edición del carrito, validación del formulario y venta.
 */

document.addEventListener('DOMContentLoaded', () => {
    initCarrito();
});

// Función auxiliar para obtener la key del carrito basada en el usuario actual
function getCartKey() {
    if (window.novaAuth && window.novaAuth.user && window.novaAuth.user.user) {
        return `WearStore_cart_${window.novaAuth.user.user.id}`;
    }
    return 'WearStore_cart_anon';
}

// Estado del carrito (se inicializa vacío y se carga en initCarrito para asegurar que novaAuth esté listo)
const cart = {
    items: []
};

// Referencias DOM
const cartRefs = {
    itemsContainer: document.getElementById('cartItems'),
    emptyCart: document.getElementById('emptyCart'),
    orderSummary: document.getElementById('orderSummary'),
    itemCount: document.getElementById('itemCount'),
    subtotal: document.getElementById('subtotal'),
    total: document.getElementById('total'),
    form: document.getElementById('checkoutForm'),
    btnCheckout: document.getElementById('btnCheckout'),
    checkoutSuccess: document.getElementById('checkoutSuccess')
};

/**
 * Inicializa el Módulo del Carrito
 */
async function initCarrito() {
    // Cargar items del storage correspondiente al usuario actual
    cart.items = JSON.parse(localStorage.getItem(getCartKey())) || [];

    renderizarItems();
    calcularTotales();

    // Autocompletar datos del cliente si está autenticado
    if (window.novaAuth && window.novaAuth.user && window.novaAuth.user.user) {
        const currentUser = window.novaAuth.user.user;
        const emailInput = document.querySelector('input[name="email"]');
        if (emailInput) {
            emailInput.value = currentUser.email;
            emailInput.readOnly = true;
            emailInput.classList.add('opacity-70', 'cursor-not-allowed', 'bg-slate-100');
        }

        // Recuperar el perfil detallado de Supabase
        try {
            const perfil = await obtenerPerfilCliente(currentUser.email);
            if (perfil) {
                const nombresInput = document.querySelector('input[name="nombres"]');
                const apellidosInput = document.querySelector('input[name="apellidos"]');
                const telefonoInput = document.querySelector('input[name="telefono"]');
                const documentoInput = document.querySelector('input[name="documento"]');
                const direccionInput = document.querySelector('textarea[name="direccion"]');

                if (nombresInput && !nombresInput.value) nombresInput.value = perfil.nombres || '';
                if (apellidosInput && !apellidosInput.value) apellidosInput.value = perfil.apellidos || '';
                if (telefonoInput && !telefonoInput.value) telefonoInput.value = perfil.telefono || '';
                if (documentoInput && !documentoInput.value) documentoInput.value = perfil.documento || '';
                if (direccionInput && !direccionInput.value) direccionInput.value = perfil.direccion || '';
            } else if (currentUser.user_metadata && currentUser.user_metadata.name) {
                // Fallback a los datos de sesión si no hay perfil en BD
                const parts = currentUser.user_metadata.name.split(' ');
                const nombresInput = document.querySelector('input[name="nombres"]');
                const apellidosInput = document.querySelector('input[name="apellidos"]');
                if (nombresInput && !nombresInput.value) nombresInput.value = parts[0];
                if (apellidosInput && parts.length > 1 && !apellidosInput.value) {
                    apellidosInput.value = parts.slice(1).join(' ');
                }
            }
        } catch (e) {
            console.error("Error al cargar el perfil para autocompletar:", e);
        }
    }

    // Binding del formulario
    if (cartRefs.form) {
        cartRefs.form.addEventListener('submit', handleCheckoutSubmit);
    }
}

/**
 * Renderiza las tarjetas de cada item del carrito
 */
function renderizarItems() {
    if (cart.items.length === 0) {
        cartRefs.itemsContainer.innerHTML = '';
        cartRefs.emptyCart.classList.remove('hidden');
        if (cartRefs.orderSummary) cartRefs.orderSummary.classList.add('hidden');
        return;
    }

    cartRefs.emptyCart.classList.add('hidden');
    if (cartRefs.orderSummary) cartRefs.orderSummary.classList.remove('hidden');

    cartRefs.itemsContainer.innerHTML = cart.items.map(item => {
        const itemTotal = window.CurrencyManager ? window.CurrencyManager.formatPrice(item.precio * item.cantidad) : '$' + (item.precio * item.cantidad).toLocaleString('en-US', { minimumFractionDigits: 2 });
        const unitPrice = window.CurrencyManager ? window.CurrencyManager.formatPrice(item.precio) : '$' + item.precio.toLocaleString('en-US', { minimumFractionDigits: 2 });
        const imgUrl = item.imagen_url || 'https://images.unsplash.com/photo-1542281286-9e0a16bb7366?auto=format&fit=crop&q=80&w=200';

        return '<div class="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl p-4 flex gap-4 items-center shadow-sm dark:shadow-[0_0_15px_rgba(0,183,255,0.03)] transition-colors duration-300">'
            + '<img src="' + imgUrl + '" alt="' + item.nombre + '" class="w-20 h-20 object-cover rounded-lg flex-shrink-0" />'
            + '<div class="flex-1 min-w-0">'
            + '<h4 class="font-medium text-sm text-slate-900 dark:text-white truncate transition-colors duration-300">' + item.nombre + '</h4>'
            + (item.talla && item.talla !== 'N/A' ? '<span class="inline-block mt-1 px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 rounded-md">Talla: ' + item.talla + '</span>' : '')
            + '<p class="text-xs text-slate-500 mt-1">Precio unit.: ' + unitPrice + '</p>'
            + '<div class="flex items-center gap-2 mt-2">'
            + '<button onclick="cambiarCantidad(\'' + (item.cart_id || item.id_producto) + '\', -1)" class="w-7 h-7 rounded bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 flex items-center justify-center text-lg font-bold text-slate-600 dark:text-slate-300 transition-colors duration-300">−</button>'
            + '<span class="text-sm font-bold w-6 text-center dark:text-white transition-colors duration-300">' + item.cantidad + '</span>'
            + '<button onclick="cambiarCantidad(\'' + (item.cart_id || item.id_producto) + '\', 1)" class="w-7 h-7 rounded bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 flex items-center justify-center text-lg font-bold text-slate-600 dark:text-slate-300 transition-colors duration-300">+</button>'
            + '</div>'
            + '</div>'
            + '<div class="text-right flex-shrink-0">'
            + '<p class="font-bold text-lg text-slate-900 dark:text-white drop-shadow-sm transition-colors duration-300">' + itemTotal + '</p>'
            + '<button onclick="eliminarItem(\'' + (item.cart_id || item.id_producto) + '\')" class="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-xs mt-2 flex items-center gap-1 ml-auto transition-colors duration-300">'
            + '<span class="material-symbols-outlined text-sm">delete</span> Quitar'
            + '</button>'
            + '</div>'
            + '</div>';
    }).join('');
}

/**
 * Cambia la cantidad de un item
 */
function cambiarCantidad(cartId, delta) {
    // Soporte retroactivo para IDs antiguos numéricos
    const item = cart.items.find(i => (i.cart_id === cartId) || (i.id_producto == cartId));
    if (!item) return;

    item.cantidad += delta;
    if (item.cantidad <= 0) {
        cart.items = cart.items.filter(i => (i.cart_id || i.id_producto) !== cartId);
    } else if (item.cantidad > item.stock) {
        item.cantidad = item.stock;
    }

    guardarCarrito();
    renderizarItems();
    calcularTotales();
}

/**
 * Elimina un item del carrito
 */
function eliminarItem(cartId) {
    cart.items = cart.items.filter(i => (i.cart_id || i.id_producto) !== cartId);
    guardarCarrito();
    renderizarItems();
    calcularTotales();
}

/**
 * Calcula y muestra los totales
 */
function calcularTotales() {
    const totalItems = cart.items.reduce((acc, i) => acc + i.cantidad, 0);
    const subtotal = cart.items.reduce((acc, i) => acc + (i.precio * i.cantidad), 0);

    if (cartRefs.itemCount) cartRefs.itemCount.textContent = totalItems;
    if (cartRefs.subtotal) cartRefs.subtotal.textContent = window.CurrencyManager ? window.CurrencyManager.formatPrice(subtotal) : '$' + subtotal.toLocaleString('en-US', { minimumFractionDigits: 2 });
    if (cartRefs.total) cartRefs.total.textContent = window.CurrencyManager ? window.CurrencyManager.formatPrice(subtotal) : '$' + subtotal.toLocaleString('en-US', { minimumFractionDigits: 2 });
}

/**
 * Guarda el carrito en localStorage
 */
function guardarCarrito() {
    localStorage.setItem(getCartKey(), JSON.stringify(cart.items));
}

/**
 * Maneja el submit del checkout
 */
async function handleCheckoutSubmit(e) {
    e.preventDefault();

    if (cart.items.length === 0) {
        alert('Tu carrito está vacío.');
        return;
    }

    const formData = new FormData(e.target);
    const datosCliente = {
        nombres: formData.get('nombres'),
        apellidos: formData.get('apellidos'),
        email: formData.get('email'),
        documento: formData.get('documento'),
        telefono: formData.get('telefono') || '',
        direccion: formData.get('direccion')
    };

    cartRefs.btnCheckout.disabled = true;
    cartRefs.btnCheckout.innerHTML = '<span class="material-symbols-outlined animate-spin">progress_activity</span> Procesando...';

    try {
        // 1. Registrar cliente
        const cliente = await registrarCliente(datosCliente);
        const clienteId = cliente ? cliente.id_cliente : null;

        // 2. Crear la venta
        const subtotal = cart.items.reduce((acc, i) => acc + (i.precio * i.cantidad), 0);
        const venta = await registrarVenta({
            id_cliente: clienteId,
            total: subtotal,
            estado: 'pendiente'
        });

        // 3. Registrar detalles y reducir stock
        if (venta && venta.id_venta) {
            const detalles = cart.items.map(item => ({
                id_venta: venta.id_venta,
                id_producto: item.id_producto,
                cantidad: item.cantidad,
                precio_unitario: item.precio,
                subtotal: item.precio * item.cantidad,
                talla: item.talla || 'N/A'
            }));
            await registrarDetallesVenta(detalles);

            // Deducción transaccional de bodega (stock negativo = resta)
            for (const item of cart.items) {
                try {
                    await actualizarStock(item.id_producto, -item.cantidad);
                } catch (stockErr) {
                    console.error(`Inconsistencia descontando stock del producto ${item.id_producto}:`, stockErr);
                    // Decidimos no truncar el checkout en caso de error para no frustrar la venta,
                    // pero dejamos el log para el administrador.
                }
            }
        }

        // 4. Éxito
        cart.items = [];
        guardarCarrito();
        cartRefs.form.classList.add('hidden');
        cartRefs.checkoutSuccess.classList.remove('hidden');
        renderizarItems();
        calcularTotales();

        // Disparar el Modal Animado Temático en vez de Alert
        const modalExito = document.getElementById('modalExitoCompra');
        if (modalExito) {
            const modalContenedor = document.getElementById('modalExitoContenedor');
            const avatarImg = document.getElementById('modalAvatarImg');
            const modalTitulo = document.getElementById('modalExitoTitulo');
            const avatarGlow = document.getElementById('modalAvatarGlow');
            const btnAceptar = document.getElementById('btnAceptarExito');

            const isDark = document.documentElement.classList.contains('dark');
            const avatarCanvas = document.getElementById('modalAvatarCanvas');
            const modalMensaje = document.getElementById('modalExitoMensaje');

            if (isDark) {
                // Tema Noche
                avatarImg.src = '';
                avatarImg.style.display = 'none';
                modalTitulo.textContent = '¡COMPRA EXITOSA!';
                modalTitulo.className = 'text-3xl font-black text-white mb-2 relative z-10 tracking-tight';
                if (modalMensaje) modalMensaje.className = 'text-indigo-200 mb-8 relative z-10 text-sm px-2';
                avatarGlow.className = 'absolute inset-0 rounded-full animate-ping opacity-20 bg-[#4f46e5]';
                avatarImg.className = 'relative w-full h-full object-cover rounded-full border-[3px] border-[#4f46e5] shadow-[0_0_20px_rgba(79,70,229,0.9)] transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3';

                modalContenedor.className = 'bg-slate-900 border-2 border-indigo-900/50 rounded-3xl shadow-[0_0_50px_rgba(79,70,229,0.3)] w-full max-w-sm relative transform scale-95 opacity-0 transition-all duration-500 overflow-hidden flex flex-col items-center p-8 text-center';
                const resplandor = document.getElementById('modalExitoResplandor');
                if (resplandor) resplandor.className = 'absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-500/20 via-transparent to-transparent pointer-events-none z-0';
                if (btnAceptar) btnAceptar.className = 'relative z-10 bg-gradient-to-r from-indigo-600 to-blue-500 text-white font-bold text-lg py-3 px-10 rounded-full shadow-[0_0_20px_rgba(79,70,229,0.4)] hover:shadow-[0_0_30px_rgba(79,70,229,0.6)] hover:-translate-y-1 hover:scale-105 transition-all duration-300 w-full flex items-center justify-center gap-2';

                if (avatarCanvas && window.AvatarParticleEngine) {
                    if (window.modalAvatarEngine) window.modalAvatarEngine.stop();
                    // Multiplicador del 120% (mayor cantidad) para la ventana emergente
                    window.modalAvatarEngine = new window.AvatarParticleEngine(avatarCanvas, 'shadow', 1.2);
                }
            } else {
                // Tema Día
                avatarImg.src = '';
                avatarImg.style.display = 'none';
                modalTitulo.textContent = '¡PEDIDO CONFIRMADO!';
                modalTitulo.className = 'text-3xl font-black text-white mb-2 relative z-10 tracking-tight';
                if (modalMensaje) modalMensaje.className = 'text-red-100 mb-8 relative z-10 text-sm px-2 font-medium';
                avatarGlow.className = 'absolute inset-0 rounded-full animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite] opacity-40 bg-red-600';
                avatarImg.className = 'relative w-full h-full object-cover rounded-full border-[3px] border-[#ef4444] shadow-[0_0_20px_rgba(239,68,68,0.9)] transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3';

                // Colores ardientes del recuadro
                modalContenedor.className = 'bg-gradient-to-br from-orange-600 via-orange-500 to-red-600 border-2 border-orange-400 rounded-3xl shadow-[0_0_50px_rgba(249,115,22,0.6)] w-full max-w-sm relative transform scale-95 opacity-0 transition-all duration-500 overflow-hidden flex flex-col items-center p-8 text-center';
                const resplandor = document.getElementById('modalExitoResplandor');
                if (resplandor) resplandor.className = 'absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-orange-400/40 via-red-500/10 to-transparent pointer-events-none z-0';
                if (btnAceptar) btnAceptar.className = 'relative z-10 bg-white/20 backdrop-blur-md text-white border border-white/50 font-bold text-lg py-3 px-10 rounded-full shadow-[0_4px_15px_rgba(0,0,0,0.2)] hover:bg-white/30 hover:-translate-y-1 hover:scale-105 transition-all duration-300 w-full flex items-center justify-center gap-2';

                if (avatarCanvas && window.AvatarParticleEngine) {
                    if (window.modalAvatarEngine) window.modalAvatarEngine.stop();
                    // Multiplicador del 120% (mayor cantidad) para la ventana emergente
                    window.modalAvatarEngine = new window.AvatarParticleEngine(avatarCanvas, 'fire', 1.2);
                }
            }

            modalExito.showModal();
            // Animación de entrada scale-up
            setTimeout(() => {
                modalContenedor.classList.remove('scale-95', 'opacity-0');
                modalContenedor.classList.add('scale-100', 'opacity-100');
            }, 10);

            if (btnAceptar) {
                btnAceptar.onclick = () => {
                    // Animación de salida invertida
                    modalContenedor.classList.remove('scale-100', 'opacity-100');
                    modalContenedor.classList.add('scale-95', 'opacity-0');
                    setTimeout(() => {
                        modalExito.close();
                        if (window.modalAvatarEngine) {
                            window.modalAvatarEngine.stop();
                            window.modalAvatarEngine = null;
                        }
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                    }, 400);
                };
            }
        }

    } catch (error) {
        console.error('Error en checkout:', error);
        alert('Hubo un error al procesar tu pedido:\n' + error.message);
        cartRefs.btnCheckout.disabled = false;
        cartRefs.btnCheckout.innerHTML = '<span class="material-symbols-outlined">lock</span> Realizar Pedido';
    }
}


