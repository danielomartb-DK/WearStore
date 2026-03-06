/**
 * JS/API.js - Capa de Conexión a Datos (Supabase)
 * Maneja todas las peticiones fetch de la aplicación.
 */

const SUPABASE_URL = 'https://ctgsrzozfvgmouuzuhki.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN0Z3Nyem96ZnZnbW91dXp1aGtpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3NTQ3MDEsImV4cCI6MjA4ODMzMDcwMX0.Q8Q3u09a-xeg4R3VVTu4Id-rcKMvgrrHfh8yzuxU_KU';

const headers = {
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json'
};

/**
 * Obtiene las cabeceras HTTP incluyendo el Token JWT de sesión si existe.
 * Es crucial para que Supabase reconozca al Administrador y le permita saltar el RLS.
 */
function getDynamicHeaders() {
    const defaultHeaders = { ...headers };
    try {
        const sessionStore = localStorage.getItem('WearStore_session');
        if (sessionStore) {
            const session = JSON.parse(sessionStore);
            if (session.session && session.session.access_token) {
                // Sobrescribir el Authorization Header de la API KEY anónima con el JWT del Usuario Autenticado
                defaultHeaders['Authorization'] = `Bearer ${session.session.access_token}`;
            } else if (session.access_token) {
                defaultHeaders['Authorization'] = `Bearer ${session.access_token}`;
            }
        }
    } catch (e) {
        console.warn('No session found for dynamic headers');
    }
    return defaultHeaders;
}

/**
 * Obtiene todos los productos (activos e inactivos) de la base de datos
 * @returns {Promise<Array>} Lista de productos
 */
async function obtenerProductos() {
    try {
        console.log("Intentando obtener productos de Supabase...");
        const response = await fetch(`${SUPABASE_URL}/rest/v1/producto?select=*`, {
            method: 'GET',
            headers: headers
        });

        console.log("Status de respuesta de Supabase:", response.status);
        if (!response.ok) {
            const errBody = await response.text();
            console.error('Error cuerpo:', errBody);
            throw new Error(`Error HTTP: ${response.status}`);
        }

        const data = await response.json();
        console.log("Productos devueltos por la BD:", data.length);
        return data;
    } catch (error) {
        console.error('API Error (obtenerProductos):', error);
        throw error;
    }
}

/**
 * Obtiene solo los productos ACTIVOS (estado=true) para la vista pública
 * @returns {Promise<Array>} Lista de productos activos
 */
async function obtenerProductosActivos() {
    try {
        console.log("Obteniendo productos activos de Supabase...");
        const response = await fetch(`${SUPABASE_URL}/rest/v1/producto?estado=eq.true&select=*`, {
            method: 'GET',
            headers: headers
        });

        if (!response.ok) {
            const errBody = await response.text();
            console.error('Error cuerpo:', errBody);
            throw new Error(`Error HTTP: ${response.status}`);
        }

        const data = await response.json();
        console.log("Productos activos devueltos:", data.length);
        return data;
    } catch (error) {
        console.error('API Error (obtenerProductosActivos):', error);
        throw error;
    }
}

/**
 * Obtiene un producto específico por su ID
 * @param {number|string} id - ID del producto
 * @returns {Promise<Object>} Datos del producto
 */
