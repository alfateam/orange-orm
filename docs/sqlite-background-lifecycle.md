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
request. Existing interruption recovery still applies. Orange does not steal
Web Locks, terminate busy workers, retry SQL automatically, or reset local data.
A failed background close is reported by the worker and surfaces on subsequent
SQL operations instead of reopening over uncertain file ownership.
