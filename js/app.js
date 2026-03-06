/**
 * JS/App.js - LÃ³gica Principal (index.html)
 * Renderiza productos desde Supabase y maneja el carrito.
 */

document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

// FunciÃ³n auxiliar para obtener la key del carrito basada en el usuario actual
function getCartKey() {
    if (window.novaAuth && window.novaAuth.user && window.novaAuth.user.user) {
        return `WearStore_cart_${window.novaAuth.user.user.id}`;
    }
    return 'WearStore_cart_anon';
}

// Estado local de la aplicaciÃ³n
const state = {
    productos: [],
    carrito: []
};

// Referencias del DOM
const refs = {
    grid: document.getElementById('productGrid'),
    loader: document.getElementById('loader'),
    errorMsg: document.getElementById('errorMessage'),
    btnRetry: document.getElementById('retryBtn'),
    cartCounter: document.getElementById('cartCounter'),
    toast: document.getElementById('toast'),
    toastMsg: document.getElementById('toastMessage')
};

/**
 * Inicializa la aplicaciÃ³n
 */
async function initApp() {
    // Cargar el carrito segÃºn el usuario
    state.carrito = JSON.parse(localStorage.getItem(getCartKey())) || [];

    actualizarContadorCarrito();

    try {
        mostrarLoader(true);
        console.log('Cargando productos desde Supabase...');
        state.productos = await obtenerProductos();
        console.log('Productos recibidos:', state.productos.length);
        renderizarProductos(state.productos);
    } catch (error) {
        console.warn('Error en API, usando datos de prueba:', error.message);
        usarDatosDePrueba();
    } finally {
        mostrarLoader(false);
    }

    if (refs.btnRetry) {
        refs.btnRetry.addEventListener('click', initApp);
    }

    // Inicializar buscador en vivo
    initBuscador();
}

/**
 * Inicializa la lógica del buscador de la navbar principal en tiempo real
 */
function initBuscador() {
    const searchInput = document.getElementById('searchInput');
    const searchInputMobile = document.getElementById('searchInputMobile');

    const handleSearch = (e) => {
        // Normalizar quitando tildes y pasando a minúsculas
        const query = e.target.value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

        // Si no hay texto, pintamos todos los productos
        if (!query) {
            renderizarProductos(state.productos);
            return;
        }

        // Si hay texto, filtramos por título o descripción que coincidan (ignorando tildes)
        const productosFiltrados = state.productos.filter(p => {
            const nombre = p.nombre ? p.nombre.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase() : '';
            const desc = p.descripcion ? p.descripcion.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase() : '';
            return nombre.includes(query) || desc.includes(query);
        });

        renderizarProductos(productosFiltrados);
    };

    if (searchInput) searchInput.addEventListener('input', handleSearch);
    if (searchInputMobile) searchInputMobile.addEventListener('input', handleSearch);
}

/**
 * Renderiza el HTML dinÃ¡mico de cada producto en el DOM
 */
