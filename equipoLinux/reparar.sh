#!/bin/bash
# reparar.sh -- Diagnostico + recuperacion del kiosco Optica ECO (Raspberry Pi 4)
#
# Uso:   sudo bash reparar.sh
# Todo cambio queda respaldado en /home/eco/.kiosco_backup/
# Revertir: sudo bash /home/eco/.kiosco_backup/revertir.sh
#
# Escribe el reporte en:
#   /home/eco/reporte.txt
#   <carpeta del agente>/reporte.txt   (para que el IDE pueda leerlo)

set -u

D="/home/eco/.vscode-server/data/User/globalStorage/sumitkumarsingh.free-repo-agent"
R="$D/reporte.txt"
R2="/home/eco/reporte.txt"
BK="/home/eco/.kiosco_backup"
mkdir -p "$BK" 2>/dev/null

# Todo el stdout/stderr va al reporte y tambien a pantalla
exec > >(tee "$R") 2>&1

say() { echo; echo "########## $* ##########"; }
sep() { echo "------------------------------------------------------------"; }

say "1) FECHA / UPTIME / CARGA"
date -Is
uptime
timeout 5 cat /proc/loadavg
sep

say "2) MEMORIA Y SWAP"
free -m
echo "-- swap activo --"
swapon --show || echo "(sin swap)"
echo "-- dphys-swapfile --"
timeout 5 grep -E '^#?CONF_SWAPSIZE|^#?CONF_MAXSWAP' /etc/dphys-swapfile 2>/dev/null
echo "enabled=$(systemctl is-enabled dphys-swapfile 2>&1) active=$(systemctl is-active dphys-swapfile 2>&1)"
sep

say "3) OOM / ERRORES DE KERNEL / DISCO"
timeout 15 journalctl -k -b --no-pager 2>/dev/null \
  | grep -iE 'out of memory|oom-kill|killed process|I/O error|EXT4-fs error|device offline|usb .*reset|under-voltage' \
  | tail -25
echo "(fin de coincidencias)"
sep

say "4) TOP 15 POR MEMORIA"
ps -eo pid,ppid,rss,pcpu,etimes,comm --sort=-rss 2>/dev/null | head -16
sep

say "5) CHROMIUM / X / SUPERVISOR"
echo "procesos chromium : $(pgrep -fc chromium 2>/dev/null || echo 0)"
echo "procesos chrome-ish: $(pgrep -fc chrome 2>/dev/null || echo 0)"
echo "kiosco.sh         : $(pgrep -af kiosco.sh 2>/dev/null || echo 'NO CORRE')"
echo "Xorg              : $(pgrep -af Xorg 2>/dev/null || echo 'NO CORRE')"
echo "openbox           : $(pgrep -af openbox 2>/dev/null || echo 'NO CORRE')"
echo "-- /tmp/.X11-unix --"
ls -l /tmp/.X11-unix/ 2>/dev/null || echo "(no existe)"
if [ -f /home/eco/kiosco.log ]; then
  echo "-- kiosco.log: ultimas 15 lineas --"
  tail -15 /home/eco/kiosco.log
  echo "-- total de lanzamientos de chromium: $(grep -c 'lanzando chromium' /home/eco/kiosco.log 2>/dev/null || echo 0) --"
  echo "-- tamano del log: $(du -h /home/eco/kiosco.log 2>/dev/null | cut -f1) --"
fi
sep

say "6) COMO ARRANCO (medicion)"
timeout 20 systemd-analyze 2>&1
sep
echo "-- blame (top 12) --"
timeout 20 systemd-analyze blame --no-pager 2>/dev/null | head -12
sep
echo "-- critical-chain --"
timeout 20 systemd-analyze critical-chain --no-pager 2>/dev/null | head -25
sep

