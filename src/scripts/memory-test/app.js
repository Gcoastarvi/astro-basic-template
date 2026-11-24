/* BrainoDad Exam Memory Test — live version of the approved prototype (v4).
   Screens, wording, timings and scoring are the prototype's. What changed for the live site:
   - Results, WhatsApp number and consent are saved on our server (new table), not only in the browser.
   - The full report goes to WhatsApp (WANotifier) with a personal link to /memory-test/report.
   - The after-class test lives at /memory-test/after and opens only with the same WhatsApp number
     AND when Aravind switches it on in the admin page.
   - Prototype-only buttons (trainer switch, "see full report", "start fresh") are removed.
   - Meta Pixel events (new BrainoDad pixel only) at each step, with no personal data. */
import { PAIRS, LEVELS_CONTENT, T, PARTS, LEVELS, MSG, levelOf, SCHOOL_TRACKS, VERSION } from "./content.js";
import { api, setBase } from "./api.js";
import { getAttrib, metaIds, pixel, taggedLink } from "./track.js";

/* ================= SETUP ================= */
const $app = document.getElementById("app");
const MODE = $app.dataset.mode || "before"; // before | after | report
setBase($app.dataset.api);
const CFG = { joinUrl: $app.dataset.join, classLabel: "This Sunday · 5–7 PM", courseUrl: "", courseLabel: "Join the 21-Day Course · ₹3,500", waMode: "manual", waChatNumber: "" };
/* manual = Aravind sends each report himself, so promise "within a few hours", not "in a minute" */
const etaText = () => (CFG.waMode === "auto" ? "Free. Arrives in under a minute." : "Free. Sent personally to your WhatsApp within a few hours.");
const attrib = getAttrib();

function howText(i) {
  const C = S.C, L = LEVELS_CONTENT[S.lvl];
  return [
    `Study ${C.words.length} key terms for ${T.recallStudy} seconds. Then you get ${T.recallAnswer} seconds to type every term you remember.`,
    `Study ${C.seq.length} events in order for ${T.seqStudy} seconds. Then you get ${T.seqAnswer} seconds to put them back in the same order.`,
    `Study 6 places and their numbers for ${T.factsStudy} seconds. Then you get ${T.factsAnswer} seconds to type each number.`,
    `Read a short paragraph for ${L.readSec} seconds. Then answer 5 questions, ${T.perQuestion} seconds each.`,
    `Surprise! Type the key terms from Task 1 again, without seeing them. You get ${T.laterAnswer} seconds.`,
  ][i];
}

/* ================= HELPERS ================= */
let timers = [];
const later = (fn, ms) => { const t = setTimeout(fn, ms); timers.push(t); return t; };
const clearTimers = () => { timers.forEach((t) => clearTimeout(t)); timers = []; };
function show(html) { clearTimers(); $app.innerHTML = '<div class="fade">' + html + "</div>"; window.scrollTo(0, 0); }
const shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const $ = (id) => document.getElementById(id);
const fmt = (n) => (Number.isInteger(n) ? String(n) : n.toFixed(1));
const KEY = "bd_exam_memory_live_v4";
function load() { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } }
function save(o) { try { localStorage.setItem(KEY, JSON.stringify(o)); } catch (e) {} }
let store = load();
const rid = () => { const a = new Uint8Array(12); (window.crypto || {}).getRandomValues ? crypto.getRandomValues(a) : a.forEach((_, i) => (a[i] = Math.random() * 256)); return Array.from(a, (b) => b.toString(16).padStart(2, "0")).join(""); };
if (!store.anon) { store.anon = rid(); save(store); }
let S = {};
function newRun(phase, lvl) {
  const form = phase === "after" ? "B" : "A";
  S = { phase, lvl, form, C: LEVELS_CONTENT[lvl][form], pairs: PAIRS[form], scores: {}, detail: {}, skipped: [], part: 0, id: rid() };
  api.start({ attemptId: S.id, anonId: store.anon, phase, track: lvl, form, version: VERSION, attrib, beforeAttemptId: phase === "after" ? store.beforeId || null : null, afterToken: phase === "after" ? store.afterToken || null : null });
  pixel("TestStart", { phase });
}
/* 10-digit Indian mobile, starting 6–9 */
const cleanPhone = (v) => { const d = String(v || "").replace(/\D/g, "").slice(-10); return /^[6-9]\d{9}$/.test(d) ? d : ""; };
const WA_ICON = '<svg class="waic" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2c-1.5 0-3-.4-4.3-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.2-.4.3-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.4.1-.6.3-.2.2-.8.8-.8 2s.8 2.3 1 2.5c.1.2 1.7 2.6 4.1 3.6 1.5.7 2.1.7 2.9.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.2-.2-.4-.2z"/></svg>';

/* timer row: a calm bar plus "45s left"; no red, no sound */
const timerRow = `<div class="tline" aria-hidden="true"><div class="timer"><i id="tbar"></i></div><span class="tsec" id="tsec"></span></div><p class="warn" id="twarn" aria-live="polite"></p>`;
function countdown(sec, onEnd, warnText) {
  const bar = $("tbar"), lab = $("tsec"); const t0 = performance.now();
  if (bar) { bar.style.transitionDuration = sec * 1000 + "ms"; requestAnimationFrame(() => requestAnimationFrame(() => { bar.style.width = "0%"; })); }
  const tick = () => {
    const rem = Math.max(0, Math.ceil(sec - (performance.now() - t0) / 1000));
    if (lab) lab.textContent = rem + "s left";
    if (warnText && rem <= 10 && rem > 0) { const w = $("twarn"); if (w && !w.textContent) w.textContent = warnText; }
    if (rem > 0) later(tick, 250);
  };
  tick();
  let done = false; const fin = () => { if (done) return; done = true; onEnd(); };
  later(fin, sec * 1000); return fin;
}
function study(sec, onEnd) {
  const fin = countdown(sec, onEnd, null);
  const r = $("ready"); if (r) r.onclick = () => { S.skipped.push(PARTS[S.part].key); fin(); };
}

/* lenient word matching: case, spaces, small slips and swapped letters are forgiven */
const norm = (s) => s.toLowerCase().replace(/[^a-z]/g, "");
function lev(a, b) {
  const m = a.length, n = b.length; const d = [...Array(m + 1)].map((_, i) => [i].concat(Array(n).fill(0))); for (let j = 1; j <= n; j++) d[0][j] = j;
  for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++) {
    d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
  }
  return d[m][n];
}
function matchWords(typed, targets) {
  const found = new Set();
  typed.forEach((t) => {
    const x = norm(t); if (x.length < 3) return;
    let best = null, bd = 9; targets.forEach((w) => { const dd = lev(x, norm(w)); if (dd < bd) { bd = dd; best = w; } });
    const allow = norm(best).length >= 8 ? 2 : 1; if (bd <= allow) found.add(best);
  });
  return found;
}
/* order scoring by correct neighbours: credit for each pair placed in the right sequence */
function neighbourScore(placedItems, seq) {
  let ok = 0; for (let k = 0; k + 1 < placedItems.length; k++) { const a = seq.indexOf(placedItems[k]), b = seq.indexOf(placedItems[k + 1]); if (b === a + 1) ok++; }
  return ok;
}
function progress(i) {
  let s = '<div class="topline"><span>Task ' + (i + 1) + " of 5 · " + esc(PARTS[i].name) + "</span><span>" + (S.phase === "after" ? "After class" : "Before class") + '</span></div><div class="prog" aria-hidden="true">';
  for (let k = 0; k < 5; k++) s += '<span class="' + (k < i ? "done" : k === i ? "now" : "") + '"></span>';
  return s + "</div>";
}

