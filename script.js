/**
 * Interactive portfolio: progressive "build" on empty-space clicks.
 * Profile cards: GitHub → repos tab; LinkedIn → profile; Projects → modal with live demos.
 */

const MAX_STAGED = 6;

const LINKS = {
  github: "https://github.com/mandavillivijay?tab=repositories",
  linkedin: "https://www.linkedin.com/in/vijay-mandavilli-59a19247/",
};

const SVG_NS = "http://www.w3.org/2000/svg";

/** One line per stage 0–6 (bottom tagline); stage 7+ keeps the last line. */
const STAGE_TAGLINES = [
  "powered by tokens, driven by vibes",
  "one layer in — keep tapping the dark",
  "github’s live — ship in public",
  "linkedin next — humans still matter",
  "projects live in that button — demos await",
  "ambient gradient on — enjoy the drift",
  "you maxed the tour — thanks for the clicks",
];

/** Flat diamond token (reads clearly geometric, not a teardrop). */
function createSparkTokenSvg() {
  const gradId = `token-grad-${Math.random().toString(36).slice(2, 10)}`;
  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("viewBox", "0 0 48 48");
  svg.setAttribute("class", "spark-token");
  svg.setAttribute("aria-hidden", "true");

  const defs = document.createElementNS(SVG_NS, "defs");
  const lg = document.createElementNS(SVG_NS, "linearGradient");
  lg.setAttribute("id", gradId);
  lg.setAttribute("x1", "0");
  lg.setAttribute("y1", "0");
  lg.setAttribute("x2", "1");
  lg.setAttribute("y2", "1");

  const stops = [
    ["0%", "#ddd6fe", "0.94"],
    ["42%", "#93c5fd", "0.76"],
    ["100%", "#38bdf8", "0.55"],
  ];
  for (const [offset, color, opacity] of stops) {
    const stop = document.createElementNS(SVG_NS, "stop");
    stop.setAttribute("offset", offset);
    stop.setAttribute("stop-color", color);
    stop.setAttribute("stop-opacity", opacity);
    lg.appendChild(stop);
  }
  defs.appendChild(lg);

  const path = document.createElementNS(SVG_NS, "path");
  path.setAttribute(
    "d",
    "M24 4 L44 24 24 44 4 24 Z"
  );
  path.setAttribute("fill", `url(#${gradId})`);
  path.setAttribute("stroke", "rgba(255,255,255,0.24)");
  path.setAttribute("stroke-width", "0.65");
  path.setAttribute("stroke-linejoin", "round");

  svg.appendChild(defs);
  svg.appendChild(path);

  return svg;
}

const state = {
  stage: 0,
  audioCtx: null,
  particlesSeeded: false,
  linksVisited: { github: false, linkedin: false, projects: false },
  hintWindDownStarted: false,
  buildHintRetired: false,
};

const els = {
  siteTagline: document.getElementById("siteTagline"),
  progress: document.getElementById("progress"),
  introBlock: document.getElementById("introBlock"),
  introTitle: document.getElementById("introTitle"),
  introSub: document.getElementById("introSub"),
  greeting: document.getElementById("greeting"),
  cards: document.getElementById("cards"),
  bgGradient: document.getElementById("bgGradient"),
  particles: document.getElementById("particles"),
  projectsModal: document.getElementById("projectsModal"),
  modalBackdrop: document.getElementById("modalBackdrop"),
  modalClose: document.getElementById("modalClose"),
};

function isBuildClickTarget(target) {
  if (!(target instanceof Element)) return false;
  if (target.closest(".card")) return false;
  if (target.closest(".modal")) return false;
  if (target.closest(".progress")) return false;
  return true;
}

function updateProgress() {
  const display = Math.min(state.stage, MAX_STAGED);
  els.progress.textContent = `Stage ${display}/${MAX_STAGED}`;
}

function syncIntroChrome() {
  const level = Math.min(Math.max(state.stage, 0), 8);
  els.introBlock.dataset.hintLevel = String(level);
  const tagIdx = Math.min(Math.max(state.stage, 0), STAGE_TAGLINES.length - 1);
  els.siteTagline.textContent = STAGE_TAGLINES[tagIdx];
}

function playClickSound() {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    if (!state.audioCtx) state.audioCtx = new Ctx();
    const ctx = state.audioCtx;
    if (ctx.state === "suspended") ctx.resume();

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.045, ctx.currentTime + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.08);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.09);
  } catch {
    /* ignore */
  }
}

function markExternalLink(id) {
  state.linksVisited[id] = true;
  if (state.hintWindDownStarted) return;
  const { github, linkedin, projects } = state.linksVisited;
  if (github && linkedin && projects) beginHintWindDown();
}

function beginHintWindDown() {
  if (state.hintWindDownStarted) return;
  state.hintWindDownStarted = true;
  spawnCelebrationTokens();
}

function retireBuildHintLine() {
  if (state.buildHintRetired) return;
  state.buildHintRetired = true;
  els.introSub.classList.add("intro-sub--retired");
  els.introSub.setAttribute("aria-hidden", "true");
}

function openProjectsModal() {
  els.projectsModal.hidden = false;
  els.modalClose.focus();
}

