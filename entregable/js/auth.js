/**
 * JS/Auth.js - AutenticaciÃ³n con Supabase
 * Maneja el registro, inicio de sesiÃ³n y persistencia del usuario.
 */

class AuthManager {
    constructor() {
        this.supabaseUrl = SUPABASE_URL; // Viene de api.js
        this.supabaseKey = SUPABASE_KEY; // Viene de api.js
        this.sessionKey = 'WearStore_session';
        this.user = this.getSession();
        this._refreshing = false;

        // Auto-refresh si el token está expirado
        this._tryAutoRefresh();

        this.initUI();
    }

    /**
     * Obtiene la sesiÃ³n actual desde localStorage
     */
    getSession() {
        const session = localStorage.getItem(this.sessionKey);
        return session ? JSON.parse(session) : null;
    }

    /**
     * Verifica si el usuario actual es administrador
     */
    isAdmin() {
        if (!this.user || !this.user.user) return false;
        const adminMails = ['danieltijaro28@gmail.com', 'prueba123@gmail.com'];
        return adminMails.includes(this.user.user.email);
    }

    /**
     * Guarda la nueva sesiÃ³n y actualiza el estado interno
     */
    setSession(sessionData) {
        localStorage.setItem(this.sessionKey, JSON.stringify(sessionData));
        this.user = sessionData;
        this.updateUI();
    }

    /**
     * Intenta refrescar el token automáticamente si está expirado
     */
    async _tryAutoRefresh() {
        if (!this.user) return;
        // Verificar si el token JWT ha expirado
        const session = this.user.session || this.user;
        const accessToken = session.access_token;
        const refreshToken = session.refresh_token;
        if (!accessToken || !refreshToken) return;

        try {
            // Decodificar JWT para ver si expiró (payload es la 2da parte base64)
            const payload = JSON.parse(atob(accessToken.split('.')[1]));
            const expiresAt = payload.exp * 1000; // a ms
            const now = Date.now();
            // Si expira en menos de 60 segundos, refrescar
            if (now > expiresAt - 60000) {
                console.log('Token expirado o por expirar, refrescando...');
                await this.refreshSession(refreshToken);
            }
        } catch (e) {
            console.warn('No se pudo verificar expiración del token:', e);
        }
    }

