const coin = document.getElementById("coin");
const btn = document.getElementById("btn-flip");
const resultEl = document.getElementById("coin-result");
const historyEl = document.getElementById("coin-history");
const faceFront = document.getElementById("coin-face-front");
const faceBack = document.getElementById("coin-face-back");

const skinBtn = document.getElementById("btn-coin-skin");
const skinOverlay = document.getElementById("coin-skin-overlay");
const skinList = document.getElementById("coin-skin-list");
const skinClose = document.getElementById("btn-coin-skin-close");

let flipping = false;
let history = [];
const HISTORY_MAX = 12;

let skins = [{ id: "classique", label: "Classique", type: "text" }];
let currentSkinId = "classique";

try {
  const saved = localStorage.getItem("coin-history");
  if (saved) history = JSON.parse(saved).slice(-HISTORY_MAX);
} catch (e) { /* stockage indisponible, on continue sans historique persistant */ }

try {
  const savedSkin = localStorage.getItem("coin-skin-id");
  if (savedSkin) currentSkinId = savedSkin;
} catch (e) {}

renderHistory();
loadSkins();

function renderHistory() {
  historyEl.innerHTML = history
    .map((r) => `<span class="coin-history__chip">${r === "pile" ? "P" : "F"}</span>`)
    .join("");
}

async function loadSkins() {
  try {
    const res = await fetch("assets/coins/coins.json");
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) skins = data;
    }
  } catch (e) {
    /* fichier absent ou hors-ligne : on reste sur le skin "classique" par défaut */
  }
  applySkin(currentSkinId);
}

function getSkin(id) {
  return skins.find((s) => s.id === id) || skins[0];
}

function applySkin(id) {
  const skin = getSkin(id);
  currentSkinId = skin.id;
  if (skin.type === "image" && skin.front && skin.back) {
    faceFront.innerHTML = `<img src="${skin.front}" alt="Pile" onerror="this.parentElement.textContent='PILE'">`;
    faceBack.innerHTML = `<img src="${skin.back}" alt="Face" onerror="this.parentElement.textContent='FACE'">`;
  } else {
    faceFront.textContent = "PILE";
    faceBack.textContent = "FACE";
  }
}

function renderSkinList() {
  skinList.innerHTML = skins
    .map((s) => {
      const isActive = s.id === currentSkinId;
      const preview = s.type === "image" && s.back
        ? `<img src="${s.back}" alt="">`
        : `<span>P/F</span>`;
      return `
        <button class="skin-option ${isActive ? "is-active" : ""}" data-id="${s.id}">
          <span class="skin-option__preview">${preview}</span>
          <span class="skin-option__label">${s.label}</span>
        </button>`;
    })
    .join("");

  skinList.querySelectorAll(".skin-option").forEach((opt) => {
    opt.addEventListener("click", () => {
      applySkin(opt.dataset.id);
      try { localStorage.setItem("coin-skin-id", currentSkinId); } catch (e) {}
      renderSkinList();
      closeSkinSheet();
    });
  });
}

function openSkinSheet() {
  renderSkinList();
  skinOverlay.classList.add("is-open");
}
function closeSkinSheet() {
  skinOverlay.classList.remove("is-open");
}

skinBtn.addEventListener("click", openSkinSheet);
skinClose.addEventListener("click", closeSkinSheet);
skinOverlay.addEventListener("click", (e) => {
  if (e.target === skinOverlay) closeSkinSheet();
});

function flip() {
  if (flipping) return;
  flipping = true;
  btn.disabled = true;
  resultEl.textContent = "…";

  const result = Math.random() < 0.5 ? "pile" : "face";
  const extraTurns = Math.floor(Math.random() * 3); // variation visuelle
  const baseY = result === "pile" ? 0 : 180;
  const totalY = 1440 + extraTurns * 360 + baseY;

  coin.style.transition = "none";
  coin.style.transform = "rotateY(0deg) rotateX(0deg)";
  // force reflow avant de relancer la transition
  void coin.offsetWidth;
  coin.style.transition = "transform 1.05s cubic-bezier(.2,.7,.2,1)";
  coin.style.transform = `rotateY(${totalY}deg) rotateX(360deg)`;

  if (navigator.vibrate) navigator.vibrate(15);

  setTimeout(() => {
    resultEl.textContent = result === "pile" ? "PILE" : "FACE";
    history.push(result);
    if (history.length > HISTORY_MAX) history.shift();
    renderHistory();
    try { localStorage.setItem("coin-history", JSON.stringify(history)); } catch (e) {}
    flipping = false;
    btn.disabled = false;
    if (navigator.vibrate) navigator.vibrate(result === "pile" ? [10, 30, 10] : 20);
  }, 1080);
}

btn.addEventListener("click", flip);
