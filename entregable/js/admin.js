/**
 * JS/Admin.js - Lógica del Panel de Administración
 * Permite a los administradores subir nuevos productos con imágenes.
 */

document.addEventListener('DOMContentLoaded', () => {
    initAdminPanel();
});

function initAdminPanel() {
    // 1. Verificar Seguridad: Esperar por maximo 1000ms a que auth.js inyecte novaAuth
    let checkInterval = setInterval(() => {
        if (window.novaAuth !== undefined && !window.novaAuth._refreshing) {
            clearInterval(checkInterval);
            if (!window.novaAuth.isAdmin()) {
                document.body.innerHTML = `
                    <div class="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-900 text-center transition-colors">
                        <div class="bg-white dark:bg-slate-800 p-8 rounded-xl shadow-lg border border-red-200 dark:border-red-900 mx-4">
                            <span class="material-symbols-outlined text-6xl text-red-500 mb-4 block">gpp_maybe</span>
                            <h1 class="text-2xl font-black text-slate-800 dark:text-white mb-2">Acceso Denegado</h1>
                            <p class="text-slate-500 dark:text-slate-400 mb-6">Esta área es exclusiva para cuentas de Administrador.</p>
                            <a href="index.html" class="bg-primary text-brand-blue font-bold px-6 py-2 rounded-lg hover:brightness-110 transition-all text-sm">Volver a la Tienda</a>
                        </div>
                    </div>
                `;
            } else {
                // Es Admin: Continuar cargando la UI
                bindAdminEvents();
            }
        }
    }, 50);

    function bindAdminEvents() {
        // --- 1. Inicialización Estado de Pedidos ---
        let ventasGlobales = [];
        let filtroActual = 'pendiente'; // 'pendiente', 'entregado', o 'cancelado'
        cargarYRenderizarVentas();

        // Referencias Formulario Productos
        const form = document.getElementById('adminProductForm');
        const inputImagen = document.getElementById('prodImagen');
        const fileNameDisplay = document.getElementById('fileNameDisplay');
        const btnSubmit = document.getElementById('btnSubmitProducto');
        const errorMsgDiv = document.getElementById('adminErrorMsg');
        const errorTextSpan = document.getElementById('adminErrorText');

        // 2. Mostrar nombre del archivo al seleccionarlo visualmente
        if (inputImagen) inputImagen.addEventListener('change', (e) => {
            if (e.target.files && e.target.files.length > 0) {
                fileNameDisplay.textContent = e.target.files[0].name;
                fileNameDisplay.classList.add('text-primary');
            } else {
                fileNameDisplay.textContent = '';
            }
        });

        // 3. Manejar envío del formulario
        if (form) form.addEventListener('submit', async (e) => {
            e.preventDefault();
            errorMsgDiv.classList.add('hidden');

            const file = inputImagen.files[0];
            if (!file) {
                mostrarError('Por favor selecciona una imagen para el producto.');
                return;
            }

            // Bloquear UI
            const originalBtnText = btnSubmit.innerHTML;
            btnSubmit.disabled = true;
            btnSubmit.innerHTML = '<span class="spinner"></span> Subiendo y Guardando...';

            try {
                // A. Subir imagen a Supabase Storage
                const urlImagenReales = await subirFotoProducto(file);

                // Generar un código aleatorio para el producto
                const randomCode = 'PROD-' + Math.random().toString(36).substring(2, 8).toUpperCase();

                // B. Crear objeto Producto para BD
                const nuevoProducto = {
                    nombre: document.getElementById('prodNombre').value.trim(),
                    precio: parseFloat(document.getElementById('prodPrecio').value),
                    stock: parseInt(document.getElementById('prodStock').value),
                    descripcion: document.getElementById('prodDesc').value.trim(),
                    imagen_url: urlImagenReales,
                    estado: true, // Activo por defecto
                    id_tipo_producto: 1, // 1 = General/Otros (Ajustar si hay selector de categorías)
                    codigo: randomCode
                };

                // C. Insertar en tabla "producto"
                const productoInsertado = await crearProducto(nuevoProducto);

                // Éxito: Limpiar formulario y mostrar toast
                form.reset();
                fileNameDisplay.textContent = '';
                mostrarToast('¡Producto "' + productoInsertado.nombre + '" agregado con éxito!');

            } catch (error) {
                mostrarError(error.message || 'Ocurrió un error inesperado al publicar el producto.');
            } finally {
                // Desbloquear UI
                btnSubmit.disabled = false;
                btnSubmit.innerHTML = originalBtnText;
            }
        });

        function mostrarError(mensaje) {
            errorTextSpan.textContent = mensaje;
            errorMsgDiv.classList.remove('hidden');
        }

        function mostrarToast(msg) {
            const toast = document.getElementById('toast');
            const toastMsg = document.getElementById('toastMessage');
            toastMsg.textContent = msg;
            toast.classList.add('show');
            setTimeout(() => toast.classList.remove('show'), 4000);
        }

        // --- Lógica de Gestión de Pedidos ---

        async function cargarYRenderizarVentas() {
            try {
                ventasGlobales = await obtenerVentas();
                renderizarTablaPedidos();
                actualizarContadorPendientes();
            } catch (error) {
                console.error("Error al cargar ventas en Admin:", error);
                document.getElementById('tablaPedidosBody').innerHTML = `
                    <tr>
                        <td colspan="5" class="p-8 text-center text-red-500 font-bold">
                            <div>Error cargando órdenes.</div>
                            <div class="text-xs text-slate-500 mt-2 font-normal">${error.message || error}</div>
                        </td>
                    </tr>
                `;
            }
        }

        function actualizarContadorPendientes() {
            const pendientes = ventasGlobales.filter(v => typeof v.estado === 'string' && v.estado.toLowerCase() !== 'entregado' && v.estado.toLowerCase() !== 'cancelado');
            const cancelados = ventasGlobales.filter(v => typeof v.estado === 'string' && v.estado.toLowerCase() === 'cancelado');
            const badge = document.getElementById('badgePendientes');
            if (badge) {
                badge.textContent = pendientes.length;
                if (pendientes.length === 0) {
                    badge.classList.remove('bg-red-500', 'dark:bg-red-600');
                    badge.classList.add('bg-slate-300', 'dark:bg-slate-600');
                } else {
                    badge.classList.remove('bg-slate-300', 'dark:bg-slate-600');
                    badge.classList.add('bg-red-500', 'dark:bg-red-600');
                }
            }
            // Actualizar badge de cancelados
            const badgeCancelados = document.getElementById('badgeCancelados');
            if (badgeCancelados) {
                badgeCancelados.textContent = cancelados.length;
                if (cancelados.length === 0) {
                    badgeCancelados.classList.add('hidden');
                } else {
                    badgeCancelados.classList.remove('hidden');
                }
            }
        }

        function renderizarTablaPedidos() {
            const tbody = document.getElementById('tablaPedidosBody');
            if (!tbody) return;

            // Filtrar y ordenar
            const ventasFiltradas = ventasGlobales.filter(v => {
                if (!v.estado) return false;
                const estadoLower = v.estado.toLowerCase();
                if (filtroActual === 'pendiente') {
                    return estadoLower !== 'entregado' && estadoLower !== 'cancelado';
                } else if (filtroActual === 'cancelado') {
                    return estadoLower === 'cancelado';
                } else {
                    return estadoLower === 'entregado';
                }
            });

            if (ventasFiltradas.length === 0) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="5" class="p-12 text-center text-slate-500 dark:text-slate-400">
                            <span class="material-symbols-outlined text-5xl opacity-50 mb-4 block">inbox</span>
                            No hay órdenes ${filtroActual}s en este momento.
                        </td>
                    </tr>
                `;
                return;
            }

            let htmlString = '';
            ventasFiltradas.forEach(venta => {
                const cliente = venta.cliente || {};

                // Parseo corregido de 'fecha', asegurando existencia y validación.
                let fecha = 'Fecha Inválida';
                if (venta.fecha) {
                    const parsedDate = new Date(venta.fecha);
                    if (!isNaN(parsedDate)) {
                        fecha = parsedDate.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'America/Bogota' });
                    }
                }

                const totalDisplay = window.CurrencyManager ? window.CurrencyManager.formatPrice(venta.total) : '$' + venta.total.toLocaleString();

                htmlString += `
                    <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                        <td class="p-4 border-b border-slate-100 dark:border-slate-700/50 align-top">
                            <button onclick="window.abrirDetallePedido(${venta.id_venta})" class="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-600 hover:text-white transition-all px-3 py-1.5 rounded-lg font-bold text-xs shadow-sm border border-indigo-200 dark:border-indigo-800 flex items-center justify-center gap-1.5 w-full whitespace-nowrap mb-2 shadow-[0_2px_10px_rgba(99,102,241,0.1)]">
                                <span class="material-symbols-outlined text-[16px]">visibility</span> Ver Recibo
                            </button>
                            <div class="text-[11px] text-center text-slate-400 dark:text-slate-500 font-medium">
                                #${venta.id_venta} • ${fecha}
                            </div>
                        </td>
                        <td class="p-4 border-b border-slate-100 dark:border-slate-700/50 align-top font-medium text-slate-700 dark:text-slate-300">
                            ${cliente.nombres || 'Cliente'} ${cliente.apellidos || ''}
                            <div class="text-xs text-slate-400 font-normal mt-1 flex items-center gap-1">
                                <span class="material-symbols-outlined text-[14px]">badge</span> 
                                ${cliente.documento || 'N/A'}
                            </div>
                        </td>
                        <td class="p-4 border-b border-slate-100 dark:border-slate-700/50 align-top">
                            <div class="text-sm text-slate-600 dark:text-slate-300 flex flex-col gap-1">
                                <span class="flex items-center gap-1"><span class="material-symbols-outlined text-[14px] text-slate-400">mail</span> <a href="mailto:${cliente.email}" class="hover:text-primary transition-colors">${cliente.email || 'N/A'}</a></span>
                                <span class="flex items-center gap-1"><span class="material-symbols-outlined text-[14px] text-slate-400">phone</span> <a href="tel:${cliente.telefono}" class="hover:text-primary transition-colors">${cliente.telefono || 'N/A'}</a></span>
                                <span class="flex items-start gap-1 text-xs mt-1 text-slate-500 dark:text-slate-400"><span class="material-symbols-outlined text-[14px] mt-0.5 opacity-70">location_on</span> <span class="line-clamp-2" title="${cliente.direccion || 'N/A'}">${cliente.direccion || 'N/A'}</span></span>
                            </div>
                        </td>
                        <td class="p-4 border-b border-slate-100 dark:border-slate-700/50 align-top">
                            <span class="font-bold text-lg text-slate-900 dark:text-white">
                                ${totalDisplay}
                            </span>
                        </td>
                        <td class="p-4 border-b border-slate-100 dark:border-slate-700/50 align-top text-center w-32" onclick="event.stopPropagation()">
                            ${(typeof venta.estado === 'string' && venta.estado.toLowerCase() === 'cancelado') ? `
                                <span class="inline-flex items-center gap-1 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/40 px-3 py-1.5 rounded-lg text-sm font-bold border border-red-200 dark:border-red-800">
                                    <span class="material-symbols-outlined text-lg">cancel</span> Cancelado
                                </span>
                            ` : (typeof venta.estado === 'string' && venta.estado.toLowerCase() !== 'entregado') ? `
                                <button onclick="window.cambiarEstadoOrden(${venta.id_venta}, 'entregado', this)" class="bg-cyan-50 dark:bg-cyan-900/40 text-cyan-600 dark:text-cyan-400 w-full hover:bg-cyan-500 hover:text-white transition-all px-3 py-2 rounded-lg font-bold text-sm shadow-sm border border-cyan-200 dark:border-cyan-800 flex items-center justify-center gap-1">
                                    <span class="material-symbols-outlined text-lg">local_shipping</span> Enviar
                                </button>
                            ` : `
                                <span class="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/40 px-3 py-1.5 rounded-lg text-sm font-bold border border-emerald-200 dark:border-emerald-800">
                                    <span class="material-symbols-outlined text-lg">done_all</span> Enviado
                                </span>
                            `}
                        </td>
                    </tr>
                `;
            });

            tbody.innerHTML = htmlString;
        }

        // Exponer la función globalmente para el botón in-line del HTML
        window.cambiarEstadoOrden = async (id_venta, nuevoEstado, btn) => {
            const confirmado = await pixelConfirm('¿Marcar este pedido como Enviado/Entregado?', { titulo: '📦 Enviar Pedido', btnConfirm: 'Sí, Enviar', tipo: 'info' });
            if (!confirmado) return;

            const originalHTML = btn.innerHTML;
            btn.innerHTML = '<span class="spinner" style="width: 16px; height: 16px; border-width: 2px;"></span>';
            btn.disabled = true;

            try {
                await actualizarEstadoVenta(id_venta, nuevoEstado);
                // Actualizar caché de memoria para no recargar todo de internet de nuevo
                const index = ventasGlobales.findIndex(v => v.id_venta === id_venta);
                if (index !== -1) {
                    ventasGlobales[index].estado = nuevoEstado;
                }

                renderizarTablaPedidos();
                actualizarContadorPendientes();
                mostrarToast(`¡Pedido #${id_venta} ha sido transferido al panel 'Enviados'!`);
            } catch (error) {
                console.error("Error cambiando estado:", error);
                alert("Hubo un error al intentar actualizar el estado: " + error.message);
                btn.innerHTML = originalHTML;
                btn.disabled = false;
            }
        };

        // --- Sistema de Modal de Detalles de Pedido ---

        const modalDetalle = document.getElementById('modalDetallePedido');
        const btnCerrarModal = document.getElementById('btnCerrarModal');

        if (btnCerrarModal) {
            btnCerrarModal.addEventListener('click', () => {
                modalDetalle.close();
            });
            // Cerrar al clickear fuera del contenedor blanco
            modalDetalle.addEventListener('click', (e) => {
                if (e.target === modalDetalle) {
                    modalDetalle.close();
                }
            });
        }

        window.abrirDetallePedido = async (id_venta) => {
            const elOrden = document.getElementById('modalOrderId');
            const elTotal = document.getElementById('modalTotalVenta');
            const container = document.getElementById('modalItemsContainer');

            // UI Base de carga
            elOrden.textContent = '#' + id_venta;
            elTotal.textContent = '...';
            container.innerHTML = `
                <div class="flex flex-col items-center justify-center p-8 gap-3 text-slate-500">
                    <span class="spinner" style="border-left-color: #ff9900;"></span>
                    <span>Recuperando recibo desde la bóveda...</span>
                </div>
            `;

            modalDetalle.showModal();

            try {
                // Sacar el total general de la factura del caché existente
                const ventaMadre = ventasGlobales.find(v => v.id_venta === id_venta);
                if (ventaMadre) {
                    elTotal.textContent = window.CurrencyManager ? window.CurrencyManager.formatPrice(ventaMadre.total) : '$' + ventaMadre.total.toLocaleString();
                }

                // Solicitar detalles a DB
                const detalles = await obtenerDetallesVenta(id_venta);

                // Generar header con info del cliente
                let headerInfo = '';
                const ventaMadreInfo = ventasGlobales.find(v => v.id_venta === id_venta);
                if (ventaMadreInfo && ventaMadreInfo.cliente) {
                    const c = ventaMadreInfo.cliente;
                    let fechaStr = 'N/A';
                    if (ventaMadreInfo.fecha) {
                        const d = new Date(ventaMadreInfo.fecha);
                        if (!isNaN(d)) fechaStr = d.toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'America/Bogota' });
                    }
                    headerInfo = `
                        <div class="mb-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700/50">
                            <div class="grid grid-cols-2 gap-3 text-sm">
                                <div>
                                    <span class="text-slate-400 text-xs uppercase tracking-wider">Cliente</span>
                                    <p class="font-bold text-slate-800 dark:text-white">${c.nombres || ''} ${c.apellidos || ''}</p>
                                </div>
                                <div>
                                    <span class="text-slate-400 text-xs uppercase tracking-wider">Fecha</span>
                                    <p class="font-medium text-slate-600 dark:text-slate-300">${fechaStr}</p>
                                </div>
                                <div>
                                    <span class="text-slate-400 text-xs uppercase tracking-wider">Email</span>
                                    <p class="font-medium text-slate-600 dark:text-slate-300">${c.email || 'N/A'}</p>
                                </div>
                                <div>
                                    <span class="text-slate-400 text-xs uppercase tracking-wider">Teléfono</span>
                                    <p class="font-medium text-slate-600 dark:text-slate-300">${c.telefono || 'N/A'}</p>
                                </div>
                                <div class="col-span-2">
                                    <span class="text-slate-400 text-xs uppercase tracking-wider">Dirección</span>
                                    <p class="font-medium text-slate-600 dark:text-slate-300">${c.direccion || 'N/A'}</p>
                                </div>
                                <div>
                                    <span class="text-slate-400 text-xs uppercase tracking-wider">Estado</span>
                                    <p class="font-bold ${ventaMadreInfo.estado === 'cancelado' ? 'text-red-500' : ventaMadreInfo.estado === 'entregado' ? 'text-emerald-500' : 'text-amber-500'}">${(ventaMadreInfo.estado || 'pendiente').toUpperCase()}</p>
                                </div>
                            </div>
                        </div>
                    `;
                }

                if (!detalles || detalles.length === 0) {
                    container.innerHTML = headerInfo + `<div class="p-8 text-center text-slate-500 italic">No se encontraron productos para esta orden.</div>`;
                    return;
                }

                // Generar filas
                let htmlItems = '';
                detalles.forEach(item => {
                    const prodName = item.producto ? item.producto.nombre : 'Producto Removido';
                    const prodImg = item.producto ? item.producto.imagen_url : '';
                    const itemPrice = Number(item.precio_unitario);
                    const precioDisplay = window.CurrencyManager ? window.CurrencyManager.formatPrice(itemPrice) : '$' + itemPrice.toLocaleString();
                    const subtotalDisplay = window.CurrencyManager ? window.CurrencyManager.formatPrice(itemPrice * item.cantidad) : '$' + (itemPrice * item.cantidad).toLocaleString();

                    htmlItems += `
                        <div id="modal-item-${item.id_producto}" class="flex items-center gap-4 p-3 rounded-xl border border-slate-100 dark:border-slate-700/50 bg-white dark:bg-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors group relative overflow-hidden">
                            <img src="${prodImg}" alt="${prodName}" class="w-16 h-16 object-cover rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900" onerror="this.src='https://placehold.co/100x100?text=No+Img'">
                            
                            <div class="flex-1 min-w-0 flex flex-col justify-center">
                                <h4 class="font-bold text-slate-800 dark:text-white truncate" title="${prodName}">${prodName}</h4>
                                <div class="text-sm text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-2">
                                    <span class="font-medium px-2 py-0.5 bg-slate-100 dark:bg-slate-700 rounded-md text-xs">${item.cantidad} uni.</span>
                                    <span>× ${precioDisplay}</span>
                                </div>
                            </div>
                            
                            <div class="text-right flex flex-col justify-center items-end pr-2">
                                <span class="font-black text-slate-900 dark:text-white mb-1">${subtotalDisplay}</span>
                                ${ventaMadreInfo && ventaMadreInfo.estado !== 'cancelado' ? `
                                <button onclick="window.devolverItem(${item.id_venta}, ${item.id_producto}, ${item.cantidad}, '${prodName.replace(/'/g, "\\'")}', event)" class="text-xs font-bold text-red-500 flex items-center gap-1 hover:text-red-700 transition-colors bg-red-50 dark:bg-red-900/30 px-2 py-1 rounded">
                                    <span class="material-symbols-outlined text-[14px]">cancel</span> Cancelar
                                </button>
                                ` : `<span class="text-red-500 font-bold text-xs">Cancelado</span>`}
                            </div>
                        </div>
                    `;
                });

                container.innerHTML = headerInfo + htmlItems;

            } catch (error) {
                console.error("Error cargando detalles del modal:", error);
                container.innerHTML = `
                    <div class="p-8 text-center text-red-500 flex flex-col items-center gap-2">
                        <span class="material-symbols-outlined text-4xl">error</span>
                        <span class="font-bold">Error de conexión. No se pudo obtener el desglose.</span>
                    </div>
                `;
            }
        };

        // Escuchar clics en los Tabs
        const btnTabPendientes = document.getElementById('tabPendientes');
        const btnTabEntregados = document.getElementById('tabEntregados');

        window.devolverItem = async (idVenta, idProducto, cantidad, prodName) => {
            const confirmado = await pixelConfirm(`¿Estás seguro de cancelar ${cantidad} unds de '${prodName}'?\n\nEsto devolverá el stock automáticamente al inventario general.`, { titulo: '⚠️ Cancelar Producto', btnConfirm: 'Sí, Cancelar', tipo: 'danger' });
            if (!confirmado) return;

            const btn = event.currentTarget;
            const card = document.getElementById(`modal-item-${idProducto}`);

            const originalHTML = btn.innerHTML;
            btn.innerHTML = '<span class="spinner" style="width:12px; height:12px; border-width:2px; border-left-color:red;"></span>';
            btn.disabled = true;

            try {
                // Modificar el stock sumando (revertir)
                await actualizarStock(idProducto, cantidad);

                // Efecto visual de eliminación en Admin
                card.style.opacity = '0.5';
                card.style.pointerEvents = 'none';
                btn.parentElement.innerHTML = '<span class="text-red-500 font-bold text-xs mt-2">Reintegrado</span>';

                mostrarToast(`Stock Reintegrado Exitosamente (+${cantidad})`);

                // Verificar si TODOS los ítems de este pedido han sido cancelados
                const itemsRestantes = document.querySelectorAll(`#modalItemsContainer [id^="modal-item-"]`);
                const todosAnulados = Array.from(itemsRestantes).every(el => el.style.opacity === '0.5');
                if (todosAnulados) {
                    // Marcar el pedido completo como 'cancelado'
                    try {
                        await actualizarEstadoVenta(idVenta, 'cancelado');
                        const idx = ventasGlobales.findIndex(v => v.id_venta === idVenta);
                        if (idx !== -1) ventasGlobales[idx].estado = 'cancelado';
                        renderizarTablaPedidos();
                        actualizarContadorPendientes();
                        mostrarToast(`⚠️ Pedido #${idVenta} cancelado completamente. Todos los ítems fueron devueltos al stock.`);
                    } catch (cancelErr) {
                        console.error('Error al marcar pedido como cancelado:', cancelErr);
                    }
                }
            } catch (err) {
                console.error("Fallo al devolver Item:", err);
                alert("Ocurrió un error al contactar el Inventario: " + err.message);
                btn.innerHTML = originalHTML;
                btn.disabled = false;
            }
        };

        if (btnTabPendientes && btnTabEntregados) {
            btnTabPendientes.addEventListener('click', () => {
                filtroActual = 'pendiente';

                // Estilos Activo (Pendiente)
                btnTabPendientes.className = "px-6 py-2 rounded-lg font-bold transition-all bg-brand-blue dark:bg-primary text-white dark:text-brand-blue shadow-md border border-transparent";
                btnTabEntregados.className = "px-6 py-2 rounded-lg font-bold transition-all bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-600";

                renderizarTablaPedidos();
            });

            btnTabEntregados.addEventListener('click', () => {
                filtroActual = 'entregado';

                // Estilos Inactivo (Pendiente) -> Activo (Entregado)
                btnTabPendientes.className = "px-6 py-2 rounded-lg font-bold transition-all bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-600";
                btnTabEntregados.className = "px-6 py-2 rounded-lg font-bold transition-all bg-emerald-500 text-white shadow-md border border-transparent";
                if (btnTabCancelados) btnTabCancelados.className = "px-6 py-2 rounded-lg font-bold transition-all bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-600";

                renderizarTablaPedidos();
            });
        }

        // Tab Cancelados
        const btnTabCancelados = document.getElementById('tabCancelados');
        if (btnTabCancelados) {
            btnTabCancelados.addEventListener('click', () => {
                filtroActual = 'cancelado';

                if (btnTabPendientes) btnTabPendientes.className = "px-6 py-2 rounded-lg font-bold transition-all bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-600";
                if (btnTabEntregados) btnTabEntregados.className = "px-6 py-2 rounded-lg font-bold transition-all bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-600";
                btnTabCancelados.className = "px-6 py-2 rounded-lg font-bold transition-all bg-red-500 text-white shadow-md border border-transparent";

                renderizarTablaPedidos();
            });

            // Hacer que el tab Pendientes también resetee el tab cancelados
            if (btnTabPendientes) {
                const originalPendientesClick = btnTabPendientes.onclick;
                btnTabPendientes.addEventListener('click', () => {
                    btnTabCancelados.className = "px-6 py-2 rounded-lg font-bold transition-all bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-600";
                });
            }
        }
    }
}
