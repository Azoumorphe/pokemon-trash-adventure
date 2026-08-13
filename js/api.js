const BASE = "https://pokeapi.co/api/v2";
const SPRITE_BASE = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon";

const cache = new Map();

async function fetchJSON(url) {
  if (cache.has(url)) return cache.get(url);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Erreur réseau (${res.status}) pour ${url}`);
  const data = await res.json();
  cache.set(url, data);
  return data;
}

export function idFromUrl(url) {
  const match = url.match(/\/(\d+)\/?$/);
  return match ? Number(match[1]) : null;
}

const SPECIES_NAMES_CSV = "https://raw.githubusercontent.com/PokeAPI/pokeapi/master/data/v2/csv/pokemon_species_names.csv";
const FRENCH_LANGUAGE_ID = 5;
const FRENCH_CACHE_KEY = "fr-species-names-v1";

let frenchNameMapPromise = null;

// Récupère en une seule fois les noms français de toutes les espèces
// (fichier de données publiques de PokéAPI), plutôt que d'interroger
// l'API une fois par Pokémon — trop lent pour ~1300 entrées.
export function getFrenchSpeciesNames() {
  if (frenchNameMapPromise) return frenchNameMapPromise;

  frenchNameMapPromise = (async () => {
    try {
      const cached = localStorage.getItem(FRENCH_CACHE_KEY);
      if (cached) return new Map(JSON.parse(cached));
    } catch (e) { /* pas grave, on retélécharge */ }

    const map = new Map();
    try {
      const res = await fetch(SPECIES_NAMES_CSV);
      const text = await res.text();
      const lines = text.split("\n");
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (!line) continue;
        const parts = line.split(",");
        if (parts.length < 3) continue;
        if (Number(parts[1]) !== FRENCH_LANGUAGE_ID) continue;
        map.set(Number(parts[0]), parts[2].trim());
      }
      try { localStorage.setItem(FRENCH_CACHE_KEY, JSON.stringify([...map])); } catch (e) {}
    } catch (e) {
      // hors-ligne ou source indisponible : on continuera avec les noms anglais en repli
    }
    return map;
  })();

  return frenchNameMapPromise;
}

let listPromise = null;
export function getPokemonList() {
  if (!listPromise) {
    listPromise = fetchJSON(`${BASE}/pokemon?limit=100000&offset=0`).then((data) =>
      data.results.map((entry) => ({
        name: entry.name,
        id: idFromUrl(entry.url),
      }))
    );
  }
  return listPromise;
}

export function getPokemon(nameOrId) {
  return fetchJSON(`${BASE}/pokemon/${nameOrId}`);
}

export function getSpecies(nameOrId) {
  return fetchJSON(`${BASE}/pokemon-species/${nameOrId}`);
}

export function getEvolutionChain(url) {
  return fetchJSON(url);
}

export function officialArtwork(id, shiny = false) {
  return shiny
    ? `${SPRITE_BASE}/other/official-artwork/shiny/${id}.png`
    : `${SPRITE_BASE}/other/official-artwork/${id}.png`;
}

export function fallbackSprite(id, shiny = false) {
  return shiny ? `${SPRITE_BASE}/shiny/${id}.png` : `${SPRITE_BASE}/${id}.png`;
}

export function frenchName(species, fallbackSlug) {
  const entry = species?.names?.find((n) => n.language.name === "fr");
  return entry ? entry.name : capitalize(fallbackSlug);
}

export function frenchFlavorText(species) {
  const entries = species?.flavor_text_entries?.filter((f) => f.language.name === "fr");
  if (!entries || entries.length === 0) return "";
  const text = entries[0].flavor_text;
  return text.replace(/[\n\f\r]/g, " ").replace(/\s+/g, " ").trim();
}

export function capitalize(str) {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function cleanVarietyName(varietyName, speciesSlug) {
  let label = varietyName.replace(`${speciesSlug}-`, "");
  label = label.split("-").map((word) => {
    if (word === "mega") return "Méga";
    if (word === "gmax") return "Gigamax";
    if (word === "x") return "X";
    if (word === "y") return "Y";
    if (word === "alola") return "Alola";
    if (word === "galar") return "Galar";
    if (word === "hisui") return "Hisui";
    if (word === "paldea") return "Paldea";
    return capitalize(word);
  }).join(" ");
  return label || "Forme spéciale";
}

export const TYPE_FR = {
  normal: "Normal", fire: "Feu", water: "Eau", electric: "Électrik",
  grass: "Plante", ice: "Glace", fighting: "Combat", poison: "Poison",
  ground: "Sol", flying: "Vol", psychic: "Psy", bug: "Insecte",
  rock: "Roche", ghost: "Spectre", dragon: "Dragon", dark: "Ténèbres",
  steel: "Acier", fairy: "Fée",
};

// Couleurs discrètes utilisées comme accent (pastille + texte) sur les badges de type.
export const TYPE_COLOR = {
  normal: "#8b8d7a", fire: "#e0693f", water: "#4a90d9", electric: "#c99a1f",
  grass: "#5c9e4a", ice: "#5bb8b0", fighting: "#c1503f", poison: "#9b59b0",
  ground: "#b08b4f", flying: "#7f9fd9", psychic: "#d9548a", bug: "#8ba33f",
  rock: "#a5924a", ghost: "#6f6ab5", dragon: "#5e6fce", dark: "#5b5a52",
  steel: "#7c8b96", fairy: "#d97fae",
};

// Tableau standard des efficacités de type (attaquant -> défenseur).
// Valeur par défaut : 1 (neutre) si non précisé ci-dessous.
const TYPE_CHART = {
  normal:   { rock: 0.5, ghost: 0, steel: 0.5 },
  fire:     { fire: 0.5, water: 0.5, grass: 2, ice: 2, bug: 2, rock: 0.5, dragon: 0.5, steel: 2 },
  water:    { fire: 2, water: 0.5, grass: 0.5, ground: 2, rock: 2, dragon: 0.5 },
  electric: { water: 2, electric: 0.5, grass: 0.5, ground: 0, flying: 2, dragon: 0.5 },
  grass:    { fire: 0.5, water: 2, grass: 0.5, poison: 0.5, ground: 2, flying: 0.5, bug: 0.5, rock: 2, dragon: 0.5, steel: 0.5 },
  ice:      { fire: 0.5, water: 0.5, grass: 2, ice: 0.5, ground: 2, flying: 2, dragon: 2, steel: 0.5 },
  fighting: { normal: 2, ice: 2, poison: 0.5, flying: 0.5, psychic: 0.5, bug: 0.5, rock: 2, ghost: 0, dark: 2, steel: 2, fairy: 0.5 },
  poison:   { grass: 2, poison: 0.5, ground: 0.5, rock: 0.5, ghost: 0.5, steel: 0, fairy: 2 },
  ground:   { fire: 2, electric: 2, grass: 0.5, poison: 2, flying: 0, bug: 0.5, rock: 2, steel: 2 },
  flying:   { electric: 0.5, grass: 2, fighting: 2, bug: 2, rock: 0.5, steel: 0.5 },
  psychic:  { fighting: 2, poison: 2, psychic: 0.5, dark: 0, steel: 0.5 },
  bug:      { fire: 0.5, grass: 2, fighting: 0.5, poison: 0.5, flying: 0.5, psychic: 2, ghost: 0.5, dark: 2, steel: 0.5, fairy: 0.5 },
  rock:     { fire: 2, ice: 2, fighting: 0.5, ground: 0.5, flying: 2, bug: 2, steel: 0.5 },
  ghost:    { normal: 0, psychic: 2, ghost: 2, dark: 0.5 },
  dragon:   { dragon: 2, steel: 0.5, fairy: 0 },
  dark:     { fighting: 0.5, psychic: 2, ghost: 2, dark: 0.5, fairy: 0.5 },
  steel:    { fire: 0.5, water: 0.5, electric: 0.5, ice: 2, rock: 2, steel: 0.5, fairy: 2 },
  fairy:    { fire: 0.5, fighting: 2, poison: 0.5, dragon: 2, dark: 2, steel: 0.5 },
};

const ALL_TYPES = Object.keys(TYPE_CHART);

// Calcule, pour un ou deux types défenseurs donnés, le multiplicateur total
// reçu de chaque type attaquant (produit si double-type). Retourne trois
// listes triées : faiblesses (>1), résistances (<1 et >0), immunités (=0).
export function computeTypeMatchups(defendingTypes) {
  const multipliers = ALL_TYPES.map((attackType) => {
    const mult = defendingTypes.reduce((acc, defType) => {
      const chart = TYPE_CHART[attackType] || {};
      const m = chart[defType];
      return acc * (m === undefined ? 1 : m);
    }, 1);
    return { type: attackType, mult };
  });

  const weaknesses = multipliers
    .filter((m) => m.mult > 1)
    .sort((a, b) => b.mult - a.mult);
  const resistances = multipliers
    .filter((m) => m.mult < 1 && m.mult > 0)
    .sort((a, b) => a.mult - b.mult);
  const immunities = multipliers.filter((m) => m.mult === 0);

  return { weaknesses, resistances, immunities };
}
