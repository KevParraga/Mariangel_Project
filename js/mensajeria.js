window.Mensajeria = (function () {
    const POLLING_MS = 10000;
    let pollingTimer = null;
    let conversacionAbierta = null;
    let estado = { contactos: [], disponibles: [], miEmail: '', miRole: '', totalNoLeidos: 0 };
    let containerEl = null;

    function escapeHTML(s) {
        if (s == null) return '';
        return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    }

    function formatearFechaHora(iso) {
        if (!iso) return '';
        const d = new Date(iso.replace(' ', 'T'));
        if (isNaN(d.getTime())) return iso;
        const hoy = new Date();
        const esHoy = d.toDateString() === hoy.toDateString();
        const hh = String(d.getHours()).padStart(2, '0');
        const mm = String(d.getMinutes()).padStart(2, '0');
        if (esHoy) return `${hh}:${mm}`;
        return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')} ${hh}:${mm}`;
    }

    function avatar(persona) {
        if (persona.profilePic && persona.profilePic.trim()) return persona.profilePic;
        const nombre = encodeURIComponent(`${persona.firstName || 'U'} ${persona.lastName || ''}`.trim());
        return `https://ui-avatars.com/api/?name=${nombre}&background=64748b&color=fff`;
    }

    function rolEtiqueta(role) {
        const map = { enfermera: '🩺 Enfermera', psicologa: '🧠 Psicóloga', teacher: '👨‍🏫 Docente', user: '👨‍🏫 Docente' };
        return map[role] || role || '';
    }

    function registrarBitacora(texto) {
        if (typeof window.registrarAccionAutomatica === 'function') {
            window.registrarAccionAutomatica(texto);
        }
    }

    function nombreDeContacto(email) {
        const c = estado.contactos.find(x => x.email === email) || estado.disponibles.find(x => x.email === email);
        if (!c) return email;
        const nombre = `${c.firstName || ''} ${c.lastName || ''}`.trim() || email;
        const rol = c.role ? ` (${rolEtiqueta(c.role).replace(/^[^ ]+ /, '')})` : '';
        return nombre + rol;
    }

    async function fetchContactos() {
        const resp = await fetch('api_mensajes.php', { credentials: 'same-origin' });
        const json = await resp.json();
        if (!resp.ok || !json.success) throw new Error(json.error || 'Error al cargar contactos');
        estado = {
            contactos: json.contactos || [],
            disponibles: json.disponibles || [],
            miEmail: json.miEmail,
            miRole: json.miRole,
            totalNoLeidos: json.totalNoLeidos || 0
        };
        actualizarBadgeGlobal();
        return estado;
    }

    async function fetchConversacion(email) {
        const resp = await fetch('api_mensajes.php?con=' + encodeURIComponent(email), { credentials: 'same-origin' });
        const json = await resp.json();
        if (!resp.ok || !json.success) throw new Error(json.error || 'Error al cargar conversación');
        return json.mensajes || [];
    }

    async function enviarMensaje(destinatario, contenido) {
        const resp = await fetch('api_mensajes.php', {
            method: 'POST',
            credentials: 'same-origin',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ destinatario, contenido })
        });
        const json = await resp.json();
        if (!resp.ok || !json.success) throw new Error(json.error || 'Error al enviar');
        return json.mensaje;
    }

    function actualizarBadgeGlobal() {
        const badge = document.getElementById('mensajes-badge-global');
        if (badge) {
            if (estado.totalNoLeidos > 0) {
                badge.textContent = estado.totalNoLeidos;
                badge.style.display = 'inline-flex';
            } else {
                badge.style.display = 'none';
            }
        }
    }

    function renderListaContactos() {
        const lista = document.getElementById('msg-lista-contactos');
        if (!lista) return;

        let html = '';
        if (estado.contactos.length === 0) {
            html += `<div style="padding:14px; color:#94a3b8; font-size:0.85rem; text-align:center;">Aún no tienes conversaciones.</div>`;
        } else {
            html += estado.contactos.map(c => {
                const nombre = `${c.firstName || ''} ${c.lastName || ''}`.trim() || c.email;
                const activeClass = (conversacionAbierta === c.email) ? 'msg-contact-active' : '';
                const badge = c.noLeidos > 0 ? `<span class="msg-badge">${c.noLeidos}</span>` : '';
                return `
                    <div class="msg-contact ${activeClass}" data-email="${escapeHTML(c.email)}">
                        <img src="${avatar(c)}" alt="">
                        <div class="msg-contact-info">
                            <div class="msg-contact-nombre">${escapeHTML(nombre)} ${badge}</div>
                            <div class="msg-contact-meta">${rolEtiqueta(c.role)}${c.especialidad ? ' · ' + escapeHTML(c.especialidad) : ''}</div>
                        </div>
                    </div>
                `;
            }).join('');
        }

        if (estado.disponibles.length > 0) {
            html += `<div class="msg-divider">Iniciar conversación</div>`;
            html += estado.disponibles.map(d => {
                const nombre = `${d.firstName || ''} ${d.lastName || ''}`.trim() || d.email;
                return `
                    <div class="msg-contact msg-contact-nuevo" data-email="${escapeHTML(d.email)}">
                        <img src="${avatar(d)}" alt="">
                        <div class="msg-contact-info">
                            <div class="msg-contact-nombre">${escapeHTML(nombre)}</div>
                            <div class="msg-contact-meta">${rolEtiqueta(d.role)}${d.especialidad ? ' · ' + escapeHTML(d.especialidad) : ''}</div>
                        </div>
                    </div>
                `;
            }).join('');
        }

        lista.innerHTML = html;
        lista.querySelectorAll('.msg-contact').forEach(el => {
            el.addEventListener('click', () => abrirConversacion(el.dataset.email));
        });
    }

    function renderMensajes(mensajes) {
        const cont = document.getElementById('msg-mensajes-container');
        if (!cont) return;
        if (!mensajes || mensajes.length === 0) {
            cont.innerHTML = `<div style="text-align:center; color:#94a3b8; padding:30px;">No hay mensajes todavía. ¡Sé el primero en escribir!</div>`;
            return;
        }
        cont.innerHTML = mensajes.map(m => `
            <div class="msg-bubble-wrap ${m.esPropio ? 'msg-prop' : 'msg-ajeno'}">
                <div class="msg-bubble">${escapeHTML(m.contenido).replace(/\n/g,'<br>')}</div>
                <div class="msg-bubble-time">${formatearFechaHora(m.fecha)}</div>
            </div>
        `).join('');
        cont.scrollTop = cont.scrollHeight;
    }

    function renderHeaderConversacion(email) {
        const head = document.getElementById('msg-chat-header');
        if (!head) return;
        const contacto = estado.contactos.find(c => c.email === email) || estado.disponibles.find(d => d.email === email);
        if (!contacto) {
            head.innerHTML = '<span style="color:#94a3b8;">Selecciona una conversación</span>';
            return;
        }
        const nombre = `${contacto.firstName || ''} ${contacto.lastName || ''}`.trim() || contacto.email;
        head.innerHTML = `
            <img src="${avatar(contacto)}" alt="">
            <div>
                <div style="font-weight:700;">${escapeHTML(nombre)}</div>
                <div style="font-size:0.8rem; color:#64748b;">${rolEtiqueta(contacto.role)}${contacto.especialidad ? ' · ' + escapeHTML(contacto.especialidad) : ''}</div>
            </div>
        `;
    }

    async function abrirConversacion(email) {
        const erasNuevoContacto = !estado.contactos.some(c => c.email === email);
        conversacionAbierta = email;
        renderHeaderConversacion(email);
        renderListaContactos();
        const formArea = document.getElementById('msg-form-area');
        if (formArea) formArea.style.display = 'flex';
        try {
            const mensajes = await fetchConversacion(email);
            renderMensajes(mensajes);
            await fetchContactos();
            renderListaContactos();
            if (erasNuevoContacto && mensajes.length === 0) {
                registrarBitacora(`Mensajería: Conversación iniciada con ${nombreDeContacto(email)}.`);
            }
        } catch (err) {
            const cont = document.getElementById('msg-mensajes-container');
            if (cont) cont.innerHTML = `<div style="color:#b91c1c; padding:20px;">Error: ${escapeHTML(err.message)}</div>`;
        }
        startPolling();
    }

    async function onEnviar(e) {
        e.preventDefault();
        if (!conversacionAbierta) return;
        const input = document.getElementById('msg-input');
        const texto = (input.value || '').trim();
        if (!texto) return;
        try {
            input.disabled = true;
            await enviarMensaje(conversacionAbierta, texto);
            try {
                registrarBitacora(`Mensajería: Mensaje enviado a ${nombreDeContacto(conversacionAbierta)}.`);
            } catch (logErr) {
                console.error('Error al registrar en bitácora:', logErr);
            }
            input.value = '';
            const mensajes = await fetchConversacion(conversacionAbierta);
            renderMensajes(mensajes);
            await fetchContactos();
            renderListaContactos();
        } catch (err) {
            alert('Error al enviar: ' + err.message);
        } finally {
            input.disabled = false;
            input.focus();
        }
    }

    function startPolling() {
        stopPolling();
        pollingTimer = setInterval(async () => {
            if (!conversacionAbierta) {
                try { await fetchContactos(); renderListaContactos(); } catch (e) {}
                return;
            }
            try {
                const mensajes = await fetchConversacion(conversacionAbierta);
                renderMensajes(mensajes);
                await fetchContactos();
                renderListaContactos();
            } catch (e) {}
        }, POLLING_MS);
    }

    function stopPolling() {
        if (pollingTimer) { clearInterval(pollingTimer); pollingTimer = null; }
    }

    function buildUI(container) {
        container.innerHTML = `
            <div class="msg-layout">
                <aside class="msg-sidebar">
                    <div class="msg-sidebar-head">Conversaciones</div>
                    <div id="msg-lista-contactos" class="msg-lista"></div>
                </aside>
                <section class="msg-chat">
                    <div id="msg-chat-header" class="msg-chat-head">
                        <span style="color:#94a3b8;">Selecciona una conversación</span>
                    </div>
                    <div id="msg-mensajes-container" class="msg-chat-body"></div>
                    <form id="msg-form-area" class="msg-form" style="display:none;">
                        <textarea id="msg-input" rows="2" maxlength="2000" placeholder="Escribí un mensaje... (Enter para enviar, Shift+Enter para nueva línea)"></textarea>
                        <button type="submit" class="btn btn-primary"><i class="fas fa-paper-plane"></i></button>
                    </form>
                </section>
            </div>
        `;

        const form = document.getElementById('msg-form-area');
        if (form) form.addEventListener('submit', onEnviar);

        const input = document.getElementById('msg-input');
        if (input) input.addEventListener('keydown', e => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                form.requestSubmit();
            }
        });
    }

    async function init(containerId, opciones) {
        opciones = opciones || {};
        containerEl = document.getElementById(containerId);
        if (!containerEl) return;
        buildUI(containerEl);
        try {
            await fetchContactos();
            renderListaContactos();
            if (opciones.abrirCon) await abrirConversacion(opciones.abrirCon);
            startPolling();
        } catch (err) {
            containerEl.innerHTML = `<div style="padding:20px; color:#b91c1c;">Error: ${escapeHTML(err.message)}</div>`;
        }
    }

    async function refrescarSoloBadge() {
        try { await fetchContactos(); } catch (e) {}
    }

    return { init, stopPolling, abrirConversacion, refrescarSoloBadge };
})();
