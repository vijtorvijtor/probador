#!/bin/bash
# opt2.sh - rotacion vertical + IP fija sin DHCP + poda de servicios
BK=/home/eco/.kiosco_backup
mkdir -p "$BK"
TS=$(date +%Y%m%d-%H%M%S)
echo left > /home/eco/.rotar_pantalla
rm -f /home/eco/.no_rotar_pantalla
cp -f /home/eco/.config/openbox/autostart "$BK/autostart.$TS" 2>/dev/null

cat > /home/eco/.config/openbox/autostart <<"AUT"
#!/bin/sh
# Kiosco Optica ECO - imagen VERTICAL, monitor girado 90 grados
ROT=$(cat /home/eco/.rotar_pantalla 2>/dev/null || echo left)
case "$ROT" in
  left)  ROTX=left;   MX="0 -1 1 1 0 0 0 0 1" ;;
  right) ROTX=right;  MX="0 1 0 -1 0 1 0 0 1" ;;
  *)     ROTX=normal; MX="1 0 0 0 1 0 0 0 1" ;;
esac
if command -v xset >/dev/null 2>&1; then xset s off; xset s noblank; xset -dpms; fi
SALIDA=$(xrandr 2>/dev/null | grep " connected" | head -1 | cut -d" " -f1)
[ -z "$SALIDA" ] && SALIDA=HDMI-1
xrandr --output "$SALIDA" --rotate "$ROTX" 2>/dev/null || xrandr --output HDMI-1 --rotate "$ROTX" 2>/dev/null || true
if command -v xinput >/dev/null 2>&1; then
  xinput list 2>/dev/null | while IFS= read -r L; do
    ID=$(printf "%s" "$L" | sed -n "s/.*id=\([0-9][0-9]*\).*/\1/p")
    [ -z "$ID" ] && continue
    case "$L" in
      *[Tt]ouch*|*TFT*|*[Pp]en*|*[Cc]apacitive*|*eGalax*|*ILITEK*|*Waveshare*|*Goodix*|*Silead*|*ADS*)
        xinput set-prop "$ID" "Coordinate Transformation Matrix" $MX 2>/dev/null ;;
    esac
  done
fi
command -v unclutter >/dev/null 2>&1 && unclutter -idle 0.5 -root &
exec /home/eco/kiosco.sh
AUT
chmod +x /home/eco/.config/openbox/autostart
sh -n /home/eco/.config/openbox/autostart && echo AUTOSTART_SYNTAX_OK

cp -f /etc/dhcpcd.conf "$BK/dhcpcd.conf.$TS"
if ! grep -q "^denyinterfaces eth0" /etc/dhcpcd.conf; then
  printf "\n# KIOSCO: eth0 sin cable, no esperar DHCP ni portadora\ndenyinterfaces eth0\n" >> /etc/dhcpcd.conf
fi
grep -q "^interface wlan0" /etc/dhcpcd.conf || printf "\ninterface wlan0\nnoipv6rs\nstatic ip_address=192.168.1.244/24\nstatic routers=192.168.1.1\nstatic domain_name_servers=8.8.8.8 8.8.4.4\n" >> /etc/dhcpcd.conf

systemctl disable raspi-config.service >/dev/null 2>&1
echo "--- RESUMEN ---"
echo "rota=$(cat /home/eco/.rotar_pantalla)"
grep "^denyinterfaces" /etc/dhcpcd.conf
echo "dhcpcd=$(systemctl show dhcpcd -p ExecStart --value | grep -o -- -[a-z]* | tr "\n" " ")"
echo "raspi-config=$(systemctl is-enabled raspi-config.service 2>&1)"
echo P2_DONE