/* ================= SCREENS ================= */
function home() {
  if (store.before && store.after) return compare(false);
  if (store.before) return offer(true);
  let pick = store.lvl || "";
  show(`
  <div class="stack">
    <span class="brand">BrainoDad · Exam Memory Test</span>
    ${store.savedKey ? `<div class="callout"><b>Welcome back! Your child's test is ready.</b><br><span class="small">Give the phone to your child and tap "Start my free test" below. The full report will come to your WhatsApp.</span></div>` : ""}
    <h1>Free Study Memory Test</h1>
    <div class="wabox">${WA_ICON}<div><b>Your full report comes on WhatsApp</b></div></div>
    <div class="facts">
      <div class="fact"><b>6–8 min</b><span>never more than 10</span></div>
      <div class="fact"><b>Free</b><span>no payment</span></div>
      <div class="fact wafact"><b>Report</b><span>on WhatsApp</span></div>
    </div>
    <div class="badge"><span>Created by <b>Aravind Pasupathy</b>, Guinness World Record holder in memory</span></div>
    <h3 id="lvlh">Tap your level</h3>
    <div class="stack" style="gap:8px" role="radiogroup" aria-label="Choose your level">
      ${["ms", "hs", "comp"].map((k) => `<button class="track${pick === k ? " on" : ""}" data-k="${k}" role="radio" aria-checked="${pick === k}"><b>${esc(LEVELS_CONTENT[k].label)}</b><span>${esc(LEVELS_CONTENT[k].sub)}</span></button>`).join("")}
    </div>
    <label for="nm">Your first name <span class="muted small">(optional)</span></label>
    <input id="nm" type="text" autocomplete="given-name" maxlength="20" placeholder="e.g. Priya" value="${esc(store.name || "")}">
    <p class="wanote">${WA_ICON.replace('class="waic"', 'class="waic"')}<span>Keep your WhatsApp number ready for your full report.</span></p>
    <div id="askchild" class="card stack" style="border-color:var(--gold)${store.savedKey || !(pick === "ms" || pick === "hs") ? ";display:none" : ""}">
      <h3>Is your child with you right now?</h3>
      <div class="row" style="flex-wrap:nowrap">
        <button class="btn" id="yeskid" style="flex:1">Yes, start now</button>
        <button class="btn teal" id="later" style="flex:1">No, save it for tonight</button>
      </div>
      <p class="muted small">Busy now? We'll remind you on WhatsApp when your child is home.</p>
    </div>
    <button class="btn" id="go"${!store.savedKey && (pick === "ms" || pick === "hs") ? ' style="display:none"' : ""}>Start my free test</button>
    <p id="gomsg" class="warn center" aria-live="polite"></p>
    <div class="stack" style="gap:8px">
      ${PARTS.map((p, i) => `<div class="lp"><i>${i + 1}</i><div><b>${esc(p.name)}</b><small>${esc(p.exam)}</small></div></div>`).join("")}
    </div>
    <p class="note">No notes, no screenshots. Just your memory.</p>
  </div>`);
  document.querySelectorAll(".track").forEach((b) => (b.onclick = () => {
    pick = b.dataset.k;
    document.querySelectorAll(".track").forEach((x) => { x.classList.toggle("on", x === b); x.setAttribute("aria-checked", x === b); }); $("gomsg").textContent = "";
    const school = pick === "ms" || pick === "hs";
    if (!store.savedKey) { $("askchild").style.display = school ? "" : "none"; $("go").style.display = school ? "none" : ""; }
  }));
  $("later").onclick = () => saveForLater(pick === "ms" || pick === "hs" ? pick : "");
  $("yeskid").onclick = () => $("go").onclick();
  $("go").onclick = () => {
    if (!pick) { $("gomsg").textContent = "Please tap your level above first."; $("lvlh").scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "center" }); return; }
    store.name = $("nm").value.trim().slice(0, 20); store.lvl = pick; save(store); newRun("before", pick); intro(0);
  };
}

/* ---------- "My child isn't with me now – save it for tonight" (school levels only) ---------- */
function slotChoices() {
  const h = Number(new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kolkata", hour: "numeric", hourCycle: "h23" }).format(new Date()));
  const list = [];
  if (h < 17) list.push(["t18", "Today 6 PM"]);
  if (h < 19) list.push(["t20", "Today 8 PM"]);
  list.push(["tm19", "Tomorrow 7 PM"], ["sat10", "Saturday 10 AM"]);
  return list;
}
function saveForLater(lvl) {
  let track = lvl, slot = "";
  const consentText = "I am the parent or guardian. Send the test reminder and my child's report to this number.";
  show(`
  <div class="stack">
    <span class="brand">BrainoDad · Exam Memory Test</span>
    <h2>Save the test for tonight</h2>
    <p class="muted">Your child takes the 7-minute test when they are home, on your phone. We send you a reminder on WhatsApp with a personal link, and your child's full report comes to you.</p>
    <h3>Your child's class</h3>
    <div class="stack" style="gap:8px" role="radiogroup" aria-label="Child's class">
      ${["ms", "hs"].map((k) => `<button class="track${track === k ? " on" : ""}" data-k="${k}" role="radio" aria-checked="${track === k}"><b>${esc(LEVELS_CONTENT[k].label)}</b><span>${esc(LEVELS_CONTENT[k].sub)}</span></button>`).join("")}
    </div>
    <h3>When is your child free?</h3>
    <div class="pick" role="radiogroup" aria-label="Reminder time">
      ${slotChoices().map(([k, l]) => `<button type="button" class="slotbtn" data-s="${k}" role="radio" aria-checked="false">${esc(l)}</button>`).join("")}
    </div>
    <form class="card stack" id="sv">
      <label for="sph">Your WhatsApp number</label>
      <input id="sph" type="tel" inputmode="numeric" autocomplete="tel" placeholder="98765 43210" maxlength="14" value="${esc(store.phone || "")}">
      <label class="check"><input type="checkbox" id="scons"> ${consentText}</label>
      <button class="btn teal" id="svgo">Save and remind me</button>
      <p id="svm" class="warn" aria-live="polite"></p>
    </form>
    <button class="linkbtn" id="back">My child is here · Start the test now</button>
  </div>`);
  document.querySelectorAll(".track").forEach((b) => (b.onclick = () => {
    track = b.dataset.k; document.querySelectorAll(".track").forEach((x) => { x.classList.toggle("on", x === b); x.setAttribute("aria-checked", x === b); });
  }));
  document.querySelectorAll(".slotbtn").forEach((b) => (b.onclick = () => {
    slot = b.dataset.s; document.querySelectorAll(".slotbtn").forEach((x) => { x.classList.toggle("on", x === b); x.setAttribute("aria-checked", x === b); });
  }));
  $("back").onclick = () => home();
  $("sv").onsubmit = async (e) => {
    e.preventDefault(); const m = $("svm"); const d = cleanPhone($("sph").value);
    if (!track) { m.textContent = "Please tap your child's class."; return; }
    if (!slot) { m.textContent = "Please tap when your child is free."; return; }
    if (!d) { m.textContent = "Please enter a 10-digit WhatsApp number."; return; }
    if (!$("scons").checked) { m.textContent = "Please tick the box so we can send the reminder."; return; }
    const btn = $("svgo"); btn.disabled = true; btn.textContent = "Saving…";
    const r = await api.save({ phone: d, consent: true, consentText, track, slot, anonId: store.anon, attrib });
    btn.disabled = false; btn.textContent = "Save and remind me";
    if (!r.ok || !r.data.token) { m.textContent = "We couldn't reach our server. Check your internet and tap the button again."; return; }
    store.savedKey = r.data.token; store.lvl = track; store.phone = d; save(store);
    savedDone(r.data.remindLabel || "");
  };
}
function savedDone(label) {
  const chat = CFG.waChatNumber ? `<a class="btn teal" href="https://wa.me/91${esc(CFG.waChatNumber)}?text=${encodeURIComponent("Hi! Please send me the memory test reminder.")}" target="_blank" rel="noopener">Say Hi on WhatsApp so the reminder reaches you</a>` : "";
  show(`
  <div class="stack">
    <span class="brand">Saved</span>
    <h2>Done! We'll remind you ${esc(label)}.</h2>
    <div class="wabox">${WA_ICON}<div><b>Watch your WhatsApp</b><p>You'll get a message from BrainoDad with your child's personal test link. Just open it and give your phone to your child.</p></div></div>
    ${chat}
    <div class="card stack">
      <p><b>Is your child free now after all?</b></p>
      <button class="btn" id="now">Start the test now</button>
    </div>
  </div>`);
  $("now").onclick = () => home();
}

/* ---------- /memory-test/after: opens only with the same WhatsApp number, and only when Aravind switches it on ---------- */
function afterGate(msg) {
  if (store.before && store.after) return compare(false);
  show(`
  <div class="stack">
    <span class="brand">BrainoDad · After-class test</span>
    <h1>Your after-class memory test</h1>
    <p class="muted">Enter the WhatsApp number you used for your before-class test. Your result will be compared with it.</p>
    <form class="card stack" id="af">
      <label for="aph">WhatsApp number</label>
      <input id="aph" type="tel" inputmode="numeric" autocomplete="tel" placeholder="98765 43210" maxlength="14" value="${esc(store.phone || "")}">
      <button class="btn teal" id="afgo">Continue</button>
      <p id="amsg" class="muted small" aria-live="polite">${msg || ""}</p>
    </form>
    <p class="note">Haven't taken the free test yet? <a class="linkbtn" href="/memory-test">Take it here</a></p>
  </div>`);
  $("af").onsubmit = async (e) => {
    e.preventDefault(); const m = $("amsg"); const d = cleanPhone($("aph").value);
    if (!d) { m.textContent = "Please enter your 10-digit WhatsApp number."; return; }
    const btn = $("afgo"); btn.disabled = true; btn.textContent = "Checking…";
    const r = await api.afterCheck({ phone: d, anonId: store.anon });
    btn.disabled = false; btn.textContent = "Continue";
    const st = r.data.status;
    if (!r.ok && !st) { m.textContent = "We couldn't reach our server. Check your internet and tap Continue again."; return; }
    if (st === "not_found") { m.textContent = "We couldn't find a before-class test with this number. Check the number, or take the free test first."; return; }
    const nm = r.data.firstName || "";
    if (st === "closed") { m.textContent = "Found you" + (nm ? ", " + nm : "") + "! This test opens during the live class. Keep this page ready."; return; }
    if (st === "done" && r.data.before && r.data.after) {
      Object.assign(store, { phone: d, name: nm, lvl: r.data.track, before: r.data.before, after: r.data.after, beforeId: r.data.beforeAttemptId }); save(store); return compare(false);
    }
    if (st === "open" && r.data.before) {
      Object.assign(store, { phone: d, name: nm, lvl: r.data.track, before: r.data.before, beforeId: r.data.beforeAttemptId, afterToken: r.data.afterToken }); delete store.after; save(store);
      newRun("after", r.data.track); intro(0); return;
    }
    m.textContent = "Something went wrong. Please tap Continue again.";
  };
}

function intro(i) {
  S.part = i; const P = PARTS[i];
  show(`${progress(i)}
  <div class="stack">
    <span class="brand">${i === 4 ? "Final task" : "Task " + (i + 1)} · ${P.pts} points</span>
    <h2>${esc(P.name)}</h2>
    <div class="card stack">
      <p>${howText(i)}</p>
      <p class="muted small"><b>For your exam:</b> ${esc(P.exam)}.</p>
    </div>
    <button class="btn" id="go">${i === 4 ? "Start the final task" : "I'm ready"}</button>
  </div>`);
  $("go").onclick = () => RUN[P.key]();
}
function partDone(i, frac, line) {
  const P = PARTS[i]; frac = Math.max(0, Math.min(1, frac));
  S.scores[P.key] = Math.round(frac * P.pts * 10) / 10;
  if (i < 4) pixel("Task" + (i + 1) + "Done", { phase: S.phase });
  const last = i === 4;
  const cheer = frac >= 0.8 ? "Excellent!" : frac >= 0.5 ? "Well done!" : frac > 0 ? "Good effort!" : "Task complete.";
  show(`${progress(i)}
  <div class="burst stack">
    <p class="brand">${esc(P.name)} done</p>
    <div class="big">${cheer}</div>
    <p style="font-size:1.15rem">${line}</p>
    <p class="muted small">${last ? (S.phase === "after" ? "Your before and after comparison is ready." : "Your level is ready. Your full report goes to your WhatsApp.") : i === 2 ? "Answers are revealed at the end. Your full report will be sent to your WhatsApp." : "Answers are revealed at the end."}</p>
  </div>
  <button class="btn" id="go">${last ? (S.phase === "after" ? "Show my before and after" : "Show my Exam Memory Score") : "Next: " + esc(PARTS[i + 1].name)}</button>
  ${last ? "" : `<p class="note">${4 - i} task${4 - i === 1 ? "" : "s"} left</p>`}`);
  $("go").onclick = () => (last ? finish() : intro(i + 1));
}

/* ---- typed free recall (Task 1 and Task 5); auto-saves when time ends ---- */
function recallInput(title, hint, sec, onDone) {
  const list = [];
  show(`${progress(S.part)}<div class="stack">
    <h3>${title}</h3>
    <p class="muted small">${hint}</p>
    ${timerRow}
    <form id="f" class="row" style="flex-wrap:nowrap">
      <input id="inp" type="text" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Type a term, press Enter" aria-label="Type a term">
      <button class="btn" style="width:auto;min-width:84px" id="add">Add</button>
    </form>
    <div class="entered" id="ent" aria-live="polite"></div>
    <p class="muted small" id="cnt">0 terms entered</p>
    <button class="btn teal" id="done">I'm done</button>
    <p class="note">Spelling slips are fine. You can type several terms with commas. When time ends, everything you typed is saved.</p></div>`);
  const inp = $("inp"); inp.focus();
  const paint = () => {
    $("ent").innerHTML = list.map((w, k) => `<span>${esc(w)}<button type="button" aria-label="remove ${esc(w)}" data-k="${k}">×</button></span>`).join("");
    $("cnt").textContent = list.length + " term" + (list.length === 1 ? "" : "s") + " entered";
    document.querySelectorAll("#ent button").forEach((b) => (b.onclick = () => { list.splice(+b.dataset.k, 1); paint(); }));
  };
  const push = () => { inp.value.split(/[,;\n]+/).map((s) => s.trim()).filter(Boolean).forEach((w) => { if (!list.some((x) => norm(x) === norm(w))) list.push(w); }); inp.value = ""; paint(); };
  $("f").onsubmit = (e) => { e.preventDefault(); push(); inp.focus(); };
  const fin = countdown(sec, () => { push(); onDone(list); }, "10 seconds left. Add your last terms.");
  $("done").onclick = fin;
}

/* ---- Task 1: Keyword Recall ---- */
function runRecall() {
  const W = S.C.words;
  show(`${progress(0)}<div class="stack">
    <h3>Study these ${W.length} key terms</h3>
    ${timerRow}
    <div class="words">${shuffle(W).map((w) => `<div class="w">${esc(w)}</div>`).join("")}</div>
    <button class="btn ghost" id="ready">I've studied them</button></div>`);
  study(T.recallStudy, () => recallInput("Type every key term you remember",
    `Most students remember about half of them. Type every one you can, in any order. After class, try to beat your own number.`,
    T.recallAnswer, (typed) => {
      const found = matchWords(typed, W); S.detail.recall = [...found];
      partDone(0, found.size / W.length, `You remembered <b>${found.size} of ${W.length}</b> key terms.`);
    }));
}
/* ---- Task 2: Timeline Order ---- */
function runSeq() {
  const seq = S.C.seq; const n = seq.length;
  show(`${progress(1)}<div class="stack">
    <h3>${esc(S.C.seqTitle)}: remember the order</h3>
    ${timerRow}
    <div class="seqshow">${seq.map((e, i) => `<div><b>${i + 1}</b>${esc(e)}</div>`).join("")}</div>
    <button class="btn ghost" id="ready">I've got the order</button></div>`);
  study(T.seqStudy, () => {
    const opts = shuffle(seq); const placed = [];
    show(`${progress(1)}<div class="stack">
      <h3>Tap the events from first to last</h3>
      ${timerRow}
      <div class="slots">${seq.map((_, i) => `<div class="slot" id="s${i}"><b>${i + 1}</b><span></span></div>`).join("")}</div>
      <div class="pick">${opts.map((e, i) => `<button data-i="${i}">${esc(e)}</button>`).join("")}</div>
      <div class="row"><button class="btn ghost" id="undo" style="flex:1">Undo</button><button class="btn" id="chk" style="flex:2">I'm done</button></div></div>`);
    const btns = [...document.querySelectorAll(".pick button")];
    const paint = () => {
      seq.forEach((_, i) => { const s = $("s" + i); s.querySelector("span").textContent = placed[i] !== undefined ? opts[placed[i]] : ""; s.classList.toggle("full", placed[i] !== undefined); });
      btns.forEach((b) => (b.disabled = placed.includes(+b.dataset.i)));
    };
    btns.forEach((b) => (b.onclick = () => { if (placed.length < n) { placed.push(+b.dataset.i); paint(); } }));
    $("undo").onclick = () => { placed.pop(); paint(); };
    const fin = countdown(T.seqAnswer, () => {
      const items = placed.map((p) => opts[p]); const ok = neighbourScore(items, seq);
      S.detail.seqPlaced = items;
      partDone(1, ok / (n - 1), `You got <b>${ok} of ${n - 1}</b> links in the timeline right.`);
    }, "10 seconds left. Your order so far is saved.");
    $("chk").onclick = fin;
  });
}
/* ---- Task 3: Facts & Figures ---- */
function runFacts() {
  const nums = shuffle([...Array(88).keys()].map((k) => k + 11)).slice(0, 6);
  const P = S.pairs.map((w, i) => ({ w, n: nums[i] })); S.detail.facts = P;
  show(`${progress(2)}<div class="stack">
    <h3>Remember each place's number</h3>
    ${timerRow}
    <div class="pairs">${P.map((p) => `<div class="pair"><span>${esc(p.w)}</span><em>${p.n}</em></div>`).join("")}</div>
    <button class="btn ghost" id="ready">I've studied them</button></div>`);
  study(T.factsStudy, () => {
    const order = shuffle(P);
    show(`${progress(2)}<form class="stack" id="f">
      <h3>Type the number for each place</h3>
      ${timerRow}
      <p class="muted small">Not sure? Give your best guess or leave it blank.</p>
      ${order.map((p, i) => `<div class="card pin" style="padding:10px 14px"><label for="n${i}">${esc(p.w)}</label><input id="n${i}" type="tel" inputmode="numeric" maxlength="2" autocomplete="off"></div>`).join("")}
      <button class="btn" type="submit">I'm done</button></form>`);
    const fin = countdown(T.factsAnswer, () => {
      let pts = 0, full = 0;
      order.forEach((p, i) => { const v = $("n" + i).value.replace(/\D/g, ""); const t = String(p.n);
        if (v === t) { pts += 1; full++; } else if (v.length === 2 && (v[0] === t[0] || v[1] === t[1])) pts += 0.5; });
      partDone(2, pts / 6, `You got <b>${full} of 6</b> numbers exactly right${pts > full ? ", plus partial credit for close ones" : ""}.`);
    }, "10 seconds left. Your answers are saved.");
    $("f").onsubmit = (e) => { e.preventDefault(); fin(); };
  });
}
/* ---- Task 4: Textbook Paragraph ---- */
function runRead() {
  const PS = S.C.passage; const sec = LEVELS_CONTENT[S.lvl].readSec;
  show(`${progress(3)}<div class="stack">
    <h3>Read carefully</h3>
    ${timerRow}
    <div class="passage"><h3>${esc(PS.title)}</h3><p>${esc(PS.text)}</p></div>
    <button class="btn ghost" id="ready">I've finished reading</button></div>`);
  study(sec, () => {
    let q = 0, ok = 0; S.detail.read = [];
    const ask = () => {
      const Q = PS.qs[q]; const opts = shuffle([Q.a].concat(Q.o));
      show(`${progress(3)}<div class="stack">
        <div class="topline"><span>Question ${q + 1} of 5</span><span>From the paragraph</span></div>
        ${timerRow}
        <h3>${esc(Q.q)}</h3>
        <div class="opts">${opts.map((o) => `<button class="opt" data-v="${esc(o)}">${esc(o)}</button>`).join("")}
        <button class="opt dk" data-v="">I don't remember</button></div></div>`);
      const next = (v) => { const good = v === Q.a; if (good) ok++; S.detail.read.push({ q: Q.q, a: Q.a, good }); q++;
        q < 5 ? ask() : partDone(3, ok / 5, `You answered <b>${ok} of 5</b> questions correctly.`); };
      let answered = false;
      countdown(T.perQuestion, () => { if (!answered) { answered = true; next(""); } }, null);
      document.querySelectorAll(".opt").forEach((b) => (b.onclick = () => { if (answered) return; answered = true; next(b.dataset.v); }));
    };
    ask();
  });
}
/* ---- Task 5: Exam-Day Recall (delayed) ---- */
function runLater() {
  const W = S.C.words;
  recallInput("Type the key terms from Task 1", `You studied ${W.length} key terms a few minutes ago. How many are still in your memory?`, T.laterAnswer, (typed) => {
    const found = matchWords(typed, W); S.detail.later = [...found];
    partDone(4, found.size / W.length, `<b>${found.size} of ${W.length}</b> key terms survived.`);
  });
}
const RUN = { recall: runRecall, seq: runSeq, facts: runFacts, read: runRead, later: runLater };

/* ================= RESULTS ================= */
function finish() {
  const total = Math.round(PARTS.reduce((a, p) => a + (S.scores[p.key] || 0), 0));
  const W = S.C.words;
  const rec = {
    total, lvl: S.lvl, form: S.form, version: VERSION, scores: Object.assign({}, S.scores), nWords: W.length,
    first: (S.detail.recall || []).length, kept: (S.detail.later || []).length,
    missedWords: W.filter((w) => !(S.detail.later || []).includes(w)), read: S.detail.read || [], facts: S.detail.facts || [],
    seq: S.C.seq, seqTitle: S.C.seqTitle, skipped: S.skipped.slice(), date: new Date().toISOString(),
  };
  pixel("TestComplete", { phase: S.phase });
  const ids = SCHOOL_TRACKS.includes(S.lvl) ? {} : metaIds();
  api.result({ attemptId: S.id, anonId: store.anon, phase: S.phase, track: S.lvl, form: S.form, firstName: store.name || "", rec, attrib, version: VERSION,
    beforeAttemptId: S.phase === "after" ? store.beforeId || null : null, afterToken: S.phase === "after" ? store.afterToken || null : null, ...ids });
  if (S.phase === "before") { store.before = rec; store.beforeId = S.id; delete store.after; delete store.leadSent; save(store); teaser(rec, true); }
  else { store.after = rec; store.afterId = S.id; save(store); compare(true); }
}
function strongWeak(sc) { const r = PARTS.map((p) => ({ p, f: (sc[p.key] || 0) / p.pts })); r.sort((a, b) => b.f - a.f); return { best: r[0].p, weak: r[r.length - 1].p }; }
function barsHtml(rec) {
  return PARTS.map((p) => `<div class="bar"><div class="lbl"><span>${esc(p.name)}</span><b>${fmt(rec.scores[p.key] || 0)} / ${p.pts}</b></div><div class="track2"><i style="width:${(100 * (rec.scores[p.key] || 0)) / p.pts}%"></i></div></div>`).join("");
}
function reviewHtml(rec) {
  return `<details><summary>Review: the correct answers</summary><ul>
    <li><b>Key terms you could not recall at the end:</b> ${rec.missedWords.length ? esc(rec.missedWords.join(", ")) : "none. Brilliant!"}</li>
    <li><b>${esc(rec.seqTitle)}:</b> ${rec.seq.map((e, i) => i + 1 + ". " + esc(e)).join(" · ")}</li>
    <li><b>Facts & Figures:</b> ${rec.facts.map((p) => esc(p.w) + " " + p.n).join(" · ")}</li>
    ${rec.read.filter((r) => !r.good).map((r) => `<li>${esc(r.q)} <b>${esc(r.a)}</b></li>`).join("")}
  </ul></details>`;
}
function keepHtml(rec) {
  const rate = rec.first > 0 ? Math.round((100 * Math.min(rec.kept, rec.first)) / rec.first) : 0;
  return `<div class="card stack"><h3>Your forgetting check</h3>
    <div class="keep"><div><b>${rec.first}</b><span>terms right after studying</span></div><div><b>${rec.kept}</b><span>terms a few minutes later</span></div><div><b>${rec.first > 0 ? rate + "%" : "–"}</b><span>kept</span></div></div>
    <p class="muted small">Without a method, forgetting keeps going for days. This is the gap the class works on.</p></div>`;
}
/* Step 1 after the free test: show the level and the forgetting stat, keep the detailed report locked behind WhatsApp */
function teaser(rec, fresh) {
  const L = levelOf(rec.total); const school = SCHOOL_TRACKS.includes(rec.lvl);
  const rate = rec.first > 0 ? Math.round((100 * Math.min(rec.kept, rec.first)) / rec.first) : 0; const lost = rec.first - Math.min(rec.kept, rec.first);
  const consentText = school ? "I am the parent or guardian. Send this student's report and class details to this number." : "Send my report and class details to this WhatsApp number.";
  show(`
  <div class="stack">
    <span class="brand center">${store.name ? esc(store.name) + ", your" : "Your"} result is ready</span>
    <div class="center"><div class="lvl" style="background:${L.color}"><small>Your study memory level</small><span>${esc(L.name)}</span></div></div>
    <div class="card stack">
      <h3>Your forgetting check</h3>
      <div class="keep"><div><b>${rec.first}</b><span>terms right after studying</span></div><div><b>${rec.kept}</b><span>terms a few minutes later</span></div><div><b>${rec.first > 0 ? rate + "%" : "–"}</b><span>kept</span></div></div>
      <p>${lost > 0 ? `You lost <b>${lost} term${lost === 1 ? "" : "s"}</b> in just a few minutes. Without a method, this forgetting continues for days, right up to your exam.` : `You kept everything for a few minutes. Real exams test you weeks later, and that is where a method makes the difference.`}</p>
    </div>
    <div class="card stack locked">
      <div class="row" style="justify-content:space-between"><h3>Your full report</h3><span class="lock">Locked</span></div>
      <div class="blur" aria-hidden="true">
        <div class="scoreline">${rec.total}<small> / 100</small></div>
        <div class="bars">${barsHtml(rec)}</div>
      </div>
      <p class="muted small">Your Exam Memory Score out of 100, all 5 skill scores, your weakest area and the method that fixes it.</p>
    </div>
    ${store.savedKey ? `<form class="card stack" id="wa">
      <h3>Send the full report to your WhatsApp</h3>
      <p class="muted small">${etaText()} It goes to the number you saved earlier.</p>
      <button class="btn teal" id="wago">Send my full report</button>
      <p id="svmsg" class="muted small" aria-live="polite"></p>
    </form>` : `<form class="card stack" id="wa">
      <h3>Where should we send your full report?</h3>
      <p class="muted small">${etaText()}</p>
      <label for="ph">${school ? "Parent's WhatsApp number" : "Your WhatsApp number"}</label>
      <input id="ph" type="tel" inputmode="numeric" autocomplete="tel" placeholder="98765 43210" maxlength="14" value="${esc(store.phone || "")}">
      <label class="check"><input type="checkbox" id="cons"> ${consentText}</label>
      <button class="btn teal" id="wago">Send my full report</button>
      <p id="svmsg" class="muted small" aria-live="polite"></p>
    </form>`}
    <button class="linkbtn" id="skip">Skip for now</button>
  </div>`);
  if (fresh) confetti();
  $("wa").onsubmit = async (e) => {
    e.preventDefault(); const m = $("svmsg");
    const viaSaved = Boolean(store.savedKey);
    const d = viaSaved ? store.phone || "" : cleanPhone($("ph").value);
    if (!viaSaved && !d) { m.textContent = "Please enter a 10-digit WhatsApp number."; return; }
    if (!viaSaved && !$("cons").checked) { m.textContent = "Please tick the box so we can send the report."; return; }
    const btn = $("wago"); btn.disabled = true; btn.textContent = "Sending…";
    const r = await api.lead(viaSaved
      ? { attemptId: store.beforeId, anonId: store.anon, savedKey: store.savedKey, track: rec.lvl, firstName: store.name || "", rec, attrib }
      : { attemptId: store.beforeId, anonId: store.anon, phone: d, consent: true, consentText, track: rec.lvl, firstName: store.name || "", rec, attrib });
    btn.disabled = false; btn.textContent = "Send my full report";
    if (!r.ok) { m.textContent = "We couldn't reach our server. Check your internet and tap the button again."; return; }
    store.phone = d; store.leadSent = true; save(store);
    pixel("Lead");
    offer(false);
  };
  $("skip").onclick = () => offer(false);
}
/* optional: student says "Hi" first, so the report lands in an open chat */
function chatBtn() {
  if (!CFG.waChatNumber) return "";
  const text = "Hi! Please send my BrainoDad memory test report.";
  return `<a class="btn teal" data-chatbtn href="https://wa.me/91${esc(CFG.waChatNumber)}?text=${encodeURIComponent(text)}" target="_blank" rel="noopener">Message us on WhatsApp to get it faster</a>`;
}
function joinBtn() { return `<a class="btn" data-joinbtn href="${esc(CFG.joinUrl)}" target="_blank" rel="noopener">Join the live class for ₹99</a>`; }
function wireJoin() {
  document.querySelectorAll("a[data-joinbtn]").forEach((a) => a.addEventListener("click", () => {
    pixel("InitiateCheckout", { value: 99, currency: "INR" });
    api.event({ attemptId: store.beforeId || null, anonId: store.anon, type: "join_click", attrib });
  }));
}
/* Step 2: the invitation to the Rs 99 live class (this is the goal of the free test) */
function offer(returning) {
  const rec = store.before; const L = levelOf(rec.total); const sw = strongWeak(rec.scores);
  show(`
  <div class="stack">
    ${store.leadSent ? `<div class="callout"><b>${CFG.waMode === "auto" ? "Your full report is on its way to WhatsApp." : "Your full report will reach your WhatsApp within a few hours."}</b></div>${chatBtn()}` : ""}
    ${returning ? `<span class="brand">Welcome back${store.name ? ", " + esc(store.name) : ""}</span>` : `<span class="brand">Your next step</span>`}
    <h2>${L.name === "Memory Genius" ? "Make your strong memory exam-proof" : "Raise your level in one live class"}</h2>
    <p>Your result shows the problem every student faces: you study hard, but a big part fades before the exam. In this 2-hour live class, Aravind Pasupathy shows you the methods to fix it, starting with your weakest area, <b>${esc(sw.weak.name)}</b>.</p>
    <div class="card offer stack">
      <span class="brand">Live class · ${esc(CFG.classLabel)}</span>
      <h2>Study Memory Masterclass</h2>
      <ul class="ticks">
        <li>Methods to remember key terms, dates and chapters</li>
        <li>How to revise so it lasts until exam day</li>
        <li><b>Your free after-class retest</b>: see exactly how much your score rises</li>
      </ul>
      ${joinBtn()}
      <p class="small center">Only students in the class get the after-class retest.</p>
    </div>
    ${store.leadSent ? "" : `<button class="btn ghost" id="getrep">Get my full report on WhatsApp</button>`}
    ${shareBlock(true)}
  </div>`);
  wireJoin(); if ($("getrep")) $("getrep").onclick = () => teaser(rec, false);
  wireShare(rec, null);
}
/* The full report: opened from the personal link sent on WhatsApp (/memory-test/report?t=...) */
function fullReport(rec) {
  const L = levelOf(rec.total); const sw = strongWeak(rec.scores);
  show(`
  <div class="stack">
    <span class="brand center">${store.name ? esc(store.name) + "'s " : "Your "}full report · before class</span>
    <div class="center"><div class="lvl" style="background:${L.color}"><small>Your level</small><span>${esc(L.name)}</span></div></div>
    <div class="center scoreline"><span id="cnum">${rec.total}</span><small> / 100</small></div>
    <p class="center muted small">${esc(LEVELS_CONTENT[rec.lvl].label)}</p>
    <p class="center">${esc(MSG[L.name])}</p>
    <div class="callout"><p><b>You did best at:</b> ${esc(sw.best.name)}.</p><p><b>Your biggest opportunity:</b> ${esc(sw.weak.name)}. In the class you will learn ${esc(sw.weak.fix)} for exactly this.</p></div>
    ${keepHtml(rec)}
    <div class="card bars">${barsHtml(rec)}</div>
    ${reviewHtml(rec)}
    <div class="card offer stack"><span class="brand">Live class · ${esc(CFG.classLabel)}</span>${joinBtn()}</div>
    ${shareBlock(true)}
  </div>`);
  countUp(rec.total); wireJoin(); wireShare(rec, null);
}
function compare(fresh) {
  const b = store.before, a = store.after; const gain = a.total - b.total;
  const power = b.total < 100 ? Math.max(0, Math.round((100 * gain) / (100 - b.total))) : 0;
  const Lb = levelOf(b.total), La = levelOf(a.total);
  let top = null, td = -1e9; PARTS.forEach((p) => { const d = ((a.scores[p.key] || 0) - (b.scores[p.key] || 0)) / p.pts; if (d > td) { td = d; top = p; } });
  const course = CFG.courseUrl
    ? `<a class="btn" id="course" href="${esc(CFG.courseUrl)}" target="_blank" rel="noopener">${esc(CFG.courseLabel)}</a>`
    : `<p class="center"><b>Ask Aravind in the class chat for today's course offer.</b></p>`;
  show(`
  <div class="stack">
    <span class="brand center">${store.name ? esc(store.name) + "'s " : "Your "}before and after</span>
    <div class="ba"><span class="b">${b.total}</span><span class="arrow">→</span><span class="a">${a.total}</span></div>
    <div class="three">
      <div><b>${gain > 0 ? "+" : ""}${gain}</b><span>points gained</span></div>
      <div><b>${power}%</b><span>improvement power</span></div>
      <div><b style="color:${La.color}">${esc(La.name.replace("Memory ", ""))}</b><span>${Lb.name === La.name ? "level held" : "new level"}</span></div>
    </div>
    <div class="card stack"><h3>Your forgetting check</h3>
      <div class="keep"><div><b style="color:var(--soft)">${b.kept}/${b.nWords}</b><span>terms kept before class</span></div><div><b>${a.kept}/${a.nWords}</b><span>terms kept after class</span></div><div><b>${a.kept - b.kept >= 0 ? "+" : ""}${a.kept - b.kept}</b><span>more terms kept</span></div></div></div>
    <div class="card bars dual">
      ${PARTS.map((p) => { const bv = b.scores[p.key] || 0, av = a.scores[p.key] || 0; return `<div class="bar"><div class="lbl"><span>${esc(p.name)}</span><b>${fmt(bv)} → ${fmt(av)}</b></div>
        <div class="track2"><i class="before" style="width:${(100 * bv) / p.pts}%"></i></div><div class="track2"><i style="width:${(100 * av) / p.pts}%"></i></div></div>`; }).join("")}
      <p class="muted small">Grey = before class · Teal = after class</p>
    </div>
    ${gain > 0 ? `<div class="callout"><b>Biggest jump:</b> ${esc(top.name)}.</div>` : ""}
    <p class="note">Honest note: part of any second-try gain comes from knowing the test format. The rest is your new method.</p>
    ${shareBlock()}
    <div class="card offer stack">
      <span class="brand">For today's class only</span>
      <h2>${gain > 0 ? "You changed this in 2 hours. Imagine 21 days." : "Two hours is a start. 21 days builds the habit."}</h2>
      <p>The 21-Day Study Champion Course turns these methods into a daily study system for your syllabus, with live support.</p>
      ${course}
    </div>
    <div class="card stack">
      <h3>Can we share your result?</h3>
      <p class="muted small">First name and scores only, to motivate other students.</p>
      <div class="row"><button class="btn teal" style="flex:1" id="yes">Yes</button><button class="btn ghost" style="flex:1" id="no">No thanks</button></div>
      <p id="cm" class="muted small"></p>
    </div>
    ${reviewHtml(a)}
  </div>`);
  if (fresh && gain > 0) confetti();
  const said = (v) => api.event({ attemptId: store.afterId || null, beforeAttemptId: store.beforeId || null, anonId: store.anon, type: v ? "share_consent_yes" : "share_consent_no" });
  $("yes").onclick = () => { said(true); $("cm").textContent = "Thank you! Your result may help another student start."; };
  $("no").onclick = () => { said(false); $("cm").textContent = "No problem. Your result stays private."; };
  if ($("course")) $("course").onclick = () => api.event({ attemptId: store.afterId || null, anonId: store.anon, type: "course_click" });
  wireShare(a, b);
}
function countUp(total) {
  const el = $("cnum"); if (!el || reduced) return; const t0 = performance.now();
  const step = (t) => { const k = Math.min(1, (t - t0) / 1200); el.textContent = Math.round(total * k); if (k < 1) requestAnimationFrame(step); }; requestAnimationFrame(step);
}

/* ================= SHARING ================= */
let shareMode = "score";
const SHARE_LINK = taggedLink("/memory-test", "share_score");
function shareText(rec, before) {
  const L = levelOf(rec.total);
  if (before) return shareMode === "level" ? `I just reached "${L.name}" on the BrainoDad Exam Memory Test after one class 🧠 Free test for serious students: ${SHARE_LINK}`
    : `My Exam Memory Score went from ${before.total} to ${rec.total} after ONE class 🧠 Can you beat ${before.total}? Free test: ${SHARE_LINK}`;
  return shareMode === "level" ? `I'm a "${L.name}" on the BrainoDad Exam Memory Test 🧠 What's your level? Free test: ${SHARE_LINK}`
    : `I scored ${rec.total}/100 on the BrainoDad Exam Memory Test 🧠 Can you beat me? Free test: ${SHARE_LINK}`;
}
function shareBlock(levelOnly) {
  shareMode = levelOnly ? "level" : "score";
  return `<div class="card stack">
    <h3>${levelOnly ? "Challenge your friends" : "Your score card"}</h3>
    ${levelOnly ? "" : `<div class="toggle" role="group" aria-label="What to share"><button id="mScore" class="on">Show my score</button><button id="mLevel">Level only</button></div>`}
    <img id="cardimg" class="cardimg" alt="Score card image" src="">
    <p class="muted small">Long-press the image to save it, then post it on your WhatsApp status or Instagram story.</p>
    <a class="btn teal" id="wash" href="#" target="_blank" rel="noopener">Share on WhatsApp</a>
    <button class="btn ghost" id="copy">Copy share message</button>
  </div>`;
}
async function wireShare(rec, before) {
  const refresh = () => {
    $("wash").href = "https://wa.me/?text=" + encodeURIComponent(shareText(rec, before)); $("cardimg").src = drawCard(rec, before);
    if ($("mScore")) { $("mScore").classList.toggle("on", shareMode === "score"); $("mLevel").classList.toggle("on", shareMode === "level"); } $("copy").textContent = "Copy share message";
  };
  if ($("mScore")) { $("mScore").onclick = () => { shareMode = "score"; refresh(); }; $("mLevel").onclick = () => { shareMode = "level"; refresh(); }; }
  $("wash").addEventListener("click", () => api.event({ attemptId: store.afterId || store.beforeId || null, anonId: store.anon, type: "share_whatsapp" }));
  $("copy").onclick = async () => { try { await navigator.clipboard.writeText(shareText(rec, before)); $("copy").textContent = "Copied!"; } catch (e) { $("copy").textContent = "Copy not allowed here"; } };
  try { await document.fonts.load('800 80px "Baloo 2"'); await document.fonts.load('500 30px "Mukta"'); } catch (e) {}
  if ($("wash")) refresh();
}
function rr(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
function drawCard(rec, before) {
  const W = 1080, H = 1350, c = document.createElement("canvas"); c.width = W; c.height = H; const g = c.getContext("2d");
  const grd = g.createRadialGradient(W / 2, -100, 50, W / 2, 200, 1100); grd.addColorStop(0, "#2a3f8c"); grd.addColorStop(1, "#0d1838"); g.fillStyle = grd; g.fillRect(0, 0, W, H);
  g.textAlign = "center"; g.fillStyle = "#ffb627"; g.font = '700 34px "Baloo 2", sans-serif'; g.fillText("BRAINODAD · EXAM MEMORY TEST", W / 2, 100);
  g.fillStyle = "#eef2ff"; g.font = '700 58px "Baloo 2", sans-serif'; g.fillText(store.name || "My result", W / 2, 185);
  g.fillStyle = "#a9b4d6"; g.font = '500 32px "Mukta", sans-serif'; g.fillText(LEVELS_CONTENT[rec.lvl].label, W / 2, 232);
  const L = levelOf(rec.total);
  g.font = '800 70px "Baloo 2", sans-serif'; const tw = g.measureText(L.name).width + 90; g.fillStyle = L.color; rr(g, W / 2 - tw / 2, 262, tw, 120, 60); g.fill();
  g.fillStyle = "#111"; g.fillText(L.name, W / 2, 347);
  if (shareMode === "score") {
    if (before) {
      g.font = '800 140px "Baloo 2", sans-serif'; g.fillStyle = "#5d6a94"; g.fillText(String(before.total), W / 2 - 230, 570);
      g.fillStyle = "#ffb627"; g.font = '800 100px "Baloo 2", sans-serif'; g.fillText("→", W / 2, 555);
      g.fillStyle = "#2ec4b6"; g.font = '800 180px "Baloo 2", sans-serif'; g.fillText(String(rec.total), W / 2 + 230, 585);
      g.fillStyle = "#eef2ff"; g.font = '600 44px "Baloo 2", sans-serif'; g.fillText("Exam Memory Score after one class", W / 2, 660);
    } else {
      g.fillStyle = "#eef2ff"; g.font = '800 200px "Baloo 2", sans-serif'; g.fillText(String(rec.total), W / 2, 600);
      g.fillStyle = "#a9b4d6"; g.font = '500 40px "Mukta", sans-serif'; g.fillText("Exam Memory Score out of 100", W / 2, 660);
    }
    let y = 770; g.textAlign = "left";
    PARTS.forEach((p) => {
      const v = (rec.scores[p.key] || 0) / p.pts; const bv = before ? (before.scores[p.key] || 0) / p.pts : null;
      g.fillStyle = "#eef2ff"; g.font = '500 34px "Mukta", sans-serif'; g.fillText(p.name, 120, y);
      g.fillStyle = "#1f3066"; rr(g, 120, y + 16, 840, 22, 11); g.fill();
      if (bv !== null) { g.fillStyle = "#5d6a94"; rr(g, 120, y + 16, Math.max(22, 840 * bv), 22, 11); g.fill(); }
      g.fillStyle = "#2ec4b6"; rr(g, 120, y + (bv !== null ? 44 : 16), Math.max(22, 840 * v), 22, 11); g.fill(); y += bv !== null ? 94 : 78;
    });
    g.textAlign = "center";
  } else {
    g.fillStyle = "#eef2ff"; g.font = '600 52px "Baloo 2", sans-serif';
    g.fillText(before ? "Reached after one class" : "My exam memory level", W / 2, 530);
    const steps = LEVELS.slice().reverse(); const bw = 170, gap = 14, x0 = (W - (steps.length * bw + (steps.length - 1) * gap)) / 2;
    steps.forEach((l, i) => {
      const on = levelOf(rec.total).name === l.name; g.fillStyle = on ? l.color : "#1f3066"; rr(g, x0 + i * (bw + gap), 630, bw, 90, 20); g.fill();
      g.fillStyle = on ? "#111" : "#a9b4d6"; g.font = '700 28px "Baloo 2", sans-serif'; g.fillText(l.name.replace("Memory ", ""), x0 + i * (bw + gap) + bw / 2, 685);
    });
  }
  g.fillStyle = "#ffb627"; g.font = '800 52px "Baloo 2", sans-serif'; g.fillText(shareMode === "score" ? (before ? "Can you beat " + before.total + "?" : "Can you beat me?") : "What's your level?", W / 2, H - 130);
  g.fillStyle = "#a9b4d6"; g.font = '500 34px "Mukta", sans-serif'; g.fillText("Free test · brainodad.com/memory-test", W / 2, H - 70);
  return c.toDataURL("image/png");
}
function confetti() {
  if (reduced) return; const cv = $("confetti"); const g = cv.getContext("2d"); cv.width = innerWidth; cv.height = innerHeight;
  const cols = ["#ffb627", "#2ec4b6", "#eef2ff", "#c9a7ff", "#7fb2ff"];
  const ps = [...Array(120)].map(() => ({ x: Math.random() * cv.width, y: -20 - Math.random() * cv.height * 0.5, vx: (Math.random() - 0.5) * 3, vy: 2 + Math.random() * 3, s: 5 + Math.random() * 6, c: cols[Math.floor(Math.random() * 5)], r: Math.random() * 6 }));
  const t0 = performance.now();
  (function f(t) {
    g.clearRect(0, 0, cv.width, cv.height); ps.forEach((p) => { p.x += p.vx; p.y += p.vy; p.r += 0.1; g.save(); g.translate(p.x, p.y); g.rotate(p.r); g.fillStyle = p.c; g.fillRect(-p.s / 2, -p.s / 2, p.s, p.s * 0.6); g.restore(); });
    if (t - t0 < 3200) requestAnimationFrame(f); else g.clearRect(0, 0, cv.width, cv.height);
  })(t0);
}

/* ================= REPORT PAGE (link from WhatsApp) ================= */
async function reportPage() {
  const t = new URLSearchParams(location.search).get("t") || "";
  show(`<div class="stack center"><span class="brand">BrainoDad · Your report</span><p class="muted">Opening your report…</p></div>`);
  const r = t ? await api.report(t) : { ok: false, data: {} };
  if (!r.ok || !r.data.before) {
    show(`<div class="stack"><span class="brand">BrainoDad · Your report</span><h2>We couldn't open this report</h2>
      <p class="muted">The link may be old or incomplete. Please open the latest link from your WhatsApp message.</p>
      <a class="btn" href="/memory-test">Take the free test</a></div>`);
    return;
  }
  Object.assign(store, { name: r.data.firstName || store.name || "", lvl: r.data.track, before: r.data.before, beforeId: r.data.beforeAttemptId, leadSent: true });
  if (r.data.after) { store.after = r.data.after; save(store); return compare(false); }
  save(store); fullReport(r.data.before);
}

/* ================= START ================= */
api.config().then((r) => {
  if (!r.ok) return;
  if (r.data.classLabel) CFG.classLabel = r.data.classLabel;
  if (r.data.courseUrl) CFG.courseUrl = r.data.courseUrl;
  if (r.data.courseLabel) CFG.courseLabel = r.data.courseLabel;
  if (r.data.waMode) CFG.waMode = r.data.waMode;
  if (/^[6-9]\d{9}$/.test(r.data.waChatNumber || "")) CFG.waChatNumber = r.data.waChatNumber;
  const lab = document.querySelectorAll(".offer .brand");
  lab.forEach((el) => { if (/^Live class/.test(el.textContent)) el.textContent = "Live class · " + CFG.classLabel; });
});
async function openSaved(k) {
  show(`<div class="stack center"><span class="brand">BrainoDad · Exam Memory Test</span><p class="muted">Opening your child's test…</p></div>`);
  const r = await api.saved(k);
  if (r.ok && r.data.track && !r.data.done) {
    // a fresh start for the child on this phone, linked to the parent's saved number
    const keep = { anon: store.anon };
    store = Object.assign(keep, { savedKey: k, lvl: r.data.track }); save(store);
    // the child's test counts for the parent's ad, not this phone's first visit
    if (r.data.attrib && r.data.attrib.campaign) { Object.assign(attrib, r.data.attrib); try { localStorage.setItem("bd_mt_attrib_v1", JSON.stringify(attrib)); } catch (e) {} }
  }
  history.replaceState(null, "", location.pathname);
  home();
}
const savedParam = new URLSearchParams(location.search).get("k");
if (MODE === "after") afterGate();
else if (MODE === "report") reportPage();
else if (savedParam && /^[A-Za-z0-9_-]{20,64}$/.test(savedParam)) openSaved(savedParam);
else home();
