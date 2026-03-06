const https = require('https');

const SUPABASE_URL = 'tqvjmoczroynlxnoldcm.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxdmptb2N6cm95bmx4bm9sZGNtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIyMDM1NTUsImV4cCI6MjA4Nzc3OTU1NX0.Kv8k6fAkP7ZaHdTy4tHsF5ANKPAc2NmY_q0e_iDJulc';

const nuevosProductos = [
    {
        nombre: 'Camiseta Arise Sung Jin-woo (Morada) - Solo Leveling',
        descripcion: 'Espectacular diseño "Arise" con los icónicos tonos morados del monarca de las sombras. Prenda de tacto suave, estilo urbano con caracteres orientales.',
        precio: 26.00,
        stock: 35,
        imagen_url: 'assets/images/sl_purple.jpg',
        id_tipo_producto: 2
    },
    {
        nombre: 'Camiseta Muichiro Pilar de la Niebla V2 - Demon Slayer',
        descripcion: 'Nuevo estampado del pilar Muichiro Tokito sobre fondo turquesa y líneas kinéticas. Construcción en algodón peinado premium que ofrece frescura extrema.',
        precio: 24.00,
        stock: 20,
        imagen_url: 'assets/images/ds_muichiro_2.jpg',
        id_tipo_producto: 2
    },
    {
        nombre: 'Camiseta Kyojuro Rengoku Llama - Demon Slayer',
        descripcion: 'Mantén vivo tu corazón ardiente con la estampa estética de Kyojuro Rengoku. Edición limitada de nuestra línea de ropa geek en WearStore.',
        precio: 25.00,
        stock: 40,
        imagen_url: 'assets/images/ds_rengoku.jpg',
        id_tipo_producto: 2
    },
    {
        nombre: 'Camiseta Arise Sung Jin-woo (Azul) - Solo Leveling',
        descripcion: 'Variación especial azul profundo de nuestro exitoso diseño de Sung Jin-woo, el rey supremo. Lleva al héroe definitivo siempre contigo. 100% Algodón pima de larga duración.',
        precio: 26.00,
        stock: 30,
        imagen_url: 'assets/images/sl_blue.jpg',
        id_tipo_producto: 2
    },
    {
        nombre: 'Camiseta Mitsuri Kanroji Rosa Pilar del Amor - Kimetsu no Yaiba',
        descripcion: 'Prenda encantadora y atrevida inspirada en el Pilar del Amor, Mitsuri Kanroji. Estampada con la más alta técnica de serigrafía de color prolongado.',
        precio: 24.00,
        stock: 30,
        imagen_url: 'assets/images/ds_mitsuri.jpg',
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
    console.log('Insertando 5 camisas adicionales en la base de datos...\n');
    for (const producto of nuevosProductos) {
        await crearProducto(producto);
    }
    console.log('\n¡Todas las camisas fueron insertadas exitosamente!');
}

main().catch(console.error);


