# 🥘 Popote

**Vos recettes, vos menus, vos courses. Sans y penser.**

Popote est une petite application web qui rassemble vos recettes, compose **un menu hebdomadaire par convive** selon son envie, puis en déduit automatiquement une liste de courses additionnant toutes les portions.

Aucune installation, aucun compte, aucun serveur : tout fonctionne dans le navigateur et vos données restent sur votre appareil.

---

## ✨ Fonctionnalités

### Recettes
- **18 recettes françaises préinstallées** : petit-déj, déjeuners, dîners et snacks.
- Création, modification et suppression de recettes (ingrédients, quantités, rayons, tags, temps, portions, étapes).
- **Favoris** et filtre dédié.
- Recherche par nom ou ingrédient, filtres par type de repas.
- Fiche recette avec **quantités recalculées** pour le nombre de portions souhaité.

### Menus
- Génération d'un planning de **1 à 14 jours** pour **1 à 12 convives**.
- **Un menu personnalisé par personne** : chaque convive a un prénom et une envie principale (`healthy`, `léger`, `réconfortant`, `rapide`, etc.). Camille peut ainsi suivre un menu healthy toute la semaine, Léo un menu léger et Sam un menu réconfortant.
- Les convives sont **mémorisés** : prénoms et envies préremplissent le formulaire au prochain planning, même après avoir vidé le menu.
- Chaque repas du planning est décliné en **une variante par convive**. Un même créneau peut donc proposer trois plats différents.
- Le style d'une personne est une préférence forte : le générateur pioche en priorité dans les recettes qui portent ce tag, avec repli si aucune recette ne correspond.
- Filtre d'affichage **« Tout le monde »** ou par personne pour lire un menu individuel.
- Créneaux disponibles : petit-déj, déjeuner, dîner, snack.
- Critères d'envie communs (`rapide`, `healthy`, `réconfortant`, `végétarien`, `chaud`, `froid`, `généreux`, `léger`, `sucré`) et exclusions.
- Les favoris sont privilégiés, avec pénalités pour éviter les répétitions. Deux convives n'ont pas le même plat sur le même créneau quand des alternatives existent.
- **Repas épinglés** 🔒 par personne : conservés lors d'une régénération.
- Remplacement 🔁, retrait ✕ ou choix manuel d'une recette **pour chaque personne**.
- Repli automatique entre déjeuner et dîner si une catégorie manque.

### Liste de courses
- Générée à partir de toutes les variantes du planning et **ajustée au nombre de portions** (une portion par personne et par repas).
- Les ingrédients de tous les menus individuels sont additionnés.
- Ingrédients regroupés par rayon (fruits & légumes, viandes & poissons, produits laitiers, boulangerie, épicerie, surgelés, autre).
- Agrégation des ingrédients identiques et conversion des unités (g → kg, ml → l, cl → ml).
- Cases à cocher persistantes, progression et bouton « Tout décocher ».
- Copie rapide de la liste dans le presse-papiers.

### Données
- Sauvegarde automatique dans le `localStorage` du navigateur.
- **Export / import JSON** pour sauvegarder ou transférer vos données.
- Restauration des recettes par défaut manquantes.
- Réinitialisation complète.

---

## 🚀 Lancer l'application

L'application est entièrement statique : HTML, CSS et JavaScript, sans build ni dépendance.

### Option 1 — Serveur local (recommandé)

Dans le dossier du projet :

```bash
python -m http.server 8000
```

