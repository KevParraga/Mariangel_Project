window.FichasEmocionales = (function () {
    let profesores = [];
    let fichaActual = null;
    let sesionesActual = [];
    let emailSeleccionado = null;
    let containerEl = null;

    function escapeHTML(s) {
        if (s == null) return '';
        return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    }
    function formatearFecha(iso) {
        if (!iso || !/^\d{4}-\d{2}-\d{2}/.test(iso)) return iso || '';
        const [y, m, d] = iso.substring(0, 10).split('-');
        return `${d}/${m}/${y}`;
    }
    function avatar(p) {
        if (p.profilePic && p.profilePic.trim()) return p.profilePic;
        const nombre = encodeURIComponent(`${p.firstName || 'D'} ${p.lastName || ''}`.trim());
        return `https://ui-avatars.com/api/?name=${nombre}&background=64748b&color=fff`;
    }

    async function fetchProfesores() {
        const resp = await fetch('api_ficha_emocional.php?listar=1', { credentials: 'same-origin' });
        const json = await resp.json();
        if (!resp.ok || !json.success) throw new Error(json.error || 'Error al listar profesores');
        profesores = json.profesores || [];
    }

    async function fetchFicha(email) {
        const resp = await fetch('api_ficha_emocional.php?email=' + encodeURIComponent(email), { credentials: 'same-origin' });
        const json = await resp.json();
        if (!resp.ok || !json.success) throw new Error(json.error || 'Error al cargar ficha');
        fichaActual = json.ficha || null;
        sesionesActual = json.sesiones || [];
    }

    function renderLista(filtro) {
        const lista = document.getElementById('ficha-emo-lista-prof');
        if (!lista) return;
        const f = (filtro || '').toLowerCase().trim();
        const items = profesores.filter(p => {
            if (!f) return true;
            const nombre = `${p.firstName} ${p.lastName}`.toLowerCase();
            return nombre.includes(f) || (p.especialidad || '').toLowerCase().includes(f) || p.email.includes(f);
        });
        if (items.length === 0) {
            lista.innerHTML = `<div style="padding:14px; color:#94a3b8; font-size:0.85rem; text-align:center;">Sin resultados.</div>`;
            return;
        }
        lista.innerHTML = items.map(p => {
            const activeCls = (p.email === emailSeleccionado) ? 'active' : '';
            return `
                <div class="ficha-item ${activeCls}" data-email="${escapeHTML(p.email)}">
                    <img src="${avatar(p)}" alt="">
                    <div>
                        <div class="nombre">${escapeHTML(`${p.firstName} ${p.lastName}`.trim() || p.email)}</div>
                        <div class="esp">${escapeHTML(p.especialidad || 'Sin especialidad')}</div>
                    </div>
                </div>
            `;
        }).join('');
        lista.querySelectorAll('.ficha-item').forEach(el => {
            el.addEventListener('click', () => seleccionarProfesor(el.dataset.email));
        });
    }

    function renderPanel() {
        const panel = document.getElementById('ficha-emo-panel');
        if (!panel) return;
        if (!emailSeleccionado) {
            panel.innerHTML = `
                <div class="ficha-empty">
                    <i class="fas fa-folder-open"></i>
                    Selecciona un docente de la lista para ver o editar su ficha emocional.
                </div>
            `;
            return;
        }
        const prof = profesores.find(p => p.email === emailSeleccionado);
        const f = fichaActual || {};
        const nombre = prof ? `${prof.firstName} ${prof.lastName}`.trim() : emailSeleccionado;
        const esp = prof ? prof.especialidad || '' : '';

        panel.innerHTML = `
            <div style="display:flex; gap:14px; align-items:center; margin-bottom:16px;">
                <img src="${avatar(prof || {})}" alt="" style="width:56px; height:56px; border-radius:50%; object-fit:cover;">
                <div>
                    <h2 style="margin:0; font-size:1.2rem;">${escapeHTML(nombre)}</h2>
                    <div style="color:#64748b; font-size:0.85rem;">${escapeHTML(esp)} · ${escapeHTML(emailSeleccionado)}</div>
                </div>
            </div>

            <form id="ficha-emo-form">
                <div class="ficha-section-title"><i class="fas fa-brain"></i> Estado y antecedentes</div>
                <div class="ficha-grid">
                    <div class="ficha-field">
                        <label>Estado emocional dominante</label>
                        <input type="text" name="estadoEmocional" placeholder="Ansioso, estable, decaído..." value="${escapeHTML(f.estado_emocional || '')}">
                    </div>
                    <div class="ficha-field" style="grid-column: span 2;">
                        <label>Antecedentes psicológicos</label>
                        <textarea name="antecedentes" placeholder="Depresión previa, ataques de pánico, etc.">${escapeHTML(f.antecedentes || '')}</textarea>
                    </div>
                </div>

                <div class="ficha-section-title"><i class="fas fa-stethoscope"></i> Tratamiento actual</div>
                <div class="ficha-grid">
                    <div class="ficha-field">
                        <label>Tipo de terapia</label>
                        <input type="text" name="tipoTerapia" placeholder="Cognitivo-conductual, sistémica..." value="${escapeHTML(f.tipo_terapia || '')}">
                    </div>
                    <div class="ficha-field" style="grid-column: span 2;">
                        <label>Medicación psiquiátrica</label>
                        <textarea name="medicacionPsiquiatrica" placeholder="Sertralina 50mg, etc.">${escapeHTML(f.medicacion_psiquiatrica || '')}</textarea>
                    </div>
                </div>

                <div class="ficha-section-title"><i class="fas fa-bolt"></i> Contexto vital</div>
                <div class="ficha-grid">
                    <div class="ficha-field" style="grid-column: span 2;">
                        <label>Factores de estrés actuales</label>
                        <textarea name="factoresEstres" placeholder="Sobrecarga laboral, conflictos familiares...">${escapeHTML(f.factores_estres || '')}</textarea>
                    </div>
                    <div class="ficha-field" style="grid-column: span 2;">
                        <label>Red de apoyo</label>
                        <textarea name="redApoyo" placeholder="Familia cercana, amigos, grupos de apoyo...">${escapeHTML(f.red_apoyo || '')}</textarea>
                    </div>
                </div>

                <div class="ficha-section-title"><i class="fas fa-notes-medical"></i> Seguimiento</div>
                <div class="ficha-grid">
                    <div class="ficha-field" style="grid-column: 1 / -1;">
                        <label>Observaciones generales</label>
                        <textarea name="observaciones" rows="3">${escapeHTML(f.observaciones || '')}</textarea>
                    </div>
                    <div class="ficha-field">
                        <label>Última sesión</label>
                        <input type="date" name="ultimaSesion" value="${f.ultima_sesion ? f.ultima_sesion.substring(0,10) : ''}">
                    </div>
                    <div class="ficha-field">
                        <label>Próxima sesión</label>
                        <input type="date" name="proximaSesion" value="${f.proxima_sesion ? f.proxima_sesion.substring(0,10) : ''}">
                    </div>
                </div>

                <div class="ficha-actions">
                    <button type="submit" class="btn btn-primary"><i class="fas fa-save"></i> Guardar ficha</button>
                </div>
            </form>

            <div class="ficha-section-title" style="margin-top:24px;"><i class="fas fa-clipboard-list"></i> Historial de sesiones</div>
            <div id="sesiones-list" class="visitas-list"></div>
            <form id="sesion-form" class="visita-form">
                <input type="date" name="fecha" value="${new Date().toISOString().slice(0,10)}" required>
                <input type="text" name="motivo" placeholder="Motivo de la sesión" required>
                <button type="submit" class="btn btn-primary"><i class="fas fa-plus"></i> Agregar</button>
                <textarea name="notas" rows="2" placeholder="Notas adicionales (opcional)"></textarea>
            </form>
        `;

        renderSesiones();

        const formFicha = document.getElementById('ficha-emo-form');
        if (formFicha) formFicha.addEventListener('submit', onGuardarFicha);

        const formSesion = document.getElementById('sesion-form');
        if (formSesion) formSesion.addEventListener('submit', onAgregarSesion);
    }

    function renderSesiones() {
        const cont = document.getElementById('sesiones-list');
        if (!cont) return;
        if (!sesionesActual || sesionesActual.length === 0) {
            cont.innerHTML = `<div style="color:#94a3b8; font-style:italic; padding:10px 0; font-size:0.85rem;">No hay sesiones registradas.</div>`;
            return;
        }
        cont.innerHTML = sesionesActual.map(v => `
            <div class="visita-item">
                <div class="head">
                    <span class="fecha">📅 ${formatearFecha(v.fecha)}</span>
                    <button class="del" data-id="${v.id}" title="Eliminar"><i class="fas fa-trash"></i></button>
                </div>
                ${v.motivo ? `<div class="motivo">${escapeHTML(v.motivo)}</div>` : ''}
                ${v.notas ? `<div class="notas">${escapeHTML(v.notas)}</div>` : ''}
                <div class="meta">Registrado por ${escapeHTML(v.createdBy || '—')}</div>
            </div>
        `).join('');
        cont.querySelectorAll('button.del').forEach(b => {
            b.addEventListener('click', () => eliminarSesion(parseInt(b.dataset.id, 10)));
        });
    }

    async function seleccionarProfesor(email) {
        emailSeleccionado = email;
        renderLista(document.getElementById('ficha-emo-search')?.value || '');
        try {
            await fetchFicha(email);
            renderPanel();
        } catch (err) {
            const panel = document.getElementById('ficha-emo-panel');
            if (panel) panel.innerHTML = `<div style="color:#b91c1c; padding:20px;">Error: ${escapeHTML(err.message)}</div>`;
        }
    }

    async function onGuardarFicha(e) {
        e.preventDefault();
        if (!emailSeleccionado) return;
        const data = new FormData(e.target);
        const payload = { accion: 'ficha', profesorEmail: emailSeleccionado };
        data.forEach((v, k) => { payload[k] = v; });
        try {
            const resp = await fetch('api_ficha_emocional.php', {
                method: 'POST',
                credentials: 'same-origin',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const json = await resp.json();
            if (!resp.ok || !json.success) throw new Error(json.error || 'Error al guardar');
            fichaActual = json.ficha;
            sesionesActual = json.sesiones || sesionesActual;
            renderPanel();
            alert('Ficha emocional guardada correctamente.');
        } catch (err) {
            alert('Error: ' + err.message);
        }
    }

    async function onAgregarSesion(e) {
        e.preventDefault();
        if (!emailSeleccionado) return;
        const data = new FormData(e.target);
        const payload = {
            accion: 'sesion',
            profesorEmail: emailSeleccionado,
            fecha: data.get('fecha'),
            motivo: data.get('motivo'),
            notas: data.get('notas') || ''
        };
        try {
            const resp = await fetch('api_ficha_emocional.php', {
                method: 'POST',
                credentials: 'same-origin',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const json = await resp.json();
            if (!resp.ok || !json.success) throw new Error(json.error || 'Error');
            sesionesActual = json.sesiones || [];
            e.target.reset();
            const fechaInput = e.target.querySelector('input[name="fecha"]');
            if (fechaInput) fechaInput.value = new Date().toISOString().slice(0,10);
            renderSesiones();
        } catch (err) {
            alert('Error: ' + err.message);
        }
    }

    async function eliminarSesion(id) {
        if (!confirm('¿Eliminar esta sesión del historial?')) return;
        try {
            const resp = await fetch('api_ficha_emocional.php', {
                method: 'DELETE',
                credentials: 'same-origin',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id })
            });
            const json = await resp.json();
            if (!resp.ok || !json.success) throw new Error(json.error || 'Error');
            sesionesActual = json.sesiones || [];
            renderSesiones();
        } catch (err) {
            alert('Error: ' + err.message);
        }
    }

    function buildUI(container) {
        container.innerHTML = `
            <div class="ficha-layout">
                <aside class="ficha-sidebar">
                    <div class="ficha-sidebar-head">
                        <div>Docentes</div>
                        <input id="ficha-emo-search" type="text" placeholder="Buscar por nombre o email...">
                    </div>
                    <div id="ficha-emo-lista-prof" class="ficha-lista"></div>
                </aside>
                <section id="ficha-emo-panel" class="ficha-panel"></section>
            </div>
        `;
        const search = document.getElementById('ficha-emo-search');
        if (search) search.addEventListener('input', e => renderLista(e.target.value));
    }

    async function init(containerId) {
        containerEl = document.getElementById(containerId);
        if (!containerEl) return;
        buildUI(containerEl);
        try {
            await fetchProfesores();
            renderLista('');
            renderPanel();
        } catch (err) {
            containerEl.innerHTML = `<div style="padding:20px; color:#b91c1c;">Error: ${escapeHTML(err.message)}</div>`;
        }
    }

    return { init };
})();
