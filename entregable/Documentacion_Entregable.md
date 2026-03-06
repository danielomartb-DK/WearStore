# Proyecto WearStore - Entregable Final

Este documento resume la arquitectura, conexión y flujos principales de la plataforma e-commerce WearStore. Incluye los puntos clave requeridos para la entrega del proyecto.

---

## 1. Explicación de la Arquitectura

El proyecto WearStore está construido bajo una arquitectura **Client-Server (Frontend SPA + BaaS)** estructurada de la siguiente manera:

### Frontend (Lado del Cliente)
- **Tecnologías Core**: HTML5, CSS3 (con Tailwind CSS vía CDN) y Vanilla JavaScript (ES6+).
- **Controladores de Vista**: Cada vista principal cuenta con su propio script controlador (ej. `app.js` para Inicio, `producto.js` para Detalles, `carrito.js` para el Checkout, `admin.js` para el Panel de Control, `perfil.js` para gestión del usuario).
- **Gestión de Estado Centralizada**: Scripts globales manejan dependencias compartidas:
  - `auth.js` administra los tokens de sesión, el control de acceso y encripta el LocalStorage.
  - `api.js` concentra todas las consultas HTTP externas y abstrae la lógica de red.
  - `theme.js` gestiona la persistencia del tema Claro/Oscuro.

### Backend as a Service (BaaS) - Supabase
- **Almacenamiento y Base de Datos**: PostgreSQL alojado en Supabase gestiona todo el catálogo (`producto`), las credenciales reales (`user`), perfiles (`cliente`) y transacciones financieras (`venta`, `detalle_venta`).
- **Autenticación**: Integración directa con `Supabase Auth` (GoTrue) usando Correo/Contraseña, devolviendo JWTs (JSON Web Tokens) que aseguran las rutas en el frontend.
- **Seguridad (RLS)**: Row Level Security protege la inyección directa de BBDD. Solo usuarios con tokens válidos (`dynamic headers`) pueden registrar facturas o consultar/manipular inventario.

---

## 2. Evidencia de Conexión a Supabase

La conexión a la base de datos no es simulada; es directa a la nube usando la API REST autogenerada por PostgREST de Supabase.

**Archivo Central:** `js/api.js`

```javascript
// Configuración Core de Conexión (api.js)
const SUPABASE_URL = 'https://ctgsrzozfvgmouuzuhki.supabase.co';
const SUPABASE_KEY = 'eyJhb... (oculto por seguridad)';

// Cabeceras Dinámicas para autenticación RLS
function getDynamicHeaders() {
    return {
        'apikey': SUPABASE_KEY,
        'Authorization': \`Bearer \${window.novaAuth ? window.novaAuth.getAccessToken() : SUPABASE_KEY}\`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
    };
}
```

**Ejemplo de Transacción a BBDD:**
Cuando se cargan los productos, se hace una consulta `GET` real:
\`fetch(SUPABASE_URL + '/rest/v1/producto?select=*,tipo_producto(nombre)', { headers: getDynamicHeaders() })\`

---

## 3. Explicación del Flujo de Compra (Checkout Flow)

El proceso de compra ha sido diseñado para ser transaccional y libre de errores críticos:

1. **Selección de Producto**: En `producto.html`, el usuario escoge la cantidad y **Talla** obligatoria si es de tipo Ropa. El producto temporal se añade al LocalStorage (`carritoLocal`) usando un identificador compuesto `${id_producto}_${talla}` para evitar solapamientos.
2. **Validación de Carrito (`carrito.html`)**: El cliente verifica los subtotales, totales y cantidad. El `CurrencyManager` (si está activo) formatea la moneda.
3. **Autenticación y Perfilado**: 
   - El sistema le solicita al usuario hacer Login o crear una cuenta (`Supabase Auth`).
   - Al estar logueado, `api.js` consulta `obtenerPerfilCliente` para buscar los datos del usuario.
   - Si existen, autocompletan el modal de Checkout (Nombre, Dirección, Teléfono).
4. **Procesamiento del Checkout (`handleCheckoutSubmit`)**:
   - **Registro de Cliente**: Se hace un UPSERT de la información personal del usuario hacia la tabla `cliente` para confirmar la dirección de envío actual.
   - **Creación de Venta Mátriz**: Se crea la cabecera del recibo en la tabla `venta` (total pendiente) vinculada al `id_cliente`. Supabase retorna el `id_venta` primario.
   - **Registro Detallado**: Se recorre iterativamente el LocalStorage para mapear los subtotales y tallas, creando los registros hijos en `detalle_venta` asociados al `id_venta`.
   - **Conciliación de Inventario**: Por cada detalle insertado con éxito, se envía un `PATCH` a la tabla `producto` descontando matemáticamente stock (`actualizarStock(id, -cantidad)`).
5. **Cierre Exitoso**: Si no hay errores de constraints o FK, se vacía el LocalStorage local y se dispara el Modal Animado de "Compra Exitosa ✔️".

---

## 4. Capturas de Pantalla

*(Nota: Enviar estas carpetas e imágenes adjuntas en el comprimido del entregable)*

- Raíz del proyecto con estructura de carpetas bien definida.
- La tabla de `producto` en el Dashboard visual de Supabase.
- Interfaz del Home (Claro/Oscuro).
- Interfaz de la página de Detalles con el selector de tallas S,M,L,XL.
- Interfaz del checkout y recibo final.
