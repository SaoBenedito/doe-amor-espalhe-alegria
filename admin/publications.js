"use strict";
window.renderPublications=async function(client,area,status){
 const el=(tag,props={},parent)=>{const n=document.createElement(tag);for(const [k,v] of Object.entries(props)){if(k==="text")n.textContent=v;else if(k==="className")n.className=v;else n.setAttribute(k,v)}if(parent)parent.append(n);return n};
 el("h2",{text:"Publicações de eventos"},area);el("p",{text:"Cadastre eventos passados, atuais e futuros. Somente publicações marcadas como públicas aparecem no site."},area);
 const layout=el("div",{className:"publication-layout"},area),form=el("form",{className:"publication-form"},layout),list=el("div",{className:"publication-list"},layout);
 const fields=[["title","Título do evento","text",true],["event_date","Data do evento","date"],["phase","Fase","select"],["location","Local","text"],["summary","Resumo para o público","textarea"],["details","Descrição completa","textarea"],["cover_url","URL da imagem de capa (preenchida automaticamente)","url"],["photos","URLs das fotos (uma por linha)","textarea"],["videos","URLs dos vídeos (uma por linha)","textarea"]];
 const inputs={};let editing=null;
 const uploadArea=el("section",{className:"publication-upload"},form);
 el("h3",{text:"Enviar fotos e vídeos ao Supabase"},uploadArea);
 el("p",{text:"Escolha arquivos do seu computador (até 50 MB por arquivo). Fotos e vídeos ficam no Storage e os links entram automaticamente no evento."},uploadArea);
 const filePicker=el("input",{type:"file",accept:"image/jpeg,image/png,image/webp,image/avif,video/mp4,video/webm",multiple:""},uploadArea);
 const uploadBtn=el("button",{type:"button",text:"Enviar mídias"},uploadArea);
 const uploadStatus=el("p",{role:"status"},uploadArea);
 uploadBtn.onclick=async()=>{
   const files=[...filePicker.files];if(!files.length){uploadStatus.textContent="Selecione pelo menos um arquivo.";return}
   uploadBtn.disabled=true;let done=0;
   for(const file of files){
     const image=file.type.startsWith("image/"),video=file.type.startsWith("video/");
     if(!image&&!video){uploadStatus.textContent="Formato não permitido: "+file.name;continue}
     if(file.size>50*1024*1024){uploadStatus.textContent="Arquivo acima de 50 MB: "+file.name+". Para vídeos maiores será necessário envio em partes.";continue}
     const ext=(file.name.split(".").pop()||"").toLowerCase();
     const safeExt=["jpg","jpeg","png","webp","avif","mp4","webm"].includes(ext)?ext:"bin";
     const path="eventos/"+crypto.randomUUID()+"."+safeExt;
     uploadStatus.textContent="Enviando "+file.name+"...";
     const {error}=await client.storage.from("site-publico").upload(path,file,{contentType:file.type,upsert:false});
     if(error){uploadStatus.textContent="Falha em "+file.name+": "+error.message;continue}
     const {data}=client.storage.from("site-publico").getPublicUrl(path);
     const field=image?"photos":"videos";
     inputs[field].value+=(inputs[field].value.trim()?"\\n":"")+data.publicUrl;
     if(image&&!inputs.cover_url.value)inputs.cover_url.value=data.publicUrl;
     done++;
   }
   uploadBtn.disabled=false;filePicker.value="";
   if(done===files.length)uploadStatus.textContent=done+" arquivo(s) enviado(s). Clique em Salvar publicação para concluir.";
   else uploadStatus.textContent+=" ("+done+" de "+files.length+" enviados)";
 };
 el("h3",{text:"Criar ou editar publicação"},form);
 for(const [key,label,type,required] of fields){const wrap=el("label",{text:label},form);let input;if(type==="textarea")input=el("textarea",{rows:"3"},wrap);else if(type==="select"){input=el("select",{},wrap);for(const [value,title] of [["past","Já realizado"],["current","Em andamento"],["future","Futuro"]])el("option",{value,text:title},input)}else input=el("input",{type},wrap);input.name=key;if(required)input.required=true;inputs[key]=input}
 const publishedLabel=el("label",{className:"checkline"},form),published=el("input",{type:"checkbox"},publishedLabel);el("span",{text:"Publicar no site (visível para todos)"},publishedLabel);
 const buttons=el("div",{},form),save=el("button",{type:"submit",text:"Salvar publicação"},buttons),clear=el("button",{type:"button",text:"Novo evento"},buttons);
 const message=el("p",{role:"status"},form);
 function reset(){editing=null;form.reset();inputs.location.value="São Benedito";save.textContent="Salvar publicação";message.textContent=""}
 clear.onclick=reset;reset();
 const split=s=>s.split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
 const join=a=>(a||[]).join("\n");
 async function load(){list.replaceChildren();el("h3",{text:"Eventos cadastrados"},list);const {data,error}=await client.from("event_publications").select("*").order("event_date",{ascending:false,nullsFirst:false});if(error){status("Erro ao carregar publicações: "+error.message);return}if(!data.length)el("p",{text:"Nenhum evento cadastrado. Crie a primeira publicação ao lado."},list);
 for(const item of data){const card=el("article",{className:"publication-card"},list);el("strong",{text:item.title},card);el("p",{text:(item.event_date||"Sem data")+" · "+({past:"Realizado",current:"Atual",future:"Futuro"}[item.phase]||item.phase)+" · "+(item.published?"Publicado":"Rascunho")},card);const edit=el("button",{type:"button",text:"Editar"},card);edit.onclick=()=>{editing=item.id;for(const [key] of fields)inputs[key].value=key==="photos"||key==="videos"?join(item[key]):item[key]||"";published.checked=item.published;save.textContent="Atualizar publicação";form.scrollIntoView({behavior:"smooth",block:"start"})};const del=el("button",{type:"button",text:"Excluir"},card);del.onclick=async()=>{if(!confirm("Excluir esta publicação?"))return;const {error}=await client.from("event_publications").delete().eq("id",item.id);if(error)status(error.message);else{reset();await load()}}}
 }
 form.onsubmit=async e=>{e.preventDefault();save.disabled=true;message.textContent="Salvando...";const payload={};for(const [key] of fields)payload[key]=key==="photos"||key==="videos"?split(inputs[key].value):inputs[key].value.trim()||null;payload.summary=payload.summary||"";payload.details=payload.details||"";payload.location=payload.location||"São Benedito";payload.published=published.checked;payload.updated_at=new Date().toISOString();const q=editing?client.from("event_publications").update(payload).eq("id",editing):client.from("event_publications").insert(payload);const {error}=await q;save.disabled=false;if(error){message.textContent="Erro: "+error.message;return}reset();message.textContent="Publicação salva com sucesso.";await load()};
 await load();
};