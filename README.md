# Écosse 2027 · application de suivi du voyage

Application web (installable sur iPhone et Android) pour préparer et vivre le voyage du 12 au 16 mai 2027 :

- **Aujourd’hui** : le récapitulatif des actions et des activités du jour, avec une case à cocher ; ce qui est fait est grisé.
- **Programme** : les 5 journées, chaque fiche s’ouvre au toucher pour voir le détail (adresse, téléphone, itinéraire, liens).
- **Préparatifs** : la liste des réservations et démarches, avec statut, échéance et alertes (J-30, J-7, J-3, J-1, jour J).
- **Messages** : les voyageurs écrivent aux organisateurs avec un degré d’urgence :
  - **3 · Info** : une seule notification ;
  - **2 · Important** : une notification toutes les heures tant qu’aucun organisateur ne l’a prise en charge ;
  - **1 · Urgent** : une notification toutes les 2 minutes tant qu’aucun organisateur ne l’a prise en charge.
- **Trois profils** : super admin (gère les participants), admin (voit les tarifs et les réservations, reçoit les alertes), invité (ne voit ni tarifs, ni numéros de réservation, ni tâches cachées).

Chacun se connecte avec un **code personnel à 6 chiffres** donné par le super admin.

Technique : Next.js 15 (hébergé sur Vercel), Supabase (base de données), notifications Web Push, et un service gratuit d’exécution planifiée (cron-job.org) pour les relances.

---

## Mise en ligne (environ 30 minutes, une seule fois)

### 1. Supabase (la base de données)

