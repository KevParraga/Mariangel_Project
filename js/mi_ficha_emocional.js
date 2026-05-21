window.MiFichaEmocional = (function () {
    function escapeHTML(s) {
        if (s == null) return '';
        return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    }
    function formatearFecha(iso) {
        if (!iso || !/^\d{4}-\d{2}-\d{2}/.test(iso)) return iso || '';
        const [y, m, d] = iso.substring(0, 10).split('-');
        return `${d}/${m}/${y}`;
    }
    function item(label, valor) {
        if (!valor && valor !== 0) return '';
        return `<div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:10px 12px; min-height:60px;">
            <div style="font-size:0.72rem; color:#64748b; text-transform:uppercase; letter-spacing:0.3px; font-weight:600; margin-bottom:4px;">${escapeHTML(label)}</div>
            <div style="font-size:0.95rem; color:#1e293b; font-weight:600; word-wrap:break-word; white-space:pre-wrap; line-height:1.35;">${escapeHTML(valor)}</div>
        </div>`;
    }
    function seccion(titulo, icono, color, items) {
        const filtrados = items.filter(Boolean);
        if (filtrados.length === 0) return '';
        return `
            <h4 style="margin:20px 0 10px 0; font-size:0.95rem; color:#475569;"><i class="fas ${icono}" style="color:${color};"></i> ${escapeHTML(titulo)}</h4>
            <div style="display:grid; grid-template-columns:repeat(2, 1fr); gap:10px;">
                ${filtrados.join('')}
            </div>
        `;
    }

    async function fetchFicha() {
        const resp = await fetch('api_ficha_emocional.php', { credentials: 'same-origin' });
        const json = await resp.json();
        if (!resp.ok || !json.success) throw new Error(json.error || 'Error al cargar tu ficha emocional');
        return json;
    }

    function render(container, data) {
        const f = data.ficha;
        const sesiones = data.sesiones || [];

        if (!f) {
            container.innerHTML = `
                <div style="padding:24px; text-align:center; color:#64748b; background:#f8fafc; border:1px dashed #cbd5e1; border-radius:12px;">
                    <i class="fas fa-folder-open" style="font-size:1.8rem; color:#cbd5e1; display:block; margin-bottom:8px;"></i>
                    Aún no tenés una ficha emocional registrada por la psicóloga.
                </div>
            `;
            return;
        }

        let html = `<div style="background:white; border:1px solid #e2e8f0; border-radius:12px; padding:18px;">`;

        html += seccion('Estado y antecedentes', 'fa-brain', '#6c5ce7', [
            item('Estado emocional dominante', f.estado_emocional),
            item('Antecedentes psicológicos', f.antecedentes)
        ]);

        html += seccion('Tratamiento actual', 'fa-stethoscope', '#6c5ce7', [
            item('Tipo de terapia', f.tipo_terapia),
            item('Medicación psiquiátrica', f.medicacion_psiquiatrica)
        ]);

        html += seccion('Contexto vital', 'fa-bolt', '#f59e0b', [
            item('Factores de estrés actuales', f.factores_estres),
            item('Red de apoyo', f.red_apoyo)
        ]);

        html += seccion('Seguimiento', 'fa-notes-medical', '#0c4a6e', [
            item('Última sesión', formatearFecha(f.ultima_sesion)),
            item('Próxima sesión', formatearFecha(f.proxima_sesion)),
            item('Observaciones', f.observaciones)
        ]);

        html += `<div style="margin-top:14px; font-size:0.75rem; color:#94a3b8;">Última actualización: ${escapeHTML(f.updated_at || '—')} por ${escapeHTML(f.updated_by_email || 'psicóloga')}</div>`;
        html += `</div>`;

        if (sesiones.length > 0) {
            html += `<div style="margin-top:14px; background:white; border:1px solid #e2e8f0; border-radius:12px; padding:18px;">`;
            html += `<h4 style="margin:0 0 12px 0; font-size:0.95rem; color:#475569;"><i class="fas fa-clipboard-list" style="color:#6c5ce7;"></i> Historial de sesiones</h4>`;
            html += sesiones.map(v => `
                <div style="padding:10px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; margin-bottom:8px; font-size:0.88rem;">
                    <div style="font-weight:700; color:#1e293b;">📅 ${formatearFecha(v.fecha)}</div>
                    ${v.motivo ? `<div style="color:#475569; font-style:italic;">${escapeHTML(v.motivo)}</div>` : ''}
                    ${v.notas ? `<div style="color:#334155; white-space:pre-wrap; margin-top:4px;">${escapeHTML(v.notas)}</div>` : ''}
                </div>
            `).join('');
            html += `</div>`;
        }

        container.innerHTML = html;
    }

    async function init(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;
        container.innerHTML = `<div style="padding:20px; text-align:center; color:#94a3b8;"><i class="fas fa-spinner fa-spin"></i> Cargando tu ficha emocional...</div>`;
        try {
            const data = await fetchFicha();
            render(container, data);
        } catch (err) {
            container.innerHTML = `<div style="padding:18px; color:#b91c1c; background:#fef2f2; border-radius:10px;">Error al cargar tu ficha emocional: ${escapeHTML(err.message)}</div>`;
        }
    }

    return { init };
})();
