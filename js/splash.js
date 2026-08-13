const splash = document.getElementById("splash");
const splashImg = document.getElementById("splash-img");

const MIN_DISPLAY_MS = 550; // temps minimum affiché si une image se charge, pour éviter un flash
const MAX_WAIT_MS = 4000;   // filet de sécurité si l'image met trop de temps à charger

const start = performance.now();
let hidden = false;

function hideSplash() {
  if (hidden || !splash) return;
  hidden = true;
  splash.classList.add("is-hidden");
  setTimeout(() => splash.remove(), 450);
}

if (splash && splashImg) {
  splashImg.addEventListener("load", () => {
    const elapsed = performance.now() - start;
    setTimeout(hideSplash, Math.max(0, MIN_DISPLAY_MS - elapsed));
  });

  // Pas d'image ajoutée par l'utilisateur (404) : on retire le calque
  // immédiatement, sans délai, pour ne jamais bloquer l'app.
  splashImg.addEventListener("error", hideSplash);

  setTimeout(hideSplash, MAX_WAIT_MS);
} 
