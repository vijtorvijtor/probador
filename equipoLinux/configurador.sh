#!/bin/bash
# /home/eco/configurador.sh
# Configurador maestro condicional para Óptica Eco.
# Lee /etc/settings.conf y aplica red (Dinámica vs IP Estática Pura), orientación inversa y URL.

SETTINGS="/etc/settings.conf"

if [ ! -f "$SETTINGS" ]; then
    echo "Error: No se encuentra $SETTINGS"
    exit 1
fi

# Leer parámetros de /etc/settings.conf
eval "$(grep -E '^(ESSID|KEY|IP|NMASK|GW|DNS1|DNS2|ORIENTACION|URL)=' "$SETTINGS")"

echo "=== Aplicando configuracion condicional desde $SETTINGS ==="

# 1. Gestión de Red Condicional (DHCP vs IP Estática Pura)
if [ "$IP" = "DHCP" ] || [ -z "$IP" ]; then
    echo "Modo detectado: DHCP Dinámico. Habilitando servicios de red estándar..."
    sudo systemctl unmask dhcpcd.service >/dev/null 2>&1
    sudo systemctl enable dhcpcd.service >/dev/null 2>&1
    
    # Restaurar dhcpcd.conf básico
    sudo tee /etc/dhcpcd.conf > /dev/null << EOF
# Configuración por defecto DHCP
hostname
persistent
option rapid_commit
option domain_name_servers, domain_name, domain_search, host_name
option classless_static_routes
option ntp_servers
require domain_name_servers
slaac private
interface wlan0
dhcp
EOF

else
    echo "Modo detectado: IP Estática Pura ($IP). Desactivando dependencias DHCP y configurando estática..."
    # Desactivar daemons DHCP pesados para evitar esperas en el boot
    sudo systemctl disable dhcpcd.service >/dev/null 2>&1
    sudo systemctl stop dhcpcd.service >/dev/null 2>&1

    # Configurar credenciales en wpa_supplicant
    if [ -n "$ESSID" ]; then
        sudo tee /etc/wpa_supplicant/wpa_supplicant.conf > /dev/null << EOF
ctrl_interface=DIR=/var/run/wpa_supplicant GROUP=netdev
update_config=1
country=MX

network={
    ssid="$ESSID"
    psk="$KEY"
}
EOF
    fi
fi

# 2. Configuración de Orientación de Pantalla (Inversa: left para contrarrestar 90° horario)
CMDLINE="/boot/cmdline.txt"
if grep -q "fbcon=rotate:" "$CMDLINE"; then
    sudo sed -i 's/fbcon=rotate:[0-3]/fbcon=rotate:1/g' "$CMDLINE"
else
    sudo sed -i 's/$/ fbcon=rotate:1/' "$CMDLINE"
fi

XORG_CONF="/etc/X11/xorg.conf.d/99-monitor-vertical.conf"
sudo mkdir -p /etc/X11/xorg.conf.d
sudo tee "$XORG_CONF" > /dev/null << EOF
Section "Monitor"
    Identifier "HDMI-1"
    Option "Rotate" "left"
EndSection
EOF

# 3. Actualizar URL en kiosco.sh si existe
KIOSCO_SH="/home/eco/kiosco.sh"
if [ -f "$KIOSCO_SH" ] && [ -n "$URL" ]; then
    sudo sed -i "s|URL=.*|URL=\"$URL\"|g" "$KIOSCO_SH"
    echo "URL actualizada a: $URL"
fi

echo "=== Configuración condicional aplicada exitosamente ==="


#!/bin/bash

# ==============================================================================
# FASE 2: CONFIGURADOR RÁPIDO Y DE RED - ÓPTICA ECO
# ==============================================================================

if [ "$EUID" -ne 0 ]; then
  echo "[ERROR] Ejecuta este script con sudo: sudo bash configurador.sh"
  exit 1
fi

CONFIG_FILE="/etc/settings.conf"
if [ ! -f "$CONFIG_FILE" ]; then
    echo "[ERROR] No se encuentra $CONFIG_FILE. Créalo primero."
    exit 1
fi

echo "=== 1. LEYENDO PARÁMETROS DESDE SETTINGS.CONF ==="
eval "$(awk -F '=' '{
    if ($1 ~ /^([A-Z0-9_]+)$/) {
        gsub(/^[ \t]+|[ \t]+$/, "", $1);
        gsub(/^[ \t]+|[ \t]+$/, "", $2);
        print $1 "=\"" $2 "\""
    }
}' "$CONFIG_FILE")"

echo "=== 2. CONFIGURANDO RED ESTÁTICA NATIVA (dhcpcd + wpa_supplicant) ==="
systemctl unmask wpa_supplicant dhcpcd 2>/dev/null
systemctl enable wpa_supplicant dhcpcd

cat > /etc/wpa_supplicant/wpa_supplicant.conf << EOF
ctrl_interface=DIR=/var/run/wpa_supplicant GROUP=netdev
update_config=1
country=MX

network={
    ssid="$ESSID"
    psk="$KEY"
    priority=100
}
EOF

