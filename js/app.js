/* ============================================================
   Popote — Interface et interactions
   ============================================================ */

const UI = {
  view: "recipes",
  search: "",
  filter: "all",
  setupOpen: false,
  menuProfile: "all"
};

const EMOJIS = ["🍳", "🥗", "🍝", "🥘", "🍲", "🍛", "🌯", "🥪", "🥙", "🥣", "🥞", "🍰", "🍎", "🍗", "🐟", "🥑", "🍫", "🫓"];

const PROFILE_COLORS = ["#3c6b4e", "#b05429", "#6a5a9e", "#2f7d8c", "#9a6b1f", "#8d4f6a", "#5e7a2f", "#8a4b3a", "#4f6f9e", "#7a6b3f", "#a34f7a", "#3f7a68"];

function profileColor(index) {
  return PROFILE_COLORS[index % PROFILE_COLORS.length];
}

function profileStyle(profile) {
  return profile && Array.isArray(profile.tags) && profile.tags[0] ? TAG_BY_ID[profile.tags[0]] : null;
}

function defaultProfiles(count) {
  const total = Math.round(clamp(count || 2, 1, 12));
  return Array.from({ length: total }, (_, index) => ({
    id: Store.uid("p"),
    name: "Personne " + (index + 1),
    tags: []
  }));
}

const HEART_SVG_ON = '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M12 21s-7.5-4.7-9.5-9A5.4 5.4 0 0 1 12 6.5 5.4 5.4 0 0 1 21.5 12c-2 4.3-9.5 9-9.5 9z" fill="currentColor"/></svg>';
const HEART_SVG_OFF = '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M12 20.3s-7-4.4-8.9-8.5A5 5 0 0 1 12 7.1a5 5 0 0 1 8.9 4.7c-1.9 4.1-8.9 8.5-8.9 8.5z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></svg>';

/* ---------- Démarrage ---------- */

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}

function init() {
  Store.load();
  bindGlobalEvents();
  bindRecipesToolbar();

  const hash = (location.hash || "").replace("#", "");
  if (["recipes", "menus", "courses"].includes(hash)) {
    UI.view = hash;
  }
  syncViewVisibility();
  render();
}

/* ---------- Navigation & événements globaux ---------- */

function bindGlobalEvents() {
  document.addEventListener("click", (event) => {
    const nav = event.target.closest("[data-view]");
    if (nav) {
      event.preventDefault();
      switchView(nav.dataset.view);
      return;
    }

    const actionEl = event.target.closest("[data-action]");
    if (!actionEl) return;
    handleAction(actionEl.dataset.action, actionEl);
  });

  document.addEventListener("change", (event) => {
    const checkbox = event.target.closest("[data-check-key]");
    if (!checkbox) return;
    const key = checkbox.dataset.checkKey;
    if (checkbox.checked) Store.state.shopping.checked[key] = true;
    else delete Store.state.shopping.checked[key];
    Store.save();
    renderCourses();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeModal();
  });

  window.addEventListener("hashchange", () => {
    const hash = (location.hash || "").replace("#", "");
    if (["recipes", "menus", "courses"].includes(hash) && hash !== UI.view) {
      switchView(hash, false);
    }
  });
}

function bindRecipesToolbar() {
  const search = document.getElementById("recipe-search");
  search.addEventListener("input", () => {
    UI.search = search.value;
    renderRecipes();
  });

  document.getElementById("recipe-filters").addEventListener("click", (event) => {
    const chip = event.target.closest("[data-filter]");
    if (!chip) return;
    UI.filter = chip.dataset.filter;
    renderRecipes();
  });
}

function switchView(view, updateHash) {
  if (!["recipes", "menus", "courses"].includes(view)) return;
  UI.view = view;
  syncViewVisibility();
  if (updateHash !== false) {
    try {
      history.replaceState(null, "", "#" + view);
    } catch (error) {
      /* file:// peut refuser l'écriture d'historique : sans gravité. */
    }
  }
  window.scrollTo(0, 0);
  render();
}

function syncViewVisibility() {
  document.querySelectorAll(".view").forEach((section) => {
    section.hidden = section.id !== "view-" + UI.view;
  });
  document.querySelectorAll("[data-view]").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.view === UI.view);
  });
}

function render() {
  renderNavCounts();
  if (UI.view === "recipes") renderRecipes();
  if (UI.view === "menus") renderMenus();
  if (UI.view === "courses") renderCourses();
}

function renderNavCounts() {
  const badge = document.getElementById("nav-count-recipes");
  if (badge) badge.textContent = Store.recipes.length;
}

/* ---------- Vue Recettes ---------- */

function renderRecipes() {
  const grid = document.getElementById("recipe-grid");
  const countEl = document.getElementById("recipes-count");
  const all = Store.recipes;

  document.querySelectorAll("#recipe-filters .chip").forEach((chip) => {
    chip.classList.toggle("is-active", chip.dataset.filter === UI.filter);
  });

  const favorites = all.filter((recipe) => recipe.favorite).length;
  const query = UI.search.trim().toLowerCase();

  let list = all.filter((recipe) => {
    const matchesFilter =
      UI.filter === "all" ||
      (UI.filter === "favorite" ? recipe.favorite : recipe.type === UI.filter);
    if (!matchesFilter) return false;
    if (!query) return true;
    const haystack = [
      recipe.name,
      recipe.tags.map((tag) => (TAG_BY_ID[tag] ? TAG_BY_ID[tag].label : "")).join(" "),
      recipe.ingredients.map((ingredient) => ingredient.name).join(" ")
    ].join(" ").toLowerCase();
    return haystack.includes(query);
  });

  list = list.slice().sort((a, b) => {
    if (a.favorite !== b.favorite) return a.favorite ? -1 : 1;
    return a.name.localeCompare(b.name, "fr");
  });

  if (!all.length) {
    countEl.textContent = "Votre carnet est encore vide.";
    grid.innerHTML = emptyState(
      "📖",
      "Votre carnet est vide",
      "Ajoutez votre première recette : ingrédients, proportions, préparation. Elle servira ensuite à générer vos menus.",
      '<button class="btn btn-primary" type="button" data-action="new-recipe">＋ Créer ma première recette</button>'
    );
    return;
  }

  if (query || UI.filter !== "all") {
    countEl.textContent = list.length + " recette" + (list.length > 1 ? "s" : "") + " affichée" + (list.length > 1 ? "s" : "") + " sur " + all.length + " · " + favorites + " favorite" + (favorites > 1 ? "s" : "");
  } else {
    countEl.textContent = all.length + " recette" + (all.length > 1 ? "s" : "") + " dans votre carnet · " + favorites + " favorite" + (favorites > 1 ? "s" : "");
  }

  if (!list.length) {
    grid.innerHTML = emptyState(
      "🔎",
      "Aucune recette trouvée",
      "Essayez un autre mot-clé ou retirez les filtres pour retrouver toutes vos recettes.",
      '<button class="btn btn-ghost" type="button" data-action="reset-filters">Réinitialiser les filtres</button>'
    );
    return;
  }

  grid.innerHTML = list.map(recipeCardHTML).join("");
}

