#!/usr/bin/env bash
# ==============================================================================
# PROYECTO: Óptica ECO - Kiosco Interactivo
# SISTEMA: Raspberry Pi OS Legacy (Debian Bullseye, 64-bit Lite)
# HARDWARE: Raspberry Pi 4 Model B con Cámara Arducam
# ARCHIVO: kiosk-setup.sh
# DESCRIPCIÓN: Script autónomo, seguro e idempotente de configuración y puesta a
#              punto del quiosco con autologin directo a X11 + Openbox + Chromium.
# ==============================================================================

set -euo pipefail

# ------------------------------------------------------------------------------
# 0. VARIABLES GLOBALES Y CONFIGURACIÓN
# ------------------------------------------------------------------------------
KIOSK_URL="https://opticaeco.com/probador/index.php"
ROTATION_MODE="right"   # 'right' (90° horario) empareja con display_rotate=1 en config.txt
TARGET_USER="${SUDO_USER:-eco}"
TARGET_HOME=$(getent passwd "$TARGET_USER" | cut -d: -f6)

if [ -z "$TARGET_HOME" ] || [ ! -d "$TARGET_HOME" ]; then
    TARGET_USER="eco"
    TARGET_HOME="/home/eco"
fi

# Colores para mensajes de consola
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

log_info()    { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[OK]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[AVISO]${NC} $1"; }
log_error()   { echo -e "${RED}[ERROR]${NC} $1"; }
log_step()    { echo -e "\n${CYAN}================================================================${NC}"; echo -e "${CYAN}▶ $1${NC}"; echo -e "${CYAN}================================================================${NC}"; }

# ------------------------------------------------------------------------------
# CONTROL DE PRIVILEGIOS
# ------------------------------------------------------------------------------
if [ "$(id -u)" -ne 0 ]; then
    log_error "Este script debe ejecutarse con privilegios de root."
    echo "Uso recomendado: sudo bash $0"
    exit 1
fi

log_info "Iniciando despliegue de quiosco Óptica ECO para usuario: $TARGET_USER ($TARGET_HOME)"

# ------------------------------------------------------------------------------
# GESTIÓN INTELIGENTE DE RESPALDOS
# ------------------------------------------------------------------------------
# Regla: Si existe .bak, se preserva intacto (nunca se sobrescribe un backup previo).
#        Si no existe .bak, se genera una copia fiel del archivo original puro.
safe_backup() {
    local file="$1"
    if [ -f "$file" ]; then
        local bak="${file}.bak"
        if [ ! -f "$bak" ]; then
            cp -p "$file" "$bak"
            log_success "Respaldo puro creado: $bak"
        else
            log_info "Respaldo previo detectado: $bak (se mantiene intacto para seguridad)"
        fi
    fi
}

# ------------------------------------------------------------------------------
# 1. REPOSITORIOS Y PAQUETES (DEBIAN BULLSEYE ARCHIVE)
# ------------------------------------------------------------------------------
log_step "1/7: Configuración de Repositorios Debian Bullseye Archive y Paquetes"

safe_backup "/etc/apt/sources.list"

# Escribir sources.list limpio apuntando a archive.debian.org sin rutas duplicadas
cat << 'EOF' > /etc/apt/sources.list
deb http://archive.debian.org/debian/ bullseye main contrib non-free
deb-src http://archive.debian.org/debian/ bullseye main contrib non-free
deb http://archive.debian.org/debian-security/ bullseye-security main contrib non-free
EOF

# Desactivar verificación de expiración de Release para repositorios archivados (evita error 404/expired)
cat << 'EOF' > /etc/apt/apt.conf.d/99no-check-valid-until
Acquire::Check-Valid-Until "false";
EOF

# Lista de paquetes indispensables para quiosco autónomo
REQUIRED_PKGS=(
    xserver-xorg
    xinit
    openbox
    lightdm
    unclutter
    chromium-browser
    python3
)

MISSING_PKGS=()
for pkg in "${REQUIRED_PKGS[@]}"; do
    if ! dpkg -s "$pkg" >/dev/null 2>&1; then
        MISSING_PKGS+=("$pkg")
    fi
done

if [ ${#MISSING_PKGS[@]} -gt 0 ]; then
    log_info "Paquetes faltantes detectados: ${MISSING_PKGS[*]}"
    log_info "Actualizando índices APT e instalando..."
    apt-get update -o Acquire::Check-Valid-Until=false || true
    DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends "${MISSING_PKGS[@]}"
    log_success "Paquetes instalados correctamente."
else
    log_success "Todos los paquetes necesarios (X11, openbox, lightdm, unclutter, chromium-browser) ya están instalados."
fi

# ------------------------------------------------------------------------------
# 2. ROTACIÓN PERMANENTE DE PANTALLA EN /boot/config.txt
# ------------------------------------------------------------------------------
log_step "2/7: Rotación Permanente de Hardware en config.txt (display_rotate=1)"

# Localizar la partición de boot
BOOT_DIR="/boot"
if [ -d "/boot/firmware" ] && [ -f "/boot/firmware/config.txt" ]; then
    BOOT_DIR="/boot/firmware"
fi

CONFIG_TXT="$BOOT_DIR/config.txt"
if [ ! -f "$CONFIG_TXT" ]; then
    log_error "No se encontró config.txt en $CONFIG_TXT"
    exit 1
fi

safe_backup "$CONFIG_TXT"

# Aplicar display_rotate=1 y disable_splash=1 de manera limpia y sin duplicaciones
python3 - << PYEOF
with open("$CONFIG_TXT", "r") as f:
    content = f.read()

lines = content.splitlines()
new_lines = []
has_rotate = False
has_disable_splash = False

for line in lines:
    stripped = line.strip()
    if stripped.startswith("display_rotate="):
        new_lines.append("display_rotate=1")
        has_rotate = True
    elif stripped.startswith("disable_splash="):
        new_lines.append("disable_splash=1")
        has_disable_splash = True
    elif stripped == "# Rotacion permanente para kiosco Optica ECO" or stripped == "# Rotacion permanente de hardware para kiosco Optica ECO":
        continue # Limpiar comentarios redundantes previos
    else:
        new_lines.append(line)

if not has_rotate:
    new_lines.append("")
    new_lines.append("# Rotacion permanente de hardware para kiosco Optica ECO")
    new_lines.append("display_rotate=1")

if not has_disable_splash:
    new_lines.append("disable_splash=1")

with open("$CONFIG_TXT", "w") as f:
    f.write("\n".join(new_lines) + "\n")
PYEOF

log_success "Rotación permanente display_rotate=1 fijada en $CONFIG_TXT"

# ------------------------------------------------------------------------------
# 3. BOOT LIMPIO Y SILENCIOSO EN /boot/cmdline.txt (UNA SOLA LÍNEA PROTEGIDA)
# ------------------------------------------------------------------------------
log_step "3/7: Configuración de Arranque Silencioso en cmdline.txt (Protección MMC/Partición)"

CMDLINE_TXT="$BOOT_DIR/cmdline.txt"
if [ ! -f "$CMDLINE_TXT" ]; then
    log_error "No se encontró cmdline.txt en $CMDLINE_TXT"
    exit 1
fi

safe_backup "$CMDLINE_TXT"

# Modificar con validación estricta en Python: NO romper PARTUUID ni rootwait ni crear saltos de línea
python3 - << PYEOF
import sys

with open("$CMDLINE_TXT", "r") as f:
    raw = f.read()

tokens = raw.strip().split()

# Verificar presencia de root= (protección contra kernel panic y fallos MMC)
if not any(t.startswith("root=") for t in tokens):
    sys.stderr.write("ERROR FATAL: El archivo $CMDLINE_TXT no contiene parámetro root=. Abortando para proteger el arranque.\n")
    sys.exit(1)

# Asegurar rootwait (esencial para evitar errores de bus MMC en tarjetas SD)
if not any(t == "rootwait" for t in tokens):
    tokens.append("rootwait")

# Parámetros a remover (conflictivos o ruidosos)
remove_keys = {"splash", "plymouth.ignore-serial-consoles"}
tokens = [t for t in tokens if t not in remove_keys and not t.startswith("loglevel=")]

# Parámetros silenciosos obligatorios requeridos
desired = ["quiet", "loglevel=3", "logo.nologo", "vt.global_cursor_default=0"]
for item in desired:
    if item not in tokens:
        tokens.append(item)

# Generar estrictamente una sola línea
final_line = " ".join(tokens) + "\n"

with open("$CMDLINE_TXT", "w") as f:
    f.write(final_line)
PYEOF

log_success "cmdline.txt blindado en una sola línea con logo.nologo y vt.global_cursor_default=0"

# ------------------------------------------------------------------------------
# 4. GESTOR DE SESIONES LIGHTDM Y AUTOLOGIN A ENTORNO GRÁFICO (X11)
# ------------------------------------------------------------------------------
log_step "4/7: Configuración de LightDM, Grupos de Sistema y Salto Directo a X11"

# Asegurar grupo autologin y grupos de hardware para eco
groupadd -f autologin
usermod -aG autologin,video,audio,input,render "$TARGET_USER"

# Configurar LightDM con drop-in seguro
mkdir -p /etc/lightdm/lightdm.conf.d
safe_backup "/etc/lightdm/lightdm.conf"

cat << EOF > /etc/lightdm/lightdm.conf.d/01-kiosk.conf
[Seat:*]
autologin-user=$TARGET_USER
autologin-user-timeout=0
autologin-session=openbox
user-session=openbox
pam-service=lightdm-autologin
pam-autologin-service=lightdm-autologin
xserver-command=X
EOF

# Asegurar también la sección en el archivo base lightdm.conf
python3 - << PYEOF
path = "/etc/lightdm/lightdm.conf"
with open(path, "r") as f:
    content = f.read()

lines = content.splitlines()
in_seat = False
has_user = False
has_timeout = False
has_session = False
new_lines = []

for line in lines:
    stripped = line.strip()
    if stripped.startswith("[Seat:"):
        in_seat = True
        new_lines.append(line)
        continue
    elif stripped.startswith("[") and stripped.endswith("]"):
        if in_seat:
            if not has_user:
                new_lines.append("autologin-user=$TARGET_USER")
            if not has_timeout:
                new_lines.append("autologin-user-timeout=0")
            if not has_session:
                new_lines.append("autologin-session=openbox")
            in_seat = False
        new_lines.append(line)
        continue

    if in_seat:
        if stripped.startswith("autologin-user="):
            new_lines.append("autologin-user=$TARGET_USER")
            has_user = True
        elif stripped.startswith("autologin-user-timeout="):
            new_lines.append("autologin-user-timeout=0")
            has_timeout = True
        elif stripped.startswith("autologin-session="):
            new_lines.append("autologin-session=openbox")
            has_session = True
        else:
            new_lines.append(line)
    else:
        new_lines.append(line)

if in_seat:
    if not has_user:
        new_lines.append("autologin-user=$TARGET_USER")
    if not has_timeout:
        new_lines.append("autologin-user-timeout=0")
    if not has_session:
        new_lines.append("autologin-session=openbox")

with open(path, "w") as f:
    f.write("\n".join(new_lines) + "\n")
PYEOF

# EL ESLABÓN CRÍTICO: Configurar systemd a graphical.target para salir de la consola de texto
log_info "Habilitando graphical.target en systemd para garantizar arranque directo en X11..."
systemctl set-default graphical.target
systemctl enable lightdm 2>/dev/null || true

log_success "LightDM y systemd configurados para autologin gráfico con Openbox."

# ------------------------------------------------------------------------------
# 5. CONFIGURACIÓN DE OPENBOX AUTOSTART
# ------------------------------------------------------------------------------
log_step "5/7: Configuración de Openbox Autostart (Pantalla, Protector y Bucle Kiosco)"

OPENBOX_DIR="$TARGET_HOME/.config/openbox"
OPENBOX_AUTOSTART="$OPENBOX_DIR/autostart"

mkdir -p "$OPENBOX_DIR"
safe_backup "$OPENBOX_AUTOSTART"

cat << EOF > "$OPENBOX_AUTOSTART"
#!/usr/bin/env bash
# Autostart para Kiosco Optica ECO en Openbox

# 1. Rotación de pantalla en X11 (para sincronizar con display_rotate=1 en config.txt)
for display in \$(xrandr --query 2>/dev/null | grep ' connected' | cut -d' ' -f1); do
    xrandr --output "\$display" --rotate $ROTATION_MODE 2>/dev/null || true
done
# Fallback para puertos HDMI específicos de Raspberry Pi 4
xrandr --output HDMI-1 --rotate $ROTATION_MODE 2>/dev/null || xrandr --output HDMI-A-1 --rotate $ROTATION_MODE 2>/dev/null || true

# 2. Desactivar protector de pantalla, DPMS y ahorro de energía
xset s off -dpms
xset s noblank

# 3. Ocultar el cursor del mouse tras 0.5s de inactividad
unclutter -idle 0.5 -root &

# 4. Supervisor en bucle continuo de Chromium Kiosco
URL="$KIOSK_URL"

while true; do
    # Limpiar bloqueos de sesión por apagón repentino para evitar diálogos de error
    sed -i 's/"exited_cleanly":false/"exited_cleanly":true/' ~/.config/chromium/Default/Preferences 2>/dev/null || true
    sed -i 's/"exit_type":"Crashed"/"exit_type":"Normal"/' ~/.config/chromium/Default/Preferences 2>/dev/null || true
    rm -f ~/.config/chromium/Singleton* 2>/dev/null || true

    chromium-browser \\
        --kiosk \\
        --noerrdialogs \\
        --disable-infobars \\
        --no-first-run \\
        --disable-session-crashed-bubble \\
        --disable-translate \\
        --hide-scrollbars \\
        --check-for-update-interval=31536000 \\
        --use-fake-ui-for-media-stream \\
        --allow-file-access-from-files \\
        --autoplay-policy=no-user-gesture-required \\
        "\$URL"

    # Si Chromium se cierra inesperadamente, reiniciar en 2 segundos
    sleep 2
done
EOF

chmod +x "$OPENBOX_AUTOSTART"
log_success "Script Openbox autostart generado y marcado como ejecutable."

# ------------------------------------------------------------------------------
# 6. PERMISOS PROGRAMÁTICOS DE CÁMARA EN CHROMIUM PREFERENCES
# ------------------------------------------------------------------------------
log_step "6/7: Preautorización Programática de Cámara Arducam en Chromium"

CHROMIUM_DEFAULT_DIR="$TARGET_HOME/.config/chromium/Default"
CHROMIUM_PREFS="$CHROMIUM_DEFAULT_DIR/Preferences"

mkdir -p "$CHROMIUM_DEFAULT_DIR"
safe_backup "$CHROMIUM_PREFS"

python3 - << PYEOF
import json
import os

path = "$CHROMIUM_PREFS"
data = {}

if os.path.exists(path):
    try:
        with open(path, "r", encoding="utf-8") as f:
            content = f.read().strip()
            if content:
                data = json.loads(content)
    except Exception as e:
        print("[WARN] No se pudo parsear Preferences existente, inicializando estructura limpia:", e)
        data = {}

profile = data.setdefault("profile", {})

# Valores por defecto globales
default_settings = profile.setdefault("default_content_setting_values", {})
default_settings["media_stream_camera"] = 1
default_settings["media_stream_mic"] = 1

# Excepciones específicas por origen web para Optica ECO
content_settings = profile.setdefault("content_settings", {})
exceptions = content_settings.setdefault("exceptions", {})
camera_exceptions = exceptions.setdefault("media_stream_camera", {})

origins = [
    "https://opticaeco.com:443,*",
    "https://opticaeco.com,*",
    "https://opticaeco.com:443,https://opticaeco.com:443",
    "https://opticaeco.com,https://opticaeco.com"
]

for origin in origins:
    camera_exceptions[origin] = {"setting": 1}

# Limpieza preventiva de estado de cierre
profile["exited_cleanly"] = True
profile["exit_type"] = "Normal"

with open(path, "w", encoding="utf-8") as f:
    json.dump(data, f, indent=2)

print("[OK] Preferencias de Chromium inyectadas con éxito.")
PYEOF

log_success "Permisos de cámara Arducam autorizados para https://opticaeco.com"

# ------------------------------------------------------------------------------
# 7. ASIGNACIÓN DE PROPIEDAD Y VERIFICACIÓN FINAL
# ------------------------------------------------------------------------------
log_step "7/7: Ajuste de Permisos de Usuario y Verificación Final del Sistema"

# Asignar todo el directorio de configuración al usuario destino
chown -R "$TARGET_USER:$TARGET_USER" "$TARGET_HOME/.config"
log_success "Permisos de archivos corregidos para $TARGET_USER:$TARGET_USER."

# Verificación de sintaxis de scripts generados
bash -n "$OPENBOX_AUTOSTART"
log_success "Sintaxis de $OPENBOX_AUTOSTART validada correctamente."

# Resumen de verificación
echo -e "\n${GREEN}================================================================${NC}"
echo -e "${GREEN}✔ ¡CONFIGURACIÓN COMPLETADA CON ÉXITO Y SIN ERRORES!${NC}"
echo -e "${GREEN}================================================================${NC}"
echo -e "• Usuario quiosco:       $TARGET_USER"
echo -e "• URL Kiosco:            $KIOSK_URL"
echo -e "• Rotación hardware:     display_rotate=1 (config.txt)"
echo -e "• Rotación X11:          $ROTATION_MODE (xrandr)"
echo -e "• Boot silencioso:       logo.nologo vt.global_cursor_default=0 quiet loglevel=3"
echo -e "• Target systemd:        $(systemctl get-default 2>/dev/null || echo 'graphical.target (configurado)')"
echo -e "• Permisos de cámara:    Preautorizados en Preferences de Chromium"
echo -e "• Respaldos seguros:     Archivos .bak creados y preservados"
echo -e "----------------------------------------------------------------"
echo -e "Para aplicar los cambios y entrar al quiosco, reinicia el sistema:"
echo -e "   ${CYAN}sudo reboot${NC}"
echo -e "================================================================\n"
