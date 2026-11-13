#!/bin/bash
# /home/eco/modo_ro.sh
# Habilita el modo de Solo Lectura (RO) en caliente.
# Requiere sudo.

if [ "$EUID" -ne 0 ]; then
    echo "Por favor, ejecuta este script con sudo o como root."
    exit 1
fi

echo "=== CAMBIANDO A MODO SOLO LECTURA (RO) ==="

# Sincronizar datos pendientes a disco
sync

# Remotaje en solo lectura
mount -o remount,ro /

echo "=== SISTEMA PROTEGIDO EN MODO SOLO LECTURA (RO) ==="
