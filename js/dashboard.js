// Dashboard Manager Principal - EcoAcademia
// Versión corregida: Materias añadidas (Interfaz Web, Bases de Datos)
// Barra de estrés y fatiga con máximo 100% (corregido)

// Lista de materias válidas actualizada
const materiasValidas = [
    "Matemáticas", "Física", "Química", "Biología", "Lengua y Literatura",
    "Historia", "Geografía", "Inglés", "Programación", "Arte",
    "Educación Física", "Filosofía", "Ética", "Economía", "Contabilidad",
    "Interfaz Web", "Bases de Datos"
];

function normalizeMateria(raw, index) {
    return {
        id: raw.id || Date.now() + index,
        n: raw.n || raw.nombre || raw.materia || '',
        seccion: raw.seccion || raw.section || '',
        tipo: raw.tipo || raw.tipoActividad || raw.type || '',
        d: raw.d || raw.dia || raw.day || '',
        horaInicio: raw.horaInicio || raw.inicio || raw.start || '',
        horaFin: raw.horaFin || raw.fin || raw.end || '',
        duracion: Number(raw.duracion ?? raw.duration ?? 0)
    };
}

function getCurrentUserEmail() {
    try {
        const user = JSON.parse(localStorage.getItem('current_user')) || {};
        return (user.email || 'anon').toString().trim().toLowerCase();
    } catch (err) {
        return 'anon';
    }
}

function getUserKey(baseKey) {
    return `${baseKey}_${getCurrentUserEmail()}`;
}

function loadMaterias() {
    const stored = JSON.parse(localStorage.getItem(getUserKey('db_materias'))) || [];
    const normalized = stored.map((m, index) => normalizeMateria(m, index));
    if (JSON.stringify(normalized) !== JSON.stringify(stored)) {
        localStorage.setItem(getUserKey('db_materias'), JSON.stringify(normalized));
    }
    return normalized;
}

function mapServerMateriaToLocal(m) {
    return {
        id: m.id,
        serverId: m.id,
        n: m.nombre || '',
        seccion: m.seccion || '',
        tipo: m.tipo || '',
        d: m.dia || '',
        horaInicio: m.hora_inicio || '',
        horaFin: m.hora_fin || '',
        duracion: Number(m.duracion ?? 0)
    };
}

async function fetchMateriasFromServer() {
    const currentUser = JSON.parse(localStorage.getItem('current_user')) || {};
    const email = currentUser.email;
    if (!email) return false;

    try {
        const response = await fetch(window.location.origin + '/Ecosistema academico/api_materias.php?email=' + encodeURIComponent(email), {
            method: 'GET',
            credentials: 'same-origin'
        });
        const json = await response.json();

        if (response.ok && json.success) {
            materias = (json.records || []).map(mapServerMateriaToLocal);
            localStorage.setItem(getUserKey('db_materias'), JSON.stringify(materias));
            return true;
        }
    } catch (error) {
        console.warn('No se pudo sincronizar materias con el servidor:', error);
    }
    return false;
}

async function saveMateriaToServer(materia) {
    const currentUser = JSON.parse(localStorage.getItem('current_user')) || {};
    const payload = {
        email: currentUser.email,
        cedula: currentUser.cedula || '',
        nombre: materia.n,
        seccion: materia.seccion,
        tipo: materia.tipo,
        dia: materia.d,
        horaInicio: materia.horaInicio,
        horaFin: materia.horaFin
    };
    if (materia.serverId) {
        payload.id = materia.serverId;
    }

    const response = await fetch(window.location.origin + '/Ecosistema academico/api_materias.php', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    const json = await response.json();

    if (!response.ok || !json.success) {
        throw new Error(json.error || 'Error al guardar la materia en el servidor');
    }

    if (Array.isArray(json.records)) {
        materias = json.records.map(mapServerMateriaToLocal);
        localStorage.setItem(getUserKey('db_materias'), JSON.stringify(materias));
    }

    return json;
}

async function deleteMateriaFromServer(id) {
    const materia = materias.find(x => x.id === id);
    if (!materia || !materia.serverId) {
        materias = materias.filter(x => x.id !== id);
        localStorage.setItem(getUserKey('db_materias'), JSON.stringify(materias));
        return { success: true, message: 'Materia eliminada localmente' };
    }

    const response = await fetch(window.location.origin + '/Ecosistema academico/api_materias.php', {
        method: 'DELETE',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: materia.serverId })
    });
    const json = await response.json();

    if (!response.ok || !json.success) {
        throw new Error(json.error || 'Error al eliminar la materia en el servidor');
    }

    if (Array.isArray(json.records)) {
        materias = json.records.map(mapServerMateriaToLocal);
        localStorage.setItem(getUserKey('db_materias'), JSON.stringify(materias));
    }

    return json;
}

let materias = loadMaterias();
let notasAlumnos = JSON.parse(localStorage.getItem('db_notas')) || [];
let nivelCargaGlobal = 0;
let bienestarHoy = null;
let bienestarUltimoRegistro = null;
let bienestarHistorial = [];
let currentCvObjectURL = null;

