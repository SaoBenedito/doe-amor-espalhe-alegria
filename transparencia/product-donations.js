"use strict";
(()=>{
 const grid=document.getElementById("transparentProductGrid");
 const count=document.getElementById("transparentProductCount");
 const received=document.getElementById("transparentProductReceived");
 if(!grid||!count||!received)return;
 const API="https://xtwydlgoqmqhbpbojwmp.supabase.co";
 const KEY="sb_publishable_E1nafD2jTZRz3Nhx2oTtiQ_SSpW5t-4";
 const make=(tag,cls,text)=>{const el=document.createElement(tag);if(cls)el.className=cls;if(text!==undefined)el.textContent=text;return el};
 const num=v=>Number(v||0).toLocaleString("pt-BR");
 async function load(){
  try{
   const url=API+"/rest/v1/product_donation_products?select=title,image_url,campaign_name,target_quantity,received_quantity,unit,store_name&published=eq.true&order=created_at.desc";
   const response=await fetch(url,{headers:{apikey:KEY,Accept:"application/json"},cache:"no-store"});
   if(!response.ok)throw Error("Não foi possível consultar os produtos");
   const products=await response.json();
   count.textContent=num(products.length);
   const total=products.reduce((sum,p)=>sum+Math.max(0,Number(p.received_quantity)||0),0);
   received.textContent=num(total);
   grid.replaceChildren();
   if(!products.length){grid.append(make("p","transparent-product-empty","Nenhum produto da lista solidária está publicado no momento."));return}
   for(const item of products){
    const card=make("article","transparent-product-card");
    const visual=make("div","transparent-product-visual");
    if(item.image_url&&/^https:\/\//i.test(item.image_url)){
     const img=make("img");img.src=item.image_url;img.alt="Imagem de "+item.title;img.loading="lazy";img.decoding="async";
     img.onerror=()=>visual.replaceChildren(make("span","transparent-product-placeholder","🎁"));
     visual.append(img);
    }else visual.append(make("span","transparent-product-placeholder","🎁"));
    const body=make("div","transparent-product-body");
    const tag=make("span","transparent-product-tag",item.campaign_name||"Campanha solidária");
    const title=make("h3","",item.title);
    const qty=make("div","transparent-product-qty");
    const amount=make("strong","",num(item.received_quantity)+" "+(item.unit||"unidade(s)"));
    const note=make("span","","recebidas e conferidas");
    qty.append(amount,note);
    body.append(tag,title,qty);
    if(item.target_quantity!==null&&Number(item.target_quantity)>0){
     const target=Math.max(1,Number(item.target_quantity));
     const bar=make("div","transparent-product-progress");bar.setAttribute("role","progressbar");
     bar.setAttribute("aria-label","Progresso de "+item.title);
     bar.setAttribute("aria-valuemin","0");bar.setAttribute("aria-valuemax",String(target));
     bar.setAttribute("aria-valuenow",String(Math.min(target,Math.max(0,Number(item.received_quantity)||0))));
     const fill=make("div","transparent-product-progress-fill");fill.style.width=Math.min(100,Math.max(0,Number(item.received_quantity)||0)/target*100)+"%";
     bar.append(fill);
     body.append(bar,make("p","transparent-product-goal","Meta: "+num(target)+" "+(item.unit||"unidade(s)")));
    }else body.append(make("p","transparent-product-goal","Meta aberta · sem limite definido"));
    card.append(visual,body);grid.append(card);
   }
  }catch{
   count.textContent="—";received.textContent="—";
   grid.replaceChildren(make("p","transparent-product-empty","Não foi possível atualizar os produtos agora. Tente novamente mais tarde."));
  }
 }
 load();
})();
