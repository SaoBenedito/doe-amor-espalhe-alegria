"use strict";
(()=>{const form=document.getElementById("volunteerForm");if(!form)return;
const status=document.getElementById("volunteerStatus");
const api="https://xtwydlgoqmqhbpbojwmp.supabase.co/rest/v1/volunteer_applications";
const key="sb_publishable_E1nafD2jTZRz3Nhx2oTtiQ_SSpW5t-4";
const group="https://chat.whatsapp.com/CNIBVkyebDb5Xl3us3U0a2";
form.addEventListener("submit",async event=>{event.preventDefault();if(!form.reportValidity())return;
const btn=form.querySelector('button[type="submit"]');const f=new FormData(form);
const whatsapp=String(f.get("whatsapp")||"").replace(/\D/g,"");
if(!/^[0-9]{10,13}$/.test(whatsapp)){status.textContent="Informe um WhatsApp válido com DDD.";return}
const payload={full_name:String(f.get("full_name")||"").trim(),whatsapp,email:String(f.get("email")||"").trim()||null,city:String(f.get("city")||"").trim(),availability:String(f.get("availability")||""),message:String(f.get("message")||"").trim()||null,privacy_consent:f.get("privacy_consent")==="on"};
if(!payload.privacy_consent){status.textContent="É necessário autorizar o uso dos dados para concluir o cadastro.";return}
btn.disabled=true;status.textContent="Salvando seu cadastro...";
try{const response=await fetch(api,{method:"POST",headers:{"apikey":key,"Authorization":"Bearer "+key,"Content-Type":"application/json","Prefer":"return=minimal"},body:JSON.stringify(payload)});
if(!response.ok)throw new Error("Cadastro não confirmado ("+response.status+").");
status.textContent="Cadastro salvo! Abrindo o grupo de voluntários no WhatsApp...";
form.reset();window.location.assign(group);
}catch(error){status.textContent="Não foi possível salvar seu cadastro. Confira os dados e tente novamente. Você não foi redirecionado.";console.error("Cadastro de voluntário",error)}
finally{btn.disabled=false}
});
})();