/* ============================================================
   Popote — Génération des menus et de la liste de courses
   ============================================================ */

const Generator = (() => {
  const FALLBACK_TYPES = {
    "petit-dej": ["petit-dej"],
    "dejeuner": ["dejeuner", "diner"],
    "diner": ["diner", "dejeuner"],
    "snack": ["snack"]
  };

  function normalizeSettings(settings) {
    const source = settings || {};
    const meals = Array.isArray(source.meals) && source.meals.length
      ? MEAL_SLOTS.map((slot) => slot.id).filter((id) => source.meals.includes(id))
      : ["dejeuner", "diner"];

    return {
      startDate: /^\d{4}-\d{2}-\d{2}$/.test(source.startDate || "") ? source.startDate : todayISO(),
      days: Math.round(clamp(source.days || 5, 1, 14)),
      persons: Math.round(clamp(source.persons || 2, 1, 12)),
      meals,
      favor: Array.isArray(source.favor) ? source.favor.filter((tag) => TAG_BY_ID[tag]) : [],
      avoid: Array.isArray(source.avoid) ? source.avoid.filter((tag) => TAG_BY_ID[tag]) : []
    };
  }

  /* Toutes les recettes compatibles avec un créneau (avec repli déj. ↔ dîner). */
  function poolFor(slot, recipes) {
    const source = recipes || Store.recipes;
    const types = FALLBACK_TYPES[slot] || [slot];
    return source.filter((recipe) => types.includes(recipe.type));
  }

  function choose(slot, settings, recipes, usage, lastUsed, dayIndex, excludeIds) {
    const excluded = new Set(excludeIds || []);
    let pool = poolFor(slot, recipes).filter((recipe) => !excluded.has(recipe.id));
    if (!pool.length) return null;

    const withoutAvoided = pool.filter((recipe) => !recipe.tags.some((tag) => settings.avoid.includes(tag)));
    if (withoutAvoided.length) pool = withoutAvoided;

    const scored = pool.map((recipe) => {
      let score = Math.random() * 2.2;
      score += recipe.tags.filter((tag) => settings.favor.includes(tag)).length * 3;
      if (recipe.favorite) score += 1.1;
      score -= (usage[recipe.id] || 0) * 5;
      if (lastUsed[recipe.id] != null && dayIndex - lastUsed[recipe.id] <= 2) score -= 4.5;
      return { recipe, score };
    }).sort((a, b) => b.score - a.score);

    // On tire au sort parmi les 3 meilleurs pour garder de la variété.
    const top = scored.slice(0, Math.min(3, scored.length));
    return top[Math.floor(Math.random() * top.length)].recipe;
  }

  /**
   * Construit un planning complet.
   * Les repas épinglés (locked) du planning précédent sont conservés
   * s'ils correspondent à la même date et au même créneau.
   */
  function generate(rawSettings, previousPlan, options) {
    const settings = normalizeSettings(rawSettings);
    const opts = options || {};
    const recipes = Store.recipes;
    const usage = {};
    const lastUsed = {};
    const days = [];

    for (let dayIndex = 0; dayIndex < settings.days; dayIndex += 1) {
      const date = addDaysISO(settings.startDate, dayIndex);
      const previousDay = previousPlan
        ? previousPlan.days.find((day) => day.date === date)
        : null;

      const meals = settings.meals.map((slot) => {
        const previousMeal = previousDay
          ? previousDay.meals.find((meal) => meal.slot === slot)
          : null;

        if (previousMeal && previousMeal.locked && Store.getRecipe(previousMeal.recipeId)) {
          usage[previousMeal.recipeId] = (usage[previousMeal.recipeId] || 0) + 1;
          lastUsed[previousMeal.recipeId] = dayIndex;
          return { slot, recipeId: previousMeal.recipeId, locked: true };
        }

        const exclude = opts.excludeCurrent && previousMeal && previousMeal.recipeId
          ? [previousMeal.recipeId]
          : [];

        const recipe = choose(slot, settings, recipes, usage, lastUsed, dayIndex, exclude);

        if (recipe) {
          usage[recipe.id] = (usage[recipe.id] || 0) + 1;
          lastUsed[recipe.id] = dayIndex;
        }

        return { slot, recipeId: recipe ? recipe.id : null, locked: false };
      });

      days.push({ date, meals });
    }

    const plan = { startDate: settings.startDate, days, settings };
    Store.setPlan(plan);
    return plan;
  }

  function regenerate() {
    const plan = Store.state.plan;
    if (!plan) return null;
    return generate(plan.settings, plan, { excludeCurrent: true });
  }

  function findMeal(dayIndex, slot) {
    const plan = Store.state.plan;
    if (!plan || !plan.days[dayIndex]) return null;
    return plan.days[dayIndex].meals.find((meal) => meal.slot === slot) || null;
  }

  function swap(dayIndex, slot) {
    const plan = Store.state.plan;
    const meal = findMeal(dayIndex, slot);
    if (!plan || !meal) return false;

    const usage = {};
    const lastUsed = {};
    const used = new Set();

    plan.days.forEach((day, index) => {
      day.meals.forEach((item) => {
        if (!item.recipeId) return;
        used.add(item.recipeId);
        usage[item.recipeId] = (usage[item.recipeId] || 0) + 1;
        lastUsed[item.recipeId] = index;
      });
    });

    // On privilégie une recette encore absente du planning, en respectant
    // les envies et exclusions. Si tout a déjà été utilisé, on relâche
    // simplement la contrainte d'unicité.
    let next = choose(slot, plan.settings, Store.recipes, usage, lastUsed, dayIndex, Array.from(used));
    if (!next) next = choose(slot, plan.settings, Store.recipes, {}, {}, dayIndex, [meal.recipeId]);
    if (!next) return false;

    meal.recipeId = next.id;
    meal.locked = false;
    Store.save();
    return true;
  }

  function assign(dayIndex, slot, recipeId) {
    const meal = findMeal(dayIndex, slot);
    if (!meal || !Store.getRecipe(recipeId)) return false;
    meal.recipeId = recipeId;
    meal.locked = false;
    Store.save();
    return true;
  }

  function toggleLock(dayIndex, slot) {
    const meal = findMeal(dayIndex, slot);
    if (!meal || !meal.recipeId) return false;
    meal.locked = !meal.locked;
    Store.save();
    return meal.locked;
  }

  function remove(dayIndex, slot) {
    const meal = findMeal(dayIndex, slot);
    if (!meal) return false;
    meal.recipeId = null;
    meal.locked = false;
    Store.save();
    return true;
  }

  /* ---------- Liste de courses ---------- */

  function baseUnit(unit) {
    if (unit === "kg") return "g";
    if (unit === "l") return "ml";
    if (unit === "cl") return "ml";
    return unit;
  }

  function toBaseQty(unit, qty) {
    if (qty == null || isNaN(qty)) return null;
    if (unit === "kg") return qty * 1000;
    if (unit === "l") return qty * 1000;
    if (unit === "cl") return qty * 10;
    return qty;
  }

  function shoppingList() {
    const plan = Store.state.plan;
    const empty = { items: [], groups: [], persons: 0, days: 0, meals: 0, recipeCount: 0 };
    if (!plan) return empty;

    const persons = plan.settings.persons;
    const map = new Map();
    const recipeIds = new Set();
    let meals = 0;

    plan.days.forEach((day) => {
      day.meals.forEach((meal) => {
        const recipe = Store.getRecipe(meal.recipeId);
        if (!recipe) return;

        meals += 1;
        recipeIds.add(recipe.id);
        const factor = persons / (recipe.servings || 1);

        recipe.ingredients.forEach((ingredient) => {
          const unit = baseUnit(ingredient.unit);
          const qty = toBaseQty(ingredient.unit, ingredient.qty == null ? null : ingredient.qty * factor);
          const key = ingredient.cat + "|" + ingredient.name.toLowerCase().trim() + "|" + unit;

          if (!map.has(key)) {
            map.set(key, {
              key,
              cat: ingredient.cat,
              name: ingredient.name,
              unit,
              qty: 0,
              loose: false
            });
          }

          const item = map.get(key);
          if (qty == null) item.loose = true;
          else item.qty += qty;
        });
      });
    });

    const items = Array.from(map.values())
      .map((item) => ({ ...item, qty: roundQty(item.qty) }))
      .sort((a, b) => {
        const orderA = (CATEGORY_META[a.cat] || CATEGORY_META.Autre).order;
        const orderB = (CATEGORY_META[b.cat] || CATEGORY_META.Autre).order;
        if (orderA !== orderB) return orderA - orderB;
        return a.name.localeCompare(b.name, "fr");
      });

    const groups = [];
    items.forEach((item) => {
      let group = groups.find((entry) => entry.cat === item.cat);
      if (!group) {
        group = { cat: item.cat, items: [] };
        groups.push(group);
      }
      group.items.push(item);
    });

    groups.sort((a, b) => {
      const orderA = (CATEGORY_META[a.cat] || CATEGORY_META.Autre).order;
      const orderB = (CATEGORY_META[b.cat] || CATEGORY_META.Autre).order;
      return orderA - orderB;
    });

    return {
      items,
      groups,
      persons,
      days: plan.days.length,
      meals,
      recipeCount: recipeIds.size
    };
  }

  return {
    normalizeSettings,
    poolFor,
    generate,
    regenerate,
    swap,
    assign,
    toggleLock,
    remove,
    shoppingList
  };
})();