Puis ouvrez [http://localhost:8000](http://localhost:8000).

Sous Windows, `py -m http.server 8000` fonctionne aussi si `python` n'est pas reconnu.

### Option 2 — Double-clic

Ouvrez simplement `index.html` dans votre navigateur.

> Le stockage local peut être plus restrictif avec le protocole `file://` selon les navigateurs. Le serveur local est donc la méthode la plus fiable.

Aucun navigateur particulier n'est requis : les versions récentes de Chrome, Edge, Firefox et Safari suffisent.

---

## 🗂️ Structure du projet

```
.
├── index.html          # Structure des vues Recettes, Menus et Courses
├── css/
│   └── styles.css      # Design, thèmes de couleurs et responsive
└── js/
    ├── data.js         # Types de repas, tags, rayons, unités, recettes par défaut
    ├── store.js        # État, persistance localStorage, import/export, dates, quantités
    ├── generator.js    # Génération des menus et agrégation de la liste de courses
    └── app.js          # Rendu des vues, interactions, modales, toasts
```

Les scripts sont chargés dans cet ordre : `data.js`, `store.js`, `generator.js`, puis `app.js`.

---

## 💾 Données et sauvegarde

Les données sont stockées dans la clé `popote.v1` du `localStorage`.

Structure générale :

```json
{
  "version": 1,
  "recipes": [
    {
      "id": "seed-porridge",
      "name": "Porridge banane-noix",
      "emoji": "🥣",
      "type": "petit-dej",
      "tags": ["rapide", "healthy", "chaud", "sucre"],
      "time": 10,
      "servings": 2,
      "favorite": true,
      "ingredients": [
        {
          "qty": 100,
          "unit": "g",
          "name": "Flocons d'avoine",
          "cat": "Épicerie"
        }
      ],
      "steps": "…",
      "createdAt": 1700000000000
    }
  ],
  "profiles": [
    { "id": "p-1", "name": "Camille", "tags": ["healthy"] },
    { "id": "p-2", "name": "Léo", "tags": ["leger"] },
    { "id": "p-3", "name": "Sam", "tags": ["reconfortant"] }
  ],
  "plan": {
    "startDate": "2026-11-10",
    "profiles": [
      { "id": "p-1", "name": "Camille", "tags": ["healthy"] },
      { "id": "p-2", "name": "Léo", "tags": ["leger"] },
      { "id": "p-3", "name": "Sam", "tags": ["reconfortant"] }
    ],
    "days": [
      {
        "date": "2026-11-10",
        "meals": [
          {
            "slot": "dejeuner",
            "variants": [
              { "profileId": "p-1", "recipeId": "seed-salade-lentilles", "locked": false },
              { "profileId": "p-2", "recipeId": "seed-soupe-courge", "locked": false },
              { "profileId": "p-3", "recipeId": "seed-carbonara", "locked": false }
            ]
          }
        ]
      }
    ],
    "settings": {
      "startDate": "2026-11-10",
      "days": 7,
      "persons": 3,
      "meals": ["dejeuner", "diner"],
      "favor": ["healthy"],
      "avoid": ["gras"]
    }
  },
  "shopping": {
    "checked": {
      "Fruits & légumes|banane|pièce": true
    }
  }
}
```

Bon à savoir :
- Les données sont **locales au navigateur et à l'appareil** : pas de synchronisation automatique entre appareils. Utilisez l'export JSON pour les transférer.
- Les **convives** (prénom + envie) sont enregistrés à part : ils sont restaurés au rechargement et restent disponibles même après avoir vidé le planning.
- Effacer les données du site dans le navigateur efface aussi les recettes, convives et menus.
- La navigation privée peut supprimer les données à la fermeture.
- Un seul planning actif est conservé à la fois.
- Les limites actuelles sont de 14 jours et 12 personnes.
- Un ancien planning (un seul plat partagé, sans convives) est **migré automatiquement** : chaque personne reçoit la même recette, puis les menus peuvent être régénérés individuellement.

---

## 🎨 Interface et accessibilité

- Interface en français, pensée **mobile-first** et adaptée aux écrans larges.
- Palette chaleureuse crème, vert forêt et terracotta.
- Navigation par onglets, états vides explicites et messages de confirmation.
- Contrastes de couleurs vérifiés, structure de titres cohérente, libellés ARIA sur les éléments interactifs.
- Audit Lighthouse : **100 en accessibilité, bonnes pratiques et SEO** sur les vues Recettes, Menus et Courses, le formulaire des convives et les modales (recette et choix manuel).

---

## 🌍 Hébergement et accès depuis partout

Le projet est statique : il n'y a ni build, ni serveur applicatif, ni base de données à installer. Il peut être publié tel quel sur n'importe quel hébergement statique. Le dossier `README.md` n'a pas besoin d'être envoyé.

### Option la plus rapide — Netlify Drop

1. Ouvrir [app.netlify.com/drop](https://app.netlify.com/drop).
2. Glisser le dossier du projet dans la zone de dépôt.
3. Netlify fournit immédiatement une adresse en `https://…netlify.app`.
4. Dans les réglages du site, renommer l'adresse si besoin (par exemple `popote-mamie.netlify.app`).

HTTPS est inclus. Pour mettre à jour le site, il suffit de glisser à nouveau le dossier.

### Option durable — GitHub Pages

1. Créer un dépôt GitHub (public ou privé avec GitHub Pages activé), par exemple `popote`.
2. Envoyer les fichiers du projet dans ce dépôt :

   ```bash
   git init
   git add .
   git commit -m "Popote"
   git branch -M main
   git remote add origin https://github.com/<utilisateur>/popote.git
   git push -u origin main
   ```

3. Dans le dépôt : **Settings → Pages**.
4. Source : **Deploy from a branch**, branche `main`, dossier `/ (root)`, puis **Save**.
5. Après une à deux minutes, le site est disponible sur `https://<utilisateur>.github.io/popote/`.

Pour un domaine à la racine (`https://<utilisateur>.github.io/`), nommer le dépôt `<utilisateur>.github.io`.

### Autres hébergeurs

- **Cloudflare Pages** : Workers & Pages → Create → Pages → Upload assets, puis glisser le dossier.
- **Vercel** : importer le dépôt Git ou utiliser `vercel` en ligne de commande.
- **Hébergement classique** (o2switch, Alwaysdata, etc.) : envoyer les fichiers dans le dossier public du site via FTP.

### ⚠️ Important : héberger ne synchronise pas les données

Popote enregistre les recettes, menus et listes dans le `localStorage` **de chaque navigateur**. Une fois le site en ligne :

- l'adresse est accessible partout ;
- mais les données d'un ordinateur ne sont pas automatiquement visibles sur un téléphone ou un autre navigateur.

Pour retrouver les mêmes données sur un autre appareil, utiliser **Réglages & données → Exporter mes données**, puis **Importer une sauvegarde** sur l'autre appareil.

Une vraie synchronisation automatique entre appareils nécessiterait un compte utilisateur et un service de stockage en ligne (Firebase, Supabase, etc.).

---

## 🔮 Pistes d'évolution

- Application installable (PWA) avec fonctionnement hors ligne.
- Plusieurs plannings (semaines archivées, modèles).
- Comptes et synchronisation multi-appareils.
- Prix des ingrédients et estimation du budget courses.
- Informations nutritionnelles et régimes spécifiques.
- Impression ou partage d'une liste de courses / d'un menu.
- Import de recettes depuis une URL ou un fichier texte.
- Réorganisation des repas par glisser-déposer.
- Internationalisation et unités impériales.

---

## 📄 Licence

Projet personnel. Les recettes préinstallées sont fournies à titre d'exemple et peuvent être modifiées librement.
