"use strict";
const supabaseUrl="https://xtwydlgoqmqhbpbojwmp.supabase.co";
const supabaseKey="sb_publishable_E1nafD2jTZRz3Nhx2oTtiQ_SSpW5t-4";
const keepSignedIn=localStorage.getItem("doe_admin_remember")==="yes";
const client=window.supabase.createClient(supabaseUrl,supabaseKey,{auth:{storage:keepSignedIn?localStorage:sessionStorage,persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
const $=id=>document.getElementById(id);
const modules=[["Voluntários","volunteer_applications"],["Publicações","event_publications"],["Banners de eventos","site_banners"],["Planejamento interno","events"],["Doações online","donations"],["Metas de arrecadação","donation_goals"],["Doações presenciais e produtos","donation_records"],["Ofertas de produtos","product_donation_offers"],["Lista de produtos para doar","product_donation_products"],["Aplicação dos recursos","donation_expenditures"],["Parceiros","partners"],["Tarefas","tasks"],["Financeiro","financial_entries"],["Conteúdo","site_content"],["Mídia","media_assets"],["Meu perfil","my_profile"],["Administradores e convites","admin_invites"]];
const descriptions={"my_profile":"Atualize seus dados pessoais, foto, e-mail e senha.","volunteer_applications":"Veja inscrições e organize os voluntários.","event_publications":"Publique ações com fotos, vídeos e datas no site público.","site_banners":"Crie, publique e organize banners animados para o topo das páginas.","events":"Planejamento interno: estes registros não aparecem no site público. Para divulgar, use Publicações.","donations":"Confira pagamentos online confirmados.","donation_goals":"Defina a meta pública de arrecadação que aparecerá na página de Transparência.","donation_records":"Registre dinheiro presencial e produtos recebidos.","product_donation_offers":"Responda às ofertas e organize retiradas ou entregas.","product_donation_products":"Publique itens da lista solidária e confirme avisos de compra e recebimento.","donation_expenditures":"Registre gastos e escolha o que divulgar.","partners":"Cadastre empresas e apoiadores.","tasks":"Distribua responsabilidades e acompanhe tarefas.","financial_entries":"Organize os lançamentos financeiros.","site_content":"Atualize informações e textos do projeto.","media_assets":"Organize referências de fotos e arquivos.","admin_invites":"Convide pessoas da equipe com acesso individual e seguro."};
let currentRole=null;
function status(message){$("status").textContent=message;const loginStatus=$("loginStatus");if(loginStatus)loginStatus.textContent=$("login").hidden?"":message;}
function showLogin(){currentRole=null;$("dashboard").hidden=true;$("login").hidden=false;$("logout").hidden=true;}
async function renderDonationProgress(area){
 const section=document.createElement("section");section.className="donation-progress";
 section.innerHTML='<div class="donation-progress-head"><div><span class="welcome-kicker">NOSSA ARRECADAÇÃO</span><h2>Juntos, cada doação vira sorriso 💗</h2><p>Acompanhe o dinheiro recebido e o avanço da nossa meta.</p></div><span class="donation-progress-icon">💝</span></div><div class="donation-progress-values"><strong id="donationRaised">Carregando...</strong><span id="donationGoalLabel">Meta a definir</span></div><div class="donation-progress-track" role="progressbar" aria-label="Progresso das doações em dinheiro" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><div class="donation-progress-fill"></div></div><div class="donation-progress-foot"><strong id="donationPercent">—</strong><span id="donationRemaining">Valores confirmados</span></div><p class="donation-progress-note">Inclui doações online confirmadas e dinheiro presencial recebido. Não inclui produtos, promessas ou despesas.</p>';
 area.prepend(section);
 const brl=c=>(Number(c||0)/100).toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
 const {data,error}=await client.rpc("donation_registered_balance");
 if(error||!data){section.querySelector("#donationRaised").textContent="Não foi possível carregar as doações";section.querySelector("#donationRemaining").textContent="Tente atualizar a página";return;}
 const raised=Math.max(0,Number(data.online_cents||0)+Number(data.cash_cents||0));
 section.querySelector("#donationRaised").textContent=brl(raised)+" arrecadados";
 let goal=0;const {data:goalRow}=await client.from("donation_goals").select("goal_cents").eq("id",1).maybeSingle();goal=Number(goalRow?.goal_cents||0);
 function update(){section.querySelector("#donationGoalLabel").textContent=goal?"Meta: "+brl(goal):"Meta ainda não cadastrada";const pct=goal?Math.round(raised/goal*100):0;section.querySelector(".donation-progress-fill").style.width=Math.min(100,pct)+"%";section.querySelector(".donation-progress-track").setAttribute("aria-valuenow",String(Math.min(100,pct)));section.querySelector("#donationPercent").textContent=goal?pct+"% da meta":"Cadastre a meta em Metas de arrecadação";section.querySelector("#donationRemaining").textContent=goal?(raised>=goal?"Meta alcançada! 🎉":"Faltam "+brl(goal-raised)):"Somente valores recebidos";}
 update();
}
async function renderDonationGoals(area){
 const wrap=document.createElement("section");wrap.className="goal-overview";area.append(wrap);
 const header=document.createElement("div");header.innerHTML='<span class="welcome-kicker">CAMPANHAS SOLIDÁRIAS</span><h3>Metas de arrecadação 💗</h3><p>Crie quantas campanhas precisar. Cada doação online será destinada à campanha escolhida pelo doador.</p>';wrap.append(header);
 const open=document.createElement("button");open.type="button";open.className="goal-open";open.textContent="+ Nova meta";wrap.append(open);
 const list=document.createElement("div");list.className="goal-list";area.append(list);
 const dialog=document.createElement("dialog");dialog.className="goal-dialog";dialog.innerHTML='<form class="goal-modal-form"><div class="goal-modal-top"><div class="goal-modal-icon">💗</div><button type="button" class="goal-close" aria-label="Fechar">×</button></div><span class="welcome-kicker">CAMPANHA SOLIDÁRIA</span><h2>Cadastrar meta</h2><p>Defina o objetivo e acompanhe as doações destinadas a esta campanha.</p><label>Nome da campanha<input name="title" maxlength="100" required placeholder="Ex.: Natal Solidário"></label><label>Valor que desejamos arrecadar (R$)<input name="amount" type="number" min="0.01" step="0.01" required placeholder="5000"></label><label class="checkline"><input name="active" type="checkbox" checked> Receber novas doações nesta campanha</label><p class="goal-modal-message" role="status"></p><div class="goal-modal-actions"><button type="button" class="goal-cancel">Cancelar</button><button type="submit" class="goal-save">Salvar campanha 💗</button></div></form>';document.body.append(dialog);
 const form=dialog.querySelector("form"),msg=dialog.querySelector(".goal-modal-message"),save=dialog.querySelector(".goal-save");let editing=null;
 const brl=c=>(Number(c||0)/100).toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
 function close(){dialog.close()}dialog.querySelector(".goal-close").onclick=close;dialog.querySelector(".goal-cancel").onclick=close;dialog.addEventListener("click",e=>{if(e.target===dialog)close()});
 open.onclick=()=>{editing=null;form.reset();msg.textContent="";dialog.querySelector("h2").textContent="Nova meta de arrecadação";dialog.showModal()};
 async function load(){const {data,error}=await client.rpc("donation_goals_progress");list.replaceChildren();if(error){list.textContent="Não foi possível carregar as campanhas.";return;}if(!data.length){list.textContent="Nenhuma meta cadastrada ainda. Clique em Nova meta para começar.";return;}for(const g of data){const card=document.createElement("article");card.className="goal-list-item";const title=document.createElement("h3");title.textContent=g.title;const stats=document.createElement("p");stats.textContent=brl(g.raised_cents)+" de "+brl(g.goal_cents)+" · "+Math.round(Number(g.raised_cents)/Number(g.goal_cents)*100)+"% da meta · "+(g.active?"Recebendo doações":"Pausada");const track=document.createElement("div");track.className="donation-progress-track";const fill=document.createElement("div");fill.className="donation-progress-fill";fill.style.width=Math.min(100,Math.round(Number(g.raised_cents)/Number(g.goal_cents)*100))+"%";track.append(fill);const edit=document.createElement("button");edit.type="button";edit.textContent="Editar campanha";edit.onclick=()=>{editing=g.id;form.elements.title.value=g.title;form.elements.amount.value=(Number(g.goal_cents)/100).toFixed(2);form.elements.active.checked=g.active;msg.textContent="";dialog.querySelector("h2").textContent="Editar campanha";dialog.showModal()};card.append(title,stats,track,edit);list.append(card)}}
 form.onsubmit=async e=>{e.preventDefault();const cents=Math.round(Number(form.elements.amount.value)*100);if(!Number.isSafeInteger(cents)||cents<1){msg.textContent="Informe um valor válido.";return;}save.disabled=true;msg.textContent="Salvando...";const {data:{user}}=await client.auth.getUser();const payload={title:form.elements.title.value.trim(),goal_cents:cents,active:form.elements.active.checked,updated_by:user.id,updated_at:new Date().toISOString()};const query=editing?client.from("donation_goals").update(payload).eq("id",editing):client.from("donation_goals").insert(payload);const {error}=await query;save.disabled=false;if(error){msg.textContent="Não foi possível salvar: "+error.message;return;}close();await load();status("Campanha salva! Ela já aparece na página de Transparência.")};
 await load();
}
async function refresh(){
 const {data:{session},error}=await client.auth.getSession();
 const user=session?.user;
 if(error||!user){showLogin();return;}
 const {data:member,error:roleError}=await client.from("admin_members").select("role,active").eq("user_id",user.id).maybeSingle();
 if(roleError||!member?.active){await client.auth.signOut();showLogin();status("Esta conta ainda não possui autorização administrativa.");return;}
 currentRole=member.role;$("login").hidden=true;$("dashboard").hidden=false;$("logout").hidden=false;
 const profileName=(user.user_metadata?.full_name||user.user_metadata?.name||user.user_metadata?.display_name||"").trim();const emailName=(user.email||"").split("@")[0].replace(/[._-]+/g," ").trim();const displayName=profileName||emailName||"Administrador";$("role").textContent="Conectado como: "+displayName;
 const nav=$("modules");nav.replaceChildren();const area=$("content");area.replaceChildren();const welcome=document.createElement("div");welcome.className="admin-welcome";welcome.innerHTML="<span class=\"welcome-kicker\">CENTRAL DE GESTÃO SOLIDÁRIA</span><h2>Bem-vinda ao seu espaço de organização 💗</h2><p>Escolha uma área abaixo para cadastrar, acompanhar ou atualizar as informações do projeto. As <strong>Publicações</strong> marcadas como públicas aparecem no site; os demais cadastros são de gestão interna, conforme as permissões.</p>";area.append(welcome);if(currentRole==="collaborator"){welcome.querySelector("h2").textContent="Bem-vinda à equipe! 💗";welcome.querySelector("p").textContent="Você pode atualizar seus dados pessoais, foto, e-mail e senha em Meu perfil."; }const guide=document.createElement("div");guide.className="admin-quick-guide";for(const [title,description] of [["1. Divulgar uma ação","Abra Publicações, preencha os dados, envie as mídias e marque Publicar no site."],["2. Acompanhar doações","Use Doações online, Ofertas de produtos e Doações presenciais e produtos."],["3. Prestar contas","Registre os gastos em Aplicação dos recursos e controle o que será público."]]){const card=document.createElement("div");const h=document.createElement("strong");h.textContent=title;const p=document.createElement("p");p.textContent=description;card.append(h,p);guide.append(card)}if(currentRole!=="collaborator"){area.append(guide);}
 for(const [label,table] of modules){
  if(currentRole==="collaborator"&&table!=="my_profile")continue;
  if(table==="admin_invites"&&!["owner","admin"].includes(currentRole))continue;
  if((table==="financial_entries"||table==="donation_expenditures")&&!["owner","admin","manager"].includes(currentRole))continue;
  const button=document.createElement("button");button.className="module-tab";button.type="button";const title=document.createElement("strong");title.textContent=label;const help=document.createElement("small");help.textContent=descriptions[table]||"Gerencie os registros.";button.append(title,help);button.onclick=()=>{nav.querySelectorAll(".module-tab").forEach(item=>item.classList.remove("active"));button.classList.add("active");loadTable(label,table);};nav.append(button);
 }
 status("● Conectado");}
async function loadTable(label,table){
 if(!currentRole||currentRole==="collaborator"&&table!=="my_profile")return;
 const area=$("content");area.replaceChildren();const intro=document.createElement("div");intro.className="module-intro";const heading=document.createElement("h2");heading.textContent=label;const desc=document.createElement("p");desc.textContent=descriptions[table]||"Gerencie as informações desta área.";intro.append(heading,desc);area.append(intro);
 if(table==="site_banners"){await window.renderEventBanners(client,area,status);return;}
 if(table==="donation_goals"){await renderDonationGoals(area);return;}
 if(table==="my_profile"){await window.renderMyProfile(client,area,status);return;}
 if(table==="admin_invites"){await window.renderAdminInvites(client,area,status);return;}
 if(table==="product_donation_offers"){await window.renderProductOffers(client,area,status);return;}
 if(table==="product_donation_products"){await window.renderProductCatalogAdmin(client,area,status);return;}
 if(table==="donation_expenditures"){await window.renderExpenditures(client,area,status);return;}
 if(table==="donations"){await window.renderInfinitepayDonations(client,area,status);return;}
 if(["events","partners","tasks","financial_entries","site_content","media_assets","donation_records"].includes(table)){await window.renderAdminEditor(client,area,status,table);return;}
 if(table==="event_publications"){await window.renderPublications(client,area,status);return;}
 if(table==="volunteer_applications"){await window.renderVolunteers(client,area,status);return;}
 const {data,error}=await client.from(table).select("*").limit(50);
 if(error){status("Não foi possível carregar "+label+": "+error.message);return;}
 if(!data.length){const p=document.createElement("p");p.textContent="Nenhum registro cadastrado.";area.append(p);return;}
 const pre=document.createElement("pre");pre.textContent=JSON.stringify(data,null,2);area.append(pre);
}
$("remember").checked=keepSignedIn;
$("showPassword").addEventListener("click",()=>{const visible=$("password").type==="password";$("password").type=visible?"text":"password";$("showPassword").textContent=visible?"Ocultar":"Mostrar";$("showPassword").setAttribute("aria-pressed",String(visible));$("showPassword").setAttribute("aria-label",visible?"Ocultar senha":"Mostrar senha");});
$("forgotPassword").addEventListener("click",async()=>{
 const email=$("email").value.trim();
 if(!email){status("Informe seu e-mail acima para receber o link de redefinição.");$("email").focus();return;}
 status("Enviando link de redefinição...");
 const {error}=await client.auth.resetPasswordForEmail(email,{redirectTo:location.origin+"/admin/invite.html"});
 status(error?"Não foi possível enviar o e-mail: "+error.message:"Se o e-mail estiver cadastrado, você receberá um link para redefinir sua senha. Confira também o spam.");
});
$("loginForm").addEventListener("submit",async event=>{
 event.preventDefault();
 const submit=$("loginForm").querySelector('[type="submit"]');
 if(submit.disabled)return;
 submit.disabled=true;const oldText=submit.textContent;submit.textContent="Entrando...";
 const desired=$("remember").checked;
 try{
  if(desired!==keepSignedIn){localStorage.setItem("doe_admin_remember",desired?"yes":"no");status("Preferência salva. Recarregue a página e tente novamente.");return;}
  status("Validando e-mail e senha...");
  const attempt=client.auth.signInWithPassword({email:$("email").value.trim(),password:$("password").value});
  const result=await Promise.race([attempt,new Promise((_,reject)=>setTimeout(()=>reject(new Error("Tempo de resposta esgotado")),15000))]);
  if(result.error){status("Não foi possível entrar: "+result.error.message);return;}
  if(!result.data?.session){status("O servidor não retornou uma sessão. Tente novamente.");return;}
  status("Acesso confirmado. Abrindo painel...");
  await refresh();
  if(!$("dashboard").hidden){$("password").value="";status("● Conectado");}
  else status("Sua sessão foi criada, mas o painel não foi liberado. Verifique as permissões com a equipe.");
 }catch(err){status("Erro ao entrar: "+(err?.message||"Tente novamente."));}
 finally{submit.disabled=false;submit.textContent=oldText;}
});
$("logout").onclick=async()=>{await client.auth.signOut();showLogin();status("Sessão encerrada.");};
refresh().catch(()=>{showLogin();status("Não foi possível verificar o acesso.");});