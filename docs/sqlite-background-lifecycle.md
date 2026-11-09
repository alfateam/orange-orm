# Optional OPFS background suspension

Introduced in `5.6.0-beta-16`; disabled by default. Physical iOS suspension and
recovery from the reported intermittent phone hang have not been verified.

`sqliteOPFS` keeps its existing behavior unless this option is enabled:

```js
const db = map.sqliteOPFS('app.sqlite3', {
  vfs: 'opfs-sahpool',
  lifecycle: { suspendWhenHidden: true },
  sync: { url: '/rdb', worker: true }
});
```

With the option enabled, Orange observes `document.visibilityState`. New sync
cycles are skipped while hidden (`{ skipped: 'background' }`). A cycle already
running finishes normally. Automatic sync remains configured and gets an
opportunity to run when visible again, respecting its normal scheduling policy;
an explicitly stopped sync client stays stopped.

Each SQL worker waits for its operations, checkouts, transactions and active sync
holds to finish, then closes SQLite and calls SAH-pool `pauseVfs()` to release
file handles. It keeps the worker and database files. The next local operation
unpauses the VFS and reopens the same database. Pending offline writes, sync
checkpoints and the query/transaction API are retained. Late local writes are
allowed even while hidden; after they finish, the pool can suspend again.
The first query after suspension therefore includes reopening work. There is no
idle timer while the app is visible.

Hosts can provide native visibility without making Orange depend on a native SDK:

```js
lifecycle: {
  suspendWhenHidden: true,
  visibility: {
    isVisible: () => hostIsVisible,
    subscribe: listener => {
      // Call listener(true/false) on host transitions. Return an unsubscribe.
      return subscribeToHostVisibility(listener);
    }
  }
}
```

The host observes visibility once and forwards state to the managed sync worker.
Standalone workers without a DOM need a host visibility source. All clients
sharing a SQL worker must use the same lifecycle owner; do not attach conflicting
visibility sources to that worker. `end()` removes the subscription.

Set `suspendWhenHidden: false`, or omit `lifecycle`, to retain the previous
connection/sync behavior. The opt-in currently requires `vfs: 'opfs-sahpool'`.
Like any connection close, it discards connection-local state such as temporary
tables and manually set connection PRAGMAs; persistent tables and configured
open options survive. Orange preserves the foreign-key enforcement setting
across its background close because synchronization changes that setting. Applications relying on connection-local state should
leave this option off.

This is best-effort prevention, not a repair for stuck locks. The OS can freeze
the app before cleanup finishes, particularly during a transaction or network
request. Existing interruption recovery still applies. Background suspension does not steal
Web Locks, terminate workers, retry SQL automatically, or reset local data.
A failed background close is reported by the worker and surfaces on subsequent
SQL operations instead of reopening over uncertain file ownership.

## Managed worker health and shutdown

Managed sync also has foreground transport checks, independently of
`lifecycle.suspendWhenHidden`. Startup, foreground return and 15-second intervals
probe the sync worker and all its SQL MessagePorts; the response deadline is
30 foreground seconds. Hidden time and large scheduler suspension gaps do not
count as an unresponsive worker. Probes do not open databases, acquire checkouts,
or interrupt transactions, and a responsive worker is retained.

On `ORANGE_WORKER_UNRESPONSIVE`, pending sync calls reject, the sync worker is
terminated, and its owned SQL pools/workers are closed, including outstanding
GUI SQL requests. Closing sync itself has a 10-second foreground grace period;
it no longer waits indefinitely for a close reply. Database/router cleanup is
attempted even if sync close fails. Committed files remain available for explicit
close/reopen, which can reconcile persisted sync state. There is no automatic
replacement worker, write replay, file deletion or lock stealing.

Configure `sync.worker.healthCheck` (`false` or `{ intervalMs, timeoutMs }`),
`closeTimeoutMs`, and `visibility` to override these defaults. Visibility falls
back to `lifecycle.visibility`, then document visibility. `worker-health` events
report request IDs and checking/responsive/unresponsive phases. A successful
probe proves transport liveness, not SQL completion or storage integrity.
Native SQLite uses the same probes but drains native SQL before releasing leases.
WebKit may still retain orphaned resources after worker termination; reopening
must surface that failure rather than treating termination as proof of unlock.