async function obtenerProductoPorId(id) {
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/producto?id_producto=eq.${id}&select=*`, {
            method: 'GET',
            headers: headers
        });

        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }

        const data = await response.json();
        return data.length > 0 ? data[0] : null;
    } catch (error) {
        console.error('API Error (obtenerProductoPorId):', error);
        throw error;
    }
}

/**
 * Registra un nuevo cliente (o lo obtiene si ya existe por email/documento)
 * @param {Object} datosCliente 
 * @returns {Promise<Object>} Cliente insertado
 */
async function registrarCliente(datosCliente) {
    try {
        // 1. Primero intentar buscar al cliente por su documento o email
        const getResponse = await fetch(`${SUPABASE_URL}/rest/v1/cliente?or=(documento.eq.${datosCliente.documento},email.eq.${datosCliente.email})&select=*`, {
            method: 'GET',
            headers: headers
        });

        if (getResponse.ok) {
            const existentes = await getResponse.json();
            if (existentes && existentes.length > 0) {
                // Cliente existente: Modificamos silenciosamente su perfil viejo con los nuevos datos 
                // del Checkout (nombres, direccion, telefono) para no dejar los obsoletos "Karla Tijaro" 
                // para compras furturas donde "Daniel" decida usar el mismo email.
                const oldClient = existentes[0];
                const patchResp = await fetch(`${SUPABASE_URL}/rest/v1/cliente?id_cliente=eq.${oldClient.id_cliente}`, {
                    method: 'PATCH',
                    headers: {
                        ...getDynamicHeaders(),
                        'Prefer': 'return=representation'
                    },
                    body: JSON.stringify({
                        nombres: datosCliente.nombres,
                        apellidos: datosCliente.apellidos,
                        direccion: datosCliente.direccion,
                        telefono: datosCliente.telefono
                    })
                });

                if (patchResp.ok) {
                    const actList = await patchResp.json();
                    return actList[0];
                } else {
                    return oldClient; // Falla segura: retornar el viejo igual
                }
            }
        }

        // 2. Si definitivamente no existe, procedemos a crearlo normalmente
        const response = await fetch(`${SUPABASE_URL}/rest/v1/cliente`, {
            method: 'POST',
            headers: {
                ...getDynamicHeaders(),
                'Prefer': 'return=representation'
            },
            body: JSON.stringify(datosCliente)
        });

        if (!response.ok) {
            const errBody = await response.text();
            try {
                const err = JSON.parse(errBody);
                throw new Error(err.message || 'Error al registrar cliente');
            } catch (e) {
                throw new Error('Error al registrar cliente: ' + errBody);
            }
        }

        const data = await response.json();
        return data[0];
    } catch (error) {
        console.error('API Error (registrarCliente):', error);
        throw error;
    }
}

/**
 * Modifica directamente el stock físico sumando o restando (para ventas o devoluciones)
 * @param {number|string} id_producto - ID del producto a alterar
 * @param {number} diferencial - Valor positivo (sumar) o negativo (restar) a aplicar
 */
async function actualizarStock(id_producto, diferencial) {
    try {
        // Obtenemos la capa base de cuántos hay
        const responseData = await fetch(`${SUPABASE_URL}/rest/v1/producto?id_producto=eq.${id_producto}&select=stock`, {
            method: 'GET',
            headers: getDynamicHeaders()
        });

        if (!responseData.ok) throw new Error('Error al leer Stock Base');
        const [prodRow] = await responseData.json();

        if (!prodRow) throw new Error('Producto no hallado');

        const nuevoStock = Math.max(0, parseInt(prodRow.stock) + diferencial); // Evitar stock negativo

        // Planificamos el reemplazo
        const updateRes = await fetch(`${SUPABASE_URL}/rest/v1/producto?id_producto=eq.${id_producto}`, {
            method: 'PATCH',
            headers: {
                ...getDynamicHeaders(),
                'Prefer': 'return=representation'
            },
            body: JSON.stringify({ stock: nuevoStock })
        });

        if (!updateRes.ok) throw new Error('Error parchando el Stock');

        return await updateRes.json();
    } catch (error) {
        console.error('API Error (actualizarStock):', error);
        throw error;
    }
}

/**
 * Crea una nueva orden de venta
 * @param {Object} datosVenta 
 * @returns {Promise<Object>} Venta creada
 */
async function registrarVenta(datosVenta) {
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/venta`, {
            method: 'POST',
            headers: {
                ...getDynamicHeaders(),
                'Prefer': 'return=representation'
            },
            body: JSON.stringify(datosVenta)
        });

        if (!response.ok) throw new Error('Error al registrar la venta');

        const data = await response.json();
        return data[0];
    } catch (error) {
        console.error('API Error (registrarVenta):', error);
        throw error;
    }
}

/**
 * Registra múltiples detalles (ítems) asociados a una venta
 * @param {Array} detallesVenta 
 * @returns {Promise<Array>}
 */
