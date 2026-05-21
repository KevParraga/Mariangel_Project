-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 21-05-2026 a las 08:59:59
-- Versión del servidor: 10.4.32-MariaDB
-- Versión de PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `sistema de carga academica y bienestar`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `area_salud`
--

CREATE TABLE `area_salud` (
  `idarea_salud` int(11) NOT NULL,
  `consulta_medica` varchar(30) NOT NULL,
  `chequeo_medica` varchar(30) NOT NULL,
  `actualizacion_medica` varchar(30) NOT NULL,
  `ficha_medica` varchar(30) NOT NULL,
  `psicologia_idpsicologia` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `bienestar_diario`
--

CREATE TABLE `bienestar_diario` (
  `id` int(10) UNSIGNED NOT NULL,
  `usuario_id` int(10) UNSIGNED DEFAULT NULL,
  `email` varchar(255) NOT NULL,
  `fecha` date NOT NULL,
  `score_emo` tinyint(3) UNSIGNED NOT NULL,
  `score_fis` tinyint(3) UNSIGNED NOT NULL,
  `nivel_carga` tinyint(3) UNSIGNED NOT NULL,
  `tipo` varchar(50) NOT NULL,
  `observaciones` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `bienestar_diario`
--

INSERT INTO `bienestar_diario` (`id`, `usuario_id`, `email`, `fecha`, `score_emo`, `score_fis`, `nivel_carga`, `tipo`, `observaciones`, `created_at`) VALUES
(1, 2, 'mariangelmicha@gmail.com', '2026-05-18', 18, 15, 80, 'integral', '', '2026-05-18 15:36:51'),
(2, 2, 'mariangelmicha@gmail.com', '2026-05-20', 9, 9, 38, 'integral', '', '2026-05-21 01:31:13'),
(3, 2, 'mariangelmicha@gmail.com', '2026-05-21', 6, 9, 31, 'integral', '', '2026-05-21 03:11:59'),
(4, 7, 'art.kevin.pr@gmail.com', '2026-05-21', 16, 19, 73, 'integral', 'emo:¿Te cuesta desconectar tu mente al momento de ir a descansar?:3 | emo:¿Qué tanta paciencia has tenido contigo mismo y con los demás hoy?:2 | emo:¿Has experimentado cambios repentinos de humor en las últimas horas?:1 | emo:¿Qué tan conectado te sientes con tus emociones en este momento?:2 | emo:¿Has sentido una sensación de paz o tranquilidad constante durante el día?:2 | emo:¿Qué tan abrumado te has sentido con tus responsabilidades hoy?:2 | emo:¿Con qué frecuencia te has sentido ansioso o con incertidumbre hoy?:2 | emo:¿Te sientes conforme con lo que has logrado hacer en tu jornada?:2 | fis:¿Cómo calificarías tu nivel de energía física corporal en este momento?:3 | fis:¿Consideras que tu consumo de agua ha sido el adecuado hoy?:2 | fis:¿Sientes que tu vista ha estado demasiado expuesta a pantallas hoy?:3 | fis:¿Has sentido alguna tensión o rigidez muscular en el cuello o espalda?:3 | fis:¿Qué tan reparador fue tu descanso nocturno anterior?:2 | fis:¿Has sentido pesadez estomacal o molestias digestivas durante el día?:1 | fis:¿Qué tanta fatiga física sientes al realizar tus actividades cotidianas?:2 | fis:¿Has experimentado dolores de cabeza o pesadez en los ojos hoy?:3', '2026-05-21 04:52:46');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `bitacora_actividades`
--

CREATE TABLE `bitacora_actividades` (
  `id` int(10) UNSIGNED NOT NULL,
  `usuario_email` varchar(255) NOT NULL,
  `descripcion` text NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `bitacora_actividades`
--

INSERT INTO `bitacora_actividades` (`id`, `usuario_email`, `descripcion`, `created_at`) VALUES
(1, 'mariangelmicha@gmail.com', 'Inasistencia: 22/05/2026. Motivo: enfermedad. Se cancelaron 1 materia(s) de ese día.', '2026-05-21 06:34:00'),
(2, 'mariangelmicha@gmail.com', 'Planificación Curricular: Se añadió la materia \"Matemáticas\" para el 22/05/2026 de 08:00 AM a 08:30 AM.', '2026-05-21 06:34:00'),
(3, 'mariangelmicha@gmail.com', 'Planificación Curricular: Se canceló la materia \"Biología\" (22/05/2026). Motivo: no se.', '2026-05-21 06:27:00'),
(4, 'mariangelmicha@gmail.com', 'Mensajería: Mensaje enviado a Kevin Parraga (Psicóloga).', '2026-05-21 06:16:00'),
(5, 'mariangelmicha@gmail.com', 'Mensajería: Mensaje enviado a Kevin Parraga (Psicóloga).', '2026-05-21 06:13:00'),
(6, 'mariangelmicha@gmail.com', 'TEST', '2026-05-21 06:12:00'),
(7, 'mariangelmicha@gmail.com', 'Mensajería: Mensaje enviado a Kevin Parraga (Psicóloga).', '2026-05-21 06:11:00'),
(8, 'mariangelmicha@gmail.com', 'Mensajería: Mensaje enviado a Kevin Parraga (Psicóloga).', '2026-05-21 15:00:00'),
(9, 'mariangelmicha@gmail.com', 'Mensajería: Mensaje enviado a Kevin Parraga (Psicóloga).', '2026-05-21 15:00:00'),
(10, 'mariangelmicha@gmail.com', 'Mensajería: Mensaje enviado a Kevin Parraga (Psicóloga).', '2026-05-21 15:00:00'),
(11, 'mariangelmicha@gmail.com', 'Mensajería: Mensaje enviado a Kevin Parraga (Psicóloga).', '2026-05-21 15:00:00'),
(12, 'mariangelmicha@gmail.com', 'Mensajería: Mensaje enviado a Kevin Parraga (Psicóloga).', '2026-05-21 15:00:00'),
(13, 'mariangelmicha@gmail.com', 'Consultorio Médico: El docente realizó una consulta interactiva en el Consultorio Virtual sobre malestares físicos.', '2026-05-21 15:00:00'),
(14, 'mariangelmicha@gmail.com', 'Módulo Bienestar: El docente completó exitosamente su autodiagnóstico integral de salud.', '2026-05-21 15:00:00'),
(15, 'mariangelmicha@gmail.com', 'Planificación Curricular: Se añadió la materia \"Biología\" para el 22/05/2026 de 09:00 AM a 09:30 AM.', '2026-05-21 15:00:00'),
(16, 'mariangelmicha@gmail.com', 'Planificación Curricular: Se eliminó la materia \"Matemáticas\" del horario.', '2026-05-21 15:00:00'),
(17, 'mariangelmicha@gmail.com', 'Carga Administrativa: 1h registradas para el 22/05/2026 de 08:15 AM a 09:15 AM.', '2026-05-21 15:00:00'),
(18, 'mariangelmicha@gmail.com', 'Planificación Curricular: Se eliminó la materia \"Matemáticas\" del horario.', '2026-05-21 15:00:00'),
(19, 'mariangelmicha@gmail.com', 'Carga Administrativa: 1h registradas para el 22/05/2026 de 07:00 AM a 08:00 AM.', '2026-05-21 15:00:00'),
(20, 'mariangelmicha@gmail.com', 'Planificación Curricular: Se eliminó la materia \"Matemáticas\" del horario.', '2026-05-21 15:00:00'),
(21, 'mariangelmicha@gmail.com', 'Planificación Curricular: Se eliminó la materia \"Matemáticas\" del horario.', '2026-05-21 15:00:00'),
(22, 'mariangelmicha@gmail.com', 'Carga Administrativa: Se actualizaron las horas administrativas del mes a 8h.', '2026-05-21 15:00:00'),
(23, 'mariangelmicha@gmail.com', 'Planificación Curricular: Se eliminó la materia \"Matemáticas\" del horario.', '2026-05-21 15:00:00'),
(24, 'mariangelmicha@gmail.com', 'Planificación Curricular: Se eliminó la materia \"Química\" del horario.', '2026-05-21 15:00:00'),
(25, 'mariangelmicha@gmail.com', 'Horario: El docente cargó el documento oficial de su horario (Gemini_Generated_Image_yj7esvyj7esvyj7e.png).', '2026-05-21 15:00:00'),
(26, 'mariangelmicha@gmail.com', 'Bienestar diario guardado en bitácora: nivel de carga 31%, Emocional 6, Físico 9.', '2026-05-21 15:00:00'),
(27, 'mariangelmicha@gmail.com', 'Módulo Bienestar: El docente completó exitosamente su autodiagnóstico integral de salud.', '2026-05-21 15:00:00');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `bitacora_diaria`
--

CREATE TABLE `bitacora_diaria` (
  `id` int(10) UNSIGNED NOT NULL,
  `usuario_id` int(10) UNSIGNED DEFAULT NULL,
  `email` varchar(255) NOT NULL,
  `fecha` date NOT NULL,
  `tipo` enum('log','nota','meta') NOT NULL,
  `texto` text NOT NULL,
  `estado` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `encuesta`
--

CREATE TABLE `encuesta` (
  `id` int(10) UNSIGNED NOT NULL,
  `usuario_id` int(10) UNSIGNED DEFAULT NULL,
  `email` varchar(255) NOT NULL,
  `cedula` varchar(50) DEFAULT NULL,
  `fecha` date NOT NULL,
  `respuestas` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`respuestas`)),
  `tips_emocionales` text DEFAULT NULL,
  `tips_fisicos` text DEFAULT NULL,
  `score_emo` tinyint(3) UNSIGNED DEFAULT NULL,
  `score_fis` tinyint(3) UNSIGNED DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `encuesta`
--

INSERT INTO `encuesta` (`id`, `usuario_id`, `email`, `cedula`, `fecha`, `respuestas`, `tips_emocionales`, `tips_fisicos`, `score_emo`, `score_fis`, `created_at`) VALUES
(1, 3, 'mariangel.rodriguez@itjo.edu.ve', '27598744', '2026-05-18', '[{\"pregunta\":\"¿Test?\",\"tipo\":\"emo\",\"respuesta\":2}]', 'Consejo 1', 'Consejo 2', 2, 0, '2026-05-18 17:04:11'),
(5, 2, 'mariangelmicha@gmail.com', '12345678', '2026-05-21', '{\"emo\":[3,2,1],\"fis\":[3,3,3]}', 'Dedica breves pausas de desconexión entre bloques de clase.\nOrganiza tus tareas usando técnicas de priorización como la matriz Eisenhower.', 'Realiza estiramientos obligatorios de cuello y hombros cada 45 minutos.\nAjusta la altura de tu pantalla al nivel de tus ojos.\nConsidera alternar periodos de pie y sentado durante explicaciones largas.', 6, 9, '2026-05-21 03:11:59'),
(7, 7, 'art.kevin.pr@gmail.com', '27376167', '2026-05-21', '{\"emo\":[1,1,1],\"fis\":[1,1,1,1,1]}', 'Mantén tus hábitos de descanso actuales.\nComparte tus buenas prácticas de gestión de tiempo con otros colegas.', 'Continúa manteniendo una buena higiene de postura erguida.\nAsegúrate de beber al menos 2 litros de agua durante tu jornada.', 3, 5, '2026-05-21 04:53:40');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `encuesta_backup_20260518_190312`
--

CREATE TABLE `encuesta_backup_20260518_190312` (
  `enc_id` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `idencuesta` int(11) NOT NULL,
  `tipo_encuesta` varchar(30) NOT NULL,
  `preguntas_salud` varchar(30) NOT NULL,
  `preguntas_emocionales` varchar(30) NOT NULL,
  `balance_de_respuestas` varchar(30) NOT NULL,
  `consejo_post_encuesta` varchar(30) NOT NULL,
  `nueva_consulta` varchar(30) NOT NULL,
  `expediente_profesor_idexpediente_profesor` int(11) NOT NULL,
  `usuario_id` int(10) UNSIGNED DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `cedula` varchar(50) DEFAULT NULL,
  `fecha` date DEFAULT NULL,
  `respuestas` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`respuestas`)),
  `tips_emocionales` text DEFAULT NULL,
  `tips_fisicos` text DEFAULT NULL,
  `score_emo` tinyint(3) UNSIGNED DEFAULT NULL,
  `score_fis` tinyint(3) UNSIGNED DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `encuesta_backup_20260518_190312`
--

INSERT INTO `encuesta_backup_20260518_190312` (`enc_id`, `idencuesta`, `tipo_encuesta`, `preguntas_salud`, `preguntas_emocionales`, `balance_de_respuestas`, `consejo_post_encuesta`, `nueva_consulta`, `expediente_profesor_idexpediente_profesor`, `usuario_id`, `email`, `cedula`, `fecha`, `respuestas`, `tips_emocionales`, `tips_fisicos`, `score_emo`, `score_fis`) VALUES
(1, 0, '', '', '', '', '', '', 0, 3, 'mariangel.rodriguez@itjo.edu.ve', '27598744', '2026-05-18', '[{\"pregunta\":\"¿Test?\",\"tipo\":\"emo\",\"respuesta\":2}]', 'Consejo 1', 'Consejo 2', 2, 0);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `encuesta_backup_20260518_190411`
--

CREATE TABLE `encuesta_backup_20260518_190411` (
  `enc_id` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `idencuesta` int(11) NOT NULL,
  `tipo_encuesta` varchar(30) NOT NULL,
  `preguntas_salud` varchar(30) NOT NULL,
  `preguntas_emocionales` varchar(30) NOT NULL,
  `balance_de_respuestas` varchar(30) NOT NULL,
  `consejo_post_encuesta` varchar(30) NOT NULL,
  `nueva_consulta` varchar(30) NOT NULL,
  `expediente_profesor_idexpediente_profesor` int(11) NOT NULL,
  `usuario_id` int(10) UNSIGNED DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `cedula` varchar(50) DEFAULT NULL,
  `fecha` date DEFAULT NULL,
  `respuestas` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`respuestas`)),
  `tips_emocionales` text DEFAULT NULL,
  `tips_fisicos` text DEFAULT NULL,
  `score_emo` tinyint(3) UNSIGNED DEFAULT NULL,
  `score_fis` tinyint(3) UNSIGNED DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `encuesta_backup_20260518_190411`
--

INSERT INTO `encuesta_backup_20260518_190411` (`enc_id`, `idencuesta`, `tipo_encuesta`, `preguntas_salud`, `preguntas_emocionales`, `balance_de_respuestas`, `consejo_post_encuesta`, `nueva_consulta`, `expediente_profesor_idexpediente_profesor`, `usuario_id`, `email`, `cedula`, `fecha`, `respuestas`, `tips_emocionales`, `tips_fisicos`, `score_emo`, `score_fis`) VALUES
(1, 0, '', '', '', '', '', '', 0, 3, 'mariangel.rodriguez@itjo.edu.ve', '27598744', '2026-05-18', '[{\"pregunta\":\"¿Test?\",\"tipo\":\"emo\",\"respuesta\":2}]', 'Consejo 1', 'Consejo 2', 2, 0);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `encuesta_new_20260518_190312`
--

CREATE TABLE `encuesta_new_20260518_190312` (
  `id` int(10) UNSIGNED NOT NULL,
  `usuario_id` int(10) UNSIGNED DEFAULT NULL,
  `email` varchar(255) NOT NULL,
  `cedula` varchar(50) DEFAULT NULL,
  `fecha` date NOT NULL,
  `respuestas` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`respuestas`)),
  `tips_emocionales` text DEFAULT NULL,
  `tips_fisicos` text DEFAULT NULL,
  `score_emo` tinyint(3) UNSIGNED DEFAULT NULL,
  `score_fis` tinyint(3) UNSIGNED DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `encuesta_new_20260518_190312`