    /**
     * Refresca la sesión usando el refresh_token de Supabase
     */
    async refreshSession(refreshToken) {
        if (this._refreshing) return;
        this._refreshing = true;
        try {
            const response = await fetch(`${this.supabaseUrl}/auth/v1/token?grant_type=refresh_token`, {
                method: 'POST',
                headers: {
                    'apikey': this.supabaseKey,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ refresh_token: refreshToken })
            });

            if (!response.ok) {
                console.error('Refresh token falló, cerrando sesión');
                this.logout();
                return;
            }

            const data = await response.json();
            this.setSession(data);
            console.log('Sesión refrescada exitosamente');
        } catch (err) {
            console.error('Error refrescando sesión:', err);
        } finally {
            this._refreshing = false;
        }
    }

    /**
     * Cierra la sesión
     */
    logout() {
        localStorage.removeItem(this.sessionKey);
        this.user = null;
        // Redirigir al inicio inmediatamente en lugar de recargar en el mismo sitio
        window.location.href = 'index.html';
    }

    /**
     * Iniciar SesiÃ³n (Email & Password)
     */
    async login(email, password) {
        try {
            const response = await fetch(`${this.supabaseUrl}/auth/v1/token?grant_type=password`, {
                method: 'POST',
                headers: {
                    'apikey': this.supabaseKey,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (!response.ok) {
                if (data.error_code === 'email_not_confirmed' || data.msg === 'Email not confirmed') {
                    throw new Error('Revisa tu bandeja de entrada: hemos enviado un correo para confirmar tu cuenta antes de iniciar sesiÃ³n.');
                }
                const errorMsg = data.message || data.error_description || data.msg || 'Error al iniciar sesiÃ³n';
                // Traducir mensajes comunes de Supabase al espaÃ±ol para mejor UX
                if (errorMsg === 'Invalid login credentials') {
                    throw new Error('Correo o contraseÃ±a incorrectos.');
                }
                throw new Error(errorMsg);
            }

            this.setSession(data);
            return data;
        } catch (error) {
            console.error('Login Error:', error);
            throw error;
        }
    }

    /**
     * Registro de nuevo usuario
     */
    async register(email, password, displayName = '') {
        try {
            const response = await fetch(`${this.supabaseUrl}/auth/v1/signup`, {
                method: 'POST',
                headers: {
                    'apikey': this.supabaseKey,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email,
                    password,
                    data: { name: displayName }
                })
            });

            const data = await response.json();

            if (!response.ok) {
                const errorMsg = data.message || data.error_description || data.msg || 'Error al registrar la cuenta';
                throw new Error(errorMsg);
            }

            // Si Supabase devuelve un objeto user en data (y no data.session), es porque requiere confirmación.
            if (!data.session && data.user) {
                throw new Error('¡Registro exitoso! Por favor ve a tu correo electrónico y haz clic en el enlace para confirmar tu cuenta y poder iniciar sesión.');
            }

            if (data.session) {
                this.setSession(data.session);
            }
            return data;
        } catch (error) {
            console.error('Register Error:', error);
            throw error;
        }
    }

    /**
     * Inicializa eventos y elementos UI que dependen del Auth
     */
    initUI() {
        // Mejor soporte para móviles y clicks dentro de elementos
        document.addEventListener('click', (e) => {
            const logoutBtn = e.target.closest('#btnLogout');
            if (logoutBtn) {
                e.preventDefault();
                e.stopPropagation();
                this.logout();
            }
        });

        // Actualizar visualmente la barra al cargar
        this.updateUI();

        // Intentar obtener el nombre real desde la base de datos para la barra de navegación
        if (this.user && this.user.user && typeof window.obtenerPerfilCliente === 'function') {
            window.obtenerPerfilCliente(this.user.user.email).then(perfil => {
                if (perfil && perfil.nombres) {
                    this.userProfileName = perfil.nombres.split(' ')[0]; // Mostrar solo el primer nombre
                    this.updateUI();
                }
            }).catch(e => console.warn('Aviso: Cargando perfil para navbar', e));
        }
    }

    /**
     * Cambia la barra de navegaciÃ³n basado en el estado
     */
    updateUI() {
        const authContainers = document.querySelectorAll('.auth-container-ui');

        authContainers.forEach(container => {
            if (this.user && this.user.user) {
                // Usuario Logeado
                let userName = 'Account';
                if (this.userProfileName) {
                    userName = this.userProfileName;
                } else if (this.user.user.user_metadata && this.user.user.user_metadata.name) {
                    userName = this.user.user.user_metadata.name.split(' ')[0];
                } else if (this.user.user.email) {
                    userName = this.user.user.email.split('@')[0];
                }

                container.innerHTML = `
                    <div class="relative cursor-pointer group flex flex-col items-start leading-tight">
                        <span class="text-xs text-slate-300">Hola, ${userName}</span>
                        <div class="flex items-center gap-1">
                            <span class="text-sm font-bold">Mi Cuenta</span>
                            <span class="material-symbols-outlined text-[1rem]">arrow_drop_down</span>
                        </div>
                        
                        <!-- Dropdown menu -->
                        <div class="absolute top-10 right-0 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 overflow-hidden text-slate-900 dark:text-white pointer-events-none group-hover:pointer-events-auto">
                            <div class="p-3 border-b border-slate-100 dark:border-slate-800">
                                <p class="font-bold text-sm truncate">${this.user.user.email}</p>
                            </div>
                            <ul class="py-2 text-sm z-50 relative">
                                <li><a href="perfil.html" class="block px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-800">Tu Perfil</a></li>
                                <li><a href="#" class="block px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-800">Tus Pedidos</a></li>
                                ${this.isAdmin() ? '<li><a href="admin.html" class="block px-4 py-2 text-primary font-bold hover:bg-slate-100 dark:hover:bg-slate-800">Panel Admin</a></li>' : ''}
                                <li><button id="btnLogout" type="button" class="w-full text-left px-4 py-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 cursor-pointer">Cerrar Sesión</button></li>
                            </ul>
                        </div>
                    </div>
                `;
            } else {
                // No Logeado
                container.innerHTML = `
                    <a href="index.html" class="flex flex-col items-start leading-tight cursor-pointer hover:underline cursor-not-allowed">
                        <span class="text-xs text-slate-300">Hola, ${userName}</span>
                        <span class="text-sm font-bold">Mi Cuenta</span>
                    </a>
                `;
            }
        });
    }
}

// Instanciar Auth Manager globalmente
window.novaAuth = new AuthManager();



