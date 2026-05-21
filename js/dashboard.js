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
let encuestaHoy = null;
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

async function fetchEncuestaHoy() {
    const currentUser = JSON.parse(localStorage.getItem('current_user')) || {};
    const email = currentUser.email;
    if (!email) return;

    try {
        const response = await fetch(window.location.origin + '/Ecosistema academico/api_encuesta.php?email=' + encodeURIComponent(email), {
            method: 'GET',
            credentials: 'same-origin'
        });
        const data = await response.json();
        if (response.ok && data.success && Array.isArray(data.records)) {
            const hoy = getLocalDateString();
            encuestaHoy = data.records.find(r => r.fecha === hoy) || null;
        }
    } catch (error) {
        console.warn('No se pudo cargar la encuesta de bienestar del día:', error);
    }
}

function diagnosticoEmocional(scoreEmo) {
    if (scoreEmo >= 19) {
        return {
            texto: 'Presentas indicadores de cansancio mental o niveles altos de estrés acumulado en tu jornada.',
            tipsFallback: [
                'Pon en práctica la regla 20-20-20 para relajar la mente periódicamente.',
                'Escribe tus pendientes principales para liberar espacio cognitivo.'
            ]
        };
    }
    if (scoreEmo >= 13) {
        return {
            texto: 'Tu balance psicológico es moderado. Se observa estabilidad pero con ligeros focos de fatiga rutinaria.',
            tipsFallback: ['Dedica de 10 a 15 minutos a un pasatiempo totalmente desconectado de dispositivos.']
        };
    }
    return {
        texto: '¡Excelente balance emocional! Tu mente se encuentra en un estado óptimo de calma, enfoque y claridad.',
        tipsFallback: ['Sigue manteniendo tus límites saludables de rendimiento y descanso.']
    };
}

function diagnosticoFisico(scoreFis) {
    if (scoreFis >= 19) {
        return {
            texto: 'El consultorio detecta fatiga corporal acumulada, tensión muscular o falta de pausas físicas.',
            tipsFallback: [
                'Realiza estiramientos suaves enfocados en el cuello, hombros y lumbares.',
                'Asegúrate de beber un vaso de agua ahora mismo para optimizar la hidratación.'
            ]
        };
    }
    if (scoreFis >= 13) {
        return {
            texto: 'Estado físico regular. El cuerpo responde bien pero denota sutiles demandas de descanso postural.',
            tipsFallback: ['Levántate del asiento y camina por la habitación durante 5 minutos para oxigenar los músculos.']
        };
    }
    return {
        texto: 'Tu energía corporal y salud física reportan condiciones estables, libres de tensiones molestas.',
        tipsFallback: ['Continúa protegiendo tu postura erguida frente al escritorio y tus comidas.']
    };
}

function renderEstadoBienestarHoy() {
    const contenedor = document.getElementById('bitacora-bienestar-container');
    if (!contenedor) return;

    const hoy = getLocalDateString();
    const registroBien = bienestarHoy && bienestarHoy.fecha === hoy ? bienestarHoy : null;
    const registroEnc = encuestaHoy && encuestaHoy.fecha === hoy ? encuestaHoy : null;

    if (!registroBien && !registroEnc) {
        contenedor.innerHTML = `
            <div style="padding:18px; background:#f8fafc; border-radius:12px; text-align:center;">
                <p style="margin:0 0 12px 0; color:#475569;">Aún no completaste tu test de bienestar de hoy.</p>
                <a href="bienestar.php" class="btn btn-primary" style="display:inline-block; padding:10px 20px; text-decoration:none;">
                    <i class="fas fa-heart-pulse"></i> Realizar test de bienestar
                </a>
            </div>
        `;
        return;
    }

    const scoreEmo = registroEnc ? Number(registroEnc.score_emo) : Number(registroBien.score_emo);
    const scoreFis = registroEnc ? Number(registroEnc.score_fis) : Number(registroBien.score_fis);

    const diagEmo = diagnosticoEmocional(scoreEmo);
    const diagFis = diagnosticoFisico(scoreFis);

    const tipsEmo = registroEnc && registroEnc.tips_emocionales
        ? registroEnc.tips_emocionales.split('\n').map(t => t.trim()).filter(Boolean)
        : diagEmo.tipsFallback;
    const tipsFis = registroEnc && registroEnc.tips_fisicos
        ? registroEnc.tips_fisicos.split('\n').map(t => t.trim()).filter(Boolean)
        : diagFis.tipsFallback;

    contenedor.innerHTML = `
        <div style="padding:18px; border-radius:12px; background:#fafafa; border-left:5px solid #6c5ce7; margin-bottom:14px;">
            <h4 style="margin:0 0 8px 0; color:#6c5ce7;">🧠 Salud Emocional</h4>
            <p style="margin:0 0 10px 0; color:#2d3436;">${diagEmo.texto}</p>
            <strong style="font-size:0.9rem;">💡 Consejos recomendados:</strong>
            <ul style="margin:6px 0 0 0; padding-left:20px; color:#475569;">
                ${tipsEmo.map(t => `<li>${t}</li>`).join('')}
            </ul>
        </div>
        <div style="padding:18px; border-radius:12px; background:#fafafa; border-left:5px solid #00b894;">
            <h4 style="margin:0 0 8px 0; color:#00b894;">🩺 Consultorio Clínico Virtual</h4>
            <p style="margin:0 0 10px 0; color:#2d3436;">${diagFis.texto}</p>
            <strong style="font-size:0.9rem;">💡 Consejos recomendados:</strong>
            <ul style="margin:6px 0 0 0; padding-left:20px; color:#475569;">
                ${tipsFis.map(t => `<li>${t}</li>`).join('')}
            </ul>
        </div>
    `;
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
    renderHorarioPreview();

    renderHorasAdminTabla();
    const horasAdminEl = document.getElementById('horas-administrative-val');
    if (horasAdminEl) horasAdminEl.textContent = totalHorasAdminDelMes() + 'h';
}

