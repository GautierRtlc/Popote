/* ============================================================
   Popote — Données de référence
   Types de repas, tags, rayons, unités et recettes par défaut.
   ============================================================ */

const MEAL_SLOTS = [
  { id: "petit-dej", label: "Petit-déj", emoji: "☕", short: "Petit-déj" },
  { id: "dejeuner", label: "Déjeuner", emoji: "🍽️", short: "Déj." },
  { id: "diner", label: "Dîner", emoji: "🌙", short: "Dîner" },
  { id: "snack", label: "Snack", emoji: "🍎", short: "Snack" }
];
const MEAL_BY_ID = Object.fromEntries(MEAL_SLOTS.map((m) => [m.id, m]));

const TAGS = [
  { id: "rapide", label: "Rapide", emoji: "⚡" },
  { id: "healthy", label: "Healthy", emoji: "🥗" },
  { id: "reconfortant", label: "Réconfortant", emoji: "🧡" },
  { id: "vegetarien", label: "Végétarien", emoji: "🌱" },
  { id: "chaud", label: "Chaud", emoji: "🔥" },
  { id: "froid", label: "Froid", emoji: "❄️" },
  { id: "gras", label: "Généreux", emoji: "🧈" },
  { id: "leger", label: "Léger", emoji: "🪶" },
  { id: "sucre", label: "Sucré", emoji: "🍯" }
];
const TAG_BY_ID = Object.fromEntries(TAGS.map((t) => [t.id, t]));

const CATEGORIES = [
  "Fruits & légumes",
  "Viandes & poissons",
  "Produits laitiers",
  "Boulangerie",
  "Épicerie",
  "Surgelés",
  "Autre"
];

const CATEGORY_META = {
  "Fruits & légumes": { emoji: "🥬", order: 1 },
  "Viandes & poissons": { emoji: "🍗", order: 2 },
  "Produits laitiers": { emoji: "🧀", order: 3 },
  "Boulangerie": { emoji: "🥖", order: 4 },
  "Épicerie": { emoji: "🫙", order: 5 },
  "Surgelés": { emoji: "🧊", order: 6 },
  "Autre": { emoji: "🛍️", order: 7 }
};

const UNITS = [
  "g", "kg", "ml", "cl", "l",
  "c. à s.", "c. à c.",
  "pincée", "pièce", "tranche", "gousse", "botte", "branche", "poignée"
];

const TYPE_META = {
  "petit-dej": { label: "Petit-déj", emoji: "☕", tile: "tile-breakfast" },
  "dejeuner": { label: "Déjeuner", emoji: "🍽️", tile: "tile-lunch" },
  "diner": { label: "Dîner", emoji: "🌙", tile: "tile-dinner" },
  "snack": { label: "Snack", emoji: "🍎", tile: "tile-snack" }
};

/* ------------------------------------------------------------
   Recettes préinstallées (18 recettes françaises du quotidien)
   Chaque quantité correspond au nombre de portions indiqué.
   ------------------------------------------------------------ */

