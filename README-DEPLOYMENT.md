# Guide de Déploiement - Djulah Backend

## Déploiement sur Render.com

### Prérequis

- Compte Render.com
- Base de données MongoDB (Atlas ou autre)
- Compte Resend (pour les emails)

### Étapes de déploiement

#### 1. Préparation du dépôt

```bash
# Assurez-vous que tous les changements sont commités
git add .
git commit -m "Préparation déploiement Render"
git push origin main
```

#### 2. Configuration sur Render

1. Connectez-vous à [Render.com](https://render.com)
2. Cliquez sur "New +" → "Web Service"
3. Connectez votre dépôt GitHub
4. Configurez le service :
   - **Name**: `djulah-backend`
   - **Environment**: `Node`
   - **Plan**: `Free` ou `Starter`
   - **Build Command**: `cd backend && npm install`
   - **Start Command**: `cd backend && npm start`
   - **Root Directory**: `backend`

#### 3. Variables d'environnement

Configurez ces variables dans la section "Environment" :

**Obligatoires :**

- `NODE_ENV`: `production`
- `PORT`: `5000`
- `MONGODB_URI`: Votre chaîne de connexion MongoDB
- `JWT_SECRET`: Clé secrète pour JWT (générez une clé forte)
- `CLIENT_URL`: URL de votre frontend (ex: `https://djulah-frontend.onrender.com`)

**Email (Recommandé) :**

- `RESEND_API_KEY`: Votre clé API Resend
- `EMAIL_FROM`: `onboarding@resend.dev`

**SMTP Gmail :**

- `SMTP_USER`: `cesaristos85@gmail.com`
- `SMTP_PASS`: `ybfm tkhc pyaa bmuy`

**Optionnelles :**

- `CLOUDINARY_CLOUD_NAME`: Pour les uploads d'images
- `CLOUDINARY_API_KEY`: Clé API Cloudinary
- `CLOUDINARY_API_SECRET`: Secret API Cloudinary

#### 4. Configuration du Health Check

- **Health Check Path**: `/health`
- **Auto-Deploy**: Coché pour déploiement automatique

#### 5. Déploiement initial

Cliquez sur "Create Web Service" pour lancer le déploiement.

### Post-déploiement

#### 1. Exécuter les migrations

Une fois le service déployé, vous devez exécuter les migrations :

```bash
# Via Render Shell ou en local avec l'URL de production
cd backend
node scripts/migrate-simple.js migrate
```

#### 2. Vérifier le déploiement

- Health check: `https://djulah-backend.onrender.com/health`
- API docs: `https://djulah-backend.onrender.com/api-docs`
- Racine: `https://djulah-backend.onrender.com/`

### Déploiement avec Docker

#### 1. Build de l'image

```bash
cd backend
docker build -t djulah-backend .
```

#### 2. Run avec Docker

```bash
docker run -d \
  --name djulah-backend \
  -p 5000:5000 \
  -e NODE_ENV=production \
  -e MONGODB_URI=votre_mongodb_uri \
  -e JWT_SECRET=votre_jwt_secret \
  djulah-backend
```

### Variables d'environnement - Référence

| Variable                | Description       | Requis     | Exemple                 |
| ----------------------- | ----------------- | ---------- | ----------------------- |
| `NODE_ENV`              | Environnement     | Oui        | `production`            |
| `PORT`                  | Port d'écoute     | Oui        | `5000`                  |
| `MONGODB_URI`           | Chaîne MongoDB    | Oui        | `mongodb+srv://...`     |
| `JWT_SECRET`            | Clé JWT           | Oui        | `votre-clé-secrète`     |
| `JWT_EXPIRES_IN`        | Expiration JWT    | Non        | `7d`                    |
| `CLIENT_URL`            | URL frontend      | Oui        | `https://votre-app.com` |
| `RESEND_API_KEY`        | Clé Resend        | Recommandé | `re_...`                |
| `EMAIL_FROM`            | Email expéditeur  | Non        | `onboarding@resend.dev` |
| `CLOUDINARY_CLOUD_NAME` | Nom Cloudinary    | Optionnel  | `votre-cloud`           |
| `CLOUDINARY_API_KEY`    | Clé Cloudinary    | Optionnel  | `votre-clé`             |
| `CLOUDINARY_API_SECRET` | Secret Cloudinary | Optionnel  | `votre-secret`          |

### Dépannage

#### Problèmes courants

1. **MongoDB connection timeout**: Vérifiez votre `MONGODB_URI`
2. **CORS errors**: Assurez-vous que `CLIENT_URL` est correct
3. **Build failed**: Vérifiez que `package.json` est correct
4. **Health check failing**: Vérifiez que le port est correct

#### Logs

- Consultez les logs sur Render Dashboard
- En local: `docker logs djulah-backend`

### Sécurité

- Changez le mot de passe du super admin après le premier déploiement
- Utilisez des variables d'environnement fortes
- Activez HTTPS (automatique sur Render)
- Configurez les CORS origins correctement

### Monitoring

- Health check disponible sur `/health`
- Logs en temps réel sur Render
- Métriques disponibles dans le dashboard Render
