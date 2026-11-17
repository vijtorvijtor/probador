<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-select=none">
    <title>Probador Virtual - Óptica ECO</title>
    <!-- Incluyendo el timestamp para evitar caché -->
    <link rel="stylesheet" href="css/estilos_v2.css?v=<?php echo time(); ?>">
    <style>
        /* Estilo forzado directamente aquí para asegurar que cargue */
        body, html { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; }

        /* Contenedor que SÍ o SÍ debe mostrar la imagen */
        .full-bg {
            position: absolute; top: 0; left: 0; width: 100%; height: 100%;
            background-image: url('img/FondoCalidoCafe.jpg'); /* Ajusta la ruta si es necesario */
            background-size: cover;
            background-position: center;
            z-index: -1;
        }

        /* Estilo Debug mejorado */
        #debug-log {
            position: fixed; top: 10px; left: 10px; z-index: 9999;
            background: rgba(0,0,0,0.6); color: #fff;
            padding: 10px; font-size: 14px; font-weight: bold;
            pointer-events: none;
        }
        /* Botones sin iconos, solo texto */
        .btn-eco {
            background: linear-gradient(135deg, #fceabb 0%, #b8860b 50%, #5d3a1a 100%);
            border: 2px solid #5d3a1a; color: #fff; font-weight: 800;
            text-shadow: 0 1px 1px rgba(0,0,0,0.5);
            padding: 20px; border-radius: 10px; cursor: pointer;
        }
        .controls-bar { display: flex; justify-content: space-between; padding: 20px; }
        .action-group { display: flex; justify-content: space-between; padding: 0 20px 20px 20px; }

        /* Botones Etapa 2 - Prioridad absoluta mediante ID */
        .btn-eco, .btn-whatsapp, .btn-delete-all {
            background-image: url('img/hojaOro.jpg') !important;
            background-size: cover !important;
            background-position: center !important;
            background-color: #DAA520 !important;
            border-radius: 40px !important;
            border: 3px solid #b8860b !important;
            color: #000 !important;
            font-weight: 900 !important;
            font-family: sans-serif !important;
            text-transform: uppercase !important;
            text-shadow: 0 1px 0 rgba(255,255,255,0.6) !important;
            box-shadow: inset 0 4px 6px rgba(255,255,255,0.7), 0 6px 0 #5d3a1a !important;
            display: flex !important;
            justify-content: center !important;
            align-items: center !important;
            cursor: pointer !important;
        }

        .btn-eco { width: 31% !important; height: 120px !important; font-size: 1.6rem !important; }
        .btn-whatsapp, .btn-delete-all { width: 48% !important; height: 90px !important; font-size: 1.4rem !important; }
        #clean-all { color: #D32F2F !important; }
    </style>
</head>
<body oncontextmenu="return false;">
<!-- Debajo de la etiqueta <body> -->
<div id="debug-log" style="position:fixed; top:10px; left:10px; z-index:999999; color:#FFF; font-size:14px; font-weight:bold; text-shadow:1px 1px 2px #000; pointer-events:auto; user-select:text; -webkit-user-select:text;">
    VALIDANDO: Textura...
</div>

<script>
    window.addEventListener('load', () => {
        const btn = document.querySelector('.btn-eco');
        const style = window.getComputedStyle(btn);
        const log = document.getElementById('debug-log');
        log.innerHTML = "DEBUG: Ruta efectiva: " + style.backgroundImage;
    });
    </script>

    <!-- Fondo dinámico -->
    <div class="full-bg"></div>

    <!-- Screensaver -->
    <div id="screensaver" class="screensaver-active" style="position:fixed; top:0; left:0; width:100%; height:100%; z-index:9999; background:black; pointer-events:auto;">
        <video id="video-screensaver" src="screensaver.mp4" autoplay loop muted playsinline></video>
        <div class="overlay-text">TOCA LA PANTALLA PARA EMPEZAR</div>
    </div>

    <div class="kiosco-container">
        <header class="kiosco-header">
            <h1 class="brand-title">ÓPTICA <span>ECO</span></h1>
        </header>

        <main class="camera-viewport">
            <!-- Atributos cruciales para Raspberry Pi -->
            <video id="webcam" autoplay playsinline muted></video>

            <canvas id="canvas-capture" style="display:none;"></canvas>
            <div id="countdown-overlay" class="hidden"><span id="countdown-number">3</span></div>
        </main>

        <nav class="controls-bar">
            <button id="btn-capture" class="btn-eco">FOTO</button>
            <button id="btn-loop" class="btn-eco">VIDEO</button>
            <button id="btn-compare" class="btn-eco">COMPARAR</button>
        </nav>

        <section class="gallery-section">
            <div class="action-group">
                <button id="btn-generate-qr" class="btn-whatsapp">WHATSAPP QR</button>
                <button id="clean-all" class="btn-delete-all">ELIMINAR</button>
            </div>
            <div id="thumbnails-container" class="thumbnails-scroll"></div>
        </section>
    </div>

    <!-- MODALES (Omitidos para brevedad) -->

    <script src="js/camara.js?v=<?php echo time(); ?>"></script>
</body>
</html>

