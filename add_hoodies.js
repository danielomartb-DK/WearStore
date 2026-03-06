const https = require('https');

const SUPABASE_URL = 'tqvjmoczroynlxnoldcm.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxdmptb2N6cm95bmx4bm9sZGNtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIyMDM1NTUsImV4cCI6MjA4Nzc3OTU1NX0.Kv8k6fAkP7ZaHdTy4tHsF5ANKPAc2NmY_q0e_iDJulc';

const nuevosBuzos = [
    {
        nombre: 'Buzo con Capota Haikyuu!! - Los de Tercer Año (Karasuno)',
        descripcion: 'Buzo negro (Hoodie) premium con estampado estético de los alumnos de tercer año de Karasuno: Daichi, Sugawara y Asahi. Algodón grueso especial para clima frío. Letras Kanji naranjas en las mangas para un toque streetwear deportivo.',
        precio: 45.00,
        stock: 25,
        imagen_url: 'assets/images/hq_third_years.jpg',
        id_tipo_producto: 2
    },
    {
        nombre: 'Buzo con Capota Bokuto Kotaro - Haikyuu!!',
        descripcion: 'Expresa toda la energía del as de Fukurodani con este espectacular Hoodie de Bokuto. Textos amarillos vibrantes en un estampado trasero enorme y detalles kanji a lo largo de las mangas. ¡Hey hey hey!',
        precio: 45.00,
        stock: 30,
        imagen_url: 'assets/images/hq_bokuto.jpg',
        id_tipo_producto: 2
    },
    {
        nombre: 'Buzo con Capota Demon Slayer - Tanjiro Danza del Dios del Fuego',
        descripcion: 'Siente el poder de la respiración solar con este hoodie detallado. Presenta un logo gigante de Kimetsu no Yaiba en la espalda y a Tanjiro Kamado ejecutando el Hinokami Kagura al frente. Telas de máxima resistencia y grosor.',
        precio: 48.00,
        stock: 20,
        imagen_url: 'assets/images/ds_tanjiro_hoodie.jpg',
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
                    console.log(`Buzo creado OK: ${producto.nombre}`);
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
    console.log('Insertando 3 buzos (hoodies) en la base de datos...\n');
    for (const producto of nuevosBuzos) {
        await crearProducto(producto);
    }
    console.log('\n¡Todos los buzos fueron guardados exitosamente en la tienda!');
}

main().catch(console.error);
