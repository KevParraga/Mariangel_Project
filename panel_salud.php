<?php
session_start();
$role = strtolower($_SESSION['user_role'] ?? '');
if (!in_array($role, ['enfermera', 'psicologa'], true)) {
    header('Location: Login.html');
    exit;
}
$vistaTitulo = $role === 'enfermera' ? 'Panel de Salud Física' : 'Panel de Salud Mental';
$vistaIcono = $role === 'enfermera' ? 'fa-stethoscope' : 'fa-brain';
$vistaColor = $role === 'enfermera' ? '#00b894' : '#6c5ce7';
$nombreUser = trim(($_SESSION['user_first_name'] ?? '') . ' ' . ($_SESSION['user_last_name'] ?? ''));
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo htmlspecialchars($vistaTitulo); ?> - EcoAcademia</title>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="Css/mensajeria.css">
    <link rel="stylesheet" href="Css/ficha_medica.css">
    <style>
        :root { --acento: <?php echo $vistaColor; ?>; }
        * { box-sizing: border-box; }
        body { margin: 0; font-family: 'Plus Jakarta Sans', system-ui, sans-serif; background: #f8fafc; color: #1e293b; min-height: 100vh; }
        header.topbar {
            background: white; border-bottom: 1px solid #e2e8f0;
            padding: 14px 24px; display: flex; align-items: center; justify-content: space-between;
            position: sticky; top: 0; z-index: 10;
        }
        .topbar h1 { margin: 0; font-size: 1.25rem; display: flex; align-items: center; gap: 10px; }
        .topbar h1 i { color: var(--acento); }
        .topbar .user-info { display: flex; align-items: center; gap: 14px; font-size: 0.9rem; color: #475569; }
        .topbar a.logout { color: #ef4444; text-decoration: none; font-weight: 600; }
        .topbar a.logout:hover { text-decoration: underline; }

        main { max-width: 1200px; margin: 0 auto; padding: 24px; }
        .intro { margin-bottom: 24px; }
        .intro h2 { margin: 0 0 6px 0; font-size: 1.5rem; }
        .intro p { margin: 0; color: #64748b; font-size: 0.95rem; }

        .toolbar { display: flex; gap: 12px; margin-bottom: 18px; flex-wrap: wrap; }
        .search-input {
            flex: 1; min-width: 220px; padding: 10px 14px;
            border: 1px solid #cbd5e1; border-radius: 10px; font-size: 0.95rem; background: white;
        }

        .cards-grid {
            display: grid; gap: 16px;
            grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
        }
        .card-prof {
            background: white; border-radius: 14px; padding: 18px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.04); border: 1px solid #e2e8f0;
            display: flex; flex-direction: column; gap: 12px;
            transition: box-shadow 0.2s;
        }
        .card-prof:hover { box-shadow: 0 8px 20px rgba(0,0,0,0.08); }

        .card-prof .head { display: flex; gap: 12px; align-items: center; }
        .card-prof .head img {
            width: 52px; height: 52px; border-radius: 50%; object-fit: cover;
            border: 2px solid var(--acento);
        }
        .card-prof .head .info h3 { margin: 0; font-size: 1.05rem; line-height: 1.2; }
        .card-prof .head .info .esp { margin: 2px 0 0 0; color: #64748b; font-size: 0.82rem; }

        .card-prof .meta {
            font-size: 0.8rem; color: #64748b;
            display: flex; justify-content: space-between; align-items: center;
            padding: 6px 10px; background: #f1f5f9; border-radius: 8px;
        }
        .card-prof .meta .badge {
            background: var(--acento); color: white; padding: 3px 10px;
            border-radius: 12px; font-weight: 700; font-size: 0.75rem;
        }

        .card-prof .diag {
            padding: 12px; border-radius: 10px; background: #fafafa;
            border-left: 4px solid var(--acento);
        }
        .card-prof .diag p { margin: 0 0 8px 0; font-size: 0.9rem; line-height: 1.45; }
        .card-prof .diag .tips-title { font-size: 0.8rem; font-weight: 700; color: #475569; }
        .card-prof .diag ul { margin: 4px 0 0 0; padding-left: 20px; font-size: 0.85rem; color: #475569; }
        .card-prof .diag ul li { margin-bottom: 2px; }

        .empty {
            text-align: center; padding: 60px 20px; color: #64748b;
            background: white; border-radius: 14px; border: 1px dashed #cbd5e1;
        }
        .empty i { font-size: 2.5rem; color: #cbd5e1; display: block; margin-bottom: 12px; }

        .tabs { display: flex; gap: 6px; margin-bottom: 18px; border-bottom: 1px solid #e2e8f0; }
        .tab-btn {
            padding: 10px 18px; background: none; border: none; cursor: pointer;
            font-weight: 600; color: #64748b; font-size: 0.95rem;
            border-bottom: 3px solid transparent; transition: all 0.2s;
            display: flex; align-items: center; gap: 8px;
        }
        .tab-btn:hover { color: var(--acento); }
        .tab-btn.active { color: var(--acento); border-bottom-color: var(--acento); }
        .tab-content { display: none; }
        .tab-content.active { display: block; }

        .card-prof .btn-mensaje {
            background: var(--acento); color: white; border: none;
            padding: 8px 12px; border-radius: 8px; cursor: pointer;
            font-size: 0.82rem; font-weight: 600;
            display: flex; align-items: center; gap: 6px; justify-content: center;
        }
        .card-prof .btn-mensaje:hover { opacity: 0.9; }
    </style>
</head>
<body>
    <header class="topbar">
        <h1><i class="fas <?php echo $vistaIcono; ?>"></i> <?php echo htmlspecialchars($vistaTitulo); ?></h1>
        <div class="user-info">
            <span><i class="fas fa-user-circle"></i> <?php echo htmlspecialchars($nombreUser ?: $_SESSION['user_email'] ?? 'Usuario'); ?></span>
            <a href="Login.html" class="logout" onclick="return confirm('¿Cerrar sesión?');"><i class="fas fa-sign-out-alt"></i> Salir</a>
        </div>
    </header>

    <main>
        <div class="tabs">
            <button class="tab-btn active" data-tab="resultados"><i class="fas fa-clipboard-check"></i> Resultados</button>
            <button class="tab-btn" data-tab="mensajes-tab"><i class="fas fa-comments"></i> Mensajes <span id="mensajes-badge-global" class="sidebar-badge"></span></button>
            <?php if ($role === 'enfermera'): ?>
                <button class="tab-btn" data-tab="fichas-tab"><i class="fas fa-notes-medical"></i> Fichas médicas</button>
            <?php endif; ?>
            <?php if ($role === 'psicologa'): ?>
                <button class="tab-btn" data-tab="fichas-emo-tab"><i class="fas fa-brain"></i> Fichas emocionales</button>
            <?php endif; ?>
        </div>

        <div id="tab-resultados" class="tab-content active">
            <div class="intro">
                <h2>Resultados de bienestar de los docentes</h2>
                <p>Historial completo ordenado del más reciente al más antiguo.</p>
            </div>

            <div class="toolbar">
                <input type="text" id="filtroNombre" class="search-input" placeholder="🔍 Buscar por nombre o especialidad...">
            </div>

            <div id="cardsContainer" class="cards-grid">
                <div class="empty"><i class="fas fa-spinner fa-spin"></i> Cargando registros...</div>
            </div>
        </div>

        <div id="tab-mensajes-tab" class="tab-content">
            <div class="intro">
                <h2>Mensajes</h2>
                <p>Conversaciones con los docentes.</p>
            </div>
            <div id="mensajeria-container"></div>
        </div>

        <?php if ($role === 'enfermera'): ?>
        <div id="tab-fichas-tab" class="tab-content">
            <div class="intro">
                <h2>Fichas médicas</h2>
                <p>Datos básicos de salud de cada docente y su historial de visitas.</p>
            </div>
            <div id="fichas-container"></div>
        </div>
        <?php endif; ?>

        <?php if ($role === 'psicologa'): ?>
        <div id="tab-fichas-emo-tab" class="tab-content">
            <div class="intro">
                <h2>Fichas emocionales</h2>
                <p>Estado emocional, antecedentes y seguimiento de sesiones de cada docente.</p>
            </div>
            <div id="fichas-emo-container"></div>
        </div>
        <?php endif; ?>
    </main>

    <script>
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
                btn.classList.add('active');
                document.getElementById('tab-' + btn.dataset.tab).classList.add('active');
                if (btn.dataset.tab === 'mensajes-tab' && window.Mensajeria) {
                    if (!window._mensajeriaIniciada) {
                        window.Mensajeria.init('mensajeria-container');
                        window._mensajeriaIniciada = true;
                    } else {
                        window.Mensajeria.refrescarSoloBadge();
                    }
                }
                if (btn.dataset.tab === 'fichas-tab' && window.FichasMedicas) {
                    if (!window._fichasIniciada) {
                        window.FichasMedicas.init('fichas-container');
                        window._fichasIniciada = true;
                    }
                }
                if (btn.dataset.tab === 'fichas-emo-tab' && window.FichasEmocionales) {
                    if (!window._fichasEmoIniciada) {
                        window.FichasEmocionales.init('fichas-emo-container');
                        window._fichasEmoIniciada = true;
                    }
                }
            });
        });
    </script>
    <script src="js/mensajeria.js?v=20260521"></script>
    <?php if ($role === 'enfermera'): ?>
    <script src="js/fichas_medicas.js?v=20260521"></script>
    <?php endif; ?>
    <?php if ($role === 'psicologa'): ?>
    <script src="js/fichas_emocionales.js?v=20260521"></script>
    <?php endif; ?>
    <script src="js/panel_salud.js"></script>
    <script>
        if (window.Mensajeria) {
            window.Mensajeria.refrescarSoloBadge();
            setInterval(() => { if (window.Mensajeria) window.Mensajeria.refrescarSoloBadge(); }, 30000);
        }
    </script>
</body>
</html>
