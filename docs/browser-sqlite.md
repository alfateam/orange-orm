# SQLite OPFS and managed sync in browser bundles

Orange creates its SQLite and managed sync workers automatically:

```ts
const db = map({
  db: con => con.sqliteOPFS('app.sqlite3', {
    vfs: 'opfs-sahpool',
    sync: {
      url: syncUrl,
      auto: { enabled: false, intervalMs: 5000 }
    }
  })
});
```

Applications can remove plugins that copy Orange/SQLite runtime files, replacements of
Orange's bundled source, `sqliteModuleUrl`, and `sync.worker` URL/factory overrides
used solely to work around asset delivery. Keep the application's sync endpoint,
table mapping, and deployment base path.

## Vite 7

Keep Orange out of Vite's development dependency prebundling:

```js
import { defineConfig } from 'vite';

export default defineConfig({
  optimizeDeps: {
    exclude: ['orange-orm']
  }
});
```

Vite's dependency optimizer uses esbuild before its worker/asset transforms. Moving
Orange into `node_modules/.vite/deps` changes the base of its relative worker URLs.
The exclusion leaves those modules available to Vite's normal transforms. Orange
bundles its own CommonJS implementation dependencies, so consumers do not need optimizer entries
for Orange's internal CommonJS dependencies. This exception applies to development;
production still bundles the workers and SQLite through Vite. The packed-package
test also verified that SQLite did not need its own exclusion when imported only
inside Orange's worker. If the application imports SQLite elsewhere, consult
SQLite's separate Vite configuration guidance.

See [Vite worker syntax](https://v7.vite.dev/guide/features#web-workers) and
[SQLite's Vite guidance](https://github.com/sqlite/sqlite-wasm#usage-with-vite).
No Vite plugin, asset-copy step, or source rewriting is needed.

## Webpack 5

Webpack recognizes the published `new Worker(new URL(..., import.meta.url), ...)`
references and the SQLite package's resource URLs. No Orange-specific loaders,
copy plugins, or dependency exclusions are needed. Use the application's normal
`output.publicPath` for deployments under a subdirectory, for example `/nested/app/`.
See [Webpack workers](https://webpack.js.org/guides/web-workers/).

## Browser and server requirements

OPFS requires a secure context (HTTPS or localhost) and browser support for its
worker APIs. The test harness serves these headers to exercise SQLite's optional
shared-memory OPFS proxy as well:

```text
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
```

The `opfs-sahpool` VFS itself does not require shared memory. Cross-origin isolation
is a browser/SQLite concern, separate from emitting worker and WASM assets. Apply
any required headers on the deployment server as well as the development server.

Importing Orange, including its browser entry, is safe during SSR: worker creation
is deferred until a browser database is used. Create/use the OPFS database on the
client. No Svelte, Vue, or React worker implementation is needed; compatibility is
verified per bundler, not for every framework integration or SSR configuration.

## Explicit overrides

`worker`, `createWorker`, `workerUrl`, and `sqliteModuleUrl` remain available for
SQLite; `sync.worker.url` and `sync.worker.createWorker` remain available for managed
sync. Their TypeScript declarations accept `Worker` and shared `MessagePort` objects
where appropriate. Runtime URL overrides and their dependencies must be hosted by
the application; bundlers cannot discover arbitrary URLs provided at runtime.
The default worker uses a static SQLite import. An explicit `sqliteModuleUrl` uses
a separate module worker with a runtime import, without generating Blob source.

Managed sync still receives ports to the existing SQLite workers for the main,
replica, and delta databases. It does not independently open those OPFS files.
Checkout priorities, operation serialization, timing responses, and cloning remain
in the shared SQLite worker protocol implementation.

## Packaging and regression checks

`src/indexBrowser.mjs` and the entries under `src/browser/` form a small ESM boundary.
The ORM implementation remains CommonJS. Rollup converts/bundles that implementation,
emits the three worker entries next to `dist/index.browser.mjs`, and preserves direct
worker constructor references. `src/merge-browser.js` only prepends the existing
`self` shim; it does not relocate modules or rewrite resource references.

The published SQLite worker retains `import ... from '@sqlite.org/sqlite-wasm'`.
Orange does not bundle or copy SQLite's module, WASM, or proxy. In SQLite
`3.53.0-build1`, the module refers to `sqlite3.wasm` and the self-contained
`sqlite3-opfs-async-proxy.js` using `new URL(..., import.meta.url)`. The consumer's
bundler processes those references in the SQLite package's own directory.

The inspected checkout already had `src/sqliteOPFS/worker.mjs`, but the default
factory still used generated source. That separate implementation also lacked the
newer timing responses. The module worker now uses the extracted current protocol
implementation, eliminating that duplicate.

The original hidden dependencies came from Orange's generated worker string,
runtime module URL, and indirect sync-worker constructor in source. Rollup did not
introduce those patterns. It preserved them in an ESM file without making them
analyzable. The old sibling-`node_modules` URL also assumed a package installation
layout. The new build keeps the worker syntax visible through both build stages
and avoids rebasing SQLite resources into Orange's bundle.

Verified with SQLite `3.53.0-build1`, Chromium `153.0.8010.12`, and Node `22.23.2`:

| Bundler | Development | Production at `/nested/app/` |
| --- | --- | --- |
| Vite `7.3.6` | Pass; `optimizeDeps.exclude: ['orange-orm']` | Pass |
| Webpack `5.111.1` | Pass; normal dependency processing | Pass |

All four cases passed for `opfs-sahpool` with and without isolation headers and for
`opfs-wl` with isolation headers. Reload tests do not explicitly close the database
first. The checks include one managed sync worker sharing three SQLite workers,
a separate plain database, the application-hosted module URL override, zero HTTP
asset errors, and no external runtime hosts. Node browser-conditioned imports and
Vite SSR imports passed as well. This matrix does not establish support for other
browsers or every framework/SSR integration.

Run the packed-package suite with Node 22.12 or newer:

```sh
npm ci --prefix tests/browser-package
npm exec --prefix tests/browser-package -- playwright install --with-deps chromium
npm run test:browser-package
```

The runner builds Orange, runs `npm pack`, installs the tarball into a temporary
consumer outside the repository, and tests Vite development/production and Webpack
development/production in Chromium. Each case uses fresh browser storage and its
own PGlite sync server. Production cases are served from `/nested/app/`. Tests cover
local writes/reads, persistence after reload, managed pull/push, offline writes,
pending changes surviving reload, reconnection, and runtime asset requests. A
report and the installed consumer are retained in the printed temporary directory.
Set `ORANGE_BROWSER_CLEANUP=1` to remove them after success.

`node tests/browser-package/run.mjs --probe-vite` additionally diagnoses development
with default dependency optimization, without the documented exclusion, then with
only Orange excluded. The default run fails looking for `sqlite-worker.mjs` under
`.vite/deps`; the excluded run passes. This is a diagnostic comparison, not an
additional supported configuration. `--opfs-wl` selects the other VFS;
`--no-isolation` tests SAH pool without isolation headers; `--case=webpack-production`
selects a single case. Test logs may include bundler warnings for Orange's existing
optional adapters and dynamic inline-worker imports; these are separate from the
default module worker and asset delivery checked here.
