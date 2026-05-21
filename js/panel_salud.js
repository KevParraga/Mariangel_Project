let registrosCache = [];
let vistaActual = '';

function formatearFechaCorta(fechaISO) {
    if (typeof fechaISO !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(fechaISO)) return fechaISO || '---';
    const [y, m, d] = fechaISO.split('-');
    return `${d}/${m}/${y}`;
}

function diagnosticoEmocional(scoreEmo) {
    if (scoreEmo >= 19) {
        return {
            texto: 'Presenta indicadores de cansancio mental o niveles altos de estrés acumulado.',
            tipsFallback: [
                'Pon en práctica la regla 20-20-20 para relajar la mente periódicamente.',
                'Escribir los pendientes principales ayuda a liberar espacio cognitivo.'
            ],
            etiqueta: 'Desgaste Alto'
        };
    }
    if (scoreEmo >= 13) {
        return {
            texto: 'Balance psicológico moderado. Estabilidad con ligeros focos de fatiga rutinaria.',
            tipsFallback: ['Dedicar 10 a 15 minutos a un pasatiempo desconectado de dispositivos.'],
            etiqueta: 'Moderado'
        };
    }
    return {
        texto: 'Balance emocional óptimo. Mente en estado de calma, enfoque y claridad.',
        tipsFallback: ['Mantener límites saludables de rendimiento y descanso.'],
        etiqueta: 'Óptimo'
    };
}

function diagnosticoFisico(scoreFis) {
    if (scoreFis >= 19) {
        return {
            texto: 'Se detecta fatiga corporal acumulada, tensión muscular o falta de pausas físicas.',
            tipsFallback: [
                'Realizar estiramientos suaves enfocados en cuello, hombros y lumbares.',
                'Hidratación adecuada con un vaso de agua de inmediato.'
            ],
            etiqueta: 'Fatiga Alta'
        };
    }
    if (scoreFis >= 13) {
        return {
            texto: 'Estado físico regular. El cuerpo responde bien pero denota demandas de descanso postural.',
            tipsFallback: ['Caminar 5 minutos cada cierto tiempo para oxigenar los músculos.'],
            etiqueta: 'Moderado'
        };
    }
    return {
        texto: 'Energía corporal y salud física estables, libres de tensiones molestas.',
        tipsFallback: ['Continuar protegiendo la postura erguida frente al escritorio.'],
        etiqueta: 'Saludable'
    };
}

function obtenerAvatar(reg) {
    if (reg.profilePic && reg.profilePic.trim()) return reg.profilePic;
    const nombre = encodeURIComponent(`${reg.firstName || 'Docente'} ${reg.lastName || ''}`.trim());
    return `https://ui-avatars.com/api/?name=${nombre}&background=64748b&color=fff`;
}

function botonMensaje(email) {
    return `<button class="btn-mensaje" onclick="abrirMensajeCon('${email}')"><i class="fas fa-paper-plane"></i> Enviar mensaje</button>`;
}

function renderCardFisica(reg) {
    const diag = diagnosticoFisico(reg.scoreFis);
    const tipsList = (reg.tipsFisicos && reg.tipsFisicos.trim())
        ? reg.tipsFisicos.split('\n').map(t => t.trim()).filter(Boolean)
        : diag.tipsFallback;
    const nombre = `${reg.firstName || ''} ${reg.lastName || ''}`.trim() || reg.email;

    return `
        <div class="card-prof">
            <div class="head">
                <img src="${obtenerAvatar(reg)}" alt="${nombre}">
                <div class="info">
                    <h3>${nombre}</h3>
                    <p class="esp">${reg.especialidad || 'Sin especialidad'}</p>
                </div>
            </div>
            <div class="meta">
                <span>📅 ${formatearFechaCorta(reg.fecha)}</span>
                <span class="badge">${diag.etiqueta}</span>
            </div>
            <div class="diag">
                <p>${diag.texto}</p>
                <span class="tips-title">💡 Tips físicos recomendados:</span>
                <ul>${tipsList.map(t => `<li>${t}</li>`).join('')}</ul>
            </div>
            ${botonMensaje(reg.email)}
        </div>
    `;
}

function renderCardEmocional(reg) {
    const diag = diagnosticoEmocional(reg.scoreEmo);
    const tipsList = (reg.tipsEmocionales && reg.tipsEmocionales.trim())
        ? reg.tipsEmocionales.split('\n').map(t => t.trim()).filter(Boolean)
        : diag.tipsFallback;
    const nombre = `${reg.firstName || ''} ${reg.lastName || ''}`.trim() || reg.email;

    return `
        <div class="card-prof">
            <div class="head">
                <img src="${obtenerAvatar(reg)}" alt="${nombre}">
                <div class="info">
                    <h3>${nombre}</h3>
                    <p class="esp">${reg.especialidad || 'Sin especialidad'}</p>
                </div>
            </div>
            <div class="meta">
                <span>📅 ${formatearFechaCorta(reg.fecha)}</span>
                <span class="badge">${diag.etiqueta}</span>
            </div>
            <div class="diag">
                <p>${diag.texto}</p>
                <span class="tips-title">💡 Tips emocionales recomendados:</span>
                <ul>${tipsList.map(t => `<li>${t}</li>`).join('')}</ul>
            </div>
            ${botonMensaje(reg.email)}
        </div>
    `;
}

window.abrirMensajeCon = function (email) {
    const tabBtn = document.querySelector('.tab-btn[data-tab="mensajes-tab"]');
    if (tabBtn) tabBtn.click();
    if (window.Mensajeria) {
        if (!window._mensajeriaIniciada) {
            window.Mensajeria.init('mensajeria-container', { abrirCon: email });
            window._mensajeriaIniciada = true;
        } else {
            window.Mensajeria.abrirConversacion(email);
        }
    }
};

function render(lista) {
    const cont = document.getElementById('cardsContainer');
    if (!cont) return;

    if (!lista || lista.length === 0) {
        cont.innerHTML = `
            <div class="empty" style="grid-column: 1 / -1;">
                <i class="fas fa-folder-open"></i>
                No hay registros de bienestar para mostrar.
            </div>
        `;
        return;
    }

    cont.innerHTML = lista
        .map(reg => vistaActual === 'fisica' ? renderCardFisica(reg) : renderCardEmocional(reg))
        .join('');
}

function filtrar(texto) {
    const t = (texto || '').toLowerCase().trim();
    if (!t) return registrosCache;
    return registrosCache.filter(r => {
        const nombre = `${r.firstName || ''} ${r.lastName || ''}`.toLowerCase();
        const esp = (r.especialidad || '').toLowerCase();
        return nombre.includes(t) || esp.includes(t);
    });
}

async function cargar() {
    try {
        const resp = await fetch('api_panel_salud.php', { credentials: 'same-origin' });
        const json = await resp.json();
        if (!resp.ok || !json.success) {
            throw new Error(json.error || 'No se pudieron cargar los registros');
        }
        registrosCache = json.records || [];
        vistaActual = json.vista || 'mental';
        render(registrosCache);
    } catch (err) {
        const cont = document.getElementById('cardsContainer');
        if (cont) cont.innerHTML = `
            <div class="empty" style="grid-column: 1 / -1; color: #b91c1c;">
                <i class="fas fa-exclamation-triangle"></i>
                Error al cargar: ${err.message}
            </div>
        `;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    cargar();
    const filtro = document.getElementById('filtroNombre');
    if (filtro) {
        filtro.addEventListener('input', e => render(filtrar(e.target.value)));
    }
});