--

INSERT INTO `encuesta_new_20260518_190312` (`id`, `usuario_id`, `email`, `cedula`, `fecha`, `respuestas`, `tips_emocionales`, `tips_fisicos`, `score_emo`, `score_fis`, `created_at`) VALUES
(1, 3, 'mariangel.rodriguez@itjo.edu.ve', '27598744', '2026-05-18', '[{\"pregunta\":\"¿Test?\",\"tipo\":\"emo\",\"respuesta\":2}]', 'Consejo 1', 'Consejo 2', 2, 0, '2026-05-18 17:03:12');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `encuesta_old_20260518_190411`
--

CREATE TABLE `encuesta_old_20260518_190411` (
  `enc_id` int(10) UNSIGNED NOT NULL,
  `idencuesta` int(11) NOT NULL,
  `tipo_encuesta` varchar(30) NOT NULL,
  `preguntas_salud` varchar(30) NOT NULL,
  `preguntas_emocionales` varchar(30) NOT NULL,
  `balance_de_respuestas` varchar(30) NOT NULL,
  `consejo_post_encuesta` varchar(30) NOT NULL,
  `nueva_consulta` varchar(30) NOT NULL,
  `expediente_profesor_idexpediente_profesor` int(11) NOT NULL,
  `usuario_id` int(10) UNSIGNED DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `cedula` varchar(50) DEFAULT NULL,
  `fecha` date DEFAULT NULL,
  `respuestas` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`respuestas`)),
  `tips_emocionales` text DEFAULT NULL,
  `tips_fisicos` text DEFAULT NULL,
  `score_emo` tinyint(3) UNSIGNED DEFAULT NULL,
  `score_fis` tinyint(3) UNSIGNED DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `encuesta_old_20260518_190411`
