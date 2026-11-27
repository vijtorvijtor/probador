\# PROMPT PARA AGENTE EN VS CODE — MOTOR UNIVERSAL DE PRESENTACIÓN DE MEDIOS E INTERACCIÓN EN REJILLA (KIOSCO PROBADOR)  
\#\# 1\. REGLA DE ORO: CERO "MEJORAS" NO SOLICITADAS Y EJECUCIÓN EN DOS FASES  
**\- Prohibición estricta de improvisar:** No inventes ni agregues "mejoras" por tu cuenta (nada de librerías externas, animaciones complejas, efectos no pedidos, rediseños de interfaz, cambios en el flujo de negocio, nuevos botones ni alteraciones a módulos ajenos). Cíñete exclusivamente a lo especificado en este documento.  
**\- Protocolo obligatorio en Dos Fases (Plan y validación primero, código después):**  
  **\- FASE 1 (Solo auditoría, detección de datos faltantes y plan — SIN modificar ni crear archivos aún):**  
    1\. Revisa los archivos actuales del proyecto del kiosco probador para mapear cómo funciona hoy la cámara, el carrete, la rejilla comparadora, el guardado de fotos y la vista ampliada.  
    2\. **Revisa y pregúntame expresamente si detectas algún dato incompleto, ambigüedad o dependencia técnica del código actual** que no se haya considerado aquí y que pudiera hacer fallar el desarrollo (por ejemplo: rutas de carpetas, nombres de endpoints PHP, eventos existentes del botón de disparo, integración con WhatsApp/QR o estructura del DOM actual).  
    3\. Presenta un resumen corto y estructurado con:  
       \- Archivos nuevos a crear.  
       \- Archivos existentes a modificar.  
       \- Código, reglas CSS o archivos obsoletos a depurar/eliminar.  
       \- Lista explícita de archivos y módulos existentes que **NO** vas a tocar por estar fuera de alcance.  
    4\. **Detente y espera mi respuesta/confirmación** antes de escribir o modificar una sola línea de código.  
  **\- FASE 2 (Implementación limpia):** Una vez que te responda y confirme, ejecuta el plan completo, limpio y sin código duplicado.  
\#\# 2\. DIRECTIVA DE MIGRACIÓN LIMPIA, DEPURACIÓN Y REEMPLAZO  
Antes de escribir o conectar los nuevos módulos, audita el avance actual del proyecto del kiosco probador:  
\- Todo lo definido en este documento **complementa y reemplaza** la lógica anterior de tamaños, proporciones, marcos, captura de fotos, rejilla comparadora y vista ampliada.  
**\- Depura y elimina** cualquier código obsoleto, funciones duplicadas, reglas CSS en conflicto, cálculos manuales viejos de proporciones/marcos, listeners huérfanos o archivos temporales que ya no correspondan tras integrar esta arquitectura.  
\- Asegura que no coexistan dos sistemas de dimensionamiento ni dos manejadores de eventos sobre la rejilla o la imagen ampliada, dejando el código base limpio, ordenado y libre de comportamientos inesperados.  
\#\# 3\. OBJETIVO GENERAL  
Implementar una arquitectura centralizada (configuración maestra \+ división clara de responsabilidades entre CSS, JS y PHP) que controle de forma universal el dimensionamiento, proporción, posición en pantalla, marco dorado interior, doble resolución y gestos táctiles/puntero para cualquier medio visual (img, video, gif) en todas las vistas del kiosco probador (cámara/mampara, carrete, rejilla comparadora 2x2 y vista maximizada de inspección).  
El objetivo es que en el futuro yo pueda darte instrucciones cortas en lenguaje natural —por ejemplo:  
"Vamos a probar un aspecto 5:4. La foto de la cámara es de 75% centrada. Las fotos del carrete que sean del 30% y las de la rejilla que sean del 21%. Grueso del marco del 5%."  
o tríadas de posición y escala como:  
"imagen de la mampara (80, 15, centrada), carrete (18, 80, izquierda), maximizada (98, 30, centrada)"  
y tú (el agente) solo tengas que actualizar los valores en un único bloque de configuración global (KIOSCO\_MEDIA\_CONFIG) sin romper fórmulas, geometría ni interacciones.  
\---  
\#\# 4\. ARQUITECTURA Y DIVISIÓN DE RESPONSABILIDADES (PRIORIZANDO RENDIMIENTO EN RASPBERRY PI 4\)  
\#\#\# A. PHP (Backend ligero, sesión y entrega de rutas duales)  
\- Mantener PHP lo más ligero posible para cero latencia en Raspberry Pi 4: no procesar ni redimensionar imágenes en PHP (evitar GD/ImageMagick en tiempo real que bloquean CPU).  
\- Su responsabilidad es:  
  1\. Inyectar la configuración inicial (KIOSCO\_MEDIA\_CONFIG o JSON compartido) y entregar al frontend los pares de rutas por cada captura: ruta\_baja (proxy ligero para carrete y rejilla 2x2) y ruta\_alta (Master HD para vista maximizada y envío por WhatsApp/QR).  
  2\. Recibir en el endpoint de guardado los dos blobs ya generados en cliente (alta y baja) y escribirlos directo a disco en la carpeta de sesión.  
  3\. Servir las cabeceras de caché local adecuadas y limpiar sesiones antiguas.  
