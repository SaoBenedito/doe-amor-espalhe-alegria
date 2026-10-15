"use strict";
const supabaseUrl="https://xtwydlgoqmqhbpbojwmp.supabase.co";
const supabaseKey="sb_publishable_E1nafD2jTZRz3Nhx2oTtiQ_SSpW5t-4";
const keepSignedIn=localStorage.getItem("doe_admin_remember")==="yes";
const client=window.supabase.createClient(supabaseUrl,supabaseKey,{auth:{storage:keepSignedIn?localStorage:sessionStorage,persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
const $=id=>document.getElementById(id);
const modules=[["Voluntários","volunteer_applications"],["Publicações","event_publications"],["Eventos","events"],["Doações","donations"],["Parceiros","partners"],["Tarefas","tasks"],["Financeiro","financial_entries"],["Conteúdo","site_content"],["Mídia","media_assets"]];
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
 if(table==="donations"){await window.renderInfinitepayDonations(client,area,status);return;}
 if(table==="event_publications"){await window.renderPublications(client,area,status);return;}\n if(table==="volunteer_applications"){await window.renderVolunteers(client,area,status);return;}
 const heading=document.createElement("h2");heading.textContent=label;area.append(heading);
 const {data,error}=await client.from(table).select("*").limit(50);
 if(error){status("Não foi possível carregar "+label+": "+error.message);return;}
 if(!data.length){const p=document.createElement("p");p.textContent="Nenhum registro cadastrado.";area.append(p);return;}
 const pre=document.createElement("pre");pre.textContent=JSON.stringify(data,null,2);area.append(pre);
}
$("remember").checked=keepSignedIn;
$("showPassword").addEventListener("change",()=>{$("password").type=$("showPassword").checked?"text":"password";});
$("forgotPassword").addEventListener("click",async()=>{
 const email=$("email").value.trim();
 if(!email){status("Informe seu e-mail acima para receber o link de redefinição.");$("email").focus();return;}
 status("Enviando link de redefinição...");
 const {error}=await client.auth.resetPasswordForEmail(email,{redirectTo:location.origin+"/admin/invite.html"});
 status(error?"Não foi possível enviar o e-mail: "+error.message:"Se o e-mail estiver cadastrado, você receberá um link para redefinir sua senha. Confira também o spam.");
});
$("loginForm").addEventListener("submit",async event=>{
 event.preventDefault();
 const desired=$("remember").checked;
 if(desired!==keepSignedIn){localStorage.setItem("doe_admin_remember",desired?"yes":"no");status("Preferência de conexão atualizada. A página será recarregada; entre novamente.");location.reload();return;}
 status("Validando acesso...");
 const {error}=await client.auth.signInWithPassword({email:$("email").value,password:$("password").value});
 if(error){status("Não foi possível entrar: "+error.message);return;}
 $("password").value="";await refresh();
});
$("logout").onclick=async()=>{await client.auth.signOut();showLogin();status("Sessão encerrada.");};
refresh().catch(()=>{showLogin();status("Não foi possível verificar o acesso.");});