# Epistudy

Application Node.js autonome pour générer des plans d'apprentissage, proposer des exercices et coacher une session d'étude.

## Développement local

```bash
npm install
npm run dev
```

L'application écoute par défaut sur `http://localhost:3000`.

## Déploiement Scalingo

Le projet est prêt pour Scalingo :

- `package.json` déclare le script `start` utilisé en production.
- `Procfile` démarre le processus web avec `npm start`.
- le serveur lit le port fourni par Scalingo via la variable `PORT`.

### Déployer avec l'API Scalingo

Ne commitez jamais le token Scalingo. Exportez-le uniquement dans votre terminal :

```bash
export SCALINGO_TOKEN="tk-..."
export SCALINGO_APP="epistudy-aivira"
export SCALINGO_API_URL="api.osc-fr1.scalingo.com"
./scripts/deploy-scalingo.sh
```

Le script crée l'application si elle n'existe pas, empaquette les sources dans une archive temporaire, l'upload sur Scalingo puis déclenche un déploiement par archive. Le nom `epistudy` étant déjà pris sur Scalingo, utilisez un nom unique comme `epistudy-aivira`.
