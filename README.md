# TaskFlow — Frontend (Angular)

Interface web de la plateforme **TaskFlow** de gestion de projets et de tâches.
Backend associé : [taskflow-backend](https://github.com/Amenybn/taskflow-backend).

## Fonctionnalités
- **Tableau de bord** : indicateurs, répartition des tâches, priorités, avancement des projets, charge de l'équipe, activité récente
- **Projets** : cartes filtrables, création / modification / suppression, budget, échéances
- **Détail projet** : avancement, période, responsable, Kanban dédié
- **Tâches** : tableau Kanban en glisser-déposer + vue liste, filtres (projet, membre, priorité, recherche)
- **Équipe** : gestion des membres et de leur charge de travail
- **Persistance & Système** : base utilisée, nombre d'enregistrements, historique des démarrages du serveur

## Stack
Angular 17 (standalone components), Angular CDK (drag & drop), Bootstrap Icons, nginx.

## Docker

```bash
docker build -t taskflow-frontend .
docker run -d -p 4200:80 -e BACKEND_URL=http://<hote-backend>:8080 taskflow-frontend
```

nginx sert l'application et relaie les appels `/api/*` vers `BACKEND_URL` (par défaut `http://backend:8080`).

## Développement local

```bash
npm install
npm start   # http://localhost:4200, /api relayé vers http://localhost:8080
```