\#\#\# B. JavaScript (Cerebro matemático, captura WYSIWYG dual y gestos GPU)  
\- Contiene el objeto de configuración maestra KIOSCO\_MEDIA\_CONFIG (Asp\_X, Asp\_Y, marco\_pct, phi\_exp, zoom\_config, gaps\_pct y tríadas por rol).  
\- Calcula en píxeles exactos las variables CSS (--foto-w, \--foto-h, \--foto-top, \--marco-grosor, \--radio-ext, \--radio-int, \--gap-px) al iniciar y ante eventos resize/orientationchange.  
\- Captura nativa en Canvas al momento del disparo: recorta el rectángulo máximo centrado del stream que cumple Asp\_X : Asp\_Y, normaliza la orientación (corrigiendo el modo espejo de la vista previa si aplica) y exporta simultáneamente en memoria los dos archivos (Master HD \+ Proxy ligero) antes de enviarlos a PHP.  
\- Controla la máquina de estados de la rejilla 2x2 y la vista maximizada (carga bajo demanda de la imagen HD al abrir, ocultamiento/hueco en el slot 2x2, liberación de memoria al cerrar y cierre exclusivo mediante el botón de tache).  
\- Gestiona los gestos táctiles/puntero (Pointer Events) de zoom (pellizco y rueda) y paneo (arrastre) aplicando transform: translate3d() y scale() acelerados por GPU dentro de requestAnimationFrame, respetando los límites matemáticos exactos para no perder la foto fuera del marco.  
\#\#\# C. CSS (Renderizado puro por GPU, geometría blindada y estética)  
\- Consume exclusivamente las variables CSS inyectadas por JS para aplicar box-sizing: border-box, dimensiones exactas, marco dorado hacia adentro (padding interior con degradado metálico), bordes redondeados concéntricos (R\_ext y R\_int) y recorte limpio (overflow: hidden) del medio interno.  
\- Mantiene en capas aisladas los efectos estéticos (sombras, luminosidad, profundidad, sobrerrelieve) sin modificar nunca el modelo de caja.  
\- Usa propiedades aceleradas por composición de GPU (transform: translate3d, will-change: transform, touch-action: none en el lienzo maximizado) evitando recálculos de layout (reflows) durante el zoom, paneo o transición entre la rejilla 2x2 y la vista maximizada.  
\---  
\#\# 5\. REGLAS MATEMÁTICAS Y DE MEDIOS INQUEBRANTABLES  
\#\#\# A. Medio genérico ("foto")  
\- Toda regla geométrica y de marco aplica por igual a imágenes estáticas (img), videos (video) y animaciones (gif) dentro de un contenedor unificado con su atributo data-rol.  
\- Para cuidar CPU/GPU en Raspberry Pi 4, si un elemento en carrete o rejilla 2x2 es video, debe mostrarse pausado en primer cuadro (poster/preload="metadata") mientras está en miniatura, y reproducirse únicamente cuando está en cámara en vivo o en la vista maximizada (a menos que se indique lo contrario).  
\#\#\# B. Proporción Global (Asp\_X : Asp\_Y)  
\- Variables globales: Asp\_X y Asp\_Y (ejemplos: 4:3, 16:9, 5:4).  
\- Todos los contenedores de medio heredan esta misma proporción Asp\_X / Asp\_Y sin deformarse ni añadir franjas/plecas.  
\#\#\# C. Tríada de Tamaño, Posición Vertical y Alineación: (ancho%, top%, alineacion)  
Cada rol se define mediante tres valores principales y su separación configurable:  
1\. Ancho (%): porcentaje del ancho total de la pantalla del dispositivo actual (W\_pantalla).  
   \- W\_foto \= W\_pantalla \* (ancho% / 100\)  
   \- H\_foto \= W\_foto \* (Asp\_Y / Asp\_X)  
2\. Posición vertical (top%): porcentaje de la altura total de la pantalla (H\_pantalla) donde se ubica el borde superior del elemento o fila.  
   \- Top\_px \= H\_pantalla \* (top% / 100\)  
   \- Ejemplo: 50% de altura significa que el borde superior de la foto o fila queda a la mitad de la pantalla, no centrada verticalmente. Si Top\_px \+ H\_foto excede H\_pantalla, el contenedor debe respetar la geometría exacta de la foto sin aplastarla ni deformarla.  
