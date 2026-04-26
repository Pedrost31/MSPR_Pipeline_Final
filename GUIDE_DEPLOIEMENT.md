# Guide de déploiement — HealthAI

## Table des matières

1. [Architecture du projet](#1-architecture-du-projet)
2. [Prérequis](#2-prérequis)
3. [Variables d'environnement](#3-variables-denvironnement)
4. [Déploiement local (développement)](#4-déploiement-local-développement)
5. [Déploiement Docker complet](#5-déploiement-docker-complet)
6. [Déploiement en production](#6-déploiement-en-production)
7. [Tests](#7-tests)
8. [Commandes utiles](#8-commandes-utiles)
9. [Dépannage](#9-dépannage)

---

## 1. Architecture du projet

```
MSPR_Pipeline-docker/
├── MSPR_Pipeline/          ← Pipeline ETL + Base de données (Docker)
│   ├── docker-compose.yml  ← Orchestre postgres, pipeline, seed
│   ├── Dockerfile          ← Image Python 3.9 pour ETL
│   ├── etl/                ← Scripts Python (extract, transform, load, quality)
│   ├── database/           ← Schémas SQL + script de seed
│   ├── data/raw/           ← CSV sources bruts (à fournir)
│   └── data/processed/     ← CSV générés par le pipeline (sortie ETL)
│
└── APIMSPR-1/              ← API REST + Frontend React (Node.js)
    ├── src/                ← Serveur Express (port 3000)
    ├── client/             ← Application React (Vite)
    ├── public/dist/        ← Build React servi par Express
    └── .env                ← Variables d'environnement API
```

**Flux de démarrage :**

```
[MSPR_Pipeline] docker compose up
      │
      ├─ postgres    : démarre PostgreSQL + crée le schéma
      ├─ pipeline    : génère les CSV dans data/processed/
      └─ seed        : charge les CSV en base

[APIMSPR-1] npm run build   → construit le frontend dans public/dist/
[APIMSPR-1] npm run dev     → démarre l'API Express sur :3000
```

---

## 2. Prérequis

### Commun

| Outil | Version minimale | Vérification |
|-------|-----------------|--------------|
| Git | 2.x | `git --version` |
| Docker Desktop | 4.x | `docker --version` |
| Docker Compose | v2 (intégré) | `docker compose version` |
| Node.js | 18.x | `node --version` |
| npm | 9.x | `npm --version` |

> **Windows** : Docker Desktop doit être démarré avant toute commande `docker`.

### Données brutes requises

Avant de lancer le pipeline ETL, placer les 3 fichiers CSV dans `MSPR_Pipeline/data/raw/` :

| Fichier | Description |
|---------|-------------|
| `gym_members_exercise_tracking.csv` | Profils biométriques des utilisateurs |
| `Activity.csv` | Historique des activités physiques |
| `daily_food_nutrition_dataset.csv` | Référentiel nutritionnel des aliments |

```bash
# Vérifier la présence des fichiers
ls MSPR_Pipeline/data/raw/
```

---

## 3. Variables d'environnement

### 3.1 API (`APIMSPR-1/.env`)

Ce fichier est créé automatiquement si absent — vérifier et adapter avant tout démarrage.

```env
# Serveur Express
PORT=3000

# Base de données PostgreSQL
DATABASE_URL=postgresql://healthai:healthai@localhost:5432/healthai
DB_HOST=localhost
DB_PORT=5432
DB_USER=healthai
DB_PASSWORD=healthai
DB_NAME=healthai

# Sécurité JWT
JWT_SECRET=1da7f4a9788b3e948afc1be36e35db151607f8581ebdc346fea43c8e7b9
```

> **Production** : remplacer `JWT_SECRET` par une valeur aléatoire longue et `DB_PASSWORD` par un mot de passe fort. Ne jamais committer le fichier `.env`.

### 3.2 Pipeline ETL (`MSPR_Pipeline/docker-compose.yml`)

Les variables de connexion à la base sont définies directement dans le `docker-compose.yml` du service `seed` :

| Variable | Valeur par défaut |
|----------|-------------------|
| `POSTGRES_HOST` | `postgres` (nom du service Docker) |
| `POSTGRES_PORT` | `5432` |
| `POSTGRES_DB` | `healthai` |
| `POSTGRES_USER` | `healthai` |
| `POSTGRES_PASSWORD` | `healthai` |

---

## 4. Déploiement local (développement)

### Étape 1 — Cloner le projet

```bash
git clone <url-du-depot>
cd MSPR_Pipeline-docker
```

### Étape 2 — Démarrer la base de données et le pipeline ETL

```bash
cd MSPR_Pipeline
docker compose up --build
```

Docker va :
1. Construire l'image Python depuis le `Dockerfile`
2. Démarrer PostgreSQL et initialiser le schéma (`init.sql`, `api_schema.sql`, `03_seed_admin.sql`)
3. Exécuter le pipeline ETL (génère les CSV dans `data/processed/`)
4. Charger les CSV en base via `seed.py`

Attendre que les trois services affichent leur statut final :

```
healthai-postgres  | database system is ready to accept connections
healthai-pipeline  | Pipeline terminé avec succès
healthai-seed      | Seed terminé avec succès
```

> **Note** : `pipeline` et `seed` sont des conteneurs à usage unique — ils s'arrêtent après exécution, c'est normal.

### Étape 3 — Installer les dépendances de l'API

```bash
cd ../APIMSPR-1
npm install
```

### Étape 4 — Installer les dépendances du frontend et construire

```bash
cd client
npm install
cd ..
npm run build
```

Le build React est généré dans `APIMSPR-1/public/dist/` et sera servi directement par Express.

### Étape 5 — Démarrer l'API

```bash
# Depuis APIMSPR-1/
npm run dev
```

L'application est accessible sur **http://localhost:3000**

**Identifiants administrateur par défaut :**

| Email | Mot de passe |
|-------|-------------|
| admin@gmail.com | admin |

---

### Mode développement avec hot-reload frontend

Pour développer le frontend avec rechargement automatique, lancer en parallèle dans deux terminaux :

**Terminal 1 — API backend :**
```bash
cd APIMSPR-1
npm run dev          # Express sur :3000
```

**Terminal 2 — Frontend Vite :**
```bash
cd APIMSPR-1/client
npm run dev          # Vite sur :5173 avec proxy vers :3000
```

Accéder à **http://localhost:5173** pour le hot-reload.

Le proxy Vite redirige automatiquement `/auth`, `/utilisateurs`, `/aliment`, `/consommation`, `/activite_quotidienne`, `/analytics` vers le backend sur `:3000`.

---

## 5. Déploiement Docker complet

### 5.1 Construction et lancement de la base + pipeline

```bash
cd MSPR_Pipeline
docker compose up --build -d     # mode détaché
docker compose logs -f            # suivre les logs
```

### 5.2 Vérifier que PostgreSQL est prêt

```bash
docker exec healthai-postgres pg_isready -U healthai -d healthai
```

Sortie attendue : `localhost:5432 - accepting connections`

### 5.3 Vérifier le seed

```bash
docker compose logs seed
```

Sortie attendue (extrait) : `INSERT 0 N utilisateurs`, `INSERT 0 N activites`, etc.

### 5.4 Relancer uniquement le seed (après modification des CSV)

```bash
cd MSPR_Pipeline
docker compose run --rm seed
```

### 5.5 Arrêter les services

```bash
docker compose down              # arrête les conteneurs, conserve les volumes
docker compose down -v           # arrête ET supprime les données PostgreSQL
```

> `docker compose down -v` réinitialise entièrement la base. À utiliser uniquement pour repartir de zéro.

---

## 6. Déploiement en production

### 6.1 Sécurisation de l'environnement

Avant tout déploiement en production, modifier `APIMSPR-1/.env` :

```env
PORT=3000

# Connexion principale (recommandée)
DATABASE_URL=postgresql://healthai:healthai@localhost:5432/healthai

# Variables optionnelles (compatibilité selon config backend)
DB_HOST=localhost
DB_PORT=5432
DB_USER=healthai
DB_PASSWORD=healthai
DB_NAME=healthai

# Générer avec : node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_SECRET=<chaine-aleatoire-128-caracteres>
```

### 6.2 Construire le frontend de production

```bash
cd APIMSPR-1
npm run build
```

Le dossier `public/dist/` contient les fichiers statiques optimisés servis par Express.

### 6.3 Lancer l'API avec PM2 (gestionnaire de processus)

PM2 maintient le serveur en vie et le relance automatiquement en cas de crash.

```bash
# Installer PM2 globalement
npm install -g pm2

# Démarrer l'API
cd APIMSPR-1
pm2 start src/index.js --name healthai-api

# Configurer le démarrage automatique au reboot
pm2 startup
pm2 save

# Commandes PM2 utiles
pm2 status                 # état des processus
pm2 logs healthai-api      # logs en temps réel
pm2 restart healthai-api   # redémarrage
pm2 stop healthai-api      # arrêt
```

### 6.4 Reverse proxy avec Nginx (recommandé)

Nginx gère HTTPS, la compression et la mise en cache des fichiers statiques.

```nginx
server {
    listen 80;
    server_name votre-domaine.fr;

    # Redirection HTTP → HTTPS
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name votre-domaine.fr;

    ssl_certificate     /etc/letsencrypt/live/votre-domaine.fr/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/votre-domaine.fr/privkey.pem;

    # Compression gzip
    gzip on;
    gzip_types text/plain application/json application/javascript text/css;

    # Proxy vers l'API Node.js
    location / {
        proxy_pass         http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header   Host              $host;
        proxy_set_header   X-Real-IP         $remote_addr;
        proxy_set_header   X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;

        # Cookies sécurisés
        proxy_cookie_flags ~ secure samesite=strict;
    }
}
```

Redémarrer Nginx : `sudo systemctl reload nginx`

### 6.5 Checklist de sécurité production

- [ ] `JWT_SECRET` est une chaîne aléatoire de 64+ octets
- [ ] `DB_PASSWORD` est différent de la valeur par défaut `healthai`
- [ ] Le fichier `.env` n'est pas dans le dépôt Git (vérifié dans `.gitignore`)
- [ ] PostgreSQL n'est pas exposé sur une IP publique (port 5432 fermé en externe)
- [ ] HTTPS activé via Nginx + Let's Encrypt
- [ ] Mot de passe du compte `admin@gmail.com` changé après premier déploiement
- [ ] PM2 ou équivalent configuré pour redémarrage automatique

---

## 7. Tests

### Lancer les tests de l'API

```bash
cd APIMSPR-1
npm test
```

### Test de connexion à la base uniquement

```bash
cd APIMSPR-1
npm run test:docker
```

### Tester manuellement l'API avec curl

```bash
# Créer un compte
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@exemple.com","password":"monmdp"}'

# Se connecter (récupère le cookie)
curl -c cookies.txt -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@gmail.com","password":"admin"}'

# Appel authentifié
curl -b cookies.txt http://localhost:3000/auth/me

# Liste des aliments
curl -b cookies.txt http://localhost:3000/aliment
```

---

## 8. Commandes utiles

### Pipeline ETL

```bash
# Reconstruire et relancer tout le pipeline
cd MSPR_Pipeline
docker compose down && docker compose up --build

# Relancer uniquement le seed (sans reconstruire)
docker compose run --rm seed

# Relancer uniquement le pipeline ETL
docker compose run --rm pipeline

# Voir les logs du pipeline
docker compose logs pipeline

# Accéder à PostgreSQL en ligne de commande
docker exec -it healthai-postgres psql -U healthai -d healthai
```

### API

```bash
# Installer les dépendances
cd APIMSPR-1 && npm install

# Build du frontend
npm run build

# Démarrer en développement (nodemon, rechargement auto)
npm run dev

# Démarrer le client Vite séparément (hot-reload frontend)
npm run dev:client
```

### Base de données (depuis psql)

```sql
-- Vérifier les tables
\dt healthai.*

-- Compter les lignes par table
SELECT 'utilisateur' AS table, COUNT(*) FROM healthai.utilisateur
UNION ALL
SELECT 'activite_journaliere', COUNT(*) FROM healthai.activite_journaliere
UNION ALL
SELECT 'nutrition', COUNT(*) FROM healthai.nutrition
UNION ALL
SELECT 'consommation_alimentaire', COUNT(*) FROM healthai.consommation_alimentaire
UNION ALL
SELECT 'api_users', COUNT(*) FROM healthai.api_users;

-- Vérifier le compte admin
SELECT id, email, role FROM healthai.api_users WHERE role = 'admin';
```

---

## 9. Dépannage

### Le conteneur `seed` échoue avec une erreur de connexion

**Symptôme :** `connection refused` ou `could not connect to server`

**Cause :** PostgreSQL n'est pas encore prêt quand `seed` démarre.

**Solution :** La healthcheck est configurée, mais si le problème persiste :
```bash
docker compose up postgres -d          # démarrer postgres seul
docker compose logs -f postgres        # attendre "ready to accept connections"
docker compose run --rm seed           # puis relancer le seed
```

---

### Le pipeline ETL échoue avec `FileNotFoundError`

**Symptôme :** `No such file or directory: 'data/raw/Activity.csv'`

**Cause :** Les fichiers CSV sources sont manquants.

**Solution :** Placer les 3 CSV dans `MSPR_Pipeline/data/raw/` avant de lancer `docker compose up`.

---

### `npm run dev` échoue avec `Missing script: "dev"`

**Cause :** La commande est lancée depuis le mauvais répertoire.

**Solution :**
```bash
cd APIMSPR-1    # ← obligatoire, pas depuis la racine du projet
npm run dev
```

---

### L'API retourne `401 Unauthorized` sur tous les appels

**Cause possible 1 :** JWT_SECRET différent entre le serveur qui a émis le token et le serveur actuel.

**Solution :** Vérifier que `.env` est cohérent et redémarrer l'API après toute modification.

**Cause possible 2 :** La session a expiré (durée de vie : 24h).

**Solution :** Se déconnecter et se reconnecter.

---

### Les données sont vides côté utilisateur

**Cause :** Le profil santé n'est pas lié au compte.

**Solution :** Se connecter en admin → Profils → Attribuer le profil au compte utilisateur.

---

### Réinitialiser complètement la base de données

```bash
cd MSPR_Pipeline
docker compose down -v          # supprime le volume postgres_data
docker compose up --build       # recrée la base et recharge les données
```

> Toutes les données seront perdues. Le compte admin sera recréé automatiquement.

---

### Port 5432 déjà utilisé

**Symptôme :** `bind: address already in use`

**Cause :** Une instance PostgreSQL locale tourne déjà sur le port 5432.

**Solution :** Arrêter le service local ou changer le port dans `docker-compose.yml` :
```yaml
ports:
  - "5433:5432"    # utiliser le port 5433 en local
```

Et adapter `DB_PORT=5433` dans `APIMSPR-1/.env`.

---

### Vérifier l'état général

```bash
# État des conteneurs Docker
docker ps -a

# Logs de tous les services
cd MSPR_Pipeline && docker compose logs

# Test de connexion à la base
cd APIMSPR-1 && npm run test:docker

# Santé de l'API
curl http://localhost:3000/auth/me
```
