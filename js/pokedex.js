import { getPokemonList, getFrenchSpeciesNames, fallbackSprite, capitalize } from "./api.js";

const listEl = document.getElementById("dex-list");
const countEl = document.getElementById("dex-count");
const searchInput = document.getElementById("dex-search");

const RENDER_LIMIT = 80;

let fullList = [];
let loaded = false;
let loading = false;

function stripAccents(str) {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function matches(entry, query) {
  if (!query) return true;
  const q = stripAccents(query.toLowerCase()).trim();
  if (q === "") return true;
  if (String(entry.id) === q) return true;
  if (stripAccents(entry.name).includes(q)) return true;
  if (entry.displayName && stripAccents(entry.displayName.toLowerCase()).includes(q)) return true;
  return false;
}

function render(query) {
  if (!loaded) return;
  const filtered = fullList.filter((e) => matches(e, query));
  countEl.textContent = query
    ? `${filtered.length} résultat${filtered.length > 1 ? "s" : ""}`
    : `${fullList.length} entrées au registre`;

  const shown = filtered.slice(0, RENDER_LIMIT);

  if (shown.length === 0) {
    listEl.innerHTML = `<div class="loader">Aucune entrée ne correspond.</div>`;
    return;
  }

  listEl.innerHTML = shown
    .map(
      (e) => `
      <button class="dex-item" data-name="${e.name}">
        <img class="dex-item__thumb" loading="lazy" src="${fallbackSprite(e.id)}" alt="" onerror="this.style.opacity=0">
        <span class="dex-item__name">${e.displayName}</span>
        <span class="dex-item__id">#${String(e.id).padStart(4, "0")}</span>
      </button>`
    )
    .join("") +
    (filtered.length > RENDER_LIMIT
      ? `<div class="loader">Affine ta recherche pour voir plus de résultats (${filtered.length - RENDER_LIMIT} de plus).</div>`
      : "");

  listEl.querySelectorAll(".dex-item").forEach((btn) => {
    btn.addEventListener("click", () => {
      window.location.hash = `#/dex/${btn.dataset.name}`;
    });
  });
}

export async function initPokedex() {
  searchInput.addEventListener("input", () => render(searchInput.value));

  if (loaded || loading) return;
  loading = true;
  try {
    const [list, frMap] = await Promise.all([getPokemonList(), getFrenchSpeciesNames()]);
    fullList = list.map((e) => ({
      ...e,
      displayName: frMap.get(e.id) || capitalize(e.name.replace(/-/g, " ")),
    }));
    loaded = true;
    render(searchInput.value);
  } catch (err) {
    listEl.innerHTML = `<div class="loader is-error">Impossible de joindre le Pokédex.<br>Vérifie ta connexion et réessaie.</div>`;
  } finally {
    loading = false;
  }
}
