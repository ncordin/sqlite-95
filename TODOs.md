Fonctionnalités Manquantes pour une Administration SQLite Complète

5. Export de Données Avancé

- Export SQL (dump avec INSERT statements)
- Export de la structure seule (sans données)
- Dupliquer une table

6. Historique et Logs

- Historique des requêtes SQL exécutées
- Possibilité de ré-exécuter une requête passée
- ** Requêtes favorites / sauvegardées **
- Log d'erreurs

10. Gestion Multi-Bases

- Créer une nouvelle base de données
- Supprimer une base de données
- Upload une base de données
- Backup automatique programmé
- Vacuum de la base (optimisation)

12. Interface SQL Améliorée

- Autocomplétion des noms de tables/colonnes
- Coloration syntaxique SQL
- Exécution de requêtes multiples (séparées par ;)

14. Types de Données Avancés

- Support des BOOLEAN (checkbox dans les formulaires)
- Support des ENUM (dropdown)

```
fetch(req, server) {
    const address = server.requestIP(req);
    if (address) {
      return new Response(`Client IP: ${address.address}, Port: ${address.port}`);
    }
```

`${server.pendingRequests}`

15. Dashboard :

- Pending requests
- Active clients (by IP)
- AVG request duration + P90
- SQL Queries on last minute / hour
- Requests on last minute / hour
- Requests total count from {start_date}:
- List all endpoints : name - count - duration
- Last 100 API calls : name - IP - duration - status