--

INSERT INTO `encuesta_old_20260518_190411` (`enc_id`, `idencuesta`, `tipo_encuesta`, `preguntas_salud`, `preguntas_emocionales`, `balance_de_respuestas`, `consejo_post_encuesta`, `nueva_consulta`, `expediente_profesor_idexpediente_profesor`, `usuario_id`, `email`, `cedula`, `fecha`, `respuestas`, `tips_emocionales`, `tips_fisicos`, `score_emo`, `score_fis`) VALUES
(1, 0, '', '', '', '', '', '', 0, 3, 'mariangel.rodriguez@itjo.edu.ve', '27598744', '2026-05-18', '[{\"pregunta\":\"¿Test?\",\"tipo\":\"emo\",\"respuesta\":2}]', 'Consejo 1', 'Consejo 2', 2, 0);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `expediente_profesor_has_trabajo_academico`
--

CREATE TABLE `expediente_profesor_has_trabajo_academico` (
  `expediente_profesor_idexpediente_profesor` int(11) NOT NULL,
  `trabajo_academico_idtrabajo_academico` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `ficha_emocional`
--

CREATE TABLE `ficha_emocional` (
  `id` int(10) UNSIGNED NOT NULL,
  `profesor_email` varchar(255) NOT NULL,
  `estado_emocional` varchar(100) DEFAULT NULL,
  `antecedentes` text DEFAULT NULL,
  `tipo_terapia` varchar(150) DEFAULT NULL,
  `medicacion_psiquiatrica` text DEFAULT NULL,
  `factores_estres` text DEFAULT NULL,
  `red_apoyo` text DEFAULT NULL,
  `observaciones` text DEFAULT NULL,
  `ultima_sesion` date DEFAULT NULL,
  `proxima_sesion` date DEFAULT NULL,
  `updated_by_email` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `ficha_emocional`
--

INSERT INTO `ficha_emocional` (`id`, `profesor_email`, `estado_emocional`, `antecedentes`, `tipo_terapia`, `medicacion_psiquiatrica`, `factores_estres`, `red_apoyo`, `observaciones`, `ultima_sesion`, `proxima_sesion`, `updated_by_email`, `created_at`, `updated_at`) VALUES
(1, 'mariangelmicha@gmail.com', 'loka', 'bulde loka', 'weboterapia', 'sertralina 50mg', 'los novios', 'su mai y la lupi', '', '2026-05-21', '2026-05-22', 'art.kevin.pr@gmail.com', '2026-05-21 05:52:58', '2026-05-21 05:52:58');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `ficha_medica`
--

CREATE TABLE `ficha_medica` (
  `id` int(10) UNSIGNED NOT NULL,
  `profesor_email` varchar(255) NOT NULL,
  `tipo_sangre` varchar(5) DEFAULT NULL,
  `alergias` text DEFAULT NULL,
  `enfermedades_cronicas` text DEFAULT NULL,
  `medicacion_actual` text DEFAULT NULL,
  `peso` decimal(5,2) DEFAULT NULL,
  `altura` decimal(4,2) DEFAULT NULL,
  `presion_arterial` varchar(20) DEFAULT NULL,
  `frecuencia_cardiaca` int(11) DEFAULT NULL,
  `contacto_nombre` varchar(150) DEFAULT NULL,
  `contacto_telefono` varchar(50) DEFAULT NULL,
  `contacto_relacion` varchar(50) DEFAULT NULL,
  `observaciones` text DEFAULT NULL,
  `ultima_consulta` date DEFAULT NULL,
  `updated_by_email` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `ficha_medica`
--

INSERT INTO `ficha_medica` (`id`, `profesor_email`, `tipo_sangre`, `alergias`, `enfermedades_cronicas`, `medicacion_actual`, `peso`, `altura`, `presion_arterial`, `frecuencia_cardiaca`, `contacto_nombre`, `contacto_telefono`, `contacto_relacion`, `observaciones`, `ultima_consulta`, `updated_by_email`, `created_at`, `updated_at`) VALUES
(1, 'mariangelmicha@gmail.com', 'O+', 'Penicilina', 'Diabetes', 'Loratadina', 75.00, 1.70, '120/80', 31, 'maria', '04241354444', 'esposa', '', '2026-05-21', 'art.kevin.pr@gmail.com', '2026-05-21 05:42:19', '2026-05-21 05:42:19');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `ficha_sesiones`
--

CREATE TABLE `ficha_sesiones` (
  `id` int(10) UNSIGNED NOT NULL,
  `profesor_email` varchar(255) NOT NULL,
  `fecha` date NOT NULL,
  `motivo` varchar(255) DEFAULT NULL,
  `notas` text DEFAULT NULL,
  `created_by_email` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `ficha_visitas`
--

CREATE TABLE `ficha_visitas` (
  `id` int(10) UNSIGNED NOT NULL,
  `profesor_email` varchar(255) NOT NULL,
  `fecha` date NOT NULL,
  `motivo` varchar(255) DEFAULT NULL,
  `notas` text DEFAULT NULL,
  `created_by_email` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `ficha_visitas`
--

INSERT INTO `ficha_visitas` (`id`, `profesor_email`, `fecha`, `motivo`, `notas`, `created_by_email`, `created_at`) VALUES
(1, 'mariangelmicha@gmail.com', '2026-05-21', 'idk', 'kkck', 'art.kevin.pr@gmail.com', '2026-05-21 05:38:33');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `inasistencias`
--

CREATE TABLE `inasistencias` (
  `id` int(10) UNSIGNED NOT NULL,
  `profesor_email` varchar(255) NOT NULL,
  `fecha` date NOT NULL,
  `motivo` text DEFAULT NULL,
  `registrada_por_email` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `login`
--

CREATE TABLE `login` (
  `idlogin` int(11) NOT NULL,
  `correo_institucional` varchar(30) NOT NULL,
  `contraseña` varchar(30) NOT NULL,
  `solicitar_registro` varchar(30) NOT NULL,
  `recuperar` varchar(30) NOT NULL,
  `expediente_profesor_idexpediente_profesor` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `materias`
--

CREATE TABLE `materias` (
  `id` int(10) UNSIGNED NOT NULL,
  `usuario_id` int(10) UNSIGNED DEFAULT NULL,
  `email` varchar(255) NOT NULL,
  `cedula` varchar(50) DEFAULT NULL,
  `nombre` varchar(255) NOT NULL,
  `seccion` varchar(100) DEFAULT NULL,
  `tipo` varchar(100) DEFAULT NULL,
  `dia` varchar(50) DEFAULT NULL,
  `hora_inicio` varchar(30) DEFAULT NULL,
  `hora_fin` varchar(30) DEFAULT NULL,
  `duracion` decimal(4,1) DEFAULT 0.0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `mensajes`
--

CREATE TABLE `mensajes` (
  `id` int(10) UNSIGNED NOT NULL,
  `remitente_email` varchar(255) NOT NULL,
  `destinatario_email` varchar(255) NOT NULL,
  `contenido` text NOT NULL,
  `fecha` timestamp NOT NULL DEFAULT current_timestamp(),
  `leido` tinyint(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `mensajes`
--

INSERT INTO `mensajes` (`id`, `remitente_email`, `destinatario_email`, `contenido`, `fecha`, `leido`) VALUES
(1, 'mariangelmicha@gmail.com', 'art.kevin.pr@gmail.com', 'ola', '2026-05-21 05:20:53', 1),
(3, 'mariangelmicha@gmail.com', 'art.kevin.pr@gmail.com', 'chola', '2026-05-21 05:22:09', 1),
(5, 'mariangelmicha@gmail.com', 'art.kevin.pr@gmail.com', 'toy erio', '2026-05-21 06:02:41', 0),
(6, 'mariangelmicha@gmail.com', 'art.kevin.pr@gmail.com', 'ollabola', '2026-05-21 06:03:59', 0),
(7, 'mariangelmicha@gmail.com', 'art.kevin.pr@gmail.com', 'teta', '2026-05-21 06:05:14', 0),
(8, 'mariangelmicha@gmail.com', 'art.kevin.pr@gmail.com', 'sas', '2026-05-21 06:07:41', 0),
(9, 'mariangelmicha@gmail.com', 'art.kevin.pr@gmail.com', 'aaa', '2026-05-21 06:08:21', 0),
(10, 'mariangelmicha@gmail.com', 'art.kevin.pr@gmail.com', 'aaaaaaaaaaaa', '2026-05-21 06:11:30', 0),
(11, 'mariangelmicha@gmail.com', 'art.kevin.pr@gmail.com', 'aaaae', '2026-05-21 06:13:27', 0),
(12, 'mariangelmicha@gmail.com', 'art.kevin.pr@gmail.com', 'este si', '2026-05-21 06:16:05', 0);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `nivel_carga_academica`
--

CREATE TABLE `nivel_carga_academica` (
  `idnivel_carga_academica` int(11) NOT NULL,
  `materias_x_profesor` varchar(30) NOT NULL,
  `semestres_x_profesor` varchar(30) NOT NULL,
  `bienestar_profesor` varchar(30) NOT NULL,
  `profesores_disponibles` varchar(30) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `perfil_profesor`
--

CREATE TABLE `perfil_profesor` (
  `idperfil_profesor` int(11) NOT NULL,
  `nombres` varchar(30) NOT NULL,
  `apellidos` varchar(30) NOT NULL,
  `correo` varchar(30) NOT NULL,
  `especialidad` varchar(30) NOT NULL,
  `biografia_profesional` varchar(30) NOT NULL,
  `area_salud_idarea_salud` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `psicologia`
--

CREATE TABLE `psicologia` (
  `idpsicologia` int(11) NOT NULL,
  `test` varchar(30) NOT NULL,
  `evaluacion_psicologica` varchar(30) NOT NULL,
  `consejos_psicologicos` varchar(30) NOT NULL,
  `carga_academica` varchar(30) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `trabajo_academico`
--

CREATE TABLE `trabajo_academico` (
  `idtrabajo_academico` int(11) NOT NULL,
  `materia_asignadas` varchar(30) NOT NULL,
  `control_calificaciones` varchar(30) NOT NULL,
  `corte_notas_semestre` varchar(30) NOT NULL,
  `bitacora` varchar(30) NOT NULL,
  `resumen_academico` varchar(30) NOT NULL,
  `nivel_carga_academica_idnivel_carga_academica` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `usuarios`
--

CREATE TABLE `usuarios` (
  `id` int(10) UNSIGNED NOT NULL,
  `first_name` varchar(100) NOT NULL,
  `last_name` varchar(100) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `cedula` varchar(50) DEFAULT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `profile_pic` text DEFAULT NULL,
  `especialidad` varchar(100) DEFAULT NULL,
  `bio` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `cv_url` text DEFAULT NULL,
  `role` varchar(20) NOT NULL DEFAULT 'user',
  `horario_url` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `usuarios`
--

INSERT INTO `usuarios` (`id`, `first_name`, `last_name`, `email`, `password`, `cedula`, `phone`, `profile_pic`, `especialidad`, `bio`, `created_at`, `cv_url`, `role`, `horario_url`) VALUES
(1, 'Brayan', 'Contreras', 'bcabril21@gmail.com', '$2y$10$5msDGTBrwoomYVtU8ZYEKemis9seXG7Yo5ygdfYbozXsfwPdfgtTW', '30429541', '04241560238', '', '', '', '2026-05-17 22:14:19', NULL, 'user', NULL),
(2, 'Mariangel', 'Rodriguez', 'mariangelmicha@gmail.com', '$2y$10$LUHp8.k2i2dPtF3h92iXCur0nHnrd6SJGKXvzaadhbBrCXlJ2WtBi', '12345678', '04141234567', 'uploads/1779057796-IMG_20241116_122210_973.jpg', 'informatica', 'Usuario creado manualmente para el registro de prueba.', '2026-05-17 22:25:25', 'uploads/1779059117-educacion_mariangel.pdf', 'user', 'uploads/horario-1779334748-Gemini_Generated_Image_yj7esvyj7esvyj7e.png'),
(3, 'Mariangel', 'Rodriguez', 'mariangel.rodriguez@itjo.edu.ve', '$2y$10$77oZUVMW.TN02Klam7hym.2.AWIJyYxJD0V0JyVg9kBts0VjcHRNS', NULL, NULL, NULL, NULL, NULL, '2026-05-18 15:55:03', NULL, 'admin', NULL),
(4, 'Nelvin', 'Murillo', 'nelvinalvarez@gmail.com', '$2y$10$SruvurAobDubx1Q3J1ZFc.WdqqWZOkZCP.jrTTDy93n8QdqR0ZVTm', '29651867', '04247895778', 'uploads/1779125659-iujo.jpg', 'Biologo', '', '2026-05-18 17:34:00', 'uploads/1779125704-NELVIN_MURILLO.pdf', 'user', NULL),
(5, 'cesar', 'garrido', 'cesargarri19@gmail.com', '$2y$10$bP9jn3dgwpEbPN7mE5DmiODGvzVRbHiBN2Ykw0QOXvT3KCVTgLrBq', '29921805', '04241290287', '', '', '', '2026-05-18 19:19:54', NULL, 'user', NULL),
(7, 'Kevin', 'Parraga', 'art.kevin.pr@gmail.com', '$2y$10$rtRqkz3umPEE7gMzEYIaqufenfz1WkcFDKjQLFlh6JMfewo5kOFsK', '27376167', '04241650133', '', '', '', '2026-05-21 04:49:57', NULL, 'psicologa', NULL);

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `area_salud`
--
ALTER TABLE `area_salud`
  ADD PRIMARY KEY (`idarea_salud`);

--
-- Indices de la tabla `bienestar_diario`
--
ALTER TABLE `bienestar_diario`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_email_fecha` (`email`,`fecha`);

--
-- Indices de la tabla `bitacora_actividades`
--
ALTER TABLE `bitacora_actividades`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_email_fecha` (`usuario_email`,`created_at`);

--
-- Indices de la tabla `bitacora_diaria`
--
ALTER TABLE `bitacora_diaria`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `encuesta`
--
ALTER TABLE `encuesta`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `encuesta_new_20260518_190312`
--
ALTER TABLE `encuesta_new_20260518_190312`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `encuesta_old_20260518_190411`
--
ALTER TABLE `encuesta_old_20260518_190411`
  ADD PRIMARY KEY (`idencuesta`,`expediente_profesor_idexpediente_profesor`),
  ADD UNIQUE KEY `enc_id` (`enc_id`),
  ADD UNIQUE KEY `unique_email_fecha` (`email`,`fecha`);

--
-- Indices de la tabla `expediente_profesor_has_trabajo_academico`
--
ALTER TABLE `expediente_profesor_has_trabajo_academico`
  ADD PRIMARY KEY (`expediente_profesor_idexpediente_profesor`,`trabajo_academico_idtrabajo_academico`);

--
-- Indices de la tabla `ficha_emocional`
--
ALTER TABLE `ficha_emocional`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `profesor_email` (`profesor_email`);

--
-- Indices de la tabla `ficha_medica`
--
ALTER TABLE `ficha_medica`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `profesor_email` (`profesor_email`);

--
-- Indices de la tabla `ficha_sesiones`
--
ALTER TABLE `ficha_sesiones`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_profesor_sesion` (`profesor_email`,`fecha`);

--
-- Indices de la tabla `ficha_visitas`
--
ALTER TABLE `ficha_visitas`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_profesor` (`profesor_email`,`fecha`);

--
-- Indices de la tabla `inasistencias`
--
ALTER TABLE `inasistencias`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_inasistencia` (`profesor_email`,`fecha`),
  ADD KEY `idx_profesor` (`profesor_email`);

--
-- Indices de la tabla `login`
--
ALTER TABLE `login`
  ADD PRIMARY KEY (`idlogin`);

--
-- Indices de la tabla `materias`
--
ALTER TABLE `materias`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_materia_usuario` (`email`,`nombre`,`seccion`,`tipo`,`dia`,`hora_inicio`,`hora_fin`) USING HASH;

--
-- Indices de la tabla `mensajes`
--
ALTER TABLE `mensajes`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_remitente` (`remitente_email`),
  ADD KEY `idx_destinatario` (`destinatario_email`),
  ADD KEY `idx_conv` (`remitente_email`,`destinatario_email`,`fecha`);

--
-- Indices de la tabla `nivel_carga_academica`
--
ALTER TABLE `nivel_carga_academica`
  ADD PRIMARY KEY (`idnivel_carga_academica`);

--
-- Indices de la tabla `perfil_profesor`
--
ALTER TABLE `perfil_profesor`
  ADD PRIMARY KEY (`idperfil_profesor`);

--
-- Indices de la tabla `psicologia`
--
ALTER TABLE `psicologia`
  ADD PRIMARY KEY (`idpsicologia`);

--
-- Indices de la tabla `trabajo_academico`
--
ALTER TABLE `trabajo_academico`
  ADD PRIMARY KEY (`idtrabajo_academico`,`nivel_carga_academica_idnivel_carga_academica`);

--
-- Indices de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `bienestar_diario`
--
ALTER TABLE `bienestar_diario`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT de la tabla `bitacora_actividades`
--
ALTER TABLE `bitacora_actividades`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=28;

--
-- AUTO_INCREMENT de la tabla `bitacora_diaria`
--
ALTER TABLE `bitacora_diaria`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT de la tabla `encuesta`
--
ALTER TABLE `encuesta`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT de la tabla `encuesta_new_20260518_190312`
--
ALTER TABLE `encuesta_new_20260518_190312`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de la tabla `encuesta_old_20260518_190411`
--
ALTER TABLE `encuesta_old_20260518_190411`
  MODIFY `enc_id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de la tabla `ficha_emocional`
--
ALTER TABLE `ficha_emocional`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de la tabla `ficha_medica`
--
ALTER TABLE `ficha_medica`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de la tabla `ficha_sesiones`
--
ALTER TABLE `ficha_sesiones`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `ficha_visitas`
--
ALTER TABLE `ficha_visitas`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de la tabla `inasistencias`
--
ALTER TABLE `inasistencias`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `materias`
--
ALTER TABLE `materias`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT de la tabla `mensajes`
--
ALTER TABLE `mensajes`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
