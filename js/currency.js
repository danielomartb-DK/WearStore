/**
 * JS/Currency.js - Lógica global de cambio de divisas de WearStore
 */

const CurrencyManager = {
    // Tasas de conversión fijas respecto al USD base
    rates: {
        'USD': 1,
        'COP': 4150,  // 1 USD ≈ 4150 Pesos Colombianos
        'MXN': 17.50, // 1 USD ≈ 17.50 MXN
        'EUR': 0.92   // 1 USD ≈ 0.92 Euros
    },

    // Obtiene la moneda actual del localStorage o por defecto USD
    getCurrentCurrency: function () {
        return localStorage.getItem('WearStore_currency') || 'USD';
    },

    // Establece la moneda actual (guardando en local storage) y recarga
    setCurrency: function (currencyCode) {
        if (this.rates[currencyCode]) {
            localStorage.setItem('WearStore_currency', currencyCode);
            // Al cambiar la moneda, forzamos la recarga de la página para que 
            // los scripts locales (app.js, producto.js) vuelvan a pintar los precios.
            window.location.reload();
        }
    },

    // Formatea el precio base de la BD a la moneda activa
    formatPrice: function (basePriceUSD) {
        const currency = this.getCurrentCurrency();
        const rate = this.rates[currency];

        const convertedPrice = basePriceUSD * rate;

        // Formato interno de JavaScript para inyectar correctamente la puntuación locale
        const formatter = new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: currency === 'COP' ? 0 : 2,
            maximumFractionDigits: currency === 'COP' ? 0 : 2
        });

        return formatter.format(convertedPrice);
    },

    // Inicializa el selector de moneda en el header del HTML
    initSelector: function () {
        const selects = document.querySelectorAll('.currency-selector');
        const currentCurrency = this.getCurrentCurrency();

        selects.forEach(select => {
            select.value = currentCurrency;
            select.addEventListener('change', (e) => {
                this.setCurrency(e.target.value);
            });
        });
    }
};

// Arrancar listener de selector de moneda
document.addEventListener('DOMContentLoaded', () => {
    CurrencyManager.initSelector();
});

// Exponer de forma global para usarlo en app.js y otros scripts
window.CurrencyManager = CurrencyManager;


