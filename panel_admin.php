<?php
session_start();
$role = strtolower($_SESSION['user_role'] ?? '');
if ($role !== 'admin') {
    header('Location: Login.html');
    exit;
}
$nombreUser = trim(($_SESSION['user_first_name'] ?? '') . ' ' . ($_SESSION['user_last_name'] ?? ''));
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Panel Administrador - EcoAcademia</title>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="Css/ficha_medica.css">
    <style>
        :root { --acento: #2563eb; }
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
        main { max-width: 1300px; margin: 0 auto; padding: 24px; }

        .tabs { display: flex; gap: 6px; margin-bottom: 18px; border-bottom: 1px solid #e2e8f0; flex-wrap: wrap; }
        .tab-btn {
            padding: 10px 16px; background: none; border: none; cursor: pointer;
            font-weight: 600; color: #64748b; font-size: 0.92rem;
            border-bottom: 3px solid transparent; transition: all 0.2s;
            display: flex; align-items: center; gap: 8px;
        }
        .tab-btn:hover { color: var(--acento); }
        .tab-btn.active { color: var(--acento); border-bottom-color: var(--acento); }
        .tab-content { display: none; }
        .tab-content.active { display: block; }

        .intro h2 { margin: 0 0 6px 0; font-size: 1.4rem; }
        .intro p { margin: 0 0 18px 0; color: #64748b; font-size: 0.95rem; }

        .btn { padding: 8px 14px; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 0.88rem; display: inline-flex; align-items: center; gap: 6px; }
        .btn-primary { background: var(--acento); color: white; }
        .btn-primary:hover { opacity: 0.9; }
        .btn-secondary { background: #e2e8f0; color: #1e293b; }
        .input-text, .input-select, .input-date {
            padding: 8px 12px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 0.92rem;
        }
    </style>
</head>
<body>
    <header class="topbar">
        <h1><i class="fas fa-user-shield"></i> Panel Administrador</h1>
        <div class="user-info">
            <span><i class="fas fa-user-circle"></i> <?php echo htmlspecialchars($nombreUser ?: $_SESSION['user_email'] ?? 'Admin'); ?></span>
            <a href="Login.html" class="logout" onclick="return confirm('¿Cerrar sesión?');"><i class="fas fa-sign-out-alt"></i> Salir</a>
        </div>
    </header>

    <main>
        <div class="tabs">
            <button class="tab-btn active" data-tab="profesores"><i class="fas fa-users"></i> Profesores</button>
            <button class="tab-btn" data-tab="bitacora"><i class="fas fa-history"></i> Bitácora</button>
            <button class="tab-btn" data-tab="inasistencias"><i class="fas fa-user-slash"></i> Inasistencias</button>
            <button class="tab-btn" data-tab="fichas"><i class="fas fa-notes-medical"></i> Fichas médicas</button>
            <button class="tab-btn" data-tab="horarios"><i class="fas fa-calendar-week"></i> Horarios</button>
        </div>

        <div id="tab-profesores" class="tab-content active">
            <div class="intro">
                <h2>Profesores</h2>
                <p>Lista de docentes registrados en el sistema.</p>
            </div>
            <div id="profesores-container"></div>
        </div>

        <div id="tab-bitacora" class="tab-content">
            <div class="intro">
                <h2>Bitácora de actividades</h2>
                <p>Registro consolidado de acciones de los profesores.</p>
            </div>
            <div style="margin-bottom: 14px;">
                <select id="bitacora-filtro-profesor" class="input-select"></select>
            </div>
            <div id="bitacora-container"></div>
        </div>

        <div id="tab-inasistencias" class="tab-content">
            <div class="intro">
                <h2>Inasistencias</h2>
                <p>Marcá días específicos en los que un docente no asistió.</p>
            </div>
            <div style="background: white; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px; margin-bottom: 18px;">
                <h4 style="margin: 0 0 10px 0;">Registrar nueva inasistencia</h4>
                <div style="display: grid; grid-template-columns: 1fr 1fr 2fr auto; gap: 10px; align-items: end;">
                    <div>
                        <label style="font-size: 0.8rem; color: #475569; font-weight: 600;">Profesor</label>
                        <select id="inasistencia-profesor" class="input-select" style="width: 100%;"></select>
                    </div>
                    <div>
                        <label style="font-size: 0.8rem; color: #475569; font-weight: 600;">Fecha</label>
                        <input type="date" id="inasistencia-fecha-input" class="input-date" style="width: 100%;">
                    </div>
                    <div>
                        <label style="font-size: 0.8rem; color: #475569; font-weight: 600;">Motivo</label>
                        <input type="text" id="inasistencia-motivo-input" class="input-text" placeholder="Enfermedad, trámite, etc." style="width: 100%;">
                    </div>
                    <button class="btn btn-primary" onclick="AdminPanel.registrarInasistencia()"><i class="fas fa-plus"></i> Registrar</button>
                </div>
            </div>
            <div id="inasistencias-container"></div>
        </div>

        <div id="tab-fichas" class="tab-content">
            <div class="intro">
                <h2>Fichas médicas</h2>
                <p>Visualización (solo lectura) de las fichas médicas de los docentes.</p>
            </div>
            <div id="fichas-admin-container"></div>
        </div>

        <div id="tab-horarios" class="tab-content">
            <div class="intro">
                <h2>Horarios de los profesores</h2>
                <p>Subí y administrá los horarios de cada docente.</p>
            </div>
            <div id="horarios-container"></div>
        </div>
    </main>

    <script src="js/admin_panel.js?v=20260527"></script>
</body>
</html>