say "7) PANTALLA / ROTACION / CMDLINE"
echo "DISPLAY=${DISPLAY:-<vacio>}"
export DISPLAY="${DISPLAY:-:0}"
export XAUTHORITY="${XAUTHORITY:-/home/eco/.Xauthority}"
timeout 10 xrandr --query 2>&1 | head -6
echo "-- /proc/cmdline --"
cat /proc/cmdline
echo "-- /boot/cmdline.txt --"
cat /boot/cmdline.txt 2>/dev/null
sep

say "8) MATRIZ TACTIL (si hay X)"
timeout 10 xinput list 2>&1 | head -20
TOUCHID=$(timeout 10 xinput list 2>/dev/null | sed -n 's/.*Touch[^ ]*.*id=\([0-9][0-9]*\).*/\1/p' | head -1)
echo "id tactil detectado: ${TOUCHID:-<ninguno>}"
[ -n "${TOUCHID:-}" ] && timeout 10 xinput list-props "$TOUCHID" 2>/dev/null | grep -i 'Coordinate Transformation' -A1
sep

say "9) SALUD DEL PI (voltaje / temperatura / reloj)"
timeout 5 vcgencmd get_throttled
timeout 5 vcgencmd measure_temp
timeout 5 vcgencmd measure_volts core
timeout 5 vcgencmd measure_clock arm
sep

say "10) RED"
timeout 5 ip -4 addr show 2>/dev/null | grep -E '^[0-9]+:|inet '
echo "dhcpcd : enabled=$(systemctl is-enabled dhcpcd 2>&1) active=$(systemctl is-active dhcpcd 2>&1)"
echo "wpa_supplicant: $(systemctl is-active wpa_supplicant 2>&1)"
sep

say "11) SERVICIOS CLAVE"
for s in net-guard.service net-guard.timer kiosco.service x.service xorg.service \
         wpa-early.service dhcpcd.service lightdm.service getty@tty1.service; do
  printf '%-22s enabled=%-12s active=%s\n' "$s" \
    "$(systemctl is-enabled "$s" 2>&1)" "$(systemctl is-active "$s" 2>&1)"
done
echo "-- unidades fallidas --"
timeout 10 systemctl list-units --failed --no-pager --no-legend 2>/dev/null
sep

say "12) FICHEROS DEL KIOSCO"
ls -la /home/eco 2>/dev/null
sep
echo "-- URL usada por kiosco.sh --"
grep -n '^URL=' /home/eco/kiosco.sh 2>/dev/null
echo "-- autostart de openbox --"
sed -n '1,40p' /home/eco/.config/openbox/autostart 2>/dev/null
echo "-- .bash_profile --"
cat /home/eco/.bash_profile 2>/dev/null
sep

# =====================================================================
#                        RECUPERACION
# =====================================================================
say "13) RECUPERACION (solo actua si hace falta)"
CAMBIOS=0

# ---- 13a. Tormenta de reinicios de Chromium -------------------------
echo "[13a] comprobando tormenta de reinicios"
NLAUNCH=0
[ -f /home/eco/kiosco.log ] && NLAUNCH=$(grep -c 'lanzando chromium' /home/eco/kiosco.log 2>/dev/null || echo 0)
NCHR=$(pgrep -fc chromium 2>/dev/null || echo 0)
echo "      lanzamientos historicos=$NLAUNCH  chromium ahora=$NCHR"
if [ "$NLAUNCH" -gt 8 ] && [ "$NCHR" -eq 0 ]; then
    echo "      >> Tormenta detectada (reintenta y no consigue quedarse). Deteniendo."
    pkill -f kiosco.sh 2>/dev/null; sleep 1
    pkill -9 -f chromium-browser 2>/dev/null; sleep 2
    echo "      >> Supervisor detenido. Para reactivar:  nohup /home/eco/kiosco.sh >/dev/null 2>&1 &"
    CAMBIOS=$((CAMBIOS+1))
else
    echo "      sin tormenta: no se toca."
fi

