# 🌦️ Weather Compare

Application web permettant de consulter la météo d'une commune française (via
son code postal) et de **comparer** plusieurs indicateurs météo entre deux
périodes : la même période l'an dernier, une plage de dates personnalisée, la
normale climatique sur N années, ou une année passée n'ayant pas connu de
déficit de pluie.

## Fonctionnalités

1. **Recherche par code postal** — un code postal peut correspondre à
   plusieurs communes (ex: `38500` → La Buisse, Coublevie, Saint-Cassien,
   Saint-Nicolas-de-Macherin, Voiron) ; l'utilisateur choisit la commune
   exacte.
2. **Sélection de période** — raccourcis (7 jours, 30 jours, 3/6/12 derniers
   mois, depuis le 1er janvier) ou dates personnalisées.
3. **5 modes de comparaison** :
   - Même période l'année précédente
   - Une année précise (n'importe quelle année depuis 1940 jusqu'à l'an
     dernier, sélectionnée librement dans une liste)
   - Période personnalisée (dates libres)
   - Normale climatique (moyenne sur 5 à 30 ans, configurable)
   - Année sans déficit de pluie : affiche le cumul de précipitations de
     chaque année passée pour la même fenêtre mois/jour, avec un code couleur
     déficit/normal/excédent, pour choisir l'année de comparaison.
4. **Indicateurs calculés** : cumul et jours de pluie, pluie max/jour,
   températures (moyenne/min/max, amplitude), jours de gel, jours de forte
   chaleur, cumul de neige, vent moyen et rafale max, humidité moyenne,
   ensoleillement cumulé.
5. Tableau de comparaison chiffré + mini-graphiques (Recharts) pour les
   indicateurs clés.

## Sources de données (gratuites, sans clé API)

- [geo.api.gouv.fr](https://geo.api.gouv.fr/) — conversion code postal →
  commune (nom, coordonnées GPS).
- [Open-Meteo Historical Weather API](https://open-meteo.com/) — données
  météo quotidiennes historiques depuis 1940 (l'archive a un décalage
  d'environ 5 jours par rapport à la date du jour).

## Stack technique

- React 19 + TypeScript + Vite
- [MUI (Material UI)](https://mui.com/) pour l'interface Material Design,
  avec une mise en page **mobile-first** (barre d'action "Comparer" fixée en
  bas d'écran, listes et cartes empilées verticalement, grille responsive à
  partir des écrans ≥600px).
- MUI X Date Pickers (+ date-fns, locale FR) pour la sélection de dates.
- Recharts pour les graphiques
- 100% front-end : aucun backend requis, tous les appels API se font
  directement depuis le navigateur.

## Démarrage

```bash
npm install
npm run dev
```

Puis ouvrez `http://localhost:5173`.

## Build de production

```bash
npm run build
npm run preview
```

## Structure du code

```
src/
  api/            Appels aux API externes (géocodage, météo)
  components/      Composants React (recherche, sélecteurs de période, tableaux, graphiques)
  lib/            Logique métier pure : dates/périodes, calcul des indicateurs, analyse multi-années
  types.ts        Types TypeScript partagés
  App.tsx         Orchestration de l'application
```

## Pistes d'évolution

- Ajouter l'évapotranspiration et la pression atmosphérique.
- Mise en cache locale (localStorage) des réponses API pour éviter les
  appels répétés sur la même commune/période.
- Export des résultats (CSV/PDF).
- Carte interactive pour choisir la commune visuellement.
