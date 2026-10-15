"use strict";
(function(){
 const api="https://xtwydlgoqmqhbpbojwmp.supabase.co/rest/v1/site_banners?select=*&active=eq.true&order=sort_order.desc,created_at.desc";
 const key="sb_publishable_E1nafD2jTZRz3Nhx2oTtiQ_SSpW5t-4";
 const root=document.getElementById("eventBannerCarousel");
 if(!root)return;
 fetch(api,{headers:{apikey:key}}).then(r=>{if(!r.ok)throw Error("Falha ao carregar");return r.json()}).then(items=>{
 if(!items.length){root.remove();return}
 const track=document.createElement("div");track.className="managed-banner-track";root.append(track);
 const slides=items.map(item=>{
 const section=document.createElement("article");section.className="managed-banner-slide";if(item.image_url)section.classList.add("managed-banner-slide--image");
 if(item.image_url){try{const url=new URL(item.image_url);if(url.protocol==="https:"){const img=document.createElement("img");img.src=url.href;img.alt="";img.className="managed-banner-photo";section.append(img)}}catch{}}
 const inner=document.createElement("div");inner.className="managed-banner-copy";
 const eyebrow=document.createElement("span");eyebrow.className="managed-banner-eyebrow";eyebrow.textContent="✦ PRÓXIMO EVENTO · DOE AMOR";
 const h=document.createElement("h2");h.textContent=item.title;
 const p=document.createElement("p");p.textContent=item.subtitle||"Sua contribuição transforma vidas.";
 inner.append(eyebrow,h,p);
 if(item.event_date){const date=document.createElement("strong");date.className="managed-banner-date";date.textContent="📅 "+new Date(item.event_date+"T12:00:00").toLocaleDateString("pt-BR",{day:"2-digit",month:"long",year:"numeric"});inner.append(date)}
 const a=document.createElement("a");a.className="managed-banner-action";a.textContent=item.button_label||"Contribuir agora ↗";const target=item.button_url||"#doar";if(target.startsWith("#")||target.startsWith("/")&&!target.startsWith("//")||target.startsWith("https://"))a.href=target==="#doar"&&!document.getElementById("doar")?"#contribuir":target;else a.href="#doar";inner.append(a);if(!item.image_url)section.append(inner);if(item.image_url){const full=document.createElement("a");full.className="managed-banner-full-link";full.href=a.href;full.setAttribute("aria-label","Abrir campanha: "+item.title+". "+(item.button_label||"Contribuir agora"));section.append(full)}track.append(section);return section
 });
 let current=0;
 const dots=document.createElement("div");dots.className="managed-banner-dots";
 const buttons=slides.map((_,i)=>{const button=document.createElement("button");button.type="button";button.setAttribute("aria-label","Mostrar banner "+(i+1));button.addEventListener("click",()=>{show(i);restart()});dots.append(button);return button});
 function show(n){current=(n+slides.length)%slides.length;track.style.transform="translateX(-"+(current*100)+"%)";slides.forEach((slide,i)=>{slide.setAttribute("aria-hidden",String(i!==current));slide.inert=i!==current});buttons.forEach((button,i)=>button.setAttribute("aria-current",String(i===current)))}
 show(0);
 if(slides.length>1){
  const controls=document.createElement("div");controls.className="managed-banner-controls";
  for(const [label,step] of [["Anterior",-1],["Próximo",1]]){const button=document.createElement("button");button.type="button";button.textContent=step<0?"‹":"›";button.setAttribute("aria-label",label+" banner");button.addEventListener("click",()=>{show(current+step);restart()});controls.append(button)}
  root.append(controls,dots);
  let timer=null;const reduced=matchMedia("(prefers-reduced-motion: reduce)").matches;
  function stop(){if(timer){clearInterval(timer);timer=null}}
  function restart(){stop();if(!reduced&&!document.hidden)timer=setInterval(()=>show(current+1),6000)}
  root.addEventListener("mouseenter",stop);root.addEventListener("mouseleave",restart);
  root.addEventListener("focusin",stop);root.addEventListener("focusout",e=>{if(!root.contains(e.relatedTarget))restart()});
  document.addEventListener("visibilitychange",()=>document.hidden?stop():restart());
  let touchX=null;root.addEventListener("touchstart",e=>{touchX=e.changedTouches[0].screenX;stop()},{passive:true});
  root.addEventListener("touchend",e=>{if(touchX!==null){const diff=e.changedTouches[0].screenX-touchX;if(Math.abs(diff)>45)show(current+(diff<0?1:-1));touchX=null;restart()}},{passive:true});
  restart();
 }

 }).catch(()=>{root.remove()});
})();