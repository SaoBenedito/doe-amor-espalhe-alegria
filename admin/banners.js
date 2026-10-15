"use strict";
window.renderEventBanners=async function(client,area,status){
 const el=(tag,parent,text)=>{const node=document.createElement(tag);if(text!==undefined)node.textContent=text;if(parent)parent.append(node);return node};
 el("p",area,"Crie banners para os próximos eventos. Envie uma imagem, configure o botão e escolha se deseja publicar. Os banners ativos aparecem no topo do site.");
 const layout=el("div",area);layout.className="banner-admin-layout";
 const form=el("form",layout);form.className="banner-admin-form";
 const fields={};let editing=null;
 function field(name,label,type="text",required=false){const wrap=el("label",form,label),input=el(type==="textarea"?"textarea":"input",wrap);if(type!=="textarea")input.type=type;input.name=name;input.required=required;fields[name]=input;return input}
 field("title","Título do banner", "text",true).maxLength=120;
 field("subtitle","Mensagem de destaque","textarea");
 const image=field("image_url","Endereço da imagem (opcional)","url");
 const fileLabel=el("label",form,"Enviar imagem do banner (PNG, JPG ou WebP)");
 const file=el("input",fileLabel);file.type="file";file.accept="image/png,image/jpeg,image/webp";
 const upload=el("button",form,"Enviar imagem");upload.type="button";
 const uploadMsg=el("p",form);uploadMsg.setAttribute("role","status");
 upload.onclick=async()=>{const f=file.files[0];if(!f){uploadMsg.textContent="Selecione uma imagem.";return}if(f.size>8*1024*1024){uploadMsg.textContent="Escolha uma imagem de até 8 MB.";return}upload.disabled=true;uploadMsg.textContent="Enviando imagem...";const ext=f.type==="image/png"?"png":f.type==="image/webp"?"webp":f.type==="image/jpeg"?"jpg":null;if(!ext){uploadMsg.textContent="Formato não permitido.";upload.disabled=false;return}const path="banners/"+crypto.randomUUID()+"."+ext;const {error}=await client.storage.from("site-publico").upload(path,f,{contentType:f.type,upsert:false});upload.disabled=false;if(error){uploadMsg.textContent="Erro: "+error.message;return}image.value=client.storage.from("site-publico").getPublicUrl(path).data.publicUrl;uploadMsg.textContent="Imagem enviada! Agora salve o banner.";};
 field("event_date","Data do evento","date");
 field("button_label","Texto do botão").value="💝 Quero contribuir agora";
 field("button_url","Destino do botão (ex.: #doar, /transparencia/ ou https://...)").value="#doar";
 field("sort_order","Prioridade (maior aparece primeiro)","number").value="0";
 const activeLabel=el("label",form,""),active=el("input",activeLabel);active.type="checkbox";active.style.width="auto";active.style.display="inline-block";active.checked=true;activeLabel.append(document.createTextNode(" Publicar banner no site"));
 const save=el("button",form,"Salvar banner");save.type="submit";
 const clear=el("button",form,"Novo banner");clear.type="button";
 const msg=el("p",form);msg.setAttribute("role","status");
 const list=el("div",layout);list.className="banner-admin-list";
 function reset(){editing=null;form.reset();fields.button_label.value="💝 Quero contribuir agora";fields.button_url.value="#doar";fields.sort_order.value="0";active.checked=true;save.textContent="Salvar banner";msg.textContent="";uploadMsg.textContent=""}
 clear.onclick=reset;
 async function load(){list.replaceChildren();el("h3",list,"Banners cadastrados");const {data,error}=await client.from("site_banners").select("*").order("sort_order",{ascending:false});if(error){el("p",list,"Erro ao carregar: "+error.message);return}for(const item of data||[]){const card=el("article",list);card.className="banner-admin-card";if(item.image_url){const img=el("img",card);img.src=item.image_url;img.alt="Prévia do banner";img.loading="lazy"}el("strong",card,item.title);el("p",card,(item.active?"🟢 Publicado":"⚪ Oculto")+(item.event_date?" · "+item.event_date:""));const edit=el("button",card,"Editar");edit.type="button";edit.onclick=()=>{editing=item.id;for(const key of Object.keys(fields))fields[key].value=item[key]??"";active.checked=item.active;save.textContent="Salvar alterações";form.scrollIntoView({behavior:"smooth"})};const remove=el("button",card,"Excluir");remove.type="button";remove.onclick=async()=>{if(!confirm("Excluir este banner?"))return;const {error}=await client.from("site_banners").delete().eq("id",item.id);if(error)status("Erro: "+error.message);else{reset();await load()}}}if(!data?.length)el("p",list,"Nenhum banner cadastrado.")}
 form.onsubmit=async e=>{e.preventDefault();const title=fields.title.value.trim(),subtitle=fields.subtitle.value.trim(),button_url=fields.button_url.value.trim()||"#doar",image_url=fields.image_url.value.trim()||null;if(!title){msg.textContent="Informe o título.";return}if(!/^(#[a-zA-Z][\w-]*|\/(?!\/)[^\s]*|https:\/\/[^\s]+)$/.test(button_url)){msg.textContent="Use um link HTTPS, um caminho interno ou #doar.";return}if(image_url&&!/^https:\/\/[^\s]+$/.test(image_url)){msg.textContent="A imagem precisa ter um link HTTPS.";return}const payload={title,subtitle,image_url,button_label:fields.button_label.value.trim()||"Contribuir agora",button_url,event_date:fields.event_date.value||null,sort_order:Number(fields.sort_order.value)||0,active:active.checked,updated_at:new Date().toISOString()};save.disabled=true;msg.textContent="Salvando...";const {error}=await(editing?client.from("site_banners").update(payload).eq("id",editing):client.from("site_banners").insert(payload));save.disabled=false;if(error){msg.textContent="Erro ao salvar: "+error.message;return}reset();status("Banner salvo! Se estiver publicado, aparecerá no topo do site.");await load()};
 await load();
};