function recipeCardHTML(recipe) {
  const meta = TYPE_META[recipe.type] || TYPE_META.dejeuner;
  const tags = recipe.tags
    .slice(0, 3)
    .map((tagId) => {
      const tag = TAG_BY_ID[tagId];
      return tag ? '<span class="tag">' + tag.emoji + " " + tag.label + "</span>" : "";
    })
    .join("");
  const extra = recipe.tags.length > 3
    ? '<span class="tag tag-more">+' + (recipe.tags.length - 3) + "</span>"
    : "";

  return (
    '<article class="recipe-card">' +
      '<div class="recipe-tile ' + meta.tile + '">' +
        '<span class="tile-badge">' + meta.emoji + " " + meta.label + "</span>" +
        '<span class="tile-emoji" aria-hidden="true">' + esc(recipe.emoji) + "</span>" +
        '<button class="fav-btn' + (recipe.favorite ? " is-fav" : "") + '" type="button" data-action="toggle-fav" data-id="' + esc(recipe.id) + '" aria-label="' + (recipe.favorite ? "Retirer des favoris" : "Ajouter aux favoris") + '" aria-pressed="' + recipe.favorite + '">' + (recipe.favorite ? HEART_SVG_ON : HEART_SVG_OFF) + "</button>" +
      "</div>" +
      '<button class="recipe-body" type="button" data-action="view-recipe" data-id="' + esc(recipe.id) + '">' +
        '<span class="recipe-name">' + esc(recipe.name) + "</span>" +
        '<span class="recipe-meta"><span>⏱ ' + recipe.time + " min</span><span>👥 " + recipe.servings + " pers.</span></span>" +
        '<span class="tag-list">' + tags + extra + "</span>" +
      "</button>" +
    "</article>"
  );
}

/* ---------- Vue Menus ---------- */

function currentSettings() {
  const plan = Store.state.plan;
  if (plan) {
    return {
      ...plan.settings,
      profiles: plan.profiles.map((profile) => ({ ...profile, tags: profile.tags.slice() }))
    };
  }
  const savedProfiles = Array.isArray(Store.state.profiles) && Store.state.profiles.length
    ? Store.state.profiles
    : defaultProfiles(2);

  return {
    startDate: todayISO(),
    days: 5,
    persons: savedProfiles.length,
    meals: ["dejeuner", "diner"],
    favor: [],
    avoid: [],
    profiles: savedProfiles.map((profile) => ({ ...profile, tags: profile.tags.slice() }))
  };
}

function renderMenus() {
  const plan = Store.state.plan;
  const head = document.getElementById("plan-head-actions");
  head.innerHTML = plan
    ? '<button class="btn btn-primary" type="button" data-action="goto-courses">🛒 Liste de courses</button>'
    : "";

  if (plan && UI.menuProfile !== "all" && !plan.profiles.some((profile) => profile.id === UI.menuProfile)) {
    UI.menuProfile = "all";
  }

  const showSetup = !plan || UI.setupOpen;
  const setupEl = document.getElementById("plan-setup");
  setupEl.innerHTML = showSetup ? setupHTML(currentSettings(), Boolean(plan)) : planSummaryHTML(plan);

  if (showSetup) bindSetupForm();

  document.getElementById("plan-content").innerHTML = plan ? planContentHTML(plan) : emptyPlanHTML();
}

function setupHTML(settings, hasPlan) {
  const mealToggle = (meal) =>
    '<label class="tag-toggle"><input type="checkbox" name="meals" value="' + meal.id + '"' + (settings.meals.includes(meal.id) ? " checked" : "") + "><span>" + meal.emoji + " " + meal.label + "</span></label>";

  const tagToggle = (tag, name) =>
    '<label class="tag-toggle' + (name === "avoid" ? " avoid" : "") + '"><input type="checkbox" name="' + name + '" value="' + tag.id + '"' + (settings[name].includes(tag.id) ? " checked" : "") + "><span>" + tag.emoji + " " + tag.label + "</span></label>";

  const profiles = settings.profiles && settings.profiles.length ? settings.profiles : defaultProfiles(2);

  return (
    '<form class="setup-card card" id="plan-form" novalidate>' +
      '<div class="setup-head">' +
        "<div>" +
          "<h2>Composez votre planning</h2>" +
          "<p>Un menu par personne, selon son envie : on pioche dans vos " + Store.recipes.length + " recettes.</p>" +
        "</div>" +
        (hasPlan ? '<button type="button" class="btn btn-ghost btn-sm" data-action="toggle-setup">Fermer</button>' : "") +
      "</div>" +
      '<div class="setup-grid">' +
        '<label class="field"><span>Date de début</span><input type="date" name="startDate" value="' + esc(settings.startDate) + '" required></label>' +
        '<label class="field"><span>Nombre de jours</span><input type="number" name="days" min="1" max="14" value="' + settings.days + '" required></label>' +
      "</div>" +
      '<div class="setup-section">' +
        '<div class="setup-people-head">' +
          '<span class="setup-label" id="people-label">Les convives <small>un menu par personne</small></span>' +
          '<button type="button" class="btn btn-ghost btn-sm" data-action="add-person">＋ Ajouter une personne</button>' +
        "</div>" +
        '<div class="people-editor" id="people-editor" role="group" aria-labelledby="people-label">' +
          profiles.map((profile, index) => personRowHTML(profile, index)).join("") +
        "</div>" +
        '<p class="hint">Chaque personne reçoit son propre menu selon son envie principale. La liste de courses additionne toutes les portions.</p>' +
      "</div>" +
      '<div class="setup-section"><span class="setup-label">Repas à planifier</span><div class="toggle-row">' + MEAL_SLOTS.map(mealToggle).join("") + "</div></div>" +
      '<div class="setup-section"><span class="setup-label">Envies communes… <small>facultatif</small></span><div class="toggle-row">' + TAGS.map((tag) => tagToggle(tag, "favor")).join("") + "</div></div>" +
      '<div class="setup-section"><span class="setup-label">À éviter… <small>facultatif</small></span><div class="toggle-row">' + TAGS.map((tag) => tagToggle(tag, "avoid")).join("") + "</div></div>" +
      '<div class="setup-foot">' +
        '<p class="hint">💡 Une personne peut avoir un menu healthy, une autre léger, une autre réconfortant…</p>' +
        '<button type="submit" class="btn btn-primary">Générer mes menus ✨</button>' +
      "</div>" +
    "</form>"
  );
}

