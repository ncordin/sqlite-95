# Notes (personnel)

Fichier de travail perso — pas publié sur npm, pas affiché sur la page GitHub du repo.

## TODOs

- table logs / errors ?
- SQL: group, having.
- handle enum / bool / date in the admin form.
- make server start command runnable from any directory.
- write a complete Getting started guide https://khalilstemmler.com/blogs/typescript/node-starter-project/
- set port / suffix / database name from the admin (editor of .env)
- start the front server from the admin (with dev mode)
- hide Bun error 500 page on production
- add more Response types: redirection, image, etc...
- /admin should redirect to /admin/ automatically
- write doc about dates UTC and server scripts
- desktop ideas: see endpoints logs / visitors / web server / env variables

## Bugs

- if a table has an INTEGER primary key, it will be an alias of rowid and break the edit in admin

## How to publish a new version

```
bun test
cd admin-webapp && bun install && bun run build
cd ..
npm version patch|minor|major
npm publish --dry-run
npm publish
```

## Random / ideas

- works offline
- does not handle bigint
- `SELECT name, SUM("pgsize") FROM "dbstat" GROUP BY name;`

## Troubleshooting

**`Cannot GET /admin/` — can't access the admin interface:**

- Check for an empty `PREFIX` — it can produce a bad URL like `http://localhost//admin/`.
- The server must be started from the project directory.
- Verify that `node_modules/sqlite-95/admin-webapp/public` exists.
