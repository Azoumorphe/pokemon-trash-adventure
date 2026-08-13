import { initPokedex } from "./pokedex.js";
import { loadDetail } from "./detail.js";
import "./coinflip.js";
import "./dice.js";

const views = {
  coin: document.getElementById("view-coin"),
  dex: document.getElementById("view-dex"),
  dice: document.getElementById("view-dice"),
  detail: document.getElementById("view-detail"),
};
const tabButtons = document.querySelectorAll(".tabbar__btn");
const tabbar = document.getElementById("tabbar");
const btnBack = document.getElementById("btn-back");

let dexInitialized = false;
let lastListHash = "#/dex";

function setActiveView(name) {
  Object.entries(views).forEach(([key, el]) => {
    el.classList.toggle("is-active", key === name);
  });

  const showTabbar = name !== "detail";
  tabbar.style.display = showTabbar ? "grid" : "none";

  tabButtons.forEach((btn) => {
    btn.classList.toggle("is-active", btn.dataset.target === name);
  });
}

function route() {
  const hash = window.location.hash || "#/coin";

  if (hash.startsWith("#/dex/")) {
    const slug = decodeURIComponent(hash.replace("#/dex/", ""));
    setActiveView("detail");
    loadDetail(slug);
    return;
  }

  if (hash.startsWith("#/dex")) {
    lastListHash = hash;
    setActiveView("dex");
    if (!dexInitialized) {
      dexInitialized = true;
      initPokedex();
    }
    return;
  }

  if (hash.startsWith("#/dice")) {
    setActiveView("dice");
    return;
  }

  setActiveView("coin");
}

tabButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const target = btn.dataset.target;
    window.location.hash = target === "dex" ? lastListHash : `#/${target}`;
  });
});

btnBack.addEventListener("click", () => {
  window.location.hash = lastListHash;
});

window.addEventListener("hashchange", route);
window.addEventListener("DOMContentLoaded", route);
route();

// --- Service worker (fonctionnement hors-ligne de la coquille de l'app) ---
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch(() => {
      /* PWA non critique en local (fichier ouvert directement, etc.) */
    });
  });
}
