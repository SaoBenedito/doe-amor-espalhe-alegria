"use strict";
(()=> {
 const API="https://xtwydlgoqmqhbpbojwmp.supabase.co";
 const KEY="sb_publishable_E1nafD2jTZRz3Nhx2oTtiQ_SSpW5t-4";
 const grid=document.getElementById("productDonationGrid");
 if(!grid)return;
 const el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n};
 const validUrl=value=>{try{const u=new URL(value);return u.protocol==="https:"?u.href:null}catch{return null}};
 const dialog=document.createElement("dialog");dialog.id="productPurchaseDialog";dialog.className="product-purchase-dialog";
 dialog.innerHTML='<form id="productPurchaseForm" class="product-purchase-form"><button type="button" class="product-purchase-close" aria-label="Fechar">×</button><span class="product-catalog-kicker">CORRENTE DO BEM</span><h2>Avise que você comprou 💗</h2><p>Depois de comprar na loja, conte para nossa equipe. O item só será contabilizado como recebido após a conferência.</p><input type="hidden" name="product_id"><label>Seu nome *<input name="donor_name" maxlength="120" required autocomplete="name"></label><label>Quantidade comprada *<input name="quantity" type="number" min="1" max="1000" value="1" required></label><label>WhatsApp ou e-mail (opcional)<input name="contact" maxlength="180"></label><label>Número do pedido (opcional)<input name="order_reference" maxlength="120"></label><label>Observação (opcional)<textarea name="notes" rows="2" maxlength="1000"></textarea></label><p class="product-purchase-message" role="status" aria-live="polite"></p><button class="product-purchase-submit" type="submit">Enviar aviso de compra</button></form>';
 document.body.append(dialog);
 const form=dialog.querySelector("form"),message=dialog.querySelector(".product-purchase-message");
 dialog.querySelector(".product-purchase-close").onclick=()=>dialog.close();
 dialog.addEventListener("click",e=>{if(e.target===dialog)dialog.close()});
 function openReport(product){form.reset();form.elements.product_id.value=product.id;message.textContent="";dialog.showModal()}
 function render(products){
  grid.replaceChildren();
  if(!products.length){grid.append(el("p","product-catalog-empty","No momento não há produtos publicados. Volte em breve para ver como ajudar."));return}
  for(const p of products){
   const card=el("article","product-donation-card");
   const imageUrl=validUrl(p.image_url||"");
   if(imageUrl){const image=el("img","product-donation-image");image.src=imageUrl;image.alt=p.title;image.loading="lazy";image.onerror=()=>image.remove();card.append(image)}
   const body=el("div","product-donation-content");
   body.append(el("span","product-catalog-kicker",p.campaign_name||"PRECISAMOS DA SUA AJUDA"),el("h3","",p.title));
   if(p.description)body.append(el("p","",p.description));
   const target=Math.max(1,Number(p.target_quantity)||1),received=Math.min(target,Math.max(0,Number(p.received_quantity)||0)),pct=Math.round(received/target*100);
   const progress=el("div","product-quantity");
   const label=el("div","product-quantity-label",received+" de "+target+" "+(p.unit||"unidade")+(target===1?"":"s")+" recebidos");
   const track=el("div","product-quantity-track");track.setAttribute("role","progressbar");track.setAttribute("aria-valuemin","0");track.setAttribute("aria-valuemax",String(target));track.setAttribute("aria-valuenow",String(received));const fill=el("span","");fill.style.width=pct+"%";track.append(fill);progress.append(label,track);body.append(progress);
   const actions=el("div","product-donation-actions");
   const storeUrl=validUrl(p.store_url);
   if(storeUrl){const buy=el("a","product-buy-link","Ver na "+(p.store_name||"loja")+" ↗");buy.href=storeUrl;buy.target="_blank";buy.rel="noopener noreferrer";actions.append(buy)}
   const report=el("button","product-report-link","Já comprei este item");report.type="button";report.onclick=()=>openReport(p);actions.append(report);body.append(actions);card.append(body);grid.append(card);
  }
 }
 form.addEventListener("submit",async e=>{
  e.preventDefault();if(!form.reportValidity())return;
  const data=new FormData(form),payload={product_id:String(data.get("product_id")),donor_name:String(data.get("donor_name")||"").trim(),quantity:Number(data.get("quantity")||1),contact:String(data.get("contact")||"").trim()||null,order_reference:String(data.get("order_reference")||"").trim()||null,notes:String(data.get("notes")||"").trim()||null,status:"reported"};
  const btn=form.querySelector('[type="submit"]');btn.disabled=true;message.textContent="Enviando...";
  try{const res=await fetch(API+"/rest/v1/product_donation_purchase_reports",{method:"POST",headers:{apikey:KEY,"Content-Type":"application/json",Prefer:"return=minimal"},body:JSON.stringify(payload)});if(!res.ok)throw new Error("Não foi possível enviar agora. Tente novamente mais tarde.");form.reset();message.textContent="Aviso enviado! Obrigado por ajudar. Nossa equipe confirmará o recebimento quando o produto chegar.";btn.textContent="Aviso enviado 💗"}
  catch(err){message.textContent=err.message;btn.disabled=false}
 });
 (async()=>{try{const res=await fetch(API+"/rest/v1/product_donation_products?select=id,title,description,image_url,store_url,store_name,campaign_name,target_quantity,received_quantity,unit&published=eq.true&order=created_at.desc",{headers:{apikey:KEY}});if(!res.ok)throw Error("Falha ao carregar");render(await res.json())}catch(err){grid.replaceChildren(el("p","product-catalog-empty","Não foi possível carregar a lista de produtos agora. Tente atualizar a página."));console.error(err)}})();
})();