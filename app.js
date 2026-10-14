const STORAGE_KEY = "sao-benedito-kids-day-v1";
const DATA_VERSION = 3;
const RECEIPT_DB = "doe-amor-notas-v1";
const RECEIPT_STORE = "arquivos";
const SUPABASE_URL = "https://xtwydlgoqmqhbpbojwmp.supabase.co";
const SUPABASE_KEY = "sb_publishable_E1nafD2jTZRz3Nhx2oTtiQ_SSpW5t-4";
const SESSION_KEY = "doe-amor-supabase-session";
let remoteSession = null;
let pendingSnapshot = null;
let syncTimer = null;
let syncing = false;

const seedData = {
  schemaVersion: DATA_VERSION,
  partners: [
    { id: "p1", company: "Mercado ou atacadista da região", sector: "Alimentos", person: "", channel: "Telefone", contact: "", status: "mapear", lastContact: "", request: "Pães, salsichas e refrigerantes", notes: "Sugestão inicial — substitua pelo nome da empresa escolhida." },
    { id: "p2", company: "Loja de brinquedos da região", sector: "Brinquedos", person: "", channel: "WhatsApp", contact: "", status: "mapear", lastContact: "", request: "100 presentes para o Dia das Crianças", notes: "Sugestão inicial — substitua pelo nome da empresa escolhida." },
    { id: "p3", company: "Distribuidora de bebidas", sector: "Bebidas", person: "", channel: "E-mail", contact: "", status: "mapear", lastContact: "", request: "Refrigerante, suco e água", notes: "Sugestão inicial — substitua pelo nome da empresa escolhida." }
  ],
  donations: [
    { id: "d1", name: "Presentes novos ou em bom estado", category: "Presentes", needed: 100, received: 0, unit: "unidades", donor: "" },
    { id: "d2", name: "Sacolinhas-surpresa", category: "Doces", needed: 150, received: 0, unit: "sacolinhas", donor: "" },
    { id: "d3", name: "Pães para cachorro-quente", category: "Alimentos", needed: 200, received: 0, unit: "unidades", donor: "" },
    { id: "d4", name: "Salsicha", category: "Alimentos", needed: 45, received: 0, unit: "kg", donor: "" },
    { id: "d5", name: "Refrigerantes e sucos", category: "Bebidas", needed: 75, received: 0, unit: "litros", donor: "" },
    { id: "d6", name: "Copos, pratos e guardanapos", category: "Descartáveis", needed: 350, received: 0, unit: "kits", donor: "" }
  ],
  fundraising: { holder: "", bank: "", keyType: "Chave aleatória", key: "", goal: 0, received: 0 },
  receipts: [],
  tasks: [
    { id: "t1", title: "Preparar cartas de apresentação e documentos de transparência", owner: "Tainara", due: "2026-09-18", priority: "alta", status: "todo", notes: "Deixar claro que a ação é independente e não tem vínculo político." },
    { id: "t2", title: "Mapear comércios e parceiros locais para apoio", owner: "Joice", due: "2026-09-20", priority: "alta", status: "todo", notes: "Priorizar alimentos, bebidas, brinquedos, roupas e apoio voluntário." },
    { id: "t3", title: "Conferir espaço físico, estrutura e logística do evento", owner: "Leandro", due: "2026-09-25", priority: "alta", status: "todo", notes: "Verificar mesas, som, energia, segurança e fluxo de atendimento." },
    { id: "t4", title: "Fazer triagem, organizar e montar os kits de doação", owner: "Tainara", due: "2026-10-05", priority: "alta", status: "todo", notes: "Separar os itens por tipo e conferir as quantidades finais." },
    { id: "t5", title: "Realizar o evento social do Dia das Crianças", owner: "Voluntários", due: "2026-10-11", priority: "alta", status: "todo", notes: "Recepcionar as famílias e executar a programação do evento." }
  ]
};

let state = loadState();
let taskOwnerFilter = "all";
let activeModal = null;
let editingId = null;

const statusLabels = {
  mapear: "A mapear",
  contatar: "A contatar",
  aguardando: "Aguardando resposta",
  confirmado: "Confirmado",
  recusado: "Não poderá ajudar"
};

const taskStatusLabels = { todo: "A fazer", doing: "Em andamento", done: "Concluídas" };
const donationIcons = { Presentes: "🎁", Doces: "🍬", Alimentos: "🥖", Bebidas: "🧃", Descartáveis: "◌", Outros: "♡" };

