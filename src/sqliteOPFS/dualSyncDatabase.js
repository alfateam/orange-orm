const hostLocal = require('../hostLocal');
const express = require('../hostExpress');
const hono = require('../hostHono');
const randomUuid = require('../randomUuid');
const stringify = require('../client/stringify');
const createHttpInterceptor = require('../client/httpInterceptor');
const newSyncClient = require('../client/syncClient');
const { createSyncAuto, syncAutoStartSymbol } = require('../client/syncAuto');
const { runSyncMaintenance } = require('../sync/writeGate');
const { normalizeLockNamePart } = require('../sync/crossTabLock');

const {
	ensureLocalSchemaReadySymbol,
	syncAndCapturePullJournalSymbol,
	readOutboxRowsSymbol,
	applyOutboxRowsSymbol,
	applyPullJournalSymbol,
	pushPendingSymbol
} = newSyncClient;

const manifestTable = 'orange_sync_dual_manifest';
const deltaTable = 'orange_sync_dual_delta';
const manifestId = 'default';
const roleA = 'a';
const roleB = 'b';

function newDualSyncDatabase(connectionString, poolOptions, createSingleDatabase) {
	const primaryDataPoolOptions = toDataPoolOptions(poolOptions);
	const secondaryDataPoolOptions = toSecondaryDataPoolOptions(primaryDataPoolOptions);
	const cachePoolOptions = toCachePoolOptions(poolOptions);
	const roleConnectionStrings = {
		[roleA]: connectionString,
		[roleB]: appendRoleSuffix(connectionString, 'b')
	};
	const cacheConnectionString = appendRoleSuffix(connectionString, 'delta');
	const dbByRole = new Map();
	const clientByRole = new Map();
	let cacheDb;
	let manifestCache;
	let manifestPromise;
	let cacheSchemaReady = false;
	let cacheSchemaPromise;
	let externalSyncUnsubscribe;
	let externalSyncClient;
	const manifestChannel = createManifestChannel();
	let roleClientFactory;
	let roleHttpInterceptor;
	const syncInterceptors = createHttpInterceptor();
	let syncTail = Promise.resolve();
	let initialReadyEmitted = false;
	const eventListeners = new Map();
	const roleEventSubscriptions = new Set();
	const schemaReadyRoles = new Set();
	const schemaReadyPromises = new Map();
	let schemaReadyGeneration = 0;

	const router = {
		poolFactory: null,
		hostLocal,
		express,
		hono,
		transaction,
		createTransaction,
		query,
		sqliteFunction,
		end,
		accept,
		__createSyncClient,
		__orangeDualSyncAttachSyncClient: attachExternalSyncClient,
		__orangeDualSyncWarmManifest: warmManifest,
		__sqliteSync: poolOptions && poolOptions.sync,
		__orangeSyncIdentity: `sqliteOPFS:${connectionString}:dual`
	};
	router.poolFactory = router;

	return router;

	function transaction(options, fn) {
		if ((arguments.length === 1) && (typeof options === 'function')) {
			fn = options;
			options = undefined;
		}
		return getActiveReadyDb().then(db => db.transaction(options, fn));
	}

	function createTransaction(options) {
		const transactionPromise = getActiveReadyDb().then(db => db.createTransaction(options));

		function run(fn) {
			return transactionPromise.then(transaction => transaction(fn));
		}
		run.rollback = function(...args) {
			return transactionPromise.then(transaction => transaction.rollback(...args));
		};
		run.commit = function(...args) {
			return transactionPromise.then(transaction => transaction.commit(...args));
		};
		return run;
	}

	function query(sql, options) {
		return getActiveReadyDb().then(db => db.query(sql, options));
	}

	function sqliteFunction(...args) {
		return getActiveReadyDb().then(db => db.sqliteFunction(...args));
	}

	async function end() {
		const closes = [];
		for (const db of dbByRole.values()) {
			if (db && typeof db.end === 'function')
				closes.push(db.end());
		}
		if (cacheDb && typeof cacheDb.end === 'function')
			closes.push(cacheDb.end());
		if (externalSyncUnsubscribe)
			externalSyncUnsubscribe();
		if (manifestChannel && typeof manifestChannel.close === 'function')
			manifestChannel.close();
		await Promise.all(closes);
	}

	function accept(caller) {
		caller.visitSqlite();
	}

	function __createSyncClient(rootClient, _getDb, httpInterceptor) {
		roleClientFactory = rootClient;
		roleHttpInterceptor = httpInterceptor;
		const auto = createSyncAuto({ sync: syncObserved }, async () => router.__sqliteSync);
		const syncClient = {
			sync: syncObserved,
			ensureLocalSchema,
			resetLocal,
			discardLocalChanges,
			start: auto.start,
			stop: auto.stop,
			isRunning: auto.isRunning,
			on,
			off,
			once,
			waitForInitialSync,
			interceptors: syncInterceptors
		};
		Object.defineProperty(syncClient, syncAutoStartSymbol, {
			value: auto.startFromConfig
		});
		Object.defineProperty(syncClient, ensureLocalSchemaReadySymbol, {
			value: ensureActiveLocalSchemaReady
		});
		return syncClient;
	}

	function syncObserved(options = {}) {
		const run = syncTail.then(() => observe('sync', () => sync(normalizeSyncOptions(options))));
		syncTail = run.catch(() => {});
		return run;
	}

	async function sync(options = {}) {
		const manifest = await getManifest();
		const activeRole = manifest.activeRole;
		const stagingRole = manifest.stagingRole;
		const activeSync = getRoleSyncClient(activeRole);
		const stagingSync = getRoleSyncClient(stagingRole);

		await activeSync[pushPendingSymbol](options);
		await applyPendingDeltasToRole(stagingRole);

		const openRows = await activeSync[readOutboxRowsSymbol]({
			statuses: ['pending', 'pushed']
		});
		await stagingSync[applyOutboxRowsSymbol](openRows, {
			replay: false,
			replaceOpen: true
		});

		const result = await stagingSync[syncAndCapturePullJournalSymbol](options);
		const journal = result && result.__orangePullJournal;
		const deltaId = journal
			? await saveDelta(journal, stagingRole)
			: undefined;

		await runSyncMaintenance(router, async () => {
			const finalPendingRows = await activeSync[readOutboxRowsSymbol]({
				statuses: ['pending']
			});
			await stagingSync[applyOutboxRowsSymbol](finalPendingRows, {
				replay: true,
				replaceOpen: false
			});
			await publishStagingRole(activeRole, stagingRole);
		});

		const newActiveRole = stagingRole;
		await maybeEmitInitialReady(newActiveRole);
		return withDualSyncResult(result, {
			activeRole: newActiveRole,
			stagingRole: activeRole,
			deltaId
		});
	}

	async function ensureLocalSchema(options = {}) {
		const manifest = await getManifest();
		return getRoleSyncClient(manifest.activeRole).ensureLocalSchema(options);
	}

	function ensureActiveLocalSchemaReady() {
		return ensureLocalSchema();
	}

	async function resetLocal(options = {}) {
		const errors = [];
		for (const role of [roleA, roleB]) {
			try {
				await getRoleSyncClient(role).resetLocal(options);
			}
			catch (e) {
				errors.push(e);
			}
		}
		const manifest = await resetCache();
		clearSchemaReadyRoles();
		initialReadyEmitted = false;
		if (errors.length > 0)
			throw errors[0];
		return { reset: true, ...manifest };
	}

	async function discardLocalChanges(options = {}) {
		const manifest = await getManifest();
		return getRoleSyncClient(manifest.activeRole).discardLocalChanges(options);
	}

	async function waitForInitialSync() {
		const manifest = await getManifest();
		return getRoleSyncClient(manifest.activeRole).waitForInitialSync();
	}

	function on(event, listener) {
		if (typeof event !== 'string' || typeof listener !== 'function')
			return () => {};
		let listeners = eventListeners.get(event);
		if (!listeners) {
			listeners = new Set();
			eventListeners.set(event, listeners);
			attachRoleEvent(event);
		}
		listeners.add(listener);
		if (event === 'initial-ready')
			void maybeEmitInitialReadyFromActive();
		return () => off(event, listener);
	}

	function off(event, listener) {
		const listeners = eventListeners.get(event);
		if (!listeners)
			return;
		listeners.delete(listener);
		if (listeners.size === 0)
			eventListeners.delete(event);
	}

	function once(event, listener) {
		if (typeof event !== 'string' || typeof listener !== 'function')
			return () => {};
		const unsubscribe = on(event, payload => {
			unsubscribe();
			listener(payload);
		});
		return unsubscribe;
	}

	async function observe(method, fn) {
		try {
			const result = await fn();
			emit(method, { method, result });
			if (method !== 'sync')
				emit('sync', { method, result });
			return result;
		}
		catch (error) {
			emit(method + '-error', { method, error });
			emit('error', { method, error });
			throw error;
		}
	}

	function emit(event, payload) {
		const listeners = eventListeners.get(event);
		if (!listeners)
			return;
		for (const listener of Array.from(listeners))
			listener(payload);
	}

	function attachRoleEvent(event) {
		if (!event || event.indexOf('operation') !== 0)
			return;
		for (const role of [roleA, roleB]) {
			const key = role + ':' + event;
			if (roleEventSubscriptions.has(key))
				continue;
			const syncClient = clientByRole.get(role)?.syncClient;
			if (syncClient && typeof syncClient.on === 'function') {
				syncClient.on(event, payload => emit(event, payload));
				roleEventSubscriptions.add(key);
			}
		}
	}

	async function maybeEmitInitialReadyFromActive() {
		const manifest = await getManifest();
		await maybeEmitInitialReady(manifest.activeRole);
	}

	async function maybeEmitInitialReady(role) {
		if (initialReadyEmitted)
			return;
		const syncClient = getRoleSyncClient(role);
		if (typeof syncClient.waitForInitialSync !== 'function')
			return;
		try {
			await syncClient.waitForInitialSync();
		}
		catch (_e) {
			return;
		}
		if (initialReadyEmitted)
			return;
		initialReadyEmitted = true;
		emit('initial-ready', { source: 'dual-swap', role });
	}

	async function applyPendingDeltasToRole(role, onlyDeltaId) {
		const deltas = await readDeltas();
		for (let i = 0; i < deltas.length; i++) {
			const delta = deltas[i];
			if (onlyDeltaId && delta.id !== onlyDeltaId)
				continue;
			if (delta.appliedRoles.includes(role))
				continue;
			await getRoleSyncClient(role)[applyPullJournalSymbol](delta.journal);
			await markDeltaApplied(delta, role);
		}
	}

	async function publishStagingRole(activeRole, stagingRole) {
		const now = Date.now();
		await writeManifest({
			activeRole: stagingRole,
			stagingRole: activeRole,
			updatedAtMs: now
		});
	}

	async function getActiveReadyDb() {
		const manifest = await getManifest();
		await ensureRoleLocalSchemaReady(manifest.activeRole);
		return getRoleDb(manifest.activeRole);
	}

	function getRoleDb(role) {
		if (!dbByRole.has(role)) {
			const db = createSingleDatabase(roleConnectionStrings[role], getRolePoolOptions(role));
			db.__orangeSyncIdentity = `sqliteOPFS:${connectionString}:dual:${role}`;
			dbByRole.set(role, db);
		}
		return dbByRole.get(role);
	}

	function getRoleSyncClient(role) {
		const roleClient = getRoleClient(role);
		return roleClient.syncClient;
	}

	function getRoleClient(role) {
		if (!roleClientFactory)
			throw new Error('Dual sqliteOPFS sync client has not been initialized.');
		if (!clientByRole.has(role)) {
			const getDb = () => getRoleDb(role);
			const roleClient = roleClientFactory({ db: getDb });
			roleClient.syncClient = newSyncClient(roleClient, getDb, roleHttpInterceptor, syncInterceptors);
			clientByRole.set(role, roleClient);
			for (const event of eventListeners.keys())
				attachRoleEvent(event);
		}
		return clientByRole.get(role);
	}

	function warmManifest() {
		return getManifest().catch(() => {});
	}

	function attachExternalSyncClient(syncClient, rootClient, httpInterceptor) {
		if (!syncClient || syncClient !== Object(syncClient))
			return;
		if (typeof rootClient === 'function')
			roleClientFactory = rootClient;
		if (httpInterceptor)
			roleHttpInterceptor = httpInterceptor;
		externalSyncClient = syncClient;
		clearSchemaReadyRoles();
		wrapExternalSyncMethod(syncClient, 'sync');
		wrapExternalSyncMethod(syncClient, 'resetLocal');
		if (typeof syncClient.on !== 'function' || externalSyncUnsubscribe)
			return;
		externalSyncUnsubscribe = syncClient.on('sync', payload => {
			const info = extractDualSyncInfo(payload);
			if (info)
				updateManifestCache(info);
		});
	}

	async function getManifest(refresh = false) {
		if (manifestCache && !refresh)
			return manifestCache;
		if (manifestPromise)
			return manifestPromise;
		manifestPromise = readManifest()
			.then(manifest => {
				if (manifest)
					return updateManifestCache(manifest);
				const initialManifest = {
					activeRole: roleA,
					stagingRole: roleB,
					updatedAtMs: Date.now()
				};
				return writeManifest(initialManifest);
			})
			.finally(() => {
				manifestPromise = null;
			});
		return manifestPromise;
	}

	async function readManifest() {
		const db = await getCacheDb();
		await ensureCacheSchema(db);
		const rows = await db.query([
			`SELECT "active_role", "staging_role", "updated_at_ms" FROM "${manifestTable}"`,
			`WHERE "id" = ${sqlStringLiteral(manifestId)}`,
			'LIMIT 1'
		].join(' '));
		const row = firstRow(rows);
		const activeRole = row && (row.active_role ?? row.ACTIVE_ROLE);
		const stagingRole = row && (row.staging_role ?? row.STAGING_ROLE);
		if (!isRole(activeRole) || !isRole(stagingRole) || activeRole === stagingRole)
			return null;
		return {
			activeRole,
			stagingRole,
			updatedAtMs: Number(row.updated_at_ms ?? row.UPDATED_AT_MS ?? Date.now())
		};
	}

	async function writeManifest(manifest) {
		const db = await getCacheDb();
		await ensureCacheSchema(db);
		await db.query([
			`INSERT INTO "${manifestTable}" ("id", "active_role", "staging_role", "updated_at_ms")`,
			`VALUES (${sqlStringLiteral(manifestId)}, ${sqlStringLiteral(manifest.activeRole)}, ${sqlStringLiteral(manifest.stagingRole)}, ${Number(manifest.updatedAtMs) || Date.now()})`,
			'ON CONFLICT("id") DO UPDATE SET',
			'"active_role" = excluded."active_role",',
			'"staging_role" = excluded."staging_role",',
			'"updated_at_ms" = excluded."updated_at_ms"'
		].join(' '));
		updateManifestCache(manifest);
		broadcastManifest(manifest);
		return manifest;
	}

	async function saveDelta(journal, appliedRole) {
		if (!journal || journal !== Object(journal))
			return undefined;
		const db = await getCacheDb();
		await ensureCacheSchema(db);
		const id = randomUuid();
		const appliedRoles = JSON.stringify([appliedRole]);
		await db.query([
			`INSERT INTO "${deltaTable}" ("id", "scope", "from_since", "to_since", "journal_json", "created_at_ms", "applied_roles_json")`,
			`VALUES (${sqlStringLiteral(id)}, ${sqlStringLiteral(journal.scopeKey || '*')}, ${sqlNullableJsonLiteral(journal.since)}, ${sqlNullableJsonLiteral(journal.finalSince)}, ${sqlStringLiteral(stringify(journal))}, ${Date.now()}, ${sqlStringLiteral(appliedRoles)})`
		].join(' '));
		return id;
	}

	async function readDeltas() {
		const db = await getCacheDb();
		await ensureCacheSchema(db);
		const rows = await db.query([
			`SELECT "id", "journal_json", "applied_roles_json" FROM "${deltaTable}"`,
			'ORDER BY "created_at_ms" ASC'
		].join(' '));
		return toRows(rows)
			.map(row => ({
				id: row.id ?? row.ID,
				journal: parseJson(row.journal_json ?? row.JOURNAL_JSON),
				appliedRoles: parseJson(row.applied_roles_json ?? row.APPLIED_ROLES_JSON) || []
			}))
			.filter(delta => typeof delta.id === 'string' && delta.journal && delta.journal === Object(delta.journal));
	}

	async function markDeltaApplied(delta, role) {
		const db = await getCacheDb();
		const roles = Array.isArray(delta.appliedRoles)
			? delta.appliedRoles.slice()
			: [];
		if (!roles.includes(role))
			roles.push(role);
		if (roles.includes(roleA) && roles.includes(roleB)) {
			await db.query(`DELETE FROM "${deltaTable}" WHERE "id" = ${sqlStringLiteral(delta.id)}`);
			delta.appliedRoles = roles;
			return;
		}
		await db.query([
			`UPDATE "${deltaTable}"`,
			`SET "applied_roles_json" = ${sqlStringLiteral(JSON.stringify(roles))}`,
			`WHERE "id" = ${sqlStringLiteral(delta.id)}`
		].join(' '));
		delta.appliedRoles = roles;
	}

	async function resetCache() {
		const db = await getCacheDb();
		cacheSchemaReady = false;
		cacheSchemaPromise = null;
		await db.query(`DROP TABLE IF EXISTS "${deltaTable}"`);
		await db.query(`DROP TABLE IF EXISTS "${manifestTable}"`);
		await ensureCacheSchema(db);
		return writeManifest({
			activeRole: roleA,
			stagingRole: roleB,
			updatedAtMs: Date.now()
		});
	}

	async function getCacheDb() {
		if (!cacheDb)
			cacheDb = createSingleDatabase(cacheConnectionString, cachePoolOptions);
		return cacheDb;
	}

	async function ensureCacheSchema(db) {
		if (cacheSchemaReady)
			return;
		if (!cacheSchemaPromise) {
			cacheSchemaPromise = (async () => {
				await db.query([
					`CREATE TABLE IF NOT EXISTS "${manifestTable}" (`,
					'"id" TEXT PRIMARY KEY,',
					'"active_role" TEXT NOT NULL,',
					'"staging_role" TEXT NOT NULL,',
					'"updated_at_ms" INTEGER NOT NULL',
					');'
				].join(' '));
				await db.query([
					`CREATE TABLE IF NOT EXISTS "${deltaTable}" (`,
					'"id" TEXT PRIMARY KEY,',
					'"scope" TEXT NOT NULL,',
					'"from_since" TEXT,',
					'"to_since" TEXT,',
					'"journal_json" TEXT NOT NULL,',
					'"created_at_ms" INTEGER NOT NULL,',
					'"applied_roles_json" TEXT NOT NULL',
					');'
				].join(' '));
				cacheSchemaReady = true;
			})()
				.finally(() => {
					cacheSchemaPromise = null;
				});
		}
		await cacheSchemaPromise;
	}

	function getRolePoolOptions(role) {
		return role === roleA
			? primaryDataPoolOptions
			: secondaryDataPoolOptions;
	}

	function updateManifestCache(info) {
		const manifest = normalizeManifestInfo(info);
		if (!manifest)
			return manifestCache;
		if (manifestCache && Number(manifestCache.updatedAtMs || 0) > Number(manifest.updatedAtMs || 0))
			return manifestCache;
		const previous = manifestCache;
		manifestCache = manifest;
		if (!previous
			|| previous.activeRole !== manifest.activeRole
			|| previous.stagingRole !== manifest.stagingRole
			|| Number(previous.updatedAtMs || 0) !== Number(manifest.updatedAtMs || 0)) {
			clearSchemaReadyRoles();
		}
		return manifestCache;
	}

	function createManifestChannel() {
		if (typeof BroadcastChannel !== 'function')
			return null;
		try {
			const channel = new BroadcastChannel(manifestChannelName(connectionString));
			channel.onmessage = (event) => {
				const message = event && event.data;
				if (!message || message.type !== 'orange-sync-dual-manifest')
					return;
				if (message.connectionString !== connectionString)
					return;
				updateManifestCache(message.manifest);
			};
			return channel;
		}
		catch (_e) {
			return null;
		}
	}

	function broadcastManifest(manifest) {
		if (!manifestChannel || typeof manifestChannel.postMessage !== 'function')
			return;
		try {
			manifestChannel.postMessage({
				type: 'orange-sync-dual-manifest',
				connectionString,
				manifest: normalizeManifestInfo(manifest)
			});
		}
		catch (_e) {
			// BroadcastChannel is an optimization. Persisted manifest remains the source of truth.
		}
	}

	function wrapExternalSyncMethod(syncClient, method) {
		const original = syncClient[method];
		if (typeof original !== 'function' || original.__orangeDualSyncWrapped)
			return;
		function wrappedExternalSyncMethod(...args) {
			return Promise.resolve(original.apply(this, args))
				.then(result => {
					const info = extractDualSyncInfo(result);
					if (info)
						updateManifestCache(info);
					if (method === 'resetLocal')
						clearSchemaReadyRoles();
					return result;
				});
		}
		Object.defineProperty(wrappedExternalSyncMethod, '__orangeDualSyncWrapped', {
			value: true
		});
		syncClient[method] = wrappedExternalSyncMethod;
	}

	async function ensureRoleLocalSchemaReady(role) {
		if (!isRole(role) || schemaReadyRoles.has(role))
			return;
		const pending = schemaReadyPromises.get(role);
		if (pending)
			return pending;
		const generation = schemaReadyGeneration;
		const promise = ensureRoleLocalSchemaReadyCore(role)
			.then(() => {
				if (schemaReadyGeneration === generation)
					schemaReadyRoles.add(role);
			})
			.finally(() => {
				if (schemaReadyPromises.get(role) === promise)
					schemaReadyPromises.delete(role);
			});
		schemaReadyPromises.set(role, promise);
		return promise;
	}

	async function ensureRoleLocalSchemaReadyCore(role) {
		if (roleClientFactory) {
			await getRoleSyncClient(role).ensureLocalSchema();
			return;
		}
		const ensureExternal = externalSyncClient && (
			externalSyncClient[ensureLocalSchemaReadySymbol]
			|| externalSyncClient.ensureLocalSchema
		);
		if (typeof ensureExternal === 'function')
			await ensureExternal.call(externalSyncClient);
	}

	function clearSchemaReadyRoles() {
		schemaReadyGeneration++;
		schemaReadyRoles.clear();
		schemaReadyPromises.clear();
	}
}

