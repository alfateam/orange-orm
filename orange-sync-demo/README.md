codex resume 019e8d9b-1d7b-7a43-b7cc-b5167908b4a0
# Orange Sync Demo

Demo for two-way sync with Orange ORM.

The demo intentionally syncs ORM/patch writes only. Raw SQL is used for database setup, not for user writes.

## Run

```bash
npm install
npm run db:up
npm run dev
```

Root `npm install` installs both `client` and `server`. You can also install them separately:

```bash
npm run pack:orange-orm
cd client && npm install
cd ../server && npm install
```

The demo generates `vendor/orange-orm-5.2.0.tgz` from the local Orange ORM repo. The tarball is ignored by git; regenerate it with `npm run pack:orange-orm` after local Orange ORM changes.

Backend: http://localhost:3055

Frontend: http://localhost:5173

## Model

Relations included:

- `team.people`: `hasMany`
- `person.team`: `references`
- `project.owner`: `references`
- `project.detail`: `hasOne`
- `project.tasks`: `hasMany`
- `task.project`: `references`
- `task.assignee`: `references`

The browser client uses `sqliteOPFS` for local SQLite storage. Sync push/pull uses `/rdb?sync=push` and `/rdb?sync=pull`.
