import rdb from 'orange-orm';
import { createDemoMap, syncTables } from '../../shared/schema.js';

const syncUrl = import.meta.env.VITE_SYNC_URL || 'http://localhost:3055/rdb';
const map = createDemoMap(rdb);

export const db = map({
  db: (con) => con.sqliteOPFS('orange-sync-demo.sqlite3', {
    busyTimeoutMs: 5000,
    sync: {
      url: syncUrl,
      tables: syncTables,
      auto: {
        intervalMs: 15000,
        push: true,
        pull: true
      }
    }
  })
});

export async function initLocalSchema() {
  await runStatements(localSchemaSql);
}

async function runStatements(sql) {
  for (const statement of sql.split(';')) {
    if (statement.trim())
      await db.query(statement);
  }
}

const localSchemaSql = `
create table if not exists team (
  id integer primary key,
  name text not null
);

create table if not exists person (
  id integer primary key,
  teamId integer not null references team(id),
  name text not null,
  email text
);

create table if not exists project (
  id integer primary key,
  ownerId integer not null references person(id),
  title text not null,
  status text not null,
  updatedAt text
);

create table if not exists project_detail (
  id integer primary key,
  projectId integer not null unique references project(id) on delete cascade,
  summary text,
  riskLevel text
);

create table if not exists task (
  id integer primary key,
  projectId integer not null references project(id) on delete cascade,
  assigneeId integer references person(id),
  title text not null,
  done integer default 0,
  sortOrder integer
);
`;