function withDualSyncResult(result, info) {
	if (!result || result !== Object(result))
		return result;
	Object.defineProperty(result, '__orangeDualSync', {
		value: info,
		enumerable: true,
		configurable: true
	});
	return result;
}

function extractDualSyncInfo(payload) {
	if (!payload || payload !== Object(payload))
		return null;
	const direct = normalizeManifestInfo(payload);
	if (direct)
		return direct;
	if (payload.__orangeDualSync)
		return payload.__orangeDualSync;
	const result = payload.result;
	if (result && result.__orangeDualSync)
		return result.__orangeDualSync;
	return null;
}

function normalizeManifestInfo(info) {
	if (!info || info !== Object(info))
		return null;
	if (!isRole(info.activeRole) || !isRole(info.stagingRole) || info.activeRole === info.stagingRole)
		return null;
	return {
		activeRole: info.activeRole,
		stagingRole: info.stagingRole,
		updatedAtMs: Number(info.updatedAtMs) || Date.now()
	};
}

function manifestChannelName(connectionString) {
	return `orange-orm:sqliteOPFS:dual-manifest:${normalizeLockNamePart(connectionString || 'default')}`;
}

function toDataPoolOptions(poolOptions = {}) {
	return {
		...poolOptions,
		sync: stripDualSyncOption(poolOptions.sync)
	};
}

