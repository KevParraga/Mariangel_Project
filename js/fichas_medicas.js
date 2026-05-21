window.FichasMedicas = (function () {
    let profesores = [];
    let fichaActual = null;
    let visitasActual = [];
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
        const resp = await fetch('api_ficha_medica.php?listar=1', { credentials: 'same-origin' });
        const json = await resp.json();
        if (!resp.ok || !json.success) throw new Error(json.error || 'Error al listar profesores');
        profesores = json.profesores || [];
    }

    async function fetchFicha(email) {
        const resp = await fetch('api_ficha_medica.php?email=' + encodeURIComponent(email), { credentials: 'same-origin' });
        const json = await resp.json();
        if (!resp.ok || !json.success) throw new Error(json.error || 'Error al cargar ficha');
        fichaActual = json.ficha || null;
        visitasActual = json.visitas || [];
    }

    function renderLista(filtro) {
        const lista = document.getElementById('ficha-lista-prof');
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
        const panel = document.getElementById('ficha-panel');
        if (!panel) return;
        if (!emailSeleccionado) {
            panel.innerHTML = `
                <div class="ficha-empty">
                    <i class="fas fa-folder-open"></i>
                    Selecciona un docente de la lista para ver o editar su ficha médica.
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

            <form id="ficha-form">
                <div class="ficha-section-title"><i class="fas fa-tint"></i> Datos básicos</div>
                <div class="ficha-grid">
                    <div class="ficha-field">
                        <label>Tipo de sangre</label>
                        <select name="tipoSangre">
                            <option value="">--</option>
                            ${['O+','O-','A+','A-','B+','B-','AB+','AB-'].map(t => `<option value="${t}" ${f.tipo_sangre === t ? 'selected' : ''}>${t}</option>`).join('')}
                        </select>
                    </div>
                    <div class="ficha-field" style="grid-column: span 2;">
                        <label>Alergias</label>
                        <textarea name="alergias" placeholder="Penicilina, polen, etc.">${escapeHTML(f.alergias || '')}</textarea>
                    </div>
                    <div class="ficha-field" style="grid-column: span 2;">
                        <label>Enfermedades crónicas</label>
                        <textarea name="enfermedadesCronicas" placeholder="Diabetes tipo 2, hipertensión...">${escapeHTML(f.enfermedades_cronicas || '')}</textarea>
                    </div>
                    <div class="ficha-field" style="grid-column: span 2;">
                        <label>Medicación actual</label>
                        <textarea name="medicacionActual" placeholder="Metformina 500mg cada 12h...">${escapeHTML(f.medicacion_actual || '')}</textarea>
                    </div>
                </div>

                <div class="ficha-section-title"><i class="fas fa-heart-pulse"></i> Signos vitales</div>
                <div class="ficha-grid">
                    <div class="ficha-field">
                        <label>Peso (kg)</label>
                        <input type="number" step="0.1" min="20" max="300" name="peso" value="${f.peso || ''}">
                    </div>
                    <div class="ficha-field">
                        <label>Altura (m)</label>
                        <input type="number" step="0.01" min="0.5" max="2.5" name="altura" value="${f.altura || ''}">
                    </div>
                    <div class="ficha-field">
                        <label>Presión arterial</label>
                        <input type="text" name="presionArterial" placeholder="120/80" value="${escapeHTML(f.presion_arterial || '')}">
                    </div>
                    <div class="ficha-field">
                        <label>Frecuencia cardíaca (bpm)</label>
                        <input type="number" min="30" max="220" name="frecuenciaCardiaca" value="${f.frecuencia_cardiaca || ''}">
                    </div>
                </div>

                <div class="ficha-section-title"><i class="fas fa-phone"></i> Contacto de emergencia</div>
                <div class="ficha-grid">
                    <div class="ficha-field">
                        <label>Nombre</label>
                        <input type="text" name="contactoNombre" value="${escapeHTML(f.contacto_nombre || '')}">
                    </div>
                    <div class="ficha-field">
                        <label>Teléfono</label>
                        <input type="text" name="contactoTelefono" value="${escapeHTML(f.contacto_telefono || '')}">
                    </div>
                    <div class="ficha-field">
                        <label>Relación</label>
                        <input type="text" name="contactoRelacion" placeholder="Esposa, padre, hermano..." value="${escapeHTML(f.contacto_relacion || '')}">
                    </div>
                </div>

                <div class="ficha-section-title"><i class="fas fa-notes-medical"></i> Observaciones</div>
                <div class="ficha-grid">
                    <div class="ficha-field" style="grid-column: 1 / -1;">
                        <label>Notas generales</label>
                        <textarea name="observaciones" rows="3">${escapeHTML(f.observaciones || '')}</textarea>
                    </div>
                    <div class="ficha-field">
                        <label>Fecha última consulta</label>
                        <input type="date" name="ultimaConsulta" value="${f.ultima_consulta ? f.ultima_consulta.substring(0,10) : ''}">
                    </div>
                </div>

                <div class="ficha-actions">
                    <button type="submit" class="btn btn-primary"><i class="fas fa-save"></i> Guardar ficha</button>
                </div>
            </form>

            <div class="ficha-section-title" style="margin-top:24px;"><i class="fas fa-clipboard-list"></i> Historial de visitas</div>
            <div id="visitas-list" class="visitas-list"></div>
            <form id="visita-form" class="visita-form">
                <input type="date" name="fecha" value="${new Date().toISOString().slice(0,10)}" required>
                <input type="text" name="motivo" placeholder="Motivo de la visita" required>
                <button type="submit" class="btn btn-primary"><i class="fas fa-plus"></i> Agregar</button>
                <textarea name="notas" rows="2" placeholder="Notas adicionales (opcional)"></textarea>
            </form>
        `;

        renderVisitas();

        const formFicha = document.getElementById('ficha-form');
        if (formFicha) formFicha.addEventListener('submit', onGuardarFicha);

        const formVisita = document.getElementById('visita-form');
        if (formVisita) formVisita.addEventListener('submit', onAgregarVisita);
    }

    function renderVisitas() {
        const cont = document.getElementById('visitas-list');
        if (!cont) return;
        if (!visitasActual || visitasActual.length === 0) {
            cont.innerHTML = `<div style="color:#94a3b8; font-style:italic; padding:10px 0; font-size:0.85rem;">No hay visitas registradas.</div>`;
            return;
        }
        cont.innerHTML = visitasActual.map(v => `
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
            b.addEventListener('click', () => eliminarVisita(parseInt(b.dataset.id, 10)));
        });
    }

    async function seleccionarProfesor(email) {
        emailSeleccionado = email;
        renderLista(document.getElementById('ficha-search')?.value || '');
        try {
            await fetchFicha(email);
            renderPanel();
        } catch (err) {
            const panel = document.getElementById('ficha-panel');
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
            const resp = await fetch('api_ficha_medica.php', {
                method: 'POST',
                credentials: 'same-origin',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const json = await resp.json();
            if (!resp.ok || !json.success) throw new Error(json.error || 'Error al guardar');
            fichaActual = json.ficha;
            visitasActual = json.visitas || visitasActual;
            renderPanel();
            alert('Ficha guardada correctamente.');
        } catch (err) {
            alert('Error: ' + err.message);
        }
    }

    async function onAgregarVisita(e) {
        e.preventDefault();
        if (!emailSeleccionado) return;
        const data = new FormData(e.target);
        const payload = {
            accion: 'visita',
            profesorEmail: emailSeleccionado,
            fecha: data.get('fecha'),
            motivo: data.get('motivo'),
            notas: data.get('notas') || ''
        };
        try {
            const resp = await fetch('api_ficha_medica.php', {
                method: 'POST',
                credentials: 'same-origin',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const json = await resp.json();
            if (!resp.ok || !json.success) throw new Error(json.error || 'Error');
            visitasActual = json.visitas || [];
            e.target.reset();
            const fechaInput = e.target.querySelector('input[name="fecha"]');
            if (fechaInput) fechaInput.value = new Date().toISOString().slice(0,10);
            renderVisitas();
        } catch (err) {
            alert('Error: ' + err.message);
        }
    }

    async function eliminarVisita(id) {
        if (!confirm('¿Eliminar esta visita del historial?')) return;
        try {
            const resp = await fetch('api_ficha_medica.php', {
                method: 'DELETE',
                credentials: 'same-origin',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id })
            });
            const json = await resp.json();
            if (!resp.ok || !json.success) throw new Error(json.error || 'Error');
            visitasActual = json.visitas || [];
            renderVisitas();
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
                        <input id="ficha-search" type="text" placeholder="Buscar por nombre o email...">
                    </div>
                    <div id="ficha-lista-prof" class="ficha-lista"></div>
                </aside>
                <section id="ficha-panel" class="ficha-panel"></section>
            </div>
        `;
        const search = document.getElementById('ficha-search');
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