function personRowHTML(profile, index) {
  const selected = profile.tags && profile.tags[0] ? profile.tags[0] : "";
  const options = TAGS.map((tag) =>
    '<option value="' + tag.id + '"' + (tag.id === selected ? " selected" : "") + ">" + tag.emoji + " " + tag.label + "</option>"
  ).join("");

  return (
    '<div class="person-row" data-person-row>' +
      '<input type="hidden" name="personId" value="' + esc(profile.id || "") + '">' +
      '<input type="text" name="personName" value="' + esc(profile.name || "") + '" maxlength="24" placeholder="Prénom" aria-label="Nom de la personne ' + (index + 1) + '">' +
      '<select name="personStyle" aria-label="Envie de la personne ' + (index + 1) + '">' +
        '<option value="">Sans préférence</option>' + options +
      "</select>" +
      '<button type="button" class="icon-btn" data-action="remove-person" aria-label="Supprimer la personne ' + (index + 1) + '" title="Supprimer cette personne">✕</button>' +
    "</div>"
  );
}

function addPersonRow() {
  const editor = document.getElementById("people-editor");
  if (!editor) return;

  const rows = editor.querySelectorAll(".person-row");
  if (rows.length >= 12) {
    toast("12 personnes maximum.");
    return;
  }

  editor.insertAdjacentHTML("beforeend", personRowHTML({ id: Store.uid("p"), name: "", tags: [] }, rows.length));
  renumberPeople(editor);

  const row = editor.lastElementChild;
  if (row) row.querySelector('input[name="personName"]').focus();
}

function removePersonRow(element) {
  const editor = document.getElementById("people-editor");
  if (!editor) return;

  const rows = editor.querySelectorAll(".person-row");
  if (rows.length <= 1) {
    toast("Gardez au moins une personne.");
    return;
  }

  const row = element.closest(".person-row");
  if (row) row.remove();
  renumberPeople(editor);
}

function renumberPeople(editor) {
  editor.querySelectorAll(".person-row").forEach((row, index) => {
    const name = row.querySelector('input[name="personName"]');
    const style = row.querySelector('select[name="personStyle"]');
    const remove = row.querySelector('[data-action="remove-person"]');
    if (name) name.setAttribute("aria-label", "Nom de la personne " + (index + 1));
    if (style) style.setAttribute("aria-label", "Envie de la personne " + (index + 1));
    if (remove) remove.setAttribute("aria-label", "Supprimer la personne " + (index + 1));
  });
}

function bindSetupForm() {
  const form = document.getElementById("plan-form");
  if (!form) return;

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const meals = data.getAll("meals").filter((slot) => MEAL_BY_ID[slot]);

    if (!meals.length) {
      toast("Choisissez au moins un repas à planifier.");
      return;
    }
    if (!Store.recipes.length) {
      toast("Ajoutez d'abord au moins une recette.");
      return;
    }

    const ids = data.getAll("personId").map((value) => String(value || ""));
    const names = data.getAll("personName").map((value) => String(value || "").trim());
    const styles = data.getAll("personStyle").map((value) => String(value || ""));

    const profiles = names.map((name, index) => ({
      id: ids[index] || Store.uid("p"),
      name: name || "Personne " + (index + 1),
      tags: TAG_BY_ID[styles[index]] ? [styles[index]] : []
    }));

    Store.setProfiles(profiles);

    const settings = {
      startDate: String(data.get("startDate") || todayISO()),
      days: clamp(Number(data.get("days")) || 5, 1, 14),
      persons: profiles.length,
      profiles,
      meals,
      favor: data.getAll("favor"),
      avoid: data.getAll("avoid")
    };

    Generator.generate(settings, Store.state.plan);
    UI.setupOpen = false;
    UI.menuProfile = "all";
    render();
    toast(settings.days + " jour" + (settings.days > 1 ? "s" : "") + " de menus générés 🎉");
  });
}

function planSummaryHTML(plan) {
  const settings = plan.settings;
  const profiles = plan.profiles || [];
  const mealLabels = settings.meals.map((id) => (MEAL_BY_ID[id] ? MEAL_BY_ID[id].label : id)).join(" · ");
  const personTags = profiles.map((profile, index) => {
    const style = profileStyle(profile);
    return '<span class="tag tag-person"><span class="person-dot" style="--person-color:' + profileColor(index) + '"></span>' +
      esc(profile.name) + (style ? " · " + style.emoji + " " + esc(style.label) : "") + "</span>";
  }).join("");
  const favor = settings.favor
    .map((id) => (TAG_BY_ID[id] ? '<span class="tag tag-favor">' + TAG_BY_ID[id].emoji + " " + TAG_BY_ID[id].label + "</span>" : ""))
    .join("");
  const avoid = settings.avoid
    .map((id) => (TAG_BY_ID[id] ? '<span class="tag tag-warn">sans ' + TAG_BY_ID[id].label.toLowerCase() + "</span>" : ""))
    .join("");
  const menuLabel = profiles.length > 1 ? "menus personnalisés" : "menu personnalisé";

  return (
    '<div class="plan-summary card">' +
      "<div>" +
        '<p class="eyebrow">Critères actuels</p>' +
        '<p class="plan-summary-text"><strong>' + settings.days + " jours</strong> · " + profiles.length + " " + menuLabel + " · " + esc(mealLabels) + "</p>" +
        (personTags || favor || avoid ? '<div class="tag-list">' + personTags + favor + avoid + "</div>" : "") +
      "</div>" +
      '<button class="btn btn-ghost" type="button" data-action="toggle-setup">✏️ Modifier</button>' +
    "</div>"
  );
}

function emptyPlanHTML() {
  return emptyState(
    "🗓️",
    "Aucun menu pour l'instant",
    "Choisissez vos critères ci-dessus puis générez votre premier planning : Popote piochera dans vos recettes.",
    Store.recipes.length ? "" : '<button class="btn btn-primary" type="button" data-action="goto-recipes">＋ Ajouter des recettes</button>'
  );
}

function planContentHTML(plan) {
  let portions = 0;
  const distinct = new Set();

  plan.days.forEach((day) => {
    day.meals.forEach((meal) => {
      (meal.variants || []).forEach((variant) => {
        if (Store.getRecipe(variant.recipeId)) {
          portions += 1;
          distinct.add(variant.recipeId);
        }
      });
    });
  });

  const filters = plan.profiles.length > 1
    ? '<div class="profile-filter" role="group" aria-label="Afficher le menu d\'une personne">' +
        '<button class="chip' + (UI.menuProfile === "all" ? " is-active" : "") + '" type="button" data-action="filter-profile" data-profile="all" aria-pressed="' + (UI.menuProfile === "all") + '">Tout le monde</button>' +
        plan.profiles.map((profile, index) =>
          '<button class="chip' + (UI.menuProfile === profile.id ? " is-active" : "") + '" type="button" data-action="filter-profile" data-profile="' + esc(profile.id) + '" aria-pressed="' + (UI.menuProfile === profile.id) + '">' +
            '<span class="person-dot" style="--person-color:' + profileColor(index) + '"></span>' + esc(profile.name) +
          "</button>"
        ).join("") +
      "</div>"
    : "";

  return (
    '<div class="plan-toolbar card">' +
      '<div class="plan-stats">' +
        "<div class=\"stat\"><strong>" + plan.days.length + "</strong><span>jours</span></div>" +
        "<div class=\"stat\"><strong>" + portions + "</strong><span>portions</span></div>" +
        "<div class=\"stat\"><strong>" + plan.profiles.length + "</strong><span>personnes</span></div>" +
        "<div class=\"stat\"><strong>" + distinct.size + "</strong><span>recettes</span></div>" +
      "</div>" +
      '<div class="plan-actions">' +
        '<button class="btn btn-ghost btn-sm" type="button" data-action="regenerate">🔁 Régénérer</button>' +
        '<button class="btn btn-ghost btn-sm btn-danger" type="button" data-action="clear-plan">Vider</button>' +
      "</div>" +
    "</div>" +
    filters +
    '<div class="days-grid">' +
      plan.days.map((day, dayIndex) => dayCardHTML(day, dayIndex, plan)).join("") +
    "</div>" +
    '<p class="plan-footnote">🔒 = repas épinglé, conservé lors d\'une régénération. 🔁 = remplacer. ✕ = retirer.</p>'
  );
}