async function registrarDetallesVenta(detallesVenta) {
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/detalle_venta`, {
            method: 'POST',
            headers: {
                ...getDynamicHeaders(),
                'Prefer': 'return=representation'
            },
            body: JSON.stringify(detallesVenta)
        });

        if (!response.ok) {
            const errBody = await response.text();
            throw new Error(`Error al registrar el detalle de la venta: ${errBody}`);
        }

        return await response.json();
    } catch (error) {
        console.error('API Error (registrarDetallesVenta):', error);
        throw error;
    }
}

/**
 * Sube una imagen al bucket de Supabase Storage correspondiente ("productos")
 * @param {File} file - Objeto File del input[type="file"]
 * @returns {Promise<string>} URL pública de la imagen subida
 */
async function subirFotoProducto(file) {
    try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `${fileName}`;

        // Usar headers por defecto (anon key) para el Storage para evitar conflictos con RLS de usuario si el bucket es público
        const response = await fetch(`${SUPABASE_URL}/storage/v1/object/productos/${filePath}`, {
            method: 'POST',
            headers: {
                ...headers,
                'Content-Type': file.type
            },
            body: file
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error('[STORAGE] ' + (err.message || 'Error al subir la imagen a Storage'));
        }

        // Retornar la URL pública estandarizada de Supabase
        return `${SUPABASE_URL}/storage/v1/object/public/productos/${filePath}`;
    } catch (error) {
        console.error('API Error (subirFotoProducto):', error);
        throw error;
    }
}

/**
 * Inserta un nuevo producto en la base de datos
 * @param {Object} producto - Objeto con campos obligatorios para tabla producto
 * @returns {Promise<Object>} Promesa que resuelve al producto creado
 */
async function crearProducto(producto) {
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/producto`, {
            method: 'POST',
            headers: {
                ...getDynamicHeaders(),
                'Prefer': 'return=representation' // Para forzar que devuelva el objeto insertado
            },
            body: JSON.stringify(producto)
        });

        if (!response.ok) {
            const errBody = await response.text();
            console.error('Error insertando en la BD:', errBody);
            try {
                const err = JSON.parse(errBody);
                throw new Error('[DATABASE] ' + (err.message || errBody));
            } catch (e) {
                throw new Error('[DATABASE] Error al crear el producto en la BD: ' + errBody);
            }
        }

        const data = await response.json();
        return data[0];
    } catch (error) {
        console.error('API Error (crearProducto):', error);
        throw error;
    }
}

/**
 * Actualiza un producto existente en la base de datos
 * @param {number|string} id_producto - ID del producto a actualizar
 * @param {Object} datos - Objeto con los campos a actualizar
 */
async function actualizarProducto(id_producto, datos) {
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/producto?id_producto=eq.${id_producto}`, {
            method: 'PATCH',
            headers: {
                ...getDynamicHeaders(),
                'Prefer': 'return=representation'
            },
            body: JSON.stringify(datos)
        });

        if (!response.ok) {
            const errBody = await response.text();
            throw new Error('[DATABASE] Error al actualizar el producto: ' + errBody);
        }
        return await response.json();
    } catch (error) {
        console.error('API Error (actualizarProducto):', error);
        throw error;
    }
}

/**
 * Elimina un producto de la tabla producto.
 * Primero limpia las referencias en detalle_venta (líneas de pedido),
 * luego elimina el producto. Las ventas (tabla venta) NO se tocan.
 * @param {number|string} id_producto - ID del producto a eliminar
 */
async function eliminarProducto(id_producto) {
    try {
        // Paso 1: Eliminar las líneas de detalle_venta que referencian este producto
        // (esto NO borra las ventas/pedidos, solo las líneas de ítem)
        const deleteDetalles = await fetch(`${SUPABASE_URL}/rest/v1/detalle_venta?id_producto=eq.${id_producto}`, {
            method: 'DELETE',
            headers: {
                ...getDynamicHeaders()
            }
        });

        // No lanzamos error si falla — puede que no haya detalles asociados
        if (!deleteDetalles.ok) {
            console.warn('Info: No se encontraron detalles de venta para limpiar (o error menor).');
        }

        // Paso 2: Ahora sí eliminar el producto de la tabla producto
        const response = await fetch(`${SUPABASE_URL}/rest/v1/producto?id_producto=eq.${id_producto}`, {
            method: 'DELETE',
            headers: {
                ...getDynamicHeaders()
            }
        });

        if (!response.ok) {
            const errBody = await response.text();
            throw new Error('[DATABASE] Error al eliminar el producto: ' + errBody);
        }
        return true;
    } catch (error) {
        console.error('API Error (eliminarProducto):', error);
        throw error;
    }
}

/**
 * Obtiene todas las ventas de la base de datos juntando la información del cliente
 * @returns {Promise<Array>} Lista de ventas enriquecidas con datos del cliente
 */
async function obtenerVentas() {
    try {
        // Usamos la sintaxis relacional de PostgREST para hacer JOIN implícito de la tabla cliente
        // suponiendo que la foreign key en `venta` hacia `cliente` está bien definida en Supabase
        const response = await fetch(`${SUPABASE_URL}/rest/v1/venta?select=*,cliente(*)&order=fecha.desc`, {
            method: 'GET',
            headers: getDynamicHeaders() // Usar token de autenticación del admin
        });

        if (!response.ok) {
            const errBody = await response.text();
            throw new Error(`Error HTTP recuperando ventas: ${response.status} - ${errBody}`);
        }

        return await response.json();
    } catch (error) {
        console.error('API Error (obtenerVentas):', error);
        throw error;
    }
}

/**
 * Actualiza el estado de una venta (ej. 'pendiente' a 'entregado')
 * @param {number|string} id_venta - ID de la orden
 * @param {string} nuevoEstado - Nuevo estado a asignar
 */
async function actualizarEstadoVenta(id_venta, nuevoEstado) {
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/venta?id_venta=eq.${id_venta}`, {
            method: 'PATCH',
            headers: {
                ...getDynamicHeaders(),
                'Prefer': 'return=representation'
            },
            body: JSON.stringify({ estado: nuevoEstado })
        });

        if (!response.ok) {
            const errBody = await response.text();
            throw new Error(`[DATABASE] Error actualizando el estado de la venta: ${errBody}`);
        }
        return await response.json();
    } catch (error) {
        console.error('API Error (actualizarEstadoVenta):', error);
        throw error;
    }
}

