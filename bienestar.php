<?php session_start(); ?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Portal de Bienestar Integral</title>
    <style>
        :root {
            --primary-emo: #6c5ce7;
            --primary-fis: #00b894;
            --bg-color: #f8f9fa;
            --card-bg: #ffffff;
            --text-main: #2d3436;
            --text-muted: #636e72;
            --border-color: #dfe6e9;
        }

        body {
            font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
            background-color: var(--bg-color);
            color: var(--text-main);
            margin: 0;
            padding: 20px;
            display: flex;
            flex-direction: column;
            align-items: center;
            min-height: 100vh;
            justify-content: center;
        }

        /* Contenedor General Tipo Tarjeta */
        .main-card {
            width: 100%;
            max-width: 550px;
            background: var(--card-bg);
            border-radius: 16px;
            padding: 35px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
            box-sizing: border-box;
            transition: all 0.3s ease;
        }

        /* Pantalla de Selección Inicial */
        .selection-screen {
            text-align: center;
        }

        .selection-screen h2 {
            margin-top: 0;
            color: #2c3e50;
            font-size: 1.5rem;
        }

        .selection-screen p {
            color: var(--text-muted);
            margin-bottom: 30px;
        }

        .btn-select {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 15px;
            width: 100%;
            padding: 20px;
            margin-bottom: 15px;
            border: 2px solid var(--border-color);
            border-radius: 12px;
            background: white;
            font-size: 1.1rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s ease;
        }

        .btn-emo-select { color: var(--primary-emo); }
        .btn-emo-select:hover { border-color: var(--primary-emo); background: #fdf6ff; }
        
        .btn-fis-select { color: var(--primary-fis); }
        .btn-fis-select:hover { border-color: var(--primary-fis); background: #f4fbf7; }

        /* Barra de Progreso */
        .progress-container {
            width: 100%;
            height: 6px;
            background-color: var(--border-color);
            border-radius: 10px;
            margin-bottom: 30px;
            overflow: hidden;
        }

        .progress-bar {
            height: 100%;
            width: 0%;
            background-color: var(--primary-emo);
            transition: width 0.3s ease, background-color 0.3s ease;
        }

        .badge-categoria {
            display: inline-block;
            padding: 6px 14px;
            border-radius: 20px;
            font-size: 0.8rem;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 15px;
        }

        .badge-emo { background: #e0d7ff; color: var(--primary-emo); }
        .badge-fis { background: #d1f7ed; color: var(--primary-fis); }

        .pregunta-texto {
            font-size: 1.25rem;
            font-weight: 600;
            line-height: 1.4;
            margin-bottom: 25px;
            min-height: 60px;
        }

        /* Opciones de respuesta */
        .opciones-verticales {
            display: flex;
            flex-direction: column;
            gap: 12px;
        }

        .opciones-verticales label {
            padding: 16px 20px;
            border: 2px solid var(--border-color);
            border-radius: 12px;
            cursor: pointer;
            font-weight: 500;
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
        }

        .opciones-verticales label:hover {
            background-color: #f1f2f6;
            border-color: #b2bec3;
        }

        .opciones-verticales input {
            margin-right: 15px;
            transform: scale(1.2);
        }

        /* Color dinámico de la barra según el test activo */
        .main-card.modo-fisico .progress-bar {
            background-color: var(--primary-fis);
        }

        /* Panel de Resultados */
        .resultado-panel {
            display: none;
            width: 100%;
            max-width: 700px;
            background: white;
            border-radius: 16px;
            padding: 35px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.08);
            box-sizing: border-box;
        }

        .resultado-card {
            padding: 20px;
            border-radius: 12px;
            margin-bottom: 20px;
            background: #fafafa;
            border-left: 5px solid;
        }

        .res-emo { border-left-color: var(--primary-emo); }
        .res-fis { border-left-color: var(--primary-fis); }

        .btn-reiniciar {
            display: block;
            width: 100%;
            padding: 14px;
            background: var(--text-main);
            color: white;
            border: none;
            border-radius: 10px;
            font-weight: bold;
            font-size: 1rem;
            cursor: pointer;
            margin-top: 25px;
            transition: background 0.2s;
        }

        .btn-reiniciar:hover { background: #1e2224; }
    </style>
</head>
<body>

<!-- TARJETA PRINCIPAL DEL FLUJO -->
<div id="contenedor-principal" class="main-card">
    
    <!-- PANTALLA 1: SELECCIÓN DE INICIO -->
    <div id="pantalla-seleccion" class="selection-screen">
        <h2>Bienvenido a tu Evaluación de Bienestar</h2>
        <p>¿Por qué área te gustaría comenzar tu análisis el día de hoy?</p>
        
        <button class="btn-select btn-emo-select" onclick="comenzarFlujo('emo')">
            <span>🧠 Diagnóstico Emocional</span>
        </button>
        <button class="btn-select btn-fis-select" onclick="comenzarFlujo('fis')">
            <span>🩺 Consultorio Virtual (Físico)</span>
        </button>
    </div>

    <!-- PANTALLA 2: EL CUESTIONARIO COMPUESTO (Oculto inicialmente) -->
    <div id="pantalla-preguntas" style="display: none;">
        <div class="progress-container">
            <div id="barra-progreso" class="progress-bar"></div>
        </div>
        
        <div id="badge-tipo" class="badge-categoria badge-emo">Diagnóstico Emocional</div>
        <div id="pregunta-actual" class="pregunta-texto">Cargando pregunta...</div>
        
        <div class="opciones-verticales">
            <label><input type="radio" name="opcion_wizard" value="3" onclick="siguientePregunta(3)"> <span>Mal / Alto</span></label>
            <label><input type="radio" name="opcion_wizard" value="2" onclick="siguientePregunta(2)"> <span>Regular / Moderado</span></label>
            <label><input type="radio" name="opcion_wizard" value="1" onclick="siguientePregunta(1)"> <span>Bien / Bajo</span></label>
        </div>
    </div>
</div>

<!-- SECCIÓN 3: PANEL DE RESULTADOS (Fuera de la tarjeta para dar más espacio) -->
<div id="panel-resultados" class="resultado-panel">
    <h2 style="margin-top:0; color: var(--text-main); text-align: center;">📋 Tu Balance Diario</h2>
    
    <div class="resultado-card res-emo">
        <h3 style="color: var(--primary-emo); margin-top:0;">Salud Emocional</h3>
        <p id="diag-emocional-texto"></p>
        <strong>💡 Consejos recomendados:</strong>
        <ul id="tips-emocional-lista" style="margin-top: 5px; padding-left: 20px;"></ul>
    </div>

    <div class="resultado-card res-fis">
        <h3 style="color: var(--primary-fis); margin-top:0;">Consultorio Clínico Virtual</h3>
        <p id="diag-fisico-texto"></p>
        <strong>💡 Consejos recomendados:</strong>
        <ul id="tips-fisico-lista" style="margin-top: 5px; padding-left: 20px;"></ul>
    </div>

    <button class="btn-reiniciar" onclick="reiniciarFlujoCompleto()">Realizar nueva evaluación</button>
</div>

<script>
// Bancos de datos fijos
const bancoEmocional = [
    "¿Qué tan abrumado te has sentido con tus responsabilidades hoy?",
    "¿Has experimentado cambios repentinos de humor en las últimas horas?",
    "¿Qué tanta paciencia has tenido contigo mismo y con los demás hoy?",
    "¿Te cuesta desconectar tu mente al momento de ir a descansar?",
    "¿Has sentido una sensación de paz o tranquilidad constante durante el día?",
    "¿Con qué frecuencia te has sentido ansioso o con incertidumbre hoy?",
    "¿Te sientes conforme con lo que has logrado hacer en tu jornada?",
    "¿Qué tan conectado te sientes con tus emociones en este momento?"
];

const bancoFisico = [
    "¿Cómo calificarías tu nivel de energía física corporal en este momento?",
    "¿Has sentido alguna tensión o rigidez muscular en el cuello o espalda?",
    "¿Qué tan reparador fue tu descanso nocturno anterior?",
    "¿Has experimentado dolores de cabeza o pesadez en los ojos hoy?",
    "¿Consideras que tu consumo de agua ha sido el adecuado hoy?",
    "¿Has sentido pesadez estomacal o molestias digestivas durante el día?",
    "¿Qué tanta fatiga física sientes al realizar tus actividades cotidianas?",
    "¿Sientes que tu vista ha estado demasiado expuesta a pantallas hoy?"
];

const bienUserEmail = <?php echo json_encode($_SESSION['user_email'] ?? ''); ?>;
const bienUserCi = <?php echo json_encode($_SESSION['user_cedula'] ?? ''); ?>;
let preguntasOrdenadas = [];
let indiceActual = 0;
let scoreEmo = 0;
let scoreFis = 0;
let respuestasUsuario = [];

function obtenerPreguntasAleatorias(banco, cantidad = 8) {
    return [...banco].sort(() => 0.5 - Math.random()).slice(0, cantidad);
}

function comenzarFlujo(eleccionInicial) {
    // Obtener las preguntas aleatorias de cada bloque
    const emoArr = obtenerPreguntasAleatorias(bancoEmocional, 8).map(q => ({ texto: q, tipo: 'emo' }));
    const fisArr = obtenerPreguntasAleatorias(bancoFisico, 8).map(q => ({ texto: q, tipo: 'fis' }));
    
    // Organizar el orden del arreglo final basado en lo que el usuario eligió primero
    if (eleccionInicial === 'emo') {
        preguntasOrdenadas = [...emoArr, ...fisArr];
    } else {
        preguntasOrdenadas = [...fisArr, ...emoArr];
    }

    indiceActual = 0;
    scoreEmo = 0;
    scoreFis = 0;

    // Cambiar de pantalla dentro de la tarjeta
    document.getElementById('pantalla-seleccion').style.display = 'none';
    document.getElementById('pantalla-preguntas').style.display = 'block';
    
    mostrarPreguntaWizard();
}

function mostrarPreguntaWizard() {
    // Desmarcar los inputs radio
    const radios = document.querySelectorAll('input[name="opcion_wizard"]');
    radios.forEach(r => r.checked = false);

    const q = preguntasOrdenadas[indiceActual];
    const contenedorCard = document.getElementById('contenedor-principal');
    const badge = document.getElementById('badge-tipo');
    
    document.getElementById('pregunta-actual').innerText = `${indiceActual + 1}. ${q.texto}`;
    
    // Ajustar diseño visual e indicadores según el tipo de pregunta en curso
    if (q.tipo === 'emo') {
        badge.innerText = "Diagnóstico Emocional";
        badge.className = "badge-categoria badge-emo";
        contenedorCard.classList.remove('modo-fisico');
    } else {
        badge.innerText = "Consultorio Virtual (Salud Física)";
        badge.className = "badge-categoria badge-fis";
        contenedorCard.classList.add('modo-fisico');
    }

    // Actualizar barra de progreso (va de 0% a 100% a lo largo de las 16 preguntas)
    const pct = (indiceActual / preguntasOrdenadas.length) * 100;
    document.getElementById('barra-progreso').style.width = pct + '%';
}

function siguientePregunta(valorSeleccionado) {
    const q = preguntasOrdenadas[indiceActual];
    
    // Guardar cada respuesta del usuario
    respuestasUsuario.push({
        pregunta: q.texto,
        tipo: q.tipo,
        respuesta: valorSeleccionado
    });

    // Almacenar el puntaje de manera independiente
    if (q.tipo === 'emo') scoreEmo += valorSeleccionado;
    else scoreFis += valorSeleccionado;

    // Retraso controlado para mejorar la transición visual del clic
    setTimeout(() => {
        indiceActual++;
        if (indiceActual < preguntasOrdenadas.length) {
            mostrarPreguntaWizard();
        } else {
            finalizarAnalisisCompleto();
        }
    }, 200);
}

function finalizarAnalisisCompleto() {
    // Ocultar la tarjeta de preguntas
    document.getElementById('contenedor-principal').style.display = 'none';

    // 1. Evaluar Resultados Emocionales
    const txtEmo = document.getElementById('diag-emocional-texto');
    const listaTipsEmo = document.getElementById('tips-emocional-lista');
    listaTipsEmo.innerHTML = "";

    if(scoreEmo >= 19) {
        txtEmo.innerText = "Presentas indicadores de cansancio mental o niveles altos de estrés acumulado en tu jornada.";
        listaTipsEmo.innerHTML += "<li>Pon en práctica la regla 20-20-20 para relajar la mente periódicamente.</li><li>Escribe tus pendientes principales para liberar espacio cognitivo.</li>";
    } else if(scoreEmo >= 13) {
        txtEmo.innerText = "Tu balance psicológico es moderado. Se observa estabilidad pero con ligeros focos de fatiga rutinaria.";
        listaTipsEmo.innerHTML += "<li>Dedica de 10 a 15 minutos a un pasatiempo totalmente desconectado de dispositivos.</li>";
    } else {
        txtEmo.innerText = "¡Excelente balance emocional! Tu mente se encuentra en un estado óptimo de calma, enfoque y claridad.";
        listaTipsEmo.innerHTML += "<li>Sigue manteniendo tus límites saludables de rendimiento y descanso.</li>";
    }

    // 2. Evaluar Resultados del Consultorio Clínico Virtual
    const txtFis = document.getElementById('diag-fisico-texto');
    const listaTipsFis = document.getElementById('tips-fisico-lista');
    listaTipsFis.innerHTML = "";

    if(scoreFis >= 19) {
        txtFis.innerText = "El consultorio detecta fatiga corporal acumulada, tensión muscular o falta de pausas físicas.";
        listaTipsFis.innerHTML += "<li>Realiza estiramientos suaves enfocados en el cuello, hombros y lumbares.</li><li>Asegúrate de beber un vaso de agua ahora mismo para optimizar la hidratación.</li>";
    } else if(scoreFis >= 13) {
        txtFis.innerText = "Estado físico regular. El cuerpo responde bien pero denota sutiles demandas de descanso postural.";
        listaTipsFis.innerHTML += "<li>Levántate del asiento y camina por la habitación durante 5 minutos para oxigenar los músculos.</li>";
    } else {
        txtFis.innerText = "Tu energía corporal y salud física reportan condiciones estables, libres de tensiones molestas.";
        listaTipsFis.innerHTML += "<li>Continúa protegiendo tu postura erguida frente al escritorio y tus comidas.</li>";
    }

    // Mostrar el panel general de diagnósticos
    document.getElementById('panel-resultados').style.display = 'block';
    guardarEncuesta();
}

function getLocalDateString() {
    const hoy = new Date();
    const year = hoy.getFullYear();
    const month = String(hoy.getMonth() + 1).padStart(2, '0');
    const day = String(hoy.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function calcularNivelCargaBienestar(scoreEmo, scoreFis) {
    const maxScorePorArea = 24;
    const totalMax = maxScorePorArea * 2;
    return Math.min(Math.round(((scoreEmo + scoreFis) / totalMax) * 100), 100);
}

function guardarEncuesta() {
    const listaTipsEmo = Array.from(document.querySelectorAll('#tips-emocional-lista li')).map(li => li.innerText);
    const listaTipsFis = Array.from(document.querySelectorAll('#tips-fisico-lista li')).map(li => li.innerText);

    if (!bienUserEmail) {
        console.warn('No se encontró correo de usuario en sesión. No se guardará la encuesta automáticamente.');
        return;
    }

    fetch('api_encuesta.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            email: bienUserEmail,
            cedula: bienUserCi,
            respuestas: respuestasUsuario,
            tipsEmocionales: listaTipsEmo.join('\n'),
            tipsFisicos: listaTipsFis.join('\n'),
            scoreEmo,
            scoreFis
        })
    })
    .then(response => response.json())
    .then(data => {
        if (!data.success) {
            console.warn('No se pudo guardar la encuesta:', data.error || data.message);
        }

        const nivelCarga = calcularNivelCargaBienestar(scoreEmo, scoreFis);
        fetch('api_bienestar.php', {
            method: 'POST',
            credentials: 'same-origin',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: bienUserEmail,
                fecha: getLocalDateString(),
                scoreEmo,
                scoreFis,
                nivelCarga,
                tipo: 'integral',
                observaciones: respuestasUsuario.map(r => `${r.tipo}:${r.pregunta}:${r.respuesta}`).join(' | ')
            })
        })
        .then(resp => resp.json())
        .then(bienData => {
            if (!bienData.success) {
                console.warn('No se pudo guardar el bienestar en la bitácora:', bienData.error || bienData.message);
            }
        })
        .catch(error => console.error('Error al guardar bienestar en bitácora:', error));
    })
    .catch(error => console.error('Error al guardar encuesta:', error));
}

function reiniciarFlujoCompleto() {
    // Reestablecer la vista por defecto
    respuestasUsuario = [];
    document.getElementById('panel-resultados').style.display = 'none';
    document.getElementById('contenedor-principal').style.display = 'block';
    document.getElementById('pantalla-preguntas').style.display = 'none';
    document.getElementById('pantalla-seleccion').style.display = 'block';
}
</script>

</body>
</html>