function dayCardHTML(day, dayIndex, plan) {
  const isToday = day.date === todayISO();
  return (
    '<section class="day-card' + (isToday ? " is-today" : "") + '">' +
      '<header class="day-head">' +
        "<div><span class=\"day-name\">" + formatDayName(day.date) + '</span><span class="day-date">' + formatShortDate(day.date) + "</span></div>" +
        (isToday ? '<span class="today-badge">Aujourd\'hui</span>' : "") +
      "</header>" +
      '<div class="day-meals">' +
        day.meals.map((meal) => mealHTML(meal, dayIndex, plan)).join("") +
      "</div>" +
    "</section>"
  );
}

function mealHTML(meal, dayIndex, plan) {
  const slot = MEAL_BY_ID[meal.slot];
  const slotLabel = '<span class="meal-slot"><span aria-hidden="true">' + slot.emoji + "</span>" + slot.short + "</span>";

  const visibleProfiles = plan.profiles
    .map((profile, index) => ({ profile, index }))
    .filter((entry) => UI.menuProfile === "all" || entry.profile.id === UI.menuProfile);

  const variants = visibleProfiles.map(({ profile, index }) => {
    const variant = (meal.variants || []).find((entry) => entry.profileId === profile.id) || {
      profileId: profile.id,
      recipeId: null,
      locked: false
    };
    return variantHTML(variant, slot, dayIndex, profile, index);
  }).join("");

  return (
    '<div class="meal-group">' +
      '<div class="meal-group-head">' + slotLabel + "</div>" +
      '<div class="meal-variants">' + variants + "</div>" +
    "</div>"
  );
}

function variantHTML(variant, slot, dayIndex, profile, profileIndex) {
  const recipe = Store.getRecipe(variant.recipeId);
  const style = profileStyle(profile);
  const chip = '<span class="person-chip"><span class="person-dot" style="--person-color:' + profileColor(profileIndex) + '"></span>' + esc(profile.name) + "</span>";
  const styleHTML = style ? '<span class="variant-style">' + style.emoji + " " + esc(style.label) + "</span>" : "";

  if (!recipe) {
    return (
      '<div class="meal-variant is-empty">' +
        '<div class="variant-head">' + chip + styleHTML + "</div>" +
        '<button class="meal-empty-btn" type="button" data-action="pick-slot" data-day="' + dayIndex + '" data-slot="' + slot.id + '" data-profile="' + esc(profile.id) + '">＋ Choisir une recette</button>' +
      "</div>"
    );
  }

  const lockLabel = variant.locked
    ? "Désépingler " + slot.label.toLowerCase() + " de " + profile.name
    : "Épingler " + slot.label.toLowerCase() + " de " + profile.name;

  return (
    '<div class="meal-variant' + (variant.locked ? " is-locked" : "") + '">' +
      '<div class="variant-head">' +
        chip + styleHTML +
        '<span class="meal-buttons">' +
          '<button class="icon-btn' + (variant.locked ? " is-on" : "") + '" type="button" data-action="lock-slot" data-day="' + dayIndex + '" data-slot="' + slot.id + '" data-profile="' + esc(profile.id) + '" aria-label="' + esc(lockLabel) + '" aria-pressed="' + variant.locked + '" title="' + (variant.locked ? "Désépingler" : "Épingler") + '">' + (variant.locked ? "🔒" : "🔓") + "</button>" +
          '<button class="icon-btn" type="button" data-action="swap-slot" data-day="' + dayIndex + '" data-slot="' + slot.id + '" data-profile="' + esc(profile.id) + '" aria-label="Remplacer ' + esc(slot.label.toLowerCase()) + ' de ' + esc(profile.name) + '" title="Remplacer">🔁</button>' +
          '<button class="icon-btn" type="button" data-action="remove-slot" data-day="' + dayIndex + '" data-slot="' + slot.id + '" data-profile="' + esc(profile.id) + '" aria-label="Retirer ' + esc(slot.label.toLowerCase()) + ' de ' + esc(profile.name) + '" title="Retirer">✕</button>' +
        "</span>" +
      "</div>" +
      '<button class="meal-recipe" type="button" data-action="view-recipe" data-id="' + esc(recipe.id) + '">' +
        '<span class="meal-emoji" aria-hidden="true">' + esc(recipe.emoji) + "</span>" +
        '<span class="meal-info">' +
          '<span class="meal-name">' + esc(recipe.name) + "</span>" +
          '<span class="meal-meta">⏱ ' + recipe.time + " min · 1 portion</span>" +
        "</span>" +
      "</button>" +
    "</div>"
  );
}

/* ---------- Vue Courses ---------- */

function shoppingQty(item) {
  let text = item.qty > 0 ? formatQty(item.qty, item.unit) : "";
  if (item.loose) text = text ? text + " + au goût" : "au goût";
  return text || "au goût";
}

