/**
 * GestorMedios - Cerebro matemático, captura WYSIWYG dual y gestos GPU
 */
const GestorMedios = {
    metrics: {},
    zoomState: {
        scale: 1.0,
        panX: 0,
        panY: 0,
        pointers: new Map(),
        startDist: 0,
        startScale: 1.0,
        lastPanX: 0,
        lastPanY: 0,
        downX: 0,
        downY: 0,
        movedBeyondThreshold: false,
        lastTapTime: 0,
        rafId: null,
        targetEl: null
    },

    getConfig() {
        const cfg = window.KIOSCO_MEDIA_CONFIG || KIOSCO_MEDIA_CONFIG;
        return {
            aspX: cfg.Asp_X ?? cfg.ASPECT?.X ?? 5,
            aspY: cfg.Asp_Y ?? cfg.ASPECT?.Y ?? 4,
            marcoPct: cfg.marco_pct ?? cfg.MARCO_PCT ?? 5,
            phi: cfg.phi ?? cfg.PHI ?? 1.61803398875,
            phiExp: cfg.phi_exp ?? cfg.PHI_EXP ?? 4,
            gapPct: cfg.gap_pct ?? cfg.GAP_PCT ?? 2,
            flechaMargenPct: cfg.flecha_margen_pct ?? cfg.FLECHA_MARGEN_PCT ?? 5,
            mirrorPreview: cfg.mirror_preview ?? cfg.CAPTURA?.MIRROR_PREVIEW ?? true,
            mirrorCapture: cfg.mirror_capture ?? cfg.CAPTURA?.MIRROR_CAPTURE ?? false,
            proxyMaxWidth: cfg.proxy_max_width ?? cfg.CAPTURA?.PROXY_MAX_WIDTH ?? 480,
            proxyQuality: cfg.proxy_quality ?? cfg.CAPTURA?.PROXY_QUALITY ?? 0.78,
            hdQuality: cfg.hd_quality ?? cfg.CAPTURA?.HD_QUALITY ?? 0.92,
            minScale: cfg.zoom_config?.minScale ?? cfg.ZOOM?.MIN_SCALE ?? 1.0,
            maxScale: cfg.zoom_config?.maxScale ?? cfg.ZOOM?.MAX_SCALE ?? 4.0,
            doubleTapScale: cfg.zoom_config?.doubleTapScale ?? cfg.ZOOM?.DOUBLE_TAP_SCALE ?? 2.2,
            wheelStep: cfg.zoom_config?.wheelStep ?? cfg.ZOOM?.WHEEL_STEP ?? 0.25,
            panThresholdPx: cfg.zoom_config?.panThresholdPx ?? cfg.ZOOM?.PAN_THRESHOLD_PX ?? 8,
            roles: cfg.ROLES || {}
        };
    },

    calcularRol(rolCfg, W, H, c) {
        const anchoPct = rolCfg?.ancho ?? 50;
        const topPct = rolCfg?.top ?? 10;
        const align = (rolCfg?.alineacion || rolCfg?.align || 'centrada').toLowerCase();

        const wFoto = W * (anchoPct / 100);
        const hFoto = wFoto * (c.aspY / c.aspX);
        const topPx = H * (topPct / 100);
        const gMarco = wFoto * (c.marcoPct / 100);
        const lMin = Math.min(wFoto, hFoto);
        const rExt = lMin * (1 / Math.pow(c.phi, c.phiExp));
        const rInt = Math.max(0, rExt - gMarco);
        const wInner = Math.max(0, wFoto - 2 * gMarco);
        const hInner = Math.max(0, hFoto - 2 * gMarco);

        let leftPx = (W - wFoto) / 2;
        if (align === 'izquierda') leftPx = 0;
        else if (align === 'derecha') leftPx = W - wFoto;

        return { anchoPct, topPct, align, wFoto, hFoto, topPx, leftPx, gMarco, rExt, rInt, wInner, hInner };
    },

    aplicarVariablesElem(el, m) {
        if (!el || !m) return;
        el.style.setProperty('--foto-w', `${m.wFoto.toFixed(2)}px`);
        el.style.setProperty('--foto-h', `${m.hFoto.toFixed(2)}px`);
        el.style.setProperty('--foto-top', `${m.topPx.toFixed(2)}px`);
        el.style.setProperty('--foto-left', `${m.leftPx.toFixed(2)}px`);
        el.style.setProperty('--marco-grosor', `${m.gMarco.toFixed(2)}px`);
        el.style.setProperty('--radio-ext', `${m.rExt.toFixed(2)}px`);
        el.style.setProperty('--radio-int', `${m.rInt.toFixed(2)}px`);
    },

    recalcularGeometria() {
        const c = this.getConfig();
        const W = window.innerWidth || document.documentElement.clientWidth || 1080;
        const H = window.innerHeight || document.documentElement.clientHeight || 1920;
        const root = document.documentElement;

        const gapPx = W * (c.gapPct / 100);
        const flechaMargenPx = W * (c.flechaMargenPct / 100);

        root.style.setProperty('--aspect-x', c.aspX);
        root.style.setProperty('--aspect-y', c.aspY);
        root.style.setProperty('--gap-px', `${gapPx.toFixed(2)}px`);
        root.style.setProperty('--flecha-margen-px', `${flechaMargenPx.toFixed(2)}px`);
        root.style.setProperty('--preview-scale-x', c.mirrorPreview ? '-1' : '1');

        ['camara', 'carrete', 'rejilla', 'maximizada'].forEach(rol => {
            const m = this.calcularRol(c.roles[rol], W, H, c);
            this.metrics[rol] = m;

            root.style.setProperty(`--${rol}-w`, `${m.wFoto.toFixed(2)}px`);
            root.style.setProperty(`--${rol}-h`, `${m.hFoto.toFixed(2)}px`);
            root.style.setProperty(`--${rol}-top`, `${m.topPx.toFixed(2)}px`);
            root.style.setProperty(`--${rol}-left`, `${m.leftPx.toFixed(2)}px`);
            root.style.setProperty(`--${rol}-marco`, `${m.gMarco.toFixed(2)}px`);
            root.style.setProperty(`--${rol}-radio-ext`, `${m.rExt.toFixed(2)}px`);
            root.style.setProperty(`--${rol}-radio-int`, `${m.rInt.toFixed(2)}px`);

            let justify = 'center';
            if (m.align === 'izquierda') justify = 'flex-start';
            else if (m.align === 'derecha') justify = 'flex-end';
            root.style.setProperty(`--${rol}-justify`, justify);
        });

        // Bloque 2x2 de rejilla: 2 columnas * wFoto + gapPx
        if (this.metrics.rejilla) {
            const r = this.metrics.rejilla;
            const gridTotalW = (2 * r.wFoto) + gapPx;
            const gridTotalH = (2 * r.hFoto) + gapPx;
            let gridLeft = (W - gridTotalW) / 2;
            if (r.align === 'izquierda') gridLeft = 0;
            else if (r.align === 'derecha') gridLeft = Math.max(0, W - gridTotalW);
            root.style.setProperty('--rejilla-bloque-w', `${gridTotalW.toFixed(2)}px`);
            root.style.setProperty('--rejilla-bloque-h', `${gridTotalH.toFixed(2)}px`);
            root.style.setProperty('--rejilla-bloque-left', `${gridLeft.toFixed(2)}px`);
        }

        // Aplicar variables directas a cualquier nodo con data-rol
        document.querySelectorAll('[data-rol]').forEach(el => {
            const rol = el.getAttribute('data-rol');
            if (this.metrics[rol]) {
                this.aplicarVariablesElem(el, this.metrics[rol]);
            }
        });

        // Reajustar límites de paneo si la vista maximizada está activa
        if (this.zoomState.targetEl) {
            this.clampPan();
            this.scheduleTransform();
        }
    },

    /**
     * Captura nativa al aspecto Asp_X : Asp_Y, corrige espejo si aplica,
     * y exporta simultáneamente en memoria los dos blobs JPEG (HD 0.92 + Proxy 480px 0.78).
     */
    async canvasToBlobs(videoElement) {
        const c = this.getConfig();
        const vw = videoElement.videoWidth || 1280;
        const vh = videoElement.videoHeight || 720;
        const targetRatio = c.aspX / c.aspY;
        const srcRatio = vw / vh;

        let sW = vw, sH = vh, sX = 0, sY = 0;
        if (srcRatio > targetRatio) {
            sW = Math.round(vh * targetRatio);
            sX = Math.round((vw - sW) / 2);
        } else {
            sH = Math.round(vw / targetRatio);
            sY = Math.round((vh - sH) / 2);
        }

        // 1. Canvas Master HD
        const hdCanvas = document.createElement('canvas');
        hdCanvas.width = sW;
        hdCanvas.height = sH;
        const hdCtx = hdCanvas.getContext('2d', { alpha: false });

        if (c.mirrorCapture) {
            hdCtx.translate(sW, 0);
            hdCtx.scale(-1, 1);
        }
        hdCtx.drawImage(videoElement, sX, sY, sW, sH, 0, 0, sW, sH);

        // 2. Canvas Proxy ligero (máximo proxyMaxWidth manteniendo Asp_X : Asp_Y exacto)
        const proxyW = Math.min(sW, c.proxyMaxWidth);
        const proxyH = Math.round(proxyW * (c.aspY / c.aspX));
        const proxyCanvas = document.createElement('canvas');
        proxyCanvas.width = proxyW;
        proxyCanvas.height = proxyH;
        const proxyCtx = proxyCanvas.getContext('2d', { alpha: false });
        proxyCtx.drawImage(hdCanvas, 0, 0, sW, sH, 0, 0, proxyW, proxyH);

        const toBlobPromise = (canvas, quality) => new Promise(resolve => {
            canvas.toBlob(blob => resolve(blob), 'image/jpeg', quality);
        });

        const [hdBlob, proxyBlob] = await Promise.all([
            toBlobPromise(hdCanvas, c.hdQuality),
            toBlobPromise(proxyCanvas, c.proxyQuality)
        ]);

        hdCanvas.width = 0; hdCanvas.height = 0;
        proxyCanvas.width = 0; proxyCanvas.height = 0;

        return { hdBlob, proxyBlob, width: sW, height: sH, proxyWidth: proxyW, proxyHeight: proxyH };
    },

    /**
     * Límites estrictos de paneo (panX, panY) para cada nivel de escala s:
     * maxPanX = max(0, ((s - 1) * W_inner) / 2)
     * maxPanY = max(0, ((s - 1) * H_inner) / 2)
     */
    clampPan() {
        const st = this.zoomState;
        const c = this.getConfig();
        st.scale = Math.min(c.maxScale, Math.max(c.minScale, st.scale));

        const m = this.metrics.maximizada;
        const wInner = m ? m.wInner : 800;
        const hInner = m ? m.hInner : 640;

        const maxPanX = Math.max(0, ((st.scale - 1) * wInner) / 2);
        const maxPanY = Math.max(0, ((st.scale - 1) * hInner) / 2);

        st.panX = Math.min(maxPanX, Math.max(-maxPanX, st.panX));
        st.panY = Math.min(maxPanY, Math.max(-maxPanY, st.panY));
    },

    scheduleTransform() {
        const st = this.zoomState;
        if (st.rafId) return;
        st.rafId = requestAnimationFrame(() => {
            st.rafId = null;
            if (st.targetEl) {
                st.targetEl.style.transform = `translate3d(${st.panX.toFixed(2)}px, ${st.panY.toFixed(2)}px, 0) scale(${st.scale.toFixed(4)})`;
            }
        });
    },

    resetZoomPan() {
        const st = this.zoomState;
        st.scale = 1.0;
        st.panX = 0;
        st.panY = 0;
        st.pointers.clear();
        st.movedBeyondThreshold = false;
        if (st.rafId) {
            cancelAnimationFrame(st.rafId);
            st.rafId = null;
        }
        if (st.targetEl) {
            st.targetEl.style.transform = 'translate3d(0px, 0px, 0) scale(1)';
        }
    },

    bindMaximizedGestures(viewportEl, mediaTargetEl) {
        const st = this.zoomState;
        st.targetEl = mediaTargetEl;
        this.resetZoomPan();
        if (!viewportEl) return;

        if (viewportEl._gesturesBound) return;
        viewportEl._gesturesBound = true;

        const getDist = (p1, p2) => Math.hypot(p2.x - p1.x, p2.y - p1.y);

        viewportEl.addEventListener('pointerdown', (e) => {
            if (e.target.closest('.btn-close-maximized')) return;
            e.stopPropagation();
            viewportEl.setPointerCapture(e.pointerId);
            st.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

            if (st.pointers.size === 1) {
                st.downX = e.clientX;
                st.downY = e.clientY;
                st.lastPanX = st.panX;
                st.lastPanY = st.panY;
                st.movedBeyondThreshold = false;
            } else if (st.pointers.size === 2) {
                const pts = Array.from(st.pointers.values());
                st.startDist = getDist(pts[0], pts[1]);
                st.startScale = st.scale;
                st.movedBeyondThreshold = true;
            }
        });

        viewportEl.addEventListener('pointermove', (e) => {
            if (!st.pointers.has(e.pointerId)) return;
            e.stopPropagation();
            st.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
            const c = this.getConfig();

            if (st.pointers.size === 1) {
                const dx = e.clientX - st.downX;
                const dy = e.clientY - st.downY;
                if (!st.movedBeyondThreshold) {
                    if (Math.hypot(dx, dy) < c.panThresholdPx) return;
                    st.movedBeyondThreshold = true;
                    st.downX = e.clientX;
                    st.downY = e.clientY;
                    st.lastPanX = st.panX;
                    st.lastPanY = st.panY;
                    return;
                }
                st.panX = st.lastPanX + (e.clientX - st.downX);
                st.panY = st.lastPanY + (e.clientY - st.downY);
                this.clampPan();
                this.scheduleTransform();
            } else if (st.pointers.size >= 2) {
                const pts = Array.from(st.pointers.values());
                const dist = getDist(pts[0], pts[1]);
                if (st.startDist > 0) {
                    st.scale = st.startScale * (dist / st.startDist);
                    this.clampPan();
                    this.scheduleTransform();
                }
            }
        });

        const handlePointerUp = (e) => {
            if (!st.pointers.has(e.pointerId)) return;
            e.stopPropagation();
            const wasSingleTap = (st.pointers.size === 1 && !st.movedBeyondThreshold);
            st.pointers.delete(e.pointerId);

            if (st.pointers.size === 1) {
                const remaining = Array.from(st.pointers.values())[0];
                st.downX = remaining.x;
                st.downY = remaining.y;
                st.lastPanX = st.panX;
                st.lastPanY = st.panY;
            }

            // Doble toque alterna entre minScale (1.0) y doubleTapScale (2.2); toque simple NUNCA cierra
            if (wasSingleTap && e.type === 'pointerup') {
                const now = performance.now();
                const c = this.getConfig();
                if (now - st.lastTapTime < 300) {
                    st.scale = (st.scale > c.minScale + 0.05) ? c.minScale : c.doubleTapScale;
                    if (st.scale === c.minScale) { st.panX = 0; st.panY = 0; }
                    this.clampPan();
                    this.scheduleTransform();
                    st.lastTapTime = 0;
                } else {
                    st.lastTapTime = now;
                }
            }
        };

        viewportEl.addEventListener('pointerup', handlePointerUp);
        viewportEl.addEventListener('pointercancel', handlePointerUp);

        viewportEl.addEventListener('wheel', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const c = this.getConfig();
            const delta = e.deltaY < 0 ? c.wheelStep : -c.wheelStep;
            st.scale += delta;
            this.clampPan();
            this.scheduleTransform();
        }, { passive: false });
    },

    inicializar() {
        this.recalcularGeometria();
        window.addEventListener('resize', () => this.recalcularGeometria());
        window.addEventListener('orientationchange', () => this.recalcularGeometria());
        document.addEventListener('DOMContentLoaded', () => this.recalcularGeometria());
    }
};
window.GestorMedios = GestorMedios;
GestorMedios.inicializar();