const SEED_RECIPES = [
  {
    id: "seed-porridge",
    name: "Porridge banane-noix",
    emoji: "🥣",
    type: "petit-dej",
    tags: ["rapide", "healthy", "chaud", "sucre"],
    time: 10,
    servings: 2,
    favorite: true,
    ingredients: [
      { qty: 100, unit: "g", name: "Flocons d'avoine", cat: "Épicerie" },
      { qty: 400, unit: "ml", name: "Lait", cat: "Produits laitiers" },
      { qty: 1, unit: "pièce", name: "Banane", cat: "Fruits & légumes" },
      { qty: 20, unit: "g", name: "Noix", cat: "Épicerie" },
      { qty: 1, unit: "c. à s.", name: "Miel", cat: "Épicerie" },
      { qty: 1, unit: "pincée", name: "Cannelle", cat: "Épicerie" }
    ],
    steps: "Portez le lait à frémissement dans une casserole.\nAjoutez les flocons et laissez cuire 5 minutes en remuant.\nServez avec la banane en rondelles, les noix concassées, le miel et la cannelle."
  },
  {
    id: "seed-tartines-avocat",
    name: "Tartines avocat-œuf",
    emoji: "🥑",
    type: "petit-dej",
    tags: ["rapide", "healthy"],
    time: 10,
    servings: 2,
    favorite: false,
    ingredients: [
      { qty: 4, unit: "tranche", name: "Pain de campagne", cat: "Boulangerie" },
      { qty: 1, unit: "pièce", name: "Avocat", cat: "Fruits & légumes" },
      { qty: 2, unit: "pièce", name: "Œufs", cat: "Produits laitiers" },
      { qty: 1, unit: "pièce", name: "Citron", cat: "Fruits & légumes" },
      { qty: 1, unit: "c. à c.", name: "Huile d'olive", cat: "Épicerie" },
      { qty: 1, unit: "pincée", name: "Piment d'Espelette", cat: "Épicerie" }
    ],
    steps: "Faites griller le pain et cuisez les œufs au plat ou mollets.\nÉcrasez l'avocat avec le jus de citron, du sel et du poivre.\nTartinez, ajoutez les œufs, un filet d'huile d'olive et le piment."
  },
  {
    id: "seed-pancakes",
    name: "Pancakes moelleux",
    emoji: "🥞",
    type: "petit-dej",
    tags: ["sucre", "reconfortant"],
    time: 20,
    servings: 3,
    favorite: true,
    ingredients: [
      { qty: 150, unit: "g", name: "Farine", cat: "Épicerie" },
      { qty: 2, unit: "pièce", name: "Œufs", cat: "Produits laitiers" },
      { qty: 250, unit: "ml", name: "Lait", cat: "Produits laitiers" },
      { qty: 1, unit: "c. à s.", name: "Sucre", cat: "Épicerie" },
      { qty: 1, unit: "c. à c.", name: "Levure chimique", cat: "Épicerie" },
      { qty: 20, unit: "g", name: "Beurre", cat: "Produits laitiers" },
      { qty: 100, unit: "g", name: "Fruits rouges", cat: "Surgelés" }
    ],
    steps: "Mélangez la farine, le sucre et la levure.\nAjoutez les œufs et le lait, puis fouettez jusqu'à obtenir une pâte lisse.\nCuisez les pancakes à la poêle beurrée, 2 minutes par face.\nServez avec les fruits rouges et un peu de sirop si vous aimez."
  },
  {
    id: "seed-yaourt-granola",
    name: "Yaourt grec, granola & fruits rouges",
    emoji: "🫐",
    type: "petit-dej",
    tags: ["healthy", "froid", "rapide", "sucre"],
    time: 5,
    servings: 2,
    favorite: false,
    ingredients: [
      { qty: 400, unit: "g", name: "Yaourt grec", cat: "Produits laitiers" },
      { qty: 80, unit: "g", name: "Granola", cat: "Épicerie" },
      { qty: 150, unit: "g", name: "Fruits rouges", cat: "Surgelés" },
      { qty: 1, unit: "c. à s.", name: "Miel", cat: "Épicerie" }
    ],
    steps: "Répartissez le yaourt dans deux bols.\nAjoutez le granola, les fruits rouges et un filet de miel.\nDégustez aussitôt pour garder le granola croustillant."
  },
  {
    id: "seed-buddha-bowl",
    name: "Buddha bowl quinoa & légumes rôtis",
    emoji: "🥗",
    type: "dejeuner",
    tags: ["healthy", "vegetarien"],
    time: 35,
    servings: 2,
    favorite: true,
    ingredients: [
      { qty: 150, unit: "g", name: "Quinoa", cat: "Épicerie" },
      { qty: 1, unit: "pièce", name: "Patate douce", cat: "Fruits & légumes" },
      { qty: 1, unit: "pièce", name: "Courgette", cat: "Fruits & légumes" },
      { qty: 1, unit: "pièce", name: "Poivron rouge", cat: "Fruits & légumes" },
      { qty: 2, unit: "c. à s.", name: "Huile d'olive", cat: "Épicerie" },
      { qty: 100, unit: "g", name: "Pois chiches cuits", cat: "Épicerie" },
      { qty: 1, unit: "pièce", name: "Citron", cat: "Fruits & légumes" },
      { qty: 2, unit: "c. à s.", name: "Tahini", cat: "Épicerie" }
    ],
    steps: "Préchauffez le four à 200 °C. Coupez les légumes en morceaux et mélangez-les avec l'huile d'olive, du sel et du poivre.\nEnfournez 25 minutes avec les pois chiches.\nCuisez le quinoa selon les indications du paquet.\nDressez les bols et arrosez d'une sauce tahini-citron."
  },
  {
    id: "seed-salade-lentilles",
    name: "Salade de lentilles feta-menthe",
    emoji: "🫘",
    type: "dejeuner",
    tags: ["froid", "healthy", "vegetarien"],
    time: 20,
    servings: 2,
    favorite: false,
    ingredients: [
      { qty: 250, unit: "g", name: "Lentilles cuites", cat: "Épicerie" },
      { qty: 100, unit: "g", name: "Feta", cat: "Produits laitiers" },
      { qty: 1, unit: "botte", name: "Menthe", cat: "Fruits & légumes" },
      { qty: 1, unit: "pièce", name: "Tomate", cat: "Fruits & légumes" },
      { qty: 1, unit: "pièce", name: "Concombre", cat: "Fruits & légumes" },
      { qty: 2, unit: "c. à s.", name: "Huile d'olive", cat: "Épicerie" },
      { qty: 1, unit: "c. à s.", name: "Vinaigre balsamique", cat: "Épicerie" }
    ],
    steps: "Rincez et égouttez les lentilles.\nCoupez la tomate, le concombre et la feta en dés, ciselez la menthe.\nMélangez le tout avec l'huile d'olive et le vinaigre balsamique. Salez, poivrez."
  },
  {
    id: "seed-poulet-puree",
    name: "Poulet rôti & purée maison",
    emoji: "🍗",
    type: "dejeuner",
    tags: ["reconfortant", "chaud"],
    time: 60,
    servings: 2,
    favorite: true,
    ingredients: [
      { qty: 2, unit: "pièce", name: "Filets de poulet", cat: "Viandes & poissons" },
      { qty: 600, unit: "g", name: "Pommes de terre", cat: "Fruits & légumes" },
      { qty: 50, unit: "g", name: "Beurre", cat: "Produits laitiers" },
      { qty: 100, unit: "ml", name: "Lait", cat: "Produits laitiers" },
      { qty: 2, unit: "gousse", name: "Ail", cat: "Fruits & légumes" },
      { qty: 1, unit: "branche", name: "Thym", cat: "Fruits & légumes" },
      { qty: 2, unit: "c. à s.", name: "Huile d'olive", cat: "Épicerie" }
    ],
    steps: "Préchauffez le four à 190 °C. Huilez les filets de poulet, ajoutez l'ail et le thym.\nEnfournez 25 à 30 minutes en arrosant à mi-cuisson.\nFaites cuire les pommes de terre 20 minutes à l'eau salée, puis écrasez-les avec le beurre et le lait.\nServez le poulet avec la purée bien chaude."
  },
  {
    id: "seed-carbonara",
    name: "Pâtes à la carbonara",
    emoji: "🍝",
    type: "dejeuner",
    tags: ["rapide", "reconfortant", "gras"],
    time: 20,
    servings: 2,
    favorite: false,
    ingredients: [
      { qty: 200, unit: "g", name: "Spaghetti", cat: "Épicerie" },
      { qty: 100, unit: "g", name: "Lardons", cat: "Viandes & poissons" },
      { qty: 2, unit: "pièce", name: "Œufs", cat: "Produits laitiers" },
      { qty: 50, unit: "g", name: "Parmesan", cat: "Produits laitiers" },
      { qty: 1, unit: "gousse", name: "Ail", cat: "Fruits & légumes" },
      { qty: 1, unit: "pincée", name: "Poivre noir", cat: "Épicerie" }
    ],
    steps: "Faites cuire les spaghetti al dente dans une grande casserole d'eau salée.\nFaites revenir les lardons et l'ail émincé sans les faire brûler.\nBattez les œufs avec le parmesan et beaucoup de poivre.\nÉgouttez les pâtes, mélangez hors du feu avec les lardons puis les œufs. Servez immédiatement."
  },
  {
    id: "seed-wrap-poulet",
    name: "Wrap poulet-crudités",
    emoji: "🌯",
    type: "dejeuner",
    tags: ["rapide", "froid"],
    time: 15,
    servings: 2,
    favorite: false,
    ingredients: [
      { qty: 2, unit: "pièce", name: "Tortillas", cat: "Boulangerie" },
      { qty: 150, unit: "g", name: "Poulet cuit", cat: "Viandes & poissons" },
      { qty: 1, unit: "pièce", name: "Carotte", cat: "Fruits & légumes" },
      { qty: 1, unit: "pièce", name: "Concombre", cat: "Fruits & légumes" },
      { qty: 4, unit: "c. à s.", name: "Sauce yaourt", cat: "Produits laitiers" },
      { qty: 1, unit: "pincée", name: "Paprika", cat: "Épicerie" }
    ],
    steps: "Réchauffez rapidement les tortillas à la poêle sèche.\nRâpez la carotte et coupez le concombre en bâtonnets.\nGarnissez chaque tortilla de sauce yaourt, poulet émincé et crudités.\nRoulez serré et coupez en deux."
  },
  {
    id: "seed-soupe-courge",
    name: "Soupe de courge & croûtons",
    emoji: "🎃",
    type: "dejeuner",
    tags: ["chaud", "leger", "vegetarien"],
    time: 40,
    servings: 2,
    favorite: true,
    ingredients: [
      { qty: 600, unit: "g", name: "Courge butternut", cat: "Fruits & légumes" },
      { qty: 1, unit: "pièce", name: "Oignon", cat: "Fruits & légumes" },
      { qty: 500, unit: "ml", name: "Bouillon de légumes", cat: "Épicerie" },
      { qty: 2, unit: "tranche", name: "Pain de campagne", cat: "Boulangerie" },
      { qty: 1, unit: "c. à s.", name: "Huile d'olive", cat: "Épicerie" },
      { qty: 1, unit: "pincée", name: "Muscade", cat: "Épicerie" }
    ],
    steps: "Faites revenir l'oignon émincé dans l'huile d'olive.\nAjoutez la courge en cubes et le bouillon, puis laissez mijoter 25 minutes.\nMixez finement, ajoutez la muscade et ajustez l'assaisonnement.\nServez avec les tranches de pain grillées en croûtons."
  },
  {
    id: "seed-curry-pois-chiches",
    name: "Curry de pois chiches & épinards",
    emoji: "🍛",
    type: "diner",
    tags: ["vegetarien", "chaud", "healthy"],
    time: 30,
    servings: 2,
    favorite: true,
    ingredients: [
      { qty: 400, unit: "g", name: "Pois chiches cuits", cat: "Épicerie" },
      { qty: 200, unit: "ml", name: "Lait de coco", cat: "Épicerie" },
      { qty: 200, unit: "g", name: "Épinards frais", cat: "Fruits & légumes" },
      { qty: 1, unit: "pièce", name: "Oignon", cat: "Fruits & légumes" },
      { qty: 2, unit: "c. à s.", name: "Pâte de curry", cat: "Épicerie" },
      { qty: 1, unit: "c. à s.", name: "Huile d'olive", cat: "Épicerie" },
      { qty: 150, unit: "g", name: "Riz basmati", cat: "Épicerie" }
    ],
    steps: "Faites revenir l'oignon dans l'huile, puis ajoutez la pâte de curry.\nAjoutez les pois chiches et le lait de coco, laissez mijoter 10 minutes.\nIncorporez les épinards jusqu'à ce qu'ils tombent.\nServez avec le riz basmati cuit."
  },
  {
    id: "seed-saumon-riz",
    name: "Saumon rôti, riz & brocoli",
    emoji: "🍣",
    type: "diner",
    tags: ["healthy", "chaud"],
    time: 30,
    servings: 2,
    favorite: false,
    ingredients: [
      { qty: 2, unit: "pièce", name: "Pavés de saumon", cat: "Viandes & poissons" },
      { qty: 150, unit: "g", name: "Riz", cat: "Épicerie" },
      { qty: 1, unit: "pièce", name: "Brocoli", cat: "Fruits & légumes" },
      { qty: 1, unit: "pièce", name: "Citron", cat: "Fruits & légumes" },
      { qty: 1, unit: "c. à s.", name: "Huile d'olive", cat: "Épicerie" },
      { qty: 1, unit: "pincée", name: "Poivre", cat: "Épicerie" }
    ],
    steps: "Préchauffez le four à 190 °C.\nDéposez le saumon sur une plaque, arrosez de jus de citron et d'huile, poivrez.\nEnfournez 15 minutes. Pendant ce temps, cuisez le riz et faites cuire le brocoli à la vapeur.\nServez le tout avec un quartier de citron."
  },
  {
    id: "seed-tacos-boeuf",
    name: "Tacos de bœuf maison",
    emoji: "🌮",
    type: "diner",
    tags: ["reconfortant", "gras"],
    time: 25,
    servings: 2,
    favorite: false,
    ingredients: [
      { qty: 300, unit: "g", name: "Bœuf haché", cat: "Viandes & poissons" },
      { qty: 6, unit: "pièce", name: "Tortillas", cat: "Boulangerie" },
      { qty: 1, unit: "pièce", name: "Oignon", cat: "Fruits & légumes" },
      { qty: 1, unit: "pièce", name: "Poivron", cat: "Fruits & légumes" },
      { qty: 100, unit: "g", name: "Cheddar", cat: "Produits laitiers" },
      { qty: 1, unit: "c. à c.", name: "Cumin", cat: "Épicerie" },
      { qty: 1, unit: "pièce", name: "Tomate", cat: "Fruits & légumes" }
    ],
    steps: "Faites revenir l'oignon et le poivron émincés dans une poêle chaude.\nAjoutez le bœuf haché et le cumin, émiettez et laissez colorer.\nRéchauffez les tortillas et garnissez de viande, de cheddar et de tomate en dés.\nPassez 2 minutes sous le gril pour faire fondre le fromage si vous aimez."
  },
  {
    id: "seed-omelette-champignons",
    name: "Omelette aux champignons & salade",
    emoji: "🍳",
    type: "diner",
    tags: ["rapide", "leger"],
    time: 15,
    servings: 2,
    favorite: false,
    ingredients: [
      { qty: 4, unit: "pièce", name: "Œufs", cat: "Produits laitiers" },
      { qty: 250, unit: "g", name: "Champignons de Paris", cat: "Fruits & légumes" },
      { qty: 30, unit: "g", name: "Beurre", cat: "Produits laitiers" },
      { qty: 1, unit: "pièce", name: "Salade verte", cat: "Fruits & légumes" },
      { qty: 1, unit: "c. à s.", name: "Huile d'olive", cat: "Épicerie" },
      { qty: 1, unit: "pincée", name: "Persil", cat: "Fruits & légumes" }
    ],
    steps: "Émincez les champignons et faites-les revenir au beurre 5 minutes.\nBattez les œufs avec du sel et du poivre, versez sur les champignons.\nLaissez prendre à feu doux, repliez l'omelette.\nServez avec la salade assaisonnée à l'huile d'olive et parsemez de persil."
  },
  {
    id: "seed-gratin-courgettes",
    name: "Gratin de courgettes",
    emoji: "🥘",
    type: "diner",
    tags: ["vegetarien", "reconfortant", "chaud"],
    time: 45,
    servings: 2,
    favorite: false,
    ingredients: [
      { qty: 3, unit: "pièce", name: "Courgettes", cat: "Fruits & légumes" },
      { qty: 200, unit: "ml", name: "Crème fraîche", cat: "Produits laitiers" },
      { qty: 100, unit: "g", name: "Gruyère râpé", cat: "Produits laitiers" },
      { qty: 2, unit: "pièce", name: "Œufs", cat: "Produits laitiers" },
      { qty: 1, unit: "gousse", name: "Ail", cat: "Fruits & légumes" },
      { qty: 1, unit: "pincée", name: "Muscade", cat: "Épicerie" }
    ],
    steps: "Préchauffez le four à 180 °C. Coupez les courgettes en rondelles et faites-les revenir 10 minutes à la poêle.\nBattez les œufs avec la crème, l'ail écrasé et la muscade.\nDisposez les courgettes dans un plat, versez le mélange et parsemez de gruyère.\nEnfournez 25 minutes jusqu'à ce que le dessus soit doré."
  },
  {
    id: "seed-energy-balls",
    name: "Energy balls dattes-cacao",
    emoji: "🍫",
    type: "snack",
    tags: ["healthy", "sucre", "rapide"],
    time: 15,
    servings: 4,
    favorite: false,
    ingredients: [
      { qty: 150, unit: "g", name: "Dattes", cat: "Épicerie" },
      { qty: 100, unit: "g", name: "Amandes", cat: "Épicerie" },
      { qty: 2, unit: "c. à s.", name: "Cacao en poudre", cat: "Épicerie" },
      { qty: 1, unit: "c. à s.", name: "Huile de coco", cat: "Épicerie" }
    ],
    steps: "Mixez les amandes jusqu'à obtenir une poudre fine.\nAjoutez les dattes dénoyautées, le cacao et l'huile de coco, puis mixez à nouveau.\nFormez des petites boules avec les mains humides.\nRéservez 30 minutes au frais avant de déguster."
  },
  {
    id: "seed-houmous",
    name: "Houmous & légumes croquants",
    emoji: "🫓",
    type: "snack",
    tags: ["healthy", "rapide", "froid", "vegetarien"],
    time: 10,
    servings: 2,
    favorite: false,
    ingredients: [
      { qty: 250, unit: "g", name: "Pois chiches cuits", cat: "Épicerie" },
      { qty: 2, unit: "c. à s.", name: "Tahini", cat: "Épicerie" },
      { qty: 1, unit: "pièce", name: "Citron", cat: "Fruits & légumes" },
      { qty: 1, unit: "gousse", name: "Ail", cat: "Fruits & légumes" },
      { qty: 2, unit: "pièce", name: "Carottes", cat: "Fruits & légumes" },
      { qty: 1, unit: "pièce", name: "Concombre", cat: "Fruits & légumes" }
    ],
    steps: "Mixez les pois chiches avec le tahini, le jus de citron, l'ail et un peu d'eau.\nAjustez la texture et l'assaisonnement.\nCoupez les carottes et le concombre en bâtonnets.\nServez le houmous avec les légumes croquants."
  },
  {
    id: "seed-pain-perdu",
    name: "Pain perdu aux pommes",
    emoji: "🍎",
    type: "snack",
    tags: ["reconfortant", "sucre"],
    time: 20,
    servings: 2,
    favorite: false,
    ingredients: [
      { qty: 4, unit: "tranche", name: "Pain de mie", cat: "Boulangerie" },
      { qty: 2, unit: "pièce", name: "Œufs", cat: "Produits laitiers" },
      { qty: 150, unit: "ml", name: "Lait", cat: "Produits laitiers" },
      { qty: 1, unit: "pièce", name: "Pomme", cat: "Fruits & légumes" },
      { qty: 20, unit: "g", name: "Beurre", cat: "Produits laitiers" },
      { qty: 1, unit: "c. à s.", name: "Sucre", cat: "Épicerie" }
    ],
    steps: "Battez les œufs avec le lait et le sucre.\nTrempez les tranches de pain dans le mélange.\nFaites-les dorer au beurre dans une poêle chaude, 2 minutes par face.\nServez avec la pomme coupée en fines lamelles et une pincée de cannelle."
  }
];
