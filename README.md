# COFRD Connect

## Déploiement sur Vercel

### Déploiement du Backend

1. Assurez-vous que votre fichier `vercel.json` est correctement configuré dans le dossier backend :
   ```json
   {
       "version": 2,
       "builds": [
         {
           "src": "index.js",
           "use": "@vercel/node"
         }
       ],
       "routes": [
         {
           "src": "/(.*)",
           "dest": "/",
           "methods": ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]
         }
       ]
   }
   ```

2. Connectez-vous à Vercel et importez votre projet backend.
3. Configurez les variables d'environnement nécessaires dans les paramètres du projet sur Vercel.
4. Déployez le backend.

### Déploiement du Frontend

1. Assurez-vous que votre fichier `vercel.json` est correctement configuré dans le dossier frontend :
   ```json
   {
     "rewrites": [
       {
         "source": "/(.*)",
         "destination": "/index.html"
       }
     ],
     "buildCommand": "npm run build",
     "outputDirectory": "build",
     "framework": "create-react-app"
   }
   ```

2. Créez un fichier `.env` à la racine du projet frontend avec la variable suivante :
   ```
   REACT_APP_API_URL=https://votre-backend-url.vercel.app
   ```

3. Connectez-vous à Vercel et importez votre projet frontend.
4. Configurez les variables d'environnement dans les paramètres du projet sur Vercel :
   - `REACT_APP_API_URL` : URL de votre backend déployé

5. Déployez le frontend.

## Résolution des problèmes courants

- Si vous rencontrez des erreurs CORS, vérifiez que votre backend autorise les requêtes depuis l'URL de votre frontend.
- Si les requêtes API échouent, vérifiez que les URL sont correctement configurées dans les fichiers frontend.