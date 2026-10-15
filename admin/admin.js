"use strict";
const supabaseUrl="https://xtwydlgoqmqhbpbojwmp.supabase.co";
const supabaseKey="sb_publishable_E1nafD2jTZRz3Nhx2oTtiQ_SSpW5t-4";
const keepSignedIn=localStorage.getItem("doe_admin_remember")==="yes";
const client=window.supabase.createClient(supabaseUrl,supabaseKey,{auth:{storage:keepSignedIn?localStorage:sessionStorage,persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
const $=id=>document.getElementById(id);
const modules=[["Voluntários","volunteer_applications"],["Publicações","event_publications"],["Eventos","events"],["Doações online","donations"],["Doações presenciais e produtos","donation_records"],["Ofertas de produtos","product_donation_offers"],["Aplicação dos recursos","donation_expenditures"],["Parceiros","partners"],["Tarefas","tasks"],["Financeiro","financial_entries"],["Conteúdo","site_content"],["Mídia","media_assets"]];
const descriptions={"volunteer_applications":"Veja inscrições e organize os voluntários.","event_publications":"Publique ações com fotos, vídeos e datas no site público.","events":"Cadastre e planeje eventos internos.","donations":"Confira pagamentos online confirmados.","donation_records":"Registre dinheiro presencial e produtos recebidos.","product_donation_offers":"Responda às ofertas e organize retiradas ou entregas.","donation_expenditures":"Registre gastos e escolha o que divulgar.","partners":"Cadastre empresas e apoiadores.","tasks":"Distribua responsabilidades e acompanhe tarefas.","financial_entries":"Organize os lançamentos financeiros.","site_content":"Atualize informações e textos do projeto.","media_assets":"Organize referências de fotos e arquivos."};
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
 const nav=$("modules");nav.replaceChildren();const area=$("content");area.replaceChildren();const welcome=document.createElement("div");welcome.className="admin-welcome";welcome.innerHTML="<span class=\"welcome-kicker\">CENTRAL DE GESTÃO SOLIDÁRIA</span><h2>Bem-vinda ao seu espaço de organização 💗</h2><p>Escolha uma área abaixo para cadastrar, acompanhar ou atualizar as informações do projeto. As <strong>Publicações</strong> marcadas como públicas aparecem no site; os demais cadastros são de gestão interna, conforme as permissões.</p>";area.append(welcome);const guide=document.createElement("div");guide.className="admin-quick-guide";for(const [title,description] of [["1. Divulgar uma ação","Abra Publicações, preencha os dados, envie as mídias e marque Publicar no site."],["2. Acompanhar doações","Use Doações online, Ofertas de produtos e Doações presenciais e produtos."],["3. Prestar contas","Registre os gastos em Aplicação dos recursos e controle o que será público."]]){const card=document.createElement("div");const h=document.createElement("strong");h.textContent=title;const p=document.createElement("p");p.textContent=description;card.append(h,p);guide.append(card)}area.append(guide);
 for(const [label,table] of modules){
  if((table==="financial_entries"||table==="donation_expenditures")&&!["owner","admin","manager"].includes(currentRole))continue;
  const button=document.createElement("button");button.className="module-tab";button.type="button";const title=document.createElement("strong");title.textContent=label;const help=document.createElement("small");help.textContent=descriptions[table]||"Gerencie os registros.";button.append(title,help);button.onclick=()=>{nav.querySelectorAll(".module-tab").forEach(item=>item.classList.remove("active"));button.classList.add("active");loadTable(label,table);};nav.append(button);
 }
 status("Acesso autenticado.");}
async function loadTable(label,table){
 if(!currentRole)return;
 const area=$("content");area.replaceChildren();const intro=document.createElement("div");intro.className="module-intro";const heading=document.createElement("h2");heading.textContent=label;const desc=document.createElement("p");desc.textContent=descriptions[table]||"Gerencie as informações desta área.";intro.append(heading,desc);area.append(intro);
 if(table==="product_donation_offers"){await window.renderProductOffers(client,area,status);return;}
 if(table==="donation_expenditures"){await window.renderExpenditures(client,area,status);return;}
 if(table==="donations"){await window.renderInfinitepayDonations(client,area,status);return;}
 if(["events","partners","tasks","financial_entries","site_content","media_assets","donation_records"].includes(table)){await window.renderAdminEditor(client,area,status,table);return;}
 if(table==="event_publications"){await window.renderPublications(client,area,status);return;}
 if(table==="volunteer_applications"){await window.renderVolunteers(client,area,status);return;}
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