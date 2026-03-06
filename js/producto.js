/**
 * JS/Producto.js - LÃ³gica de Detalles de Producto individual
 */

document.addEventListener('DOMContentLoaded', () => {
    initProducto();
});

// Referencias del DOM y variables
const productoRefs = {
    loader: document.getElementById('loader'),
    errorMessage: document.getElementById('errorMessage'),
    container: document.getElementById('productContainer'),
    cartCounter: document.getElementById('cartCounter'),
    toast: document.getElementById('toast'),
    toastMsg: document.getElementById('toastMessage')
};

let currentProduct = null;
let carritoLocal = [];

function getCartKey() {
    if (window.novaAuth && window.novaAuth.user && window.novaAuth.user.user) {
        return `WearStore_cart_${window.novaAuth.user.user.id}`;
    }
    return 'WearStore_cart_anon';
}

async function initProducto() {
    // 1. Cargar carrito y actualizar contador visual
    carritoLocal = JSON.parse(localStorage.getItem(getCartKey())) || [];
    actualizarContadorCarrito();

    // 2. Extraer el ID de la URL (ej: producto.html?id=5)
    const urlParams = new URLSearchParams(window.location.search);
    const idProducto = urlParams.get('id');

    if (!idProducto) {
        mostrarError("Error Técnico: No se detectó un ID de producto válido en el enlace de la URL.");
        return;
    }

    // 3. Obtener el producto de la DB
    try {
        currentProduct = await obtenerProductoPorId(idProducto);
        if (!currentProduct) {
            mostrarError(`Error Técnico: Supabase devolvió vacío (Null) para el Producto ID #${idProducto}`);
            return;
        }

        // 4. Renderizar la UI si todo estÃ¡ bien
        renderizarDetalles(currentProduct);

    } catch (error) {
        console.error("Error al cargar producto:", error);
        mostrarError(`Excepción de Red/CORS consultando ID #${idProducto}: ${error.message}`);
    }
}

