(function() {
 const ss = document.getElementById('screensaver');
 const video = document.getElementById('webcam');
 const vidSS = document.getElementById('video-screensaver');

 function hide() {
 if(ss) ss.classList.add('hidden');
 if(vidSS) vidSS.pause();
 }

 document.addEventListener('click', hide);
 document.addEventListener('touchstart', hide);

 // Forzar autoplay del video de fondo
 if(vidSS) {
 vidSS.play().catch(e => console.log('Autoplay bloqueado, esperando interacción'));
 }

 async function initCamera() {
 try {
 const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
 if(video) video.srcObject = stream;
 } catch (err) { console.error('Cámara:', err); }
 }
 document.addEventListener('DOMContentLoaded', initCamera);
})();