sed -i "/interface wlan0/,+4 d" /etc/dhcpcd.conf
cat >> /etc/dhcpcd.conf << EOF

interface wlan0
static ip_address=$IP/24
static routers=$GW
static domain_name_servers=$DNS1 $DNS2
EOF

echo "=== 3. APAGADO SEGURO DE SERVICIOS PESADOS (OPTIMIZACIÓN DE BOOT) ==="
SERVICES_TO_MUTE=(
    "rsyslog"
    "avahi-daemon"
    "bluetooth"
    "hciuart"
    "dphys-swapfile"
    "cron"
    "ModemManager"
    "triggerhappy"
    "udisks2"
    "cups"
    "cups-browsed"
)

for s in "${SERVICES_TO_MUTE[@]}"; do
    systemctl stop "$s.service" 2>/dev/null
    systemctl disable "$s.service" 2>/dev/null
    systemctl mask "$s.service" 2>/dev/null
done

echo "=== 4. OPTIMIZACIÓN DEL JOURNAL (CERO ESCRITURA EN DISCO) ==="
if [ -f /etc/systemd/journald.conf ]; then
    sed -i 's/#Storage=auto/Storage=none/g' /etc/systemd/journald.conf
    sed -i 's/Storage=auto/Storage=none/g' /etc/systemd/journald.conf
    systemctl restart systemd-journald 2>/dev/null
fi

echo "=== 5. ORIENTACIÓN DE PANTALLA EN BOOT (CMDLINE.TXT) Y XORG ==="
[ ! -f /boot/cmdline.txt.bak ] && cp /boot/cmdline.txt /boot/cmdline.txt.bak

if [ "$ORIENTACION" = "90" ]; then
    KMS_ROT="panel_orientation=left_side_up"
    XRANDR_ROT="left"
    TOUCH_TRANS="0 -1 1 1 0 0 0 0 1"
elif [ "$ORIENTACION" = "180" ]; then
    KMS_ROT="panel_orientation=upside_down"
    XRANDR_ROT="inverted"
    TOUCH_TRANS="-1 0 1 0 -1 1 0 0 1"
elif [ "$ORIENTACION" = "270" ]; then
    KMS_ROT="panel_orientation=right_side_up"
    XRANDR_ROT="right"
    TOUCH_TRANS="0 1 0 -1 0 1 0 0 1"
else
    KMS_ROT="panel_orientation=normal"
    XRANDR_ROT="normal"
    TOUCH_TRANS="1 0 0 0 1 0 0 0 1"
fi

CMDLINE_CONTENT="console=serial0,115200 console=tty1 root=/dev/sda2 rootfstype=ext4 fsck.repair=yes rootwait quiet loglevel=0 logo.nologo consoleblank=0 video=HDMI-A-1:$KMS_ROT"
echo "$CMDLINE_CONTENT" > /boot/cmdline.txt

# Configurar autologin en TTY1 para el usuario eco
id -u eco &>/dev/null || useradd -m -s /bin/bash eco
mkdir -p /etc/systemd/system/getty@tty1.service.d
cat << EOF > /etc/systemd/system/getty@tty1.service.d/override.conf
[Service]
ExecStart=
ExecStart=-/sbin/agetty --autologin eco --noclear %I $TERM
EOF
systemctl daemon-reload
systemctl enable getty@tty1.service

# Perfil de inicio para lanzar startx automáticamente en tty1
cat << 'EOF' > /home/eco/.bash_profile
if [ -z "$DISPLAY" ] && [ "$(tty)" = "/dev/tty1" ]; then
    exec startx
fi
EOF

# Configuración del entorno Openbox y Kiosco Chromium
mkdir -p /home/eco/.config/openbox
cat << EOF > /home/eco/.config/openbox/autostart
xrandr --output HDMI-1 --rotate $XRANDR_ROT 2>/dev/null || xrandr --output HDMI-A-1 --rotate $XRANDR_ROT 2>/dev/null

TOUCH_ID=\$(xinput list | grep -iE 'touch|tft|pen|capacitive' | head -n 1 | sed 's/.*id=\([0-9]*\).*/\1/')
if [ ! -z "\$TOUCH_ID" ]; then
    xinput set-prop "\$TOUCH_ID" 'Coordinate Transformation Matrix' $TOUCH_TRANS 2>/dev/null
fi

xset s off -dpms
xset s noblank
unclutter -idle 0.5 -root &

exec chromium-browser \
  --kiosk \
  --noerrdialogs \
  --disable-infobars \
  --no-first-run \
  --enable-gpu-rasterization \
  --enable-zero-copy \
  --ignore-gpu-blocklist \
  --use-angle=gles \
  --use-fake-ui-for-media-stream \
  --allow-file-access-from-files \
  --autoplay-policy=no-user-gesture-required \
  "$URL"
EOF

chown -R eco:eco /home/eco

echo "=== ¡FASE 2 APLICADA CON ÉXITO! ==="
echo "Reiniciando en 3 segundos para comprobar arranque ultrarrápido y rotación..."
sleep 3
reboot