function toCachePoolOptions(poolOptions = {}) {
	const options = toSecondaryDataPoolOptions(poolOptions);
	delete options.sync;
	return options;
}

function toSecondaryDataPoolOptions(poolOptions = {}) {
	const options = { ...poolOptions };
	delete options.worker;
	delete options.closeDbOnClose;
	return options;
}

function stripDualSyncOption(sync) {
	if (!sync || sync !== Object(sync) || Array.isArray(sync))
		return sync;
	const {
		dualDataDb,
		...rest
	} = sync;
	return rest;
}

function appendRoleSuffix(connectionString, suffix) {
	const value = String(connectionString);
	if (value.endsWith('.sqlite3'))
		return value.slice(0, -8) + `.__orange_sync_${suffix}.sqlite3`;
	if (value.endsWith('.db'))
		return value.slice(0, -3) + `.__orange_sync_${suffix}.db`;
	return `${value}.__orange_sync_${suffix}.sqlite3`;
}

function isRole(value) {
	return value === roleA || value === roleB;
}

function normalizeSyncOptions(input) {
	if (!input || input !== Object(input))
		return {};
	const keys = Object.keys(input);
	const invalidKeys = keys.filter(key => key !== 'timeoutMs');
	if (invalidKeys.length > 0)
		throw new Error(`Unsupported sync option "${invalidKeys[0]}". sync only accepts { timeoutMs }.`);
	const timeoutMs = normalizeTimeoutMs(input.timeoutMs);
	return timeoutMs === undefined ? {} : { timeoutMs };
}

function normalizeTimeoutMs(value) {
	const parsed = Number.parseInt(value, 10);
	if (!Number.isFinite(parsed) || parsed <= 0)
		return undefined;
	return parsed;
}

function firstRow(rows) {
	const list = toRows(rows);
	return list[0];
}

function toRows(rows) {
	if (Array.isArray(rows))
		return rows;
	return rows && Array.isArray(rows.rows) ? rows.rows : [];
}

function parseJson(value) {
	if (value === null || value === undefined)
		return undefined;
	if (typeof value !== 'string')
		return value;
	try {
		return JSON.parse(value);
	}
	catch (_e) {
		return undefined;
	}
}

function sqlStringLiteral(value) {
	return `'${String(value).replace(/'/g, '\'\'')}'`;
}

function sqlNullableJsonLiteral(value) {
	if (value === undefined || value === null)
		return 'NULL';
	return sqlStringLiteral(stringify(value));
}

module.exports = newDualSyncDatabase;
