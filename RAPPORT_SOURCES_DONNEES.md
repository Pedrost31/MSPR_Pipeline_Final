# Rapport d'inventaire des sources de données — HealthAI

## Table des matières

1. [Inventaire des sources de données](#1-inventaire-des-sources-de-données)
2. [Règles de qualité des données](#2-règles-de-qualité-des-données)
3. [Diagramme des flux de données](#3-diagramme-des-flux-de-données)
4. [Schéma relationnel de la base cible](#4-schéma-relationnel-de-la-base-cible)
5. [Transformations appliquées](#5-transformations-appliquées)

---

## 1. Inventaire des sources de données

### 1.1 Sources brutes (données d'entrée)

| # | Nom du fichier | Format | Localisation | Origine | Fréquence de mise à jour |
|---|----------------|--------|-------------|---------|--------------------------|
| 1 | `gym_members_exercise_tracking.csv` | CSV | `MSPR_Pipeline/data/raw/` | Jeu de données public — profils de membres de salles de sport | Statique (import unique) |
| 2 | `Activity.csv` | CSV | `MSPR_Pipeline/data/raw/` | Jeu de données public — suivi d'activité physique journalière | Statique (import unique) |
| 3 | `daily_food_nutrition_dataset.csv` | CSV | `MSPR_Pipeline/data/raw/` | Jeu de données public — référentiel nutritionnel des aliments | Statique (import unique) |

---

### 1.2 Détail par source

#### Source 1 — Profils de membres (`gym_members_exercise_tracking.csv`)

| Attribut | Valeur |
|----------|--------|
| **Rôle** | Données biométriques des utilisateurs (âge, genre, poids, taille, niveau d'expérience sportive) |
| **Format** | CSV délimité par virgules, encodage UTF-8 |
| **Colonnes principales** | `UserID`, `Age`, `Gender`, `Weight (kg)`, `Height (m)`, `BMI`, `Experience_Level` |
| **Volume estimé** | Quelques centaines à milliers de lignes |
| **Unicité** | 1 ligne = 1 profil utilisateur |
| **Clé naturelle** | `UserID` |
| **Table cible** | `utilisateur` |

**Problèmes connus :**
- L'identifiant `UserID` dans ce fichier ne correspond pas directement aux `UserID` du fichier `Activity.csv`. Un alignement par ré-échantillonnage déterministe (seed=42) est appliqué dans le pipeline.

---

#### Source 2 — Activités quotidiennes (`Activity.csv`)

| Attribut | Valeur |
|----------|--------|
| **Rôle** | Historique des séances d'activité physique par jour et par utilisateur |
| **Format** | CSV délimité par virgules, encodage UTF-8 |
| **Colonnes principales** | `UserID`, `Date`, `Workout_Type`, `Steps`, `Total_Distance`, `Session_Duration (hours)`, `Calories_Burned`, `Very_Active_Distance`, `Very_Active_Minutes`, `Moderately_Active_Distance`, `Fairly_Active_Minutes`, `Light_Active_Distance`, `Lightly_Active_Minutes`, `Sedentary_Minutes` |
| **Volume estimé** | Plusieurs milliers de lignes (multi-jours par utilisateur) |
| **Unicité** | 1 ligne = 1 séance (UserID + Date) |
| **Clé naturelle** | `(UserID, Date)` |
| **Tables cibles** | `activite_journaliere`, `activite_intensite` |

**Traitement spécifique :**
- La date est convertie en type `datetime` lors du nettoyage.
- Les valeurs numériques manquantes sont remplacées par `0`.
- 4 lignes d'intensité sont générées par séance : `VERY_ACTIVE`, `MODERATE`, `LIGHT`, `SEDENTARY`.

---

#### Source 3 — Référentiel nutritionnel (`daily_food_nutrition_dataset.csv`)

| Attribut | Valeur |
|----------|--------|
| **Rôle** | Catalogue d'aliments avec valeurs nutritionnelles de référence |
| **Format** | CSV délimité par virgules, encodage UTF-8 |
| **Colonnes principales** | `Food_Item`, `Category`, `Calories (kcal)`, `Protein (g)`, `Carbohydrates (g)`, `Fat (g)`, `Fiber (g)`, `Sugars (g)`, `Sodium (mg)`, `Cholesterol (mg)`, `Meal_Type`, `Water_Intake (ml)` |
| **Volume estimé** | Quelques centaines d'aliments |
| **Unicité** | 1 ligne = 1 aliment |
| **Clé naturelle** | `Food_Item` |
| **Table cible** | `nutrition` |

**Traitement spécifique :**
- Un `nutrition_id` séquentiel est auto-généré lors du nettoyage (absent du CSV source).
- Les valeurs textuelles manquantes sont remplacées par `'unknown'`.
- Les colonnes numériques manquantes sont remplacées par `0`.

---

### 1.3 Sources générées (données synthétiques)

| # | Nom du fichier | Format | Génération | Rôle |
|---|----------------|--------|------------|------|
| 4 | `consommation_alimentaire.csv` | CSV | Pipeline ETL (aléatoire déterministe, seed=42) | Journal alimentaire simulé — 2 à 4 aliments tirés aléatoirement par utilisateur et par date |

**Méthode de génération :**
- Pour chaque combinaison `(user_id, date)` présente dans les données d'activité, le pipeline sélectionne aléatoirement 2 à 4 aliments du référentiel nutritionnel.
- Un type de repas (`BREAKFAST`, `LUNCH`, `DINNER`, `SNACK`) et une quantité (80 à 350 g) sont assignés aléatoirement.
- La graine (`seed=42`) garantit la reproductibilité totale.

---

## 2. Règles de qualité des données

Les règles suivantes sont appliquées par le module `etl/quality.py` après transformation et avant chargement en base.

### 2.1 Règles génériques (toutes sources)

| Règle | Description | Action |
|-------|-------------|--------|
| **Doublons** | Suppression des lignes entièrement dupliquées | `drop_duplicates()` |
| **Colonnes constantes** | Suppression des colonnes n'ayant qu'une seule valeur unique | Flaggées dans le rapport qualité |
| **Colonnes à forte proportion de zéros** | Colonnes numériques avec ≥ 70 % de valeurs à zéro | Flaggées dans `logs/csv_quality_report.csv` |
| **Valeurs manquantes — numériques** | Remplacement par `0` | `fillna(0)` |
| **Valeurs manquantes — textuelles** | Remplacement par `'unknown'` | `fillna('unknown')` |
| **Colonnes sans intérêt** | Suppression des colonnes entièrement vides (`_x`/`_y` résiduelles de merge) | `_drop_useless_columns()` |
| **Arrondissement** | Valeurs numériques arrondies à 2 décimales | `round(2)` |

### 2.2 Règles spécifiques par source

**Profils utilisateurs :**
- La colonne `UserID` doit être présente (validation avec `validate_required_columns`).
- `Age` contraint entre 10 et 120 en base (contrainte SQL `CHECK`).
- `Gender` doit être `'Male'`, `'Female'` ou `'Other'` (contrainte SQL `CHECK`).
- `Weight (kg)` et `Height (m)` doivent être > 0 (contrainte SQL).

**Activités :**
- Les colonnes `UserID` et `Date` doivent être présentes et non nulles.
- `Date` convertie au format `datetime` standard.

**Aliments :**
- `Food_Item` et `Calories` doivent être présents et non nuls.
- `Meal_Type` normalisé aux valeurs ENUM valides : `BREAKFAST`, `LUNCH`, `DINNER`, `SNACK`.

### 2.3 Rapport qualité automatique

Le pipeline génère automatiquement `logs/csv_quality_report.csv` contenant pour chaque colonne de chaque fichier CSV traité :

| Champ | Description |
|-------|-------------|
| `file` | Nom du fichier CSV analysé |
| `column` | Nom de la colonne |
| `dtype` | Type de données Pandas |
| `row_count` | Nombre total de lignes |
| `missing_count` | Nombre de valeurs manquantes |
| `missing_pct` | Pourcentage de valeurs manquantes |
| `unique_values` | Nombre de valeurs distinctes |
| `is_constant` | Vrai si unique_values ≤ 1 |
| `zero_pct` | Pourcentage de zéros (colonnes numériques) |
| `high_zero_flag` | Vrai si zero_pct ≥ 70 % |
| `flagged` | Vrai si la colonne est problématique |

---

## 3. Diagramme des flux de données

```
┌──────────────────────────────────────────────────────────────────────────┐
│                        SOURCES BRUTES (data/raw/)                        │
│                                                                          │
│  ┌─────────────────────────┐  ┌───────────────┐  ┌────────────────────┐ │
│  │ gym_members_exercise_   │  │  Activity.csv │  │ daily_food_        │ │
│  │ tracking.csv            │  │               │  │ nutrition_         │ │
│  │                         │  │ Activités     │  │ dataset.csv        │ │
│  │ Profils biométriques    │  │ physiques     │  │                    │ │
│  │ (âge, poids, genre…)   │  │ journalières  │  │ Référentiel        │ │
│  │                         │  │               │  │ nutritionnel       │ │
│  └────────────┬────────────┘  └──────┬────────┘  └─────────┬──────────┘ │
└───────────────┼──────────────────────┼─────────────────────┼────────────┘
                │                      │                      │
                └──────────────────────┼──────────────────────┘
                                       │
                                       ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                         PIPELINE ETL (etl/)                              │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │  extract.py                                                        │  │
│  │  → Lecture des 3 CSV avec pandas.read_csv()                       │  │
│  │  → Retourne : {users, activity, nutrition}                        │  │
│  └────────────────────────────┬───────────────────────────────────────┘  │
│                               │                                          │
│                               ▼                                          │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │  transform.py                                                      │  │
│  │                                                                    │  │
│  │  1. clean_users()       — dédup, validation UserID                │  │
│  │  2. clean_activity()    — dédup, validation UserID+Date, fillna   │  │
│  │  3. clean_nutrition()   — dédup, génération nutrition_id          │  │
│  │  4. add_user_features() — calcul IMC = poids / taille²           │  │
│  │  5. align_users_with_activity_ids()                               │  │
│  │     → ré-échantillonnage déterministe (seed=42)                  │  │
│  │     → alignement UserID profils ↔ UserID activités               │  │
│  │  6. merge activity + users (LEFT JOIN sur UserID)                 │  │
│  │  7. _select_mspr_20_columns() — sélection 20 colonnes            │  │
│  │  8. build_consumption_data() — génération synthétique            │  │
│  │     → 2-4 aliments × (user, date), quantités aléatoires          │  │
│  │     → seed=42 pour reproductibilité                              │  │
│  │                                                                    │  │
│  │  Retourne : {users, users_for_merge, activity, nutrition,         │  │
│  │             merged_mspr_20, consommation_alimentaire}             │  │
│  └────────────────────────────┬───────────────────────────────────────┘  │
│                               │                                          │
│                               ▼                                          │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │  load.py — Export CSV traités vers data/processed/                │  │
│  │                                                                    │  │
│  │  ├── users_clean.csv                                              │  │
│  │  ├── users_for_merge.csv                                          │  │
│  │  ├── activity_clean.csv                                           │  │
│  │  ├── nutrition_clean.csv                                          │  │
│  │  ├── merged_analytics_mspr_20.csv   ← utilisateur + activité     │  │
│  │  └── consommation_alimentaire.csv   ← données synthétiques       │  │
│  └────────────────────────────┬───────────────────────────────────────┘  │
│                               │                                          │
│                               ▼                                          │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │  quality.py — Rapport qualité automatique                         │  │
│  │  → Analyse chaque CSV : manquants, doublons, zéros, constantes   │  │
│  │  → Sortie : logs/csv_quality_report.csv                          │  │
│  └────────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                      DONNÉES TRAITÉES (data/processed/)                  │
│                                                                          │
│  merged_analytics_mspr_20.csv ──────────────────┐                       │
│  nutrition_clean.csv ────────────────────────────┤                       │
│  consommation_alimentaire.csv ───────────────────┤                       │
└──────────────────────────────────────────────────┼───────────────────────┘
                                                   │
                                                   ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                   database/seed.py  (--truncate)                         │
│                                                                          │
│  Ordre de chargement :                                                   │
│  1. utilisateur        ← merged_analytics_mspr_20.csv (dédup UserID)   │
│  2. activite_journaliere ← merged_analytics_mspr_20.csv                 │
│  3. activite_intensite ← merged_analytics_mspr_20.csv                  │
│     (4 lignes/séance : VERY_ACTIVE, MODERATE, LIGHT, SEDENTARY)        │
│  4. nutrition          ← nutrition_clean.csv                            │
│  5. consommation_alimentaire ← consommation_alimentaire.csv             │
│                                                                          │
│  Sécurité : ON CONFLICT DO NOTHING | TRUNCATE CASCADE si --truncate    │
└──────────────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────────────┐
│               BASE DE DONNÉES PostgreSQL 15 (schéma healthai)            │
│                                                                          │
│  TABLES                          VUES ANALYTIQUES                        │
│  ─────────────────────────────   ──────────────────────────────────────  │
│  utilisateur                     v_profil_utilisateur                    │
│  activite_journaliere      ──►   v_resume_journalier                    │
│  activite_intensite        ──►   v_bilan_calorique                      │
│  nutrition                 ──►   v_apport_nutritionnel                  │
│  consommation_alimentaire  ──►   v_intensite_seance                     │
│  api_users                       v_kpi_dashboard                         │
│  sessions                                                                │
└──────────────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                       API REST (APIMSPR-1/src/)                          │
│                                                                          │
│  ROUTES                    MIDDLEWARE                                    │
│  ─────────────────────────  ───────────────────────────────────────────  │
│  POST /auth/register        authenticate   — validation JWT + session   │
│  POST /auth/login           authorizeWrite — écriture réservée admin    │
│  POST /auth/logout          authorizeRole  — contrôle de rôle           │
│  GET  /auth/me              attachHealthId — résolution profil santé     │
│  ─────────────────────────                                               │
│  GET/POST/PUT/DELETE                                                     │
│    /utilisateurs            Accès : admin (CRUD), user (lecture propre) │
│    /aliment                 Accès : admin (CRUD), user (lecture)        │
│    /activite_quotidienne    Accès : admin (CRUD), user (lecture propre) │
│    /consommation            Accès : admin (CRUD), user (lecture propre) │
│  ─────────────────────────                                               │
│  GET /analytics/*           Accès : admin + user (lecture seule)       │
│    /kpi  /profil  /resume                                               │
│    /bilan  /apport  /intensite                                          │
└──────────────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                    CLIENTS (React SPA — public/dist/)                    │
│                                                                          │
│  Espace utilisateur                Espace administrateur                 │
│  ─────────────────────────────     ────────────────────────────────────  │
│  Accueil / Mon bilan               Dashboard (9 graphiques Recharts)    │
│  Activité (lecture)                Utilisateurs actifs (CRUD)           │
│  Consommation (lecture)            Profils santé (liaison compte)       │
│  Aliments (lecture)                Aliments / Activité / Consommation   │
│                                    Analytiques (6 vues tabulaires)      │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Schéma relationnel de la base cible

```
api_users                          utilisateur
─────────────────────              ──────────────────────────────────────
id           SERIAL  PK            user_id         BIGINT       PK
email        TEXT    UNIQUE        age             INT
password_hash TEXT                 gender          TEXT  CHECK IN(Male,Female,Other)
role         TEXT    CHECK         experience_level INT  CHECK 1–3
created_at   TIMESTAMP             weight_kg       NUMERIC
                                   height_m        NUMERIC
sessions                           bmi_calculated  NUMERIC
─────────────────────              api_user_id     INT  FK→api_users.id (SET NULL)
id       SERIAL  PK                created_at      TIMESTAMP
user_id  INT     FK→api_users.id          │
token    TEXT    UNIQUE                   │
expires_at TIMESTAMP                      │
                          ┌──────────────┘
                          │
              ┌───────────┴────────────┐
              │                        │
activite_journaliere           consommation_alimentaire
──────────────────────────     ──────────────────────────────────
id_activity  BIGSERIAL  PK     id_consumption  BIGINT    PK
user_id      BIGINT   FK       user_id         BIGINT    FK→utilisateur
date         DATE              nutrition_id    INT       FK→nutrition
workout_type TEXT              date_consommation DATE
steps        BIGINT            repas_type      ENUM
total_distance NUMERIC         quantite_grammes NUMERIC
session_duration_hours NUMERIC
calories_burned NUMERIC
          │
          │
activite_intensite                nutrition
──────────────────────────        ──────────────────────────────────
id_intensite  BIGSERIAL  PK       nutrition_id  INT       PK
id_activity   BIGINT  FK          food_item     TEXT
niveau_intensite ENUM             category      TEXT
distance      NUMERIC             calories_kcal NUMERIC
minutes       NUMERIC             protein_g     NUMERIC
UNIQUE(id_activity, niveau)       carbohydrates_g NUMERIC
                                  fat_g         NUMERIC
                                  fiber_g       NUMERIC
                                  sugars_g      NUMERIC
                                  sodium_mg     NUMERIC
                                  cholesterol_mg NUMERIC
                                  meal_type     ENUM
                                  water_intake_ml NUMERIC
```

---

## 5. Transformations appliquées

### 5.1 Pipeline de transformation par table cible

| Table cible | Source | Transformations principales |
|-------------|--------|----------------------------|
| `utilisateur` | `gym_members_exercise_tracking.csv` | Déduplication sur `UserID`, calcul BMI, alignement des IDs avec `Activity.csv` (seed=42) |
| `activite_journaliere` | `Activity.csv` | Déduplication, conversion de date, remplacement NaN numériques par 0, sélection 20 colonnes |
| `activite_intensite` | `Activity.csv` | Pivotage : 1 ligne d'activité → 4 lignes d'intensité (VERY_ACTIVE, MODERATE, LIGHT, SEDENTARY) |
| `nutrition` | `daily_food_nutrition_dataset.csv` | Déduplication, auto-génération de `nutrition_id`, normalisation ENUM `meal_type` |
| `consommation_alimentaire` | Génération synthétique | Simulation de 2–4 repas aléatoires par (user, date) depuis le référentiel nutritionnel (seed=42) |
| `api_users` | Script SQL (`03_seed_admin.sql`) | Insertion du compte admin au premier démarrage Docker, hash bcrypt pré-calculé |

### 5.2 Traitement d'alignement des identifiants utilisateurs

Les fichiers sources `gym_members_exercise_tracking.csv` et `Activity.csv` utilisent des espaces de `UserID` distincts et non correspondants. La transformation `align_users_with_activity_ids()` résout ce problème :

1. Extraction des `UserID` uniques présents dans `Activity.csv`
2. Échantillonnage déterministe (random_state=42) de profils dans `gym_members_exercise_tracking.csv` pour correspondre au nombre d'utilisateurs actifs
3. Réassignation des `UserID` des profils échantillonnés aux identifiants d'activité
4. Les profils non sélectionnés sont ignorés

Cette approche garantit que chaque utilisateur actif dispose d'un profil biométrique, même si les jeux de données d'origine ne partagent pas les mêmes clés.

### 5.3 Reproductibilité

Toutes les opérations aléatoires utilisent la graine `seed=42` :
- Alignement des identifiants (`random_state=42` dans pandas `sample()`)
- Génération des données de consommation (`numpy.random.seed(42)`)

Un re-run du pipeline sur les mêmes CSV sources produira exactement les mêmes données traitées.
