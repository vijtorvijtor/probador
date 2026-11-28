/**
 * @file js/config.js
 * @description Fuente única de verdad (Single Source of Truth) para la geometría,
 *              estética de marcos dorados, captura dual (HD/Proxy) y gestos de zoom
 *              del Kiosco Probador Virtual Óptica ECO.
 *
 * INSTRUCCIONES DE AJUSTE:
 * Modifica únicamente los valores numéricos o de alineación en este objeto.
 * No es necesario tocar CSS ni lógica JavaScript en ningún otro archivo.
 */
const KIOSCO_MEDIA_CONFIG = {
    // 1. Proporción de aspecto global (Asp_X : Asp_Y) aplicada a cámara, fotos y videos
    Asp_X: 5,
    Asp_Y: 4,

    // 2. Grosor del marco dorado interior como porcentaje (%) del ancho de cada foto (W_foto)
    marco_pct: 5,

    // 3. Curvatura áurea concéntrica de esquinas: R_ext = min(W_foto, H_foto) * (1 / phi^phi_exp)
    phi: 1.61803398875,
    phi_exp: 4,

    // 4. Separación entre elementos (% de W_pantalla) y ancho reservado a flechas del carrete (% de W_pantalla)
    gap_pct: 2,
    flecha_margen_pct: 5,

    // 5. Captura dual en cliente (Master HD + Proxy ligero) y comportamiento de espejo
    mirror_preview: true,   // true = vista en vivo tipo espejo
    mirror_capture: false,  // false = archivo guardado en orientación natural (sin invertir)
    proxy_max_width: 480,   // Ancho máximo en px del proxy para carrete y rejilla 2x2
    proxy_quality: 0.78,    // Calidad JPEG (0..1) del proxy ligero
    hd_quality: 0.92,       // Calidad JPEG (0..1) de la imagen Master HD

    // 6. Parámetros de Zoom y Paneo interactivo en la Vista Maximizada
    zoom_config: {
        minScale: 1.0,        // Escala base sin zoom
        maxScale: 4.0,        // Zoom máximo permitido (4x)
        doubleTapScale: 2.2,  // Escala al hacer doble toque sobre la foto maximizada
        wheelStep: 0.25,      // Incremento de zoom con rueda de ratón
        panThresholdPx: 8     // Umbral en px para distinguir un toque simple de un arrastre (pan)
    },

    // 7. Tríadas geométricas por rol: { ancho (% de W_pantalla), top (% de H_pantalla), alineacion }
    ROLES: {
        camara:     { ancho: 75, top: 15, alineacion: 'centrada' },
        carrete:    { ancho: 30, top: 80, alineacion: 'izquierda' },
        rejilla:    { ancho: 21, top: 20, alineacion: 'centrada' },
        maximizada: { ancho: 98, top: 30, alineacion: 'centrada' }
    }
};

window.KIOSCO_MEDIA_CONFIG = KIOSCO_MEDIA_CONFIG;