function renderHorarioPreview() {
    const preview = document.getElementById('horario-preview');
    const statusBox = document.getElementById('horario-archivo-status');
    const nameLabel = document.getElementById('horario-nombre-archivo');
    if (!preview) return;

    const user = JSON.parse(localStorage.getItem('current_user')) || {};
    const url = user.horarioUrl || user.horario_url;

    if (!url) {
        preview.innerHTML = '';
        if (nameLabel) nameLabel.textContent = 'No se ha subido ningún documento adjunto';
        if (statusBox) {
            statusBox.style.background = '#f8fafc';
            statusBox.style.borderColor = '#cbd5e1';
            statusBox.style.color = '#64748b';
        }
        return;
    }

    const fileName = url.split('/').pop();
    if (nameLabel) nameLabel.textContent = `Archivo cargado: ${fileName}`;
    if (statusBox) {
        statusBox.style.background = '#f0fdf4';
        statusBox.style.borderColor = '#bbf7d0';
        statusBox.style.color = '#166534';
    }

    const lower = url.toLowerCase();
    const isPdf = lower.endsWith('.pdf');

    if (isPdf) {
        preview.innerHTML = `<iframe src="${url}" style="width:100%; height:500px; border:none; border-radius:10px; background:#f8fafc;"></iframe>`;
    } else {
        preview.innerHTML = `
            <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; padding:10px; text-align:center;">
                <img src="${url}" alt="Horario del profesor" style="max-width:100%; max-height:520px; height:auto; object-fit:contain; border-radius:8px; display:block; margin:0 auto;">
            </div>
        `;
    }
}

async function handleHorarioUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const preview = document.getElementById('horario-preview');
    const nameLabel = document.getElementById('horario-nombre-archivo');
    if (preview) preview.innerHTML = '<p style="margin:0; color:#64748b; font-size:0.85rem;">Subiendo horario...</p>';
    if (nameLabel) nameLabel.textContent = `Subiendo: ${file.name}`;

    const form = new FormData();
    form.append('horario', file);
    const user = JSON.parse(localStorage.getItem('current_user')) || {};
    if (user.email) form.append('email', user.email);

    try {
        const resp = await fetch(window.location.origin + '/Ecosistema academico/upload_horario.php', {
            method: 'POST',
            body: form,
            credentials: 'same-origin'
        });
        const j = await resp.json();
        if (!resp.ok || !j.success) throw new Error(j.error || 'Upload failed');

        const stored = JSON.parse(localStorage.getItem('current_user')) || {};
        stored.horarioUrl = j.url;
        localStorage.setItem('current_user', JSON.stringify(stored));

        renderHorarioPreview();
        if (typeof registrarAccionAutomatica === 'function') {
            registrarAccionAutomatica(`Horario: El docente cargó el documento oficial de su horario (${file.name}).`);
        }
        showAlert('Horario cargado correctamente', 'success');
    } catch (err) {
        if (preview) preview.innerHTML = '<p style="margin:0; color:#b91c1c; font-size:0.85rem;">Error al subir el horario.</p>';
        showAlert('Error al subir el horario: ' + err.message, 'error');
    }
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
        if (typeof registrarAccionAutomatica === 'function') {
            registrarAccionAutomatica(`Perfil: Se subió la hoja de vida (${file.name}).`);
        }
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
                if (typeof registrarAccionAutomatica === 'function') {
                    registrarAccionAutomatica(`Perfil: Se actualizó la foto de perfil.`);
                }
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
    const fecha = document.getElementById('m-fecha').value;
    const horaInicio = document.getElementById('m-hora-inicio').value;
    const inicioAmpm = document.getElementById('m-hora-inicio-ampm').value;
    const horaFin = document.getElementById('m-hora-fin').value;
    const finAmpm = document.getElementById('m-hora-fin-ampm').value;

    if(!n || !seccion || !tipo || !fecha || !horaInicio || !horaFin) {
        showAlert("Completa todos los datos de la materia, incluyendo la fecha", "warning");
        return;
    }

    if(!esFechaISO(fecha)) {
        showAlert("Fecha inválida", "error");
        return;
    }

    if(!materiasValidas.includes(n)) {
        showAlert(`"${n}" no es una materia válida. Selecciona una de la lista desplegable.`, "error");
        return;
    }

    const d = fecha;

    const materiaDuplicada = materias.some(m => m.n === n && m.d === d && m.seccion === seccion && m.tipo === tipo);
    if(materiaDuplicada) {
        showAlert(`Ya tienes la materia "${n}" programada para el ${formatearFechaCorta(d)}. No puedes duplicarla.`, "error");
        return;
    }

    const inicio = parse12HourTime(horaInicio, inicioAmpm);
    const fin = parse12HourTime(horaFin, finAmpm);
    const inicioMinutos = inicio.hour * 60 + inicio.minute;
    const finMinutos = fin.hour * 60 + fin.minute;
    let duracionHoras = (finMinutos - inicioMinutos) / 60;

    if(duracionHoras <= 0) {
        showAlert("La hora de salida debe ser posterior a la hora de inicio", "error");
        return;
    }

    duracionHoras = Math.round(duracionHoras * 4) / 4;

    if(duracionHoras > 3) {
        showAlert("La duración máxima por clase es de 3 horas", "error");
        return;
    }

    if(materias.length >= 6) {
        showAlert("Límite alcanzado: máximo 6 materias", "error");
        return;
    }

    const semanaNueva = getSemanaKey(d);
    const horasEnSemana = materias.reduce((total, m) => {
        if (!esFechaISO(m.d)) return total;
        return getSemanaKey(m.d) === semanaNueva ? total + (Number(m.duracion) || 0) : total;
    }, 0);
    if(horasEnSemana + duracionHoras > 8) {
        showAlert(`Límite excedido: máximo 8 hs académicas por semana. Ya tenés ${horasEnSemana}h cargadas esa semana, intentás agregar ${duracionHoras}h.`, "error");
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
        showAlert("Conflicto de horario: ya tienes una clase programada ese día en ese horario", "error");
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
    document.getElementById('m-fecha').value = '';
    document.getElementById('m-hora-inicio').value = '07:00';
    document.getElementById('m-hora-inicio-ampm').value = 'AM';
    document.getElementById('m-hora-fin').value = '08:00';
    document.getElementById('m-hora-fin-ampm').value = 'AM';

    try {
        await saveMateriaToServer(newMateria);
        registrarAccionAutomatica(`Planificación Curricular: Se añadió la materia "${n}" para el ${formatearFechaCorta(d)} de ${inicio.display} a ${fin.display}.`);
        showAlert("Materia agregada correctamente y sincronizada con el servidor", "success");
    } catch (error) {
        showAlert("Materia agregada localmente, pero no se pudo sincronizar con el servidor: " + error.message, "warning");
    }

    render();
}

