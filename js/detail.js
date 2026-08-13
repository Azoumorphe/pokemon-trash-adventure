import {
  getPokemon, getSpecies, getEvolutionChain, idFromUrl,
  officialArtwork, fallbackSprite, frenchName, frenchFlavorText,
  capitalize, cleanVarietyName, TYPE_FR, TYPE_COLOR, computeTypeMatchups,
  getFrenchSpeciesNames,
} from "./api.js";

const contentEl = document.getElementById("detail-content");

let state = {
  baseSlug: null,     // slug de l'espèce demandée (route)
  species: null,      // données /pokemon-species
  currentPokemon: null, // données /pokemon actuellement affichées (peut être une variété)
  isDefaultForm: true,
  showShiny: false,
};

export async function loadDetail(slug) {
  state = { baseSlug: slug, species: null, currentPokemon: null, isDefaultForm: true, showShiny: false };
  contentEl.style.removeProperty("--page-accent");
  contentEl.style.removeProperty("--page-accent-soft");
  contentEl.innerHTML = `<div class="loader">Ouverture du dossier…</div>`;

  try {
    const pokemon = await getPokemon(slug);
    const species = await getSpecies(pokemon.species.name);
    state.species = species;
    state.currentPokemon = pokemon;
    state.isDefaultForm = pokemon.name === species.name;
    render();
  } catch (err) {
    contentEl.innerHTML = `<div class="loader is-error">Fiche introuvable.<br>Vérifie ta connexion et réessaie.</div>`;
  }
}

function spriteFor(pokemon, shiny) {
  const official = pokemon?.sprites?.other?.["official-artwork"];
  const fromApi = shiny ? official?.front_shiny : official?.front_default;
  if (fromApi) return fromApi;
  const direct = shiny ? pokemon?.sprites?.front_shiny : pokemon?.sprites?.front_default;
  if (direct) return direct;
  return fallbackSprite(pokemon.id, shiny);
}

function render() {
  const { species, currentPokemon, showShiny, isDefaultForm } = state;
  const displayName = isDefaultForm
    ? frenchName(species, species.name)
    : `${frenchName(species, species.name)} — ${cleanVarietyName(currentPokemon.name, species.name)}`;

  const flavor = frenchFlavorText(species);
  const primaryType = currentPokemon.types[0]?.type.name;
  const pageAccent = TYPE_COLOR[primaryType] || "#3b6ff2";
  contentEl.style.setProperty("--page-accent", pageAccent);
  contentEl.style.setProperty("--page-accent-soft", `${pageAccent}1A`);

  const typeChips = currentPokemon.types
    .map((t) => {
      const label = TYPE_FR[t.type.name] || capitalize(t.type.name);
      const color = TYPE_COLOR[t.type.name] || "#6b7078";
      return `<span class="type-chip" style="background:${color}1A;color:${color}">
        <span class="type-chip__dot"></span>${label}
      </span>`;
    })
    .join("");

  contentEl.innerHTML = `
    <div class="detail-hero">
      <span class="detail-hero__id">N° ${String(currentPokemon.id).padStart(4, "0")}</span>
      <div class="detail-hero__sprite-wrap">
        <img class="detail-hero__sprite" id="detail-sprite" src="${spriteFor(currentPokemon, showShiny)}" alt="${displayName}">
      </div>
      <h2 class="detail-hero__name">${displayName}</h2>
      ${flavor ? `<p class="detail-hero__flavor">${flavor}</p>` : ""}
      <div class="type-row">${typeChips}</div>
      <button class="shiny-toggle ${showShiny ? "is-active" : ""}" id="shiny-toggle">
        <span class="shiny-toggle__dot">${showShiny ? "★" : "☆"}</span>
        <span>${showShiny ? "Version chromatique" : "Voir en chromatique"}</span>
      </button>
    </div>

    <div class="section" id="matchups-section">
      <div class="section__title">Faible contre</div>
      <div class="chip-row" id="weakness-list"></div>
    </div>

    <div class="section" id="resist-section">
      <div class="section__title">Résistant à</div>
      <div class="chip-row" id="resist-list"></div>
    </div>

    <div class="section" id="forms-section" style="display:none">
      <div class="section__title">Formes &amp; variantes</div>
      <div class="form-list" id="forms-list"></div>
    </div>

    <div class="section" id="evo-section" style="display:none">
      <div class="section__title">Évolutions</div>
      <div class="evo-chain" id="evo-chain">
        <div class="loader">Chargement de la chaîne d'évolution…</div>
      </div>
    </div>
  `;

  renderMatchups(currentPokemon);
  document.getElementById("shiny-toggle").addEventListener("click", toggleShiny);

  renderForms();
  renderEvolutionChain();
}

function matchupChip(entry) {
  const label = TYPE_FR[entry.type] || capitalize(entry.type);
  const color = TYPE_COLOR[entry.type] || "#6b7078";
  const multLabel = entry.mult === 0 ? "Immunisé" : `×${entry.mult}`;
  return `
    <span class="type-chip" style="background:${color}1A;color:${color}">
      <span class="type-chip__dot"></span>${label}
      <span class="type-chip__mult">${multLabel}</span>
    </span>`;
}

