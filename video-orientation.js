/* Video orientation: independent module. User can rotate videos in 90-degree steps. */
(() => {
 const videos = [...document.querySelectorAll('video')];
 for (const video of videos) {
  if (!video.hasAttribute('controls')) continue;
  const source = video.querySelector('source')?.getAttribute('src') || video.getAttribute('src') || '';
  if (!source) continue;
  const container = document.createElement('div');
  container.className = 'orientation-frame';
  video.parentNode.insertBefore(container,video);
  container.appendChild(video);
  video.classList.add('orientation-video');
  const controls = document.createElement('div');
  controls.className = 'orientation-actions';
  const btn = document.createElement('button');
  btn.type='button';btn.className='orientation-rotate';
  btn.textContent='↻ Girar vídeo';
  btn.setAttribute('aria-label','Girar este vídeo 90 graus');
  controls.appendChild(btn);
  container.appendChild(controls);
  const initial = 0;
  let angle=initial;
  function layout(){
   const quarter = Math.abs(angle % 180) === 90;
   video.style.setProperty('--rotation',angle+'deg');
   video.style.setProperty('--video-scale', '1');
   container.classList.toggle('orientation-portrait',quarter);
   btn.title='Orientação atual: '+angle+' graus. Clique para girar';
  }
  btn.addEventListener('click',()=>{angle=(angle+90)%360;layout()});
  layout();
 }
})();
