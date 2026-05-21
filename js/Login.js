// ===============================
// LOGIN.JS COMPLETO CORREGIDO
// ===============================

console.log('✅ Sistema de Login EcoAcademia Preparado');

document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    // Captura de datos
    const email = document.getElementById('loginEmail').value.trim().toLowerCase();
    const pass = document.getElementById('loginPassword').value;

    const btn = e.target.querySelector('button');
    const errorMsg = document.getElementById('loginPasswordError');

    // Limpiar errores
    errorMsg.style.display = 'none';

    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verificando...';

    try {
        const response = await fetch(window.location.origin + '/Ecosistema academico/api_login.php', {
            method: 'POST',
            credentials: 'same-origin',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password: pass })
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
            throw new Error(result.error || 'El correo o la contraseña son incorrectos. ❌');
        }

        // Guardar usuario actual para el dashboard
        sessionStorage.setItem('active_session', 'true');
        localStorage.setItem('current_user', JSON.stringify(result.user));

        btn.innerHTML = '<i class="fas fa-check"></i> ¡Bienvenido!';
        btn.style.backgroundColor = '#22c55e';

        const role = (result.user && result.user.role) ? String(result.user.role).toLowerCase() : 'user';
        let destino = 'dashboard.html';
        if (role === 'admin') destino = 'panel_admin.php';
        else if (role === 'enfermera' || role === 'psicologa') destino = 'panel_salud.php';

        setTimeout(() => {
            window.location.href = destino;
        }, 800);
    } catch (error) {

        btn.disabled = false;

        btn.innerHTML = `
            <span>Iniciar Sesión</span>
            <i class="fas fa-arrow-right"></i>
        `;

        errorMsg.textContent = error.message;
        errorMsg.style.display = 'block';

        document.getElementById('loginPassword')
            .classList.add('shake');

        setTimeout(() => {
            document.getElementById('loginPassword')
                .classList.remove('shake');
        }, 500);
    }
});


// ===============================
// TABS LOGIN / RECUPERAR
// ===============================

const tabs = document.querySelectorAll('.tab-btn');
const forms = document.querySelectorAll('.auth-form');

tabs.forEach(tab => {

    tab.addEventListener('click', () => {

        tabs.forEach(t => t.classList.remove('active'));

        tab.classList.add('active');

        forms.forEach(f => f.classList.remove('active'));

        const targetForm =
            document.getElementById(`${tab.dataset.tab}Form`);

        targetForm.classList.add('active');

    });

});