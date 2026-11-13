#!/bin/bash
# /home/eco/kiosco.sh -- supervisor del kiosco Optica ECO
#  - relanza Chromium si se cae (resuelve el SingletonLock huerfano)
#  - vigila el consumo de RAM: si se dispara, reinicia el navegador (no se atora)
#  - escribe en /home/eco/kiosco.log Y en el journal (para medir el arranque)

export DISPLAY="${DISPLAY:-:0}"
export XAUTHORITY="${XAUTHORITY:-/home/eco/.Xauthority}"

PROFILE="/home/eco/.config/chromium"
URL="https://opticaeco.com/probador/index.php"
LOG="/home/eco/kiosco.log"
LIMITE_RSS_MB=2400      # si Chromium pasa de esto, se reinicia limpio

FLAGS="
 --kiosk
 --noerrdialogs
 --disable-infobars
 --no-first-run
 --no-default-browser-check
 --disable-session-crashed-bubble
 --disable-translate
 --disable-component-update
 --disable-background-networking
 --disable-background-timer-throttling
 --disable-renderer-backgrounding
 --disable-features=Translate,MediaRouter,OptimizationHints
 --password-store=basic
 --autoplay-policy=no-user-gesture-required
 --enable-gpu-rasterization
 --enable-zero-copy
 --ignore-gpu-blocklist
 --use-angle=gles
 --use-fake-ui-for-media-stream
 --allow-file-access-from-files
 --disable-dev-shm-usage
"

# Escribe en el log de fichero y tambien en stdout (journal: permite medir tiempos)
log() { local m="[$(date -Is)] $*"; echo "$m" >> "$LOG"; echo "$m"; }

rotar_log() {
    if [ -f "$LOG" ] && [ "$(stat -c%s "$LOG" 2>/dev/null || echo 0)" -gt 2000000 ]; then
        mv -f "$LOG" "$LOG.old"
    fi
}

limpiar() {
    pkill -f 'chromium-browser' 2>/dev/null
    sleep 0.5
    pkill -9 -f 'chromium-browser' 2>/dev/null
    pkill -9 -f 'chrome_crashpad' 2>/dev/null
    sleep 0.3
    rm -f "$PROFILE/SingletonLock" "$PROFILE/SingletonSocket" "$PROFILE/SingletonCookie" 2>/dev/null
}

# RAM total (MB) que ocupa ahora mismo Chromium
rss_chromium() {
    local t=0 r p
    for p in $(pgrep -f 'chromium-browser' 2>/dev/null); do
        r=$(awk '/^VmRSS:/{print $2}' "/proc/$p/status" 2>/dev/null)
        t=$((t + ${r:-0}))
    done
    echo $((t / 1024))
}

esperar_x() {
    for i in $(seq 1 40); do
        if command -v xdpyinfo >/dev/null 2>&1; then
            xdpyinfo >/dev/null 2>&1 && return 0
        else
            [ -S /tmp/.X11-unix/X0 ] && return 0
        fi
        sleep 0.5
    done
    log "AVISO: X no respondio en 20s, se lanza igualmente"
}

log "=== supervisor iniciado (pid $$) ==="
espera=2

while true; do
    rotar_log
    limpiar
    esperar_x

    log "lanzando chromium (espera previa=${espera}s) rss_prev=$(rss_chromium)MB"
    # shellcheck disable=SC2086
    chromium-browser $FLAGS "$URL" >> "$LOG" 2>&1 &
    chpid=$!

    # Vigilancia: mientras Chromium viva, controlar RAM
    while kill -0 "$chpid" 2>/dev/null; do
        sleep 15
        kill -0 "$chpid" 2>/dev/null || break
        rss=$(rss_chromium)
        if [ "${rss:-0}" -gt "$LIMITE_RSS_MB" ]; then
            log "RSS ${rss}MB > ${LIMITE_RSS_MB}MB -> reinicio por memoria"
            kill -TERM "$chpid" 2>/dev/null
            sleep 3
            kill -9 "$chpid" 2>/dev/null
            break
        fi
    done
    wait "$chpid" 2>/dev/null
    rc=$?

    log "chromium termino rc=$rc; reiniciando en ${espera}s"
    sleep "$espera"
    [ "$espera" -lt 10 ] && espera=$((espera + 1))
done