// ==================== FUNCIONES DE ALERTA ====================
function showAlert(message, type = 'info') {
    document.querySelectorAll('.alert-high-contrast').forEach(alert => {
        alert.style.animation = 'slideOut 0.3s ease-in forwards';
        setTimeout(() => alert.remove(), 300);
    });

    const alert = document.createElement('div');
    alert.className = 'alert-high-contrast';
    
    const icons = {
        success: 'check-circle',
        error: 'exclamation-triangle',
        info: 'info-circle',
        warning: 'exclamation'
    };
    
    alert.innerHTML = `
        <div style="display: flex; align-items: center; gap: 0.75rem;">
            <i class="fas fa-${icons[type] || 'info-circle'}" style="font-size: 1.25rem;"></i>
            <span style="flex: 1; font-weight: 600;">${message}</span>
            <button title="Cerrar" style="font-size: 1.25rem;">×</button>
        </div>
    `;
    
    alert.querySelector('button').onclick = () => {
        alert.style.animation = 'slideOut 0.3s ease-in forwards';
        setTimeout(() => alert.remove(), 300);
    };
    
    document.body.appendChild(alert);
    
    setTimeout(() => {
        if (alert.parentNode) {
            alert.style.animation = 'slideOut 0.3s ease-in forwards';
            setTimeout(() => alert.remove(), 300);
        }
    }, 4000);
}

