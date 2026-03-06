/**
 * js/perfil.js - Manejo de la configuración del Perfil de Usuario
 */

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Verificar Autenticación
    const auth = window.novaAuth;
    if (!auth || !auth.user || !auth.user.user) {
        window.location.href = 'index.html'; // No logged in
        return;
    }

    const email = auth.user.user.email;
    document.getElementById('perfilEmail').value = email;

    const form = document.getElementById('perfilForm');
    const loadingOverlay = document.getElementById('loadingOverlay');
    const errorBox = document.getElementById('errorBox');
    const errorText = document.getElementById('errorText');
    const btnGuardar = document.getElementById('btnGuardarPerfil');

    // 2. Cargar Perfil Existente (si hay)
    try {
        const perfil = await obtenerPerfilCliente(email);
        if (perfil) {
            document.getElementById('perfilNombres').value = perfil.nombres || '';
            document.getElementById('perfilApellidos').value = perfil.apellidos || '';
            document.getElementById('perfilTelefono').value = perfil.telefono || '';
            document.getElementById('perfilDocumento').value = perfil.documento || '';
            document.getElementById('perfilDireccion').value = perfil.direccion || '';
        } else {
            // Intenta extraer el nombre del auth metadata si es cuenta nueva
            const metaName = auth.user.user.user_metadata?.name || '';
            if (metaName) {
                const parts = metaName.split(' ');
                document.getElementById('perfilNombres').value = parts[0] || '';
                if (parts.length > 1) {
                    document.getElementById('perfilApellidos').value = parts.slice(1).join(' ');
                }
            }
        }
    } catch (e) {
        console.error("No se pudo cargar el perfil:", e);
    } finally {
        // Quitar overlay de carga
        loadingOverlay.classList.add('opacity-0', 'pointer-events-none');
        setTimeout(() => loadingOverlay.remove(), 300);
    }

    // 3. Manejar el Guardado
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        errorBox.classList.add('hidden');

        const originalText = btnGuardar.innerHTML;
        btnGuardar.innerHTML = '<span class="material-symbols-outlined animate-spin">sync</span> Guardando...';
        btnGuardar.disabled = true;
        btnGuardar.classList.add('opacity-70', 'cursor-not-allowed');

        const datosCliente = {
            email: email, // la Primary key para el upsert (on_conflict)
            nombres: document.getElementById('perfilNombres').value.trim(),
            apellidos: document.getElementById('perfilApellidos').value.trim(),
            telefono: document.getElementById('perfilTelefono').value.trim(),
            documento: document.getElementById('perfilDocumento').value.trim(),
            direccion: document.getElementById('perfilDireccion').value.trim(),
            estado: true
        };

        try {
            await upsertPerfilCliente(datosCliente);

            // Actualizar la interfaz y mostrar success
            btnGuardar.innerHTML = originalText;
            btnGuardar.disabled = false;
            btnGuardar.classList.remove('opacity-70', 'cursor-not-allowed');

            // Actualizar el nombre en la barra de navegación inmediatamente
            if (window.novaAuth) {
                window.novaAuth.userProfileName = datosCliente.nombres.split(' ')[0];
                window.novaAuth.updateUI();
            }

            if (window.pixelConfirm) {
                await pixelConfirm('Tu perfil ha sido actualizado y guardado correctamente en la base de datos.', {
                    titulo: '✅ Perfil Guardado',
                    btnConfirm: 'OK',
                    tipo: 'info'
                });
            } else {
                alert('Perfil actualizado con éxito');
            }

        } catch (error) {
            errorBox.classList.remove('hidden');
            errorText.textContent = error.message;
            btnGuardar.innerHTML = originalText;
            btnGuardar.disabled = false;
            btnGuardar.classList.remove('opacity-70', 'cursor-not-allowed');
        }
    });
});
