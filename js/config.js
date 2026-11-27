/**
 * KIOSCO_MEDIA_CONFIG - Configuración Maestra Universal de Presentación de Medios
 * Óptica ECO - Optimizado para Raspberry Pi 4
 *
 * Para ajustar tamaños, proporciones, marcos o posiciones en cualquier vista,
 * basta con modificar este bloque único sin alterar fórmulas ni estilos.
 */
const KIOSCO_MEDIA_CONFIG = {
    // Proporción global única para todos los medios (Asp_X : Asp_Y)
    Asp_X: 5,
    Asp_Y: 4,
    ASPECT: { X: 5, Y: 4 },

    // Grosor del marco dorado interior como % del ancho de cada foto (W_foto)
    marco_pct: 5,
    MARCO_PCT: 5,

    // Redondeo en proporción áurea: R_ext = L_min * (1 / phi^phi_exp)
    phi: 1.61803398875,
    phi_exp: 4,
    PHI: 1.61803398875,
    PHI_EXP: 4,

    // Separación entre fotos (% de W_pantalla) y margen lateral de flechas (% de W_pantalla)
    gap_pct: 2,
    flecha_margen_pct: 5,
    GAP_PCT: 2,
    FLECHA_MARGEN_PCT: 5,

    // Configuración de captura dual WYSIWYG (HD + Proxy ligero) y espejo
    mirror_preview: true,
    mirror_capture: false,
    proxy_max_width: 480,
    proxy_quality: 0.78,
    hd_quality: 0.92,
    CAPTURA: {
        MIRROR_PREVIEW: true,
        MIRROR_CAPTURE: false,
        PROXY_MAX_WIDTH: 480,
        PROXY_QUALITY: 0.78,
        HD_QUALITY: 0.92
    },

    // Configuración matemática de Zoom y Paneo en vista maximizada
    zoom_config: {
        minScale: 1.0,
        maxScale: 4.0,
        doubleTapScale: 2.2,
        wheelStep: 0.25,
        panThresholdPx: 8
    },
    ZOOM: {
        MIN_SCALE: 1.0,
        MAX_SCALE: 4.0,
        DOUBLE_TAP_SCALE: 2.2,
        WHEEL_STEP: 0.25,
        PAN_THRESHOLD_PX: 8
    },

    // Tríadas por rol: (ancho%, top%, alineacion)
    // - ancho: % de W_pantalla
    // - top: % de H_pantalla donde inicia el borde superior
    // - align / alineacion: 'izquierda' | 'centrada' | 'derecha'
    ROLES: {
        camara:     { ancho: 75, top: 15, alineacion: 'centrada', align: 'centrada' },
        carrete:    { ancho: 30, top: 80, alineacion: 'izquierda', align: 'izquierda' },
        rejilla:    { ancho: 21, top: 20, alineacion: 'centrada', align: 'centrada' },
        maximizada: { ancho: 98, top: 30, alineacion: 'centrada', align: 'centrada' }
    }
};

window.KIOSCO_MEDIA_CONFIG = KIOSCO_MEDIA_CONFIG;
