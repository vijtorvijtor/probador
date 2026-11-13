#!/bin/bash
# ==============================================================================
# SCRIPT INSTALADOR MAESTRO - ÓPTICA ECO KIOSCO (PARTE 1)
# ==============================================================================
if [ "$EUID" -ne 0 ]; then echo "Ejecuta con sudo."; exit 1; fi
TARGET_USER="eco"
USER_HOME="/home/$TARGET_USER"

echo "[+] Instalando dependencias y herramientas..."
apt-get update -y
apt-get install -y python3-opencv python3-flask python3-pip xserver-xorg xinit openbox chromium-browser net-tools wpasupplicant

CMDLINE="/boot/cmdline.txt"
if ! grep -q "fbcon=rotate:1" "$CMDLINE"; then
    sed -i 's/quiet/quiet loglevel=0 logo.nologo consoleblank=0 vt.global_cursor_default=0 fbcon=rotate:1 usb-storage.delay_use=0/' "$CMDLINE"
fi

CONFIG="/boot/config.txt"
if ! grep -q "disable_splash=1" "$CONFIG"; then
    cat << 'EOF' >> "$CONFIG"
disable_splash=1
boot_delay=0
camera_auto_detect=0
dtoverlay=disable-bt
EOF
fi

mkdir -p /etc/X11/xorg.conf.d
cat << 'EOF' > /etc/X11/xorg.conf.d/99-monitor-vertical.conf
Section "Monitor"
    Identifier "HDMI-1"
    Option "Rotate" "left"
EndSection
EOF


# Settings y Configurador
cat << 'EOF' > /etc/settings.conf
ESSID="casa5"
KEY="12345678901234567890666666"
IP="192.168.1.244"
NMASK="255.255.255.0"
GW="192.168.1.1"
DNS1="8.8.8.8"
DNS2="8.8.4.4"
ORIENTACION="90"
URL="https://opticaeco.com/probador/index.php"
EOF

cat << 'EOF' > "$USER_HOME/configurador.sh"
#!/bin/bash
SETTINGS="/etc/settings.conf"
if [ ! -f "$SETTINGS" ]; then exit 1; fi
eval "$(grep -E '^(ESSID|KEY|IP|NMASK|GW|DNS1|DNS2|ORIENTACION|URL)=' "$SETTINGS")"
if [ "$IP" = "DHCP" ] || [ -z "$IP" ]; then
    sudo systemctl unmask dhcpcd.service >/dev/null 2>&1
    sudo systemctl enable dhcpcd.service >/dev/null 2>&1
else
    sudo systemctl disable dhcpcd.service >/dev/null 2>&1
    sudo systemctl stop dhcpcd.service >/dev/null 2>&1
    if [ -n "$ESSID" ]; then
        sudo tee /etc/wpa_supplicant/wpa_supplicant.conf > /dev/null << WPA
ctrl_interface=DIR=/var/run/wpa_supplicant GROUP=netdev
update_config=1
country=MX
network={
    ssid="$ESSID"
    psk="$KEY"
}
WPA
    fi
fi
KIOSCO_SH="/home/eco/kiosco.sh"
if [ -f "$KIOSCO_SH" ] && [ -n "$URL" ]; then
    sed -i "s|URL=.*|URL=\"$URL\"|g" "$KIOSCO_SH"
fi
EOF
chown $TARGET_USER:$TARGET_USER "$USER_HOME/configurador.sh"

# Servicio Arducam, Kiosco y Scripts RW/RO
cat << 'EOF' > "$USER_HOME/arducam_service.py"
import cv2
import time
from flask import Flask, jsonify, send_file
app = Flask(__name__)
@app.route('/capturar', methods=['GET'])
def capturar():
    cap = cv2.VideoCapture(0, cv2.CAP_V4L2)
    cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1920)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 1080)
    ret, frame = cap.read()
    cap.release()
    if not ret: return jsonify({"error": "error"}), 500
    h, w, _ = frame.shape
    cropped = frame[int(h*0.15):int(h*0.85), int(w*0.15):int(w*0.85)]
    final_img = cv2.resize(cropped, (1080, 1080))
    cv2.imwrite("/home/eco/captura_actual.jpg", final_img)
    return send_file("/home/eco/captura_actual.jpg", mimetype='image/jpeg')
if __name__ == '__main__':
    app.run(host='127.0.0.1', port=5000)
EOF

cat << 'EOF' > "$USER_HOME/kiosco.sh"
#!/bin/bash
export DISPLAY="${DISPLAY:-:0}"
URL="https://opticaeco.com/probador/index.php"
FLAGS="--kiosk --noerrdialogs --disable-infobars --no-first-run"
while true; do
    pkill -f 'chromium-browser' 2>/dev/null
    chromium-browser $FLAGS "$URL" &
    wait $!
    sleep 2
done
EOF

cat << 'EOF' > "$USER_HOME/modo_rw.sh"
#!/bin/bash
mount -o remount,rw /
echo "RW habilitado."
EOF

cat << 'EOF' > "$USER_HOME/modo_ro.sh"
#!/bin/bash
sync
mount -o remount,ro /
echo "RO habilitado."
EOF

chown -R $TARGET_USER:$TARGET_USER "$USER_HOME"
chmod +x "$USER_HOME"/*.sh "$USER_HOME"/*.py

chmod +x "$USER_HOME/configurador.sh"