function renderizarProductos(productos) {
    if (!productos || productos.length === 0) {
        refs.grid.innerHTML = '<p class="text-center text-slate-500 py-10" style="grid-column: 1/-1;">No se encontraron productos.</p>';
        return;
    }

    console.log('Pintando', productos.length, 'tarjetas de producto...');

    refs.grid.innerHTML = productos.map(p => {
        const price = Number(p.precio) || 0;
        const formattedPrice = window.CurrencyManager ? window.CurrencyManager.formatPrice(price) : '$' + price.toLocaleString('en-US', { minimumFractionDigits: 2 });
        const stockQty = Number(p.stock) || 0;
        const isLowStock = stockQty > 0 && stockQty <= 5;
        const outOfStock = stockQty <= 0;
        const disabledClass = outOfStock ? 'opacity-50 cursor-not-allowed' : 'hover:brightness-110';

        let stockBadge = '';
        if (outOfStock) {
            stockBadge = '<span class="absolute top-3 left-3 bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded uppercase">Agotado</span>';
        } else if (isLowStock) {
            stockBadge = '<span class="absolute top-3 left-3 bg-orange-500 text-white text-[10px] font-bold px-2 py-1 rounded uppercase">Solo ' + stockQty + ' disponibles</span>';
        } else if (price > 100) {
            stockBadge = '<span class="absolute top-3 left-3 bg-green-600 text-white text-[10px] font-bold px-2 py-1 rounded uppercase">Envío Gratis</span>';
        }

        // Imagen: usa la de la BD, o un fallback de Unsplash
        const fallbackImages = [
            'https://images.unsplash.com/photo-1542281286-9e0a16bb7366?auto=format&fit=crop&q=80&w=400',
            'https://images.unsplash.com/photo-1526406915894-7bcd65f60845?auto=format&fit=crop&q=80&w=400',
            'https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&q=80&w=400',
            'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&q=80&w=400',
            'https://images.unsplash.com/photo-1510519138101-570d1dcb3d8e?auto=format&fit=crop&q=80&w=400'
        ];
        const randomFallback = fallbackImages[Math.floor(Math.random() * fallbackImages.length)];
        const imagenUrl = p.imagen_url || randomFallback;

        return '<div data-holo class="holo-card relative bg-white dark:bg-[#0c1222] border border-slate-200/80 dark:border-slate-700/60 rounded-2xl overflow-hidden group flex flex-col transition-colors duration-300">'
            + '<a href="producto.html?id=' + p.id_producto + '" class="relative aspect-square overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 block">'
            + '<img alt="' + p.nombre + '" src="' + imagenUrl + '" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" loading="lazy" />'
            + stockBadge
            + '</a>'
            + '<div class="p-3 md:p-4 flex flex-col flex-1">'
            + '<a href="producto.html?id=' + p.id_producto + '" class="text-slate-800 dark:text-slate-100 font-semibold text-xs md:text-sm mb-1 line-clamp-2 hover:text-cyan-500 dark:hover:text-cyan-400 transition-colors leading-snug" title="' + p.nombre + '">' + p.nombre + '</a>'
            + '<div class="flex items-center gap-0.5 mb-2">'
            + '<span class="material-symbols-outlined text-amber-400 text-xs md:text-sm" style="font-variation-settings: \'FILL\' 1;">star</span>'
            + '<span class="material-symbols-outlined text-amber-400 text-xs md:text-sm" style="font-variation-settings: \'FILL\' 1;">star</span>'
            + '<span class="material-symbols-outlined text-amber-400 text-xs md:text-sm" style="font-variation-settings: \'FILL\' 1;">star</span>'
            + '<span class="material-symbols-outlined text-amber-400 text-xs md:text-sm" style="font-variation-settings: \'FILL\' 1;">star</span>'
            + '<span class="material-symbols-outlined text-slate-300 dark:text-slate-600 text-xs md:text-sm">star</span>'
            + '<span class="text-[10px] text-slate-400 dark:text-slate-500 ml-1">(' + (Math.floor(Math.random() * 500) + 15) + ')</span>'
            + '</div>'
            + '<div class="mt-auto">'
            + '<div class="flex items-baseline gap-2 mb-3">'
            + '<span class="text-xl md:text-2xl font-mecha font-bold text-slate-900 dark:text-white tracking-wide">' + formattedPrice + '</span>'
            + '</div>'
            + '<button class="w-full bg-gradient-to-r from-amber-400 to-orange-600 dark:from-cyan-600 dark:to-blue-700 text-white font-bold py-2 md:py-2.5 rounded-xl transition-all flex items-center justify-center gap-1 md:gap-2 text-xs md:text-sm shadow-[0_4px_15px_rgba(255,153,0,0.3)] dark:shadow-[0_4px_15px_rgba(0,183,255,0.25)] hover:shadow-[0_6px_25px_rgba(255,153,0,0.5)] dark:hover:shadow-[0_6px_25px_rgba(0,183,255,0.4)] hover:-translate-y-0.5 ' + disabledClass + '" onclick="agregarAlCarrito(' + p.id_producto + ')" ' + (outOfStock ? 'disabled' : '') + '>'
            + '<span class="material-symbols-outlined text-base md:text-xl">shopping_cart</span>'
            + (outOfStock ? 'Agotado' : 'Agregar')
            + '</button>'
            + '</div>'
            + '</div>'
            + '</div>';
    }).join('');

    // Activar efecto holográfico en las nuevas tarjetas
    if (typeof initHoloCards === 'function') {
        initHoloCards();
    }

    console.log('Tarjetas pintadas exitosamente.');
}

/**
 * Agrega un producto al carrito (Local Storage)
 */
function agregarAlCarrito(idProducto) {
    const producto = state.productos.find(p => p.id_producto === idProducto);
    if (!producto) return;

    const itemCarrito = state.carrito.find(item => item.id_producto === idProducto);

    if (itemCarrito) {
        if (itemCarrito.cantidad < producto.stock) {
            itemCarrito.cantidad += 1;
        } else {
            console.warn('LÃ­mite de stock alcanzado para este producto.');
            return;
        }
    } else {
        state.carrito.push({
            id_producto: producto.id_producto,
            nombre: producto.nombre,
            precio: Number(producto.precio),
            imagen_url: producto.imagen_url,
            cantidad: 1,
            stock: producto.stock
        });
    }

    localStorage.setItem(getCartKey(), JSON.stringify(state.carrito));
    actualizarContadorCarrito();
    mostrarToast('¡Agregado al Carrito!');
}

/**
 * Actualiza el contador visual del carrito en la barra
 */
function actualizarContadorCarrito() {
    if (!refs.cartCounter) return;
    const totalItems = state.carrito.reduce((acc, item) => acc + item.cantidad, 0);
    refs.cartCounter.textContent = totalItems > 99 ? '+99' : totalItems;
}

/**
 * Muestra una notificaciÃ³n temporal
 */
function mostrarToast(msg) {
    if (!refs.toast) return;
    if (refs.toastMsg && msg) refs.toastMsg.textContent = msg;
    refs.toast.classList.add('show');
    setTimeout(() => { refs.toast.classList.remove('show'); }, 3000);
}

// ----------------------------------------------------
// Utilidades de UI
// ----------------------------------------------------
function mostrarLoader(isVisible) {
    if (refs.loader) refs.loader.style.display = isVisible ? 'flex' : 'none';
    if (refs.errorMsg) refs.errorMsg.classList.add('hidden');
}

function usarDatosDePrueba() {
    const mockData = [
        { id_producto: 1, nombre: 'AudÃ­fonos Premium InalÃ¡mbricos', precio: 299.00, stock: 15, imagen_url: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&q=80&w=400' },
        { id_producto: 2, nombre: 'Reloj Minimalista de Cuero 42mm', precio: 150.00, stock: 5, imagen_url: 'https://images.unsplash.com/photo-1524592094714-0f0654e20314?auto=format&fit=crop&q=80&w=400' },
        { id_producto: 3, nombre: 'Tenis Deportivos Aero-Run', precio: 89.00, stock: 40, imagen_url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=400' },
        { id_producto: 4, nombre: 'Parlante Inteligente NovaLink', precio: 45.00, stock: 0, imagen_url: 'https://images.unsplash.com/photo-1589492477829-5e65395b66cc?auto=format&fit=crop&q=80&w=400' }
    ];
    state.productos = mockData;
    renderizarProductos(mockData);
}