function closeProjectsModal() {
  els.projectsModal.hidden = true;
}

function spawnCelebrationTokens() {
  const originX = 50;
  const originY = 44;
  const count = 7;
  for (let i = 0; i < count; i++) {
    const token = createSparkTokenSvg();
    token.classList.add("spark-token--burst");
    const angle = (Math.PI * 2 * i) / count + Math.random() * 0.35;
    const dist = 80 + Math.random() * 110;
    const dx = Math.cos(angle) * dist;
    const dy = Math.sin(angle) * dist;
    const size = 22 + Math.random() * 26;
    const rot = Math.random() * 220 - 110;
    token.style.setProperty("--pick-x", `${originX + (Math.random() * 6 - 3)}vw`);
    token.style.setProperty("--pick-y", `${originY + (Math.random() * 6 - 3)}vh`);
    token.style.setProperty("--pick-size", `${size}px`);
    token.style.setProperty("--pick-rot", `${rot}deg`);
    token.style.setProperty("--pick-dx", `${dx}px`);
    token.style.setProperty("--pick-dy", `${dy}px`);
    document.body.appendChild(token);
    window.setTimeout(() => token.remove(), 3200);
  }
}

function setSparkTokenVars(el) {
  const size = 20 + Math.random() * 34;
  const rot = Math.random() * 360;
  el.style.setProperty("--pick-x", `${Math.random() * 86 + 7}vw`);
  el.style.setProperty("--pick-y", `${Math.random() * 78 + 10}vh`);
  el.style.setProperty("--pick-size", `${size}px`);
  el.style.setProperty("--pick-rot", `${rot}deg`);
}

function stage1_greeting() {
  els.introTitle.classList.add("intro-title--gone");
  els.introTitle.setAttribute("aria-hidden", "true");
  els.introSub.innerHTML =
    '<span class="intro-sub__lead">Keep clicking the dark background to reveal more.</span>' +
    '<span class="intro-sub__cta">Each click adds something new.</span>';
  els.greeting.hidden = false;
  requestAnimationFrame(() => els.greeting.classList.add("is-visible"));
}

function createCard({ label, className, linkId, url }) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = `card ${className}`;
  btn.textContent = label;
  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    window.open(url, "_blank", "noopener,noreferrer");
    markExternalLink(linkId);
  });
  els.cards.appendChild(btn);
}

function stage2_github() {
  createCard({
    label: "GitHub",
    className: "card--github",
    linkId: "github",
    url: LINKS.github,
  });
}

function stage3_linkedin() {
  createCard({
    label: "LinkedIn",
    className: "card--linkedin",
    linkId: "linkedin",
    url: LINKS.linkedin,
  });
}

function stage4_projects() {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "card card--projects";
  btn.textContent = "Projects";
  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    openProjectsModal();
    markExternalLink("projects");
  });
  els.cards.appendChild(btn);
}

function seedParticles() {
  if (state.particlesSeeded) return;
  state.particlesSeeded = true;
  const frag = document.createDocumentFragment();
  const count = 42;
  for (let i = 0; i < count; i++) {
    const anchor = document.createElement("span");
    anchor.className = "particle-anchor";
    anchor.style.left = `${Math.random() * 100}%`;
    const dot = document.createElement("span");
    dot.className = "particle";
    dot.style.setProperty("--spark-rot", `${(Math.random() * 70 - 35).toFixed(1)}deg`);
    dot.style.animationDuration = `${12 + Math.random() * 18}s`;
    dot.style.animationDelay = `${-Math.random() * 20}s`;
    anchor.appendChild(dot);
    frag.appendChild(anchor);
  }
  els.particles.appendChild(frag);
}

function stage5_background() {
  els.bgGradient.classList.add("is-on");
  els.particles.classList.add("is-on");
  seedParticles();
}

function stage6plus_fx() {
  const token = createSparkTokenSvg();
  setSparkTokenVars(token);
  document.body.appendChild(token);
  window.setTimeout(() => token.remove(), 26000);
}

const stageRunners = [
  () => stage1_greeting(),
  () => stage2_github(),
  () => stage3_linkedin(),
  () => stage4_projects(),
  () => stage5_background(),
];

function applyNextStage() {
  const next = state.stage + 1;
  if (next === 1) stageRunners[0]();
  else if (next === 2) stageRunners[1]();
  else if (next === 3) stageRunners[2]();
  else if (next === 4) stageRunners[3]();
  else if (next === 5) stageRunners[4]();
  else if (next >= 6) stage6plus_fx();

  state.stage = next;
  updateProgress();
  syncIntroChrome();
  if (state.stage >= 6) retireBuildHintLine();
}

function onDocumentPointerDown(e) {
  if (e.button !== 0 && e.pointerType === "mouse") return;
  if (!isBuildClickTarget(e.target)) return;

  playClickSound();
  applyNextStage();
}

els.modalBackdrop.addEventListener("click", closeProjectsModal);
els.modalClose.addEventListener("click", closeProjectsModal);

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !els.projectsModal.hidden) closeProjectsModal();
});

document.addEventListener("pointerdown", onDocumentPointerDown, true);

syncIntroChrome();
updateProgress();