async function cancelarMateria(id) {
    const materia = materias.find(x => x.id === id);
    if (!materia) return;

    const motivo = prompt(`Motivo de cancelación de "${materia.n}" (${formatearFechaCorta(materia.d)} ${materia.horaInicio} - ${materia.horaFin}):`);
    if (motivo === null) return;
    const motivoTrim = motivo.trim();
    if (!motivoTrim) {
        showAlert('Debés indicar un motivo para cancelar.', 'warning');
        return;
    }

    const canceladas = loadCanceladas();
    canceladas.academicas.unshift({
        id: Date.now(),
        nombre: materia.n,
        seccion: materia.seccion,
        tipo: materia.tipo,
        fecha: materia.d,
        horaInicio: materia.horaInicio,
        horaFin: materia.horaFin,
        duracion: materia.duracion,
        motivo: motivoTrim,
        canceladaEn: timestampISO()
    });
    saveCanceladas(canceladas);

    try {
        await deleteMateriaFromServer(id);
        registrarAccionAutomatica(`Planificación Curricular: Se canceló la materia "${materia.n}" (${formatearFechaCorta(materia.d)}). Motivo: ${motivoTrim}.`);
        showAlert('Materia cancelada y registrada.', 'info');
    } catch (error) {
        materias = materias.filter(x => x.id !== id);
        localStorage.setItem(getUserKey('db_materias'), JSON.stringify(materias));
        showAlert('Materia cancelada localmente, pero no se pudo sincronizar con el servidor: ' + error.message, 'warning');
    }

    render();
}

// Mantenemos el nombre viejo como alias por compatibilidad con cualquier handler residual
async function delMateria(id) { return cancelarMateria(id); }

