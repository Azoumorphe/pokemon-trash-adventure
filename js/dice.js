const die = document.getElementById("die");
const dieFace = document.getElementById("die-face");
const btnRoll = document.getElementById("btn-roll");
const resultEl = document.getElementById("dice-result");
const historyEl = document.getElementById("dice-history");

const typeBtn = document.getElementById("btn-dice-type");
const typeOverlay = document.getElementById("dice-type-overlay");
const typeList = document.getElementById("dice-type-list");
const typeClose = document.getElementById("btn-dice-type-close");

const DICE_TYPES = [6, 12, 18, 20];
const DEFAULT_SIDES = 6;
const HISTORY_MAX = 12;

let currentSides = DEFAULT_SIDES;
let rolling = false;
let history = [];

try {
  const savedSides = Number(localStorage.getItem("dice-sides"));
  if (DICE_TYPES.includes(savedSides)) currentSides = savedSides;
} catch (e) {}

loadHistoryForCurrent();
updateIdleFace();
renderHistory();

function loadHistoryForCurrent() {
  try {
    const saved = localStorage.getItem(`dice-history-d${currentSides}`);
    history = saved ? JSON.parse(saved).slice(-HISTORY_MAX) : [];
  } catch (e) {
    history = [];
  }
}

function updateIdleFace() {
  dieFace.textContent = `D${currentSides}`;
  dieFace.classList.add("is-label");
  resultEl.textContent = "—";
}

function renderHistory() {
  historyEl.innerHTML = history
    .map((r) => `<span class="coin-history__chip">${r}</span>`)
    .join("");
}

function renderTypeList() {
  typeList.innerHTML = DICE_TYPES.map((sides) => {
    const isActive = sides === currentSides;
    return `
      <button class="skin-option ${isActive ? "is-active" : ""}" data-sides="${sides}">
        <span class="skin-option__preview"><span>D${sides}</span></span>
        <span class="skin-option__label">Dé à ${sides} faces</span>
      </button>`;
  }).join("");

  typeList.querySelectorAll(".skin-option").forEach((opt) => {
    opt.addEventListener("click", () => {
      const sides = Number(opt.dataset.sides);
      if (sides !== currentSides) {
        currentSides = sides;
        try { localStorage.setItem("dice-sides", String(sides)); } catch (e) {}
        loadHistoryForCurrent();
        updateIdleFace();
        renderHistory();
      }
      renderTypeList();
      closeTypeSheet();
    });
  });
}

function openTypeSheet() {
  renderTypeList();
  typeOverlay.classList.add("is-open");
}
function closeTypeSheet() {
  typeOverlay.classList.remove("is-open");
}

typeBtn.addEventListener("click", openTypeSheet);
typeClose.addEventListener("click", closeTypeSheet);
typeOverlay.addEventListener("click", (e) => {
  if (e.target === typeOverlay) closeTypeSheet();
});

function roll() {
  if (rolling) return;
  rolling = true;
  btnRoll.disabled = true;
  resultEl.textContent = "…";

  die.classList.remove("is-rolling");
  void die.offsetWidth; // force reflow pour pouvoir rejouer l'animation
  die.classList.add("is-rolling");

  if (navigator.vibrate) navigator.vibrate(15);

  setTimeout(() => {
    const result = 1 + Math.floor(Math.random() * currentSides);
    dieFace.textContent = String(result);
    dieFace.classList.remove("is-label");
    resultEl.textContent = String(result);

    history.push(result);
    if (history.length > HISTORY_MAX) history.shift();
    try { localStorage.setItem(`dice-history-d${currentSides}`, JSON.stringify(history)); } catch (e) {}
    renderHistory();

    die.classList.remove("is-rolling");
    rolling = false;
    btnRoll.disabled = false;
    if (navigator.vibrate) navigator.vibrate([10, 30, 10]);
  }, 600);
}

btnRoll.addEventListener("click", roll);
