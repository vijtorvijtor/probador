#!/bin/bash
# /home/eco/wifi_guard.sh
# Guardián de red autónomo para Óptica Eco.
# Monitorea y reconecta el WiFi automáticamente si se pierde la conexión,
# sin bloquear jamás el arranque del sistema.

# Esperar a que el sistema levante por completo (sin bloquear el boot)
sleep 20

TARGET_IP="8.8.8.8"  # Google DNS para verificar salida a internet

while true; do
    # Comprobar si hay salida a internet mediante ping rápido (timeout de 3s)
    if ! ping -c 1 -W 3 "$TARGET_IP" >/dev/null 2>&1; then
        logger -t wifi-guard "Pérdida de internet detectada. Intentando reconectar wlan0..."
        
        # Intentar reconexión mediante NetworkManager
        nmcli device disconnect wlan0 >/dev/null 2>&1
        sleep 2
        nmcli device connect wlan0 >/dev/null 2>&1
        
        # Si NetworkManager falla, forzar reset físico de la interfaz inalámbrica
        if ! ping -c 1 -W 3 "$TARGET_IP" >/dev/null 2>&1; then
            logger -t wifi-guard "Reconexión NM fallida. Reiniciando interfaz wlan0..."
            ip link set wlan0 down
            sleep 2
            ip link set wlan0 up
            sleep 5
        fi
    fi
    
    # Comprobar cada 30 segundos
    sleep 30
done