function obtenerEstadoClase(materia) {
    if (!esFechaISO(materia.d)) {
        return { estado: 'futura', mensaje: `📆 ${materia.d} de ${materia.horaInicio} a ${materia.horaFin}`, color: '' };
    }

    const ahora = new Date();
    const [horaInicioTime, horaInicioPeriod = 'AM'] = materia.horaInicio.split(' ');
    const [horaFinTime, horaFinPeriod = 'AM'] = materia.horaFin.split(' ');
    const { hour: horaInicioH, minute: minutoInicio } = parse12HourTime(horaInicioTime, horaInicioPeriod);
    const { hour: horaFinH, minute: minutoFin } = parse12HourTime(horaFinTime, horaFinPeriod);

    const [yC, mC, dC] = materia.d.split('-').map(Number);
    const fechaInicio = new Date(yC, mC - 1, dC, horaInicioH, minutoInicio, 0);
    const fechaFin = new Date(yC, mC - 1, dC, horaFinH, minutoFin, 0);

    const ahoraMs = ahora.getTime();
    const inicioMs = fechaInicio.getTime();
    const finMs = fechaFin.getTime();

    const hoyISO = getLocalDateString();
    const esHoy = materia.d === hoyISO;
    const fechaTxt = formatearFechaCorta(materia.d);

    if (esHoy && ahoraMs >= inicioMs && ahoraMs <= finMs) {
        return { estado: 'activa', mensaje: `🔴 EN CLASE AHORA MISMO (hasta las ${materia.horaFin})`, color: 'clase-activa' };
    } else if (esHoy && ahoraMs < inicioMs) {
        const minutosRestantes = Math.round((inicioMs - ahoraMs) / (1000 * 60));
        return { estado: 'proxima', mensaje: `🟡 PRÓXIMA CLASE en ${minutosRestantes} minutos`, color: 'clase-proxima' };
    } else if (esHoy && ahoraMs > finMs) {
        return { estado: 'pasada', mensaje: '✅ CLASE FINALIZADA hoy', color: '' };
    } else if (inicioMs > ahoraMs) {
        const diasRestantes = Math.ceil((inicioMs - ahoraMs) / (1000 * 60 * 60 * 24));
        return { estado: 'futura', mensaje: `📅 PRÓXIMA CLASE el ${fechaTxt} de ${materia.horaInicio} a ${materia.horaFin} (en ${diasRestantes} día${diasRestantes === 1 ? '' : 's'})`, color: '' };
    } else {
        return { estado: 'pasada', mensaje: `📆 CLASE PASADA el ${fechaTxt} de ${materia.horaInicio} a ${materia.horaFin}`, color: '' };
    }
}

