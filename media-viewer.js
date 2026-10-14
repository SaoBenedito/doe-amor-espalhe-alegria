/* Public media experience. No admin access or external dependencies. */
(()=>{'use strict';
const gallery=document.querySelectorAll('main img:not(.brand-logo), main video');
const modal=document.createElement('div');modal.className='media-viewer';modal.hidden=true;
modal.innerHTML='<div class="media-viewer-backdrop" data-close></div><section class="media-viewer-panel" role="dialog" aria-modal="true" aria-label="Galeria de ações sociais"><header class="media-viewer-header"><span>DOE AMOR · UNIDOS POR UM SORRISO</span><button type="button" class="media-viewer-close" aria-label="Fechar visualização">✕</button></header><div class="media-viewer-stage"></div><footer class="media-viewer-footer"><span class="media-viewer-caption"></span><div class="media-viewer-nav"><button type="button" data-prev aria-label="Anterior">←</button><span class="media-viewer-counter"></span><button type="button" data-next aria-label="Próxima">→</button></div></footer></section>';
document.body.append(modal);
const stage=modal.querySelector('.media-viewer-stage'),caption=modal.querySelector('.media-viewer-caption'),counter=modal.querySelector('.media-viewer-counter');
const items=[...gallery].filter(el=>!el.closest('.hero') && !el.closest('.orientation-frame') && (el.tagName==='IMG'||el.tagName==='VIDEO'));
let current=0,prior=null;
function show(index){current=(index+items.length)%items.length;stage.replaceChildren();const original=items[current];const isVideo=original.tagName==='VIDEO';const el=document.createElement(isVideo?'video':'img');
if(isVideo){el.controls=true;el.playsInline=true;el.preload='metadata';el.poster=original.poster;const src=original.querySelector('source')?.src||original.currentSrc||original.src;el.src=src;}
else{el.src=original.currentSrc||original.src;el.alt=original.alt||'Registro de ação social';}
stage.append(el);caption.textContent=isVideo?'Vídeo de uma de nossas ações sociais':(original.alt||'Registro da comunidade São Benedito');counter.textContent=(current+1)+' / '+items.length;
}
function open(index){prior=document.activeElement;show(index);modal.hidden=false;document.body.classList.add('media-viewer-open');modal.querySelector('.media-viewer-close').focus();}
function close(){stage.replaceChildren();modal.hidden=true;document.body.classList.remove('media-viewer-open');prior?.focus?.();}
items.forEach((el,i)=>{if(el.tagName==='VIDEO'){const trigger=document.createElement('button');trigger.type='button';trigger.className='media-viewer-trigger';trigger.textContent='⤢ Ampliar vídeo';trigger.setAttribute('aria-label','Abrir vídeo em tela ampliada');el.insertAdjacentElement('afterend',trigger);trigger.addEventListener('click',()=>open(i));}else{el.classList.add('media-viewer-image');el.setAttribute('tabindex','0');el.setAttribute('role','button');el.setAttribute('aria-label','Ampliar imagem: '+(el.alt||'ação social'));el.addEventListener('click',()=>open(i));el.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();open(i);}});}});
modal.querySelector('.media-viewer-close').addEventListener('click',close);modal.querySelector('[data-close]').addEventListener('click',close);modal.querySelector('[data-prev]').addEventListener('click',()=>show(current-1));modal.querySelector('[data-next]').addEventListener('click',()=>show(current+1));
document.addEventListener('keydown',e=>{if(modal.hidden)return;if(e.key==='Escape')close();if(e.key==='ArrowLeft')show(current-1);if(e.key==='ArrowRight')show(current+1);});
})();