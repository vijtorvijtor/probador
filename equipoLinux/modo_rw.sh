#!/bin/bash
# /home/eco/modo_rw.sh
# Habilita el modo de Lectura/Escritura (RW) en caliente.
# Requiere sudo.

if [ "$EUID" -ne 0 ]; then
    echo "Por favor, ejecuta este script con sudo o como root."
    exit 1
fi

echo "=== CAMBIANDO A MODO ESCRITURA (RW) ==="

# Si usa overlayroot / overlayfs nativo de Raspberry Pi
if grep -q "overlay" /proc/mounts; then
    echo "Desactivando temporalmente el overlay de solo lectura..."
    # En el sistema overlayfs nativo, se puede desactivar o deshabilitar para el siguiente boot,
    # o bien remontar en rw si es un rootfs directo.
    # Para Raspberry Pi OS con overlayroot:
    sudo mount -o remount,rw /
    echo "Sistema remontado en RW. (Nota: Al reiniciar volverá a ser Read-Only por seguridad)."
else
    # Remonte directo si no hay overlay activo aún
    mount -o remount,rw /
    echo "Raíz (/) remontada en modo Lectura/Escritura."
fi

echo "=== SISTEMA EN MODO ESCRITURA (RW) ==="
