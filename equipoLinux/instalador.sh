#!/bin/bash

# ==============================================================================
# FASE 1 CORREGIDA: INSTALADOR BASE (Bullseye Legacy 64-bit Lite)
# ==============================================================================

if [ "$EUID" -ne 0 ]; then
  echo "[ERROR] Ejecuta este script con sudo: sudo bash instalador.sh"
  exit 1
fi

echo "=== 1. CONFIGURANDO REPOSITORIOS HISTÓRICOS DE BULLSEYE ==="
# Redirigir los repositorios de seguridad y base a archive para evitar errores 404
cat > /etc/apt/sources.list << 'EOF'
deb http://archive.debian.org/debian bullseye main contrib non-free
deb http://archive.debian.org/debian-security bullseye-security main contrib non-free
EOF

# Desactivar temporalmente la verificación estricta de fecha de Release si el reloj desincroniza
echo 'Acquire::Check-Valid-Time "false";' > /etc/apt/apt.conf.d/99no-check-valid-time

echo "=== 2. ACTUALIZANDO LISTAS (SIN UPGRADE MASIVO) ==="
export DEBIAN_FRONTEND=noninteractive
apt-get update -y

echo "=== 3. INSTALANDO EXCLUSIVAMENTE LO NECESARIO PARA EL KIOSCO ==="
apt-get install -y --no-install-recommends \
    xserver-xorg \
    xinit \
    openbox \
    chromium-browser \
    xinput \
    unclutter \
    wpasupplicant \
    dhcpcd5

echo "=== FASE 1 INSTALACIÓN COMPLETADA CON ÉXITO ==="
