const https = require('https');

const SUPABASE_URL = 'tqvjmoczroynlxnoldcm.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxdmptb2N6cm95bmx4bm9sZGNtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIyMDM1NTUsImV4cCI6MjA4Nzc3OTU1NX0.Kv8k6fAkP7ZaHdTy4tHsF5ANKPAc2NmY_q0e_iDJulc';

const nuevosProductos = [
    {
        nombre: 'Camiseta Oversize Tanjiro Kamado - Demon Slayer',
        descripcion: 'Camiseta de algodón 100% premium con estampado de alta resolución de Tanjiro Kamado en pose de respiración del agua. Perfecta para los verdaderos fans de Kimetsu no Yaiba.',
        precio: 25.00,
        stock: 45,
        imagen_url: 'assets/images/ds_tanjiro.jpg',
        id_tipo_producto: 2
    },
    {
        nombre: 'Camiseta Oversize Nezuko Kamado - Demon Slayer',
        descripcion: 'Camiseta oscura estilo urbano con diseño artístico de Nezuko en forma demoníaca. Algodón transpirable, corte holgado ideal para outfits de streetwear anime.',
        precio: 25.00,
        stock: 30,
        imagen_url: 'assets/images/ds_nezuko.jpg',
        id_tipo_producto: 2
    },
    {
        nombre: 'Camiseta Minimalista Kanao Tsuyuri - Demon Slayer',
        descripcion: 'Camiseta negra resistente con estampado frontal estético de Kanao Tsuyuri y mariposas. Tejido suave y duradero, diseño elegante para cualquier ocasión.',
        precio: 22.00,
        stock: 50,
        imagen_url: 'assets/images/ds_kanao.jpg',
        id_tipo_producto: 2
    },
    {
        nombre: 'Camiseta Estética Muichiro Tokito - Demon Slayer',
        descripcion: 'Luce la serenidad del Pilar de la Niebla con esta camiseta estampada de Muichiro Tokito. Manga corta, cuello redondo reforzado, algodón de la mejor calidad.',
        precio: 24.00,
        stock: 40,
        imagen_url: 'assets/images/ds_muichiro.jpg',
        id_tipo_producto: 2
    },
    {
        nombre: 'Camiseta Dúo Dinámico Tanjiro & Nezuko - Demon Slayer',
        descripcion: 'Edición especial que captura el vínculo inquebrantable entre los hermanos Kamado. Colores vibrantes de larga duración, resistente a más de 50 lavadas sin perder nitidez.',
        precio: 28.00,
        stock: 25,
        imagen_url: 'assets/images/ds_tanjiro_nezuko.jpg',
        id_tipo_producto: 2
    }
];

function crearProducto(producto) {
    return new Promise((resolve, reject) => {
        const body = JSON.stringify(producto);
        const options = {
            hostname: SUPABASE_URL,
            port: 443,
            path: '/rest/v1/producto',
            method: 'POST',
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': 'Bearer ' + SUPABASE_KEY,
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(body),
                'Prefer': 'return=representation'
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    console.log(`Producto creado OK: ${producto.nombre}`);
                    resolve();
                } else {
                    console.error(`ERROR ${res.statusCode} al crear ${producto.nombre} - ${data}`);
                    reject(new Error(data));
                }
            });
        });

        req.on('error', reject);
        req.write(body);
        req.end();
    });
}

async function main() {
    console.log('Insertando 5 camisas de Demon Slayer en la base de datos...\n');
    for (const producto of nuevosProductos) {
        await crearProducto(producto);
    }
    console.log('\n¡Todas las camisas fueron insertadas exitosamente!');
}

main().catch(console.error);