3\. Alineación horizontal (izquierda, centrada o derecha) y separación (gap\_pct configurable en KIOSCO\_MEDIA\_CONFIG, expresado como porcentaje de W\_pantalla, por defecto 2%):  
   \- Foto individual (camara / mampara / maximizada): mide ancho% del ancho de pantalla, su borde superior arranca en top% de la altura de pantalla y se alinea horizontalmente según alineacion.  
   \- Carrete (1 solo renglón con flechas a los lados): cada foto mide ancho% del ancho de pantalla, la fila inicia a top% de la altura de pantalla y mantiene un único renglón horizontal (flex-wrap: nowrap) con separación gap\_px entre tarjetas. Las flechas de navegación izquierda/derecha reservan un margen lateral configurable (flecha\_margen\_pct, por defecto 5% de W\_pantalla por lado) para no encimarse sobre las fotos, desplazando el renglón horizontalmente al pulsarlas o deslizar.  
   \- Rejilla comparadora (2x2): cuadrícula fija de 2 columnas por 2 filas (4 slots). Cada foto mide ancho% del ancho de pantalla, el bloque completo inicia a top% de la altura de pantalla, usa separación uniforme gap\_px horizontal y vertical entre las 4 tarjetas y se alinea horizontalmente como bloque según alineacion. Si hay menos de 4 fotos capturadas, los slots faltantes mantienen su espacio reservado en el 2x2 sin desacomodar las existentes; si hay más de 4, se muestran las 4 seleccionadas/activas.  
\#\#\# D. Marco Dorado Interior (B%) y Redondeo en Proporción Áurea (phi \= 1.61803398875)  
\- El grosor del marco dorado se define como un porcentaje B (ejemplo: 3, 5, 6, 10\) del ancho calculado de la foto (W\_foto):  
  \- G\_marco \= W\_foto \* (B / 100\)  
\- El marco SIEMPRE crece hacia adentro (box-sizing: border-box / padding interior): nunca aumenta el ancho exterior W\_foto ni desborda el porcentaje asignado en pantalla.  
\- Acabado dorado mediante degradado metálico multi-tono.  
\- Redondeo áureo a partir del lado menor L\_min \= min(W\_foto, H\_foto):  
  \- Radio exterior del marco: R\_ext \= L\_min \* (1 / phi^4) (aprox. 0.145898 \* L\_min, permitiendo configurar el exponente phi\_exp en KIOSCO\_MEDIA\_CONFIG).  
  \- Radio interior del medio (img/video/gif): R\_int \= max(0, R\_ext \- G\_marco) para que la curva interna sea concéntrica con el marco dorado sin pellizcos ni huecos.  
\#\#\# E. Captura Fiel al Aspecto, Modo Espejo y Doble Resolución (Optimización para Raspberry Pi 4\)  
\- Captura nativa al aspecto Asp\_X : Asp\_Y: en el momento de capturar, el Canvas calcula el rectángulo máximo centrado del stream que cumple Asp\_X / Asp\_Y, evitando deformaciones, estiramientos o plecas añadidas.  
\- Normalización de espejo: si la vista en vivo de cámara muestra efecto espejo para comodidad del usuario (mirror\_preview: true en config), al capturar se guarda la imagen normalizada sin invertir (mirror\_capture: false) para que textos, marcas o detalles del armazón se lean correctamente al compartir por WhatsApp.  
\- Dos versiones por captura (configurables en KIOSCO\_MEDIA\_CONFIG):  
  1\. Versión de alta resolución (HD — ruta\_alta): resolución nativa recortada a Asp\_X : Asp\_Y, exportada en JPEG calidad 0.92, destinada exclusivamente a la vista maximizada de inspección y al envío por WhatsApp / QR.  
  2\. Versión ligera (Proxy UI — ruta\_baja): escalada proporcionalmente a un ancho máximo de 480 px manteniendo exactamente Asp\_X : Asp\_Y, exportada en JPEG calidad 0.78, usada exclusivamente en el carrete y en la rejilla comparadora 2x2 para garantizar fluidez en Raspberry Pi 4\.  
