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

  function normalizePlan(plan) {
    if (!plan || typeof plan !== "object" || !Array.isArray(plan.days)) return null;
    const settings = plan.settings || {};
    const meals = Array.isArray(settings.meals) && settings.meals.length
      ? settings.meals.filter((m) => MEAL_BY_ID[m])
      : ["dejeuner", "diner"];

    return {
      startDate: /^\d{4}-\d{2}-\d{2}$/.test(settings.startDate || "") ? settings.startDate : todayISO(),
      days: plan.days
        .filter((day) => day && Array.isArray(day.meals))
        .map((day) => ({
          date: /^\d{4}-\d{2}-\d{2}$/.test(day.date || "") ? day.date : todayISO(),
          meals: day.meals
            .filter((meal) => meal && MEAL_BY_ID[meal.slot])
            .map((meal) => ({
              slot: meal.slot,
              recipeId: meal.recipeId || null,
              locked: Boolean(meal.locked)
            }))
        })),
      settings: {
        startDate: /^\d{4}-\d{2}-\d{2}$/.test(settings.startDate || "") ? settings.startDate : todayISO(),
        days: clamp(settings.days || plan.days.length || 5, 1, 14),
        persons: clamp(settings.persons || 2, 1, 12),
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
      state = {
        version: 1,
        recipes: parsed.recipes.map(normalizeRecipe),
        plan: normalizePlan(parsed.plan),
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
          if (meal.recipeId === id) {
            meal.recipeId = null;
            meal.locked = false;
          }
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

  function setPlan(plan) {
    state.plan = plan;
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
    state = {
      version: 1,
      recipes: parsed.recipes.map(normalizeRecipe),
      plan: normalizePlan(parsed.plan),
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
    save: persist,
    uid,
    getRecipe,
    upsertRecipe,
    deleteRecipe,
    toggleFavorite,
    setPlan,
    clearPlan,
    restoreSeeds,
    exportJSON,
    importJSON,
    resetAll
  };
})();
