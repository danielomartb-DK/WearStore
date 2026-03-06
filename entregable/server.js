const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8080;
// Usar la carpeta donde está este archivo como raíz del servidor
const ROOT_DIR = path.join('C:', 'Users', 'danie', 'Downloads', 'tienda-online');

http.createServer((req, res) => {
    // Eliminar los parámetros de búsqueda (?id=...) de la URL para buscar el archivo real
    const urlSinParametros = req.url.split('?')[0];
    let filePath = path.join(ROOT_DIR, urlSinParametros === '/' ? 'index.html' : urlSinParametros);

    const extname = String(path.extname(filePath)).toLowerCase();
    const mimeTypes = {
        '.html': 'text/html',
        '.js': 'text/javascript',
        '.css': 'text/css',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpg',
        '.gif': 'image/gif',
        '.svg': 'image/svg+xml',
        '.ico': 'image/x-icon'
    };

    const contentType = mimeTypes[extname] || 'application/octet-stream';

    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code === 'ENOENT') {
                res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
                res.end('<h1>404 - Archivo no encontrado</h1><p>Ruta: ' + filePath + '</p>', 'utf-8');
            } else {
                res.writeHead(500);
                res.end('Error del servidor: ' + error.code);
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType + '; charset=utf-8' });
            res.end(content, 'utf-8');
        }
    });
}).listen(PORT, () => {
    console.log('WearStore corriendo en: http://localhost:' + PORT);
});


