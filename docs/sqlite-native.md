# Optional Capacitor SQLite

Local experimental adapter, based on beta-16. Not published or device-verified.
The `sqliteOPFS` implementation is unchanged. The existing `sqlite` connector
accepts `capacitor:<name>` and a `capacitorSQLite` plugin option:

```js
import { CapacitorSQLite } from '@capacitor-community/sqlite';
const db = map({ db: con => con.sqlite('capacitor:my-app.sqlite3', {
  capacitorSQLite: CapacitorSQLite,
  sync: { url: '/rdb', auto: false }
}) });
```

Requires the native iOS/Android plugin. No web fallback, JavaScript SQL worker, encryption or OPFS migration.
Sync uses an Orange-owned worker by default; `sync.worker=false` is an explicit
inline opt-out for testing or environments without browser Workers. Names cannot contain paths or
end in `.db` (the plugin strips that suffix). The application must gate native
availability. Calls retain the normal query/transaction/sync interface. JavaScript
SQLite user-defined functions are not supported by this native plugin.

Each connection has an exclusive queue held through the entire transaction.
WAL is enabled and verified on open; synchronous=FULL and foreign_keys=ON are
set on every open. Reads currently share that queue; WAL is not a promise of
parallel queries or a measured speed improvement. Close drains accepted work.

A restarted WebView can leave native plugin connections behind after losing its
JavaScript pool registry. If creation reports the exact `CreateConnection:
Connection <name> already exists` error, the pool closes only that named native
connection and retries creation once. Closing rolls back abandoned transactions;
committed rows and the sync outbox remain on disk. Other create failures and
cleanup/retry failures propagate. This is not a database reset or a global plugin
consistency sweep. The same-host registry rejects a second live owner before any
native call, including unopened pools. Applications must give Orange exclusive
ownership of these names in one WebView; concurrently using the same native
database from another WebView/plugin wrapper is unsupported. This recovery does
not repair an existing rejected router initialization without closing/reopening
the client, or establish a fix for WebKit Web Lock leaks or SQLITE_IOERR.

The existing dual-sync router is reused with independent native
files for active, staging and manifest/delta roles. Its lock identities include
the capacitor: prefix. Native does not opt into OPFS background suspension.

Cloning reserves/closes the target, attaches it through SQLite and replaces its
schema and data in one transaction, writing only the target. INSERT SELECT
includes committed WAL content without moving tables through the JSON bridge.
Generated columns are recomputed; explicit indices, triggers, views, blobs and
autoincrement sequence values are retained. Foreign-key enforcement is restored
and failed copies roll back before detaching. Virtual tables are rejected.
This does not copy files or use the plugin's unrelated JSON synchronization API.

Validation uses the real SQLite engine on disk with a simulated plugin contract,
including iOS metadata rows and unordered row keys, plus the unchanged OPFS tests.
The native adapter rebuilds every iOS result row in `ios_columns` order before
Orange decodes it; dropping metadata alone can feed numeric fields to UUID decoders.
This applies to SELECT and RETURNING results. Native command results also retain
affected-row counts across the worker bridge for optimistic concurrency checks.
Native plugin SQLCipher
behavior, app suspension and physical-device timing still need device validation.

## Deleting closed native storage

After awaiting `db.close()` on every client for the logical database:

```js
await orange.deleteSqliteNative('capacitor:my-app.sqlite3', {
  capacitorSQLite: CapacitorSQLite,
  sync: true
});
```

This public export is available in both browser and Node entry points. Orange
owns the role layout; `sync: true` deletes active/staging/delta storage, while
omitting it deletes only the named database. No physical filenames are exposed
to the application. All names and same-runtime pool ownership are checked before
deletion; even a lazy, unopened pool must be closed. The plugin owns native paths
and sidecar cleanup. Failures propagate, connections are released and a partial
deletion can be retried. Other runtimes must also be closed by the caller.

## Native sync worker

Network transport, JSON processing and sync apply logic run in Orange's managed
worker by default. The application supplies only the native plugin and normal
sync settings; it does not create workers or handle worker URLs/ports. Internally,
the worker leases the WebView-owned native pools over MessagePorts. Each lease
reserves the connection for its entire transaction; GUI operations use that same
queue. Replica publication retains the existing read/write barriers and deferred
publication when new local writes arrive. SQL continues on the native plugin.

Normal close cancels/drains sync before shutting down the worker. Worker errors
reject pending sync calls, stop the worker and drain outstanding native calls
before rolling back abandoned transactions and releasing leases. A failed worker
is not silently replaced; close/reopen permits normal persisted-state recovery.
The worker never receives a Capacitor proxy, OPFS handle or native file handle.

This moves JavaScript sync work off the UI thread; bridge message serialization,
user interceptors and UI updates still run in the WebView. It is not an OS service
and does not guarantee syncing while iOS/Android suspends the app. WAL remains
independent of worker selection and is not a guarantee against SQLITE_IOERR.
