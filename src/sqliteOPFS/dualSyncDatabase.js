const hostLocal = require('../hostLocal');
const express = require('../hostExpress');
const hono = require('../hostHono');
const randomUuid = require('../randomUuid');
const stringify = require('../client/stringify');
const createHttpInterceptor = require('../client/httpInterceptor');
const newSyncClient = require('../client/syncClient');
const { createSyncAuto, syncAutoStartSymbol } = require('../client/syncAuto');
const { runSyncSwap } = require('../sync/writeGate');
const {
	normalizeCrossTabLockConfig,
	normalizeLockNamePart,
	runWithCrossTabLock
} = require('../sync/crossTabLock');

const {
	ensureLocalSchemaReadySymbol,
	syncAndCapturePullJournalSymbol,
	readOutboxRowsSymbol,
	applyOutboxRowsSymbol,
	applyPullJournalSymbol,
	pushPendingSymbol,
	setClientIdSymbol
} = newSyncClient;

const manifestTable = 'orange_sync_dual_manifest';
const deltaTable = 'orange_sync_dual_delta';
const deltaChunkTable = 'orange_sync_dual_delta_chunk';
const manifestId = 'default';
const roleA = 'a';
const roleB = 'b';
const outboxReplayPageSize = 1000;
const deltaItemsPerChunk = 1000;
const deltaChunkReadPageSize = 32;
const manifestCacheMaxAgeMs = 1000;

