# AdopteUnAnimal — site public et espace personnel

Le front-end historique est conservé. Le projet ajoute un backend Node.js / Express connecté à Supabase : authentification des membres, catalogue des animaux, archives, photos et documents PDF privés.

## Arborescence

- `frontend/` : site public HTML/CSS/JavaScript et pages de connexion / administration.
- `backend/` : API Express, accès Supabase, scripts et schéma SQL.

## 1. Préparer Supabase

1. Ouvrez votre projet Supabase.
2. Dans **SQL Editor**, exécutez intégralement `backend/supabase/schema.sql`.
3. Dans **Authentication > Users**, créez le premier utilisateur administrateur avec son adresse e-mail et un mot de passe robuste.
4. Copiez l'UUID de cet utilisateur et exécutez cette requête en remplaçant les valeurs :

```sql
insert into public.profiles (id, username, display_name, role)
values ('UUID_AUTH_ICI', 'monusername', 'Administrateur', 'admin');
```

Le username doit être unique, en minuscules, de 3 à 32 caractères (`a-z`, chiffres, `.`, `_`, `-`). Les autres comptes seront créés depuis l'onglet **Comptes membres** de l'administration. Il n'existe volontairement aucune inscription publique.

Les buckets Storage sont créés par le SQL :
- `animal-photos` : photos publiques des animaux.
- `association-documents` : PDF privés, accessibles par URL signée temporaire.

## 2. Configurer et démarrer l'API

Prérequis : Node.js 20 ou supérieur.

```bash
cd backend
npm install
cp .env.example .env
```

Renseignez dans `backend/.env` les valeurs de **Project Settings > API** de Supabase :

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY` (clé publishable / anon)
- `SUPABASE_SERVICE_ROLE_KEY` (clé secrète service_role, uniquement côté serveur)

Ajoutez les origines locales à `FRONTEND_ORIGIN` si votre serveur statique utilise un autre port.

```bash
npm run dev
```

L'API doit répondre à `http://localhost:3000/api/health`.

## 3. Démarrer le site

Servez le dossier `frontend/` avec Live Server (VS Code) ou un serveur statique local. N'ouvrez pas simplement `index.html` en `file://`.

Dans `frontend/js/config.js`, l'URL locale est déjà réglée sur :

```js
window.APP_CONFIG = { API_BASE_URL: 'http://localhost:3000' };
```

Quand l'API est déployée, remplacez cette URL par son URL HTTPS publique (par exemple l'URL fournie par Render), puis publiez à nouveau le front-end GitHub Pages.

## 4. Importer les animaux de démonstration existants

Les 25 fiches d'exemple présentes dans l'ancien `data.js` ont été exportées dans `backend/data/demo-animals.json`. Après avoir configuré `.env` et exécuté le SQL, vous pouvez les importer une seule fois :

```bash
cd backend
npm run import:demo
```

Le script ignore les fiches portant déjà le même nom et la même espèce. **Ces animaux sont des données fictives de démonstration** : vérifiez, modifiez ou supprimez ces annonces avant d'ouvrir le site au public.

Lorsque l'API répond, le catalogue public récupère les annonces `available` depuis Supabase. Le fichier `data.js` reste présent comme secours pour le développement local tant que l'API n'est pas configurée ou joignable ; une fois la connexion vérifiée, les fiches Supabase deviennent la source affichée.

## 5. Fonctionnalités livrées

- Bouton **Accès personnel** dans la navigation du site public.
- Connexion username + mot de passe (le backend associe le username à l'e-mail Supabase Auth sans exposer cette correspondance au navigateur).
- Tableau de bord des membres : créer, modifier, archiver, restaurer et supprimer les annonces.
- Téléversement de photos (JPEG, PNG, WebP, 8 Mo maximum par fichier).
- Dépôt de PDF privés (15 Mo maximum) et téléchargement par lien signé de 60 secondes.
- Comptes membres créés uniquement par un administrateur.
- Les membres ont les mêmes droits sur les annonces ; seul le rôle `admin` peut créer / consulter les comptes.

## 6. Déploiement et sécurité

- Le front-end peut rester sur GitHub Pages.
- Déployez `backend/` sur un hébergeur Node.js (Render, Railway ou équivalent), avec `npm install` et `npm start`.
- Configurez les variables d'environnement sur l'hébergeur. `FRONTEND_ORIGIN` doit inclure exactement l'origine GitHub Pages, par exemple `https://valentineldre.github.io` (pas le chemin `/AdopteUnAnimal`).
- **Ne commitez jamais `backend/.env` et ne placez jamais la clé `service_role` dans `frontend/`.**
- La clé `service_role` contourne les règles RLS : l'API vérifie donc chaque jeton Supabase et les droits avant les opérations privées. Gardez cette clé strictement secrète.
- Activez HTTPS en production. Utilisez des mots de passe uniques et longs. Les sessions du prototype sont conservées dans `sessionStorage` et l'utilisateur devra se reconnecter lorsqu'elles expirent.
- Les informations de santé de l’animal sont incluses dans sa fiche publique pour informer les futurs adoptants. N’y inscrivez que les éléments que l’association souhaite communiquer publiquement ; les notes internes vétérinaires doivent être conservées dans une table privée distincte.

## Routes API principales

- `POST /api/auth/login` — connexion username / mot de passe.
- `GET /api/auth/me` — profil de la session.
- `POST /api/auth/members` — création de compte (admin uniquement).
- `GET /api/animals` — annonces disponibles.
- `GET /api/animals/archive` — archives (membre connecté).
- `POST /api/animals` — création d'une annonce.
- `PATCH /api/animals/:id` — modification.
- `PATCH /api/animals/:id/archive` — archivage.
- `PATCH /api/animals/:id/restore` — remise en ligne.
- `DELETE /api/animals/:id` — suppression définitive.
- `POST /api/animals/:id/photos` — ajout de photos.
- `POST /api/documents` / `GET /api/documents` — gestion des PDF (membre connecté).