1. Crée un compte sur [supabase.com](https://supabase.com), puis un projet (**New project**), région *West EU (Paris)* ou *Central EU (Frankfurt)*.
2. Dans le projet : **SQL Editor › New query**, colle le contenu de `supabase/schema.sql`, puis **Run**.
3. Nouvelle requête : colle le contenu de `supabase/seed.sql` (programme + préparatifs), puis **Run**. Ne la lance qu’une fois.
4. **Project Settings › API** (ou **API Keys**) : note l’**URL du projet** et la clé **service_role** (ou *secret key*). Cette clé ne doit jamais être partagée ni publiée.

### 2. Les secrets

Le fichier `secrets-a-copier.txt` fourni à part contient les valeurs à coller dans Vercel. Pour en générer de nouvelles : `npm install` puis `npm run secrets`.

### 3. Vercel (l’hébergement)

1. Sur [vercel.com](https://vercel.com) : **Add New › Project**, importe le dépôt GitHub.
2. Avant de déployer, dans **Environment Variables**, ajoute :

| Nom | Valeur |
| --- | --- |
| `SUPABASE_URL` | URL du projet Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | clé service_role / secret key |
| `AUTH_SECRET` | depuis secrets-a-copier.txt |
| `CRON_SECRET` | depuis secrets-a-copier.txt |
| `SETUP_KEY` | depuis secrets-a-copier.txt |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | depuis secrets-a-copier.txt |
| `VAPID_PRIVATE_KEY` | depuis secrets-a-copier.txt |
| `VAPID_SUBJECT` | `mailto:` suivi de ton adresse e-mail |
| `BUG_API_KEY` | optionnel : accès de Claude aux signalements |
| `ANTHROPIC_API_KEY` | optionnel, payant : diagnostic automatique des signalements |

3. **Deploy**. Note l’adresse obtenue, par exemple `https://ecosse-2027.vercel.app`.

> Si tu modifies une variable plus tard, relance un déploiement (**Deployments › … › Redeploy**) pour qu’elle soit prise en compte.

### 4. Créer ton compte super admin

Ouvre `https://<ton-app>.vercel.app/setup`, saisis la `SETUP_KEY` et ton prénom : l’app t’affiche ton code personnel. Note-le. Cette page se désactive ensuite toute seule.

### 5. Ajouter les participants

**Réglages › Gérer les participants** : ajoute chaque personne avec son profil. Un code à 6 chiffres s’affiche une seule fois : transmets-le à la personne. « Nouveau code » en génère un autre si besoin.

### 6. Les relances automatiques (cron-job.org)

Vercel gratuit ne lance une tâche planifiée qu’une fois par jour, ce qui suffit pour les alertes d’échéance mais pas pour les relances toutes les 2 minutes. On utilise donc [cron-job.org](https://cron-job.org) (gratuit) :

1. Crée un compte, puis **Create cronjob**.
2. URL : `https://<ton-app>.vercel.app/api/cron`
3. Exécution : **toutes les minutes**.
4. Onglet **Advanced › Headers** : ajoute `Authorization` avec la valeur `Bearer ` suivie du `CRON_SECRET` (un espace après *Bearer*).
5. Enregistre, puis **Test run** : la réponse doit contenir `"ok":true`.

Ce même appel envoie les alertes d’échéance (à 9 h, heure de Paris) et garde la base Supabase active (un projet gratuit inactif une semaine est mis en pause).

### 7. Installer l’app et activer les notifications

**iPhone** (iOS 16.4 ou plus récent) :

1. Ouvre l’adresse de l’app dans **Safari**.
2. Bouton **Partager › Sur l’écran d’accueil**.
3. Ouvre l’app depuis l’icône, connecte-toi, puis **Réglages › Activer les notifications** et accepte.

**Android** : ouvre l’adresse dans Chrome, menu **› Installer l’application** (ou Ajouter à l’écran d’accueil), puis **Réglages › Activer les notifications**.

Les organisateurs (admins et super admin) doivent activer les notifications sur leur téléphone pour recevoir les demandes et les alertes. Le bouton **Envoyer un test** vérifie que tout fonctionne.

---

## Au quotidien

- **Cocher** une activité ou une tâche la marque comme faite (elle est grisée) ; décocher annule.
- Les admins modifient une fiche avec **Modifier la fiche** : horaires, adresse, tarifs, n° de réservation, note privée, visibilité pour les invités et alertes d’échéance.
- **Aujourd’hui › Voir le récapitulatif d’un autre jour** permet de prévisualiser une journée du voyage.
- Une demande est **prise en charge** dès qu’un organisateur touche « Je m’en occupe » ou répond : les relances s’arrêtent.

## Signalements de bugs

Le bouton 🐞 en haut de chaque écran (et sur l’écran d’erreur) ouvre « Signaler un problème » : la personne décrit le souci et l’app joint une **capture de l’écran prise au moment du clic**, l’écran concerné, l’appareil, les erreurs techniques et les dernières actions. Rien de confidentiel n’est joint (ni tarifs, ni codes).

- Chaque signalement reçoit un numéro (« Signalement n°12 ») et les organisateurs reçoivent une notification.
- **Suivi** : **Réglages › Tous les signalements**. Les organisateurs changent le statut (Nouveau, En cours, Résolu, Sans suite), écrivent une note de suivi et échangent avec la personne, qui est notifiée. Une précision de sa part remet le signalement en « Nouveau ».
- **Exports** : CSV (tableur) ou JSON avec les captures, à donner à Claude.
- Limite anti-abus : 30 signalements en attente par personne et par 24 h.

**Base de données** : sur un projet déjà installé, exécute une fois `supabase/bugs.sql` dans **SQL Editor** (il est déjà inclus dans `schema.sql` pour une nouvelle installation).

**Suivi avec Claude (optionnel)** : ajoute dans Vercel la variable `BUG_API_KEY` (une longue chaîne aléatoire de 32 caractères minimum, générée par `npm run secrets`), puis redéploie. Claude peut alors lister les signalements, lire les captures et mettre à jour statut et note. L’accès se coupe depuis l’écran Signalements.

```bash
export APP_URL=https://travelecosse2027.vercel.app BUG_API_KEY=...
node outils/bugs.mjs            # à traiter
node outils/bugs.mjs 12         # détail + capture bug-12.jpg
node outils/bugs.mjs 12 done "Corrigé dans la version 1.1.1"
```

**Diagnostic automatique (optionnel, payant)** : avec la variable `ANTHROPIC_API_KEY` (clé de l’API Anthropic, facturée à l’usage, environ un centime par signalement), chaque signalement reçoit un premier diagnostic de Claude (résumé, cause probable, gravité, piste de correction), visible des organisateurs. Sans cette clé, tout le reste fonctionne.

## Développement local

```bash
npm install
cp .env.example .env.local   # puis remplir les valeurs
npm run dev
```

## Sécurité

- Toutes les lectures et écritures passent par le serveur avec la clé service_role ; la base refuse tout accès direct depuis le navigateur (RLS activé, aucune politique publique).
- Les codes personnels sont stockés sous forme d’empreinte (HMAC) ; 10 essais ratés en 15 minutes bloquent la connexion depuis cette adresse.
- Les tarifs, numéros de réservation et notes privées ne sont jamais envoyés aux invités.
