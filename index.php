<?php
// Generar timestamp único para invalidar caché
$v = time();
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-select=none">
    <title>Probador Virtual - Óptica ECO</title>
    <link rel="stylesheet" href="css/estilos.css?v=<?php echo $v; ?>">
</head>
<body>

<div class="kiosco-container">
    <!-- Encabezado del Quiosco -->
    <header class="kiosco-header">
        <h1 class="brand-title">ÓPTICA <span>ECO</span></h1>
        <p class="brand-subtitle">Espejo Virtual & Comparador de Armazones</p>
    </header>

    <!-- Visor de la Cámara -->
    <main class="camera-viewport">
        <video id="webcam" autoplay playsinline muted></video>
        <canvas id="canvas-capture" class="hidden"></canvas>
        
        <!-- Cuenta Regresiva -->
        <div id="countdown-overlay" class="hidden">
            <span id="countdown-number">3</span>
        </div>
    </main>

    <!-- Barra de Objetos 3D Limpios y Animados -->
    <nav class="controls-bar">
        <!-- Objeto 1: Foto -->
        <div id="btn-capture" class="floating-3d-object pulse-anim-1" role="button" tabindex="0" title="Fotografiar">
            <div class="glow-ring green-glow"></div>
            <div class="icon-3d-wrapper green-icon">
                <span class="icon-symbol">📷</span>
            </div>
        </div>

        <!-- Objeto 2: Bucle Video -->
        <div id="btn-loop" class="floating-3d-object pulse-anim-2" role="button" tabindex="0" title="Bucle 3 Segundos">
            <div class="glow-ring purple-glow"></div>
            <div class="icon-3d-wrapper purple-icon">
                <span class="icon-symbol">📹</span>
                <span class="loop-tag">3s</span>
            </div>
        </div>

        <!-- Objeto 3: Comparativa VS -->
        <div id="btn-compare" class="floating-3d-object pulse-anim-3" role="button" tabindex="0" title="Comparativa VS">
            <div class="glow-ring gold-glow"></div>
            <div class="icon-3d-wrapper gold-icon">
                <span class="vs-text">VS</span>
            </div>
        </div>
    </nav>

    <!-- Galería de Miniaturas Inferior -->
    <section class="gallery-section">
        <div class="gallery-header">
            <span>Fotografías Tomadas</span>
            <button id="clean-all" class="btn-clean-text">LIMPIAR TODO 🗑</button>
        </div>
        <div id="thumbnails-container" class="thumbnails-scroll">
            <!-- Se generan dinámicamente -->
        </div>
    </section>
</div>

<!-- MODAL COMPARADOR -->
<div id="modal-compare" class="modal-overlay hidden">
    <div class="modal-content-styled">
        <div class="modal-header-styled">
            <h2 class="modal-title-styled">⚡ COMPARATIVA DE ARMAZONES</h2>
            <button id="btn-close-modal" class="btn-close-modal">CERRAR ✖</button>
        </div>

        <div class="comparison-wrapper">
            <div id="grid-comparison" class="grid-container-base">
                <!-- Se generan dinámicamente -->
            </div>

            <div id="overlay-focus" class="overlay-focus-container hidden">
                <div id="focus-card-body" class="focus-card-90"></div>
            </div>
        </div>
    </div>
</div>

<script src="js/camara.js?v=<?php echo $v; ?>"></script>
</body>
</html>