function renderMatchups(pokemon) {
  const types = pokemon.types.map((t) => t.type.name);
  const { weaknesses, resistances, immunities } = computeTypeMatchups(types);

  const weakList = document.getElementById("weakness-list");
  weakList.innerHTML = weaknesses.length
    ? weaknesses.map(matchupChip).join("")
    : `<p class="chip-row__empty">Aucune faiblesse particulière.</p>`;

  const resistCombined = [...resistances, ...immunities];
  const resistList = document.getElementById("resist-list");
  resistList.innerHTML = resistCombined.length
    ? resistCombined.map(matchupChip).join("")
    : `<p class="chip-row__empty">Aucune résistance particulière.</p>`;
}

function toggleShiny() {
  state.showShiny = !state.showShiny;
  const img = document.getElementById("detail-sprite");
  img.src = spriteFor(state.currentPokemon, state.showShiny);
  const btn = document.getElementById("shiny-toggle");
  btn.classList.toggle("is-active", state.showShiny);
  btn.innerHTML = `<span class="shiny-toggle__dot">${state.showShiny ? "★" : "☆"}</span><span>${state.showShiny ? "Version chromatique" : "Voir en chromatique"}</span>`;
}

function renderForms() {
  const { species, currentPokemon } = state;
  const varieties = species.varieties || [];
  if (varieties.length <= 1) return;

  const section = document.getElementById("forms-section");
  const list = document.getElementById("forms-list");
  section.style.display = "flex";

  list.innerHTML = varieties
    .map((v) => {
      const isActive = v.pokemon.name === currentPokemon.name;
      const label = v.is_default ? "Forme normale" : cleanVarietyName(v.pokemon.name, species.name);
      return `<button class="form-chip ${isActive ? "is-active" : ""}" data-variety="${v.pokemon.name}">${label}</button>`;
    })
    .join("");

  list.querySelectorAll(".form-chip").forEach((chip) => {
    chip.addEventListener("click", async () => {
      const varietyName = chip.dataset.variety;
      if (varietyName === state.currentPokemon.name) return;
      try {
        const pokemon = await getPokemon(varietyName);
        state.currentPokemon = pokemon;
        state.isDefaultForm = pokemon.name === state.species.name;
        state.showShiny = false;
        render();
      } catch (err) {
        chip.textContent = "Indisponible";
      }
    });
  });
}

async function renderEvolutionChain() {
  const { species } = state;
  const section = document.getElementById("evo-section");
  const chainEl = document.getElementById("evo-chain");
  if (!species.evolution_chain?.url) return;
  section.style.display = "flex";

  try {
    const chainData = await getEvolutionChain(species.evolution_chain.url);
    const stages = flattenChain(chainData.chain);

    if (stages.length <= 1 && stages[0]?.length <= 1) {
      chainEl.innerHTML = `<div class="loader">Ce Pokémon n'évolue pas.</div>`;
      return;
    }

    const [nodesWithData, frMap] = await Promise.all([
      Promise.all(
        stages.map((stage) =>
          Promise.all(
            stage.map(async (speciesName) => {
              try {
                const p = await getPokemon(speciesName);
                return { name: speciesName, id: p.id, sprite: spriteFor(p, false) };
              } catch (e) {
                return { name: speciesName, id: null, sprite: "" };
              }
            })
          )
        )
      ),
      getFrenchSpeciesNames(),
    ]);

    chainEl.innerHTML = nodesWithData
      .map((stage, i) => {
        const nodes = stage
          .map((n) => {
            const isCurrent = n.name === species.name;
            const label = (n.id && frMap.get(n.id)) || capitalize(n.name.replace(/-/g, " "));
            return `
              <button class="evo-node ${isCurrent ? "is-current" : ""}" data-name="${n.name}">
                <img src="${n.sprite}" alt="${label}" loading="lazy">
                <span>${label}</span>
              </button>`;
          })
          .join("");
        const arrow = i < nodesWithData.length - 1 ? `<span class="evo-arrow">→</span>` : "";
        return `<div class="evo-stage">${nodes}</div>${arrow}`;
      })
      .join("");

    chainEl.querySelectorAll(".evo-node").forEach((btn) => {
      btn.addEventListener("click", () => {
        const name = btn.dataset.name;
        if (name === state.species.name) return;
        window.location.hash = `#/dex/${name}`;
      });
    });
  } catch (err) {
    chainEl.innerHTML = `<div class="loader is-error">Chaîne d'évolution indisponible.</div>`;
  }
}

// Transforme l'arbre récursif de la chaîne d'évolution en niveaux (BFS),
// pour gérer les embranchements (ex. Évoli) comme les chaînes linéaires.
function flattenChain(rootNode) {
  const stages = [];
  let level = [rootNode];
  while (level.length > 0) {
    stages.push(level.map((n) => n.species.name));
    level = level.flatMap((n) => n.evolves_to || []);
  }
  return stages;
}