function renderCourses() {
  const data = Generator.shoppingList();
  const subtitle = document.getElementById("courses-subtitle");
  const content = document.getElementById("courses-content");
  const actions = document.getElementById("courses-actions");
  actions.innerHTML = "";

  if (!data.items.length) {
    subtitle.textContent = "Elle se remplit automatiquement à partir de vos menus.";
    content.innerHTML = emptyState(
      "🛒",
      "Pas encore de liste",
      Store.state.plan
        ? "Ajoutez des recettes à votre menu pour voir les ingrédients apparaître ici."
        : "Générez d'abord un menu : les ingrédients s'ajouteront ici tout seuls, ajustés au nombre de personnes.",
      '<button class="btn btn-primary" type="button" data-action="goto-menus">Créer mes menus</button>'
    );
    return;
  }

  const checked = Store.state.shopping.checked;
  const done = data.items.filter((item) => checked[item.key]).length;
  const percent = Math.round((done / data.items.length) * 100);

  subtitle.textContent =
    "Pour " + data.persons + " personne" + (data.persons > 1 ? "s" : "") + " · " +
    data.meals + " portions · " + data.items.length + " article" + (data.items.length > 1 ? "s" : "");

  const groupsHTML = data.groups.map((group) => {
    const meta = CATEGORY_META[group.cat] || CATEGORY_META.Autre;
    return (
      '<section class="course-group card">' +
        '<h2 class="course-title"><span aria-hidden="true">' + meta.emoji + "</span> " + esc(group.cat) + '<span class="course-count">' + group.items.length + "</span></h2>" +
        '<div class="course-items">' +
          group.items.map((item) => {
            const isChecked = Boolean(checked[item.key]);
            return (
              '<label class="course-item' + (isChecked ? " is-checked" : "") + '">' +
                '<input type="checkbox" data-check-key="' + esc(item.key) + '"' + (isChecked ? " checked" : "") + ">" +
                '<span class="course-name">' + esc(item.name) + "</span>" +
                '<span class="course-qty">' + shoppingQty(item) + "</span>" +
              "</label>"
            );
          }).join("") +
        "</div>" +
      "</section>"
    );
  }).join("");

  content.innerHTML =
    '<div class="courses-summary card">' +
      '<div class="courses-summary-main">' +
        '<p class="eyebrow">Progression</p>' +
        '<p class="courses-progress-label"><strong>' + done + "</strong> / " + data.items.length + " articles cochés</p>" +
        '<div class="progress" role="progressbar" aria-label="Progression de la liste de courses" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + percent + '"><span style="width:' + percent + '%"></span></div>' +
      "</div>" +
      '<div class="courses-summary-meta">' +
        "<span>👥 " + data.persons + " pers.</span>" +
        "<span>🍽 " + data.meals + " portions</span>" +
        "<span>📖 " + data.recipeCount + " recettes</span>" +
      "</div>" +
      '<div class="courses-actions">' +
        '<button class="btn btn-primary btn-sm" type="button" data-action="copy-list">📋 Copier la liste</button>' +
        '<button class="btn btn-ghost btn-sm" type="button" data-action="uncheck-all"' + (done ? "" : " disabled") + ">Tout décocher</button>" +
      "</div>" +
    "</div>" +
    '<div class="courses-grid">' + groupsHTML + "</div>";
}

function copyShoppingList() {
  const data = Generator.shoppingList();
  if (!data.items.length) return;

  const checked = Store.state.shopping.checked;
  const lines = [
    "Popote — Liste de courses",
    "Pour " + data.persons + " personne" + (data.persons > 1 ? "s" : "") + " · " + data.meals + " portions",
    ""
  ];

  data.groups.forEach((group) => {
    lines.push(group.cat.toUpperCase());
    group.items.forEach((item) => {
      lines.push((checked[item.key] ? "[x] " : "[ ] ") + shoppingQty(item) + " " + item.name);
    });
    lines.push("");
  });

  lines.push("Généré avec Popote");
  const text = lines.join("\n");

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text)
      .then(() => toast("Liste copiée ✓"))
      .catch(() => fallbackCopy(text));
  } else {
    fallbackCopy(text);
  }
}

function fallbackCopy(text) {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  try {
    document.execCommand("copy");
    toast("Liste copiée ✓");
  } catch (error) {
    toast("Copie impossible sur ce navigateur.");
  }
  textarea.remove();
}

/* ---------- Actions ---------- */

function handleAction(action, element) {
  const dayIndex = Number(element.dataset.day);
  const slot = element.dataset.slot;
  const profileId = element.dataset.profile;

  switch (action) {
    case "new-recipe":
      openRecipeEditor(null);
      break;

    case "view-recipe":
      openRecipeDetail(element.dataset.id);
      break;

    case "edit-recipe":
      closeModal();
      openRecipeEditor(element.dataset.id);
      break;

    case "delete-recipe":
      if (!confirm("Supprimer cette recette ? Elle sera aussi retirée des menus où elle apparaît.")) return;
      Store.deleteRecipe(element.dataset.id);
      closeModal();
      render();
      toast("Recette supprimée.");
      break;

    case "toggle-fav": {
      const id = element.dataset.id;
      const wasDetail = Boolean(document.querySelector(".modal-overlay .detail-title"));
      Store.toggleFavorite(id);
      render();
      if (wasDetail) {
        closeModal();
        openRecipeDetail(id);
      }
      break;
    }

    case "close-modal":
      closeModal();
      break;

    case "toggle-setup":
      UI.setupOpen = !UI.setupOpen;
      renderMenus();
      break;

    case "add-person":
      addPersonRow();
      break;

    case "remove-person":
      removePersonRow(element);
      break;

    case "filter-profile":
      UI.menuProfile = element.dataset.profile || "all";
      renderMenus();
      break;

    case "goto-courses":
      switchView("courses");
      break;

    case "goto-menus":
      switchView("menus");
      break;

    case "goto-recipes":
      switchView("recipes");
      break;

    case "reset-filters": {
      UI.search = "";
      UI.filter = "all";
      {
        const search = document.getElementById("recipe-search");
        if (search) search.value = "";
      }
      renderRecipes();
      break;
    }

    case "regenerate":
      if (!Store.state.plan) return;
      Generator.regenerate();
      UI.setupOpen = false;
      render();
      toast("Menus régénérés — les repas épinglés sont conservés.");
      break;

    case "clear-plan":
      if (!confirm("Vider tout le planning et la liste de courses ?")) return;
      Store.clearPlan();
      UI.menuProfile = "all";
      render();
      toast("Planning vidé.");
      break;

    case "swap-slot":
      if (Generator.swap(dayIndex, slot, profileId)) {
        render();
        toast("Repas remplacé.");
      } else {
        toast("Pas d'autre recette disponible pour ce créneau.");
      }
      break;

    case "lock-slot": {
      const locked = Generator.toggleLock(dayIndex, slot, profileId);
      render();
      toast(locked ? "Repas épinglé 🔒" : "Repas libéré 🔓");
      break;
    }

    case "remove-slot":
      Generator.remove(dayIndex, slot, profileId);
      render();
      break;

    case "pick-slot":
      openRecipePicker(dayIndex, slot, profileId);
      break;

    case "assign-slot":
      Generator.assign(dayIndex, slot, element.dataset.id, profileId);
      closeModal();
      render();
      toast("Repas ajouté.");
      break;

    case "uncheck-all":
      Store.state.shopping.checked = {};
      Store.save();
      renderCourses();
      toast("Liste décochée.");
      break;

    case "copy-list":
      copyShoppingList();
      break;

    case "open-settings":
      openSettings();
      break;

    case "export-data":
      downloadFile("popote-sauvegarde-" + todayISO() + ".json", Store.exportJSON());
      toast("Sauvegarde téléchargée ✓");
      break;

    case "import-data": {
      const input = document.getElementById("import-file");
      if (input) input.click();
      break;
    }

    case "restore-seeds": {
      const added = Store.restoreSeeds();
      closeModal();
      render();
      toast(added
        ? added + " recette" + (added > 1 ? "s" : "") + " par défaut restaurée" + (added > 1 ? "s" : "") + " 🌱"
        : "Toutes les recettes par défaut sont déjà présentes.");
      break;
    }

    case "reset-all": {
      if (!confirm("Tout réinitialiser ? Vos recettes, menus et listes seront effacés et remplacés par les recettes par défaut.")) return;
      Store.resetAll();
      closeModal();
      UI.setupOpen = false;
      UI.search = "";
      UI.filter = "all";
      {
        const search = document.getElementById("recipe-search");
        if (search) search.value = "";
      }
      render();
      toast("Application réinitialisée.");
      break;
    }

    default:
      break;
  }
}

