"use strict";
(()=> {
 const API="https://xtwydlgoqmqhbpbojwmp.supabase.co";
 const KEY="sb_publishable_E1nafD2jTZRz3Nhx2oTtiQ_SSpW5t-4";
 const grid=document.getElementById("productDonationGrid");
 if(!grid)return;
 const el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n};
 const validUrl=value=>{try{const u=new URL(value);return u.protocol==="https:"?u.href:null}catch{return null}};
 const dialog=document.createElement("dialog");dialog.id="productPurchaseDialog";dialog.className="product-purchase-dialog";
 dialog.innerHTML='<form id="productPurchaseForm" class="product-purchase-form"><button type="button" class="product-purchase-close" aria-label="Fechar">×</button><span class="product-catalog-kicker">CORRENTE DO BEM</span><h2>Avise que você comprou 💗</h2><p>Informe sua compra para que nossa equipe acompanhe a chegada do produto. A doação só será concluída após a conferência presencial.</p><div class="product-dialog-delivery"><span class="product-delivery-eyebrow">LOCAL DE ENTREGA</span><strong>Rua Amando de Oliveira Rocha Filho, 519</strong><span>Jardim Lavínia · Marília/SP</span><small>Informe este endereço ao finalizar sua compra na loja.</small></div><input type="hidden" name="product_id"><label>Seu nome *<input name="donor_name" maxlength="120" required autocomplete="name"></label><label>Quantidade comprada *<input name="quantity" type="number" min="1" max="1000" value="1" required></label><label>WhatsApp ou e-mail (opcional)<input name="contact" maxlength="180"></label><label>Número do pedido (opcional)<input name="order_reference" maxlength="120"></label><label>Observação (opcional)<textarea name="notes" rows="2" maxlength="1000"></textarea></label><p class="product-purchase-message" role="status" aria-live="polite"></p><button class="product-purchase-submit" type="submit">Enviar aviso de compra</button></form>';
 document.body.append(dialog);
 const form=dialog.querySelector("form"),message=dialog.querySelector(".product-purchase-message");
 dialog.querySelector(".product-purchase-close").onclick=()=>dialog.close();
 dialog.addEventListener("click",e=>{if(e.target===dialog)dialog.close()});
 function openReport(product){form.reset();form.elements.product_id.value=product.id;message.textContent="";const submit=form.querySelector('[type="submit"]');submit.disabled=false;submit.textContent="Enviar aviso de compra";dialog.showModal()}
 function render(products){
  grid.replaceChildren();
  if(!document.querySelector(".product-delivery-panel")){const panel=el("aside","product-delivery-panel");const symbol=el("div","product-delivery-symbol","⌖");const content=el("div","product-delivery-content");content.append(el("span","product-delivery-eyebrow","PONTO OFICIAL DE RECEBIMENTO"),el("h3","","Envie sua doação diretamente para nós"),el("p","","Rua Amando de Oliveira Rocha Filho, 519"),el("p","product-delivery-city","Bairro Lavínia · Marília/SP"));const note=el("div","product-delivery-note","Recebimento confirmado manualmente pela nossa equipe após a entrega.");content.append(note);const guidance=el("p","product-delivery-guidance","Precisa informar uma doação ou tirar dúvidas sobre a entrega? Clique em “Fale com Joice ou Tainara” para conversar com nossa equipe pelo WhatsApp.");content.append(guidance);const actions=el("div","product-delivery-tools");const copy=el("button","product-delivery-copy","Copiar endereço");copy.type="button";copy.onclick=async()=>{try{await navigator.clipboard.writeText("Rua Amando de Oliveira Rocha Filho, 519, Bairro Lavínia, Marília - SP");copy.textContent="Endereço copiado ✓"}catch{copy.textContent="Selecione o endereço acima para copiar"}};const map=el("a","product-delivery-map","Ver no mapa ↗");map.href="https://www.google.com/maps/@-22.1845559,-49.9536983,623a,75y,262.74h,76.43t/data=!3m7!1e1!3m5!1s7XumHfUgplkJFR94bzkSNQ!2e0!6shttps:%2F%2Fstreetviewpixels-pa.clients6.google.com%2Fv1%2Fthumbnail%3Fcb_client%3Dmaps_sv.tactile%26w%3D900%26h%3D600%26pitch%3D13.569999999999993%26panoid%3D7XumHfUgplkJFR94bzkSNQ%26yaw%3D262.74!7i16384!8i8192?entry=ttu";map.target="_blank";map.rel="noopener noreferrer";const contact=el("a","product-delivery-contact","Fale com Joice ou Tainara ↗");contact.href="https://wa.me/5514988388177?text="+encodeURIComponent("Olá! Gostaria de dar ou pedir informações sobre minha doação de produtos para o Doe Amor, Espalhe Alegria.");contact.target="_blank";contact.rel="noopener noreferrer";actions.append(copy,map,contact);panel.append(symbol,content,actions);grid.before(panel);}
  if(!products.length){grid.append(el("p","product-catalog-empty","No momento não há produtos publicados. Volte em breve para ver como ajudar."));return}
  for(const p of products){
   const card=el("article","product-donation-card");
   const imageUrl=validUrl(p.image_url||"");
   if(imageUrl){const image=el("img","product-donation-image");image.src=imageUrl;image.alt=p.title;image.loading="lazy";image.decoding="async";image.onerror=()=>image.remove();card.append(image)}
   const body=el("div","product-donation-content");
   body.append(el("span","product-catalog-kicker",p.campaign_name||"PRECISAMOS DA SUA AJUDA"),el("h3","",p.title));
   if(p.description){const details=el("details","product-description-details");const summary=el("summary","product-description-summary","Sobre este produto");const description=el("p","product-description-text",p.description);details.append(summary,description);body.append(details)}
   const unlimited=p.target_quantity===null;const target=unlimited?null:Math.max(1,Number(p.target_quantity)||1),received=Math.max(0,Number(p.received_quantity)||0),pct=unlimited?0:Math.min(100,Math.round(received/target*100));
   const progress=el("div","product-quantity");
   const label=el("div","product-quantity-label",unlimited?received+" "+(p.unit||"unidade")+(received===1?"":"s")+" recebidos · Meta aberta":received+" de "+target+" "+(p.unit||"unidade")+(target===1?"":"s")+" recebidos");
   const track=el("div","product-quantity-track");track.hidden=unlimited;track.setAttribute("role","progressbar");track.setAttribute("aria-valuemin","0");track.setAttribute("aria-valuemax",String(target));track.setAttribute("aria-valuenow",String(received));const fill=el("span","");fill.style.width=pct+"%";track.append(fill);progress.append(label,track);body.append(progress);
   const actions=el("div","product-donation-actions");
   const storeUrl=validUrl(p.store_url);
   if(storeUrl){const buy=el("a","product-buy-link","Doar esse item ↗");buy.href=storeUrl;buy.target="_blank";buy.rel="noopener noreferrer";actions.append(buy)}
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