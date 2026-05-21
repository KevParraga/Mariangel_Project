window.AdminPanel = (function () {
    let profesores = [];
    let profesorSeleccionadoFichas = null;

    function escapeHTML(s) {
        if (s == null) return '';
        return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    }
    function formatearFecha(iso) {
        if (!iso || !/^\d{4}-\d{2}-\d{2}/.test(iso)) return iso || '';
        const [y, m, d] = iso.substring(0, 10).split('-');
        return `${d}/${m}/${y}`;
    }
    function formatearFechaHora(iso) {
        if (!iso) return '';
        const d = new Date(iso.replace(' ', 'T'));
        if (isNaN(d.getTime())) return iso;
        const hh = String(d.getHours()).padStart(2, '0');
        const mm = String(d.getMinutes()).padStart(2, '0');
        return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()} ${hh}:${mm}`;
    }
    function avatar(p) {
        if (p.profilePic && p.profilePic.trim()) return p.profilePic;
        const nombre = encodeURIComponent(`${p.firstName || 'D'} ${p.lastName || ''}`.trim());
        return `https://ui-avatars.com/api/?name=${nombre}&background=64748b&color=fff`;
    }
    function nombre(p) { return `${p.firstName || ''} ${p.lastName || ''}`.trim() || p.email; }

    async function fetchProfesores() {
        const resp = await fetch('api_admin_profesores.php', { credentials: 'same-origin' });
        const json = await resp.json();
        if (!resp.ok || !json.success) throw new Error(json.error || 'Error al listar profesores');
        profesores = json.profesores || [];
    }

    // ============ TAB PROFESORES ============
    function renderProfesores() {
        const c = document.getElementById('profesores-container');
        if (!c) return;
        if (profesores.length === 0) {
            c.innerHTML = `<p style="text-align:center; color:#94a3b8; padding:20px;">No hay profesores registrados.</p>`;
            return;
        }
        c.innerHTML = `
            <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(280px, 1fr)); gap:14px;">
                ${profesores.map(p => `
                    <div style="background:white; border:1px solid #e2e8f0; border-radius:12px; padding:14px; display:flex; gap:12px; align-items:center;">
                        <img src="${avatar(p)}" alt="" style="width:48px; height:48px; border-radius:50%; object-fit:cover;">
                        <div style="flex:1; min-width:0;">
                            <div style="font-weight:700;">${escapeHTML(nombre(p))}</div>
                            <div style="font-size:0.8rem; color:#64748b;">${escapeHTML(p.especialidad || 'Sin especialidad')}</div>
                            <div style="font-size:0.75rem; color:#94a3b8;">${escapeHTML(p.email)}</div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    // ============ TAB BITACORA ============
    async function fetchBitacora(email) {
        const url = 'api_bitacora.php' + (email ? '?email=' + encodeURIComponent(email) : '');
        const resp = await fetch(url, { credentials: 'same-origin' });
        const json = await resp.json();
        if (!resp.ok || !json.success) throw new Error(json.error || 'Error al cargar bitácora');
        return json.registros || [];
    }

    function poblarSelectProfesores(selectId, incluirTodos) {
        const sel = document.getElementById(selectId);
        if (!sel) return;
        sel.innerHTML = (incluirTodos ? `<option value="">— Todos los profesores —</option>` : `<option value="" disabled selected hidden>— Seleccionar profesor —</option>`)
            + profesores.map(p => `<option value="${escapeHTML(p.email)}">${escapeHTML(nombre(p))} (${escapeHTML(p.email)})</option>`).join('');
    }

    async function renderBitacora() {
        const c = document.getElementById('bitacora-container');
        if (!c) return;
        c.innerHTML = `<p style="color:#94a3b8; padding:14px;"><i class="fas fa-spinner fa-spin"></i> Cargando...</p>`;
        const email = document.getElementById('bitacora-filtro-profesor').value;
        try {
            const registros = await fetchBitacora(email);
            if (registros.length === 0) {
                c.innerHTML = `<p style="text-align:center; color:#94a3b8; padding:20px;">No hay registros en la bitácora.</p>`;
                return;
            }
            c.innerHTML = `
                <div style="background:white; border:1px solid #e2e8f0; border-radius:12px; overflow:hidden;">
                    ${registros.map(r => `
                        <div style="padding:10px 14px; border-bottom:1px solid #eef2f7; display:flex; gap:12px; align-items:flex-start;">
                            <div style="font-size:0.75rem; color:#94a3b8; min-width:130px;">${formatearFechaHora(r.createdAt)}</div>
                            <div style="flex:1;">
                                <div style="font-size:0.78rem; color:#2563eb; font-weight:600;">${escapeHTML(r.usuarioEmail)}</div>
                                <div style="font-size:0.88rem; color:#1e293b;">${escapeHTML(r.descripcion)}</div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        } catch (err) {
            c.innerHTML = `<p style="color:#b91c1c; padding:14px;">Error: ${escapeHTML(err.message)}</p>`;
        }
    }

    // ============ TAB INASISTENCIAS ============
    async function fetchInasistencias() {
        const resp = await fetch('api_inasistencias.php', { credentials: 'same-origin' });
        const json = await resp.json();
        if (!resp.ok || !json.success) throw new Error(json.error || 'Error al cargar inasistencias');
        return json.registros || [];
    }

    async function renderInasistencias() {
        const c = document.getElementById('inasistencias-container');
        if (!c) return;
        c.innerHTML = `<p style="color:#94a3b8; padding:14px;"><i class="fas fa-spinner fa-spin"></i> Cargando...</p>`;
        try {
            const lista = await fetchInasistencias();
            if (lista.length === 0) {
                c.innerHTML = `<p style="text-align:center; color:#94a3b8; padding:20px;">No hay inasistencias registradas.</p>`;
                return;
            }
            c.innerHTML = `
                <div style="background:white; border:1px solid #e2e8f0; border-radius:12px; overflow:hidden;">
                    <div style="display:grid; grid-template-columns:160px 1fr 1fr 1fr auto; gap:10px; padding:10px 14px; background:#f8fafc; font-size:0.78rem; font-weight:700; color:#475569; text-transform:uppercase; letter-spacing:0.3px;">
                        <div>Fecha</div><div>Profesor</div><div>Motivo</div><div>Registrada por</div><div></div>
                    </div>
                    ${lista.map(i => {
                        const prof = profesores.find(p => p.email === i.profesorEmail);
                        return `
                        <div style="display:grid; grid-template-columns:160px 1fr 1fr 1fr auto; gap:10px; padding:10px 14px; border-top:1px solid #eef2f7; font-size:0.88rem; align-items:center;">
                            <div style="font-weight:600;">${formatearFecha(i.fecha)}</div>
                            <div>${escapeHTML(prof ? nombre(prof) : i.profesorEmail)}</div>
                            <div style="color:#475569;">${escapeHTML(i.motivo || '—')}</div>
                            <div style="font-size:0.78rem; color:#94a3b8;">${escapeHTML(i.registradaPor || '—')}</div>
                            <button class="btn btn-secondary" style="background:#fee2e2; color:#b91c1c; padding:4px 10px;" onclick="AdminPanel.eliminarInasistencia(${i.id})" title="Eliminar"><i class="fas fa-trash"></i></button>
                        </div>
                        `;
                    }).join('')}
                </div>
            `;
        } catch (err) {
            c.innerHTML = `<p style="color:#b91c1c; padding:14px;">Error: ${escapeHTML(err.message)}</p>`;
        }
    }

    async function registrarInasistencia() {
        const profesorEmail = document.getElementById('inasistencia-profesor').value;
        const fecha = document.getElementById('inasistencia-fecha-input').value;
        const motivo = document.getElementById('inasistencia-motivo-input').value.trim();
        if (!profesorEmail) { alert('Seleccioná un profesor.'); return; }
        if (!fecha) { alert('Indicá una fecha.'); return; }
        if (!motivo) { alert('Indicá un motivo.'); return; }

        try {
            const resp = await fetch('api_inasistencias.php', {
                method: 'POST',
                credentials: 'same-origin',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ profesorEmail, fecha, motivo })
            });
            const json = await resp.json();
            if (!resp.ok || !json.success) throw new Error(json.error || 'Error al registrar');
            document.getElementById('inasistencia-fecha-input').value = '';
            document.getElementById('inasistencia-motivo-input').value = '';
            document.getElementById('inasistencia-profesor').selectedIndex = 0;
            alert('Inasistencia registrada.');
            renderInasistencias();
        } catch (err) {
            alert('Error: ' + err.message);
        }
    }

    async function eliminarInasistencia(id) {
        if (!confirm('¿Eliminar esta inasistencia?')) return;
        try {
            const resp = await fetch('api_inasistencias.php', {
                method: 'DELETE',
                credentials: 'same-origin',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id })
            });
            const json = await resp.json();
            if (!resp.ok || !json.success) throw new Error(json.error || 'Error');
            renderInasistencias();
        } catch (err) {
            alert('Error: ' + err.message);
        }
    }

    // ============ TAB FICHAS MÉDICAS (read-only) ============
    function renderFichasLista() {
        const c = document.getElementById('fichas-admin-container');
        if (!c) return;
        c.innerHTML = `
            <div style="display:grid; grid-template-columns:300px 1fr; gap:16px; min-height:500px;">
                <div style="background:white; border:1px solid #e2e8f0; border-radius:12px; overflow:hidden;">
                    <div style="padding:12px 14px; border-bottom:1px solid #e2e8f0; font-weight:700;">Docentes</div>
                    <div id="fichas-admin-lista" style="max-height:520px; overflow-y:auto;">
                        ${profesores.map(p => `
                            <div class="fichas-admin-item" data-email="${escapeHTML(p.email)}" style="padding:10px 14px; cursor:pointer; border-bottom:1px solid #eef2f7; display:flex; gap:10px; align-items:center;">
                                <img src="${avatar(p)}" alt="" style="width:32px; height:32px; border-radius:50%; object-fit:cover;">
                                <div style="font-size:0.88rem;">${escapeHTML(nombre(p))}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                <div id="fichas-admin-detalle" style="background:white; border:1px solid #e2e8f0; border-radius:12px; padding:18px;">
                    <p style="color:#94a3b8; text-align:center; padding:40px;"><i class="fas fa-folder-open" style="font-size:2rem; display:block; margin-bottom:8px; color:#cbd5e1;"></i> Seleccioná un docente para ver su ficha.</p>
                </div>
            </div>
        `;
        c.querySelectorAll('.fichas-admin-item').forEach(el => {
            el.addEventListener('click', () => verFichaProfesor(el.dataset.email));
        });
    }

    async function verFichaProfesor(email) {
        profesorSeleccionadoFichas = email;
        const detalle = document.getElementById('fichas-admin-detalle');
        if (!detalle) return;
        detalle.innerHTML = `<p style="color:#94a3b8; padding:14px;"><i class="fas fa-spinner fa-spin"></i> Cargando...</p>`;
        try {
            const resp = await fetch('api_ficha_medica.php?email=' + encodeURIComponent(email), { credentials: 'same-origin' });
            const json = await resp.json();
            if (!resp.ok || !json.success) throw new Error(json.error || 'Error');
            const f = json.ficha;
            const visitas = json.visitas || [];
            const prof = profesores.find(p => p.email === email);
            const aviso = `<div style="background:#fef3c7; border:1px solid #fde68a; color:#92400e; padding:8px 12px; border-radius:8px; font-size:0.82rem; margin-bottom:14px;"><i class="fas fa-eye"></i> Vista de solo lectura</div>`;

            if (!f) {
                detalle.innerHTML = aviso + `<p style="color:#64748b; text-align:center; padding:30px;">${escapeHTML(prof ? nombre(prof) : email)} aún no tiene ficha médica.</p>`;
                return;
            }

            const item = (label, valor) => valor ? `
                <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:10px 12px; min-height:55px;">
                    <div style="font-size:0.72rem; color:#64748b; text-transform:uppercase; font-weight:600; margin-bottom:3px;">${escapeHTML(label)}</div>
                    <div style="font-size:0.92rem; color:#1e293b; font-weight:600; white-space:pre-wrap;">${escapeHTML(valor)}</div>
                </div>
            ` : '';

            detalle.innerHTML = aviso + `
                <h2 style="margin-top:0;">${escapeHTML(prof ? nombre(prof) : email)}</h2>
                <p style="color:#64748b; font-size:0.85rem;">${escapeHTML(prof?.especialidad || '')}</p>

                <h4 style="margin:18px 0 8px 0;"><i class="fas fa-tint" style="color:#ef4444;"></i> Datos básicos</h4>
                <div style="display:grid; grid-template-columns:repeat(2, 1fr); gap:10px;">
                    ${item('Tipo de sangre', f.tipo_sangre)}
                    ${item('Alergias', f.alergias)}
                    ${item('Enfermedades crónicas', f.enfermedades_cronicas)}
                    ${item('Medicación actual', f.medicacion_actual)}
                </div>

                <h4 style="margin:18px 0 8px 0;"><i class="fas fa-heart-pulse" style="color:#ef4444;"></i> Signos vitales</h4>
                <div style="display:grid; grid-template-columns:repeat(2, 1fr); gap:10px;">
                    ${item('Peso', f.peso ? f.peso + ' kg' : '')}
                    ${item('Altura', f.altura ? f.altura + ' m' : '')}
                    ${item('Presión arterial', f.presion_arterial)}
                    ${item('Frecuencia cardíaca', f.frecuencia_cardiaca ? f.frecuencia_cardiaca + ' bpm' : '')}
                </div>

                <h4 style="margin:18px 0 8px 0;"><i class="fas fa-phone" style="color:#0c4a6e;"></i> Contacto de emergencia</h4>
                <div style="display:grid; grid-template-columns:repeat(2, 1fr); gap:10px;">
                    ${item('Nombre', f.contacto_nombre)}
                    ${item('Teléfono', f.contacto_telefono)}
                    ${item('Relación', f.contacto_relacion)}
                </div>

                <h4 style="margin:18px 0 8px 0;"><i class="fas fa-notes-medical" style="color:#0c4a6e;"></i> Observaciones</h4>
                <div style="display:grid; grid-template-columns:repeat(2, 1fr); gap:10px;">
                    ${item('Última consulta', f.ultima_consulta ? formatearFecha(f.ultima_consulta) : '')}
                    ${item('Notas', f.observaciones)}
                </div>

                ${visitas.length > 0 ? `
                    <h4 style="margin:18px 0 8px 0;"><i class="fas fa-clipboard-list" style="color:#0c4a6e;"></i> Historial de visitas</h4>
                    ${visitas.map(v => `
                        <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:10px 12px; margin-bottom:6px; font-size:0.85rem;">
                            <div style="font-weight:700;">📅 ${formatearFecha(v.fecha)}</div>
                            ${v.motivo ? `<div style="color:#475569;">${escapeHTML(v.motivo)}</div>` : ''}
                            ${v.notas ? `<div style="color:#334155; white-space:pre-wrap; margin-top:4px;">${escapeHTML(v.notas)}</div>` : ''}
                        </div>
                    `).join('')}
                ` : ''}
            `;
        } catch (err) {
            detalle.innerHTML = `<p style="color:#b91c1c; padding:14px;">Error: ${escapeHTML(err.message)}</p>`;
        }
    }

    // ============ TAB HORARIOS ============
    function renderHorarios() {
        const c = document.getElementById('horarios-container');
        if (!c) return;
        if (profesores.length === 0) {
            c.innerHTML = `<p style="text-align:center; color:#94a3b8;">No hay profesores.</p>`;
            return;
        }
        c.innerHTML = `
            <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(360px, 1fr)); gap:14px;">
                ${profesores.map(p => `
                    <div style="background:white; border:1px solid #e2e8f0; border-radius:12px; padding:16px;">
                        <div style="display:flex; gap:10px; align-items:center; margin-bottom:12px;">
                            <img src="${avatar(p)}" alt="" style="width:40px; height:40px; border-radius:50%; object-fit:cover;">
                            <div>
                                <div style="font-weight:700;">${escapeHTML(nombre(p))}</div>
                                <div style="font-size:0.75rem; color:#94a3b8;">${escapeHTML(p.email)}</div>
                            </div>
                        </div>
                        ${p.horarioUrl ? renderHorarioPreview(p.horarioUrl) : `<p style="color:#94a3b8; font-style:italic; font-size:0.85rem;">Sin horario cargado.</p>`}
                        <label for="horario-input-${escapeHTML(p.email)}" class="btn btn-primary" style="margin-top:10px; cursor:pointer; width:100%; justify-content:center;">
                            <i class="fas fa-cloud-upload-alt"></i> ${p.horarioUrl ? 'Cambiar' : 'Subir'} horario
                        </label>
                        <input type="file" id="horario-input-${escapeHTML(p.email)}" style="display:none;" accept=".pdf,image/*" data-email="${escapeHTML(p.email)}" onchange="AdminPanel.subirHorario(event)">
                    </div>
                `).join('')}
            </div>
        `;
    }

    function renderHorarioPreview(url) {
        const lower = url.toLowerCase();
        if (lower.endsWith('.pdf')) {
            return `<iframe src="${url}" style="width:100%; height:300px; border:1px solid #e2e8f0; border-radius:8px;"></iframe>`;
        }
        return `<img src="${url}" style="max-width:100%; max-height:300px; display:block; margin:0 auto; border-radius:8px;">`;
    }

    async function subirHorario(event) {
        const file = event.target.files[0];
        if (!file) return;
        const email = event.target.dataset.email;
        const form = new FormData();
        form.append('horario', file);
        form.append('email', email);
        try {
            const resp = await fetch('upload_horario.php', { method: 'POST', body: form, credentials: 'same-origin' });
            const json = await resp.json();
            if (!resp.ok || !json.success) throw new Error(json.error || 'Error al subir');
            alert('Horario subido correctamente.');
            await fetchProfesores();
            renderHorarios();
        } catch (err) {
            alert('Error: ' + err.message);
        }
    }

    // ============ INIT ============
    async function init() {
        try {
            await fetchProfesores();
            renderProfesores();
            poblarSelectProfesores('bitacora-filtro-profesor', true);
            poblarSelectProfesores('inasistencia-profesor', false);
            document.getElementById('bitacora-filtro-profesor').addEventListener('change', renderBitacora);
        } catch (err) {
            document.querySelectorAll('.tab-content').forEach(c => {
                c.innerHTML = `<p style="color:#b91c1c; padding:14px;">Error: ${escapeHTML(err.message)}</p>`;
            });
        }

        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
                btn.classList.add('active');
                document.getElementById('tab-' + btn.dataset.tab).classList.add('active');

                if (btn.dataset.tab === 'bitacora') renderBitacora();
                if (btn.dataset.tab === 'inasistencias') renderInasistencias();
                if (btn.dataset.tab === 'fichas') renderFichasLista();
                if (btn.dataset.tab === 'horarios') renderHorarios();
            });
        });
    }

    document.addEventListener('DOMContentLoaded', init);

    return { registrarInasistencia, eliminarInasistencia, subirHorario, verFichaProfesor };
})();
