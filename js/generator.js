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

  function normalizeProfiles(rawProfiles, fallbackCount) {
    const source = Array.isArray(rawProfiles) ? rawProfiles : [];
    const count = Math.min(12, source.length || Math.round(clamp(fallbackCount || 2, 1, 12)));
    const profiles = [];

    for (let index = 0; index < count; index += 1) {
      const sourceProfile = source[index] || {};
      const name = String(sourceProfile.name || "").trim().slice(0, 24);
      profiles.push({
        id: sourceProfile.id || Store.uid("p"),
        name: name || "Personne " + (index + 1),
        tags: Array.isArray(sourceProfile.tags)
          ? sourceProfile.tags.filter((tag) => TAG_BY_ID[tag])
          : []
      });
    }

    return profiles;
  }

  function normalizeSettings(settings) {
    const source = settings || {};
    const profiles = normalizeProfiles(source.profiles, source.persons);
    const meals = Array.isArray(source.meals) && source.meals.length
      ? MEAL_SLOTS.map((slot) => slot.id).filter((id) => source.meals.includes(id))
      : ["dejeuner", "diner"];

    return {
      startDate: /^\d{4}-\d{2}-\d{2}$/.test(source.startDate || "") ? source.startDate : todayISO(),
      days: Math.round(clamp(source.days || 5, 1, 14)),
      persons: profiles.length,
      profiles,
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

  function choose(slot, settings, recipes, usage, lastUsed, dayIndex, excludeIds, personTags) {
    const excluded = new Set(excludeIds || []);
    let pool = poolFor(slot, recipes).filter((recipe) => !excluded.has(recipe.id));
    if (!pool.length) return null;

    const withoutAvoided = pool.filter((recipe) => !recipe.tags.some((tag) => settings.avoid.includes(tag)));
    if (withoutAvoided.length) pool = withoutAvoided;

    // Le style d'une personne est prioritaire : on restreint le choix aux
    // recettes qui correspondent, avec repli sur le pool complet si besoin.
    const personalTags = Array.isArray(personTags) ? personTags : [];
    if (personalTags.length) {
      const matching = pool.filter((recipe) => recipe.tags.some((tag) => personalTags.includes(tag)));
      if (matching.length) pool = matching;
    }

    const likedTags = Array.from(new Set((settings.favor || []).concat(personalTags)));

    const scored = pool.map((recipe) => {
      let score = Math.random() * 2.2;
      score += recipe.tags.filter((tag) => likedTags.includes(tag)).length * 3;
      if (recipe.favorite) score += 1.1;
      score -= (usage[recipe.id] || 0) * 5;
      if (lastUsed[recipe.id] != null && dayIndex - lastUsed[recipe.id] <= 2) score -= 4.5;
      return { recipe, score };
    }).sort((a, b) => b.score - a.score);

    // On tire au sort parmi les 3 meilleurs pour garder de la variété.
    const top = scored.slice(0, Math.min(3, scored.length));
    return top[Math.floor(Math.random() * top.length)].recipe;
  }

  function trackRecipe(usage, lastUsed, recipeId, dayIndex) {
    if (!recipeId) return;
    usage[recipeId] = (usage[recipeId] || 0) + 1;
    lastUsed[recipeId] = dayIndex;
  }

  /**
   * Construit un planning complet, avec un menu par personne.
   * Les repas épinglés (locked) du planning précédent sont conservés
   * s'ils correspondent à la même date, au même créneau et à la même personne.
   */
  function generate(rawSettings, previousPlan, options) {
    const settings = normalizeSettings(rawSettings);
    const opts = options || {};
    const recipes = Store.recipes;
    const profileStates = {};

    settings.profiles.forEach((profile) => {
      profileStates[profile.id] = { usage: {}, lastUsed: {} };
    });

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
        const usedThisSlot = new Set();

        const variants = settings.profiles.map((profile) => {
          const profileState = profileStates[profile.id];
          const previousVariant = previousMeal && Array.isArray(previousMeal.variants)
            ? previousMeal.variants.find((variant) => variant.profileId === profile.id)
            : null;
          const lockedRecipe = previousVariant && previousVariant.locked
            ? Store.getRecipe(previousVariant.recipeId)
            : null;

          if (lockedRecipe) {
            usedThisSlot.add(lockedRecipe.id);
            trackRecipe(profileState.usage, profileState.lastUsed, lockedRecipe.id, dayIndex);
            return { profileId: profile.id, recipeId: lockedRecipe.id, locked: true };
          }

          const exclude = Array.from(usedThisSlot);
          if (opts.excludeCurrent && previousVariant && previousVariant.recipeId) {
            exclude.push(previousVariant.recipeId);
          }

          const recipe = choose(
            slot,
            settings,
            recipes,
            profileState.usage,
            profileState.lastUsed,
            dayIndex,
            exclude,
            profile.tags
          );

          if (recipe) {
            usedThisSlot.add(recipe.id);
            trackRecipe(profileState.usage, profileState.lastUsed, recipe.id, dayIndex);
          }

          return { profileId: profile.id, recipeId: recipe ? recipe.id : null, locked: false };
        });

        return { slot, variants };
      });

      days.push({ date, meals });
    }

    const storedSettings = { ...settings };
    delete storedSettings.profiles;

    const plan = {
      startDate: settings.startDate,
      profiles: settings.profiles,
      days,
      settings: storedSettings
    };

    Store.setPlan(plan);
    return plan;
  }

  function regenerate() {
    const plan = Store.state.plan;
    if (!plan) return null;
    const settings = { ...plan.settings, profiles: plan.profiles };
    return generate(settings, plan, { excludeCurrent: true });
  }

  function findMeal(dayIndex, slot) {
    const plan = Store.state.plan;
    if (!plan || !plan.days[dayIndex]) return null;
    return plan.days[dayIndex].meals.find((meal) => meal.slot === slot) || null;
  }

  function findVariant(dayIndex, slot, profileId) {
    const meal = findMeal(dayIndex, slot);
    if (!meal || !Array.isArray(meal.variants)) return null;
    return meal.variants.find((variant) => variant.profileId === profileId) || null;
  }

  function swap(dayIndex, slot, profileId) {
    const plan = Store.state.plan;
    const meal = findMeal(dayIndex, slot);
    const variant = findVariant(dayIndex, slot, profileId);
    if (!plan || !meal || !variant) return false;

    const profile = plan.profiles.find((item) => item.id === profileId);
    const usage = {};
    const lastUsed = {};

    plan.days.forEach((day, index) => {
      day.meals.forEach((item) => {
        (item.variants || []).forEach((entry) => {
          if (entry.profileId === profileId && entry.recipeId) {
            trackRecipe(usage, lastUsed, entry.recipeId, index);
          }
        });
      });
    });

    // On évite de servir le même plat à plusieurs convives sur le même créneau.
    const usedToday = new Set(
      meal.variants
        .filter((entry) => entry.profileId !== profileId && entry.recipeId)
        .map((entry) => entry.recipeId)
    );
    const exclude = Array.from(usedToday);
    if (variant.recipeId) exclude.push(variant.recipeId);

    let next = choose(
      slot,
      plan.settings,
      Store.recipes,
      usage,
      lastUsed,
      dayIndex,
      exclude,
      profile ? profile.tags : []
    );

    if (!next) {
      next = choose(
        slot,
        plan.settings,
        Store.recipes,
        {},
        {},
        dayIndex,
        variant.recipeId ? [variant.recipeId] : [],
        profile ? profile.tags : []
      );
    }
    if (!next) return false;

    variant.recipeId = next.id;
    variant.locked = false;
    Store.save();
    return true;
  }

  function assign(dayIndex, slot, recipeId, profileId) {
    const variant = findVariant(dayIndex, slot, profileId);
    if (!variant || !Store.getRecipe(recipeId)) return false;
    variant.recipeId = recipeId;
    variant.locked = false;
    Store.save();
    return true;
  }

  function toggleLock(dayIndex, slot, profileId) {
    const variant = findVariant(dayIndex, slot, profileId);
    if (!variant || !variant.recipeId) return false;
    variant.locked = !variant.locked;
    Store.save();
    return variant.locked;
  }

  function remove(dayIndex, slot, profileId) {
    const variant = findVariant(dayIndex, slot, profileId);
    if (!variant) return false;
    variant.recipeId = null;
    variant.locked = false;
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

    const persons = Array.isArray(plan.profiles) && plan.profiles.length
      ? plan.profiles.length
      : (plan.settings.persons || 1);
    const map = new Map();
    const recipeIds = new Set();
    let portions = 0;

    plan.days.forEach((day) => {
      day.meals.forEach((meal) => {
        const shared = !Array.isArray(meal.variants);
        const variants = shared
          ? [{ profileId: null, recipeId: meal.recipeId, locked: meal.locked }]
          : meal.variants;

        variants.forEach((variant) => {
          const recipe = Store.getRecipe(variant.recipeId);
          if (!recipe) return;

          portions += 1;
          recipeIds.add(recipe.id);

          // Chaque variante correspond à une personne. Un ancien repas
          // partagé est converti en portions pour tout le monde.
          const factor = shared
            ? persons / (recipe.servings || 1)
            : 1 / (recipe.servings || 1);

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
      meals: portions,
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
