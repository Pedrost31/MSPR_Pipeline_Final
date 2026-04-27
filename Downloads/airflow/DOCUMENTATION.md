# Documentation Technique — HealthAI

> **Astuce :** `Ctrl + Shift + V` dans VS Code pour l'aperçu Markdown.

**Stack :** Node.js 20 · Express 5 · PostgreSQL 15 · JWT · React 18 · Vite · Recharts  
**Schéma BDD :** `healthai` (PostgreSQL sur `localhost:5432`)  
**Port API :** `3000` | **Port Dev Frontend :** `5173`

---

## Table des matières

1. [Architecture générale](#1-architecture-générale)
2. [Base de données](#2-base-de-données)
3. [Vues analytiques](#3-vues-analytiques)
4. [Authentification](#4-authentification)
5. [Middleware](#5-middleware)
6. [Routes — Profils santé](#6-routes--profils-santé)
7. [Routes — Activité quotidienne](#7-routes--activité-quotidienne)
8. [Routes — Consommation alimentaire](#8-routes--consommation-alimentaire)
9. [Routes — Référentiel aliments](#9-routes--référentiel-aliments)
10. [Routes — Analytics](#10-routes--analytics)
11. [Frontend React](#11-frontend-react)
12. [Dashboard Admin](#12-dashboard-admin)
13. [Pipeline ETL & Docker](#13-pipeline-etl--docker)
14. [Démarrage](#14-démarrage)

---

## 1. Architecture générale

```
MSPR_Pipeline-docker/
├── APIMSPR-1/                        ← Application web (API + Frontend)
│   ├── src/
│   │   ├── index.js                  # Point d'entrée Express
│   │   ├── db.js                     # Pool de connexion PostgreSQL
│   │   ├── middleware/
│   │   │   ├── auth.js               # JWT + contrôle des rôles
│   │   │   ├── healthId.js           # Résolution du profil santé lié
│   │   │   └── errorHandler.js       # Gestion globale des erreurs
│   │   ├── routes/
│   │   │   ├── auth.js               # Authentification & gestion des comptes
│   │   │   ├── utilisateurs.js       # Profils santé (CRUD + liaison)
│   │   │   ├── activite_quotidienne.js # Activités + intensités (transaction)
│   │   │   ├── consommation_alimentaire.js
│   │   │   ├── aliment.js            # Référentiel nutritionnel
│   │   │   └── analytics.js          # 6 vues SQL analytiques
│   │   └── db/
│   │       ├── create_api_users.sql
│   │       ├── create_sessions.sql
│   │       └── link_users.sql
│   ├── client/                       # Frontend React (Vite)
│   │   ├── public/logo.svg           # Logo HealthAI (SVG)
│   │   └── src/
│   │       ├── components/
│   │       │   ├── Icons.jsx         # Bibliothèque d'icônes SVG inline
│   │       │   └── Modal.jsx         # Composant modal réutilisable
│   │       ├── context/
│   │       │   ├── AuthContext.jsx
│   │       │   └── ToastContext.jsx
│   │       └── pages/
│   │           ├── Login.jsx
│   │           ├── admin/
│   │           │   ├── AdminPage.jsx
│   │           │   └── sections/
│   │           │       ├── DashboardSection.jsx  # Graphiques + KPIs + Bilan
│   │           │       ├── UsersSection.jsx       # Utilisateurs actifs
│   │           │       ├── ProfilsSection.jsx     # Profils santé + liaisons
│   │           │       ├── AlimentSection.jsx
│   │           │       ├── HealthSection.jsx      # Composant générique tables
│   │           │       └── AnalyticsSection.jsx   # 6 onglets analytiques
│   │           └── dashboard/
│   │               └── DashboardPage.jsx          # Espace utilisateur
│   └── public/dist/                  # Build React (servi par Express)
│
└── MSPR_Pipeline/                    ← Pipeline ETL Python
    ├── database/
    │   ├── init.sql                  # Schéma principal + vues analytiques
    │   ├── api_schema.sql            # Tables applicatives (auth, sessions)
    │   └── 03_seed_admin.sql         # Compte admin par défaut
    ├── etl/                          # Scripts ETL Python
    ├── scripts/run_pipeline.py
    └── docker-compose.yml
```

### Montage des routes — `src/index.js`

```js
// Public
app.use("/auth", authRoutes);

// Référentiels — lecture pour tous, écriture admin uniquement
app.use("/utilisateurs", authenticate, authorizeWrite, utilisateursRoutes);
app.use("/aliment",      authenticate, authorizeWrite, alimentRoutes);

// Données de santé — filtrées par healthId pour les non-admins
app.use("/activite_quotidienne", authenticate, authorizeWrite, attachHealthId, activiteRoutes);
app.use("/consommation",         authenticate, authorizeWrite, attachHealthId, consommationRoutes);

// Analytics — lecture seule, filtrées par healthId
app.use("/analytics", authenticate, attachHealthId, analyticsRoutes);

// Fallback SPA
app.use((_req, res) => res.sendFile(join(__dirname, "../public/dist/index.html")));
```

---

## 2. Base de données

### Connexion — `src/db.js`

```js
export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
```

Le `search_path` est défini à `healthai` dans chaque requête via le préfixe explicite `healthai.table`.

---

### `healthai.api_users` — Comptes d'authentification

| Colonne | Type | Description |
|---|---|---|
| `id` | SERIAL PK | Identifiant auto |
| `email` | VARCHAR(255) UNIQUE | Adresse email |
| `password_hash` | VARCHAR(255) | Hash bcrypt (10 rounds) |
| `role` | VARCHAR(20) | `'user'` ou `'admin'` |
| `created_at` | TIMESTAMPTZ | Date de création |

---

### `healthai.sessions` — Sessions JWT

| Colonne | Type | Description |
|---|---|---|
| `id` | SERIAL PK | |
| `user_id` | INT FK → api_users | |
| `token` | TEXT UNIQUE | JWT signé |
| `expires_at` | TIMESTAMPTZ | Expiration (24h) |

---

### `healthai.utilisateur` — Profils santé

| Colonne | Type | Description |
|---|---|---|
| `user_id` | BIGINT PK | ID du profil (source dataset) |
| `age` | SMALLINT | Âge (10–120) |
| `gender` | VARCHAR(20) | `'Male'` / `'Female'` / `'Other'` |
| `experience_level` | INT | 1 = débutant, 2 = intermédiaire, 3 = avancé |
| `weight_kg` | NUMERIC(6,2) | Poids en kg |
| `height_m` | NUMERIC(4,2) | Taille en mètres |
| `bmi_calculated` | NUMERIC(6,2) | IMC calculé (`weight / height²`) |
| `api_user_id` | INT FK → api_users | Compte API associé (nullable) |
| `created_at` | TIMESTAMPTZ | |

---

### `healthai.activite_journaliere` — Séances d'entraînement

| Colonne | Type | Description |
|---|---|---|
| `id_activity` | BIGSERIAL PK | |
| `user_id` | BIGINT FK → utilisateur | |
| `date` | DATE | Date de la séance |
| `workout_type` | VARCHAR(50) | Type d'exercice |
| `steps` | INT | Nombre de pas |
| `total_distance` | NUMERIC | Distance parcourue |
| `session_duration_hours` | NUMERIC | Durée en heures |
| `calories_burned` | NUMERIC | Calories brûlées |

---

### `healthai.activite_intensite` — Niveaux d'intensité par séance

| Colonne | Type | Description |
|---|---|---|
| `id_intensite` | BIGSERIAL PK | |
| `id_activity` | BIGINT FK → activite_journaliere | |
| `niveau_intensite` | VARCHAR | `'Low'` / `'Medium'` / `'High'` |
| `distance` | NUMERIC | Distance à ce niveau |
| `minutes` | NUMERIC | Durée à ce niveau |

> Créée/supprimée en **transaction** avec `activite_journaliere`.

---

### `healthai.nutrition` — Référentiel nutritionnel

| Colonne | Type | Description |
|---|---|---|
| `nutrition_id` | SERIAL PK | |
| `food_item` | VARCHAR UNIQUE | Nom de l'aliment |
| `category` | VARCHAR | Catégorie alimentaire |
| `calories_kcal` | NUMERIC | Calories pour 100g |
| `protein_g` | NUMERIC | Protéines (g) |
| `carbohydrates_g` | NUMERIC | Glucides (g) |
| `fat_g` | NUMERIC | Lipides (g) |
| `fiber_g` | NUMERIC | Fibres (g) |
| `sugars_g` | NUMERIC | Sucres (g) |
| `sodium_mg` | NUMERIC | Sodium (mg) |
| `cholesterol_mg` | NUMERIC | Cholestérol (mg) |
| `meal_type` | VARCHAR | Type de repas suggéré |
| `water_intake_ml` | NUMERIC | Apport en eau (ml) |

---

### `healthai.consommation_alimentaire` — Journal alimentaire

| Colonne | Type | Description |
|---|---|---|
| `id_consumption` | BIGINT PK | |
| `user_id` | BIGINT FK → utilisateur | |
| `nutrition_id` | INT FK → nutrition | |
| `date_consommation` | DATE | |
| `repas_type` | VARCHAR | `'Breakfast'` / `'Lunch'` / `'Dinner'` / `'Snack'` |
| `quantite_grammes` | NUMERIC | Quantité consommée (g) |

---

## 3. Vues analytiques

Six vues SQL précalculées dans `healthai` :

| Vue | Route | Description |
|---|---|---|
| `v_profil_utilisateur` | `/analytics/profil` | Profil complet + stats agrégées (séances, pas, calories) |
| `v_resume_journalier` | `/analytics/resume` | Activité + macros nutritionnels par jour |
| `v_bilan_calorique` | `/analytics/bilan` | Dépenses vs apports caloriques avec statut |
| `v_apport_nutritionnel` | `/analytics/apport` | Détail macros par repas et par date |
| `v_intensite_seance` | `/analytics/intensite` | Répartition de l'intensité par séance |
| `v_kpi_dashboard` | `/analytics/kpi` | KPI globaux par profil (dashboard admin) |

### Exemple — `v_kpi_dashboard`

```sql
SELECT
    vp.user_id, vp.age, vp.gender, vp.bmi_calculated, vp.categorie_imc,
    vp.nb_seances, vp.moy_calories_brulees, vp.moy_duree_seance_h, vp.total_steps,
    COUNT(DISTINCT rj.date)                        AS jours_avec_activite,
    ROUND(AVG(rj.calories_consommees)::NUMERIC, 0) AS moy_calories_consommees,
    ROUND(AVG(rj.proteines_g)::NUMERIC, 1)         AS moy_proteines_g,
    ROUND(AVG(rj.glucides_g)::NUMERIC, 1)          AS moy_glucides_g,
    ROUND(AVG(rj.lipides_g)::NUMERIC, 1)           AS moy_lipides_g
FROM v_profil_utilisateur vp
LEFT JOIN v_resume_journalier rj ON rj.user_id = vp.user_id
GROUP BY vp.user_id, ...
```

---

## 4. Authentification

Basée sur **JWT** stocké dans un cookie `httpOnly`. Chaque session est enregistrée en base pour permettre la révocation.

### `POST /auth/register` — Inscription publique

Crée un compte avec le rôle `user`.

**Body :** `{ email, password }`  
**Réponse :** `201 { message, user: { id, email, role } }`

### `POST /auth/login` — Connexion

Vérifie les credentials, génère un JWT signé (24h), l'enregistre en session et le pose en cookie `httpOnly`.

**Body :** `{ email, password }`  
**Réponse :** `200 { role, email, id }`

### `POST /auth/logout`

Supprime la session en base et efface le cookie.

### `GET /auth/me`

Retourne les infos du compte connecté **et** l'ID du profil santé lié.

**Réponse :** `200 { id, email, role, healthId }`

### Gestion des comptes (admin uniquement)

| Méthode | Route | Description |
|---|---|---|
| `GET` | `/auth/users` | Liste tous les comptes |
| `POST` | `/auth/users` | Crée un compte avec rôle choisi |
| `PUT` | `/auth/users/:id` | Modifie l'email |
| `PATCH` | `/auth/users/:id/role` | Change le rôle (`user` ↔ `admin`) |
| `DELETE` | `/auth/users/:id` | Supprime un compte |
| `GET` | `/auth/stats` | Nombre de lignes par table (comptages dashboard) |

---

## 5. Middleware

### `authenticate` — `src/middleware/auth.js`

Vérifie le JWT (cookie `token` ou header `Authorization: Bearer`) et contrôle que la session est active et non expirée en base.

```js
const token = req.cookies?.token || req.headers["authorization"]?.slice(7);
const decoded = jwt.verify(token, process.env.JWT_SECRET);
const session = await pool.query(
  "SELECT id FROM sessions WHERE token = $1 AND expires_at > NOW()", [token]
);
if (!session.rows.length) return res.status(401).json({ error: "Session expirée." });
req.user = decoded;  // { id, email, role }
```

### `authorizeWrite` — `src/middleware/auth.js`

Bloque `POST`, `PUT`, `PATCH`, `DELETE` pour les non-admins.

```js
if (writeMethods.includes(req.method) && req.user.role !== "admin")
  return res.status(403).json({ error: "Accès admin requis." });
```

### `attachHealthId` — `src/middleware/healthId.js`

Résout le `user_id` du profil santé (`utilisateur`) lié au compte connecté. Si aucun profil n'est lié, `req.healthId = null` → les routes de données retournent `[]`.

```js
if (req.user.role === "admin") { next(); return; }
const r = await pool.query(
  "SELECT user_id FROM utilisateur WHERE api_user_id = $1", [req.user.id]
);
req.healthId = r.rows[0]?.user_id ?? null;
```

---

## 6. Routes — Profils santé

**Base :** `/utilisateurs`  
**Auth :** requis | **Écriture :** admin uniquement

| Méthode | Route | Admin | User |
|---|---|---|---|
| `GET` | `/` | Tous les profils + email du compte lié | Son propre profil |
| `GET` | `/unlinked` | Profils sans compte associé | — |
| `POST` | `/` | Crée un profil | — |
| `PUT` | `/:id` | Modifie un profil | — |
| `DELETE` | `/:id` | Supprime un profil | — |
| `PUT` | `/:id/link` | Lie un profil à un compte | — |
| `DELETE` | `/:id/link` | Retire la liaison | — |

**Body `PUT /:id/link` :**
```json
{ "api_user_id": 5 }
```

---

## 7. Routes — Activité quotidienne

**Base :** `/activite_quotidienne`  
**Auth :** requis | **Écriture :** admin | **Filtrage :** par `healthId` pour les users

| Méthode | Route | Description |
|---|---|---|
| `GET` | `/` | Liste des séances |
| `POST` | `/` | Crée une séance + niveaux d'intensité (transaction) |
| `PUT` | `/:id` | Modifie une séance + recalcule les intensités |
| `DELETE` | `/:id` | Supprime la séance et ses intensités (cascade) |

> La création et la modification utilisent une **transaction** : `activite_journaliere` + `activite_intensite` sont insérées ensemble ou annulées ensemble.

**Body `POST /` :**
```json
{
  "user_id": 1001,
  "date": "2024-03-15",
  "workout_type": "Running",
  "steps": 8500,
  "total_distance": 6.2,
  "session_duration_hours": 1.2,
  "calories_burned": 480,
  "intensites": [
    { "niveau_intensite": "Low",    "distance": 1.0, "minutes": 10 },
    { "niveau_intensite": "Medium", "distance": 3.2, "minutes": 35 },
    { "niveau_intensite": "High",   "distance": 2.0, "minutes": 27 }
  ]
}
```

---

## 8. Routes — Consommation alimentaire

**Base :** `/consommation`  
**Auth :** requis | **Écriture :** admin | **Filtrage :** par `healthId`

| Méthode | Route | Description |
|---|---|---|
| `GET` | `/` | Journal alimentaire |
| `POST` | `/` | Enregistre une consommation |
| `PUT` | `/:id` | Modifie une entrée |
| `DELETE` | `/:id` | Supprime une entrée |

**Body `POST /` :**
```json
{
  "user_id": 1001,
  "nutrition_id": 42,
  "date_consommation": "2024-03-15",
  "repas_type": "Lunch",
  "quantite_grammes": 200
}
```

---

## 9. Routes — Référentiel aliments

**Base :** `/aliment`  
**Auth :** requis | **Écriture :** admin | **Lecture :** tous

| Méthode | Route | Description |
|---|---|---|
| `GET` | `/` | Tous les aliments |
| `POST` | `/` | Ajoute un aliment |
| `PUT` | `/:food_item` | Modifie un aliment |
| `DELETE` | `/:food_item` | Supprime un aliment |

---

## 10. Routes — Analytics

**Base :** `/analytics`  
**Auth :** requis | **Méthode :** `GET` uniquement  
**Filtrage :** admin = toutes les données, user = filtré sur son `healthId`

| Route | Vue SQL | Description |
|---|---|---|
| `GET /analytics/kpi` | `v_kpi_dashboard` | KPI par profil (IMC, séances, calories, macros) |
| `GET /analytics/profil` | `v_profil_utilisateur` | Profil complet avec stats agrégées |
| `GET /analytics/resume` | `v_resume_journalier` | Activité + macros par journée |
| `GET /analytics/bilan` | `v_bilan_calorique` | Dépenses vs apports (surplus/déficit) |
| `GET /analytics/apport` | `v_apport_nutritionnel` | Détail macros par repas et aliment |
| `GET /analytics/intensite` | `v_intensite_seance` | Répartition intensité par séance |

---

## 11. Frontend React

**Stack :** React 18.3 · React Router 6 · Vite 5 · Recharts 3.8 · CSS Variables

### Wrapper API — `src/api.js`

```js
export async function api(method, path, body) {
  const res = await fetch(path, {
    method,
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',   // envoie le cookie JWT automatiquement
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Erreur serveur');
  return data;
}
```

### Guards de rôle — `src/App.jsx`

```jsx
function Guard({ role, children }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/" replace />;
  if (user.role !== role)
    return <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} replace />;
  return children;
}
```

Routes protégées :
- `/admin` — réservé aux `admin`
- `/dashboard` — réservé aux `user`
- `/` — redirige vers l'espace approprié si déjà connecté

### Proxy Vite — `client/vite.config.js`

En mode développement, les appels API sont proxifiés vers `localhost:3000` :

```js
server: {
  proxy: {
    '/auth':                 'http://localhost:3000',
    '/aliment':              'http://localhost:3000',
    '/utilisateurs':         'http://localhost:3000',
    '/consommation':         'http://localhost:3000',
    '/activite_quotidienne': 'http://localhost:3000',
    '/analytics':            'http://localhost:3000',
  }
}
```

### Pagination

Toutes les tables (admin et utilisateur) utilisent une pagination côté client de **20 lignes par page**.

---

## 12. Dashboard Admin

Le dashboard admin (`DashboardSection.jsx`) charge deux endpoints :
- `GET /auth/stats` → comptages bruts par table
- `GET /analytics/kpi` → données agrégées par profil

### Graphiques disponibles

| Graphique | Type | Données |
|---|---|---|
| Répartition IMC | PieChart | Catégories IMC (Sous-poids / Normal / Surpoids / Obésité) |
| Genre des profils | PieChart (donut) | Répartition Male / Female / Other |
| Profil de performance | RadarChart | 5 métriques normalisées (séances, pas, durée, calories, jours) |
| Bilan calorique | BarChart groupé | Calories brûlées vs consommées par utilisateur |
| Macronutriments | BarChart empilé | Protéines / Glucides / Lipides par utilisateur |
| Séances | BarChart | Nombre de séances par utilisateur |
| Jours actifs | AreaChart | Jours avec activité par utilisateur |
| Total des pas | BarChart | Cumul de pas par utilisateur |
| Durée moyenne | BarChart | Durée moyenne des séances (h) |

### Section Bilan global

8 cartes de synthèse calculées client-side depuis les données KPI :

| Indicateur | Calcul |
|---|---|
| Couverture nutritionnelle | % profils avec données de consommation |
| Taux d'activité | % profils avec au moins 1 séance |
| Équilibre calorique | Nb profils en déficit / excédent |
| IMC dans la norme | % profils avec IMC entre 18.5 et 25 |
| Comptes sans profil santé | `stats.api_users - stats.utilisateur` |
| Jours d'activité moyens | Moyenne de `jours_avec_activite` |
| Protéines moyennes | Moyenne de `moy_proteines_g` |
| Glucides / Lipides moyens | Moyennes respectives |

---

## 13. Pipeline ETL & Docker

### `MSPR_Pipeline/docker-compose.yml`

```yaml
services:
  postgres:       # PostgreSQL 15
  pipeline:       # Python ETL — génère les CSV
  seed:           # Python — importe les CSV dans PostgreSQL
```

Les scripts d'initialisation PostgreSQL s'exécutent dans l'ordre alphabétique au **premier démarrage** du conteneur :

| Fichier | Description |
|---|---|
| `01_init.sql` | Schéma principal : tables de données + vues analytiques |
| `02_api_schema.sql` | Tables applicatives : `api_users`, `sessions`, lien profil |
| `03_seed_admin.sql` | Compte administrateur par défaut (`admin@gmail.com` / `admin`) |

> `03_seed_admin.sql` utilise `ON CONFLICT DO NOTHING` — relancer le conteneur ne crée pas de doublon.

### Lancer avec Docker

```bash
cd MSPR_Pipeline
docker-compose up -d
```

---

## 14. Démarrage

### Variables d'environnement — `APIMSPR-1/.env`

```env
DATABASE_URL=postgresql://healthai:healthai@localhost:5432/healthai
JWT_SECRET=votre_secret_jwt_securise
NODE_ENV=development
PORT=3000
```

### Lancer en développement

```bash
# Terminal 1 — API (backend)
cd APIMSPR-1
npm run dev          # → http://localhost:3000

# Terminal 2 — Frontend (hot reload)
cd APIMSPR-1/client
npm run dev          # → http://localhost:5173
```

### Lancer en production

```bash
# Construire le frontend
cd APIMSPR-1/client
npm run build        # → génère APIMSPR-1/public/dist/

# Démarrer le backend (sert aussi le frontend compilé)
cd APIMSPR-1
npm run dev          # → http://localhost:3000
```

### Flux complet d'attribution d'un profil à un compte

```
1. Admin crée un compte utilisateur
   POST /auth/users  { "email": "user@mail.com", "password": "...", "role": "user" }

2. Admin consulte les profils sans compte
   GET /utilisateurs/unlinked

3. Admin lie le profil au compte
   PUT /utilisateurs/1001/link  { "api_user_id": 5 }

4. L'utilisateur se connecte → le profil est automatiquement résolu
   GET /auth/me  →  { "id": 5, "email": "user@mail.com", "role": "user", "healthId": 1001 }

5. L'utilisateur accède à ses données filtrées
   GET /activite_quotidienne  →  séances du profil 1001 uniquement
   GET /consommation          →  journal alimentaire du profil 1001
   GET /analytics/kpi         →  KPIs du profil 1001
```

### Accéder directement en admin

Après `docker-compose up` ou un premier démarrage avec la base initialisée :

| Champ | Valeur |
|---|---|
| Email | `admin@gmail.com` |
| Mot de passe | `admin` |
| URL | `http://localhost:3000` (ou `:5173` en dev) |