/**
 * Obtiene las sub-filas de una compra específica (los ítems adquiridos) resolviendo el JOIN con producto
 * @param {number|string} id_venta - ID primario de la Factura/Venta
 * @returns {Promise<Array>} Lista estructurada del desglose de productos y sus detalles
 */
async function obtenerDetallesVenta(id_venta) {
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/detalle_venta?id_venta=eq.${id_venta}&select=*,producto(nombre,imagen_url,stock)`, {
            method: 'GET',
            headers: getDynamicHeaders()
        });

        if (!response.ok) {
            const errBody = await response.text();
            throw new Error(`Error HTTP recuperando el recibo detallado: ${errBody}`);
        }

        return await response.json();
    } catch (error) {
        console.error('API Error (obtenerDetallesVenta):', error);
        throw error;
    }
}

/**
 * Obtiene el perfil del cliente desde la base de datos usando su email.
 * @param {string} email - Correo del usuario autenticado
 * @returns {Promise<Object|null>} Datos del cliente o null si no existe
 */
async function obtenerPerfilCliente(email) {
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/cliente?email=eq.${encodeURIComponent(email)}&select=*`, {
            method: 'GET',
            headers: getDynamicHeaders()
        });

        if (!response.ok) {
            throw new Error('Error al obtener perfil');
        }

        const data = await response.json();
        return data.length > 0 ? data[0] : null;
    } catch (error) {
        console.error('API Error (obtenerPerfilCliente):', error);
        return null;
    }
}

/**
 * Crea o actualiza el perfil del cliente (UPSERT basado en email)
 * @param {Object} datosCliente - Objeto con nombres, apellidos, telefono, direccion, documento, email
 */
async function upsertPerfilCliente(datosCliente) {
    try {
        // En supabase rest v1, el UPSERT se hace con POST o PUT más resolución de conflicto
        const response = await fetch(`${SUPABASE_URL}/rest/v1/cliente?on_conflict=email`, {
            method: 'POST',
            headers: {
                ...getDynamicHeaders(),
                'Prefer': 'resolution=merge-duplicates,return=representation'
            },
            body: JSON.stringify(datosCliente)
        });

        if (!response.ok) {
            const errBody = await response.text();
            throw new Error(`[DATABASE] Error guardando perfil: ${errBody}`);
        }

        const data = await response.json();
        return data.length > 0 ? data[0] : null;
    } catch (error) {
        console.error('API Error (upsertPerfilCliente):', error);
        throw error;
    }
}
