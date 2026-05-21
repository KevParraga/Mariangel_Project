// ===============================
// REGISTRO.JS COMPLETO CORREGIDO
// ===============================

console.log('✅ Registro con validación de sentido común activado');

const patterns = {

    firstName: /^(?!.*(.)\1\1)[a-zA-ZáéíóúÁÉÍÓÚñÑ ]{3,20}$/,

    lastName: /^(?!.*(.)\1\1)[a-zA-ZáéíóúÁÉÍÓÚñÑ ]{3,20}$/,

    email: /^[a-zA-Z0-9._%+-]+@(gmail|hotmail|outlook|yahoo|icloud)\.(com|net|org|es)$/,

    phone: /^(0414|0424|0412|0416|0426|0212)\d{7}$/,

    password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
};


// ===============================
// FOTO DE PERFIL
// ===============================

let selectedProfileImage = '';

const profilePhoto = document.getElementById('profilePhoto');

if (profilePhoto) {

    profilePhoto.addEventListener('change', function(e) {

        const file = e.target.files[0];

        if (!file) return;

        const reader = new FileReader();

        reader.onload = function(ev) {

            selectedProfileImage = ev.target.result;

            const preview =
                document.getElementById('profilePreview');

            preview.innerHTML = `
                <img src="${selectedProfileImage}"
                style="
                    width:100%;
                    height:100%;
                    object-fit:cover;
                    border-radius:50%;
                ">
            `;
        };

        reader.readAsDataURL(file);

    });

}


// ===============================
// VALIDAR CÉDULA
// ===============================

function validateCedulaHuman(cedula) {

    if (!/^\d{7,8}$/.test(cedula)) return false;

    if (/^(\d)\1+$/.test(cedula)) return false;

    const secuencia = "1234567890";

    if (
        secuencia.includes(cedula) ||
        "0987654321".includes(cedula)
    ) return false;

    return true;
}


// ===============================
// VALIDAR CAMPOS
// ===============================

const validateField = (input) => {

    const errorSpan =
        document.getElementById(`${input.id}Error`);

    let isValid = false;

    if (input.id === 'cedula') {

        isValid = validateCedulaHuman(input.value);

    } else if (input.id === 'terms') {

        isValid = input.checked;

    } else if (patterns[input.id]) {

        isValid = patterns[input.id]
            .test(input.value.trim());

    }

    if (isValid) {

        input.style.borderColor = "#22c55e";

        errorSpan.innerHTML = 'Listo ✔️';

        errorSpan.style.color = "#22c55e";

        errorSpan.style.display = "block";

    } else {

        if (input.type !== 'checkbox') {
            input.style.borderColor = "#ef4444";
        }

        errorSpan.innerHTML =
            input.id === 'terms'
            ? 'Debes aceptar los términos ❌'
            : 'Dato inválido ❌';

        errorSpan.style.color = "#ef4444";

        errorSpan.style.display = "block";
    }

    return isValid;
};


// ===============================
// VALIDACIÓN EN TIEMPO REAL
// ===============================

document.querySelectorAll('#registerForm input')
.forEach(input => {

    input.addEventListener('input', () => {

        validateField(input);

    });

});


// ===============================
// REGISTRO
// ===============================

document.getElementById('registerForm')
.addEventListener('submit', async function(e) {

    e.preventDefault();

    const allInputs = Array.from(
        document.querySelectorAll(
            '#registerForm input:not([type="file"])'
        )
    );

    const formIsValid = allInputs.every(input => {

        if (input.id === 'terms') {
            return input.checked;
        }

        return validateField(input);

    });

    if (!formIsValid) {

        alert(
            "Por favor corrige los errores ❌"
        );

        return;
    }

    const btn =
        document.getElementById('registerBtn');

    btn.disabled = true;

    btn.innerHTML =
        'Conectando con servidor...';


    // ===============================
    // NUEVO USUARIO
    // ===============================

    const newUser = {
        firstName: document.getElementById('firstName').value,
        lastName: document.getElementById('lastName').value,
        email: document.getElementById('email').value.toLowerCase(),
        password: document.getElementById('password').value,
        cedula: document.getElementById('cedula').value,
        phone: document.getElementById('phone').value,
        profilePic: selectedProfileImage
    };

    try {
        const response = await fetch(window.location.origin + '/Ecosistema academico/api_register.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(newUser)
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
            throw new Error(result.error || 'No se pudo registrar el usuario.');
        }

        alert('¡Registro completado correctamente! ✔️');
        window.location.href = 'Login.html';
    } catch (err) {
        alert('Error de conexión: ' + err.message);
        btn.disabled = false;
        btn.innerHTML = 'Crear Mi Cuenta';
    }
});