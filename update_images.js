/**
 * Script para actualizar las imágenes de TODOS los productos en Supabase.
 * Ejecutar con: node update_images.js
 */
const https = require('https');

const SUPABASE_URL = 'tqvjmoczroynlxnoldcm.supabase.co';
const SUPABASE_KEY = 'REEMPLAZA_CON_TU_KEY_REAL';

// Imágenes reales de productos de tecnología (URLs públicas de alta calidad)
const productImages = {
    1: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&q=80&w=500',   // Laptop Lenovo
    2: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&q=80&w=500',   // Smartphone Samsung
    3: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&q=80&w=500',   // Camisa Polo
    4: 'https://images.unsplash.com/photo-1570222094114-d054a817e56b?auto=format&fit=crop&q=80&w=500',   // Licuadora
    5: 'https://images.unsplash.com/photo-1614632537423-1e6c2e7e0aab?auto=format&fit=crop&q=80&w=500',   // Balón Fútbol
    6: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&q=80&w=500',   // MacBook Air
    7: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&q=80&w=500',   // Monitor Gaming
    8: 'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?auto=format&fit=crop&q=80&w=500',   // Sony Headphones
    9: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?auto=format&fit=crop&q=80&w=500',   // Mouse Logitech
    10: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&q=80&w=500',     // iPad Pro
    11: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&q=80&w=500',  // Teclado Keychron
    12: 'https://images.unsplash.com/photo-1625842268584-8f3296236761?auto=format&fit=crop&q=80&w=500',  // Stream Deck
    13: 'https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&q=80&w=500'      // Bose Soundbar
};

function updateProduct(id, imageUrl) {
    return new Promise((resolve, reject) => {
        const body = JSON.stringify({ imagen_url: imageUrl });
        const options = {
            hostname: SUPABASE_URL,
            port: 443,
            path: `/rest/v1/producto?id_producto=eq.${id}`,
            method: 'PATCH',
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': 'Bearer ' + SUPABASE_KEY,
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(body),
                'Prefer': 'return=minimal'
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    console.log(`Producto ${id}: imagen actualizada OK (${res.statusCode})`);
                    resolve();
                } else {
                    console.error(`Producto ${id}: ERROR ${res.statusCode} - ${data}`);
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
    console.log('Actualizando imágenes de los 13 productos en Supabase...\n');
    for (const [id, url] of Object.entries(productImages)) {
        await updateProduct(id, url);
    }
    console.log('\n¡Todas las imágenes fueron actualizadas exitosamente!');
}

main().catch(console.error);
