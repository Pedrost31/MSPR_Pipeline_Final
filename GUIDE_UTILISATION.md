# Guide d'utilisation — HealthAI

## Table des matières

1. [Démarrage rapide](#1-démarrage-rapide)
2. [Connexion et création de compte](#2-connexion-et-création-de-compte)
3. [Espace utilisateur](#3-espace-utilisateur)
4. [Espace administrateur](#4-espace-administrateur)
5. [Gestion des profils santé](#5-gestion-des-profils-santé)
6. [Questions fréquentes](#6-questions-fréquentes)

---

## 1. Démarrage rapide

### Prérequis

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installé et démarré
- [Node.js 18+](https://nodejs.org/) (pour le mode développement uniquement)

### Lancer le projet avec Docker (recommandé)

```bash
# 1. Cloner ou ouvrir le projet
cd MSPR_Pipeline-docker

# 2. Lancer le pipeline ETL et la base de données
cd MSPR_Pipeline
docker compose up --build
```

Docker va automatiquement :
- Démarrer PostgreSQL et créer le schéma `healthai`
- Exécuter le pipeline ETL pour générer les fichiers CSV
- Importer les données CSV dans la base de données
- Créer le compte administrateur par défaut

### Lancer l'API et le frontend

```bash
# Dans un second terminal
cd APIMSPR-1
npm install          # installer les dépendances backend
npm run dev          # démarrer l'API + le frontend
```

L'application est accessible sur : **http://localhost:5173**

### Identifiants administrateur par défaut

| Champ        | Valeur             |
|--------------|--------------------|
| Email        | admin@gmail.com    |
| Mot de passe | admin              |
| Rôle         | admin              |

> Ces identifiants sont créés automatiquement au premier lancement Docker via le script `database/03_seed_admin.sql`.

---

## 2. Connexion et création de compte

### Se connecter

1. Ouvrir **http://localhost:5173**
2. L'onglet **Connexion** est affiché par défaut
3. Saisir votre adresse email et votre mot de passe
4. Cliquer sur **Se connecter**

Selon votre rôle, vous serez redirigé vers :
- **Espace utilisateur** — si votre rôle est `user`
- **Espace administrateur** — si votre rôle est `admin`

### Créer un compte

1. Sur la page de connexion, cliquer sur l'onglet **Créer un compte**
2. Saisir une adresse email valide et un mot de passe
3. Cliquer sur **Créer mon compte**
4. Un message de confirmation s'affiche

> Tous les nouveaux comptes ont le rôle `user` par défaut. Un administrateur peut vous promouvoir au rôle `admin`.

### Se déconnecter

Cliquer sur le bouton **Déconnexion** en bas du menu latéral.

---

## 3. Espace utilisateur

L'espace utilisateur permet de consulter vos données de santé personnelles, en lecture seule.

### Navigation

Le menu latéral gauche contient les sections suivantes :

| Section      | Description                                      |
|--------------|--------------------------------------------------|
| Accueil      | Tableau de bord avec un résumé de vos données    |
| Mon bilan    | Indicateurs clés (IMC, séances, calories, pas)   |
| Activité     | Historique de vos activités quotidiennes         |
| Consommation | Historique de vos repas et apports nutritionnels |
| Aliments     | Référentiel des aliments et leurs valeurs        |

### Page Accueil

La page d'accueil affiche :
- Un message de bienvenue personnalisé
- Trois cartes cliquables montrant le nombre total d'entrées dans vos données d'activité, de consommation et d'aliments

Cliquer sur une carte vous emmène directement vers la section correspondante.

### Consulter vos données

Chaque section de données (Activité, Consommation, Aliments) affiche :

1. **Un champ de recherche** — filtrer les résultats en tapant n'importe quelle valeur
2. **Un compteur de lignes** — nombre de résultats affichés
3. **Un tableau** — données paginées par 20 lignes
4. **Pagination** — boutons précédent / suivant si plus de 20 lignes

### Colonnes affichées

**Activité**

| Colonne         | Signification        |
|-----------------|----------------------|
| ID              | Identifiant unique   |
| Date            | Date de la séance    |
| Type d'activité | Type d'exercice      |
| Pas             | Nombre de pas        |
| Cal. brûlées    | Calories dépensées   |
| % actif         | Taux d'activité (%)  |

**Consommation**

| Colonne        | Signification           |
|----------------|-------------------------|
| ID             | Identifiant unique      |
| Date           | Date de consommation    |
| Repas          | Type de repas           |
| Aliment        | Aliment consommé        |
| Quantité (g)   | Quantité en grammes     |

**Mon bilan**

| Colonne           | Signification              |
|-------------------|----------------------------|
| IMC               | Indice de masse corporelle |
| Catégorie IMC     | Interprétation de l'IMC    |
| Séances           | Nombre de séances totales  |
| Cal. brûlées moy. | Moyenne des calories       |
| Pas total         | Total des pas effectués    |

> Si vous ne voyez aucune donnée, votre profil santé n'a peut-être pas encore été associé à votre compte. Contactez un administrateur.

---

## 4. Espace administrateur

L'espace administrateur est réservé aux comptes de rôle `admin`. Il permet de visualiser, gérer et analyser toutes les données de la plateforme.

### Navigation

| Section             | Groupe          | Description                                         |
|---------------------|-----------------|-----------------------------------------------------|
| Dashboard           | Tableau de bord | Graphiques et indicateurs globaux de la plateforme  |
| Utilisateurs actifs | Comptes         | Gestion des comptes utilisateurs                    |
| Aliments            | Référentiel     | Référentiel des aliments                            |
| Profils             | Santé           | Profils de santé et association aux comptes         |
| Consommation        | Santé           | Toutes les entrées de consommation alimentaire      |
| Activité            | Santé           | Toutes les entrées d'activité quotidienne           |
| Analytiques         | Analytics       | Vues analytiques avancées de la base de données     |

---

### 4.1 Dashboard

Le dashboard affiche une synthèse visuelle de toutes les données.

**Indicateurs clés (KPI)**

- Nombre total d'utilisateurs enregistrés dans le système
- IMC moyen de la population
- Calories brûlées en moyenne
- Calories consommées en moyenne
- Ratio calories brûlées / consommées

**Graphiques disponibles**

| Graphique                     | Type         | Description                                      |
|-------------------------------|--------------|--------------------------------------------------|
| Répartition IMC               | Camembert    | Distribution des catégories IMC                  |
| Calories brûlées vs consommées| Barres       | Comparaison par profil                           |
| Évolution des séances         | Aires        | Tendance du nombre de séances dans le temps      |
| Répartition par genre         | Camembert    | Proportion hommes / femmes                       |
| Top activités                 | Barres       | Types d'activité les plus pratiqués              |
| Macros nutritionnels          | Camembert    | Répartition protéines / glucides / lipides        |
| Profil radar                  | Radar        | Vue d'ensemble des indicateurs normalisés         |
| Calories par type de repas    | Barres       | Répartition calorique selon le moment de la journée |

**Bilan global**

En bas du dashboard, un tableau récapitulatif affiche les statistiques agrégées (moyennes, totaux, ratios) calculées sur l'ensemble des profils.

---

### 4.2 Utilisateurs actifs

Cette section liste tous les comptes API enregistrés.

**Recherche** : filtrer par adresse email.

**Actions disponibles**

| Action      | Description                                      |
|-------------|--------------------------------------------------|
| + Nouveau compte | Créer manuellement un compte (email, mdp, rôle) |
| Modifier    | Changer l'email ou le rôle d'un compte           |
| Promouvoir  | Passer un compte `user` en `admin`               |
| Rétrograder | Passer un compte `admin` en `user`               |
| Suppr.      | Supprimer un compte (action irréversible)        |

> Vous ne pouvez pas supprimer ou rétrograder votre propre compte.

---

### 4.3 Aliments

Référentiel en lecture seule des aliments avec leurs valeurs nutritionnelles :
- Aliment, catégorie, calories (kcal), protéines (g), glucides (g), lipides (g)

Fonctionnalités : recherche textuelle, pagination (20 lignes par page).

---

### 4.4 Consommation et Activité

Ces deux sections affichent toutes les entrées de la base pour tous les profils.

**Consommation** — colonnes : ID, Date, Type de repas, Aliment, Quantité (g)

**Activité** — colonnes : ID, Date, Type d'activité, Pas, Cal. brûlées, % actif

Pour chaque section :
- Recherche textuelle sur toutes les colonnes
- Suppression d'une entrée via le bouton **Suppr.** (action irréversible)
- Pagination par 20 lignes

---

### 4.5 Analytiques

La section Analytiques donne accès aux vues SQL précalculées de la base de données.

**Onglets disponibles**

| Onglet               | Contenu                                                  |
|----------------------|----------------------------------------------------------|
| Indicateurs clés     | IMC, nb séances, moy. calories brûlées, total pas       |
| Profils de santé     | Détail complet de chaque profil (âge, genre, poids, etc.) |
| Résumé journalier    | Agrégation des activités par jour                        |
| Bilan calorique      | Calories brûlées vs consommées par profil                |
| Apport nutritionnel  | Totaux macros par profil (protéines, glucides, lipides)  |
| Intensité des séances| Niveau d'intensité moyen et durée des séances            |

Chaque onglet affiche un tableau avec recherche textuelle et pagination.

---

## 5. Gestion des profils santé

Les profils santé contiennent les données importées par le pipeline ETL (âge, genre, poids, IMC, niveau d'expérience). Pour qu'un utilisateur puisse voir ses propres données depuis l'espace utilisateur, son compte doit être **associé** à un profil santé.

### Associer un profil à un compte

1. Aller dans **Espace admin > Profils**
2. Repérer le profil à associer (colonne "Compte associé" affiche "Non lié")
3. Cliquer sur **Attribuer**
4. Dans la fenêtre qui s'ouvre, sélectionner le compte email dans la liste déroulante
5. Cliquer sur **Attribuer**

Un badge vert avec l'email du compte apparaît dans la colonne "Compte associé".

> Les comptes déjà associés à un autre profil sont grisés et non sélectionnables dans la liste.

### Désassocier un profil

1. Trouver le profil lié dans la liste
2. Cliquer sur **Délier**
3. Confirmer l'action dans la fenêtre de confirmation

### Indicateurs de liaison

Dans la barre d'outils de la section Profils :
- Badge bleu **X non lié(s)** — nombre de profils sans compte associé
- Badge vert **X lié(s)** — nombre de profils déjà associés

---

## 6. Questions fréquentes

**Je ne vois aucune donnée dans mon espace utilisateur.**

Votre profil santé n'est pas encore associé à votre compte. Contactez un administrateur pour qu'il effectue l'association depuis l'espace admin > Profils.

**Comment changer mon mot de passe ?**

La modification du mot de passe n'est pas disponible en libre-service. Un administrateur peut modifier votre compte depuis l'espace admin > Utilisateurs actifs > Modifier.

**L'import Docker n'a pas créé le compte admin.**

Le compte admin est créé uniquement au **premier démarrage** du conteneur PostgreSQL. Si la base existe déjà, les scripts d'initialisation ne s'exécutent pas à nouveau. Pour forcer la recréation :

```bash
docker compose down -v   # supprime les volumes (perte des données)
docker compose up --build
```

**Les graphiques du dashboard sont vides.**

Les graphiques utilisent les données présentes en base. Si le pipeline ETL n'a pas encore été exécuté ou si la base est vide, les graphiques s'affichent sans données. Vérifiez que le service `seed` Docker a bien terminé avec succès.

**npm error Missing script: "dev"**

Vous êtes dans le mauvais répertoire. La commande `npm run dev` doit être exécutée depuis `APIMSPR-1/`, pas depuis la racine du projet.

```bash
cd APIMSPR-1
npm run dev
```