// ==================== BITÁCORA ====================
function renderBitacora() {
    renderEstadoBienestarHoy();

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
            <p style="margin-top:8px;">🛌 Se recomienda encarecidamente: reducir actividades académicas, descansar más horas y reorganizar tu carga laboral. Tu bienestar es prioritario.</p>
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
            <p style="margin-top:8px;">💡 Intenta equilibrar tus horarios y mejorar tus horas de descanso. Considera delegar tareas si es posible.</p>
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
            <p style="margin-top:8px;">📊 Excelente equilibrio académico.</p>
            <p>🌟 Mantén tus hábitos actuales y sigue así. ¡Vas por buen camino!</p>
        `;
        b.appendChild(alertaDiv);
    }
    
    const ahora = new Date();
    const hoyISO = getLocalDateString();

    const clasesHoy = materias.filter(m => esFechaISO(m.d) && m.d === hoyISO);

    if (clasesHoy.length > 0) {
        clasesHoy.forEach(m => {
            const { estado, mensaje, color } = obtenerEstadoClase(m);
            const claseDiv = document.createElement('div');
            claseDiv.className = `bitacora-item ${color}`;
            claseDiv.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <strong><i class="fas fa-chalkboard-user"></i> ${m.n}</strong>
                    <span style="font-size:0.8rem;">${formatearFechaCorta(m.d)} • ${m.horaInicio} - ${m.horaFin}</span>
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
    
    const ahoraMs = ahora.getTime();
    const proximasClases = materias.filter(m => {
        if (!esFechaISO(m.d)) return false;
        const [horaInicioTime, horaInicioPeriod = 'AM'] = m.horaInicio.split(' ');
        const { hour: horaInicioH, minute: minutoInicio } = parse12HourTime(horaInicioTime, horaInicioPeriod);
        const [y, mo, dd] = m.d.split('-').map(Number);
        const inicioMs = new Date(y, mo - 1, dd, horaInicioH, minutoInicio, 0).getTime();
        return inicioMs > ahoraMs;
    }).sort((a, b) => {
        const fa = new Date(a.d + 'T00:00:00').getTime();
        const fb = new Date(b.d + 'T00:00:00').getTime();
        return fa - fb;
    }).slice(0, 3);
    
    if (proximasClases.length > 0) {
        const proximasDiv = document.createElement('div');
        proximasDiv.className = 'bitacora-item';
        proximasDiv.style.background = "#f0f9ff";
        proximasDiv.innerHTML = `
            <strong><i class="fas fa-clock"></i> 📋 PRÓXIMAS ACTIVIDADES</strong>
            ${proximasClases.map(m => `<p style="margin-top:8px; margin-left:10px;">• ${m.n} - ${formatearFechaCorta(m.d)} de ${m.horaInicio} a ${m.horaFin}</p>`).join('')}
            <p style="margin-top:8px; font-size:0.85rem; color:#475569;">✅ Recuerda preparar el material con anticipación.</p>
        `;
        b.appendChild(proximasDiv);
    }

    appendLogsBitacora(b);
}

window.renderBitacora = renderBitacora;

function renderCanceladas() {
    const data = loadCanceladas();
    const aca = data.academicas || [];
    const adm = data.administrativas || [];

    const cont = document.getElementById('canceladas-container');
    if (!cont) return;

    if (aca.length === 0 && adm.length === 0) {
        cont.innerHTML = `<p style="color:#94a3b8; font-style:italic; padding:10px 0; font-size:0.9rem;">Sin actividades canceladas todavía.</p>`;
        return;
    }

    let html = '<div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(320px, 1fr)); gap:18px;">';

    html += `
        <div>
            <h3 style="margin:0 0 10px 0; font-size:0.95rem; color:#475569;"><i class="fas fa-chalkboard-user" style="color:#2563eb;"></i> Académicas (${aca.length})</h3>
            ${aca.length === 0 ? `<p style="color:#94a3b8; font-style:italic; font-size:0.85rem;">Sin cancelaciones académicas.</p>` : aca.map(c => `
                <div style="background:#fef2f2; border-left:4px solid #ef4444; border-radius:8px; padding:10px 12px; margin-bottom:8px; font-size:0.85rem;">
                    <div style="font-weight:700; color:#1e293b;">${c.nombre || ''} ${c.seccion ? '· ' + c.seccion : ''} ${c.tipo ? '· ' + c.tipo : ''}</div>
                    <div style="color:#475569; margin-top:3px;">📅 ${esFechaISO(c.fecha) ? formatearFechaCorta(c.fecha) : c.fecha} · ${c.horaInicio} – ${c.horaFin} (${c.duracion}h)</div>
                    <div style="color:#7f1d1d; margin-top:6px;"><strong>Motivo:</strong> ${c.motivo || '—'}</div>
                    <div style="color:#94a3b8; font-size:0.72rem; margin-top:4px;">Cancelada el ${c.canceladaEn || '—'}</div>
                </div>
            `).join('')}
        </div>
    `;

    html += `
        <div>
            <h3 style="margin:0 0 10px 0; font-size:0.95rem; color:#475569;"><i class="fas fa-briefcase" style="color:#0c4a6e;"></i> Administrativas (${adm.length})</h3>
            ${adm.length === 0 ? `<p style="color:#94a3b8; font-style:italic; font-size:0.85rem;">Sin cancelaciones administrativas.</p>` : adm.map(c => `
                <div style="background:#fef2f2; border-left:4px solid #ef4444; border-radius:8px; padding:10px 12px; margin-bottom:8px; font-size:0.85rem;">
                    <div style="font-weight:700; color:#1e293b;">Registro administrativo (${c.horas}h)</div>
                    <div style="color:#475569; margin-top:3px;">📅 ${esFechaISO(c.fecha) ? formatearFechaCorta(c.fecha) : c.fecha} ${c.horaInicio && c.horaFin ? '· ' + c.horaInicio + ' – ' + c.horaFin : ''}</div>
                    <div style="color:#7f1d1d; margin-top:6px;"><strong>Motivo:</strong> ${c.motivo || '—'}</div>
                    <div style="color:#94a3b8; font-size:0.72rem; margin-top:4px;">Cancelada el ${c.canceladaEn || '—'}</div>
                </div>
            `).join('')}
        </div>
    `;

    html += '</div>';
    cont.innerHTML = html;
}

function appendLogsBitacora(contenedor) {
    if (!contenedor) return;
    try {
        const user = JSON.parse(localStorage.getItem('current_user')) || {};
        const email = (user.email || 'anon').toString().trim().toLowerCase();
        const key = 'docente_bitacora_logs_fechas_' + email;
        const todos = JSON.parse(localStorage.getItem(key)) || {};
        const logs = todos[getLocalDateString()] || [];
        if (logs.length === 0) return;

        const div = document.createElement('div');
        div.className = 'bitacora-item';
        div.style.background = '#f8fafc';
        div.style.borderLeft = '4px solid #64748b';
        div.innerHTML = `
            <strong><i class="fas fa-history"></i> 📜 ACTIVIDADES REGISTRADAS HOY</strong>
            <div style="margin-top:10px; max-height:280px; overflow-y:auto;">
                ${logs.map(l => `
                    <div style="padding:6px 10px; border-bottom:1px solid #eef2f7; font-size:0.85rem;">
                        <span style="color:#94a3b8; font-size:0.75rem;">${l.fecha}</span><br>
                        ${l.texto}
                    </div>
                `).join('')}
            </div>
        `;
        contenedor.appendChild(div);
    } catch (e) {
        console.error('appendLogsBitacora:', e);
    }
}

function render() {
    const t = document.getElementById('tabla-m');
    if(!t) return;
    t.innerHTML = '';
    
    const mesActual = getMesActualISO();
    materias.forEach(m => {
        const fechaTxt = esFechaISO(m.d) ? formatearFechaCorta(m.d) : (m.d || '---');
        const horas = Number(m.duracion) || 0;
        t.innerHTML += `<tr><td style="padding:12px;"><strong>${m.n}</strong></td><td>${m.seccion || ''}</td><td>${m.tipo || ''}</td><td>${fechaTxt}</td><td>${m.horaInicio}</td><td>${m.horaFin}</td><td>${horas}h</td><td><button onclick="cancelarMateria(${m.id})" title="Cancelar materia" style="color:#ef4444; background:none; border:none; cursor:pointer;"><i class="fas fa-ban"></i></button></td></tr>`;
    });

    const horasAcademicasDelMes = materias.reduce((total, m) => {
        if (esFechaISO(m.d) && m.d.startsWith(mesActual)) {
            return total + (Number(m.duracion) || 0);
        }
        return total;
    }, 0);

    document.getElementById('stat-m').textContent = materias.length;
    document.getElementById('stat-h').textContent = horasAcademicasDelMes + "h";

    const horasAcademicasEl = document.getElementById('horas-academicas-val');
    if (horasAcademicasEl) horasAcademicasEl.textContent = horasAcademicasDelMes + 'h';

    const horasAdminEl = document.getElementById('horas-administrative-val');
    if (horasAdminEl) horasAdminEl.textContent = totalHorasAdminDelMes() + 'h';

    renderHorasAdminTabla();
    renderCanceladas();
    renderInasistencias();

    if (typeof actualizarNombresMateriasOverview === 'function') {
        actualizarNombresMateriasOverview();
    }

    renderBitacora();
}

function esFechaISO(s) {
    return typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s);
}

function formatearFechaCorta(fechaISO) {
    if (!esFechaISO(fechaISO)) return fechaISO || '---';
    const [y, m, d] = fechaISO.split('-');
    return `${d}/${m}/${y}`;
}

function getSemanaKey(fechaISO) {
    if (!esFechaISO(fechaISO)) return '';
    const dt = new Date(fechaISO + 'T00:00:00');
    const day = dt.getDay() || 7;
    dt.setDate(dt.getDate() + 1 - day);
    const y = dt.getFullYear();
    const m = String(dt.getMonth() + 1).padStart(2, '0');
    const d = String(dt.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

function getMesActualISO() {
    const hoy = new Date();
    return `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`;
}

function loadInasistencias() {
    try {
        const raw = localStorage.getItem(getUserKey('db_inasistencias'));
        const arr = raw ? JSON.parse(raw) : [];
        return Array.isArray(arr) ? arr : [];
    } catch (e) {
        return [];
    }
}

function saveInasistencias(arr) {
    localStorage.setItem(getUserKey('db_inasistencias'), JSON.stringify(arr));
}

async function registrarInasistencia() {
    const fechaInput = document.getElementById('inasistencia-fecha');
    const motivoInput = document.getElementById('inasistencia-motivo');
    if (!fechaInput || !motivoInput) return;
    const fecha = fechaInput.value;
    const motivo = (motivoInput.value || '').trim();

    if (!esFechaISO(fecha)) {
        showAlert('Seleccioná una fecha válida.', 'warning');
        return;
    }
    if (!motivo) {
        showAlert('Indicá un motivo de la inasistencia.', 'warning');
        return;
    }

    const lista = loadInasistencias();
    if (lista.some(i => i.fecha === fecha)) {
        showAlert('Ya hay una inasistencia registrada para esa fecha.', 'warning');
        return;
    }

    // Cancelar automáticamente las materias del día
    const materiasDelDia = materias.filter(m => m.d === fecha);
    const idsCanceladas = [];
    if (materiasDelDia.length > 0) {
        const canceladas = loadCanceladas();
        for (const materia of materiasDelDia) {
            canceladas.academicas.unshift({
                id: Date.now() + Math.random(),
                nombre: materia.n,
                seccion: materia.seccion,
                tipo: materia.tipo,
                fecha: materia.d,
                horaInicio: materia.horaInicio,
                horaFin: materia.horaFin,
                duracion: materia.duracion,
                motivo: `Inasistencia: ${motivo}`,
                canceladaEn: timestampISO()
            });
            idsCanceladas.push(materia.id);
            try { await deleteMateriaFromServer(materia.id); } catch (e) {
                materias = materias.filter(x => x.id !== materia.id);
                localStorage.setItem(getUserKey('db_materias'), JSON.stringify(materias));
            }
        }
        saveCanceladas(canceladas);
    }

    lista.unshift({
        id: Date.now(),
        fecha,
        motivo,
        registradaEn: timestampISO(),
        materiasCanceladas: materiasDelDia.length
    });
    saveInasistencias(lista);

    // Persistir en BD (best-effort)
    fetch('api_inasistencias.php', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fecha, motivo })
    }).catch(err => console.warn('No se pudo persistir inasistencia en BD:', err));

    if (typeof registrarAccionAutomatica === 'function') {
        registrarAccionAutomatica(`Inasistencia: ${formatearFechaCorta(fecha)}. Motivo: ${motivo}. ${materiasDelDia.length > 0 ? `Se cancelaron ${materiasDelDia.length} materia(s) de ese día.` : ''}`);
    }
    showAlert('Inasistencia registrada.', 'success');

    fechaInput.value = '';
    motivoInput.value = '';
    cerrarModalInasistencia();
    render();
}

function abrirModalInasistencia() {
    const modal = document.getElementById('modalInasistencia');
    if (modal) modal.style.display = 'flex';
}

function cerrarModalInasistencia() {
    const modal = document.getElementById('modalInasistencia');
    if (modal) modal.style.display = 'none';
}

function renderInasistencias() {
    const lista = loadInasistencias();
    const statInasistencias = document.getElementById('stat-inasistencias');
    const statDetalle = document.getElementById('stat-inasistencias-detalle');
    if (statInasistencias) statInasistencias.textContent = lista.length;
    if (statDetalle) {
        statDetalle.textContent = lista.length === 0
            ? 'Sin inasistencias registradas'
            : `Última: ${formatearFechaCorta(lista[0].fecha)}`;
    }

    const cont = document.getElementById('inasistencias-container');
    if (!cont) return;

    if (lista.length === 0) {
        cont.innerHTML = `<p style="color:#94a3b8; font-style:italic; padding:10px 0; font-size:0.9rem;">No hay inasistencias registradas.</p>`;
        return;
    }

    cont.innerHTML = lista.map(i => `
        <div style="background:#fef2f2; border-left:4px solid #ef4444; border-radius:8px; padding:10px 14px; margin-bottom:8px; font-size:0.88rem;">
            <div style="display:flex; justify-content:space-between; align-items:center; gap:8px; flex-wrap:wrap;">
                <strong style="color:#1e293b;">📅 ${formatearFechaCorta(i.fecha)}</strong>
                <span style="font-size:0.72rem; color:#94a3b8;">Registrada el ${i.registradaEn || '—'}</span>
            </div>
            <div style="color:#7f1d1d; margin-top:6px;"><strong>Motivo:</strong> ${i.motivo}</div>
            ${i.materiasCanceladas > 0 ? `<div style="color:#64748b; font-size:0.78rem; margin-top:4px;">Se cancelaron ${i.materiasCanceladas} materia(s) de ese día.</div>` : ''}
        </div>
    `).join('');
}

function loadCanceladas() {
    try {
        const raw = localStorage.getItem(getUserKey('db_canceladas'));
        const obj = raw ? JSON.parse(raw) : null;
        return {
            academicas: Array.isArray(obj?.academicas) ? obj.academicas : [],
            administrativas: Array.isArray(obj?.administrativas) ? obj.administrativas : []
        };
    } catch (e) {
        return { academicas: [], administrativas: [] };
    }
}

function saveCanceladas(data) {
    localStorage.setItem(getUserKey('db_canceladas'), JSON.stringify(data));
}

function timestampISO() {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const mi = String(d.getMinutes()).padStart(2, '0');
    return `${dd}/${mm}/${yyyy} ${hh}:${mi}`;
}

function loadHorasAdmin() {
    try {
        const raw = localStorage.getItem(getUserKey('db_horas_admin'));
        const arr = raw ? JSON.parse(raw) : [];
        return Array.isArray(arr) ? arr : [];
    } catch (e) {
        return [];
    }
}

function saveHorasAdminArray(arr) {
    localStorage.setItem(getUserKey('db_horas_admin'), JSON.stringify(arr));
}

function totalHorasAdminDelMes() {
    const mes = getMesActualISO();
    return loadHorasAdmin().reduce((acc, e) => {
        return (typeof e.fecha === 'string' && e.fecha.startsWith(mes)) ? acc + (Number(e.horas) || 0) : acc;
    }, 0);
}

function agregarHoraAdmin() {
    const fechaInput = document.getElementById('m-admin-fecha');
    const horaInicioEl = document.getElementById('m-admin-hora-inicio');
    const inicioAmpmEl = document.getElementById('m-admin-inicio-ampm');
    const horaFinEl = document.getElementById('m-admin-hora-fin');
    const finAmpmEl = document.getElementById('m-admin-fin-ampm');
    if (!fechaInput || !horaInicioEl || !horaFinEl) return;

    const fecha = fechaInput.value;
    const horaInicioVal = horaInicioEl.value;
    const horaFinVal = horaFinEl.value;
    const inicioAmpm = inicioAmpmEl.value;
    const finAmpm = finAmpmEl.value;

    if (!esFechaISO(fecha)) {
        showAlert('Seleccioná una fecha válida.', 'warning');
        return;
    }
    if (!horaInicioVal || !horaFinVal) {
        showAlert('Seleccioná hora de inicio y fin.', 'warning');
        return;
    }

    const inicio = parse12HourTime(horaInicioVal, inicioAmpm);
    const fin = parse12HourTime(horaFinVal, finAmpm);
    const inicioMinutos = inicio.hour * 60 + inicio.minute;
    const finMinutos = fin.hour * 60 + fin.minute;
    let duracion = (finMinutos - inicioMinutos) / 60;

    if (duracion <= 0) {
        showAlert('La hora de fin debe ser posterior a la de inicio.', 'error');
        return;
    }
    duracion = Math.round(duracion * 4) / 4;

    if (duracion > 2) {
        showAlert('Una entrada administrativa no puede superar 2 hs.', 'error');
        return;
    }

    const lista = loadHorasAdmin();
    const semanaNueva = getSemanaKey(fecha);
    const horasEnSemana = lista.reduce((total, e) => {
        return getSemanaKey(e.fecha) === semanaNueva ? total + (Number(e.horas) || 0) : total;
    }, 0);
    if (horasEnSemana + duracion > 2) {
        showAlert(`Límite excedido: máximo 2 hs administrativas por semana. Esa semana ya tenés ${horasEnSemana}h.`, 'error');
        return;
    }

    const conflicto = lista.some(e => {
        if (e.fecha !== fecha || !e.horaInicio || !e.horaFin) return false;
        const eIni = parse12HourTime(e.horaInicio.split(' ')[0], e.horaInicio.split(' ')[1]);
        const eFin = parse12HourTime(e.horaFin.split(' ')[0], e.horaFin.split(' ')[1]);
        const iniE = eIni.hour * 60 + eIni.minute;
        const finE = eFin.hour * 60 + eFin.minute;
        return inicioMinutos < finE && finMinutos > iniE;
    });
    if (conflicto) {
        showAlert('Conflicto: ya tenés una entrada administrativa que se superpone en ese horario.', 'error');
        return;
    }

    lista.push({
        id: Date.now(),
        fecha,
        horaInicio: inicio.display,
        horaFin: fin.display,
        horas: duracion
    });
    saveHorasAdminArray(lista);
    registrarAccionAutomatica(`Carga Administrativa: ${duracion}h registradas para el ${formatearFechaCorta(fecha)} de ${inicio.display} a ${fin.display}.`);
    showAlert('Registro administrativo agregado.', 'success');

    fechaInput.value = '';
    horaInicioEl.selectedIndex = 0;
    horaFinEl.selectedIndex = 0;
    inicioAmpmEl.value = 'AM';
    finAmpmEl.value = 'AM';
    renderHorasAdminTabla();

    const horasAdminEl = document.getElementById('horas-administrative-val');
    if (horasAdminEl) horasAdminEl.textContent = totalHorasAdminDelMes() + 'h';
}

function cancelarHoraAdmin(id) {
    const lista = loadHorasAdmin();
    const entry = lista.find(e => e.id === id);
    if (!entry) return;

    const horario = (entry.horaInicio && entry.horaFin) ? `${entry.horaInicio} - ${entry.horaFin}` : `${entry.horas}h`;
    const motivo = prompt(`Motivo de cancelación del registro administrativo del ${formatearFechaCorta(entry.fecha)} (${horario}):`);
    if (motivo === null) return;
    const motivoTrim = motivo.trim();
    if (!motivoTrim) {
        showAlert('Debés indicar un motivo para cancelar.', 'warning');
        return;
    }

    const canceladas = loadCanceladas();
    canceladas.administrativas.unshift({
        id: Date.now(),
        fecha: entry.fecha,
        horaInicio: entry.horaInicio || '',
        horaFin: entry.horaFin || '',
        horas: entry.horas,
        motivo: motivoTrim,
        canceladaEn: timestampISO()
    });
    saveCanceladas(canceladas);

    const nueva = lista.filter(e => e.id !== id);
    saveHorasAdminArray(nueva);
    renderHorasAdminTabla();
    const horasAdminEl = document.getElementById('horas-administrative-val');
    if (horasAdminEl) horasAdminEl.textContent = totalHorasAdminDelMes() + 'h';

    if (typeof registrarAccionAutomatica === 'function') {
        registrarAccionAutomatica(`Carga Administrativa: Se canceló el registro del ${formatearFechaCorta(entry.fecha)} (${entry.horas}h). Motivo: ${motivoTrim}.`);
    }
    showAlert('Registro administrativo cancelado.', 'info');
    if (typeof renderCanceladas === 'function') renderCanceladas();
}

function eliminarHoraAdmin(id) { return cancelarHoraAdmin(id); }

function renderHorasAdminTabla() {
    const tbody = document.getElementById('tabla-admin');
    if (!tbody) return;
    const lista = loadHorasAdmin().slice().sort((a, b) => (a.fecha > b.fecha ? 1 : -1));
    if (lista.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" style="padding: 10px; text-align: center; color: #64748b; font-style: italic;">Sin entradas administrativas cargadas.</td></tr>`;
        return;
    }
    tbody.innerHTML = lista.map(e => {
        const horario = (e.horaInicio && e.horaFin) ? `${e.horaInicio} - ${e.horaFin}` : '—';
        return `
            <tr style="border-top: 1px solid #e2e8f0;">
                <td style="padding: 8px;">${formatearFechaCorta(e.fecha)}</td>
                <td style="padding: 8px;">${horario}</td>
                <td style="padding: 8px;">${e.horas}h</td>
                <td style="padding: 8px; text-align: right;">
                    <button onclick="cancelarHoraAdmin(${e.id})" style="color:#ef4444; background:none; border:none; cursor:pointer;" title="Cancelar"><i class="fas fa-ban"></i></button>
                </td>
            </tr>
        `;
    }).join('');
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

        if(this.dataset.target === 'bienestar') {
            if (window.Mensajeria) window.Mensajeria.refrescarSoloBadge();
        }

        if(this.dataset.target === 'materias') {
            if (typeof window.establecerSemanaFechaActualSilencioso === 'function') {
                window.establecerSemanaFechaActualSilencioso();
            }
        }
    };
});

