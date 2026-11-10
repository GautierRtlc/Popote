/* ============================================================
   Popote — Utilitaires + stockage local
   ============================================================ */

/* ---------- Utilitaires génériques ---------- */

function esc(value) {
  return String(value == null ? "" : value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function clamp(value, min, max) {
  const n = Number(value);
  if (isNaN(n)) return min;
  return Math.min(max, Math.max(min, n));
}

function capitalize(text) {
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : "";
}

/* ---------- Dates (format YYYY-MM-DD, sans fuseau horaire) ---------- */

function isoOf(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return y + "-" + m + "-" + d;
}

function parseISO(iso) {
  const parts = String(iso || "").split("-").map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) return new Date();
  return new Date(parts[0], parts[1] - 1, parts[2]);
}

function todayISO() {
  return isoOf(new Date());
}

function addDaysISO(iso, days) {
  const d = parseISO(iso);
  d.setDate(d.getDate() + Number(days || 0));
  return isoOf(d);
}

function formatDayName(iso) {
  return capitalize(new Intl.DateTimeFormat("fr-FR", { weekday: "long" }).format(parseISO(iso)));
}

function formatShortDate(iso) {
  return new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short" }).format(parseISO(iso));
}

function formatLongDate(iso) {
  return capitalize(
    new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long" }).format(parseISO(iso))
  );
}

/* ---------- Quantités ---------- */

function roundQty(q) {
  return Math.round(q * 10) / 10;
}

function formatNumber(q) {
  const rounded = roundQty(q);
  if (Number.isInteger(rounded)) return String(rounded);
  return rounded.toFixed(1).replace(".", ",");
}

function formatQty(qty, unit) {
  if (qty == null || isNaN(qty)) return "au goût";
  let q = Number(qty);
  let u = unit;

  if (u === "g" && q >= 1000) { q = q / 1000; u = "kg"; }
  else if (u === "ml" && q >= 1000) { q = q / 1000; u = "l"; }

  if (u === "pièce") return formatNumber(q) + " ×";
  if (u === "tranche") return formatNumber(q) + (q > 1 ? " tranches" : " tranche");
  if (u === "gousse") return formatNumber(q) + (q > 1 ? " gousses" : " gousse");
  if (u === "pincée") return formatNumber(q) + (q > 1 ? " pincées" : " pincée");
  if (u === "botte") return formatNumber(q) + (q > 1 ? " bottes" : " botte");
  if (u === "branche") return formatNumber(q) + (q > 1 ? " branches" : " branche");
  if (u === "poignée") return formatNumber(q) + (q > 1 ? " poignées" : " poignée");
  return formatNumber(q) + " " + u;
}

/* ============================================================
   Store : état de l'application + persistance localStorage
   ============================================================ */

const Store = (() => {
  const KEY = "popote.v1";
  let state = null;

  function cloneSeedRecipes() {
    return SEED_RECIPES.map((recipe) => ({
      ...recipe,
      tags: recipe.tags.slice(),
      ingredients: recipe.ingredients.map((ing) => ({ ...ing }))
    }));
  }

  function defaultState() {
    return {
      version: 1,
      recipes: cloneSeedRecipes(),
      profiles: defaultProfiles(2),
      plan: null,
      shopping: { checked: {} }
    };
  }

  function normalizeRecipe(recipe) {
    const safe = recipe && typeof recipe === "object" ? recipe : {};
    const tags = Array.isArray(safe.tags) ? safe.tags.filter((t) => TAG_BY_ID[t]) : [];
    const ingredients = Array.isArray(safe.ingredients)
      ? safe.ingredients
          .filter((ing) => ing && String(ing.name || "").trim())
          .map((ing) => ({
            qty: ing.qty === null || ing.qty === undefined || ing.qty === "" || isNaN(Number(ing.qty))
              ? null
              : Number(ing.qty),
            unit: UNITS.includes(ing.unit) ? ing.unit : "pièce",
            name: String(ing.name).trim(),
            cat: CATEGORIES.includes(ing.cat) ? ing.cat : "Autre"
          }))
      : [];

    return {
      id: safe.id || uid("r"),
      name: String(safe.name || "Recette sans nom").trim(),
      emoji: safe.emoji || "🍽️",
      type: TYPE_META[safe.type] ? safe.type : "dejeuner",
      tags,
      time: clamp(safe.time || 20, 1, 600),
      servings: clamp(safe.servings || 2, 1, 50),
      ingredients,
      steps: String(safe.steps || ""),
      favorite: Boolean(safe.favorite),
      createdAt: Number(safe.createdAt) || Date.now()
    };
  }

  function defaultProfiles(count) {
    const total = Math.min(12, Math.max(1, Math.round(Number(count) || 2)));
    return Array.from({ length: total }, (_, index) => ({
      id: uid("p"),
      name: "Personne " + (index + 1),
      tags: []
    }));
  }

  function normalizeProfilesList(list, fallbackCount) {
    const source = Array.isArray(list) ? list : [];
    const count = Math.min(12, source.length || Math.max(1, Math.round(Number(fallbackCount) || 2)));
    const profiles = [];
    const usedIds = new Set();

    for (let index = 0; index < count; index += 1) {
      const sourceProfile = source[index] || {};
      const name = String(sourceProfile.name || "").trim().slice(0, 24);
      let id = sourceProfile.id || uid("p");
      if (usedIds.has(id)) id = uid("p");
      usedIds.add(id);
      profiles.push({
        id,
        name: name || "Personne " + (index + 1),
        tags: Array.isArray(sourceProfile.tags)
          ? sourceProfile.tags.filter((t) => TAG_BY_ID[t])
          : []
      });
    }

    return profiles;
  }

  function normalizePlan(plan, fallbackProfiles) {
    if (!plan || typeof plan !== "object" || !Array.isArray(plan.days)) return null;
    const settings = plan.settings || {};
    const rawProfiles = Array.isArray(plan.profiles) && plan.profiles.length
      ? plan.profiles
      : Array.isArray(settings.profiles) && settings.profiles.length
        ? settings.profiles
        : Array.isArray(fallbackProfiles) && fallbackProfiles.length
          ? fallbackProfiles
          : null;
    const profiles = rawProfiles
      ? normalizeProfilesList(rawProfiles)
      : defaultProfiles(settings.persons || 2);
    const meals = Array.isArray(settings.meals) && settings.meals.length
      ? settings.meals.filter((m) => MEAL_BY_ID[m])
      : ["dejeuner", "diner"];

    return {
      startDate: /^\d{4}-\d{2}-\d{2}$/.test(settings.startDate || "") ? settings.startDate : todayISO(),
      profiles,
      days: plan.days
        .filter((day) => day && Array.isArray(day.meals))
        .map((day) => ({
          date: /^\d{4}-\d{2}-\d{2}$/.test(day.date || "") ? day.date : todayISO(),
          meals: day.meals
            .filter((meal) => meal && MEAL_BY_ID[meal.slot])
            .map((meal) => {
              const oldVariants = Array.isArray(meal.variants) ? meal.variants : null;
              return {
                slot: meal.slot,
                variants: profiles.map((profile) => {
                  const oldVariant = oldVariants
                    ? oldVariants.find((variant) => variant && variant.profileId === profile.id)
                    : null;

                  // Ancien format : un seul plat partagé par tout le monde.
                  if (!oldVariants) {
                    return {
                      profileId: profile.id,
                      recipeId: meal.recipeId || null,
                      locked: Boolean(meal.locked && meal.recipeId)
                    };
                  }

                  return {
                    profileId: profile.id,
                    recipeId: oldVariant ? oldVariant.recipeId || null : null,
                    locked: Boolean(oldVariant && oldVariant.locked && oldVariant.recipeId)
                  };
                })
              };
            })
        })),
      settings: {
        startDate: /^\d{4}-\d{2}-\d{2}$/.test(settings.startDate || "") ? settings.startDate : todayISO(),
        days: clamp(settings.days || plan.days.length || 5, 1, 14),
        persons: profiles.length,
        meals,
        favor: Array.isArray(settings.favor) ? settings.favor.filter((t) => TAG_BY_ID[t]) : [],
        avoid: Array.isArray(settings.avoid) ? settings.avoid.filter((t) => TAG_BY_ID[t]) : []
      }
    };
  }

  function load() {
    let raw = null;
    try {
      raw = localStorage.getItem(KEY);
    } catch (error) {
      console.warn("Popote : localStorage indisponible.", error);
    }

    if (!raw) {
      state = defaultState();
      persist();
      return;
    }

    try {
      const parsed = JSON.parse(raw);
      if (!parsed || !Array.isArray(parsed.recipes)) {
        state = defaultState();
        persist();
        return;
      }
      const plan = normalizePlan(parsed.plan, parsed.profiles);
      const storedProfiles = Array.isArray(parsed.profiles) && parsed.profiles.length
        ? parsed.profiles
        : (plan ? plan.profiles : null);

      state = {
        version: 1,
        recipes: parsed.recipes.map(normalizeRecipe),
        profiles: normalizeProfilesList(storedProfiles),
        plan,
        shopping: parsed.shopping && typeof parsed.shopping.checked === "object"
          ? { checked: parsed.shopping.checked }
          : { checked: {} }
      };
    } catch (error) {
      console.warn("Popote : données illisibles, réinitialisation.", error);
      state = defaultState();
      persist();
    }
  }

  function persist() {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch (error) {
      console.warn("Popote : impossible d'enregistrer les données.", error);
    }
  }

  function uid(prefix) {
    return (prefix || "r") + "-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 7);
  }

  function getRecipe(id) {
    return state.recipes.find((recipe) => recipe.id === id) || null;
  }

  function upsertRecipe(recipe) {
    const normalized = normalizeRecipe(recipe);
    const index = state.recipes.findIndex((item) => item.id === normalized.id);
    if (index >= 0) state.recipes[index] = normalized;
    else state.recipes.unshift(normalized);
    persist();
    return normalized;
  }

  function deleteRecipe(id) {
    state.recipes = state.recipes.filter((recipe) => recipe.id !== id);
    if (state.plan) {
      state.plan.days.forEach((day) => {
        day.meals.forEach((meal) => {
          (meal.variants || []).forEach((variant) => {
            if (variant.recipeId === id) {
              variant.recipeId = null;
              variant.locked = false;
            }
          });
        });
      });
    }
    persist();
  }

  function toggleFavorite(id) {
    const recipe = getRecipe(id);
    if (!recipe) return;
    recipe.favorite = !recipe.favorite;
    persist();
  }

  function setProfiles(profiles) {
    state.profiles = normalizeProfilesList(profiles);
    persist();
    return state.profiles;
  }

  function setPlan(plan) {
    state.plan = plan;
    if (plan && Array.isArray(plan.profiles) && plan.profiles.length) {
      state.profiles = normalizeProfilesList(plan.profiles);
    }
    state.shopping.checked = {};
    persist();
  }

  function clearPlan() {
    state.plan = null;
    state.shopping.checked = {};
    persist();
  }

  function restoreSeeds() {
    let added = 0;
    cloneSeedRecipes().forEach((seed) => {
      if (!state.recipes.some((recipe) => recipe.id === seed.id)) {
        state.recipes.push(seed);
        added += 1;
      }
    });
    persist();
    return added;
  }

  function exportJSON() {
    return JSON.stringify(state, null, 2);
  }

  function importJSON(text) {
    const parsed = JSON.parse(text);
    if (!parsed || !Array.isArray(parsed.recipes)) {
      throw new Error("Fichier invalide : recettes manquantes.");
    }

    // Une sauvegarde ancienne peut ne contenir aucun convive : on garde alors
    // ceux déjà enregistrés dans ce navigateur au lieu de les effacer.
    const previousProfiles = Array.isArray(state.profiles) ? state.profiles : null;
    const plan = normalizePlan(parsed.plan, parsed.profiles || previousProfiles);
    const storedProfiles = Array.isArray(parsed.profiles) && parsed.profiles.length
      ? parsed.profiles
      : (plan ? plan.profiles : previousProfiles);

    state = {
      version: 1,
      recipes: parsed.recipes.map(normalizeRecipe),
      profiles: normalizeProfilesList(storedProfiles),
      plan,
      shopping: parsed.shopping && typeof parsed.shopping.checked === "object"
        ? { checked: parsed.shopping.checked }
        : { checked: {} }
    };
    persist();
  }

  function resetAll() {
    state = defaultState();
    persist();
  }

  return {
    load,
    get state() { return state; },
    get recipes() { return state.recipes; },
    get profiles() { return state.profiles; },
    save: persist,
    uid,
    getRecipe,
    upsertRecipe,
    deleteRecipe,
    toggleFavorite,
    setProfiles,
    setPlan,
    clearPlan,
    restoreSeeds,
    exportJSON,
    importJSON,
    resetAll
  };
})();
