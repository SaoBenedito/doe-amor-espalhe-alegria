"use strict";
window.renderProductCatalogAdmin=async function(client,area,status){
 area.replaceChildren();
 const heading=document.createElement("h2");heading.textContent="Lista pública de produtos solidários";area.append(heading);
 const help=document.createElement("p");help.textContent="Cadastre os itens que a comunidade pode comprar diretamente na Shopee, no Mercado Livre ou em outra loja. Só publique links https confiáveis. Ponto de entrega: Rua Amando de Oliveira Rocha Filho, nº 519, bairro Lavínia, Marília/SP. A quantidade recebida só é atualizada quando a equipe confirma manualmente a entrega como Recebido e conferido.";area.append(help);
 const form=document.createElement("form");form.className="admin-record-form";form.style.maxWidth="820px";
 const fields=[
  ["title","Nome do produto","text",true,"Ex.: Pacote de fraldas tamanho G"],
  ["description","Descrição e detalhes","textarea",false,"Por que precisamos deste item?"],
  ["image_url","Link da imagem (opcional)","url",false,"https://..."],
  ["store_url","Link direto para o produto na loja","url",true,"https://..."],
  ["store_name","Loja","select",true,""],
  ["campaign_name","Campanha (opcional)","text",false,"Ex.: Natal Solidário 2026"],
  ["target_quantity","Quantidade desejada (deixe vazio para não ter limite)","number",false,"Ex.: 10"],
  ["unit","Unidade","text",true,"unidade"],
  ["published","Publicar no site","checkbox",false,""]
 ];
 const controls={};
 for(const [name,label,type,required,placeholder] of fields){
  const wrap=document.createElement("label");wrap.textContent=label;wrap.style.display="block";wrap.style.margin="10px 0";
  let input;
  if(type==="textarea"){input=document.createElement("textarea");input.rows=3;input.maxLength=2000}
  else if(type==="select"){input=document.createElement("select");for(const [v,t] of [["Shopee","Shopee"],["Mercado Livre","Mercado Livre"],["Outra loja","Outra loja"]]){const o=document.createElement("option");o.value=v;o.textContent=t;input.append(o)}}
  else{input=document.createElement("input");input.type=type;if(type==="number"){input.min="1";input.step="1";input.value=""}if(type==="checkbox")input.style.width="auto"}
  input.name=name;input.required=required;if(placeholder&&type!=="checkbox"&&type!=="select")input.placeholder=placeholder;input.style.maxWidth="100%";if(type!=="checkbox"){input.style.display="block";input.style.width="100%";input.style.boxSizing="border-box";input.style.marginTop="5px";input.style.padding="10px"}wrap.append(input);form.append(wrap);controls[name]=input;
 }
 const photo=document.createElement("input");photo.type="file";photo.accept="image/jpeg,image/png,image/webp";const photoLabel=document.createElement("label");photoLabel.textContent="Enviar foto do produto (JPG, PNG ou WebP, até 5 MB)";photoLabel.append(photo);form.append(photoLabel);
 const preview=document.createElement("img");preview.alt="Prévia da foto";preview.style.cssText="display:none;max-width:220px;max-height:180px;object-fit:contain";form.append(preview);
 photo.onchange=()=>{const file=photo.files[0];if(!file)return;preview.src=URL.createObjectURL(file);preview.style.display="block";};
 const actions=document.createElement("div");actions.style.display="flex";actions.style.gap="10px";actions.style.flexWrap="wrap";
 const save=document.createElement("button");save.type="submit";save.textContent="Salvar produto";
 const cancel=document.createElement("button");cancel.type="button";cancel.textContent="Cancelar edição";cancel.hidden=true;cancel.style.background="#64748b";actions.append(save,cancel);form.append(actions);area.append(form);
 const msg=document.createElement("p");msg.setAttribute("role","status");msg.setAttribute("aria-live","polite");area.append(msg);
 const list=document.createElement("div");area.append(list);
 let editing=null;
 function clear(){editing=null;form.reset();photo.value="";preview.style.display="none";controls.target_quantity.value="";controls.unit.value="unidade";save.textContent="Cadastrar produto";cancel.hidden=true}
 cancel.onclick=clear;
 const safeUrl=(v,required=false)=>{if(!v&&!required)return null;let u;try{u=new URL(v)}catch{throw Error("Confira os links informados.")}if(u.protocol!=="https:")throw Error("Use links seguros começando com https://.");return u.href};
 async function load(){
  list.replaceChildren();const subhead=document.createElement("h3");subhead.textContent="Produtos cadastrados";list.append(subhead);
  const {data,error}=await client.from("product_donation_products").select("*").order("created_at",{ascending:false}).limit(200);
  if(error){msg.textContent="Não foi possível carregar os produtos: "+error.message;return}
  if(!data.length){const p=document.createElement("p");p.textContent="Nenhum produto cadastrado ainda.";list.append(p)}
  for(const item of data){
   const card=document.createElement("article");card.className="admin-record-card";
   const title=document.createElement("h3");title.textContent=item.title;card.append(title);
   const info=document.createElement("p");info.textContent=(item.store_name||"Loja")+" · "+Number(item.received_quantity||0)+" de "+(item.target_quantity===null?"meta aberta":item.target_quantity)+" "+(item.unit||"unidade")+" recebidos · "+(item.published?"Publicado":"Rascunho");card.append(info);
   if(item.campaign_name){const p=document.createElement("p");p.textContent="Campanha: "+item.campaign_name;card.append(p)}
   const link=document.createElement("a");link.href=item.store_url;link.target="_blank";link.rel="noopener noreferrer";link.textContent="Abrir produto na loja ↗";card.append(link);
   const edit=document.createElement("button");edit.type="button";edit.textContent="Editar";edit.onclick=()=>{editing=item.id;for(const name of Object.keys(controls)){if(name==="published")controls[name].checked=!!item[name];else controls[name].value=item[name]??(name==="target_quantity"?"":name==="unit"?"unidade":"")}save.textContent="Salvar alterações";cancel.hidden=false;form.scrollIntoView({behavior:"smooth",block:"start"})};card.append(edit);
   const toggle=document.createElement("button");toggle.type="button";toggle.textContent=item.published?"Tirar do site":"Publicar";toggle.onclick=async()=>{toggle.disabled=true;const {error}=await client.from("product_donation_products").update({published:!item.published,updated_at:new Date().toISOString()}).eq("id",item.id);toggle.disabled=false;if(error){status("Não foi possível alterar a publicação: "+error.message);return}status(item.published?"Produto retirado do site.":"Produto publicado no site.");await load()};card.append(toggle);
   list.append(card);
  }
 }
 form.onsubmit=async e=>{
  e.preventDefault();let payload;
  try{
   payload={title:controls.title.value.trim(),description:controls.description.value.trim(),image_url:safeUrl(controls.image_url.value.trim()),store_url:safeUrl(controls.store_url.value.trim(),true),store_name:controls.store_name.value,campaign_name:controls.campaign_name.value.trim()||null,target_quantity:controls.target_quantity.value.trim()===""?null:Number(controls.target_quantity.value),unit:controls.unit.value.trim()||"unidade",published:controls.published.checked,updated_at:new Date().toISOString()};
   if(payload.title.length<3)throw Error("O nome do produto precisa ter pelo menos 3 caracteres.");
   if(payload.target_quantity!==null&&(!Number.isInteger(payload.target_quantity)||payload.target_quantity<1))throw Error("Informe uma quantidade desejada válida.");
  }catch(err){msg.textContent=err.message;return}
  save.disabled=true;msg.textContent="Salvando produto...";
  if(photo.files[0]){const file=photo.files[0];if(!["image/jpeg","image/png","image/webp"].includes(file.type)||file.size>5242880){save.disabled=false;msg.textContent="Use uma imagem JPG, PNG ou WebP de até 5 MB.";return}const ext=file.type==="image/png"?"png":file.type==="image/webp"?"webp":"jpg";const path="eventos/produtos-solidarios/"+crypto.randomUUID()+"."+ext;const uploaded=await client.storage.from("site-publico").upload(path,file,{contentType:file.type});if(uploaded.error){save.disabled=false;msg.textContent="Falha no envio da foto: "+uploaded.error.message;return}payload.image_url=client.storage.from("site-publico").getPublicUrl(path).data.publicUrl;}
  const query=editing?client.from("product_donation_products").update(payload).eq("id",editing):client.from("product_donation_products").insert(payload);
  const {error}=await query;save.disabled=false;
  if(error){msg.textContent="Erro ao salvar: "+error.message;return}
  msg.textContent=editing?"Produto atualizado.":"Produto cadastrado.";clear();await load();
 };
 await load();
 const divider=document.createElement("hr");divider.style.margin="36px 0";area.append(divider);
 const reportsTitle=document.createElement("h2");reportsTitle.textContent="Avisos de compra enviados pela comunidade";area.append(reportsTitle);
 const reportsHelp=document.createElement("p");reportsHelp.textContent="O aviso de compra não comprova a entrega. Confirme como Recebido e conferido somente depois que a equipe receber fisicamente e conferir o produto no ponto de entrega da Rua Amando de Oliveira Rocha Filho, nº 519, bairro Lavínia, Marília/SP.";area.append(reportsHelp);
 const reports=document.createElement("div");area.append(reports);
 async function loadReports(){
  reports.replaceChildren();const {data,error}=await client.from("product_donation_purchase_reports").select("id,product_id,donor_name,contact,quantity,order_reference,notes,status,created_at,product_donation_products(title,unit)").order("created_at",{ascending:false}).limit(200);
  if(error){const p=document.createElement("p");p.textContent="Não foi possível consultar os avisos: "+error.message;reports.append(p);return}
  if(!data.length){reports.textContent="Nenhum aviso de compra recebido ainda.";return}
  const labels={reported:"Aviso recebido",awaiting_delivery:"Aguardando entrega",received:"Recebido e conferido",rejected:"Não confirmado"};
  for(const report of data){
   const card=document.createElement("article");card.className="admin-record-card";
   const h=document.createElement("h3");h.textContent=report.product_donation_products?.title||"Produto";card.append(h);
   for(const [label,value] of [["Nome",report.donor_name],["Quantidade",report.quantity+" "+(report.product_donation_products?.unit||"unidade(s)")],["Contato",report.contact],["Pedido",report.order_reference],["Observações",report.notes],["Enviado em",new Date(report.created_at).toLocaleString("pt-BR")]]){if(!value)continue;const p=document.createElement("p");p.textContent=label+": "+value;card.append(p)}
   const label=document.createElement("label");label.textContent="Situação do aviso: ";const select=document.createElement("select");
   for(const [v,t] of Object.entries(labels)){const opt=document.createElement("option");opt.value=v;opt.textContent=t;opt.selected=report.status===v;select.append(opt)}
   select.onchange=async()=>{select.disabled=true;const {error}=await client.from("product_donation_purchase_reports").update({status:select.value,reviewed_at:new Date().toISOString()}).eq("id",report.id);select.disabled=false;if(error){status("Não foi possível atualizar o aviso: "+error.message);return}status("Situação atualizada. A quantidade recebida é recalculada automaticamente.");await loadReports();await load()};
   label.append(select);card.append(label);reports.append(card);
  }
 }
 await loadReports();
};