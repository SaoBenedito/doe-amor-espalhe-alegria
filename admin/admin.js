"use strict";
const client=window.supabase.createClient("https://xtwydlgoqmqhbpbojwmp.supabase.co","sb_publishable_E1nafD2jTZRz3Nhx2oTtiQ_SSpW5t-4");
const $=id=>document.getElementById(id);
const modules=[["Eventos","events"],["Doações","donations"],["Parceiros","partners"],["Tarefas","tasks"],["Financeiro","financial_entries"],["Conteúdo","site_content"],["Mídia","media_assets"]];
let currentRole=null;
function status(message){$("status").textContent=message;}
function showLogin(){currentRole=null;$("dashboard").hidden=true;$("login").hidden=false;$("logout").hidden=true;}
async function refresh(){
 const {data:{user},error}=await client.auth.getUser();
 if(error||!user){showLogin();return;}
 const {data:member,error:roleError}=await client.from("admin_members").select("role,active").eq("user_id",user.id).maybeSingle();
 if(roleError||!member?.active){await client.auth.signOut();showLogin();status("Esta conta ainda não possui autorização administrativa.");return;}
 currentRole=member.role;$("login").hidden=true;$("dashboard").hidden=false;$("logout").hidden=false;
 $("role").textContent="Perfil autorizado: "+currentRole;
 const nav=$("modules");nav.replaceChildren();
 for(const [label,table] of modules){
  if(table==="financial_entries"&&!["owner","admin","manager"].includes(currentRole))continue;
  const button=document.createElement("button");button.textContent=label;button.onclick=()=>loadTable(label,table);nav.append(button);
 }
 status("Acesso autenticado.");}
async function loadTable(label,table){
 if(!currentRole)return;
 const area=$("content");area.replaceChildren();
 const heading=document.createElement("h2");heading.textContent=label;area.append(heading);
 const {data,error}=await client.from(table).select("*").limit(50);
 if(error){status("Não foi possível carregar "+label+": "+error.message);return;}
 if(!data.length){const p=document.createElement("p");p.textContent="Nenhum registro cadastrado.";area.append(p);return;}
 const pre=document.createElement("pre");pre.textContent=JSON.stringify(data,null,2);area.append(pre);
}
$("loginForm").addEventListener("submit",async event=>{
 event.preventDefault();status("Validando acesso...");
 const {error}=await client.auth.signInWithPassword({email:$("email").value,password:$("password").value});
 if(error){status("Não foi possível entrar: "+error.message);return;}
 $("password").value="";await refresh();
});
$("logout").onclick=async()=>{await client.auth.signOut();showLogin();status("Sessão encerrada.");};
refresh().catch(()=>{showLogin();status("Não foi possível verificar o acesso.");});