/* ---------- Modale générique ---------- */

function openModal(html, wide) {
  const root = document.getElementById("modal-root");
  root.innerHTML = "";

  const overlay = document.createElement("div");
  overlay.className = "modal-overlay";
  overlay.innerHTML = '<div class="modal' + (wide ? " modal-wide" : "") + '" role="dialog" aria-modal="true">' + html + "</div>";

  const dialog = overlay.firstElementChild;
  const heading = dialog.querySelector("h2, h3");
  if (heading) {
    if (!heading.id) heading.id = Store.uid("modal-title");
    dialog.setAttribute("aria-labelledby", heading.id);
  }

  root.appendChild(overlay);
  document.body.classList.add("modal-open");

  overlay.addEventListener("mousedown", (event) => {
    if (event.target === overlay) closeModal();
  });

  requestAnimationFrame(() => overlay.classList.add("is-open"));
  return overlay;
}

function closeModal() {
  const root = document.getElementById("modal-root");
  root.innerHTML = "";
  document.body.classList.remove("modal-open");
}

function toast(message) {
  const root = document.getElementById("toast-root");
  root.innerHTML = '<div class="toast">' + esc(message) + "</div>";
  const toastEl = root.firstElementChild;

  requestAnimationFrame(() => toastEl.classList.add("is-visible"));

  window.clearTimeout(toast._timer);
  toast._timer = window.setTimeout(() => {
    if (!root.firstElementChild) return;
    root.firstElementChild.classList.remove("is-visible");
    window.setTimeout(() => { root.innerHTML = ""; }, 240);
  }, 2600);
}

/* ---------- Détail d'une recette ---------- */

function openRecipeDetail(id) {
  const recipe = Store.getRecipe(id);
  if (!recipe) return;

  let portions = recipe.servings;
  const meta = TYPE_META[recipe.type] || TYPE_META.dejeuner;
  const steps = recipe.steps.split(/\n+/).map((step) => step.trim()).filter(Boolean);

  const overlay = openModal(
    '<div class="detail-hero ' + meta.tile + '">' +
      '<span class="detail-emoji" aria-hidden="true">' + esc(recipe.emoji) + "</span>" +
      '<button class="close-x close-x-on-tile" type="button" data-action="close-modal" aria-label="Fermer">✕</button>' +
    "</div>" +
    '<div class="modal-body">' +
      '<div class="detail-head">' +
        '<p class="eyebrow">' + meta.emoji + " " + meta.label + (recipe.favorite ? " · ♥ Favori" : "") + "</p>" +
        '<h2 class="detail-title">' + esc(recipe.name) + "</h2>" +
      "</div>" +
      '<div class="detail-meta">' +
        "<span>⏱ " + recipe.time + " min</span>" +
        "<span>🍽 Recette de base : " + recipe.servings + " pers.</span>" +
      "</div>" +
      '<div class="tag-list">' + recipe.tags.map((tagId) => {
        const tag = TAG_BY_ID[tagId];
        return tag ? '<span class="tag">' + tag.emoji + " " + tag.label + "</span>" : "";
      }).join("") + "</div>" +
      '<div class="detail-columns">' +
        '<section class="detail-block">' +
          '<div class="detail-block-head">' +
            "<h3>Ingrédients</h3>" +
            '<div class="servings-adjust">' +
              '<button type="button" data-servings-step="-1" aria-label="Moins de portions">−</button>' +
              '<span id="detail-servings">' + portions + " pers.</span>" +
              '<button type="button" data-servings-step="1" aria-label="Plus de portions">＋</button>' +
            "</div>" +
          "</div>" +
          '<ul class="ingredient-list" id="detail-ingredients"></ul>' +
        "</section>" +
        '<section class="detail-block">' +
          "<h3>Préparation</h3>" +
          '<div class="detail-steps">' + (steps.length
            ? steps.map((step) => "<p>" + esc(step) + "</p>").join("")
            : '<p class="muted">Aucune étape indiquée.</p>') + "</div>" +
        "</section>" +
      "</div>" +
    "</div>" +
    '<div class="modal-foot">' +
      '<button class="btn btn-ghost" type="button" data-action="close-modal">Fermer</button>' +
      '<div class="foot-right">' +
        '<button class="btn btn-ghost" type="button" data-action="toggle-fav" data-id="' + esc(recipe.id) + '">' + (recipe.favorite ? "♥ Retirer des favoris" : "♡ Ajouter aux favoris") + "</button>" +
        '<button class="btn btn-primary" type="button" data-action="edit-recipe" data-id="' + esc(recipe.id) + '">Modifier</button>' +
      "</div>" +
    "</div>",
    true
  );

  const listEl = overlay.querySelector("#detail-ingredients");
  const servingsEl = overlay.querySelector("#detail-servings");

  function renderIngredients() {
    const factor = portions / (recipe.servings || 1);
    listEl.innerHTML = recipe.ingredients.map((ingredient) => {
      const qty = ingredient.qty == null ? null : ingredient.qty * factor;
      return (
        '<li class="ingredient">' +
          '<span class="ingredient-qty">' + formatQty(qty, ingredient.unit) + "</span>" +
          '<span class="ingredient-name">' + esc(ingredient.name) + "</span>" +
        "</li>"
      );
    }).join("") || '<li class="muted">Aucun ingrédient indiqué.</li>';
    servingsEl.textContent = portions + " pers.";
  }

  renderIngredients();

  overlay.querySelectorAll("[data-servings-step]").forEach((button) => {
    button.addEventListener("click", () => {
      portions = Math.min(30, Math.max(1, portions + Number(button.dataset.servingsStep)));
      renderIngredients();
    });
  });
}

/* ---------- Éditeur de recette ---------- */