function getLocalDateString() {
    const hoy = new Date();
    const year = hoy.getFullYear();
    const month = String(hoy.getMonth() + 1).padStart(2, '0');
    const day = String(hoy.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

async function fetchBienestarData() {
    const currentUser = JSON.parse(localStorage.getItem('current_user')) || {};
    const email = currentUser.email;
    if (!email) return;

    try {
        const today = getLocalDateString();
        const response = await fetch(window.location.origin + '/Ecosistema academico/api_bienestar.php?email=' + encodeURIComponent(email) + '&date=' + encodeURIComponent(today), {
            method: 'GET',
            credentials: 'same-origin'
        });
        const data = await response.json();
        if (response.ok && data.success) {
            bienestarHistorial = data.records || [];
            bienestarHoy = data.todayRecord || null;
            bienestarUltimoRegistro = bienestarHoy ? bienestarHoy : (bienestarHistorial.length ? bienestarHistorial[0] : null);
            nivelCargaGlobal = bienestarUltimoRegistro ? bienestarUltimoRegistro.nivel_carga : 0;
        }
    } catch (error) {
        console.warn('No se pudo cargar la información de bienestar diario:', error);
    }
}

function puedeRealizarTestBienestar() {
    if (!bienestarHoy) return true;
    const hoy = getLocalDateString();
    return bienestarHoy.fecha !== hoy;
}

async function guardarBienestarDiario(scoreEmo, scoreFis, nivelCarga) {
    const currentUser = JSON.parse(localStorage.getItem('current_user')) || {};
    const email = currentUser.email;
    if (!email) return false;

    try {
        const payload = {
            email,
            fecha: getLocalDateString(),
            scoreEmo,
            scoreFis,
            nivelCarga,
            tipo: 'integral'
        };

        const response = await fetch(window.location.origin + '/Ecosistema academico/api_bienestar.php', {
            method: 'POST',
            credentials: 'same-origin',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const json = await response.json();
        if (response.ok && json.success) {
            bienestarHoy = json.todayRecord || null;
            bienestarHistorial = json.records || [];
            bienestarUltimoRegistro = bienestarHoy ? bienestarHoy : (bienestarHistorial.length ? bienestarHistorial[0] : null);
            nivelCargaGlobal = bienestarUltimoRegistro ? bienestarUltimoRegistro.nivel_carga : 0;
            registrarAccionAutomatica(`Bienestar diario guardado en bitácora: nivel de carga ${nivelCarga}%, Emocional ${scoreEmo}, Físico ${scoreFis}.`);
            if (typeof renderBitacora === 'function') renderBitacora();
            if (typeof renderizarBitacoraCompleta === 'function') renderizarBitacoraCompleta();
            showAlert('Test de bienestar guardado con éxito.', 'success');
            return true;
        }

        showAlert('No se pudo guardar el test diario: ' + (json.error || 'Error inesperado'), 'error');
    } catch (error) {
        showAlert('No se pudo guardar el test diario: ' + error.message, 'error');
    }

    return false;
}

function mostrarBienestarHoyEnBitacora() {
    const contenedor = document.getElementById('bitacora-content');
    if (!contenedor || !bienestarHoy) return;

    const div = document.createElement('div');
    div.className = 'bitacora-item';
    div.style.borderLeft = '4px solid #2563eb';
    div.style.background = '#eff6ff';
    div.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center;">
            <strong><i class="fas fa-heart-pulse"></i> 🗒️ Bienestar Diario</strong>
            <span style="font-size:0.8rem;">${bienestarHoy.fecha}</span>
        </div>
        <p style="margin:10px 0 0 0;">Test guardado. Nivel de carga: <strong>${bienestarHoy.nivel_carga}%</strong>. Emocional: <strong>${bienestarHoy.score_emo}</strong>, Físico: <strong>${bienestarHoy.score_fis}</strong>.</p>
    `;

    contenedor.prepend(div);
}

// ==================== NAVEGACIÓN Y MENÚ ====================
const toggleSidebarBtn = document.getElementById('toggleSidebarBtn');
const sidebarMenu = document.getElementById('sidebarMenu');
const sidebarOverlay = document.getElementById('sidebarOverlay');

function abrirCerrarMenu() {
    sidebarMenu.classList.toggle('open');
    sidebarOverlay.classList.toggle('active');
    
    const icono = toggleSidebarBtn.querySelector('i');
    if (sidebarMenu.classList.contains('open')) {
        icono.classList.remove('fa-bars');
        icono.classList.add('fa-xmark');
    } else {
        icono.classList.remove('fa-xmark');
        icono.classList.add('fa-bars');
    }
}

if(toggleSidebarBtn) toggleSidebarBtn.addEventListener('click', abrirCerrarMenu);
if(sidebarOverlay) sidebarOverlay.addEventListener('click', abrirCerrarMenu);

// ==================== PERFIL ====================
async function fetchServerUser() {
    try {
        const response = await fetch(window.location.origin + '/Ecosistema academico/api_profile.php', {
            method: 'GET',
            credentials: 'same-origin'
        });
        const json = await response.json();

        if (response.ok && json.success && json.user) {
            localStorage.setItem('current_user', JSON.stringify(json.user));
            return json.user;
        }
    } catch (error) {
        console.warn('No se pudo cargar el perfil desde el servidor:', error);
    }
    return null;
}

function load() {
    const user = JSON.parse(localStorage.getItem('current_user'));
    const userToLoad = user || {
        firstName: "Carlos",
        lastName: "Mendoza",
        email: "carlos.mendoza@ecoacademia.edu",
        especialidad: "Ingeniería de Sistemas",
        bio: "Docente apasionado por la tecnología y la educación.",
        profilePic: "https://ui-avatars.com/api/?name=Carlos+Mendoza&background=3b82f6&color=fff"
    };

    const firstName = userToLoad.firstName || userToLoad.first_name || '';
    const lastName = userToLoad.lastName || userToLoad.last_name || '';
    const pic = userToLoad.profilePic || userToLoad.profile_pic || `https://ui-avatars.com/api/?name=${firstName}+${lastName}&background=3b82f6&color=fff`;

    document.getElementById('p-name').value = firstName;
    document.getElementById('p-lastname').value = lastName;
    document.getElementById('p-email').value = userToLoad.email || '';
    document.getElementById('p-esp').value = userToLoad.especialidad || "";
    document.getElementById('p-bio').value = userToLoad.bio || "";
    document.getElementById('sideFullName').textContent = `${firstName} ${lastName}`;
    document.getElementById('sideProfilePic').src = pic;
    document.getElementById('bigProfilePic').src = pic;
    renderCVPreview();
}

function saveProfile() {
    const stored = JSON.parse(localStorage.getItem('current_user')) || {};
    const payload = {
        firstName: document.getElementById('p-name').value,
        lastName: document.getElementById('p-lastname').value,
        especialidad: document.getElementById('p-esp').value,
        bio: document.getElementById('p-bio').value,
        email: stored.email || null
    };

    fetch(window.location.origin + '/Ecosistema academico/api_update_profile.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify(payload)
    }).then(r => r.json()).then(j => {
        if (!j || !j.success) throw new Error(j.error || 'Error al actualizar');
        localStorage.setItem('current_user', JSON.stringify(j.user));
        showAlert('Perfil actualizado correctamente', 'success');
        load();
    }).catch(err => {
        showAlert('Error al guardar perfil: ' + err.message, 'error');
    });
}

async function handleCVChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    const preview = document.getElementById('cvPreview');
    const fileNameLabel = document.getElementById('cvFileName');
    if (fileNameLabel) fileNameLabel.textContent = file.name;
    if (preview) preview.innerHTML = '<p style="margin:0; color:#64748b;">Subiendo hoja de vida...</p>';

    const form = new FormData();
    form.append('cv', file);
    const user = JSON.parse(localStorage.getItem('current_user')) || {};
    if (user.email) form.append('email', user.email);
    try {
        const resp = await fetch(window.location.origin + '/Ecosistema academico/upload_cv.php', {
            method: 'POST',
            body: form,
            credentials: 'same-origin'
        });
        const j = await resp.json();
        if (!resp.ok || !j.success) throw new Error(j.error || 'Upload failed');
        const user = JSON.parse(localStorage.getItem('current_user')) || {};
        user.cvUrl = j.url;
        user.cvName = file.name;
        delete user.cvData;
        localStorage.setItem('current_user', JSON.stringify(user));
        renderCVPreview();
        showAlert('Hoja de vida subida correctamente', 'success');
    } catch (err) {
        if (preview) preview.innerHTML = '<p style="margin:0; color:#b91c1c;">Error al subir el archivo.</p>';
        showAlert('Error al subir la hoja de vida: ' + err.message, 'error');
    }
}

function initializeFileInputs() {
    const fileInput = document.getElementById('fileInput');
    const cvInput = document.getElementById('cvInput');

    if (fileInput) {
        fileInput.addEventListener('change', async function(e) {
            const f = e.target.files[0];
            if (!f) return;
            const user = JSON.parse(localStorage.getItem('current_user')) || {};
            const form = new FormData();
            form.append('profile_pic', f);
            if (user.email) form.append('email', user.email);
            try {
                const resp = await fetch(window.location.origin + '/Ecosistema academico/upload_profile_pic.php', {
                    method: 'POST',
                    body: form,
                    credentials: 'same-origin'
                });
                const j = await resp.json();
                if (!resp.ok || !j.success) throw new Error(j.error || 'Upload failed');
                const user2 = JSON.parse(localStorage.getItem('current_user')) || {};
                user2.profilePic = j.url;
                localStorage.setItem('current_user', JSON.stringify(user2));
                load();
                showAlert('Foto de perfil actualizada', 'success');
            } catch (err) {
                showAlert('Error al subir la foto: ' + err.message, 'error');
            }
        });
    }

    if (cvInput) {
        cvInput.addEventListener('change', handleCVChange);
    }
}

function getFileTypeFromName(fileName) {
    const extension = fileName.split('.').pop().toLowerCase();
    switch (extension) {
        case 'pdf': return 'application/pdf';
        case 'txt': return 'text/plain';
        case 'doc': return 'application/msword';
        case 'docx': return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        default: return 'application/octet-stream';
    }
}

function renderCVPreview() {
    const preview = document.getElementById('cvPreview');
    const fileNameLabel = document.getElementById('cvFileName');
    if (!preview || !fileNameLabel) return;

    const user = JSON.parse(localStorage.getItem('current_user')) || {};
    const { cvName, cvData, cvType, cvUrl } = user;

    fileNameLabel.textContent = cvName ? cvName : 'Ningún archivo seleccionado';

    // prefer server URL if available
    if (!cvData && !cvUrl) {
        preview.innerHTML = '<p style="margin:0; color:#64748b;">Aquí aparecerá la vista previa de tu hoja de vida cuando la cargues.</p>';
        return;
    }

    const nameLower = cvName ? cvName.toLowerCase() : '';
    const urlLower = cvUrl ? cvUrl.toLowerCase() : '';
    const isPdf = cvType === 'application/pdf' || nameLower.endsWith('.pdf') || urlLower.endsWith('.pdf');
    const isText = (cvType && cvType.startsWith('text/')) || nameLower.endsWith('.txt') || urlLower.endsWith('.txt');

    if (isPdf) {
        const src = cvUrl || currentCvObjectURL || cvData;
        preview.innerHTML = `<iframe src="${src}" style="width:100%; height:320px; border:none; border-radius:12px;"></iframe>`;
    } else if (isText && cvData) {
        try {
            const decoded = atob(cvData.split(',')[1]);
            preview.innerHTML = `<pre style="white-space:pre-wrap; word-break:break-word; margin:0; font-size:0.95rem;">${decoded}</pre>`;
        } catch (error) {
            preview.innerHTML = `<div style="color:#b91c1c;">No se pudo mostrar el contenido del archivo de texto.</div>`;
        }
    } else if (cvUrl) {
        preview.innerHTML = `<div style="display:flex; flex-direction:column; gap:10px;">
            <div><strong>Archivo:</strong> ${cvName || 'Documento'}</div>
            <a href="${cvUrl}" target="_blank" rel="noopener" style="color:#2563eb;">Abrir archivo</a>
        </div>`;
    } else {
        preview.innerHTML = `<div style="display:flex; flex-direction:column; gap:10px;">
            <div><strong>Archivo:</strong> ${cvName}</div>
            <div style="color:#475569;">Vista previa no disponible para este tipo de archivo. Puedes abrirlo desde tu dispositivo.</div>
        </div>`;
    }
}

if (document.readyState !== 'loading') {
    initializeFileInputs();
    renderCVPreview();
} else {
    window.addEventListener('DOMContentLoaded', () => {
        initializeFileInputs();
        renderCVPreview();
    });
}

// ==================== MATERIAS ====================
function parse12HourTime(time, period) {
    period = period || 'AM';
    let [hour, minute] = time.split(':').map(Number);
    if(period === 'AM' && hour === 12) hour = 0;
    if(period === 'PM' && hour !== 12) hour += 12;
    return { hour, minute, display: `${time}${period ? ' ' + period : ''}` };
}

async function addMateria() {
    const n = document.getElementById('m-nombre').value.trim();
    const seccion = document.getElementById('m-seccion').value.trim();
    const tipo = document.getElementById('m-tipo').value.trim();
    const d = document.getElementById('m-dia').value;
    const horaInicio = document.getElementById('m-hora-inicio').value;
    const inicioAmpm = document.getElementById('m-hora-inicio-ampm').value;
    const horaFin = document.getElementById('m-hora-fin').value;
    const finAmpm = document.getElementById('m-hora-fin-ampm').value;
    
    if(!n || !seccion || !tipo || !horaInicio || !horaFin) {
        showAlert("Completa todos los datos de la materia", "warning");
        return;
    }
    
    if(!materiasValidas.includes(n)) {
        showAlert(`"${n}" no es una materia válida. Selecciona una de la lista desplegable.`, "error");
        return;
    }
    
    const materiaDuplicada = materias.some(m => m.n === n && m.d === d && m.seccion === seccion && m.tipo === tipo);
    if(materiaDuplicada) {
        showAlert(`Ya tienes la materia "${n}" programada para los ${d}. No puedes duplicarla.`, "error");
        return;
    }
    
    const inicio = parse12HourTime(horaInicio, inicioAmpm);
    const fin = parse12HourTime(horaFin, finAmpm);
    const inicioMinutos = inicio.hour * 60 + inicio.minute;
    const finMinutos = fin.hour * 60 + fin.minute;
    let duracionHoras = (finMinutos - inicioMinutos) / 60;
    duracionHoras = Math.round(duracionHoras * 10) / 10;
    
    if(duracionHoras <= 0) {
        showAlert("La hora de salida debe ser posterior a la hora de inicio", "error");
        return;
    }
    
    if(duracionHoras > 3) {
        showAlert("La duración máxima por clase es de 3 horas", "error");
        return;
    }
    
    if(materias.length >= 6) {
        showAlert("Límite alcanzado: máximo 6 materias", "error");
        return;
    }
    
    const horasActuales = materias.reduce((total, m) => total + m.duracion, 0);
    if(horasActuales + duracionHoras > 8) {
        showAlert(`Límite de horas excedido: máximo 8 horas semanales. Actual: ${horasActuales}h, intentas agregar: ${duracionHoras}h`, "error");
        return;
    }
    
    const conflicto = materias.some(m => {
        if(m.d !== d) return false;
        const mInicio = parse12HourTime(m.horaInicio.split(' ')[0], m.horaInicio.split(' ')[1]);
        const mFin = parse12HourTime(m.horaFin.split(' ')[0], m.horaFin.split(' ')[1]);
        const inicioExistente = mInicio.hour * 60 + mInicio.minute;
        const finExistente = mFin.hour * 60 + mFin.minute;
        return inicioMinutos < finExistente && finMinutos > inicioExistente;
    });
    
    if(conflicto) {
        showAlert("Conflicto de horario: ya tienes una clase programada en ese horario", "error");
        return;
    }

    const newMateria = { 
        id: Date.now(), 
        serverId: null,
        n, 
        seccion,
        tipo,
        d, 
        horaInicio: inicio.display, 
        horaFin: fin.display, 
        duracion: duracionHoras 
    };

    materias.push(newMateria);
    localStorage.setItem(getUserKey('db_materias'), JSON.stringify(materias));
    document.getElementById('m-nombre').value = '';
    document.getElementById('m-seccion').value = '';
    document.getElementById('m-tipo').value = '';
    document.getElementById('m-dia').selectedIndex = 0;
    document.getElementById('m-hora-inicio').value = '07:00';
    document.getElementById('m-hora-inicio-ampm').value = 'AM';
    document.getElementById('m-hora-fin').value = '08:00';
    document.getElementById('m-hora-fin-ampm').value = 'AM';

    try {
        await saveMateriaToServer(newMateria);
        registrarAccionAutomatica(`Planificación Curricular: Se añadió la materia "${n}" para ${d} de ${inicio.display} a ${fin.display}.`);
        showAlert("Materia agregada correctamente y sincronizada con el servidor", "success");
    } catch (error) {
        showAlert("Materia agregada localmente, pero no se pudo sincronizar con el servidor: " + error.message, "warning");
    }

    render();
}

async function delMateria(id) {
    const materia = materias.find(x => x.id === id);

    try {
        await deleteMateriaFromServer(id);
        registrarAccionAutomatica(`Planificación Curricular: Se eliminó la materia "${materia ? materia.n : 'desconocida'}" del horario.`);
        showAlert("Materia eliminada correctamente", "info");
    } catch (error) {
        materias = materias.filter(x => x.id !== id);
        localStorage.setItem(getUserKey('db_materias'), JSON.stringify(materias));
        showAlert("Materia eliminada localmente, pero no se pudo eliminar en el servidor: " + error.message, "warning");
    }

    render();
}

function obtenerEstadoClase(materia) {
    const ahora = new Date();
    const diasSemana = { 'Lunes': 1, 'Martes': 2, 'Miércoles': 3, 'Jueves': 4, 'Viernes': 5 };
    const diaClase = diasSemana[materia.d];
    const diaActual = ahora.getDay();
    
    const [horaInicioTime, horaInicioPeriod = 'AM'] = materia.horaInicio.split(' ');
    const [horaFinTime, horaFinPeriod = 'AM'] = materia.horaFin.split(' ');
    const { hour: horaInicioH, minute: minutoInicio } = parse12HourTime(horaInicioTime, horaInicioPeriod);
    const { hour: horaFinH, minute: minutoFin } = parse12HourTime(horaFinTime, horaFinPeriod);
    
    const fechaInicio = new Date(ahora);
    fechaInicio.setDate(ahora.getDate() + (diaClase - diaActual));
    fechaInicio.setHours(horaInicioH, minutoInicio, 0);
    
    const fechaFin = new Date(ahora);
    fechaFin.setDate(ahora.getDate() + (diaClase - diaActual));
    fechaFin.setHours(horaFinH, minutoFin, 0);
    
    const ahoraMs = ahora.getTime();
    const inicioMs = fechaInicio.getTime();
    const finMs = fechaFin.getTime();
    
    if(diaActual === diaClase && ahoraMs >= inicioMs && ahoraMs <= finMs) {
        return { estado: 'activa', mensaje: `🔴 EN CLASE AHORA MISMO (hasta las ${materia.horaFin})`, color: 'clase-activa' };
    } else if(diaActual === diaClase && ahoraMs < inicioMs) {
        const minutosRestantes = Math.round((inicioMs - ahoraMs) / (1000 * 60));
        return { estado: 'proxima', mensaje: `🟡 PRÓXIMA CLASE en ${minutosRestantes} minutos`, color: 'clase-proxima' };
    } else if(diaActual === diaClase && ahoraMs > finMs) {
        return { estado: 'pasada', mensaje: '✅ CLASE FINALIZADA hoy', color: '' };
    } else if(diaClase > diaActual || (diaClase === diaActual && ahoraMs < inicioMs)) {
        const diasRestantes = diaClase > diaActual ? diaClase - diaActual : 7 - (diaActual - diaClase);
        return { estado: 'futura', mensaje: `📅 PRÓXIMA CLASE el ${materia.d} de ${materia.horaInicio} a ${materia.horaFin} (en ${diasRestantes} días)`, color: '' };
    } else {
        return { estado: 'pasada', mensaje: `📆 PRÓXIMA CLASE el próximo ${materia.d} de ${materia.horaInicio} a ${materia.horaFin}`, color: '' };
    }
}

// ==================== BITÁCORA ====================
function renderBitacora() {
    const b = document.getElementById('bitacora-content');
    if (!b) return;
    
    b.innerHTML = '';
    
    const registroBienestar = bienestarHoy && bienestarHoy.fecha === getLocalDateString() ? bienestarHoy : null;
    const nivelCargaActual = registroBienestar ? Number(registroBienestar.nivel_carga) : 0;

    if (materias.length === 0 && !registroBienestar) {
        b.innerHTML = '';
        return;
    }
    if (materias.length === 0 && !registroBienestar) {
        b.innerHTML = '';
        return;
    }
    
    if (nivelCargaActual >= 85) {
        const alertaDiv = document.createElement('div');
        alertaDiv.className = 'bitacora-item alert-critica';
        alertaDiv.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <strong><i class="fas fa-exclamation-triangle"></i> ⚠️ ALERTA CRÍTICA DE SALUD</strong>
                <span style="font-size:0.8rem;">${new Date().toLocaleDateString()}</span>
            </div>
            <p style="margin-top:8px;">📊 Nivel de carga detectado: <strong>${nivelCargaActual}%</strong></p>
            <p>🛌 Se recomienda encarecidamente: reducir actividades académicas, descansar más horas y reorganizar tu carga laboral. Tu bienestar es prioritario.</p>
            <p>💡 <em>Consejo: Tómate un descanso de 15 minutos cada 2 horas y procura dormir al menos 7 horas.</em></p>
        `;
        b.appendChild(alertaDiv);
    } else if (nivelCargaActual >= 60) {
        const alertaDiv = document.createElement('div');
        alertaDiv.className = 'bitacora-item';
        alertaDiv.style.background = "#ffedd5";
        alertaDiv.style.borderLeft = "4px solid #f59e0b";
        alertaDiv.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <strong><i class="fas fa-chart-line"></i> 🟠 CARGA ACADÉMICA MODERADA</strong>
                <span style="font-size:0.8rem;">${new Date().toLocaleDateString()}</span>
            </div>
            <p style="margin-top:8px;">📊 Nivel de carga: <strong>${nivelCargaActual}%</strong></p>
            <p>💡 Intenta equilibrar tus horarios y mejorar tus horas de descanso. Considera delegar tareas si es posible.</p>
        `;
        b.appendChild(alertaDiv);
    } else if (nivelCargaActual > 0) {
        const alertaDiv = document.createElement('div');
        alertaDiv.className = 'bitacora-item';
        alertaDiv.style.background = "#dcfce7";
        alertaDiv.style.borderLeft = "4px solid #22c55e";
        alertaDiv.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <strong><i class="fas fa-check-circle"></i> ✅ ESTADO ACADÉMICO ESTABLE</strong>
                <span style="font-size:0.8rem;">${new Date().toLocaleDateString()}</span>
            </div>
            <p style="margin-top:8px;">📊 Nivel de carga: <strong>${nivelCargaActual}%</strong> - Excelente equilibrio académico.</p>
            <p>🌟 Mantén tus hábitos actuales y sigue así. ¡Vas por buen camino!</p>
        `;
        b.appendChild(alertaDiv);
    }
    
    const ahora = new Date();
    const diaActual = ahora.toLocaleDateString('es-ES', { weekday: 'long' });
    const diaCapitalizado = diaActual.charAt(0).toUpperCase() + diaActual.slice(1);
    
    const clasesHoy = materias.filter(m => m.d === diaCapitalizado);
    
    if (clasesHoy.length > 0) {
        clasesHoy.forEach(m => {
            const { estado, mensaje, color } = obtenerEstadoClase(m);
            const claseDiv = document.createElement('div');
            claseDiv.className = `bitacora-item ${color}`;
            claseDiv.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <strong><i class="fas fa-chalkboard-user"></i> ${m.n}</strong>
                    <span style="font-size:0.8rem;">${m.d} • ${m.horaInicio} - ${m.horaFin}</span>
                </div>
                <p style="margin-top:8px;"><strong>${mensaje}</strong></p>
                <p style="margin-top:5px; font-size:0.9rem;">📍 Aula asignada: Principal • Duración: ${m.duracion} horas académicas</p>
            `;
            b.appendChild(claseDiv);
        });
    } else {
        const noClaseDiv = document.createElement('div');
        noClaseDiv.className = 'bitacora-item';
        noClaseDiv.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <strong><i class="fas fa-calendar-day"></i> 📅 Hoy no hay clases programadas</strong>
                <span style="font-size:0.8rem;">${new Date().toLocaleDateString()}</span>
            </div>
            <p style="margin-top:8px;">Aprovecha este tiempo para planificar tus próximas clases, corregir trabajos o descansar.</p>
            <p>💡 Recuerda: El equilibrio entre trabajo y descanso es clave para un buen rendimiento académico.</p>
        `;
        b.appendChild(noClaseDiv);
    }
    
    const proximasClases = materias.filter(m => {
        const diasSemana = { 'Lunes': 1, 'Martes': 2, 'Miércoles': 3, 'Jueves': 4, 'Viernes': 5 };
        const diaClaseNum = diasSemana[m.d];
        const diaActualNum = ahora.getDay();
        const [horaInicioTime, horaInicioPeriod = 'AM'] = m.horaInicio.split(' ');
        const { hour: horaInicioH, minute: minutoInicio } = parse12HourTime(horaInicioTime, horaInicioPeriod);
        const horaClaseNum = horaInicioH + (minutoInicio / 60);
        const horaActualNum = ahora.getHours() + (ahora.getMinutes() / 60);
        return diaClaseNum > diaActualNum || (diaClaseNum === diaActualNum && horaClaseNum > horaActualNum);
    }).slice(0, 3);
    
    if (proximasClases.length > 0) {
        const proximasDiv = document.createElement('div');
        proximasDiv.className = 'bitacora-item';
        proximasDiv.style.background = "#f0f9ff";
        proximasDiv.innerHTML = `
            <strong><i class="fas fa-clock"></i> 📋 PRÓXIMAS ACTIVIDADES</strong>
            ${proximasClases.map(m => `<p style="margin-top:8px; margin-left:10px;">• ${m.n} - ${m.d} de ${m.horaInicio} a ${m.horaFin}</p>`).join('')}
            <p style="margin-top:8px; font-size:0.85rem; color:#475569;">✅ Recuerda preparar el material con anticipación.</p>
        `;
        b.appendChild(proximasDiv);
    }
}

function render() {
    const t = document.getElementById('tabla-m');
    if(!t) return;
    t.innerHTML = '';
    
    materias.forEach(m => {
        t.innerHTML += `<tr><td style="padding:12px;"><strong>${m.n}</strong></td><td>${m.seccion || ''}</td><td>${m.tipo || ''}</td><td>${m.d || '---'}</td><td>${m.horaInicio}</td><td>${m.horaFin}</td><td>${m.duracion}h</td><td><button onclick="delMateria(${m.id})" style="color:#ef4444; background:none; border:none; cursor:pointer;"><i class="fas fa-trash"></i></button></td></tr>`;
    });
    
    const horasTotales = materias.reduce((total, m) => total + m.duracion, 0);
    document.getElementById('stat-m').textContent = materias.length;
    document.getElementById('stat-h').textContent = horasTotales + "h";
    
    renderBitacora();
}

// ==================== NAVEGACIÓN ====================
document.querySelectorAll('.nav-item').forEach(btn => {
    btn.onclick = function(e) {
        e.preventDefault();
        if(this.id === 'logoutBtn') { 
            if(confirm("¿Deseas cerrar sesión?")) window.location.href='Login.html'; 
            return; 
        }
        document.querySelectorAll('.nav-item, .section').forEach(el => el.classList.remove('active'));
        this.classList.add('active');
        document.getElementById(this.dataset.target).classList.add('active');
        
        if(window.innerWidth <= 992 && sidebarMenu && sidebarMenu.classList.contains('open')) {
            abrirCerrarMenu();
        }
        
        if(this.dataset.target === 'bitacora') {
            renderBitacora();
        }
    };
});

// ==================== CONSULTAS ====================
function enviarDuda() {
    const mensaje = document.getElementById('msgText').value.trim();
    if(!mensaje) {
        showAlert("Por favor escribe tu duda", "warning");
        return;
    }
    showAlert("Su consulta ha sido enviada al Profesor Titular correctamente.", "success");
    document.getElementById('msgText').value = '';
    document.getElementById('modalChat').style.display='none';
}

// ==================== BIENESTAR (CORREGIDO - MÁXIMO 100%) ====================
const estresSlider = document.getElementById('estres');
const estresValor = document.getElementById('estresValor');
const fatigaSlider = document.getElementById('fatiga');
const fatigaValor = document.getElementById('fatigaValor');

if(estresSlider && estresValor) {
    estresSlider.addEventListener('input', function() {
        estresValor.textContent = this.value + '%';
    });
}

if(fatigaSlider && fatigaValor) {
    fatigaSlider.addEventListener('input', function() {
        fatigaValor.textContent = this.value + '%';
    });
}

function analizarBienestar() {
    const estres = parseInt(document.getElementById('estres').value);
    const sueno = parseInt(document.getElementById('sueno').value);
    const tareas = parseInt(document.getElementById('tareas').value);
    const fatiga = parseInt(document.getElementById('fatiga').value);

    if (!sueno || !tareas) {
        showAlert("Completa todos los campos de bienestar", "warning");
        return;
    }

    let nivelCarga = 0;
    nivelCarga += estres * 0.4;
    nivelCarga += tareas * 3;
    nivelCarga += fatiga * 0.4;
    if (sueno < 6) {
        nivelCarga += 20;
    }
    
    nivelCarga = Math.min(Math.round(nivelCarga), 100);
    nivelCargaGlobal = nivelCarga;

    const estadoBox = document.getElementById('estadoCarga');
    const consejoBox = document.getElementById('consejoBox');

    if (nivelCarga >= 85) {
        estadoBox.innerHTML = `🔴 ALERTA CRÍTICA DE SOBRECARGA<br><br>Nivel de carga detectado: ${nivelCarga}%`;
        estadoBox.style.background = "#fee2e2";
        estadoBox.style.color = "#991b1b";
        consejoBox.innerHTML = `⚠️ Se recomienda reducir actividades, descansar más y reorganizar prioridades académicas esta semana. Prioriza tu salud.`;
        showAlert("Sobrecarga crítica detectada", "error");
    } else if (nivelCarga >= 60) {
        estadoBox.innerHTML = `🟠 CARGA ACADÉMICA MODERADA<br><br>Nivel actual: ${nivelCarga}%`;
        estadoBox.style.background = "#ffedd5";
        estadoBox.style.color = "#9a3412";
        consejoBox.innerHTML = `💡 Intenta equilibrar tus horarios y mejorar tus horas de descanso. Considera pausas activas.`;
        showAlert("Carga académica moderada detectada", "warning");
    } else {
        estadoBox.innerHTML = `🟢 ESTADO ACADÉMICO ESTABLE<br><br>Nivel actual: ${nivelCarga}%`;
        estadoBox.style.background = "#dcfce7";
        estadoBox.style.color = "#166534";
        consejoBox.innerHTML = `✅ Excelente equilibrio académico. Mantén tus hábitos actuales. ¡Sigue así!`;
        showAlert("Estado académico estable", "success");
    }

    const historial = JSON.parse(localStorage.getItem("historial_bienestar")) || [];
    historial.push({ fecha: new Date().toLocaleString(), estres, sueno, tareas, fatiga, nivelCarga });
    localStorage.setItem("historial_bienestar", JSON.stringify(historial));
    
    renderBitacora();
}

// ==================== NOTAS ====================
function abrirModalNotas() {
    document.getElementById('modalNotas').style.display = 'flex';
}

function cerrarModalNotas() {
    document.getElementById('modalNotas').style.display = 'none';
}

function guardarNota() {
    const alumno = document.getElementById('n-alumno').value.trim();
    const c1 = parseFloat(document.getElementById('n-c1').value);
    const c2 = parseFloat(document.getElementById('n-c2').value);
    const c3 = parseFloat(document.getElementById('n-c3').value);
    const faltas = parseInt(document.getElementById('n-faltas').value) || 0;

    const nombreRegex = /^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]{5,}$/;
    if (!nombreRegex.test(alumno)) {
        showAlert("Nombre inválido (mínimo 5 letras, solo texto)", "warning");
        return;
    }

    if (isNaN(c1) || isNaN(c2) || isNaN(c3) || c1 < 1 || c1 > 100 || c2 < 1 || c2 > 100 || c3 < 1 || c3 > 100) {
        showAlert("Las notas deben estar entre 1 y 100", "warning");
        return;
    }

    if (faltas < 0) {
        showAlert("Las faltas no pueden ser negativas", "warning");
        return;
    }

    const existe = notasAlumnos.some(n => n.alumno.toLowerCase() === alumno.toLowerCase());
    if(existe) {
        if(confirm("El alumno ya tiene notas registradas. ¿Deseas actualizarlas?")) {
            const index = notasAlumnos.findIndex(n => n.alumno.toLowerCase() === alumno.toLowerCase());
            notasAlumnos[index] = { alumno, corte1: c1, corte2: c2, corte3: c3, faltas };
        } else {
            cerrarModalNotas();
            return;
        }
    } else {
        notasAlumnos.push({ alumno, corte1: c1, corte2: c2, corte3: c3, faltas });
    }
    
    localStorage.setItem('db_notas', JSON.stringify(notasAlumnos));
    cerrarModalNotas();
    document.getElementById('n-alumno').value = '';
    document.getElementById('n-c1').value = '';
    document.getElementById('n-c2').value = '';
    document.getElementById('n-c3').value = '';
    document.getElementById('n-faltas').value = '';
    renderNotas();
    showAlert("Nota registrada correctamente", "success");
}

function renderNotas() {
    const tabla = document.getElementById('tablaNotas');
    if (!tabla) return;
    tabla.innerHTML = '';
    notasAlumnos.forEach((n) => {
        let promedio = ((n.corte1 + n.corte2 + n.corte3) / 3).toFixed(1);
        if (n.faltas >= 5) {
            promedio = 0.1;
        }
        let estado = '', color = '';
        if (promedio >= 70) { estado = 'Excelente'; color = '#22c55e'; }
        else if (promedio >= 50) { estado = 'Aprobado'; color = '#f59e0b'; }
        else { estado = 'Reprobado'; color = '#ef4444'; }
        tabla.innerHTML += `<tr><td style="padding:12px;"><strong>${n.alumno}</strong></td><td>${n.corte1}</td><td>${n.corte2}</td><td>${n.corte3}</td><td><strong>${promedio}</strong></td><td>${n.faltas}</td><td><span style="background:${color}15; color:${color}; padding:6px 12px; border-radius:20px; font-weight:700;">${estado}</span></td></tr>`;
    });
}

// ==================== INICIALIZACIÓN ====================
(async function initializeDashboard() {
    const serverUser = await fetchServerUser();
    if (!serverUser && !localStorage.getItem('current_user')) {
        // Si no hay usuario en sesión, mantenemos un fallback genérico.
        load();
    } else {
        load();
    }

    await fetchBienestarData();
    await fetchMateriasFromServer();
    render();
    renderNotas();
})();