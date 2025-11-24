# SQLite 95 / ORM

SQLite ORM with a web admin.

# TODOS

- Table declaration: need UNIQUE and INDEX
- table logs / errors ?
- SQL: group, having.
- Table.lastQuery for debug.
- handle enum / bool / date in the admin form.
- make server start command runnable from any directory.
- write a complete Getting started guide https://khalilstemmler.com/blogs/typescript/node-starter-project/
- set port / suffix / database name from the admin (editor of .env)
- start the front server from the admin (with dev mode)
- hide Bun error 500 page on production
- add more Response types: redirection, image, etc...
- /admin should redirect to /admin/ automatically

* dynamique controllers routing

# Bugs

- encode crash if value is wrong (eg: null instead of null) (happens when differences DB vs declaration)
- if a table has a primary key auto-increment, it will be an alias of rowid and break the edit in admin

# How to publish new version

- bun test
- cd admin-webapp && bun install && bun run build
- cd root of project
- npm version patch|minor|major
- npm publish --dry-run
- npm publish

# How to run on production

- Create .env file `TEMPLATE`
- Use Bun >= 1.0.0 (not compatible with Node)
- pm2 start src/index.jsm
- Add Nginx proxy for HTTPS

- Or, if really needed, use args:
  PORT=3300 BASE_PATH=/sqlite-admin pm2 start --node-args "--es-module-specifier-resolution=node" server/index.js --name sqlite-admin

# Troubleshooting

`Cannot GET /admin/`, Can not access admin interface:

- Check for empty PREFIX, can cause bad URL like http://localhost//admin/
- The node command MUST be run from the server project directory
- Check node_module/sqlite-95/admin-webapp/public exists

# Etc...

- works offline
- does not handle bigint
- write doc about dates UTC and server scripts
- desktop ideas: see endpoints logs / visitors / web server / env variables
- SELECT name, SUM("pgsize") FROM "dbstat" GROUP BY name;
