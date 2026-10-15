"use strict";
(function(){
 const api="https://xtwydlgoqmqhbpbojwmp.supabase.co/rest/v1/site_banners?select=*&active=eq.true&order=sort_order.desc,created_at.desc";
 const key="sb_publishable_E1nafD2jTZRz3Nhx2oTtiQ_SSpW5t-4";
 const root=document.getElementById("eventBannerCarousel");
 if(!root)return;
 fetch(api,{headers:{apikey:key}}).then(r=>{if(!r.ok)throw Error("Falha ao carregar");return r.json()}).then(items=>{
 if(!items.length){root.remove();return}
 const slides=items.map(item=>{
 const section=document.createElement("article");section.className="managed-banner-slide";
 if(item.image_url){try{const url=new URL(item.image_url);if(url.protocol==="https:"){const img=document.createElement("img");img.src=url.href;img.alt="";img.className="managed-banner-photo";section.append(img)}}catch{}}
 const inner=document.createElement("div");inner.className="managed-banner-copy";
 const eyebrow=document.createElement("span");eyebrow.className="managed-banner-eyebrow";eyebrow.textContent="✦ PRÓXIMO EVENTO · DOE AMOR";
 const h=document.createElement("h2");h.textContent=item.title;
 const p=document.createElement("p");p.textContent=item.subtitle||"Sua contribuição transforma vidas.";
 inner.append(eyebrow,h,p);
 if(item.event_date){const date=document.createElement("strong");date.className="managed-banner-date";date.textContent="📅 "+new Date(item.event_date+"T12:00:00").toLocaleDateString("pt-BR",{day:"2-digit",month:"long",year:"numeric"});inner.append(date)}
 const a=document.createElement("a");a.className="managed-banner-action";a.textContent=item.button_label||"Contribuir agora ↗";const target=item.button_url||"#doar";if(target.startsWith("#")||target.startsWith("/")&&!target.startsWith("//")||target.startsWith("https://"))a.href=target;else a.href="#doar";inner.append(a);section.append(inner);root.append(section);return section
 });
 let current=0;function show(n){current=(n+slides.length)%slides.length;slides.forEach((el,i)=>{el.hidden=i!==current;el.setAttribute("aria-hidden",String(i!==current))})}
 show(0);
 if(slides.length>1){const controls=document.createElement("div");controls.className="managed-banner-controls";for(const [label,step] of [["Anterior",-1],["Próximo",1]]){const b=document.createElement("button");b.type="button";b.textContent=step<0?"‹":"›";b.setAttribute("aria-label",label+" banner");b.addEventListener("click",()=>show(current+step));controls.append(b)}root.append(controls);if(!matchMedia("(prefers-reduced-motion: reduce)").matches){let timer=setInterval(()=>show(current+1),7000);root.addEventListener("mouseenter",()=>clearInterval(timer));root.addEventListener("mouseleave",()=>{clearInterval(timer);timer=setInterval(()=>show(current+1),7000)})}}
 }).catch(()=>{root.remove()});
})();