// Internal read path: sync snapshots and row batches need DTOs, not editable proxies.
module.exports = Symbol('syncSnapshotRead');