function newDualSyncDatabase(connectionString, poolOptions, createSingleDatabase) {
	const roleConnectionStrings = {
		[roleA]: connectionString,
		[roleB]: appendRoleSuffix(connectionString, 'b')
	};
	const cacheConnectionString = appendRoleSuffix(connectionString, 'delta');
	const primaryDataPoolOptions = toDataPoolOptions(poolOptions);
	const secondaryDataPoolOptions = toSecondaryDataPoolOptions(
		primaryDataPoolOptions,
		roleConnectionStrings[roleB]
	);
	const cachePoolOptions = toCachePoolOptions(primaryDataPoolOptions, cacheConnectionString);
	const dbByRole = new Map();
	const clientByRole = new Map();
	let cacheDb;
	let manifestCache;
	let manifestCacheReadAtMs = 0;
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
	let queuedSyncCount = 0;
	let nextProgressRequestId = 1;
	let initialReadyEmitted = false;
	const eventListeners = new Map();
	const roleEventSubscriptions = new Set();
	const schemaReadyRoles = new Set();
	const schemaReadyPromises = new Map();
	let schemaReadyGeneration = 0;
	const dualSyncLockName = `orange-orm:sqliteOPFS:dual-sync:${normalizeLockNamePart(connectionString)}`;
	const dualWriteLockName = `orange-orm:sqliteOPFS:dual-write:${normalizeLockNamePart(connectionString)}`;

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
		[ensureLocalSchemaReadySymbol]: ensureActiveLocalSchemaReady,
		__createSyncClient,
		__orangeDualSyncAttachSyncClient: attachExternalSyncClient,
		__orangeDualSyncWarmManifest: warmManifest,
		__sqliteSync: poolOptions && poolOptions.sync,
		__orangeSyncIdentity: `sqliteOPFS:${connectionString}:dual`,
		__orangeCrossTabWriteLock: { enabled: true, name: dualWriteLockName, timeoutMs: 300000 },
		__orangeBeforeSyncWrite: refreshManifestBeforeWrite
	};
	router.poolFactory = router;
	installSyncProgressInterceptors();

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
		const auto = createSyncAuto(
			{ sync: syncObserved },
			async () => router.__sqliteSync,
			{ runSync: syncAutomatic }
		);
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
		return queueSync(normalizeSyncOptions(options));
	}

	function syncAutomatic(config) {
		return queueSync({}, {
			minimumIntervalMs: normalizeAutoSyncIntervalMs(config && config.intervalMs)
		});
	}

	function queueSync(normalizedOptions, schedule = {}) {
		queuedSyncCount += 1;
		emitSyncProgress('queued', { queueDepth: queuedSyncCount });
		const run = syncTail.then(() => {
			queuedSyncCount = Math.max(0, queuedSyncCount - 1);
			emitSyncProgress('waiting-for-sync-lock', { queueDepth: queuedSyncCount });
			return observe('sync', () => runWithCrossTabLock(
				dualSyncLockName,
				toDualSyncLockConfig(poolOptions && poolOptions.sync, normalizedOptions),
				() => syncScheduled(normalizedOptions, schedule)
			));
		});
		syncTail = run.catch(() => {});
		return run;
	}

	async function syncScheduled(options, schedule) {
		const minimumIntervalMs = schedule && schedule.minimumIntervalMs;
		if (minimumIntervalMs > 0) {
			const manifest = await getManifest(true);
			const lastSuccessfulSyncAtMs = manifest.lastSuccessfulSyncAtMs;
			const elapsedMs = Date.now() - lastSuccessfulSyncAtMs;
			if (lastSuccessfulSyncAtMs > 0 && elapsedMs >= 0 && elapsedMs < minimumIntervalMs) {
				const nextSyncAtMs = lastSuccessfulSyncAtMs + minimumIntervalMs;
				emitSyncProgress('complete', {
					activeRole: manifest.activeRole,
					stagingRole: manifest.stagingRole,
					swapped: false,
					skipped: 'recently-synced',
					lastSuccessfulSyncAtMs,
					nextSyncAtMs
				});
				return withDualSyncResult({
					skipped: 'recently-synced',
					lastSuccessfulSyncAtMs,
					nextSyncAtMs
				}, {
					...manifest,
					swapped: false
				});
			}
		}
		return sync(options);
	}

	async function sync(options = {}) {
		emitSyncProgress('preparing');
		const manifest = await getManifest(true);
		const activeRole = manifest.activeRole;
		const stagingRole = manifest.stagingRole;
		const activeSync = getRoleSyncClient(activeRole);
		const stagingSync = getRoleSyncClient(stagingRole);
		await ensureSharedClientId(manifest);

		emitSyncProgress('pushing-active', { activeRole, stagingRole });
		const activePushResult = await activeSync[pushPendingSymbol](options);
		const needsInitialSwap = activePushResult && activePushResult.skipped === 'missing-stable-base';
		emitSyncProgress('updating-staging', { activeRole, stagingRole });
		await applyPendingDeltasToRole(stagingRole);

		const openRows = await readAllOutboxRows(activeSync, ['pending', 'pushed']);
		await stagingSync[applyOutboxRowsSymbol](openRows, {
			replay: false,
			replaceOpen: true
		});

		emitSyncProgress('pulling-staging', { activeRole, stagingRole });
		const deltaSink = await createDeltaJournalSink(stagingRole);
		let result;
		let journal;
		let deltaId;
		try {
			result = await stagingSync[syncAndCapturePullJournalSymbol]({
				...options,
				_capturePullJournalChunk: deltaSink.write
			});
			journal = result && result.__orangePullJournal;
			deltaId = await deltaSink.commit(journal);
		}
		catch (error) {
			await deltaSink.abort();
			throw error;
		}
		let publishedManifest = manifest;
		let swapped = false;

		emitSyncProgress('waiting-for-write-barrier', { activeRole, stagingRole });
		await runSyncSwap(router, async () => {
			const currentManifest = await getManifest(true);
			assertExpectedManifest(currentManifest, manifest);
			const finalPendingRows = await readAllOutboxRows(activeSync, ['pending']);
			await stagingSync[applyOutboxRowsSymbol](finalPendingRows, {
				replay: true,
				replaceOpen: false
			});
			if (needsInitialSwap || deltaId || openRows.length > 0 || finalPendingRows.length > 0) {
				emitSyncProgress('swapping', { activeRole, stagingRole });
				publishedManifest = await publishStagingRole(manifest);
				swapped = true;
			}
		});

		publishedManifest = await markSuccessfulSync();
		const newActiveRole = publishedManifest.activeRole;
		await maybeEmitInitialReady(newActiveRole);
		emitSyncProgress('complete', {
			activeRole: publishedManifest.activeRole,
			stagingRole: publishedManifest.stagingRole,
			swapped
		});
		return withDualSyncResult(result, {
			...publishedManifest,
			deltaId,
			swapped
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
		return runWithCrossTabLock(
			dualSyncLockName,
			toDualSyncLockConfig(poolOptions && poolOptions.sync, options),
			() => runSyncSwap(router, () => resetLocalCore(options))
		);
	}

	async function resetLocalCore(options) {
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
		return runWithCrossTabLock(
			dualSyncLockName,
			toDualSyncLockConfig(poolOptions && poolOptions.sync, options),
			() => runSyncSwap(router, async () => {
				const manifest = await getManifest(true);
				return getRoleSyncClient(manifest.activeRole).discardLocalChanges(options);
			})
		);
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
			const totalItems = getDeltaItemCount(delta.journal);
			const hasInlineItems = Array.isArray(delta.journal.items);
			const readPullJournalBatch = hasInlineItems
				? undefined
				: await createDeltaJournalBatchReader(delta.id);
			emitSyncProgress('applying-delta', {
				deltaId: delta.id,
				targetRole: role,
				processedItems: 0,
				totalItems
			});
			await getRoleSyncClient(role)[applyPullJournalSymbol](delta.journal, {
				_readPullJournalBatch: readPullJournalBatch,
				_itemCount: totalItems,
				_onPullJournalBatchApplied(progress) {
					emitSyncProgress('applying-delta', {
						deltaId: delta.id,
						targetRole: role,
						processedItems: progress.processedItems,
						totalItems: progress.totalItems
					});
				}
			});
			await markDeltaApplied(delta, role);
		}
	}

	async function publishStagingRole(manifest) {
		const now = Date.now();
		return writeManifest({
			activeRole: manifest.stagingRole,
			stagingRole: manifest.activeRole,
			updatedAtMs: now,
			generation: manifest.generation + 1,
			clientId: manifest.clientId
		}, {
			expectedGeneration: manifest.generation,
			expectedActiveRole: manifest.activeRole,
			expectedStagingRole: manifest.stagingRole
		});
	}

	async function readAllOutboxRows(syncClient, statuses) {
		const rows = [];
		let after;
		for (;;) {
			const page = await syncClient[readOutboxRowsSymbol]({
				statuses,
				limit: outboxReplayPageSize,
				after
			});
			if (!Array.isArray(page) || page.length === 0)
				return rows;
			rows.push(...page);
			if (page.length < outboxReplayPageSize)
				return rows;
			const last = page[page.length - 1];
			const nextAfter = {
				createdAtMs: Number(last && (last.created_at_ms ?? last.CREATED_AT_MS)),
				mutationId: last && (last.mutation_id ?? last.MUTATION_ID)
			};
			if (!Number.isFinite(nextAfter.createdAtMs) || typeof nextAfter.mutationId !== 'string')
				throw new Error('Dual sync could not page the local outbox safely.');
			if (after && after.createdAtMs === nextAfter.createdAtMs && after.mutationId === nextAfter.mutationId)
				throw new Error('Dual sync outbox paging did not advance.');
			after = nextAfter;
		}
	}

	async function ensureSharedClientId(manifest) {
		const clientId = manifest && manifest.clientId;
		if (typeof clientId !== 'string' || clientId.length === 0)
			throw new Error('Dual sync manifest does not contain a shared client id.');
		for (const role of [roleA, roleB]) {
			const syncClient = getRoleSyncClient(role);
			if (typeof syncClient[setClientIdSymbol] !== 'function')
				throw new Error('Dual sync role client cannot set the shared client id.');
			await syncClient[setClientIdSymbol](clientId);
		}
	}

	function hasPullJournalChanges(journal) {
		if (!journal || journal !== Object(journal))
			return false;
		if (Array.isArray(journal.items) && journal.items.length > 0)
			return true;
		if (Number(journal.itemCount || 0) > 0)
			return true;
		return stringify(journal.since) !== stringify(journal.finalSince);
	}

	function assertExpectedManifest(current, expected) {
		if (!current || !expected
			|| current.generation !== expected.generation
			|| current.activeRole !== expected.activeRole
			|| current.stagingRole !== expected.stagingRole) {
			throw new Error('Dual sync manifest changed while staging was being prepared; retry sync.');
		}
	}

	function refreshManifestBeforeWrite() {
		return getManifest(true);
	}

	function emitSyncProgress(phase, details = {}) {
		emit('sync-progress', {
			phase,
			atMs: Date.now(),
			...details
		});
	}

	function installSyncProgressInterceptors() {
		syncInterceptors.request.use(config => {
			const body = config && config.data;
			const requestPhase = body && (body.phase || body.action) || 'unknown';
			const progress = {
				requestId: nextProgressRequestId++,
				requestPhase,
				itemCount: Array.isArray(body && body.items)
					? body.items.length
					: Array.isArray(body && body.mutations) ? body.mutations.length : 0,
				startedAtMs: Date.now()
			};
			config.__orangeDualSyncProgress = progress;
			emitSyncProgress('network-start', progress);
			return config;
		});
		syncInterceptors.response.use(
			response => {
				emitNetworkProgressEnd(response && response.config, response && response.data, false);
				return response;
			},
			error => {
				emitNetworkProgressEnd(error && error.config, undefined, true);
				throw error;
			}
		);
	}

	function emitNetworkProgressEnd(config, payload, failed) {
		const progress = config && config.__orangeDualSyncProgress;
		if (!progress)
			return;
		emitSyncProgress('network-end', {
			...progress,
			failed,
			elapsedMs: Math.max(0, Date.now() - progress.startedAtMs),
			returnedItems: Array.isArray(payload && payload.items) ? payload.items.length : 0
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
		if (manifestCache && !refresh && Date.now() - manifestCacheReadAtMs < manifestCacheMaxAgeMs)
			return manifestCache;
		if (manifestPromise)
			return manifestPromise;
		manifestPromise = readManifest()
			.then(async manifest => {
				if (manifest) {
					if (!manifest.clientId)
						manifest = await initializeManifestClientId(manifest);
					return updateManifestCache(manifest);
				}
				const initialManifest = {
					activeRole: roleA,
					stagingRole: roleB,
					updatedAtMs: Date.now(),
					generation: 0,
					clientId: randomUuid()
				};
				return writeManifest(initialManifest, { insertOnly: true });
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
			`SELECT "active_role", "staging_role", "updated_at_ms", "generation", "client_id", "last_successful_sync_at_ms" FROM "${manifestTable}"`,
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
			updatedAtMs: Number(row.updated_at_ms ?? row.UPDATED_AT_MS ?? Date.now()),
			generation: normalizeGeneration(row.generation ?? row.GENERATION),
			clientId: nonEmptyString(row.client_id ?? row.CLIENT_ID),
			lastSuccessfulSyncAtMs: normalizeTimestamp(
				row.last_successful_sync_at_ms ?? row.LAST_SUCCESSFUL_SYNC_AT_MS
			)
		};
	}

	async function markSuccessfulSync() {
		const db = await getCacheDb();
		const lastSuccessfulSyncAtMs = Date.now();
		await ensureCacheSchema(db);
		await db.query([
			`UPDATE "${manifestTable}"`,
			`SET "last_successful_sync_at_ms" = ${lastSuccessfulSyncAtMs}`,
			`WHERE "id" = ${sqlStringLiteral(manifestId)}`
		].join(' '));
		const persisted = await readManifest();
		if (!persisted)
			throw new Error('Dual sync completion time was not persisted.');
		updateManifestCache(persisted, true);
		broadcastManifest(persisted);
		return persisted;
	}

	async function writeManifest(manifest, options = {}) {
		const db = await getCacheDb();
		await ensureCacheSchema(db);
		const normalized = normalizeManifestInfo(manifest);
		if (!normalized || !normalized.clientId)
			throw new Error('Cannot persist an invalid dual sync manifest.');
		if (options.expectedGeneration !== undefined) {
			await db.query([
				`UPDATE "${manifestTable}" SET`,
				`"active_role" = ${sqlStringLiteral(normalized.activeRole)},`,
				`"staging_role" = ${sqlStringLiteral(normalized.stagingRole)},`,
				`"updated_at_ms" = ${normalized.updatedAtMs},`,
				`"generation" = ${normalized.generation},`,
				`"client_id" = ${sqlStringLiteral(normalized.clientId)}`,
				`WHERE "id" = ${sqlStringLiteral(manifestId)}`,
				`AND "generation" = ${normalizeGeneration(options.expectedGeneration)}`,
				`AND "active_role" = ${sqlStringLiteral(options.expectedActiveRole)}`,
				`AND "staging_role" = ${sqlStringLiteral(options.expectedStagingRole)}`
			].join(' '));
		}
		else {
			await db.query([
				`INSERT INTO "${manifestTable}" ("id", "active_role", "staging_role", "updated_at_ms", "generation", "client_id")`,
				`VALUES (${sqlStringLiteral(manifestId)}, ${sqlStringLiteral(normalized.activeRole)}, ${sqlStringLiteral(normalized.stagingRole)}, ${normalized.updatedAtMs}, ${normalized.generation}, ${sqlStringLiteral(normalized.clientId)})`,
				options.insertOnly ? 'ON CONFLICT("id") DO NOTHING' : [
					'ON CONFLICT("id") DO UPDATE SET',
					'"active_role" = excluded."active_role",',
					'"staging_role" = excluded."staging_role",',
					'"updated_at_ms" = excluded."updated_at_ms",',
					'"generation" = excluded."generation",',
					'"client_id" = excluded."client_id"'
				].join(' ')
			].join(' '));
		}
		const persisted = await readManifest();
		if (!persisted)
			throw new Error('Dual sync manifest was not persisted.');
		if (options.expectedGeneration !== undefined
			&& (persisted.generation !== normalized.generation
				|| persisted.activeRole !== normalized.activeRole
				|| persisted.stagingRole !== normalized.stagingRole)) {
			throw new Error('Dual sync manifest compare-and-swap failed; retry sync.');
		}
		updateManifestCache(persisted, true);
		broadcastManifest(persisted);
		return persisted;
	}

	async function initializeManifestClientId(manifest) {
		const db = await getCacheDb();
		const clientId = randomUuid();
		await db.query([
			`UPDATE "${manifestTable}"`,
			`SET "client_id" = ${sqlStringLiteral(clientId)}`,
			`WHERE "id" = ${sqlStringLiteral(manifestId)}`,
			'AND ("client_id" IS NULL OR "client_id" = \'\')'
		].join(' '));
		return await readManifest() || { ...manifest, clientId };
	}

	async function createDeltaJournalSink(appliedRole) {
		const db = await getCacheDb();
		await ensureCacheSchema(db);
		await cleanupOrphanDeltaChunks(db);
		const id = randomUuid();
		let chunkIndex = 0;
		let bufferedItems = [];
		let finished = false;
		let committed = false;
		return { write, commit, abort };

		async function write(items) {
			if (finished)
				throw new Error('Cannot write to a completed dual sync delta.');
			if (Array.isArray(items) && items.length > 0)
				bufferedItems.push(...items);
			const chunks = [];
			while (bufferedItems.length >= deltaItemsPerChunk)
				chunks.push(bufferedItems.splice(0, deltaItemsPerChunk));
			if (chunks.length > 0)
				await writeChunks(chunks);
		}

		async function commit(journal) {
			if (finished)
				throw new Error('Dual sync delta has already completed.');
			finished = true;
			if (!hasPullJournalChanges(journal)) {
				await deleteChunks();
				committed = true;
				return undefined;
			}
			if (bufferedItems.length > 0)
				await writeChunks([bufferedItems.splice(0)]);
			const header = {
				scopeKey: journal.scopeKey,
				tables: Array.isArray(journal.tables) ? journal.tables : [],
				since: journal.since,
				finalSince: journal.finalSince,
				reason: journal.reason,
				itemCount: Number(journal.itemCount || 0)
			};
			const appliedRoles = JSON.stringify([appliedRole]);
			await db.query([
				`INSERT INTO "${deltaTable}" ("id", "scope", "from_since", "to_since", "journal_json", "created_at_ms", "applied_roles_json")`,
				`VALUES (${sqlStringLiteral(id)}, ${sqlStringLiteral(journal.scopeKey || '*')}, ${sqlNullableJsonLiteral(journal.since)}, ${sqlNullableJsonLiteral(journal.finalSince)}, ${sqlStringLiteral(stringify(header))}, ${Date.now()}, ${sqlStringLiteral(appliedRoles)})`
			].join(' '));
			committed = true;
			return id;
		}

		async function abort() {
			if (committed)
				return;
			finished = true;
			bufferedItems = [];
			await deleteChunks();
		}

		async function writeChunks(chunks) {
			const values = chunks.map(items => [
				'(',
				sqlStringLiteral(id), ', ', chunkIndex++, ', ', sqlStringLiteral(stringify(items)),
				')'
			].join(''));
			await db.query([
				`INSERT INTO "${deltaChunkTable}" ("delta_id", "chunk_index", "items_json") VALUES`,
				values.join(', ')
			].join(' '));
		}

		function deleteChunks() {
			return db.query(`DELETE FROM "${deltaChunkTable}" WHERE "delta_id" = ${sqlStringLiteral(id)}`);
		}
	}

	async function cleanupOrphanDeltaChunks(db) {
		await db.query([
			`DELETE FROM "${deltaChunkTable}"`,
			`WHERE "delta_id" NOT IN (SELECT "id" FROM "${deltaTable}")`
		].join(' '));
	}

	async function readDeltas() {
		const db = await getCacheDb();
		await ensureCacheSchema(db);
		const rows = await db.query([
			`SELECT "id", "journal_json", "applied_roles_json" FROM "${deltaTable}"`,
			'ORDER BY "created_at_ms" ASC'
		].join(' '));
		return toRows(rows)
			.map(row => {
				const id = row.id ?? row.ID;
				const journal = parseJson(row.journal_json ?? row.JOURNAL_JSON);
				return {
					id,
					journal,
					appliedRoles: parseJson(row.applied_roles_json ?? row.APPLIED_ROLES_JSON) || []
				};
			})
			.filter(delta => typeof delta.id === 'string' && delta.journal && delta.journal === Object(delta.journal));
	}

	async function createDeltaJournalBatchReader(deltaId) {
		const db = await getCacheDb();
		await ensureCacheSchema(db);
		let pending = [];
		let afterChunkIndex = -1;
		let done = false;
		return readNextBatch;

		async function readNextBatch() {
			if (pending.length === 0 && !done)
				await readNextPage();
			if (pending.length === 0)
				return null;
			return pending.shift();
		}

		async function readNextPage() {
			const rows = toRows(await db.query([
				`SELECT "chunk_index", "items_json" FROM "${deltaChunkTable}"`,
				`WHERE "delta_id" = ${sqlStringLiteral(deltaId)}`,
				`AND "chunk_index" > ${afterChunkIndex}`,
				'ORDER BY "chunk_index" ASC',
				`LIMIT ${deltaChunkReadPageSize}`
			].join(' ')));
			if (rows.length === 0) {
				done = true;
				return;
			}
			for (let i = 0; i < rows.length; i++) {
				const row = rows[i];
				const chunkIndex = Number(row.chunk_index ?? row.CHUNK_INDEX);
				const items = parseJson(row.items_json ?? row.ITEMS_JSON);
				if (!Number.isSafeInteger(chunkIndex) || chunkIndex !== afterChunkIndex + 1 || !Array.isArray(items))
					throw new Error(`Dual sync delta "${deltaId}" contains an invalid journal chunk.`);
				afterChunkIndex = chunkIndex;
				pending.push(items);
			}
			if (rows.length < deltaChunkReadPageSize)
				done = true;
		}
	}

	function getDeltaItemCount(journal) {
		const itemCount = Number(journal && journal.itemCount);
		const inlineItemCount = Array.isArray(journal && journal.items) ? journal.items.length : 0;
		return Number.isFinite(itemCount) && itemCount >= 0
			? Math.max(itemCount, inlineItemCount)
			: inlineItemCount;
	}

	async function markDeltaApplied(delta, role) {
		const db = await getCacheDb();
		const roles = Array.isArray(delta.appliedRoles)
			? delta.appliedRoles.slice()
			: [];
		if (!roles.includes(role))
			roles.push(role);
		if (roles.includes(roleA) && roles.includes(roleB)) {
			await db.query(`DELETE FROM "${deltaChunkTable}" WHERE "delta_id" = ${sqlStringLiteral(delta.id)}`);
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
		const currentManifest = await getManifest().catch(() => null);
		cacheSchemaReady = false;
		cacheSchemaPromise = null;
		await db.query(`DROP TABLE IF EXISTS "${deltaChunkTable}"`);
		await db.query(`DROP TABLE IF EXISTS "${deltaTable}"`);
		await db.query(`DROP TABLE IF EXISTS "${manifestTable}"`);
		await ensureCacheSchema(db);
		return writeManifest({
			activeRole: roleA,
			stagingRole: roleB,
			updatedAtMs: Date.now(),
			generation: 0,
			clientId: currentManifest && currentManifest.clientId || randomUuid()
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
					'"updated_at_ms" INTEGER NOT NULL,',
					'"generation" INTEGER NOT NULL DEFAULT 0,',
					'"client_id" TEXT,',
					'"last_successful_sync_at_ms" INTEGER',
					');'
				].join(' '));
				await tryAddCacheColumn(db, manifestTable, 'generation', 'INTEGER NOT NULL DEFAULT 0');
				await tryAddCacheColumn(db, manifestTable, 'client_id', 'TEXT');
				await tryAddCacheColumn(db, manifestTable, 'last_successful_sync_at_ms', 'INTEGER');
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
				await db.query([
					`CREATE TABLE IF NOT EXISTS "${deltaChunkTable}" (`,
					'"delta_id" TEXT NOT NULL,',
					'"chunk_index" INTEGER NOT NULL,',
					'"items_json" TEXT NOT NULL,',
					'PRIMARY KEY ("delta_id", "chunk_index")',
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

	async function tryAddCacheColumn(db, tableName, columnName, definition) {
		try {
			await db.query(`ALTER TABLE "${tableName}" ADD COLUMN "${columnName}" ${definition}`);
		}
		catch (error) {
			const message = error && error.message || '';
			if (!/duplicate column|already exists/u.test(message))
				throw error;
		}
	}

	function getRolePoolOptions(role) {
		return role === roleA
			? primaryDataPoolOptions
			: secondaryDataPoolOptions;
	}

	function updateManifestCache(info, force = false) {
		const manifest = normalizeManifestInfo(info);
		if (!manifest)
			return manifestCache;
		if (!manifest.clientId && manifestCache && manifestCache.clientId)
			manifest.clientId = manifestCache.clientId;
		if (!force && manifestCache && manifestCache.generation > manifest.generation)
			return manifestCache;
		if (!force && manifestCache && manifestCache.generation === manifest.generation
			&& Number(manifestCache.updatedAtMs || 0) > Number(manifest.updatedAtMs || 0))
			return manifestCache;
		const previous = manifestCache;
		manifestCache = manifest;
		manifestCacheReadAtMs = Date.now();
		if (!previous
			|| previous.activeRole !== manifest.activeRole
			|| previous.stagingRole !== manifest.stagingRole
			|| previous.generation !== manifest.generation
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
						updateManifestCache(info, method === 'resetLocal');
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
		updatedAtMs: Number(info.updatedAtMs) || Date.now(),
		generation: normalizeGeneration(info.generation),
		clientId: nonEmptyString(info.clientId),
		lastSuccessfulSyncAtMs: normalizeTimestamp(info.lastSuccessfulSyncAtMs)
	};
}

function manifestChannelName(connectionString) {
	return `orange-orm:sqliteOPFS:dual-manifest:${normalizeLockNamePart(connectionString || 'default')}`;
}

function toDataPoolOptions(poolOptions = {}) {
	const options = {
		...poolOptions,
		sync: stripDualSyncOption(poolOptions.sync)
	};
	if (!options.vfs)
		options.vfs = 'opfs-wl';
	return options;
}

function toCachePoolOptions(poolOptions = {}, connectionString) {
	const options = toSecondaryDataPoolOptions(poolOptions, connectionString);
	delete options.sync;
	return options;
}

function toSecondaryDataPoolOptions(poolOptions = {}, connectionString) {
	let options = { ...poolOptions };
	const hadProvidedWorker = !!options.worker;
	delete options.worker;
	if (hadProvidedWorker)
		delete options.closeDbOnClose;
	options = withIsolatedSahPool(options, connectionString);
	return options;
}

function withIsolatedSahPool(poolOptions, connectionString) {
	if (!usesSahPool(poolOptions))
		return poolOptions;
	const source = poolOptions.opfsSahPool || poolOptions.opfsSAHPool || poolOptions.sahPool || {};
	const baseName = nonEmptyString(source.name) || 'opfs-sahpool';
	const baseDirectory = nonEmptyString(source.directory) || `.${baseName}`;
	const token = stableSahPoolToken(connectionString);
	return {
		...poolOptions,
		opfsSahPool: {
			...source,
			name: `${baseName}-orange-${token}`,
			directory: `${baseDirectory}-orange-${token}`
		}
	};
}

function usesSahPool(poolOptions) {
	return poolOptions.vfs === 'opfs-sahpool';
}

function stableSahPoolToken(value) {
	const text = String(value || 'default');
	let hash = 2166136261;
	for (let i = 0; i < text.length; i++) {
		hash ^= text.charCodeAt(i);
		hash = Math.imul(hash, 16777619);
	}
	return (hash >>> 0).toString(16).padStart(8, '0');
}

function nonEmptyString(value) {
	return typeof value === 'string' && value.length > 0 ? value : undefined;
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

function normalizeAutoSyncIntervalMs(value) {
	const parsed = Number.parseInt(value, 10);
	return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function normalizeTimestamp(value) {
	const parsed = Number(value);
	return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

function toDualSyncLockConfig(sync, options) {
	const configured = sync && sync === Object(sync) && !Array.isArray(sync)
		? sync.crossTabLock
		: undefined;
	const config = normalizeCrossTabLockConfig(configured);
	const timeoutMs = normalizeTimeoutMs(options && options.timeoutMs);
	if (!timeoutMs || config.timeoutMs)
		return config;
	return {
		...config,
		timeoutMs
	};
}

function normalizeGeneration(value) {
	const parsed = Number.parseInt(value, 10);
	return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
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
