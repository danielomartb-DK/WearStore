const fs = require('fs');
const sungPath = 'c:/Users/danie/Downloads/tienda-online/assets/images/sung.webp';
const base64 = fs.readFileSync(sungPath).toString('base64');
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
  <image href="data:image/webp;base64,${base64}" x="0" y="0" width="32" height="32" />
</svg>`;
fs.writeFileSync('c:/Users/danie/Downloads/tienda-online/assets/daga.svg', svg);
console.log('Daga SVG creado correctamente.');