if (window.Mensajeria) {
    window.Mensajeria.refrescarSoloBadge();
    setInterval(() => { if (window.Mensajeria) window.Mensajeria.refrescarSoloBadge(); }, 30000);
}

document.querySelectorAll('.bloque-colapsable .colapsable-header').forEach(header => {
    header.addEventListener('click', () => {
        const bloque = header.closest('.bloque-colapsable');
        const yaAbierto = bloque.classList.contains('abierto');
        bloque.classList.toggle('abierto');

        if (!yaAbierto) {
            const tipo = bloque.dataset.bloque;
            if (tipo === 'ficha-medica' && window.MiFicha) {
                window.MiFicha.init('mi-ficha-container');
            } else if (tipo === 'ficha-emocional' && window.MiFichaEmocional) {
                window.MiFichaEmocional.init('mi-ficha-emo-container');
            } else if (tipo === 'mensajes' && window.Mensajeria) {
                if (!window._mensajeriaIniciada) {
                    window.Mensajeria.init('mensajeria-container');
                    window._mensajeriaIniciada = true;
                } else {
                    window.Mensajeria.refrescarSoloBadge();
                }
            }
        }
    });
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
    await fetchEncuestaHoy();
    await fetchMateriasFromServer();
    render();
    renderNotas();
})();