function ingredientRowHTML(ingredient, index) {
  return (
    '<div class="ing-row">' +
      '<input type="number" data-ing="qty" min="0" step="any" placeholder="Qté" value="' + (ingredient.qty == null ? "" : esc(ingredient.qty)) + '" aria-label="Quantité">' +
      '<select data-ing="unit" aria-label="Unité">' + UNITS.map((unit) => '<option value="' + esc(unit) + '"' + (ingredient.unit === unit ? " selected" : "") + ">" + esc(unit) + "</option>").join("") + "</select>" +
      '<input type="text" data-ing="name" placeholder="Ingrédient" value="' + esc(ingredient.name) + '" aria-label="Ingrédient">' +
      '<select data-ing="cat" class="ing-cat" aria-label="Rayon">' + CATEGORIES.map((cat) => '<option value="' + esc(cat) + '"' + (ingredient.cat === cat ? " selected" : "") + ">" + esc(cat) + "</option>").join("") + "</select>" +
      '<button type="button" class="icon-btn" data-remove-ing="' + index + '" aria-label="Supprimer l\'ingrédient" title="Supprimer">✕</button>' +
    "</div>"
  );
}

function openRecipeEditor(id) {
  const existing = id ? Store.getRecipe(id) : null;
  if (id && !existing) return;

  const recipe = existing || {
    name: "",
    emoji: "🍳",
    type: "diner",
    tags: [],
    time: 20,
    servings: 2,
    ingredients: [],
    steps: ""
  };

  const ingredients = (recipe.ingredients && recipe.ingredients.length
    ? recipe.ingredients
    : [{ qty: null, unit: "pièce", name: "", cat: "Épicerie" }]
  ).map((ingredient) => ({ ...ingredient }));

  const overlay = openModal(
    '<form class="editor-form" id="recipe-form" novalidate>' +
      '<div class="modal-head">' +
        "<div>" +
          '<p class="eyebrow">' + (existing ? "Modifier la recette" : "Nouvelle recette") + "</p>" +
          "<h2>" + (existing ? esc(existing.name) : "Ajouter une recette") + "</h2>" +
        "</div>" +
        '<button type="button" class="close-x" data-action="close-modal" aria-label="Fermer">✕</button>' +
      "</div>" +
      '<div class="modal-body">' +
        '<div class="form-row form-row-name">' +
          '<label class="field field-emoji"><span>Emoji</span><input type="text" name="emoji" class="emoji-input" maxlength="4" value="' + esc(recipe.emoji) + '" aria-label="Emoji de la recette"></label>' +
          '<label class="field field-grow"><span>Nom de la recette</span><input type="text" name="name" value="' + esc(recipe.name) + '" placeholder="Ex. Curry de lentilles corail" required></label>' +
        "</div>" +
        '<div class="emoji-options" id="emoji-options">' + EMOJIS.map((emoji) => '<button type="button" class="emoji-option" data-emoji="' + emoji + '" aria-label="Choisir ' + emoji + '">' + emoji + "</button>").join("") + "</div>" +
        '<div class="form-row form-row-three">' +
          '<label class="field"><span>Type de repas</span><select name="type">' + Object.keys(TYPE_META).map((typeId) => '<option value="' + typeId + '"' + (recipe.type === typeId ? " selected" : "") + ">" + TYPE_META[typeId].emoji + " " + TYPE_META[typeId].label + "</option>").join("") + "</select></label>" +
          '<label class="field"><span>Temps (min)</span><input type="number" name="time" min="1" max="600" value="' + recipe.time + '"></label>' +
          '<label class="field"><span>Portions de base</span><input type="number" name="servings" min="1" max="50" value="' + recipe.servings + '"></label>' +
        "</div>" +
        '<div class="form-block">' +
          '<span class="setup-label">Caractère <small>facultatif</small></span>' +
          '<div class="toggle-row">' + TAGS.map((tag) => '<label class="tag-toggle"><input type="checkbox" name="tags" value="' + tag.id + '"' + (recipe.tags.includes(tag.id) ? " checked" : "") + "><span>" + tag.emoji + " " + tag.label + "</span></label>").join("") + "</div>" +
        "</div>" +
        '<div class="form-block">' +
          '<div class="block-head"><span class="setup-label">Ingrédients</span><button type="button" class="btn btn-ghost btn-sm" id="add-ingredient">＋ Ajouter</button></div>' +
          '<div class="ing-header" aria-hidden="true"><span>Qté</span><span>Unité</span><span>Ingrédient</span><span>Rayon</span><span></span></div>' +
          '<div class="ing-rows" id="ing-rows"></div>' +
        "</div>" +
        '<label class="field form-block"><span>Préparation <small>une étape par ligne</small></span><textarea name="steps" rows="6" placeholder="Ex.&#10;Faites revenir l\'oignon…&#10;Ajoutez les tomates…">' + esc(recipe.steps) + "</textarea></label>" +
      "</div>" +
      '<div class="modal-foot">' +
        (existing
          ? '<button type="button" class="btn btn-ghost btn-danger" data-action="delete-recipe" data-id="' + esc(existing.id) + '">Supprimer</button>'
          : "<span></span>") +
        '<div class="foot-right">' +
          '<button type="button" class="btn btn-ghost" data-action="close-modal">Annuler</button>' +
          '<button type="submit" class="btn btn-primary">' + (existing ? "Enregistrer" : "Ajouter la recette") + "</button>" +
        "</div>" +
      "</div>" +
    "</form>",
    true
  );

  const rowsEl = overlay.querySelector("#ing-rows");
  const form = overlay.querySelector("#recipe-form");

  function renderRows() {
    rowsEl.innerHTML = ingredients.map((ingredient, index) => ingredientRowHTML(ingredient, index)).join("");
  }

  function syncIngredients() {
    const rows = rowsEl.querySelectorAll(".ing-row");
    const next = [];
    rows.forEach((row) => {
      const qtyRaw = row.querySelector('[data-ing="qty"]').value;
      next.push({
        qty: qtyRaw === "" ? null : Number(qtyRaw),
        unit: row.querySelector('[data-ing="unit"]').value,
        name: row.querySelector('[data-ing="name"]').value.trim(),
        cat: row.querySelector('[data-ing="cat"]').value
      });
    });
    ingredients.length = 0;
    ingredients.push(...next);
  }

  renderRows();

  overlay.querySelector("#add-ingredient").addEventListener("click", () => {
    syncIngredients();
    ingredients.push({ qty: 1, unit: "pièce", name: "", cat: "Épicerie" });
    renderRows();
    const inputs = rowsEl.querySelectorAll('[data-ing="name"]');
    if (inputs.length) inputs[inputs.length - 1].focus();
  });

  rowsEl.addEventListener("click", (event) => {
    const button = event.target.closest("[data-remove-ing]");
    if (!button) return;
    syncIngredients();
    ingredients.splice(Number(button.dataset.removeIng), 1);
    if (!ingredients.length) ingredients.push({ qty: null, unit: "pièce", name: "", cat: "Épicerie" });
    renderRows();
  });

  overlay.querySelector("#emoji-options").addEventListener("click", (event) => {
    const button = event.target.closest("[data-emoji]");
    if (!button) return;
    overlay.querySelector(".emoji-input").value = button.dataset.emoji;
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    syncIngredients();

    const data = new FormData(form);
    const name = String(data.get("name") || "").trim();
    if (!name) {
      toast("Donnez un nom à votre recette.");
      form.querySelector('[name="name"]').focus();
      return;
    }

    const saved = Store.upsertRecipe({
      id: existing ? existing.id : Store.uid("r"),
      name,
      emoji: String(data.get("emoji") || "🍽️").trim() || "🍽️",
      type: TYPE_META[data.get("type")] ? data.get("type") : "dejeuner",
      tags: data.getAll("tags"),
      time: clamp(Number(data.get("time")) || 20, 1, 600),
      servings: clamp(Number(data.get("servings")) || 2, 1, 50),
      ingredients: ingredients.filter((ingredient) => ingredient.name),
      steps: String(data.get("steps") || ""),
      favorite: existing ? existing.favorite : false,
      createdAt: existing ? existing.createdAt : Date.now()
    });

    closeModal();
    render();
    toast(existing ? "Recette mise à jour ✓" : "Recette « " + saved.name + " » ajoutée ✓");
  });
}

