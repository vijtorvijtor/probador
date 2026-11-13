#!/bin/bash
# /home/eco/red_emergencia.sh
# Script de emergencia para restaurar red IP fija de forma manual ante cualquier fallo.
# Uso: ./red_emergancia.sh (requiere sudo)

SETTINGS="/etc/settings.conf"

if [ ! -f "$SETTINGS" ]; then
    echo "Error: No se encuentra $SETTINGS"
    exit 1
fi

# Leer parámetros de /etc/settings.conf
eval "$(grep -E '^(ESSID|KEY|IP|NMASK|GW|DNS1|DNS2)=' "$SETTINGS")"

echo "=== INICIANDO RECUPERACIÓN DE RED DE EMERGENCIA ==="
echo "Configurando ESSID: $ESSID con IP Fija: $IP"

# 1. Asegurar que la interfaz wlan0 esté activa
echo "1. Activando interfaz wlan0..."
sudo ip link set wlan0 up
sleep 2

# 2. Reconfigurar wpa_supplicant con el ESSID y KEY actuales
echo "2. Configurando credenciales inalambricas..."
sudo tee /etc/wpa_supplicant/wpa_supplicant.conf > /dev/null << EOF
ctrl_interface=DIR=/var/run/wpa_supplicant GROUP=netdev
update_config=1
country=MX

network={
    ssid="$ESSID"
    psk="$KEY"
}
EOF

sudo systemctl restart wpa_supplicant
sleep 4

# 3. Aplicar IP estática de manera directa
if [ "$IP" != "DHCP" ] && [ -n "$IP" ]; then
    echo "3. Aplicando IP Estática directa ($IP)..."
    sudo ip addr flush dev wlan0
    sudo ip addr add "$IP/24" dev wlan0
    sudo ip route add default via "$GW" 2>/dev/null || sudo ip route replace default via "$GW"
    
    # Configurar DNS
    echo "nameserver $DNS1" | sudo tee /etc/resolv.conf > /dev/null
    [ -n "$DNS2" ] && echo "nameserver $DNS2" | sudo tee -a /etc/resolv.conf > /dev/null
fi

echo "=== RED RESTAURADA ==="
ip -4 addr show wlan0
ping -c 2 8.8.8.8 || echo "Aviso: Sin salida a internet aun (verifica ESSID/KEY o cercania al router)."
