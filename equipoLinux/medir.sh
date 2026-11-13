#!/bin/bash
# medir.sh -- mide el arranque y deja el resultado en un fichero que el agente puede leer
WS=/home/eco/.vscode-server/data/User/globalStorage/sumitkumarsingh.free-repo-agent
OUT="$WS/medicion_boot.txt"
[ -d "$WS" ] || OUT=/home/eco/medicion_boot.txt
up=$(cut -d. -f1 /proc/uptime)

hito() {  # nombre, patron de proceso
    local n="$1" pat="$2" p e
    p=$(pgrep -f "$pat" 2>/dev/null | head -1)
    if [ -z "$p" ]; then echo "$n: NO ENCONTRADO"; return; fi
    e=$(ps -o etimes= -p "$p" 2>/dev/null | tr -d ' ')
    echo "$n: a los $((up - ${e:-0}))s del encendido (pid $p)"
}

{
  echo "=== MEDICION DE ARRANQUE $(date -Is) ==="
  echo "uptime ahora = ${up}s"
  echo
  echo "--- systemd-analyze ---"
  systemd-analyze 2>&1
  echo
  echo "--- blame (top 10) ---"
  systemd-analyze blame 2>&1 | head -10
  echo
  echo "--- HITOS REALES (ps etimes, fiables) ---"
  hito "kernel listo  ~" "systemd-journald"
  hito "Xorg          " "Xorg"
  hito "openbox       " "openbox"
  hito "supervisor    " "kiosco.sh"
  hito "Chromium      " "chromium-browser"
  echo
  echo "--- ESTADO ---"
  echo "chromium vivos = $(pgrep -c -f chromium-browser 2>/dev/null)"
  echo "x-kiosco.service = $(systemctl is-enabled x-kiosco.service 2>/dev/null)/$(systemctl is-active x-kiosco.service 2>/dev/null)"
  echo "getty@tty1 = $(systemctl is-active getty@tty1.service 2>/dev/null)"
  export DISPLAY=:0 XAUTHORITY=/home/eco/.Xauthority
  echo "-- xrandr --"; timeout 8 xrandr --query 2>&1 | head -2
  echo "-- swap --"; free -m | tail -1
  echo "-- unidades fallidas --"; systemctl --failed --no-legend 2>&1 | head -5
  echo
  echo "--- agetty / login ---"
  journalctl -b -o short-monotonic -u getty@tty1 --no-pager 2>&1 | tail -6
  echo "=== FIN ==="
} > "$OUT" 2>&1
