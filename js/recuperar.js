document.addEventListener('DOMContentLoaded', () => {
    const recoverForm = document.getElementById('recoverForm');
    const recoverEmail = document.getElementById('recoverEmail');
    const recoverEmailError = document.getElementById('recoverEmailError');

    if (recoverForm) {
        recoverForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            // Limpiar errores previos
            recoverEmailError.textContent = '';
            recoverEmail.style.borderColor = '#e2e8f0';

            const emailValue = recoverEmail.value.trim();

            // Validación básica de lado del cliente
            if (!validateEmail(emailValue)) {
                showError("Por favor, ingresa un correo electrónico válido.");
                return;
            }

            // Cambiar estado del botón para feedback visual
            const submitBtn = recoverForm.querySelector('button');
            const originalContent = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';

            try {
                // AQUÍ IRÁ TU LLAMADA A LA BASE DE DATOS EN EL FUTURO
                // Ejemplo: const response = await fetch('api/recuperar.php', { method: 'POST', ... });
                
                // Simulamos una espera de red de 2 segundos
                setTimeout(() => {
                    alert(`✅ Se ha enviado un enlace de recuperación a: ${emailValue}. Por favor, revisa tu bandeja de entrada.`);
                    
                    // Resetear formulario y botón
                    recoverForm.reset();
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = originalContent;
                    
                    // Opcional: Volver a la pestaña de login después de enviar
                    document.querySelector('[data-tab="login"]').click();
                }, 2000);

            } catch (error) {
                showError("Ocurrió un error al procesar la solicitud. Intenta más tarde.");
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalContent;
            }
        });
    }

    function validateEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    function showError(message) {
        recoverEmailError.textContent = message;
        recoverEmailError.style.color = "#ef4444";
        recoverEmailError.style.fontSize = "0.8rem";
        recoverEmailError.style.marginTop = "5px";
        recoverEmail.style.borderColor = "#ef4444";
    }
});