function clone(value) { return JSON.parse(JSON.stringify(value)); }
function uid(prefix) { return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`; }
function migrateState(saved) {
  const migrated = clone(saved);
  if (Number(migrated.schemaVersion || 1) < DATA_VERSION) {
    const donationUpdates = Object.fromEntries(seedData.donations.map(item => [item.id, item]));
    migrated.donations = migrated.donations.map(item => {
      const update = donationUpdates[item.id];
      return update ? { ...item, name: update.name, category: update.category, needed: update.needed, unit: update.unit } : item;
    });

    const taskUpdates = Object.fromEntries(seedData.tasks.map(item => [item.id, item]));
    migrated.tasks = migrated.tasks.map(item => {
      const update = taskUpdates[item.id];
      return update ? { ...item, title: update.title, due: update.due, notes: update.notes } : item;
    });
    seedData.tasks.forEach(item => {
      if (!migrated.tasks.some(existing => existing.id === item.id)) migrated.tasks.push(clone(item));
    });

    migrated.partners = migrated.partners.map(item => item.id === "p2" ? { ...item, request: seedData.partners.find(partner => partner.id === "p2").request } : item);
  }
  migrated.fundraising = { ...seedData.fundraising, ...(migrated.fundraising || {}) };
  migrated.receipts = Array.isArray(migrated.receipts) ? migrated.receipts : [];

  migrated.schemaVersion = DATA_VERSION;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
  return migrated;
}
function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved && Array.isArray(saved.partners) && Array.isArray(saved.donations) && Array.isArray(saved.tasks)) return migrateState(saved);
  } catch (error) { console.warn("Não foi possível carregar os dados salvos.", error); }
  return clone(seedData);
}
function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  renderAll();
  if (remoteSession) {
    pendingSnapshot = clone(state);
    clearTimeout(syncTimer);
    syncTimer = setTimeout(flushRemoteState, 500);
  }
}
function syncStatus(title, message) {
  document.getElementById("syncTitle").textContent = title;
  document.getElementById("syncMessage").textContent = message;
  document.getElementById("syncForm").hidden = Boolean(remoteSession);
  document.getElementById("syncSignout").hidden = !remoteSession;
}
async function supabaseRequest(path, options = {}, authenticated = false) {
  if (authenticated && remoteSession?.expires_at <= Math.floor(Date.now() / 1000) + 60) await refreshSession();
  const response = await fetch(SUPABASE_URL + path, {
    ...options,
    headers: {
      apikey: SUPABASE_KEY,
      "Content-Type": "application/json",
      ...(authenticated ? { Authorization: `Bearer ${remoteSession.access_token}` } : {}),
      ...(options.headers || {})
    }
  });
  const body = response.status === 204 ? null : await response.json().catch(() => null);
  if (!response.ok) throw new Error(body?.msg || body?.message || body?.error_description || "O serviço não respondeu.");
  return body;
}
function setSession(session) {
  remoteSession = session ? { ...session, expires_at: session.expires_at || Math.floor(Date.now() / 1000) + session.expires_in } : null;
  if (remoteSession) sessionStorage.setItem(SESSION_KEY, JSON.stringify(remoteSession));
  else sessionStorage.removeItem(SESSION_KEY);
}
async function refreshSession() {
  if (!remoteSession?.refresh_token) throw new Error("Entre novamente para continuar.");
  const refreshed = await supabaseRequest("/auth/v1/token?grant_type=refresh_token", {
    method: "POST", body: JSON.stringify({ refresh_token: remoteSession.refresh_token })
  });
  setSession(refreshed);
}
async function loadRemoteState() {
  const rows = await supabaseRequest(`/rest/v1/site_state?select=data&user_id=eq.${encodeURIComponent(remoteSession.user.id)}`, {}, true);
  if (rows.length) {
    state = migrateState(rows[0].data);
    renderAll();
    syncStatus("Conectado ao Supabase", "Os dados deste painel estão disponíveis na sua conta.");
  } else {
    pendingSnapshot = clone(state);
    await flushRemoteState();
  }
}
async function flushRemoteState() {
  if (!remoteSession || syncing || !pendingSnapshot) return;
  syncing = true;
  try {
    while (pendingSnapshot) {
      const snapshot = pendingSnapshot;
      pendingSnapshot = null;
      await supabaseRequest("/rest/v1/site_state?on_conflict=user_id", {
        method: "POST",
        headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
        body: JSON.stringify({ user_id: remoteSession.user.id, data: snapshot, updated_at: new Date().toISOString() })
      }, true);
    }
    syncStatus("Conectado ao Supabase", "Alterações salvas na sua conta.");
  } catch (error) {
    pendingSnapshot = pendingSnapshot || clone(state);
    syncStatus("Falha ao salvar", "Os dados continuam neste navegador. Verifique a conexão e entre novamente se necessário.");
    console.warn("Falha na sincronização:", error.message);
  } finally {
    syncing = false;
  }
}
async function submitSync(event) {
  event.preventDefault();
  const fields = new FormData(event.currentTarget);
  syncStatus("Conectando…", "Verificando sua conta.");
  try {
    const session = await supabaseRequest("/auth/v1/token?grant_type=password", {
      method: "POST", body: JSON.stringify({ email: fields.get("email"), password: fields.get("password") })
    });
    setSession(session);
    await loadRemoteState();
    event.currentTarget.reset();
  } catch (error) {
    syncStatus("Não foi possível entrar", error.message);
  }
}
async function signupSync() {
  const form = document.getElementById("syncForm");
  if (!form.reportValidity()) return;
  const fields = new FormData(form);
  try {
    const result = await supabaseRequest("/auth/v1/signup", {
      method: "POST", body: JSON.stringify({ email: fields.get("email"), password: fields.get("password") })
    });
    if (result.access_token) {
      setSession(result);
      await loadRemoteState();
      form.reset();
    } else syncStatus("Confira seu e-mail", "Confirme o cadastro pelo e-mail recebido e depois entre aqui com sua senha.");
  } catch (error) {
    syncStatus("Não foi possível criar a conta", error.message);
  }
}
async function restoreSession() {
  try {
    const saved = JSON.parse(sessionStorage.getItem(SESSION_KEY));
    if (!saved?.refresh_token) return;
    setSession(saved);
    if (remoteSession.expires_at <= Math.floor(Date.now() / 1000) + 60) await refreshSession();
    await loadRemoteState();
  } catch (error) {
    setSession(null);
    syncStatus("Conectar o painel", "Entre novamente para acessar os dados salvos.");
  }
}
function escapeHtml(value = "") {
  return String(value).replace(/[&<>'"]/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[char]));
}
function formatDate(dateValue) {
  if (!dateValue) return "Sem registro";
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", timeZone: "UTC" }).format(new Date(`${dateValue}T12:00:00Z`)).replace(".", "");
}
function percentage(current, total) { return total > 0 ? Math.min(100, Math.round((current / total) * 100)) : 0; }
function formatCurrency(value) { return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value || 0)); }
function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove("show"), 2800);
}

function openReceiptDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(RECEIPT_DB, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(RECEIPT_STORE);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function saveReceiptFile(id, file) {
  const database = await openReceiptDatabase();
  await new Promise((resolve, reject) => {
    const transaction = database.transaction(RECEIPT_STORE, "readwrite");
    transaction.objectStore(RECEIPT_STORE).put(file, id);
    transaction.oncomplete = resolve;
    transaction.onerror = () => reject(transaction.error);
  });
  database.close();
}

async function getReceiptFile(id) {
  const database = await openReceiptDatabase();
  const file = await new Promise((resolve, reject) => {
    const request = database.transaction(RECEIPT_STORE, "readonly").objectStore(RECEIPT_STORE).get(id);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  database.close();
  return file;
}

async function removeReceiptFile(id) {
  const database = await openReceiptDatabase();
  await new Promise((resolve, reject) => {
    const transaction = database.transaction(RECEIPT_STORE, "readwrite");
    transaction.objectStore(RECEIPT_STORE).delete(id);
    transaction.oncomplete = resolve;
    transaction.onerror = () => reject(transaction.error);
  });
  database.close();
}

function updateCountdown() {
  const now = new Date();
  const event = new Date("2026-10-11T12:00:00-03:00");
  const days = Math.max(0, Math.ceil((event - now) / 86400000));
  document.getElementById("daysToEvent").textContent = String(days);
  document.getElementById("countdownLabel").textContent = days === 1 ? "dia para o Dia das Crianças" : days === 0 ? "é hoje!" : "dias para o Dia das Crianças";
}

function setTab(tabName) {
  document.querySelectorAll(".tab").forEach(tab => {
    const active = tab.dataset.tab === tabName;
    tab.classList.toggle("active", active);
    tab.setAttribute("aria-selected", String(active));
  });
  document.querySelectorAll(".panel").forEach(panel => panel.classList.toggle("active", panel.dataset.panel === tabName));
  document.getElementById("organizacao")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function openLightbox(source, alt) {
  const lightbox = document.getElementById("lightbox");
  const image = document.getElementById("lightboxImage");
  image.src = source;
  image.alt = alt;
  lightbox.hidden = false;
  document.body.style.overflow = "hidden";
  document.getElementById("lightboxClose").focus();
}

function closeLightbox() {
  const lightbox = document.getElementById("lightbox");
  lightbox.hidden = true;
  document.getElementById("lightboxImage").src = "";
  document.body.style.overflow = "";
}

function getDonationTotals() {
  const totalNeeded = state.donations.reduce((sum, item) => sum + Number(item.needed || 0), 0);
  const totalReceived = state.donations.reduce((sum, item) => sum + Math.min(Number(item.received || 0), Number(item.needed || 0)), 0);
  const pct = state.donations.length
    ? Math.round(state.donations.reduce((sum, item) => sum + percentage(item.received, item.needed), 0) / state.donations.length)
    : 0;
  return { totalNeeded, totalReceived, pct };
}

function renderOverview() {
  const confirmed = state.partners.filter(item => item.status === "confirmado").length;
  const contacted = state.partners.filter(item => ["aguardando", "confirmado", "recusado"].includes(item.status)).length;
  const done = state.tasks.filter(item => item.status === "done").length;
  const donation = getDonationTotals();
  const taskPct = percentage(done, state.tasks.length);
  const contactPct = percentage(contacted, state.partners.length);
  const overall = Math.round((donation.pct + taskPct + contactPct) / 3);

  document.getElementById("statsGrid").innerHTML = [
    ["mint", "👥", "300", "pessoas previstas"],
    ["coral", "◇", String(state.partners.length), `possíveis parceiros · ${confirmed} confirmados`],
    ["gold", "♡", `${donation.pct}%`, "das doações garantidas"],
    ["blue", "✓", `${done}/${state.tasks.length}`, "tarefas concluídas"]
  ].map(([color, icon, value, label]) => `<article class="stat-card"><span class="stat-icon ${color}">${icon}</span><div><strong>${value}</strong><span>${label}</span></div></article>`).join("");

  const ring = document.getElementById("progressRing");
  ring.style.setProperty("--progress", overall);
  document.getElementById("progressPercent").textContent = `${overall}%`;
  document.getElementById("progressLegend").innerHTML = [
    ["#ef6a5b", "Doações", donation.pct],
    ["#2f7a7d", "Contatos realizados", contactPct],
    ["#edae49", "Tarefas concluídas", taskPct]
  ].map(([color, label, pct]) => `<div class="legend-row"><span class="legend-dot" style="background:${color}"></span><span>${label}</span><strong>${pct}%</strong></div>`).join("");

  const lowItems = state.donations.filter(item => percentage(item.received, item.needed) < 50).slice(0, 2);
  const pendingPartners = state.partners.filter(item => ["mapear", "contatar"].includes(item.status)).length;
  const attention = [];
  if (pendingPartners) attention.push({ icon: "☎", title: `${pendingPartners} contato${pendingPartners > 1 ? "s" : ""} ainda não iniciado${pendingPartners > 1 ? "s" : ""}`, detail: "Registre a empresa e avance o status.", tab: "partners" });
  lowItems.forEach(item => attention.push({ icon: donationIcons[item.category] || "♡", title: `${item.name}: ${percentage(item.received, item.needed)}% garantido`, detail: `Faltam ${Math.max(0, item.needed - item.received)} ${item.unit}.`, tab: "donations" }));
  if (!attention.length) attention.push({ icon: "✓", title: "Tudo sob controle", detail: "Nenhum ponto urgente por enquanto.", tab: "overview" });
  document.getElementById("attentionList").innerHTML = attention.slice(0, 3).map(item => `<div class="attention-item"><span class="attention-icon">${item.icon}</span><div><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(item.detail)}</small></div><button type="button" data-go-tab="${item.tab}">Ver</button></div>`).join("");

  const upcoming = state.tasks.filter(item => item.status !== "done").sort((a, b) => (a.due || "9999").localeCompare(b.due || "9999")).slice(0, 3);
  document.getElementById("upcomingTasks").innerHTML = upcoming.length ? upcoming.map(item => `<div class="timeline-item"><strong>${escapeHtml(item.title)}</strong><span>${formatDate(item.due)} · ${escapeHtml(item.owner)}</span></div>`).join("") : `<div class="empty-state"><strong>Sem tarefas pendentes</strong>Parabéns, tudo concluído.</div>`;
}

function renderPartners() {
  const query = document.getElementById("partnerSearch").value.trim().toLowerCase();
  const filter = document.getElementById("partnerFilter").value;
  const filtered = state.partners.filter(item => {
    const matchesText = [item.company, item.person, item.sector, item.contact].join(" ").toLowerCase().includes(query);
    return matchesText && (filter === "all" || item.status === filter);
  });
  document.getElementById("partnerList").innerHTML = filtered.length ? filtered.map(item => `
    <article class="data-row">
      <div class="company-cell"><span class="company-avatar">${escapeHtml(item.company.slice(0, 1).toUpperCase())}</span><div><strong>${escapeHtml(item.company)}</strong><small>${escapeHtml(item.sector || "Segmento não informado")}</small></div></div>
      <div class="contact-cell"><span class="cell-label">CONTATO</span><div class="cell-value"><strong>${escapeHtml(item.person || "Ainda não informado")}</strong><small>${escapeHtml(item.contact || item.channel || "—")}</small></div></div>
      <div class="status-cell"><span class="status-pill status-${item.status}">${statusLabels[item.status]}</span><div class="cell-value"><small>Último contato: ${formatDate(item.lastContact)}</small></div></div>
      <div class="row-actions"><button class="tiny-button" type="button" data-edit-partner="${item.id}">Editar</button><button class="tiny-button danger" type="button" data-delete-partner="${item.id}" aria-label="Excluir ${escapeHtml(item.company)}">Excluir</button></div>
    </article>`).join("") : `<div class="empty-state"><strong>Nenhum parceiro encontrado</strong>Ajuste o filtro ou cadastre uma nova empresa.</div>`;
}

function renderDonations() {
  const totals = getDonationTotals();
  const completed = state.donations.filter(item => Number(item.received) >= Number(item.needed)).length;
  document.getElementById("donationSummary").innerHTML = `<strong>${totals.pct}%</strong><div><div class="summary-progress"><span style="width:${totals.pct}%"></span></div><small>média de avanço dos itens cadastrados</small></div><small>${completed} de ${state.donations.length} itens completos</small>`;
  document.getElementById("publicDonationPercent").textContent = `${totals.pct}%`;
  document.getElementById("publicDonationBar").style.width = `${totals.pct}%`;
  document.getElementById("donationList").innerHTML = state.donations.length ? state.donations.map(item => {
    const pct = percentage(item.received, item.needed);
    return `<article class="donation-card">
      <div class="donation-head"><span class="donation-icon">${donationIcons[item.category] || "♡"}</span><span class="status-pill ${pct >= 100 ? "status-confirmado" : pct > 0 ? "status-aguardando" : "status-mapear"}">${pct >= 100 ? "Completo" : pct > 0 ? "Em andamento" : "Pendente"}</span></div>
      <h3>${escapeHtml(item.name)}</h3><p class="category">${escapeHtml(item.category)}</p>
      <div class="quantity-line"><strong>${item.received} / ${item.needed}</strong><span>${escapeHtml(item.unit)} · ${pct}%</span></div><div class="bar"><span style="width:${pct}%"></span></div>
      <div class="donation-footer"><span class="donor-note" title="${escapeHtml(item.donor)}">${item.donor ? `Doador: ${escapeHtml(item.donor)}` : "Sem doador registrado"}</span><div class="row-actions"><button class="tiny-button" type="button" data-edit-donation="${item.id}">Atualizar</button><button class="tiny-button danger" type="button" data-delete-donation="${item.id}">Excluir</button></div></div>
    </article>`;
  }).join("") : `<div class="empty-state"><strong>Nenhum item cadastrado</strong>Adicione o primeiro item necessário para o evento.</div>`;
}

function renderFinance() {
  const fundraising = state.fundraising || seedData.fundraising;
  const hasPix = Boolean(fundraising.key && fundraising.holder);
  const moneyPct = percentage(fundraising.received, fundraising.goal);
  const status = document.getElementById("pixStatus");
  status.textContent = hasPix ? "Pix cadastrado" : "Aguardando cadastro";
  status.className = `status-pill ${hasPix ? "status-confirmado" : "status-mapear"}`;
  document.getElementById("pixAdminContent").innerHTML = hasPix ? `
    <div class="pix-account"><span>Titular</span><strong>${escapeHtml(fundraising.holder)}</strong><small>${escapeHtml(fundraising.bank || "Instituição não informada")}</small></div>
    <div class="pix-key-row"><div><span>${escapeHtml(fundraising.keyType)}</span><strong>${escapeHtml(fundraising.key)}</strong></div><button class="tiny-button" type="button" data-copy-pix>Copiar</button></div>
    <div class="money-progress"><div><strong>${formatCurrency(fundraising.received)}</strong><span> de ${formatCurrency(fundraising.goal)} · ${moneyPct}%</span></div><div class="bar"><span style="width:${moneyPct}%"></span></div></div>
    <button class="secondary-button" type="button" data-action="configure-pix">Editar conta e valores</button>` : `
    <div class="pix-empty"><span>◇</span><div><strong>A chave Pix ainda não foi informada</strong><p>Cadastre a conta quando ela estiver pronta. Nenhuma chave fictícia será exibida.</p></div></div>
    <button class="primary-button" type="button" data-action="configure-pix">Cadastrar conta Pix</button>`;
}

function renderReceipts() {
  const total = state.receipts.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  document.getElementById("receiptTotal").innerHTML = `<strong>${formatCurrency(total)}</strong><span>${state.receipts.length} nota${state.receipts.length === 1 ? "" : "s"} registrada${state.receipts.length === 1 ? "" : "s"}</span>`;
  document.getElementById("receiptList").innerHTML = state.receipts.length ? state.receipts
    .slice().sort((a, b) => (b.date || "").localeCompare(a.date || ""))
    .map(item => `<article class="receipt-row"><div class="receipt-icon">▤</div><div><strong>${escapeHtml(item.store)}</strong><span>${formatDate(item.date)} · ${escapeHtml(item.category || "Compra")}</span>${item.notes ? `<small>${escapeHtml(item.notes)}</small>` : ""}</div><strong>${formatCurrency(item.amount)}</strong><div class="row-actions">${item.fileName ? `<button class="tiny-button" type="button" data-view-receipt="${item.id}">Ver nota</button>` : ""}<button class="tiny-button danger" type="button" data-delete-receipt="${item.id}">Excluir</button></div></article>`).join("")
    : `<div class="empty-state compact"><strong>Nenhuma nota registrada</strong>Adicione comprovantes das compras da ação.</div>`;
}

function openPixShare() {
  const fundraising = state.fundraising || seedData.fundraising;
  const hasPix = Boolean(fundraising.key && fundraising.holder);
  const moneyPct = percentage(fundraising.received, fundraising.goal);
  document.getElementById("pixShareContent").innerHTML = hasPix ? `
    <p class="pix-share-intro">Sua contribuição ajuda a transformar doações em cuidado, alegria e sorrisos.</p>
    <div class="pix-share-key"><span>${escapeHtml(fundraising.keyType)}</span><strong>${escapeHtml(fundraising.key)}</strong><small>Titular: ${escapeHtml(fundraising.holder)}${fundraising.bank ? ` · ${escapeHtml(fundraising.bank)}` : ""}</small></div>
    <button class="primary-button wide-button" type="button" data-copy-pix>Copiar chave Pix</button>
    ${Number(fundraising.goal) > 0 ? `<div class="money-progress public-money"><div><strong>${formatCurrency(fundraising.received)}</strong><span> de ${formatCurrency(fundraising.goal)} · ${moneyPct}%</span></div><div class="bar"><span style="width:${moneyPct}%"></span></div></div>` : ""}
    <p class="pix-safety">Antes de confirmar, confira no aplicativo do banco se o nome do titular corresponde ao informado acima.</p>` : `
    <div class="pix-empty public"><span>♡</span><div><strong>A chave Pix será cadastrada em breve</strong><p>A conta oficial da ação ainda está sendo preparada. Volte em breve para fazer sua doação com segurança.</p></div></div>`;
  document.getElementById("pixBackdrop").hidden = false;
  document.body.style.overflow = "hidden";
  document.getElementById("closePix").focus();
}

function closePixShare() {
  document.getElementById("pixBackdrop").hidden = true;
  document.body.style.overflow = "";
}

function renderTasks() {
  const tasks = taskOwnerFilter === "all" ? state.tasks : state.tasks.filter(item => item.owner === taskOwnerFilter);
  document.getElementById("taskBoard").innerHTML = Object.entries(taskStatusLabels).map(([status, label]) => {
    const columnTasks = tasks.filter(item => item.status === status).sort((a, b) => (a.due || "9999").localeCompare(b.due || "9999"));
    return `<section class="task-column"><header class="task-column-header"><h3>${label}</h3><span>${columnTasks.length}</span></header><div class="task-stack">${columnTasks.map(item => `
      <article class="task-card"><div class="task-topline"><span class="priority priority-${item.priority}">${item.priority}</span><span class="cell-label">${formatDate(item.due)}</span></div><h4>${escapeHtml(item.title)}</h4><div class="task-meta"><span class="owner"><span class="owner-initial">${escapeHtml(item.owner.slice(0,1))}</span>${escapeHtml(item.owner)}</span></div><div class="task-card-actions">${status !== "done" ? `<button class="tiny-button" type="button" data-advance-task="${item.id}">${status === "todo" ? "Iniciar" : "Concluir"}</button>` : ""}<button class="tiny-button" type="button" data-edit-task="${item.id}">Editar</button><button class="tiny-button danger" type="button" data-delete-task="${item.id}">Excluir</button></div></article>`).join("") || `<div class="empty-state">Nada aqui ainda.</div>`}</div></section>`;
  }).join("");
}

function renderAll() {
  updateCountdown();
  renderOverview();
  renderPartners();
  renderDonations();
  renderFinance();
  renderReceipts();
  renderTasks();
  document.getElementById("partnerTabCount").textContent = state.partners.length;
  document.getElementById("donationTabCount").textContent = state.donations.length;
  document.getElementById("taskTabCount").textContent = state.tasks.filter(item => item.status !== "done").length;
}

const fieldTemplates = {
  partner: item => `
    ${field("company", "Empresa ou organização", item.company, "text", true)}
    ${field("sector", "Segmento", item.sector, "text", true)}
    ${field("person", "Pessoa de contato", item.person)}
    ${selectField("channel", "Canal", item.channel, [["WhatsApp","WhatsApp"],["Telefone","Telefone"],["E-mail","E-mail"],["Presencial","Presencial"]])}
    ${field("contact", "Telefone ou e-mail", item.contact)}
    ${selectField("status", "Situação", item.status, Object.entries(statusLabels).map(([v,l]) => [v,l]), true)}
    ${field("lastContact", "Data do último contato", item.lastContact, "date")}
    ${field("request", "Pedido de apoio", item.request, "text", false, true)}
    ${textareaField("notes", "Resposta / observações", item.notes)}
  `,
  donation: item => `
    ${field("name", "Item", item.name, "text", true)}
    ${selectField("category", "Categoria", item.category, ["Presentes","Doces","Alimentos","Bebidas","Descartáveis","Outros"].map(v => [v,v]), true)}
    ${field("needed", "Quantidade necessária", item.needed, "number", true)}
    ${field("received", "Quantidade recebida", item.received, "number", true)}
    ${field("unit", "Unidade", item.unit, "text", true)}
    ${field("donor", "Doador(es)", item.donor)}
  `,
  task: item => `
    ${field("title", "Tarefa", item.title, "text", true, true)}
    ${selectField("owner", "Responsável", item.owner, ["Tainara","Joice","Leandro","Voluntários"].map(v => [v,v]), true)}
    ${field("due", "Prazo", item.due, "date", true)}
    ${selectField("priority", "Prioridade", item.priority, [["alta","Alta"],["media","Média"],["baixa","Baixa"]], true)}
    ${selectField("status", "Andamento", item.status, Object.entries(taskStatusLabels).map(([v,l]) => [v,l]), true)}
    ${textareaField("notes", "Observações", item.notes)}
  `,
  pix: item => `
    ${field("holder", "Nome do titular", item.holder, "text", true)}
    ${field("bank", "Banco ou instituição", item.bank)}
    ${selectField("keyType", "Tipo de chave", item.keyType, [["CPF","CPF"],["CNPJ","CNPJ"],["E-mail","E-mail"],["Telefone","Telefone"],["Chave aleatória","Chave aleatória"]], true)}
    ${field("key", "Chave Pix", item.key, "text", true)}
    ${currencyField("goal", "Meta em dinheiro", item.goal)}
    ${currencyField("received", "Valor já recebido", item.received)}
  `,
  receipt: item => `
    ${field("store", "Estabelecimento", item.store, "text", true)}
    ${field("date", "Data da compra", item.date, "date", true)}
    ${currencyField("amount", "Valor da nota", item.amount, true)}
    ${selectField("category", "Categoria", item.category, ["Presentes","Doces","Alimentos","Bebidas","Descartáveis","Outros"].map(v => [v,v]), true)}
    ${textareaField("notes", "Descrição da compra", item.notes)}
    <div class="field full"><label for="field-file">Foto ou PDF da nota</label><input id="field-file" name="attachment" type="file" accept="image/*,application/pdf"><small>Formatos aceitos: imagem ou PDF, até 10 MB.</small></div>
  `
};

function field(name, label, value = "", type = "text", required = false, full = false) {
  return `<div class="field ${full ? "full" : ""}"><label for="field-${name}">${label}${required ? " <span>*</span>" : ""}</label><input id="field-${name}" name="${name}" type="${type}" value="${escapeHtml(value)}" ${type === "number" ? "min=\"0\" step=\"1\"" : ""} ${required ? "required" : ""}></div>`;
}
function selectField(name, label, value, options, required = false) {
  return `<div class="field"><label for="field-${name}">${label}${required ? " <span>*</span>" : ""}</label><select id="field-${name}" name="${name}" ${required ? "required" : ""}>${options.map(([v,l]) => `<option value="${escapeHtml(v)}" ${v === value ? "selected" : ""}>${escapeHtml(l)}</option>`).join("")}</select></div>`;
}
function currencyField(name, label, value = 0, required = false) {
  return `<div class="field"><label for="field-${name}">${label}${required ? " <span>*</span>" : ""}</label><input id="field-${name}" name="${name}" type="number" min="0" step="0.01" value="${escapeHtml(value)}" ${required ? "required" : ""}></div>`;
}
function textareaField(name, label, value = "") {
  return `<div class="field full"><label for="field-${name}">${label}</label><textarea id="field-${name}" name="${name}">${escapeHtml(value)}</textarea></div>`;
}

function openModal(type, id = null) {
  activeModal = type;
  editingId = id;
  const collection = type === "partner" ? state.partners : type === "donation" ? state.donations : type === "task" ? state.tasks : [];
  const defaults = type === "partner"
    ? { company: "", sector: "", person: "", channel: "WhatsApp", contact: "", status: "contatar", lastContact: "", request: "", notes: "" }
    : type === "donation"
      ? { name: "", category: "Alimentos", needed: 0, received: 0, unit: "unidades", donor: "" }
      : type === "task"
        ? { title: "", owner: "Tainara", due: "", priority: "media", status: "todo", notes: "" }
        : type === "receipt"
          ? { store: "", date: new Date().toISOString().slice(0, 10), amount: "", category: "Alimentos", notes: "" }
          : state.fundraising || seedData.fundraising;
  const item = id ? collection.find(entry => entry.id === id) : defaults;
  const labels = {
    partner: ["REDE DE APOIO", id ? "Editar parceiro" : "Cadastrar parceiro"],
    donation: ["DOAÇÕES", id ? "Atualizar item" : "Cadastrar item"],
    task: ["EQUIPE", id ? "Editar tarefa" : "Nova tarefa"],
    pix: ["DOAÇÃO EM DINHEIRO", "Configurar conta Pix"],
    receipt: ["TRANSPARÊNCIA", "Adicionar nota de compra"]
  };
  document.getElementById("modalKicker").textContent = labels[type][0];
  document.getElementById("modalTitle").textContent = labels[type][1];
  document.getElementById("modalFields").innerHTML = fieldTemplates[type](item);
  document.getElementById("formError").textContent = "";
  document.getElementById("modalBackdrop").hidden = false;
  document.body.style.overflow = "hidden";
  setTimeout(() => document.querySelector("#modalFields input, #modalFields select")?.focus(), 50);
}
function closeModal() {
  document.getElementById("modalBackdrop").hidden = true;
  document.body.style.overflow = "";
  activeModal = null;
  editingId = null;
}

async function saveModal(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const required = [...form.querySelectorAll("[required]")];
  required.forEach(input => input.closest(".field").classList.toggle("invalid", !String(input.value).trim()));
  if (required.some(input => !String(input.value).trim())) {
    document.getElementById("formError").textContent = "Preencha os campos obrigatórios para salvar.";
    required.find(input => !String(input.value).trim())?.focus();
    return;
  }
  const values = Object.fromEntries(new FormData(form).entries());
  if (activeModal === "donation") {
    values.needed = Number(values.needed);
    values.received = Number(values.received);
    if (values.needed <= 0) {
      document.getElementById("formError").textContent = "A quantidade necessária deve ser maior que zero.";
      document.getElementById("field-needed").focus();
      return;
    }
  }
  if (activeModal === "pix") {
    values.goal = Number(values.goal || 0);
    values.received = Number(values.received || 0);
    state.fundraising = values;
    saveState();
    closeModal();
    showToast("Conta Pix e valores atualizados.");
    return;
  }
  if (activeModal === "receipt") {
    const attachment = form.querySelector("#field-file").files[0];
    if (attachment && attachment.size > 10 * 1024 * 1024) {
      document.getElementById("formError").textContent = "O arquivo deve ter no máximo 10 MB.";
      return;
    }
    if (attachment && !attachment.type.startsWith("image/") && attachment.type !== "application/pdf") {
      document.getElementById("formError").textContent = "Envie uma imagem ou um arquivo PDF.";
      return;
    }
    const receiptId = uid("r");
    try {
      if (attachment) await saveReceiptFile(receiptId, attachment);
      state.receipts.push({ id: receiptId, store: values.store, date: values.date, amount: Number(values.amount), category: values.category, notes: values.notes, fileName: attachment?.name || "" });
      saveState();
      closeModal();
      showToast("Nota de compra registrada.");
    } catch (error) {
      console.warn("Não foi possível guardar o anexo.", error);
      document.getElementById("formError").textContent = "Não foi possível guardar esse arquivo neste navegador.";
    }
    return;
  }
  const collectionName = activeModal === "partner" ? "partners" : activeModal === "donation" ? "donations" : "tasks";
  const wasEditing = Boolean(editingId);
  if (wasEditing) {
    state[collectionName] = state[collectionName].map(item => item.id === editingId ? { ...item, ...values } : item);
  } else {
    const prefix = activeModal.slice(0, 1);
    state[collectionName].push({ id: uid(prefix), ...values });
  }
  saveState();
  closeModal();
  showToast(wasEditing ? "Alterações salvas." : "Cadastro realizado com sucesso.");
}

function deleteItem(type, id) {
  if (!window.confirm("Excluir este item? Essa ação não poderá ser desfeita.")) return;
  const collectionName = type === "partner" ? "partners" : type === "donation" ? "donations" : "tasks";
  state[collectionName] = state[collectionName].filter(item => item.id !== id);
  saveState();
  showToast("Item excluído.");
}

async function deleteReceipt(id) {
  if (!window.confirm("Excluir esta nota e o arquivo anexado?")) return;
  state.receipts = state.receipts.filter(item => item.id !== id);
  try { await removeReceiptFile(id); } catch (error) { console.warn("O anexo não pôde ser removido.", error); }
  saveState();
  showToast("Nota excluída.");
}

async function viewReceipt(id) {
  try {
    const file = await getReceiptFile(id);
    if (!file) return showToast("O anexo desta nota não está neste aparelho.");
    const url = URL.createObjectURL(file);
    const viewer = window.open(url, "_blank");
    if (viewer) viewer.opener = null;
    if (!viewer) showToast("Permita a abertura de uma nova janela para ver a nota.");
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  } catch (error) {
    console.warn("Não foi possível abrir o anexo.", error);
    showToast("Não foi possível abrir esse anexo.");
  }
}

async function copyPixKey() {
  const key = state.fundraising?.key;
  if (!key) return showToast("A chave Pix ainda não foi cadastrada.");
  try {
    await navigator.clipboard.writeText(key);
    showToast("Chave Pix copiada.");
  } catch (error) {
    window.prompt("Copie a chave Pix:", key);
  }
}

function initEventPreviews() {
  const previews = [...document.querySelectorAll("[data-event-preview]")];
  if (!previews.length) return;

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reducedMotion) {
    previews.forEach(video => video.pause());
    return;
  }

  const playPreview = video => video.play().catch(() => {});
  previews.forEach(video => {
    video.muted = true;
    video.addEventListener("timeupdate", () => {
      if (video.currentTime >= 10) {
        video.currentTime = 0;
        if (video.dataset.inView === "true") playPreview(video);
      }
    });
  });

  if (!("IntersectionObserver" in window)) {
    previews.forEach(video => {
      video.dataset.inView = "true";
      playPreview(video);
    });
    return;
  }

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      const video = entry.target;
      video.dataset.inView = String(entry.isIntersecting);
      if (entry.isIntersecting) playPreview(video);
      else video.pause();
    });
  }, { threshold: 0.18 });

  previews.forEach(video => observer.observe(video));
}

function advanceTask(id) {
  state.tasks = state.tasks.map(item => item.id === id ? { ...item, status: item.status === "todo" ? "doing" : "done" } : item);
  saveState();
  showToast("Andamento da tarefa atualizado.");
}

function exportBackup() {
  const blob = new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), ...state }, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `acao-social-sao-benedito-${new Date().toISOString().slice(0,10)}.json`;
  link.click();
  URL.revokeObjectURL(url);
  showToast("Backup baixado.");
}

async function importBackup(file) {
  try {
    const data = JSON.parse(await file.text());
    if (!Array.isArray(data.partners) || !Array.isArray(data.donations) || !Array.isArray(data.tasks)) throw new Error("Formato inválido");
    state = migrateState({ schemaVersion: data.schemaVersion || 1, partners: data.partners, donations: data.donations, tasks: data.tasks, fundraising: data.fundraising, receipts: data.receipts });
    saveState();
    showToast("Backup restaurado com sucesso.");
  } catch (error) {
    showToast("Não foi possível restaurar esse arquivo.");
  }
}

document.addEventListener("click", event => {
  const galleryItem = event.target.closest("[data-lightbox]");
  if (galleryItem) openLightbox(galleryItem.dataset.lightbox, galleryItem.dataset.alt || "Foto do evento");
  const tab = event.target.closest("[data-tab]");
  if (tab) setTab(tab.dataset.tab);
  const goTab = event.target.closest("[data-go-tab]");
  if (goTab) setTab(goTab.dataset.goTab);
  if (event.target.closest("[data-action='add-partner']")) openModal("partner");
  if (event.target.closest("[data-action='add-donation']")) openModal("donation");
  if (event.target.closest("[data-action='add-task']")) openModal("task");
  if (event.target.closest("[data-action='configure-pix']")) openModal("pix");
  if (event.target.closest("[data-action='add-receipt']")) openModal("receipt");
  if (event.target.closest("[data-action='view-pix']")) openPixShare();
  if (event.target.closest("[data-copy-pix]")) copyPixKey();

  const editPartner = event.target.closest("[data-edit-partner]");
  if (editPartner) openModal("partner", editPartner.dataset.editPartner);
  const editDonation = event.target.closest("[data-edit-donation]");
  if (editDonation) openModal("donation", editDonation.dataset.editDonation);
  const editTask = event.target.closest("[data-edit-task]");
  if (editTask) openModal("task", editTask.dataset.editTask);

  const deletePartner = event.target.closest("[data-delete-partner]");
  if (deletePartner) deleteItem("partner", deletePartner.dataset.deletePartner);
  const deleteDonation = event.target.closest("[data-delete-donation]");
  if (deleteDonation) deleteItem("donation", deleteDonation.dataset.deleteDonation);
  const deleteTask = event.target.closest("[data-delete-task]");
  if (deleteTask) deleteItem("task", deleteTask.dataset.deleteTask);
  const viewReceiptButton = event.target.closest("[data-view-receipt]");
  if (viewReceiptButton) viewReceipt(viewReceiptButton.dataset.viewReceipt);
  const deleteReceiptButton = event.target.closest("[data-delete-receipt]");
  if (deleteReceiptButton) deleteReceipt(deleteReceiptButton.dataset.deleteReceipt);
  const advance = event.target.closest("[data-advance-task]");
  if (advance) advanceTask(advance.dataset.advanceTask);

  const ownerChip = event.target.closest("[data-owner]");
  if (ownerChip) {
    taskOwnerFilter = ownerChip.dataset.owner;
    document.querySelectorAll("[data-owner]").forEach(chip => chip.classList.toggle("active", chip === ownerChip));
    renderTasks();
  }
});

document.getElementById("partnerSearch").addEventListener("input", renderPartners);
document.getElementById("partnerFilter").addEventListener("change", renderPartners);
document.getElementById("modalForm").addEventListener("submit", saveModal);
document.getElementById("closeModal").addEventListener("click", closeModal);
document.getElementById("cancelModal").addEventListener("click", closeModal);
document.getElementById("modalBackdrop").addEventListener("click", event => { if (event.target.id === "modalBackdrop") closeModal(); });
document.addEventListener("keydown", event => {
  if (event.key !== "Escape") return;
  if (!document.getElementById("modalBackdrop").hidden) closeModal();
  if (!document.getElementById("pixBackdrop").hidden) closePixShare();
});
document.getElementById("backupButton").addEventListener("click", exportBackup);
document.getElementById("importButton").addEventListener("click", () => document.getElementById("importFile").click());
document.getElementById("importFile").addEventListener("change", event => { if (event.target.files[0]) importBackup(event.target.files[0]); event.target.value = ""; });
document.getElementById("lightboxClose").addEventListener("click", closeLightbox);
document.getElementById("lightbox").addEventListener("click", event => { if (event.target.id === "lightbox") closeLightbox(); });
document.addEventListener("keydown", event => { if (event.key === "Escape" && !document.getElementById("lightbox").hidden) closeLightbox(); });
document.getElementById("closePix").addEventListener("click", closePixShare);
document.getElementById("pixBackdrop").addEventListener("click", event => { if (event.target.id === "pixBackdrop") closePixShare(); });
document.getElementById("syncForm").addEventListener("submit", submitSync);
document.getElementById("syncSignup").addEventListener("click", signupSync);
document.getElementById("syncSignout").addEventListener("click", () => {
  setSession(null);
  pendingSnapshot = null;
  syncStatus("Conectar o painel", "Entre na sua conta para acessar os dados salvos.");
});

initEventPreviews();
renderAll();
restoreSession();