/* ---------- Choix manuel d'une recette ---------- */

function openRecipePicker(dayIndex, slot, profileId) {
  const slotMeta = MEAL_BY_ID[slot];
  if (!slotMeta) return;

  const pool = Generator.poolFor(slot, Store.recipes)
    .slice()
    .sort((a, b) => (Number(b.favorite) - Number(a.favorite)) || a.name.localeCompare(b.name, "fr"));

  const plan = Store.state.plan;
  const profile = plan && Array.isArray(plan.profiles)
    ? plan.profiles.find((item) => item.id === profileId)
    : null;
  const meal = plan && plan.days[dayIndex]
    ? plan.days[dayIndex].meals.find((entry) => entry.slot === slot)
    : null;
  const variant = meal && Array.isArray(meal.variants)
    ? meal.variants.find((entry) => entry.profileId === profileId)
    : null;
  const currentId = variant ? variant.recipeId : null;
  const style = profileStyle(profile);

  const rows = pool.map((recipe) => {
    const isCurrent = recipe.id === currentId;
    return (
      '<button type="button" class="picker-row' + (isCurrent ? " is-current" : "") + '" data-action="assign-slot" data-day="' + dayIndex + '" data-slot="' + slot + '" data-profile="' + esc(profileId || "") + '" data-id="' + esc(recipe.id) + '">' +
        '<span class="picker-emoji" aria-hidden="true">' + esc(recipe.emoji) + "</span>" +
        '<span class="picker-info">' +
          '<span class="picker-name">' + esc(recipe.name) + "</span>" +
          '<span class="picker-meta">' + recipe.time + " min · " + recipe.servings + " pers." + (recipe.favorite ? " · ♥" : "") + "</span>" +
        "</span>" +
        '<span class="picker-check">' + (isCurrent ? "✓" : "") + "</span>" +
      "</button>"
    );
  }).join("");

  openModal(
    '<div class="modal-head">' +
      "<div>" +
        '<p class="eyebrow">' + slotMeta.emoji + " " + slotMeta.label + (profile ? " · " + esc(profile.name) : "") + "</p>" +
        "<h2>Choisir une recette</h2>" +
      "</div>" +
      '<button type="button" class="close-x" data-action="close-modal" aria-label="Fermer">✕</button>' +
    "</div>" +
    '<div class="modal-body">' +
      (profile ? '<p class="modal-sub">Pour <strong>' + esc(profile.name) + "</strong>" + (style ? " · " + style.emoji + " " + esc(style.label) : "") + "</p>" : "") +
      (rows
        ? '<div class="picker-list">' + rows + "</div>"
        : emptyState(
            "🍽️",
            "Aucune recette disponible",
            "Ajoutez une recette de type " + slotMeta.label + " pour la retrouver ici.",
            '<button class="btn btn-primary" type="button" data-action="new-recipe">＋ Nouvelle recette</button>'
          )) +
    "</div>"
  );
}

/* ---------- Réglages & données ---------- */

function openSettings() {
  const overlay = openModal(
    '<div class="modal-head">' +
      "<div>" +
        '<p class="eyebrow">Popote</p>' +
        "<h2>Réglages &amp; données</h2>" +
      "</div>" +
      '<button type="button" class="close-x" data-action="close-modal" aria-label="Fermer">✕</button>' +
    "</div>" +
    '<div class="modal-body">' +
      '<p class="modal-sub">Vos recettes et menus restent sur cet appareil, dans le stockage local de votre navigateur. Pensez à exporter une sauvegarde de temps en temps.</p>' +
      '<div class="settings-list">' +
        '<button type="button" class="settings-item" data-action="export-data"><span class="settings-icon">⬇️</span><span><strong>Exporter mes données</strong><small>Télécharger un fichier JSON de sauvegarde</small></span></button>' +
        '<button type="button" class="settings-item" data-action="import-data"><span class="settings-icon">⬆️</span><span><strong>Importer une sauvegarde</strong><small>Remplacer les données par un fichier exporté</small></span></button>' +
        '<button type="button" class="settings-item" data-action="restore-seeds"><span class="settings-icon">🌱</span><span><strong>Restaurer les recettes par défaut</strong><small>Rajoute les recettes d\'origine manquantes</small></span></button>' +
        '<button type="button" class="settings-item settings-danger" data-action="reset-all"><span class="settings-icon">🗑️</span><span><strong>Tout réinitialiser</strong><small>Efface recettes, menus et listes</small></span></button>' +
      "</div>" +
      '<input type="file" id="import-file" accept="application/json,.json" hidden>' +
      '<p class="hint">💡 Sur mobile, ajoutez Popote à votre écran d\'accueil pour l\'ouvrir comme une application.</p>' +
    "</div>"
  );

  const fileInput = overlay.querySelector("#import-file");
  fileInput.addEventListener("change", () => {
    const file = fileInput.files && fileInput.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        Store.importJSON(String(reader.result));
        closeModal();
        UI.setupOpen = false;
        UI.search = "";
        UI.filter = "all";
        const search = document.getElementById("recipe-search");
        if (search) search.value = "";
        render();
        toast("Sauvegarde importée ✓");
      } catch (error) {
        toast("Import impossible : " + (error.message || "fichier invalide"));
      }
    };
    reader.onerror = () => toast("Lecture du fichier impossible.");
    reader.readAsText(file);
  });
}

function downloadFile(filename, content) {
  const blob = new Blob([content], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 4000);
}

/* ---------- État vide réutilisable ---------- */

function emptyState(emoji, title, text, action) {
  return (
    '<div class="empty">' +
      '<div class="empty-emoji" aria-hidden="true">' + emoji + "</div>" +
      "<h2>" + esc(title) + "</h2>" +
      "<p>" + esc(text) + "</p>" +
      (action || "") +
    "</div>"
  );
}