function renderizarDetalles(p) {
    productoRefs.loader.style.display = 'none';
    productoRefs.errorMessage.classList.add('hidden');
    productoRefs.container.classList.remove('hidden');

    // Cambiar dinÃ¡micamente el tÃ­tulo de la pestaÃ±a HTML
    document.title = `${p.nombre} | WearStore`;

    const price = Number(p.precio) || 0;
    const formattedPrice = window.CurrencyManager ? window.CurrencyManager.formatPrice(price) : '$' + price.toLocaleString('en-US', { minimumFractionDigits: 2 });
    const stockQty = Number(p.stock) || 0;
    const outOfStock = stockQty <= 0;
    const isLowStock = stockQty > 0 && stockQty <= 5;
    let btnClass = outOfStock ? 'bg-slate-300 text-slate-500 cursor-not-allowed' : 'bg-gradient-to-r from-amber-400 to-orange-600 dark:from-cyan-500 dark:to-blue-600 text-white hover:brightness-110 shadow-orange-500/30 dark:shadow-cyan-500/30';
    let btnText = outOfStock ? 'No Disponible' : 'Añadir al Carrito';

    let stockBadge = '';
    if (outOfStock) {
        stockBadge = '<span class="inline-block bg-red-100 text-red-700 font-bold px-3 py-1 rounded-full text-xs uppercase mb-4">Agotado Temporalmente</span>';
    } else if (isLowStock) {
        stockBadge = `<span class="inline-block bg-orange-100 text-orange-700 font-bold px-3 py-1 rounded-full text-xs uppercase mb-4">Solo quedan ${stockQty} unidades</span>`;
    } else {
        stockBadge = '<span class="inline-block bg-green-100 text-green-700 font-bold px-3 py-1 rounded-full text-xs uppercase mb-4">En Stock: Envío Inmediato</span>';
    }

    // Agregar indicador exclusivo de Stock para el Admin, por encima del badge normal de usuario
    if (window.novaAuth && window.novaAuth.isAdmin()) {
        stockBadge = `<span class="inline-block bg-slate-900 border border-cyan-500 shadow-[0_0_10px_rgba(0,183,255,0.2)] text-cyan-400 font-bold px-3 py-1 rounded-full text-[10px] tracking-widest uppercase mb-4 mr-2"><span class="material-symbols-outlined text-[12px] mr-1 align-middle">inventory_2</span>Stock Físico (BBDD): ${stockQty} unds</span>` + stockBadge;
    }

    const fallbackImage = 'https://images.unsplash.com/photo-1542281286-9e0a16bb7366?auto=format&fit=crop&q=80&w=800';
    const imagenUrl = p.imagen_url || fallbackImage;
    const description = p.descripcion ? p.descripcion : 'Un producto premium y destacado dentro de la familia WearStore. Construido con materiales de excelente calidad para brindar el mejor rendimiento en tu día a día.';

    let adminPanelHtml = '';
    if (window.novaAuth && window.novaAuth.isAdmin()) {
        adminPanelHtml = `
            <div class="mt-8 p-6 bg-slate-900 border-2 border-cyan-500 rounded-xl shadow-[0_0_20px_rgba(0,183,255,0.1)] col-span-1 md:col-span-2">
                <h3 class="text-xl font-bold text-white flex items-center gap-2 mb-6">
                    <span class="material-symbols-outlined text-cyan-400">admin_panel_settings</span> Editor en Vivo
                </h3>
                <div class="flex flex-col gap-4">
                    <div>
                        <label class="text-xs text-slate-400 font-bold uppercase track">Nombre del Producto</label>
                        <input type="text" id="editNombre" class="w-full bg-slate-800 text-white rounded-lg p-3 border border-slate-700 outline-none focus:border-cyan-500 mt-1" value="${p.nombre}">
                    </div>
                    <div>
                         <label class="text-xs text-slate-400 font-bold uppercase track">Descripción</label>   
                         <textarea id="editDesc" class="w-full bg-slate-800 text-white rounded-lg p-3 border border-slate-700 outline-none focus:border-cyan-500 mt-1" rows="4">${description}</textarea>
                    </div>
                    <div class="flex gap-4">
                        <div class="flex-1">
                            <label class="text-xs text-slate-400 font-bold uppercase track">Precio Base (USD)</label>
                            <input type="number" id="editPrecio" class="w-full bg-slate-800 text-white rounded-lg p-3 border border-slate-700 outline-none focus:border-cyan-500 mt-1" value="${p.precio}">
                        </div>
                        <div class="flex-1">
                            <label class="text-xs text-slate-400 font-bold uppercase track">Unidades Stock</label>
                            <input type="number" id="editStock" class="w-full bg-slate-800 text-white rounded-lg p-3 border border-slate-700 outline-none focus:border-cyan-500 mt-1" value="${p.stock}">
                        </div>
                    </div>
                    <div>
                        <label class="text-xs text-slate-400 font-bold uppercase track">Reemplazar Imagen (Opcional)</label>
                        <input type="file" id="editImagen" class="w-full text-slate-300 rounded-lg p-2 border border-slate-700 mt-1 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-brand-blue hover:file:bg-cyan-400 cursor-pointer" accept="image/*">
                    </div>
                    <div class="flex flex-col md:flex-row gap-4 mt-4">
                        <button onclick="guardarEdicion(${p.id_producto})" class="flex-1 bg-cyan-500 hover:bg-cyan-400 text-black font-bold py-3 rounded-lg transition-colors flex justify-center items-center gap-2 shadow-lg">
                            <span class="material-symbols-outlined font-bold">save</span> Guardar Cambios
                        </button>
                        <button onclick="borrarProductoActual(${p.id_producto})" class="flex-1 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500 font-bold py-3 rounded-lg transition-colors flex justify-center items-center gap-2 shadow-lg group">
                            <span class="material-symbols-outlined font-bold group-hover:animate-bounce">delete</span> Eliminar Ítem
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    productoRefs.container.innerHTML = `
        <div class="grid grid-cols-1 md:grid-cols-2 gap-10">
            <!-- Galería (A la izquierda) -->
            <div class="flex flex-col gap-4">
                <div class="relative bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden aspect-square flex items-center justify-center p-4 transition-colors duration-300">
                    <img src="${imagenUrl}" alt="${p.nombre}" class="max-w-full max-h-full object-contain drop-shadow-md hover:scale-105 transition-transform duration-500" />
                </div>
                <!-- Thumbnails de ejemplo -->
                <div class="grid grid-cols-4 gap-2">
                    <div class="aspect-square bg-slate-50 dark:bg-slate-800/50 rounded-lg border-2 border-primary overflow-hidden p-1 cursor-pointer transition-colors duration-300">
                        <img src="${imagenUrl}" class="w-full h-full object-contain" />
                    </div>
                </div>
            </div>

            <!-- Info Principal (A la derecha) -->
            <div class="flex flex-col">
                ${stockBadge}
                <h1 class="text-3xl md:text-4xl font-mecha font-bold text-slate-900 dark:text-white mb-2 leading-tight transition-colors duration-300 uppercase tracking-wide">${p.nombre}</h1>
                
                <div class="flex items-center gap-2 mb-6">
                    <div class="flex text-primary">
                        <span class="material-symbols-outlined text-lg fill-1">star</span>
                        <span class="material-symbols-outlined text-lg fill-1">star</span>
                        <span class="material-symbols-outlined text-lg fill-1">star</span>
                        <span class="material-symbols-outlined text-lg fill-1">star</span>
                        <span class="material-symbols-outlined text-lg fill-1">star_half</span>
                    </div>
                    <span class="text-sm text-slate-500 font-medium line-underline hover:underline cursor-pointer">Ver 120 reseñas</span>
                </div>

                <div class="mb-8">
                    <p class="text-4xl font-mecha font-bold text-slate-900 dark:text-white transition-colors duration-300 tracking-wide">${formattedPrice}</p>
                    <p class="text-sm text-slate-500 dark:text-slate-400 mt-1 transition-colors duration-300">Garantía de Devolución de 30 Días | Pagos Seguros</p>
                </div>

                <div class="mb-8 border-t border-b border-slate-100 dark:border-slate-800 py-6 transition-colors duration-300">
                    <h3 class="font-bold text-slate-900 dark:text-white mb-2 transition-colors duration-300">Acerca de este artículo</h3>
                    <p class="text-slate-600 dark:text-slate-400 leading-relaxed text-sm transition-colors duration-300">${description}</p>
                </div>

                <!-- Botón de Compra -->
                <div class="flex flex-col gap-3 mt-auto">
                    <button 
                        id="btnAgregar"
                        class="w-full py-4 rounded-xl font-black text-lg shadow-lg flex items-center justify-center gap-2 transition-all ${btnClass}" 
                        ${outOfStock ? 'disabled' : ''}
                        onclick="agregarAlCarritoLocal(${p.id_producto})"
                    >
                        <span class="material-symbols-outlined">shopping_cart</span>
                        ${btnText}
                    </button>
                    <div class="flex items-center gap-4 text-xs text-slate-500 justify-center mt-2 font-medium">
                        <div class="flex items-center gap-1"><span class="material-symbols-outlined text-[1rem]">verified</span> Compra Segura WearStore</div>
                        <div class="flex items-center gap-1"><span class="material-symbols-outlined text-[1rem]">local_shipping</span> Envío Gratis a nivel nacional</div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Renderizado Condicional del Editor de Admin -->
        ${adminPanelHtml}
    `;
}

function mostrarError(mensajeDebug = "El producto que buscas no existe o ha sido retirado.") {
    productoRefs.loader.style.display = 'none';
    productoRefs.container.classList.add('hidden');
    productoRefs.errorMessage.classList.remove('hidden');

    // Inyectar el log de error en la etiqueta <p> para alertar al cliente del por qué
    const textError = productoRefs.errorMessage.querySelector('p');
    if (textError) textError.textContent = mensajeDebug;
}

/**
 * Agrega el producto al carrito de compras desde esta vista.
 */
function agregarAlCarritoLocal(idProducto) {
    if (!currentProduct || currentProduct.stock <= 0) return;

    const itemCarrito = carritoLocal.find(item => item.id_producto === idProducto);

    if (itemCarrito) {
        if (itemCarrito.cantidad < currentProduct.stock) {
            itemCarrito.cantidad += 1;
        } else {
            alert('Has alcanzado el límite máximo de stock para este producto.');
            return;
        }
    } else {
        carritoLocal.push({
            id_producto: currentProduct.id_producto,
            nombre: currentProduct.nombre,
            precio: Number(currentProduct.precio),
            imagen_url: currentProduct.imagen_url,
            cantidad: 1,
            stock: currentProduct.stock
        });
    }

    localStorage.setItem(getCartKey(), JSON.stringify(carritoLocal));
    actualizarContadorCarrito();
    mostrarToast('¡Listo! Agregado a tu carrito.');
}

function actualizarContadorCarrito() {
    if (!productoRefs.cartCounter) return;
    const totalItems = carritoLocal.reduce((acc, item) => acc + item.cantidad, 0);
    productoRefs.cartCounter.textContent = totalItems > 99 ? '+99' : totalItems;
}

function mostrarToast(msg) {
    if (!productoRefs.toast) return;
    if (productoRefs.toastMsg && msg) productoRefs.toastMsg.textContent = msg;
    productoRefs.toast.classList.add('show');
    setTimeout(() => { productoRefs.toast.classList.remove('show'); }, 3000);
}

// --- CONTROLES DE ADMINISTRADOR --- //

async function guardarEdicion(id_producto) {
    if (!window.novaAuth || !window.novaAuth.isAdmin()) {
        alert("Acceso denegado: Se requiere estatus de Administrador.");
        return;
    }

    const btn = document.querySelector(`button[onclick="guardarEdicion(${id_producto})"]`);
    const originalText = btn.innerHTML;
    btn.innerHTML = '<span class="material-symbols-outlined animate-spin">sync</span> Subiendo...';
    btn.disabled = true;
    btn.classList.add('opacity-70', 'cursor-not-allowed');

    try {
        const nombre = document.getElementById('editNombre').value;
        const descripcion = document.getElementById('editDesc').value;
        const precio = Number(document.getElementById('editPrecio').value);
        const stock = Number(document.getElementById('editStock').value);
        const fileInput = document.getElementById('editImagen');

        const updates = { nombre, descripcion, precio, stock };

        // Si se seleccionó una imagen nueva, usar el API endpoint para subir a Bucket storage
        if (fileInput.files.length > 0) {
            btn.innerHTML = '<span class="material-symbols-outlined animate-spin">cloud_upload</span> Cifrando Foto...';
            const imgUrl = await subirFotoProducto(fileInput.files[0]);
            updates.imagen_url = imgUrl; // Agregando la URL a los updates
        }

        await actualizarProducto(id_producto, updates);

        window.location.reload(); // Recargar para ver los cambios nativamente
    } catch (e) {
        alert('Hubo un error modificando el producto: ' + e.message);
        btn.innerHTML = originalText;
        btn.disabled = false;
        btn.classList.remove('opacity-70', 'cursor-not-allowed');
    }
}

async function borrarProductoActual(id_producto) {
    if (!window.novaAuth || !window.novaAuth.isAdmin()) return;

    const confirmado = await pixelConfirm('¿Estás totalmente seguro de RETIRAR este producto de WearStore? Esta acción es instantánea y no puede deshacerse.', { titulo: '🛑 Eliminar Producto', btnConfirm: 'Sí, Eliminar', tipo: 'danger' });
    if (!confirmado) return;

    const btn = document.querySelector(`button[onclick="borrarProductoActual(${id_producto})"]`);
    btn.innerHTML = '<span class="material-symbols-outlined animate-spin">delete</span> Destruyendo...';
    btn.disabled = true;

    try {
        await eliminarProducto(id_producto);
        alert('El producto ha sido eliminado de la base de datos satisfactoriamente.');
        window.location.href = 'index.html'; // Devolver a vitrina
    } catch (e) {
        alert('Error intentando purgar de DB: ' + e.message);
        btn.disabled = false;
        btn.innerHTML = '<span class="material-symbols-outlined font-bold group-hover:animate-bounce">delete</span> Eliminar Ítem';
    }
}