# ---- 13b. Swap (Chromium sin swap = OOM garantizado) ----------------
echo "[13b] comprobando swap"
if swapon --show 2>/dev/null | grep -q .; then
    echo "      swap ya activo."
else
    echo "      >> Sin swap. Activando 1024 MB."
    cp -a /etc/dphys-swapfile "$BK/dphys-swapfile.bak" 2>/dev/null
    systemctl unmask dphys-swapfile 2>/dev/null
    if grep -qE '^CONF_SWAPSIZE=' /etc/dphys-swapfile 2>/dev/null; then
        sed -i 's/^CONF_SWAPSIZE=.*/CONF_SWAPSIZE=1024/' /etc/dphys-swapfile
    else
        echo 'CONF_SWAPSIZE=1024' >> /etc/dphys-swapfile
    fi
    systemctl enable dphys-swapfile >/dev/null 2>&1
    timeout 120 systemctl restart dphys-swapfile
    echo "      resultado:"; swapon --show
    CAMBIOS=$((CAMBIOS+1))
fi

# ---- 13c. net-guard pasa a timer (no bloquea ni ensucia el arranque) -
echo "[13c] net-guard"
if [ -f /etc/systemd/system/net-guard.service ] && [ ! -f /etc/systemd/system/net-guard.timer ]; then
    echo "      >> Convirtiendo net-guard a timer diferido (90 s)."
    cp -a /etc/systemd/system/net-guard.service "$BK/net-guard.service.bak" 2>/dev/null
    cat > /etc/systemd/system/net-guard.timer <<'EOF'
[Unit]
Description=Red de seguridad de red (diferida al arranque)

[Timer]
OnBootSec=90s
Unit=net-guard.service

[Install]
WantedBy=timers.target
EOF
    systemctl daemon-reload
    systemctl disable net-guard.service  >/dev/null 2>&1
    systemctl enable  net-guard.timer    >/dev/null 2>&1
    systemctl start   net-guard.timer    >/dev/null 2>&1
    echo "      hecho: net-guard.timer enabled=$(systemctl is-enabled net-guard.timer 2>&1)"
    CAMBIOS=$((CAMBIOS+1))
else
    echo "      nada que hacer."
fi

# ---- 13d. Script de reversion --------------------------------------
cat > "$BK/revertir.sh" <<'EOF'
#!/bin/bash
# Revierte los cambios hechos por reparar.sh
BK=/home/eco/.kiosco_backup
echo "Revirtiendo..."
pkill -f kiosco.sh 2>/dev/null
[ -f "$BK/net-guard.service.bak" ] && cp -a "$BK/net-guard.service.bak" /etc/systemd/system/net-guard.service
rm -f /etc/systemd/system/net-guard.timer
systemctl daemon-reload
systemctl enable net-guard.service 2>/dev/null
systemctl stop    net-guard.timer 2>/dev/null
[ -f "$BK/dphys-swapfile.bak" ] && cp -a "$BK/dphys-swapfile.bak" /etc/dphys-swapfile
systemctl disable dphys-swapfile 2>/dev/null
systemctl mask    dphys-swapfile 2>/dev/null
echo "Listo. Reinicia para volver al estado anterior."
EOF
chmod +x "$BK/revertir.sh"
cp -f "$0" /home/eco/reparar.sh 2>/dev/null

# ---- 13e. Estado final ---------------------------------------------
say "14) ESTADO FINAL"
echo "cambios aplicados: $CAMBIOS"
free -m
swapon --show
echo "chromium: $(pgrep -fc chromium 2>/dev/null || echo 0)  kiosco.sh: $(pgrep -af kiosco.sh 2>/dev/null || echo 'no')"
echo "kiosco.log (ultimas 8):"
tail -8 /home/eco/kiosco.log 2>/dev/null
sep
cp -f "$R" "$R2" 2>/dev/null
echo
echo "########## FIN ##########"
echo "Reporte copiado a: $R2"
echo "Reversion disponible en: $BK/revertir.sh"