\---  
\#\# 6\. BLINDAJE DE MODIFICACIONES ESTÉTICAS  
Cuando se pidan cambios estéticos ("agrega sombra", "más luminosa", "más profundo", "en sobre relief", etc.), aplícalos solo mediante sombras, filtros o gradientes que no alteren las dimensiones calculadas (W\_foto, H\_foto, G\_marco, R\_ext, R\_int ni posiciones de la tríada).  
\---  
\#\# 7\. INTERACCIÓN CLAVE: REJILLA 2x2 Y VISTA MAXIMIZADA CON ZOOM/PAN Y BOTÓN DE CERRAR (TACHE)  
Resuelve de forma limpia y determinista este flujo en la comparación:  
1\. Estado inicial de comparación: se muestra la rejilla de 2x2 fotos usando las versiones ligeras (ruta\_baja) con su marco dorado.  
2\. Abrir / maximizar una foto al tocarla en la rejilla:  
   \- Al tocar/seleccionar una foto de la rejilla 2x2 (cuando no haya otra maximizada abierta), aparece sobre la rejilla la foto maximizada según su tríada configurada (por ejemplo (98, 30, centrada)), cargando bajo demanda la versión de alta resolución (ruta\_alta) dentro de su marco dorado.  
   \- En la rejilla 2x2, el espacio correspondiente a esa foto queda como un hueco vacío (reservando su posición exacta en el grid 2x2 mediante visibility: hidden, sin que las demás fotos salten ni reordenen su posición). Mientras esté abierta una foto maximizada, se bloquean los clics accidentales sobre las otras tarjetas de la rejilla subyacente.  
3\. Matemáticas exactas de zoom y paneo dentro del marco dorado:  
   \- Rango de zoom configurable en KIOSCO\_MEDIA\_CONFIG: minScale \= 1.0, maxScale \= 4.0, doubleTapScale \= 2.2 (paso de rueda de ratón configurable).  
   \- Área interior visible dentro del marco: W\_inner \= W\_foto \- (2 \* G\_marco) y H\_inner \= H\_foto \- (2 \* G\_marco).  
   \- Límites estrictos de paneo (panX, panY) para cada nivel de escala s:  
     \- maxPanX \= max(0, ((s \- 1\) \* W\_inner) / 2\)  
     \- maxPanY \= max(0, ((s \- 1\) \* H\_inner) / 2\)  
     \- panX se restringe siempre al intervalo \[-maxPanX, \+maxPanX\] y panY al intervalo \[-maxPanY, \+maxPanY\], evitando que la foto deje huecos vacíos dentro del marco dorado o se pierda fuera de vista.  
   \- Umbral táctil/puntero: movimientos menores a 8 px se consideran toque simple y no desplazan la imagen; desplazamientos \>= 8 px o gestos de 2 dedos activan paneo/pellizco fluido vía requestAnimationFrame.  
   \- Un toque simple sobre la imagen maximizada NUNCA cierra la vista maximizada.  
4\. Cierre explícito mediante botón de tache (X) y liberación de memoria:  
   \- La vista maximizada incorpora un botón de cerrar (tache "X") visible, táctil (mínimo 48x48 px) y estilizado acorde al marco dorado en una esquina del contenedor maximizado (con z-index superior a la capa de zoom/paneo).  
   \- Al pulsar el botón de tache (X): se resetean escala (1.0) y paneo (0, 0), se oculta la vista maximizada, se descarga/limpia la referencia HD en memoria para no saturar RAM en la Raspberry Pi 4 y vuelve a aparecer la foto en el hueco vacío que había quedado reservado en la rejilla 2x2.  
\#\# 8\. CONFIGURACIÓN INICIAL DE PRUEBA  
Configura KIOSCO\_MEDIA\_CONFIG con estos valores iniciales:  
\- Aspecto global: Asp\_X \= 5, Asp\_Y \= 4 (5:4)  
\- Grueso del marco dorado: 5% del ancho de cada foto (hacia adentro)  
\- Redondeo áureo: phi \= 1.61803398875, exponente 4  
\- Separación y márgenes: gap\_pct \= 2 (2% de W\_pantalla), flecha\_margen\_pct \= 5  
\- Captura y calidad: mirror\_preview \= true, mirror\_capture \= false, proxy\_max\_width \= 480, proxy\_quality \= 0.78, hd\_quality \= 0.92  
\- Zoom maximizado: minScale \= 1.0, maxScale \= 4.0, doubleTapScale \= 2.2  
\- Roles:  
  \- camara: (75, 15, centrada)  
  \- carrete: (30, 80, izquierda)  
  \- rejilla: (21, 20, centrada)  
  \- maximizada: (98, 30, centrada)  
\#\# 9\. REPORTE OBLIGATORIO AL FINALIZAR LA FASE 2  
Al terminar la implementación de la Fase 2, entrégame únicamente un resumen concreto indicando:  
1\. En qué archivo quedó **KIOSCO\_MEDIA\_CONFIG**.  
2\. Qué código o archivos antiguos depuraste/reemplazaste.  
3\. Cómo quedó dividida la implementación entre CSS, JS y PHP.