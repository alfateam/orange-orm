const randomUuid = require('../randomUuid');
const stringify = require('./stringify');
const { createSyncAuto, syncAutoStartSymbol } = require('./syncAuto');
const createHttpInterceptor = require('./httpInterceptor');
const outboxTableSql = require('../sync/outboxTableSql');
const {
	buildSyncSchema,
	checksumString,
	clearEnsuredSyncSchema,
	ensureSyncSchema,
	stableStringify
} = require('./syncSchema');
const { runSyncMaintenance } = require('../sync/writeGate');
const {
	normalizeCrossTabLockConfig,
	normalizeLockNamePart,
	normalizePositiveInteger,
	runWithCrossTabLock
} = require('../sync/crossTabLock');
const ensureOutboxOperationColumns = require('../sync/ensureOutboxOperationColumns');
const {
	deleteSyncOperationMemory,
	finalizeSyncOperationMemory,
	withSyncOperationMemory
} = require('../sync/operationContext');

const maxPushBatchesPerSync = 1000;
const maxStableBaseKeysPerStatement = 1000;
const pullJournalRecoveryPageSize = 1000;
const streamPullPendingStatus = 'stream-pending';
const streamPullReadyStatus = 'stream-ready';
const syncDbPriority = 1;
const ensureLocalSchemaReadySymbol = typeof Symbol === 'function'
	? Symbol.for('orange-orm.syncClient.ensureLocalSchemaReady')
	: '__orangeOrmSyncClientEnsureLocalSchemaReady';
const syncAndCapturePullJournalSymbol = typeof Symbol === 'function'
	? Symbol.for('orange-orm.syncClient.syncAndCapturePullJournal')
	: '__orangeOrmSyncClientSyncAndCapturePullJournal';
const readOutboxRowsSymbol = typeof Symbol === 'function'
	? Symbol.for('orange-orm.syncClient.readOutboxRows')
	: '__orangeOrmSyncClientReadOutboxRows';
const applyOutboxRowsSymbol = typeof Symbol === 'function'
	? Symbol.for('orange-orm.syncClient.applyOutboxRows')
	: '__orangeOrmSyncClientApplyOutboxRows';
const applyPullJournalSymbol = typeof Symbol === 'function'
	? Symbol.for('orange-orm.syncClient.applyPullJournal')
	: '__orangeOrmSyncClientApplyPullJournal';
const applySqliteSnapshotSymbol = typeof Symbol === 'function'
	? Symbol.for('orange-orm.syncClient.applySqliteSnapshot')
	: '__orangeOrmSyncClientApplySqliteSnapshot';
const pushPendingSymbol = typeof Symbol === 'function'
	? Symbol.for('orange-orm.syncClient.pushPending')
	: '__orangeOrmSyncClientPushPending';
const setClientIdSymbol = typeof Symbol === 'function'
	? Symbol.for('orange-orm.syncClient.setClientId')
	: '__orangeOrmSyncClientSetClientId';

function newSyncClient(client, getDb, axiosInterceptor, syncInterceptors) {
	const sinceByScope = new Map();
	const ensuredInternalTables = new WeakMap();
	const syncStateTable = 'orange_sync_state';
	const syncClientTable = 'orange_sync_client';
	const syncOutboxTable = 'orange_sync_outbox';
	const syncPullSessionTable = 'orange_sync_pull_session';
	const syncPullItemTable = 'orange_sync_pull_item';
	const syncBaseTable = 'orange_sync_base_tables';
	const syncBasePrefix = 'orange_sync_base_data_';
	const syncBaseIndexPrefix = 'orange_sync_base_idx_';
	const legacyStableBaseSnapshotPendingScope = '__orange_sync_stable_base_snapshot_pending__';
	const initialReadyListeners = new Set();
	const eventListeners = new Map();
	const syncDbByDb = new WeakMap();
	let initialReadyEmitted = false;
	let localSchemaReadyPromise = null;
	let localSchemaReadyResult = null;
	const interceptors = syncInterceptors || createHttpInterceptor();
	const lockedSync = withCrossTabSyncLock(sync);
	const lockedEnsureLocalSchema = withCrossTabSyncLock(ensureLocalSchema);
	const lockedResetLocal = withCrossTabSyncLock(resetLocal);
	const lockedDiscardLocalChanges = withCrossTabSyncLock(discardLocalChanges);
	const serializeSyncWork = createAsyncSerializer();
	const queuedSync = serializeSyncWork(lockedSync);
	const queuedEnsureLocalSchema = serializeSyncWork(lockedEnsureLocalSchema);
	const queuedDiscardLocalChanges = serializeSyncWork(lockedDiscardLocalChanges);
	const observedSync = observeSyncMethod('sync', queuedSync);
	const auto = createSyncAuto({
		sync: observedSync
	}, getConfig);

	const syncClientApi = {
		sync: observedSync,
		ensureLocalSchema: queuedEnsureLocalSchema,
		resetLocal: lockedResetLocal,
		discardLocalChanges: queuedDiscardLocalChanges,
		start: auto.start,
		stop: auto.stop,
		isRunning: auto.isRunning,
		on,
		off,
		once,
		waitForInitialSync,
		interceptors
	};
	Object.defineProperty(syncClientApi, syncAutoStartSymbol, {
		value: auto.startFromConfig
	});
	Object.defineProperty(syncClientApi, ensureLocalSchemaReadySymbol, {
		value: ensureLocalSchemaReady
	});
	Object.defineProperty(syncClientApi, syncAndCapturePullJournalSymbol, {
		value: syncAndCapturePullJournal
	});
	Object.defineProperty(syncClientApi, readOutboxRowsSymbol, {
		value: readOutboxRowsForReplay
	});
	Object.defineProperty(syncClientApi, applyOutboxRowsSymbol, {
		value: applyOutboxRowsForReplay
	});
	Object.defineProperty(syncClientApi, applyPullJournalSymbol, {
		value: applyPullJournalSnapshot
	});
	Object.defineProperty(syncClientApi, applySqliteSnapshotSymbol, {
		value: applyCapturedSqliteSnapshot
	});
	Object.defineProperty(syncClientApi, pushPendingSymbol, {
		value: pushPendingOnly
	});
	Object.defineProperty(syncClientApi, setClientIdSymbol, {
		value: setSharedClientId
	});
	return syncClientApi;

	function withCrossTabSyncLock(fn) {
		return async function lockedSyncMethod(options) {
			const db = await getDb();
			const syncConfig = normalizeSyncConfig(db && db.__sqliteSync);
			if (!syncConfig)
				return fn(options);
			const lock = await resolveRuntimeCrossTabSyncLock(db, syncConfig);
			const lockConfig = withRuntimeCrossTabLockConfig(lock.config, options);
			return runWithCrossTabLock(lock.name, lockConfig, () => fn(options));
		};
	}

	function createAsyncSerializer() {
		let tail = Promise.resolve();
		return function serializeAsyncMethod(fn) {
			return function serializedAsyncMethod(options) {
				const run = tail.then(() => fn(options));
				tail = run.catch(() => {});
				return run;
			};
		};
	}

	async function sync(options = {}) {
		await pull(normalizeSyncOptions(options));
	}

	async function syncAndCapturePullJournal(options = {}) {
		const pullOptions = {
			...normalizePullOptions(options),
			_capturePullJournal: true
		};
		if (typeof options._capturePullJournalChunk === 'function')
			pullOptions._capturePullJournalChunk = options._capturePullJournalChunk;
		if (typeof options._stageSqliteSnapshot === 'function')
			pullOptions._stageSqliteSnapshot = options._stageSqliteSnapshot;
		if (options._deferStableBaseUntilComplete === true)
			pullOptions._deferStableBaseUntilComplete = true;
		if (typeof options._onPullBatchProgress === 'function')
			pullOptions._onPullBatchProgress = options._onPullBatchProgress;
		if (typeof options._onPullStagingSummary === 'function')
			pullOptions._onPullStagingSummary = options._onPullStagingSummary;
		if (options._skipPushBeforePull === true)
			pullOptions._skipPushBeforePull = true;
		return pull(pullOptions);
	}

	async function pushPendingOnly(options = {}) {
		const db = toSyncDb(await getDb());
		const syncConfig = normalizeSyncConfig(db && db.__sqliteSync);
		if (!syncConfig)
			throw new Error('Sync is not configured. Add sync in sqlite options: sqlite(connectionString, { sync: ... })');
		const configuredTables = resolveSyncTables(db, syncConfig.tables, client);
		const hadStableBase = await hasStableBase(db, configuredTables);
		if (!hadStableBase)
			return { phase: 'push', applied: 0, duplicates: 0, results: [], skipped: 'missing-stable-base' };
		const pushConfig = resolvePushConfig(syncConfig, normalizePullOptions(options));
		return pushBeforePull(db, syncConfig, hadStableBase, pushConfig, options);
	}

	async function ensureLocalSchema(options = {}) {
		const result = await prepareLocalSyncSchema(normalizeSyncOptions(options), { allowMissingSync: true });
		return localSchemaReadyResultToPublic(result);
	}

	async function ensureLocalSchemaReady() {
		const result = await getLocalSchemaReady({ allowMissingSync: true });
		return localSchemaReadyResultToPublic(result);
	}

	function localSchemaReadyResultToPublic(result) {
		if (result.skipped)
			return result;
		return {
			skipped: false,
			tables: result.configuredTables,
			schema: result.schemaResult && result.schemaResult.schema,
			checksum: result.schemaResult && result.schemaResult.checksum,
			scope: result.schemaResult && result.schemaResult.scope,
			sql: result.schemaResult && result.schemaResult.sql
		};
	}

	async function getConfig() {
		const db = await getDb();
		return normalizeSyncConfig(db && db.__sqliteSync);
	}

	function toSyncDb(db) {
		if (!db || (typeof db !== 'object' && typeof db !== 'function') || typeof db.query !== 'function')
			return db;
		let syncDb = syncDbByDb.get(db);
		if (syncDb)
			return syncDb;
		syncDb = Object.create(db);
		if (!db.poolFactory)
			syncDb.poolFactory = db;
		syncDb.query = function(query, options) {
			return db.query.call(db, query, withSyncQueryPriority(options));
		};
		syncDbByDb.set(db, syncDb);
		return syncDb;
	}

	function withSyncQueryPriority(options) {
		if (!options || options !== Object(options))
			return { priority: syncDbPriority };
		if (options.priority !== undefined)
			return options;
		return { ...options, priority: syncDbPriority };
	}

	function observeSyncMethod(method, fn) {
		return async function observedSyncMethod(options) {
			try {
				const result = await fn(options);
				const payload = result === undefined ? { method } : { method, result };
				emit(method, payload);
				if (method !== 'sync')
					emit('sync', payload);
				return result;
			}
			catch (error) {
				const payload = { method, error };
				emit(method + '-error', payload);
				emit('error', payload);
				throw error;
			}
		};
	}

	function emit(event, payload) {
		const listeners = eventListeners.get(event);
		if (!listeners)
			return;
		for (const listener of Array.from(listeners))
			listener(payload);
	}

	async function pull(options = {}) {
		const normalizedOptions = normalizePullOptions(options);
		if (options && options._capturePullJournal)
			normalizedOptions._capturePullJournal = true;
		if (options && typeof options._capturePullJournalChunk === 'function')
			normalizedOptions._capturePullJournalChunk = options._capturePullJournalChunk;
		if (options && typeof options._stageSqliteSnapshot === 'function')
			normalizedOptions._stageSqliteSnapshot = options._stageSqliteSnapshot;
		if (options && options._deferStableBaseUntilComplete === true)
			normalizedOptions._deferStableBaseUntilComplete = true;
		if (options && typeof options._onPullBatchProgress === 'function')
			normalizedOptions._onPullBatchProgress = options._onPullBatchProgress;
		if (options && typeof options._onPullStagingSummary === 'function')
			normalizedOptions._onPullStagingSummary = options._onPullStagingSummary;
		if (options && options._skipPushBeforePull === true)
			normalizedOptions._skipPushBeforePull = true;
		const {
			db,
			syncConfig,
			pullConfig,
			configuredTables
		} = await prepareLocalSyncSchema(normalizedOptions);
		const hadStableBase = await hasStableBase(db, configuredTables);
		if (!hadStableBase)
			return runSyncMaintenance(db, () => pullCore(db, syncConfig, pullConfig, configuredTables, hadStableBase, normalizedOptions));
		return pullCore(db, syncConfig, pullConfig, configuredTables, hadStableBase, normalizedOptions);
	}

	async function prepareLocalSyncSchema(options = {}, prepareOptions = {}) {
		const result = await getLocalSchemaReady(prepareOptions);
		if (result.skipped) {
			if (prepareOptions.allowMissingSync)
				return result;
			throw new Error('Sync is not configured. Add sync in sqlite options: sqlite(connectionString, { sync: ... })');
		}
		return {
			...result,
			pullConfig: resolvePullConfig(result.syncConfig, normalizePullOptions(options))
		};
	}

	function getLocalSchemaReady(prepareOptions = {}) {
		if (localSchemaReadyResult)
			return Promise.resolve(localSchemaReadyResult);
		if (localSchemaReadyPromise) {
			return localSchemaReadyPromise.then((result) => {
				if (result.skipped && !prepareOptions.allowMissingSync)
					throw new Error('Sync is not configured. Add sync in sqlite options: sqlite(connectionString, { sync: ... })');
				return result;
			});
		}
		localSchemaReadyPromise = prepareLocalSyncSchemaCore()
			.then((result) => {
				if (!result.skipped)
					localSchemaReadyResult = result;
				if (result.skipped && !prepareOptions.allowMissingSync)
					throw new Error('Sync is not configured. Add sync in sqlite options: sqlite(connectionString, { sync: ... })');
				return result;
			})
			.catch((error) => {
				localSchemaReadyPromise = null;
				throw error;
			});
		return localSchemaReadyPromise;
	}

	function clearLocalSchemaReady() {
		localSchemaReadyPromise = null;
		localSchemaReadyResult = null;
	}

	async function prepareLocalSyncSchemaCore() {
		const db = toSyncDb(await getDb());
		const syncConfig = normalizeSyncConfig(db && db.__sqliteSync);
		if (!syncConfig)
			return { skipped: true };

		const pullConfig = resolvePullConfig(syncConfig);
		const configuredTables = resolveSyncTables(db, pullConfig.tables, client);
		if (!Array.isArray(configuredTables) || configuredTables.length === 0)
			throw new Error('Sync pull requires mapped tables or configured tables. Set sync.tables when the client has no table map.');
		const schemaResult = await runSyncMaintenance(db, async () => {
			const ensuredSchema = await ensureSyncSchema(db, client, configuredTables, syncConfig.schema);
			await cleanupSyncStorage(db, configuredTables);
			return ensuredSchema;
		});
		return {
			skipped: false,
			db,
			syncConfig,
			configuredTables,
			schemaResult
		};
	}

	async function pullCore(db, syncConfig, pullConfig, configuredTables, hadStableBase, options = {}) {
		if (options._skipPushBeforePull !== true)
			await pushBeforePull(db, syncConfig, hadStableBase);
		const pullStartedAtMs = Date.now();
		await maybeEmitInitialReady(syncConfig, configuredTables, db, 'persisted');
		const currentSince = await getScopeSince(configuredTables, db);
		const scopeKey = getScopeKey(configuredTables);
		const requestOptions = {
			tables: configuredTables,
			since: currentSince,
			db,
			scopeKey,
			_capturePullJournal: !!options._capturePullJournal,
			_capturePullJournalChunk: options._capturePullJournalChunk,
			_stageSqliteSnapshot: options._stageSqliteSnapshot,
			_deferStableBaseUntilComplete: options._deferStableBaseUntilComplete === true,
			_onPullBatchProgress: options._onPullBatchProgress,
			_onPullStagingSummary: options._onPullStagingSummary,
			_syncInterceptors: interceptors,
			_syncAxiosInterceptor: axiosInterceptor
		};
		let result;
		try {
			result = await pullStaged(pullConfig, requestOptions);
		}
		catch (e) {
			if (!shouldFallbackToPatch(e))
				throw e;
			result = await pullPatch(pullConfig, requestOptions);
		}
		if (result && result.since !== undefined && result.checkpointApplied !== true)
			await setScopeSince(configuredTables, result.since, db);
		await deleteConfirmedPushedMutations(db, pullStartedAtMs);
		if (!hadStableBase)
			await replayLocalOutbox(db);
		await maybeEmitInitialReady(syncConfig, configuredTables, db, 'sync');
		return result;
	}

	async function resetLocal(options = {}) {
		clearLocalSchemaReady();
		const db = toSyncDb(await getDb());
		const syncConfig = normalizeSyncConfig(db && db.__sqliteSync);
		if (!syncConfig)
			throw new Error('Sync is not configured. Add sync in sqlite options: sqlite(connectionString, { sync: ... })');

		const configuredTables = resolveSyncTables(db, normalizeConfiguredTables(options.tables) || syncConfig.tables, client);
		if (!Array.isArray(configuredTables) || configuredTables.length === 0)
			throw new Error('Sync resetLocal requires mapped tables or configured tables.');
		return runSyncMaintenance(db, async () => {
			const droppedTables = await dropLocalSyncTables(db, client, configuredTables);
			await dropExistingBaseTables(db);
			await db.query(`DROP TABLE IF EXISTS "${syncBaseTable}"`);
			sinceByScope.clear();
			ensuredInternalTables.delete(db);
			clearEnsuredSyncSchema(db);
			initialReadyEmitted = false;
			const schemaResult = await ensureSyncSchema(db, client, configuredTables, syncConfig.schema);
			await cleanupSyncStorage(db, configuredTables);
			return {
				reset: true,
				tables: configuredTables,
				droppedTables,
				schema: schemaResult && schemaResult.schema,
				checksum: schemaResult && schemaResult.checksum,
				scope: schemaResult && schemaResult.scope,
				sql: schemaResult && schemaResult.sql
			};
		});
	}

	async function discardLocalChanges() {
		const db = toSyncDb(await getDb());
		const syncConfig = normalizeSyncConfig(db && db.__sqliteSync);
		if (!syncConfig)
			throw new Error('Sync is not configured. Add sync in sqlite options: sqlite(connectionString, { sync: ... })');
		const configuredTables = resolveSyncTables(db, syncConfig.tables, client);
		if (!await hasStableBase(db, configuredTables))
			throw new Error('Cannot discard local changes before initial sync has completed.');
		await runSyncMaintenance(db, async () => {
			const openRows = await readReplayMutationRows(db, 10000);
			await restoreStableBase(db);
			await ensureSyncOutboxTable(db);
			await db.query([
				`DELETE FROM "${syncOutboxTable}"`,
				'WHERE "status" IN (\'pending\', \'pushed\')'
			].join(' '));
			clearOutboxOperationMemory(openRows);
		});
	}

	async function readOutboxRowsForReplay(options = {}) {
		const db = toSyncDb(await getDb());
		const syncConfig = normalizeSyncConfig(db && db.__sqliteSync);
		if (!syncConfig)
			throw new Error('Sync is not configured. Add sync in sqlite options: sqlite(connectionString, { sync: ... })');
		const replayOptions = normalizeReplayOutboxOptions(options);
		return readMutationRowsByStatus(db, replayOptions.statuses, replayOptions.limit, undefined, replayOptions.after);
	}

	async function setSharedClientId(clientId) {
		if (typeof clientId !== 'string' || clientId.length === 0)
			throw new Error('Shared sync client id must be a non-empty string.');
		const db = toSyncDb(await getDb());
		await ensureSyncClientTable(db);
		const existingRows = await db.query(`SELECT "id" FROM "${syncClientTable}" LIMIT 1`);
		const existingRow = Array.isArray(existingRows) ? existingRows[0] : existingRows?.rows?.[0];
		if (existingRow && (existingRow.id ?? existingRow.ID) === clientId)
			return clientId;
		await db.query([
			`DELETE FROM "${syncClientTable}"`,
			`WHERE "id" <> ${sqlStringLiteral(clientId)}`
		].join(' '));
		await db.query([
			`INSERT INTO "${syncClientTable}" ("id")`,
			`VALUES (${sqlStringLiteral(clientId)})`,
			'ON CONFLICT("id") DO NOTHING'
		].join(' '));
		return clientId;
	}

	async function applyOutboxRowsForReplay(rows, options = {}) {
		const db = toSyncDb(await getDb());
		const syncConfig = normalizeSyncConfig(db && db.__sqliteSync);
		if (!syncConfig)
			throw new Error('Sync is not configured. Add sync in sqlite options: sqlite(connectionString, { sync: ... })');
		const replayOptions = normalizeReplayOutboxOptions(options);
		const list = normalizeOutboxReplayRows(rows);
		await ensureSyncOutboxTable(db);
		if (replayOptions.replaceOpen)
			await replaceOpenOutboxRows(db, list, replayOptions.statuses);
		let inserted = 0;
		let replayed = 0;
		let skipped = 0;
		const errors = [];
		for (let i = 0; i < list.length; i++) {
			const row = list[i];
			const id = outboxRowMutationId(row);
			if (typeof id !== 'string') {
				skipped += 1;
				continue;
			}
			const exists = await hasOutboxRow(db, id);
			if (replayOptions.replay && (!exists || replayOptions.replayExisting)) {
				const mutation = rowToMutation(row);
				if (mutation) {
					try {
						await replayMutation(mutation);
						replayed += 1;
					}
					catch (e) {
						if (!replayOptions.ignoreReplayErrors)
							throw e;
						errors.push({ id, message: e && e.message || String(e) });
					}
				}
			}
			else {
				skipped += 1;
			}
			await insertOutboxRow(db, row);
			inserted += exists ? 0 : 1;
		}
		return { inserted, replayed, skipped, errors };
	}

	async function applyCapturedSqliteSnapshot(snapshot, options = {}) {
		if (!snapshot || snapshot !== Object(snapshot)
			|| !isSqliteSnapshotDescriptor(snapshot.descriptor)
			|| !isSqliteSnapshotBytes(snapshot.bytes)) {
			throw new Error('Invalid captured SQLite snapshot.');
		}
		if (snapshot.cursor === undefined)
			throw new Error('Captured SQLite snapshot does not contain a sync cursor.');
		const {
			db,
			syncConfig,
			configuredTables
		} = await prepareLocalSyncSchema(normalizePullOptions(options));
		const snapshotTables = normalizeConfiguredTables(snapshot.tables);
		const tables = snapshotTables || configuredTables;
		if (!tables.every(table => configuredTables.includes(table)))
			throw new Error('Captured SQLite snapshot contains tables outside the configured sync scope.');
		const scopeKey = typeof snapshot.scopeKey === 'string'
			? snapshot.scopeKey
			: getScopeKey(tables);
		const result = await runSyncMaintenance(db, async () => {
			await ensureSyncStateTable(db);
			await client.transaction(async (tx) => {
				await ensureStableBaseTables(tx, tables);
			}, { suppressSyncOutbox: true });
			await tryEnableForeignKeys(db);
			return importSqliteSnapshotBytes(
				snapshot.descriptor,
				snapshot.bytes,
				db,
				client.tables,
				tables,
				scopeKey,
				snapshot.cursor
			);
		});
		sinceByScope.set(scopeKey, snapshot.cursor);
		await maybeEmitInitialReady(syncConfig, tables, db, 'snapshot-replay');
		return {
			applied: Number(result && result.rowCount || snapshot.descriptor.rowCount || 0),
			tables: tables.slice(),
			since: snapshot.cursor,
			checkpointApplied: true
		};
	}

	async function applyPullJournalSnapshot(journal, options = {}) {
		const db = toSyncDb(await getDb());
		const syncConfig = normalizeSyncConfig(db && db.__sqliteSync);
		if (!syncConfig)
			throw new Error('Sync is not configured. Add sync in sqlite options: sqlite(connectionString, { sync: ... })');
		const pullConfig = resolvePullConfig(syncConfig, normalizePullOptions(options));
		const journalTables = normalizeConfiguredTables(journal && journal.tables);
		const configuredTables = resolveSyncTables(db, journalTables || pullConfig.tables, client);
		if (!Array.isArray(configuredTables) || configuredTables.length === 0)
			throw new Error('Sync pull journal apply requires mapped tables or configured tables.');
		const scopeKey = typeof (journal && journal.scopeKey) === 'string'
			? journal.scopeKey
			: getScopeKey(configuredTables);
		const inlineItems = normalizePullJournalItems(journal && journal.items);
		const readExternalBatch = typeof options._readPullJournalBatch === 'function'
			? options._readPullJournalBatch
			: undefined;
		const readNextBatch = createJournalBatchReader(inlineItems, readExternalBatch);
		const applyConfig = normalizePullApplyConfig(
			options && options.apply !== undefined ? options.apply : pullConfig.apply
		);
		const defaultPatchOptions = { ...(pullConfig.patchOptions || {}), concurrency: 'overwrite', skipSelectAfterInsert: true };
		const checkpointSince = journal && journal.finalSince;
		const shouldApplyCheckpoint = checkpointSince !== undefined;
		const totalItems = normalizeJournalItemCount(
			options._itemCount,
			journal && journal.itemCount,
			inlineItems.length
		);
		let applied = 0;
		let processedItems = 0;
		const touchedTables = new Set();
		await tryEnableForeignKeys(db);
		if (applyConfig)
			await applyPullJournalItemsInChunks();
		else
			await applyPullJournalItemsInSingleTransaction();
		if (shouldApplyCheckpoint)
			sinceByScope.set(scopeKey, checkpointSince);
		return {
			applied,
			tables: Array.from(touchedTables),
			since: checkpointSince,
			checkpointApplied: true
		};

		async function applyPullJournalItemsInSingleTransaction() {
			await client.transaction(async (tx) => {
				await tryDeferForeignKeys(tx);
				await ensureStableBaseTables(tx, configuredTables);
				const baseByName = await readStableBaseEntriesByName(tx);
				let hasItems = false;
				for (;;) {
					const batch = await readNextBatch();
					if (batch === null)
						break;
					if (batch.length === 0)
						continue;
					hasItems = true;
					trackTouchedTables(batch);
					applied += await applyPullJournalBatchOnTx(tx, batch, defaultPatchOptions, baseByName);
					await reportBatchApplied(batch.length);
				}
				assertJournalItemCountComplete();
				if (hasItems)
					await validateForeignKeys(tx);
				if (shouldApplyCheckpoint)
					await writeScopeState(scopeKey, { since: checkpointSince, updatedAtMs: Date.now() }, tx);
			}, { suppressSyncOutbox: true });
		}

		async function applyPullJournalItemsInChunks() {
			const readNextChunk = createSizedJournalBatchReader(readNextBatch, applyConfig.maxRowsPerTransaction);
			let hasItems = false;
			for (;;) {
				const chunk = await readNextChunk();
				if (chunk === null)
					break;
				if (chunk.length === 0)
					continue;
				hasItems = true;
				await client.transaction(async (tx) => {
					await tryDeferForeignKeys(tx);
					await ensureStableBaseTables(tx, configuredTables);
					const baseByName = await readStableBaseEntriesByName(tx);
					trackTouchedTables(chunk);
					applied += await applyPullJournalBatchOnTx(tx, chunk, defaultPatchOptions, baseByName);
					if (chunk.length > 0 && applyConfig.foreignKeyCheck === 'chunk')
						await validateForeignKeys(tx);
				}, { suppressSyncOutbox: true });
				await reportBatchApplied(chunk.length);
				await yieldPullApply(applyConfig);
			}
			assertJournalItemCountComplete();
			await client.transaction(async (tx) => {
				if (hasItems && applyConfig.foreignKeyCheck === 'final')
					await validateForeignKeys(tx);
				if (shouldApplyCheckpoint)
					await writeScopeState(scopeKey, { since: checkpointSince, updatedAtMs: Date.now() }, tx);
			}, { suppressSyncOutbox: true });
		}

		function trackTouchedTables(items) {
			for (let i = 0; i < items.length; i++) {
				const item = items[i];
				if (item && typeof item.table === 'string')
					touchedTables.add(item.table);
			}
		}

		async function reportBatchApplied(itemCount) {
			processedItems += itemCount;
			if (typeof options._onPullJournalBatchApplied === 'function') {
				await options._onPullJournalBatchApplied({
					processedItems,
					totalItems
				});
			}
		}

		function assertJournalItemCountComplete() {
			if (processedItems !== totalItems) {
				throw new Error(
					`Sync pull journal ended after ${processedItems} of ${totalItems} expected items.`
				);
			}
		}
	}

	function createJournalBatchReader(inlineItems, externalReader) {
		let inlineRead = false;
		return async function readNextJournalBatch() {
			if (externalReader) {
				const batch = await externalReader();
				return batch === null || batch === undefined
					? null
					: normalizePullJournalItems(batch);
			}
			if (inlineRead)
				return null;
			inlineRead = true;
			return inlineItems;
		};
	}

	function createSizedJournalBatchReader(readBatch, maxRows) {
		let pending = [];
		let done = false;
		return async function readNextSizedJournalBatch() {
			while (!done && pending.length < maxRows) {
				const batch = await readBatch();
				if (batch === null) {
					done = true;
					break;
				}
				if (batch.length > 0)
					pending.push(...batch);
			}
			if (pending.length === 0)
				return null;
			return pending.splice(0, maxRows);
		};
	}

	function normalizeJournalItemCount(...values) {
		let result = 0;
		for (let i = 0; i < values.length; i++) {
			const parsed = Number(values[i]);
			if (Number.isFinite(parsed) && parsed >= 0)
				result = Math.max(result, parsed);
		}
		return result;
	}

	async function pushPending(options = {}) {
		const db = toSyncDb(await getDb());
		const syncConfig = options._syncConfig || normalizeSyncConfig(db && db.__sqliteSync);
		if (!syncConfig)
			throw new Error('Sync is not configured. Add sync in sqlite options: sqlite(connectionString, { sync: ... })');
		const pushConfig = options._pushConfig || resolvePushConfig(syncConfig, options);
		const configuredTables = resolveSyncTables(db, syncConfig.tables, client);
		await ensureSyncSchema(db, client, configuredTables, syncConfig.schema);
		const limit = normalizeLimit(pushConfig.maxMutationsPerBatch, 1);
		const pending = await readPendingMutations(db, limit);
		if (pending.length === 0)
			return { phase: 'push', applied: 0, duplicates: 0, results: [] };
		const clientId = typeof options.clientId === 'string' ? options.clientId : await getClientId(db);
		let result;
		try {
			result = await sendPush(pushConfig, clientId, pending);
		}
		catch (e) {
			if (isConflictError(e)) {
				if (options._skipConflictRestore === true)
					await markFailedPushBatch(db, pending, e);
				else
					await rollbackFailedPushBatch(db, pending, e);
				emitOperationErrors(pending, e, false);
			}
			else {
				await markPendingMutationAttempts(db, pending, e);
				emitOperationErrors(pending, e, !isConflictError(e));
			}
			throw e;
		}
		const acceptedMutations = await markPushedMutations(db, result, pending);
		attachAcceptedPushMutations(result, acceptedMutations);
		return result;
	}

	async function pushBeforePull(db, syncConfig, hasBase, resolvedPushConfig, pendingOptions = {}) {
		if (!hasBase)
			return;
		const pushConfig = resolvedPushConfig || resolvePushConfig(syncConfig);
		const maxBatches = resolveMaxPushBatches();
		const results = [];
		for (let i = 0; i < maxBatches; i++) {
			const result = await pushPending({
				...pendingOptions,
				_syncConfig: syncConfig,
				_pushConfig: pushConfig
			});
			if (!didPushBatchAdvance(result))
				break;
			results.push(result);
		}
		return combinePushResults(results);
	}

	function didPushBatchAdvance(result) {
		return getAcceptedPushMutations(result).length > 0;
	}

	function combinePushResults(results) {
		if (!Array.isArray(results) || results.length === 0)
			return;
		if (results.length === 1)
			return results[0];
		const combined = {
			phase: 'push',
			applied: 0,
			duplicates: 0,
			results: [],
			batches: results.length
		};
		const acceptedMutations = [];
		for (let i = 0; i < results.length; i++) {
			const result = results[i];
			combined.applied += Number(result && result.applied || 0);
			combined.duplicates += Number(result && result.duplicates || 0);
			if (Array.isArray(result && result.results))
				combined.results.push(...result.results);
			acceptedMutations.push(...getAcceptedPushMutations(result));
		}
		attachAcceptedPushMutations(combined, acceptedMutations);
		return combined;
	}

	async function rollbackFailedPushBatch(db, attemptedMutations, error) {
		return runSyncMaintenance(db, () => rollbackFailedPushBatchCore(db, attemptedMutations, error));
	}

	async function markFailedPushBatch(db, attemptedMutations, error) {
		return runSyncMaintenance(db, async () => {
			await ensureSyncOutboxTable(db);
			for (let i = 0; i < attemptedMutations.length; i++) {
				const failedRow = failedOutboxRow(attemptedMutations[i], error);
				if (failedRow)
					await insertOutboxRow(db, failedRow);
			}
		});
	}

	async function rollbackFailedPushBatchCore(db, attemptedMutations, error) {
		if (!await hasStableBase(db))
			return;
		const remaining = await readReplayMutationRows(db, 10000, mutationIdsToSet(attemptedMutations));
		await restoreStableBase(db);
		await ensureSyncOutboxTable(db);
		for (let i = 0; i < attemptedMutations.length; i++) {
			const failedRow = failedOutboxRow(attemptedMutations[i], error);
			if (failedRow)
				await insertOutboxRow(db, failedRow);
		}
		for (let i = 0; i < remaining.length; i++) {
			const row = remaining[i];
			const mutation = rowToMutation(row);
			if (!mutation)
				continue;
			try {
				await replayMutation(mutation);
				await insertOutboxRow(db, row);
			}
			catch (_e) {
				// A later mutation may depend on the discarded failed batch. Keep local state
				// consistent by not restoring mutations that cannot replay on the base.
			}
		}
		sinceByScope.clear();
		ensuredInternalTables.delete(db);
		clearEnsuredSyncSchema(db);
		initialReadyEmitted = false;
	}

	async function replayLocalOutbox(db) {
		const rows = await readReplayMutationRows(db, 10000);
		for (let i = 0; i < rows.length; i++) {
			const mutation = rowToMutation(rows[i]);
			if (mutation)
				await replayMutation(mutation);
		}
	}

	async function replayMutation(mutation) {
		const patches = mutationToPatchEntries(mutation);
		const commands = Array.isArray(mutation.commands) ? mutation.commands : [];
		if (patches.length === 0 && commands.length === 0)
			return;
		await client.transaction(async (tx) => {
			await tryDeferForeignKeys(tx);
			for (let i = 0; i < patches.length; i++) {
				const entry = patches[i];
				if (!tx[entry.table] || typeof tx[entry.table].patch !== 'function')
					throw new Error(`Table "${entry.table}" does not exist in this client`);
				await tx[entry.table].patch(entry.patch, {
					...(entry.options || {}),
					concurrency: 'overwrite',
					skipSelectAfterInsert: true
				});
			}
			await validateForeignKeys(tx);
		}, { suppressSyncOutbox: true });
	}

	function mutationToPatchEntries(mutation) {
		if (!mutation || mutation !== Object(mutation))
			return [];
		if (Array.isArray(mutation.patches))
			return mutation.patches.map(normalizeMutationPatch).filter(Boolean);
		const entry = normalizeMutationPatch(mutation);
		return entry ? [entry] : [];
	}

	async function sendPush(pushConfig, clientId, mutations) {
		return requestPayload({
			...pushConfig,
			syncPhase: 'push',
			body: {
				phase: 'push',
				clientId,
				mutations: mutations.map(stripMutationForPush)
			}
		}, {
			_syncInterceptors: interceptors,
			_syncAxiosInterceptor: axiosInterceptor
		});
	}

	function isConflictError(error) {
		return Number(error && error.response && error.response.status) === 409
			|| Number(error && error.status) === 409;
	}

	async function pullStaged(pullConfig, options) {
		const stagingStartedAtMs = Date.now();
		const maxRowsPerBatch = normalizeLimit(pullConfig.maxRowsPerBatch, 1000);
		const maxConcurrentRowRequests = normalizeConcurrency(pullConfig.maxConcurrentRowRequests, 1);
		const maxKeysPerBatch = normalizeLimit(pullConfig.maxKeysPerBatch, maxRowsPerBatch * maxConcurrentRowRequests);
		const maxJournalRowsPerInsert = normalizeLimit(pullConfig.maxJournalRowsPerInsert, maxRowsPerBatch);
		const applyConfig = normalizePullApplyConfig(pullConfig.apply);
		const defaultPatchOptions = { ...(pullConfig.patchOptions || {}), concurrency: 'overwrite', skipSelectAfterInsert: true };
		const db = options.db;
		const scopeKey = options.scopeKey || getScopeKey(options.tables);
		const capturedStreamItems = [];
		const capturePullJournalChunk = typeof options._capturePullJournalChunk === 'function'
			? options._capturePullJournalChunk
			: null;
		const deferStableBaseUntilComplete = options._deferStableBaseUntilComplete === true;
		const stagingTimings = newPullStagingTimings(deferStableBaseUntilComplete);
		let capturedStreamItemCount = 0;
		let capturedApplicableItemCount = 0;
		let snapshotAppliedRows = 0;
		let snapshotApplied = false;
		const streamedTables = new Set();
		let applied = 0;
		await ensurePullJournalTables(db);
		await tryEnableForeignKeys(db);
		const session = await stagePullJournal();
		const capturedPullJournal = options._capturePullJournal
			? await capturePullJournalSnapshot(session)
			: null;
		const shouldApplyCheckpoint = session.finalSince !== undefined;
		if (isStreamPullSession(session)) {
			applied = snapshotAppliedRows || capturedApplicableItemCount;
			await finalizeStreamedPullJournal(session);
		}
		else if (applyConfig)
			await applyPullJournalInChunks(session, applyConfig);
		else
			await applyPullJournalInSingleTransaction(session);
		if (shouldApplyCheckpoint)
			sinceByScope.set(scopeKey, session.finalSince);
		stagingTimings.applied = applied;
		stagingTimings.elapsedMs = elapsedMs(stagingStartedAtMs);
		notifyPullDiagnostic(options._onPullStagingSummary, { ...stagingTimings });

		const result = {
			applied,
			tables: session.tables || [],
			since: session.finalSince,
			payload: session.payload,
			checkpointApplied: true
		};
		if (capturedPullJournal) {
			Object.defineProperty(result, '__orangePullJournal', {
				value: {
					...capturedPullJournal,
					tables: session.tables || capturedPullJournal.tables
				},
				enumerable: false,
				configurable: true
			});
		}
		return result;

		async function capturePullJournalSnapshot(session) {
			const items = isStreamPullSession(session)
				? capturePullJournalChunk ? [] : capturedStreamItems.slice()
				: flattenPullJournalBatches(session && session.persisted
					? await readPullJournalBatches(db, scopeKey)
					: []);
			return {
				scopeKey,
				tables: Array.isArray(options.tables) ? options.tables.slice() : [],
				since: session && session.since,
				finalSince: session && session.finalSince,
				payload: session && session.payload,
				reason: session && session.reason,
				itemCount: isStreamPullSession(session) ? capturedStreamItemCount : items.length,
				items
			};
		}

		async function finalizeStreamedPullJournal(session) {
			const hasJournalItems = capturedStreamItemCount > 0;
			await client.transaction(async (tx) => {
				if (hasJournalItems && (!applyConfig || applyConfig.foreignKeyCheck === 'final'))
					await validateForeignKeys(tx);
				if (deferStableBaseUntilComplete && !snapshotApplied) {
					const bulkStableBaseStartedAtMs = Date.now();
					await copyTablesToStableBase(tx, options.tables);
					stagingTimings.bulkStableBaseMs += elapsedMs(bulkStableBaseStartedAtMs);
				}
				if (shouldApplyCheckpoint)
					await writeScopeState(scopeKey, { since: session.finalSince, updatedAtMs: Date.now() }, tx);
				if (hasJournalItems || session.persisted)
					await clearPullJournal(tx, scopeKey);
			}, { suppressSyncOutbox: true });
			session.tables = Array.from(streamedTables);
		}

		async function applyPullJournalInSingleTransaction(session) {
			await client.transaction(async (tx) => {
				await tryDeferForeignKeys(tx);
				await ensureStableBaseTables(tx, options.tables);
				const batches = await readPullJournalBatches(tx, scopeKey);
				const hasJournalItems = batches.length > 0;
				const touchedTables = new Set();
				for (let i = 0; i < batches.length; i++) {
					const batch = batches[i];
					for (let itemIndex = 0; itemIndex < batch.length; itemIndex++)
						touchedTables.add(batch[itemIndex].table);
					const deleteItems = batch.filter(x => x.op === 'D');
					const upsertItems = batch.filter(x => x.op !== 'D' && x.row !== undefined);
					if (deleteItems.length > 0) {
						applied += await applyDeleteItemsOnTx(tx, deleteItems, defaultPatchOptions);
						await applyDeleteItemsToStableBase(tx, deleteItems);
					}
					if (upsertItems.length > 0) {
						applied += await applyRowsPayloadOnTx(tx, upsertItems, defaultPatchOptions);
						await applyRowsPayloadToStableBase(tx, upsertItems);
					}
				}
				if (hasJournalItems)
					await validateForeignKeys(tx);
				if (shouldApplyCheckpoint)
					await writeScopeState(scopeKey, { since: session.finalSince, updatedAtMs: Date.now() }, tx);
				if (hasJournalItems || session.persisted)
					await clearPullJournal(tx, scopeKey);
				session.tables = Array.from(touchedTables);
			}, { suppressSyncOutbox: true });
		}

		async function applyPullJournalInChunks(session, applyConfig) {
			let items = [];
			await client.transaction(async (tx) => {
				await ensureStableBaseTables(tx, options.tables);
				items = flattenPullJournalBatches(await readPullJournalBatches(tx, scopeKey));
			}, { suppressSyncOutbox: true });
			const touchedTables = new Set();
			for (let offset = 0; offset < items.length; offset += applyConfig.maxRowsPerTransaction) {
				const chunk = items.slice(offset, offset + applyConfig.maxRowsPerTransaction);
				await client.transaction(async (tx) => {
					await tryDeferForeignKeys(tx);
					const baseByName = await readStableBaseEntriesByName(tx);
					for (let i = 0; i < chunk.length; i++) {
						const item = chunk[i];
						if (item && typeof item.table === 'string')
							touchedTables.add(item.table);
					}
					applied += await applyPullJournalBatchOnTx(
						tx,
						chunk,
						defaultPatchOptions,
						baseByName
					);
					if (chunk.length > 0 && applyConfig.foreignKeyCheck === 'chunk')
						await validateForeignKeys(tx);
				}, { suppressSyncOutbox: true });
				await yieldPullApply(applyConfig);
			}
			await client.transaction(async (tx) => {
				if (items.length > 0 && applyConfig.foreignKeyCheck === 'final')
					await validateForeignKeys(tx);
				if (shouldApplyCheckpoint)
					await writeScopeState(scopeKey, { since: session.finalSince, updatedAtMs: Date.now() }, tx);
				if (items.length > 0 || session.persisted)
					await clearPullJournal(tx, scopeKey);
			}, { suppressSyncOutbox: true });
			session.tables = Array.from(touchedTables);
		}

		async function stagePullJournal() {
			let session = await readPullSession(db, scopeKey);
			let hasPersistedSession = !!session;
			const streamApply = session
				? isStreamPullSession(session)
				: !!options._capturePullJournal;
			if (session) {
				session.persisted = true;
				if (!session.done)
					await clearIncompletePullJournalBatch(db, scopeKey, session.nextBatch);
			}
			if (!session)
				session = newPullSession(scopeKey, options.since, streamApply);
			if (streamApply) {
				await client.transaction(async (tx) => {
					await ensureStableBaseTables(tx, options.tables);
				}, { suppressSyncOutbox: true });
				if (hasPersistedSession) {
					const persistedItems = await readPullJournalItemsPaged(db, scopeKey);
					await captureStreamItems(persistedItems);
					for (let i = 0; i < persistedItems.length; i++)
						streamedTables.add(persistedItems[i].table);
				}
			}
			let reason = session.reason;
			let fetchSession = session;
			let fetchDone = !!session.done;
			let keyFetchError = null;
			let emptySession = null;
			let pumpRunning = false;
			let pipelineStopped = false;
			let fetchedBatches = 0;
			const maxBufferedKeyBatches = 2;
			const maxBufferedRowJobs = maxConcurrentRowRequests * 2;
			const pendingBatches = [];
			const waiters = [];
			const rowScheduler = createPullRowsScheduler(onPipelineProgress);

			async function captureStreamItems(items) {
				const list = Array.isArray(items) ? items : [];
				if (list.length === 0)
					return 0;
				capturedStreamItemCount += list.length;
				capturedApplicableItemCount += countApplicablePullJournalItems(list);
				const captureStartedAtMs = Date.now();
				if (capturePullJournalChunk)
					await capturePullJournalChunk(list);
				else
					capturedStreamItems.push(...list);
				return elapsedMs(captureStartedAtMs);
			}

			startPullBatchPump();
			try {
				for (;;) {
					if (emptySession) {
						pipelineStopped = true;
						rowScheduler.stop();
						return emptySession;
					}
					const batch = pendingBatches[0];
					if (!batch) {
						if (keyFetchError)
							throw keyFetchError;
						if (fetchDone)
							return session;
						await waitForPipelineChange();
						continue;
					}
					const batchStartedAtMs = Date.now();
					await batch.rowsPromise;
					const persisted = await persistPullJournalBatchState(
						db,
						scopeKey,
						session,
						batch,
						maxJournalRowsPerInsert,
						streamApply ? {
							applyConfig,
							defaultPatchOptions,
							deferStableBaseUntilComplete,
							onApplied(count, items) {
								applied += count;
								for (let i = 0; i < items.length; i++)
									streamedTables.add(items[i].table);
							}
						} : undefined
					);
					session = persisted.session;
					const deltaPersistMs = streamApply
						? await captureStreamItems(persisted.items)
						: 0;
					const batchProgress = {
						batchNo: batch.batchNo,
						keyCount: batch.keyItems.length,
						rowCount: persisted.items.length,
						rowsElapsedMs: batch.rowsReadyAtMs === undefined
							? 0
							: Math.max(0, batch.rowsReadyAtMs - batch.createdAtMs),
						deltaPersistMs,
						elapsedMs: elapsedMs(batchStartedAtMs),
						deferredStableBase: deferStableBaseUntilComplete,
						...persisted.timings
					};
					addPullBatchTimings(stagingTimings, batchProgress);
					notifyPullDiagnostic(options._onPullBatchProgress, batchProgress);
					pendingBatches.shift();
					onPipelineProgress();
					if (keyFetchError && pendingBatches.length === 0)
						throw keyFetchError;
				}
			}
			catch (e) {
				pipelineStopped = true;
				rowScheduler.stop();
				throw e;
			}

			function startPullBatchPump() {
				if (pumpRunning || !shouldFetchMorePullBatches())
					return;
				pumpRunning = true;
				Promise.resolve()
					.then(pumpPullBatches)
					.catch((error) => {
						keyFetchError = error;
					})
					.finally(() => {
						pumpRunning = false;
						notifyPipelineChange();
						if (shouldFetchMorePullBatches())
							startPullBatchPump();
					});
			}

			async function pumpPullBatches() {
				while (shouldFetchMorePullBatches()) {
					fetchedBatches += 1;
					if (fetchedBatches > 10000)
						throw new Error('Sync failed: staged pull exceeded max iterations');
					const batch = await fetchPullBatch(fetchSession, reason);
					if (pipelineStopped)
						return;
					reason = batch.reason;
					if (!hasPersistedSession && batch.done && batch.keyItems.length === 0) {
						emptySession = {
							...fetchSession,
							token: batch.token || undefined,
							done: true,
							finalSince: batch.finalSince,
							payload: batch.payload,
							reason,
							status: 'ready',
							persisted: false
						};
						fetchDone = true;
						return;
					}
					if (!hasPersistedSession) {
						session = await createPullSession(db, scopeKey, session.since, streamApply);
						fetchSession = {
							...fetchSession,
							persisted: true
						};
						hasPersistedSession = true;
					}
					const batchState = createPullBatchState(fetchSession, batch);
					pendingBatches.push(batchState);
					rowScheduler.enqueueBatch(batchState);
					fetchSession = previewPullSessionAfterFetch(fetchSession, batch);
					fetchDone = batch.done;
					notifyPipelineChange();
				}
			}

			function shouldFetchMorePullBatches() {
				return !fetchDone
					&& !pipelineStopped
					&& !keyFetchError
					&& !emptySession
					&& !rowScheduler.hasFailure()
					&& pendingBatches.length < maxBufferedKeyBatches
					&& rowScheduler.workCount() < maxBufferedRowJobs;
			}

			function onPipelineProgress() {
				notifyPipelineChange();
				startPullBatchPump();
			}

			function notifyPipelineChange() {
				const current = waiters.splice(0);
				for (let i = 0; i < current.length; i++)
					current[i]();
			}

			function waitForPipelineChange() {
				return new Promise((resolve) => {
					waiters.push(resolve);
				});
			}
		}

		async function fetchPullBatch(session, reason) {
			let keysPayload = await requestPayload({
				...pullConfig,
				body: {
					phase: 'keys',
					token: session.token,
					since: session.since,
					tables: options.tables,
					limit: maxKeysPerBatch,
					inlineRows: true,
					sqliteSnapshot: session.since === undefined
				}
			}, options);
			if (isSqliteSnapshotPayload(keysPayload)) {
				try {
					const imported = await importSqliteSnapshot(
						keysPayload.snapshot,
						pullConfig,
						db,
						client.tables,
						options.tables,
						scopeKey,
						keysPayload.cursor,
						options
					);
					snapshotApplied = true;
					snapshotAppliedRows = imported.rowCount;
					for (const tableName of options.tables || []) streamedTables.add(tableName);
				}
				catch (error) {
					if (error && error.__orangeSqliteSnapshotImported)
						throw error;
					if (typeof console !== 'undefined' && typeof console.warn === 'function')
						console.warn('[sqlite-snapshot] import failed; falling back to inline rows', error);
					keysPayload = await requestPayload({
						...pullConfig,
						body: {
							phase: 'keys',
							token: session.token,
							since: session.since,
							tables: options.tables,
							limit: maxKeysPerBatch,
							inlineRows: true,
							sqliteSnapshot: false
						}
					}, options);
				}
			}
			if (!isStagedKeysPayload(keysPayload))
				throw new Error('Sync endpoint did not return staged keys payload');
			const nextReason = reason === undefined && keysPayload.reason !== undefined
				? keysPayload.reason
				: reason;
			const keyItems = normalizeKeyItems(keysPayload.items);
			const token = keysPayload.done || !keysPayload.token ? null : keysPayload.token;
			const done = keysPayload.done || !keysPayload.token;
			const finalSince = keysPayload.cursor !== undefined ? keysPayload.cursor : session.finalSince;
			const checkpointPayload = stripInlineRowsFromKeysPayload(keysPayload);
			const payload = nextReason === undefined ? checkpointPayload : { ...checkpointPayload, reason: nextReason };
			return {
				keysPayload,
				keyItems,
				token,
				done,
				finalSince,
				payload,
				reason: nextReason
			};
		}

		function createPullBatchState(session, batch) {
			const batchNo = session.nextBatch || 0;
			const baseSeq = session.nextSeq || 0;
			const itemState = createPullJournalItemState(batch.keyItems, batchNo, baseSeq);
			let resolveRows;
			let rejectRows;
			const rowsPromise = new Promise((resolve, reject) => {
				resolveRows = resolve;
				rejectRows = reject;
			});
			rowsPromise.catch(() => {});
			markDeletePullJournalRowsReady(itemState);
			markInlinePullJournalRowsReady(itemState);
			return {
				...batch,
				createdAtMs: Date.now(),
				batchNo,
				baseSeq,
				itemState,
				pendingRowJobs: 0,
				rowsSettled: false,
				rowsPromise,
				resolveRows,
				rejectRows
			};
		}

		function previewPullSessionAfterFetch(session, batch) {
			return {
				...session,
				token: batch.token || undefined,
				done: batch.done,
				finalSince: batch.finalSince,
				payload: batch.payload,
				reason: batch.reason,
				status: batch.done ? 'ready' : 'pending',
				nextSeq: (session.nextSeq || 0) + batch.keyItems.length,
				nextBatch: (session.nextBatch || 0) + 1
			};
		}

		function createPullRowsScheduler(onProgress) {
			const queue = [];
			let active = 0;
			let stopped = false;
			let failedBatchNo = null;
			return {
				enqueueBatch,
				workCount,
				hasFailure,
				stop
			};

			function enqueueBatch(batchState) {
				const upsertItems = batchState.keyItems.filter(x => x.op !== 'D' && x.row === undefined);
				const chunks = chunkItems(upsertItems, maxRowsPerBatch);
				batchState.pendingRowJobs = chunks.length;
				if (chunks.length === 0) {
					resolveBatchRows(batchState);
					onProgress();
					return;
				}
				for (let i = 0; i < chunks.length; i++)
					queue.push({ batchState, items: chunks[i] });
				drain();
				onProgress();
			}

			function workCount() {
				return active + queue.length;
			}

			function hasFailure() {
				return failedBatchNo !== null;
			}

			function stop() {
				stopped = true;
				queue.length = 0;
			}

			function drain() {
				if (stopped)
					return;
				while (active < maxConcurrentRowRequests) {
					const index = nextRunnableJobIndex();
					if (index === -1)
						return;
					const job = queue.splice(index, 1)[0];
					active += 1;
					runRowJob(job);
				}
			}

			function nextRunnableJobIndex() {
				for (let i = 0; i < queue.length; i++) {
					if (failedBatchNo === null || queue[i].batchState.batchNo < failedBatchNo)
						return i;
				}
				return -1;
			}

			async function runRowJob(job) {
				try {
					const currentRowsResult = await requestRowsItems(job.items);
					if (currentRowsResult.error)
						throw currentRowsResult.error;
					const payload = currentRowsResult.payload;
					if (!isRowsPayload(payload))
						throw new Error('Sync endpoint did not return rows payload');
					acceptRowsPayload(job.batchState, job.items, payload);
				}
				catch (e) {
					if (failedBatchNo === null || job.batchState.batchNo < failedBatchNo)
						failedBatchNo = job.batchState.batchNo;
					rejectBatchRows(job.batchState, e);
				}
				finally {
					active -= 1;
					finishRowJob(job.batchState);
					onProgress();
					drain();
				}
			}

			function acceptRowsPayload(batchState, currentItems, payload) {
				const acceptedCount = getRowsAcceptedCount(payload, currentItems.length);
				const acceptedItems = acceptedCount < currentItems.length
					? currentItems.slice(0, acceptedCount)
					: currentItems;
				const missingItems = getMissingRowItems(acceptedItems, payload.items);
				let finalMissingItems = [];
				if (acceptedCount < currentItems.length) {
					const deferredItems = currentItems.slice(acceptedCount);
					const missingChunks = requeueMissingRowChunks(acceptedItems, missingItems);
					if (!missingChunks.requeued)
						finalMissingItems = missingItems;
					const requeuedChunks = [];
					if (deferredItems.length > 0)
						requeuedChunks.push(deferredItems);
					for (let i = 0; i < missingChunks.chunks.length; i++)
						requeuedChunks.push(missingChunks.chunks[i]);
					addRowJobsFront(batchState, requeuedChunks);
				}
				else {
					const missingChunks = requeueMissingRowChunks(currentItems, missingItems);
					if (!missingChunks.requeued)
						finalMissingItems = missingItems;
					addRowJobsFront(batchState, missingChunks.chunks);
				}
				markReturnedPullJournalRows(batchState.itemState, payload.items);
				markMissingPullJournalRows(batchState.itemState, finalMissingItems);
			}

			function requeueMissingRowChunks(requestedItems, missingItems) {
				const chunks = [];
				const requeued = enqueueMissingRows(chunks, requestedItems, missingItems);
				return { requeued, chunks };
			}

			function addRowJobsFront(batchState, chunks) {
				const validChunks = chunks.filter(chunk => Array.isArray(chunk) && chunk.length > 0);
				if (validChunks.length === 0)
					return;
				batchState.pendingRowJobs += validChunks.length;
				for (let i = validChunks.length - 1; i >= 0; i--)
					queue.unshift({ batchState, items: validChunks[i] });
			}

			function finishRowJob(batchState) {
				if (batchState.pendingRowJobs > 0)
					batchState.pendingRowJobs -= 1;
				if (batchState.pendingRowJobs === 0 && !batchState.rowsSettled)
					resolveBatchRows(batchState);
			}

			function resolveBatchRows(batchState) {
				if (batchState.rowsSettled)
					return;
				batchState.rowsSettled = true;
				batchState.rowsReadyAtMs = Date.now();
				batchState.resolveRows();
			}

			function rejectBatchRows(batchState, error) {
				if (batchState.rowsSettled)
					return;
				batchState.rowsSettled = true;
				batchState.rejectRows(error);
			}
		}

		function requestRowsItems(items) {
			return requestPayload({
				...pullConfig,
				body: {
					phase: 'rows',
					items
				}
			}, options)
				.then(
					(payload) => ({ payload, error: null }),
					(error) => ({ payload: null, error })
				);
		}
	}

	async function pullPatch(pullConfig, options) {
		const payload = await requestPayload(pullConfig, options);
		const tablePatches = extractTablePatches(payload);
		const defaultPatchOptions = { ...(pullConfig.patchOptions || {}), concurrency: 'overwrite' };
		let applied = 0;
		if (tablePatches.length > 0) {
			await client.transaction(async (tx) => {
				await tryDeferForeignKeys(tx);
				for (let i = 0; i < tablePatches.length; i++) {
					const entry = tablePatches[i];
					if (!tx[entry.table] || typeof tx[entry.table].patch !== 'function')
						throw new Error(`Table "${entry.table}" does not exist in this client`);
					const patchOptions = { ...defaultPatchOptions, ...(entry.options || {}), concurrency: 'overwrite' };
					await tx[entry.table].patch(entry.patch, patchOptions);
					applied += entry.patch.length;
				}
				await validateForeignKeys(tx);
				await copyTablesToStableBase(tx, tablePatches.map(x => x.table));
			}, { suppressSyncOutbox: true });
		}
		return {
			applied,
			tables: tablePatches.map(x => x.table),
			since: payload && (payload.since ?? payload.cursor),
			payload
		};
	}

	function normalizePullOptions(input) {
		if (!input || input !== Object(input))
			return {};
		const timeoutMs = normalizeTimeoutMs(input.timeoutMs);
		const result = {};
		if (timeoutMs !== undefined)
			result.timeoutMs = timeoutMs;
		return result;
	}

	function normalizeSyncOptions(input) {
		if (!input || input !== Object(input))
			return {};
		const keys = Object.keys(input);
		const invalidKeys = keys.filter(key => key !== 'timeoutMs');
		if (invalidKeys.length > 0)
			throw new Error(`Unsupported sync option "${invalidKeys[0]}". sync only accepts { timeoutMs }.`);
		return normalizePullOptions(input);
	}

	function normalizeMutationPatch(input) {
		if (!input || input !== Object(input))
			return null;
		if (typeof input.table !== 'string' || input.table.length === 0)
			return null;
		if (!Array.isArray(input.patch))
			return null;
		return {
			table: input.table,
			patch: input.patch,
			options: input.options
		};
	}

	function normalizeTimeoutMs(value) {
		const parsed = Number.parseInt(value, 10);
		if (!Number.isFinite(parsed) || parsed <= 0)
			return undefined;
		return parsed;
	}

	async function getScopeSince(tables, db) {
		const scopeKey = getScopeKey(tables);
		if (sinceByScope.has(scopeKey))
			return sinceByScope.get(scopeKey);
		const persisted = await readScopeSince(scopeKey, db);
		if (persisted !== undefined)
			sinceByScope.set(scopeKey, persisted);
		return persisted;
	}

	async function setScopeSince(tables, since, db) {
		const scopeKey = getScopeKey(tables);
		sinceByScope.set(scopeKey, since);
		await writeScopeState(scopeKey, { since, updatedAtMs: Date.now() }, db);
	}

	function getScopeKey(tables) {
		if (!Array.isArray(tables) || tables.length === 0)
			return '*';
		const dedup = Array.from(new Set(tables.filter(x => typeof x === 'string')));
		dedup.sort();
		return dedup.join('|');
	}

	async function ensureSyncStateTable(db) {
		if (isInternalTableEnsured(db, syncStateTable))
			return;
		await db.query([
			`CREATE TABLE IF NOT EXISTS "${syncStateTable}" (`,
			'"scope" TEXT PRIMARY KEY,',
			'"since_value" TEXT NOT NULL',
			');'
		].join(' '));
		markInternalTableEnsured(db, syncStateTable);
	}

	async function ensureSyncClientTable(db) {
		if (isInternalTableEnsured(db, syncClientTable))
			return;
		await db.query([
			`CREATE TABLE IF NOT EXISTS "${syncClientTable}" (`,
			'"id" TEXT PRIMARY KEY',
			');'
		].join(' '));
		markInternalTableEnsured(db, syncClientTable);
	}

	async function ensureSyncOutboxTable(db) {
		if (isInternalTableEnsured(db, syncOutboxTable))
			return;
		await db.query(outboxTableSql(syncOutboxTable));
		await ensureOutboxOperationColumns((sql) => db.query(sql), syncOutboxTable);
		markInternalTableEnsured(db, syncOutboxTable);
	}

	async function ensurePullJournalTables(db) {
		if (isInternalTableEnsured(db, syncPullSessionTable) && isInternalTableEnsured(db, syncPullItemTable))
			return;
		await db.query([
			`CREATE TABLE IF NOT EXISTS "${syncPullSessionTable}" (`,
			'"scope" TEXT PRIMARY KEY,',
			'"since_value" TEXT,',
			'"token_json" TEXT,',
			'"done" INTEGER NOT NULL DEFAULT 0,',
			'"final_since" TEXT,',
			'"payload_json" TEXT,',
			'"reason" TEXT,',
			'"status" TEXT NOT NULL,',
			'"next_seq" INTEGER NOT NULL DEFAULT 0,',
			'"next_batch" INTEGER NOT NULL DEFAULT 0,',
			'"updated_at_ms" INTEGER NOT NULL',
			');'
		].join(' '));
		await db.query([
			`CREATE TABLE IF NOT EXISTS "${syncPullItemTable}" (`,
			'"scope" TEXT NOT NULL,',
			'"batch_no" INTEGER NOT NULL,',
			'"seq" INTEGER NOT NULL,',
			'"table_name" TEXT NOT NULL,',
			'"pk_json" TEXT NOT NULL,',
			'"key_json" TEXT,',
			'"op" TEXT NOT NULL,',
			'"row_json" TEXT,',
			'PRIMARY KEY ("scope", "seq")',
			');'
		].join(' '));
		await db.query(`CREATE INDEX IF NOT EXISTS "${syncPullItemTable}_batch_idx" ON "${syncPullItemTable}" ("scope", "batch_no", "seq")`);
		markInternalTableEnsured(db, syncPullSessionTable);
		markInternalTableEnsured(db, syncPullItemTable);
	}

	async function readPullSession(db, scopeKey) {
		await ensurePullJournalTables(db);
		const rows = await db.query([
			'SELECT "scope", "since_value", "token_json", "done", "final_since", "payload_json", "reason", "status", "next_seq", "next_batch"',
			`FROM "${syncPullSessionTable}"`,
			`WHERE "scope" = ${sqlStringLiteral(scopeKey)}`,
			'LIMIT 1'
		].join(' '));
		const row = Array.isArray(rows) ? rows[0] : rows?.rows?.[0];
		if (!row)
			return null;
		return pullSessionFromRow(row);
	}

	async function createPullSession(db, scopeKey, since, streamApply = false) {
		await ensurePullJournalTables(db);
		const now = Date.now();
		const status = streamApply ? streamPullPendingStatus : 'pending';
		await db.query([
			`INSERT INTO "${syncPullSessionTable}" ("scope", "since_value", "token_json", "done", "final_since", "payload_json", "reason", "status", "next_seq", "next_batch", "updated_at_ms")`,
			`VALUES (${sqlStringLiteral(scopeKey)}, ${sqlNullableJsonLiteral(since)}, NULL, 0, ${sqlNullableJsonLiteral(since)}, NULL, NULL, ${sqlStringLiteral(status)}, 0, 0, ${now})`
		].join(' '));
		return newPullSession(scopeKey, since, streamApply);
	}

	function newPullSession(scopeKey, since, streamApply = false) {
		return {
			scope: scopeKey,
			since,
			token: undefined,
			done: false,
			finalSince: since,
			payload: undefined,
			reason: undefined,
			status: streamApply ? streamPullPendingStatus : 'pending',
			nextSeq: 0,
			nextBatch: 0
		};
	}

	async function persistPullJournalBatchState(db, scopeKey, session, batchState, maxJournalRowsPerInsert, streamOptions) {
		await batchState.rowsPromise;
		const batchNo = batchState.batchNo;
		const baseSeq = batchState.baseSeq;
		const itemState = batchState.itemState;
		const keysPayload = batchState.keysPayload;
		const keyItems = batchState.keyItems;
		const reason = batchState.reason;
		const entries = pullJournalEntriesForRemainingItems(scopeKey, itemState);
		const streamApply = !!streamOptions;
		const applyConfig = streamOptions && streamOptions.applyConfig;
		const maxRowsPerTransaction = applyConfig
			? applyConfig.maxRowsPerTransaction
			: Math.max(1, entries.items.length);
		const chunks = entries.items.length === 0
			? [{ items: [], rows: [] }]
			: [];
		for (let offset = 0; offset < entries.items.length; offset += maxRowsPerTransaction) {
			chunks.push({
				items: entries.items.slice(offset, offset + maxRowsPerTransaction),
				rows: entries.rows.slice(offset, offset + maxRowsPerTransaction)
			});
		}
		let nextSession;
		const timings = newPullBatchTimings();
		for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex++) {
			const chunk = chunks[chunkIndex];
			const isLastChunk = chunkIndex === chunks.length - 1;
			let chunkApplied = 0;
			const transactionStartedAtMs = Date.now();
			let transactionBodyMs = 0;
			await client.transaction(async (tx) => {
				const transactionBodyStartedAtMs = Date.now();
				const journalInsertStartedAtMs = Date.now();
				await insertPullJournalItems(tx, chunk.rows, maxJournalRowsPerInsert);
				timings.journalInsertMs += elapsedMs(journalInsertStartedAtMs);
				if (streamApply && chunk.items.length > 0) {
					await tryDeferForeignKeys(tx);
					chunkApplied = await applyPullJournalBatchOnTx(
						tx,
						chunk.items,
						streamOptions.defaultPatchOptions,
						undefined,
						{
							deferStableBase: streamOptions.deferStableBaseUntilComplete === true,
							timings
						}
					);
					if (applyConfig && applyConfig.foreignKeyCheck === 'chunk')
						await validateForeignKeys(tx);
				}
				if (!isLastChunk) {
					transactionBodyMs = elapsedMs(transactionBodyStartedAtMs);
					return;
				}
				const finalSince = keysPayload.cursor !== undefined ? keysPayload.cursor : session.finalSince;
				const payload = reason === undefined ? keysPayload : { ...keysPayload, reason };
				const token = keysPayload.done || !keysPayload.token ? null : keysPayload.token;
				const done = keysPayload.done || !keysPayload.token ? 1 : 0;
				const nextSeq = baseSeq + keyItems.length;
				const status = streamApply
					? done ? streamPullReadyStatus : streamPullPendingStatus
					: done ? 'ready' : 'pending';
				const sessionUpdateStartedAtMs = Date.now();
				await tx.query([
					`UPDATE "${syncPullSessionTable}"`,
					`SET "token_json" = ${sqlNullableJsonLiteral(token)},`,
					`"done" = ${done},`,
					`"final_since" = ${sqlNullableJsonLiteral(finalSince)},`,
					`"payload_json" = ${sqlNullableJsonLiteral(payload)},`,
					`"reason" = ${sqlNullableStringLiteral(reason)},`,
					`"status" = ${sqlStringLiteral(status)},`,
					`"next_seq" = ${nextSeq},`,
					`"next_batch" = ${batchNo + 1},`,
					`"updated_at_ms" = ${Date.now()}`,
					`WHERE "scope" = ${sqlStringLiteral(scopeKey)}`
				].join(' '));
				timings.sessionUpdateMs += elapsedMs(sessionUpdateStartedAtMs);
				nextSession = {
					...session,
					token: token || undefined,
					done: done === 1,
					finalSince,
					payload,
					reason,
					status,
					nextSeq,
					nextBatch: batchNo + 1,
					persisted: true
				};
				transactionBodyMs = elapsedMs(transactionBodyStartedAtMs);
			}, { suppressSyncOutbox: true });
			const transactionMs = elapsedMs(transactionStartedAtMs);
			timings.transactionMs += transactionMs;
			timings.transactionFinalizeMs += Math.max(0, transactionMs - transactionBodyMs);
			if (streamApply && typeof streamOptions.onApplied === 'function')
				streamOptions.onApplied(chunkApplied, chunk.items);
			if (streamApply && applyConfig)
				await yieldPullApply(applyConfig);
		}
		return { session: nextSession, items: entries.items, timings };
	}

	function createPullJournalItemState(keyItems, batchNo, baseSeq) {
		const states = [];
		const upsertStatesByKey = new Map();
		const remainingByKey = new Map();
		for (let i = 0; i < keyItems.length; i++) {
			const item = keyItems[i];
			const state = {
				item,
				batchNo,
				seq: baseSeq + i,
				ready: false,
				persisted: false
			};
			states.push(state);
			if (item && item.op !== 'D') {
				const key = syncItemKey(item);
				if (key) {
					if (!upsertStatesByKey.has(key))
						upsertStatesByKey.set(key, []);
					upsertStatesByKey.get(key).push(state);
				}
			}
		}
		for (const entry of upsertStatesByKey)
			remainingByKey.set(entry[0], entry[1].slice());
		return { states, upsertStatesByKey, remainingByKey };
	}

	function markDeletePullJournalRowsReady(itemState) {
		for (let i = 0; i < itemState.states.length; i++) {
			const state = itemState.states[i];
			if (state.item && state.item.op === 'D')
				state.ready = true;
		}
	}

	function markInlinePullJournalRowsReady(itemState) {
		for (let i = 0; i < itemState.states.length; i++) {
			const state = itemState.states[i];
			if (!state.item || state.item.op === 'D' || state.item.row === undefined)
				continue;
			state.ready = true;
			state.rowItem = state.item;
			const key = syncItemKey(state.item);
			const remaining = key && itemState.remainingByKey.get(key);
			if (remaining && remaining[0] === state)
				remaining.shift();
		}
	}

	function markReturnedPullJournalRows(itemState, rowItems) {
		const seen = new Set();
		const items = Array.isArray(rowItems) ? rowItems : [];
		for (let i = 0; i < items.length; i++) {
			const rowItem = items[i];
			const key = syncItemKey(rowItem);
			if (!key || seen.has(key))
				continue;
			seen.add(key);
			const states = itemState.remainingByKey.get(key);
			if (!states || states.length === 0)
				continue;
			const state = states.shift();
			state.ready = true;
			state.rowItem = rowItem;
		}
	}

	function markMissingPullJournalRows(itemState, missingItems) {
		const items = Array.isArray(missingItems) ? missingItems : [];
		for (let i = 0; i < items.length; i++) {
			const key = syncItemKey(items[i]);
			const states = key ? itemState.remainingByKey.get(key) : null;
			if (!states || states.length === 0)
				continue;
			const state = states.shift();
			state.ready = true;
			state.rowItem = undefined;
		}
	}

	function pullJournalEntriesForRemainingItems(scopeKey, itemState) {
		const rows = [];
		const items = [];
		for (let i = 0; i < itemState.states.length; i++) {
			const state = itemState.states[i];
			if (state.persisted)
				continue;
			state.persisted = true;
			rows.push(newPullJournalRow(scopeKey, state, state.rowItem));
			items.push(newPullJournalItem(state, state.rowItem));
		}
		return { rows, items };
	}

	function newPullJournalItem(state, rowItem) {
		const item = state.item;
		const result = {
			batchNo: state.batchNo,
			seq: state.seq,
			table: item.table,
			pk: item.pk,
			key: undefined,
			op: normalizeChangeOp(item.op)
		};
		if (rowItem && rowItem.row !== undefined)
			result.row = rowItem.row;
		return result;
	}

	function newPullJournalRow(scopeKey, state, rowItem) {
		const item = state.item;
		return [
			sqlStringLiteral(scopeKey),
			String(state.batchNo),
			String(state.seq),
			sqlStringLiteral(item.table),
			sqlStringLiteral(stringify(item.pk)),
			'NULL',
			sqlStringLiteral(item.op),
			sqlNullableJsonLiteral(rowItem ? rowItem.row : undefined)
		];
	}

	async function insertPullJournalItems(db, rows, maxRowsPerInsert) {
		if (!Array.isArray(rows) || rows.length === 0)
			return;
		const chunkSize = normalizeLimit(maxRowsPerInsert, 200);
		const prefix = `INSERT INTO "${syncPullItemTable}" ("scope", "batch_no", "seq", "table_name", "pk_json", "key_json", "op", "row_json") VALUES `;
		for (let offset = 0; offset < rows.length; offset += chunkSize) {
			const chunk = rows.slice(offset, offset + chunkSize);
			await db.query(prefix + chunk.map(row => `(${row.join(', ')})`).join(', '));
		}
	}

	async function readPullJournalBatches(db, scopeKey) {
		await ensurePullJournalTables(db);
		const rows = await db.query([
			'SELECT "batch_no", "seq", "table_name", "pk_json", "key_json", "op", "row_json"',
			`FROM "${syncPullItemTable}"`,
			`WHERE "scope" = ${sqlStringLiteral(scopeKey)}`,
			'ORDER BY "batch_no" ASC, "seq" ASC'
		].join(' '));
		const list = Array.isArray(rows) ? rows : rows?.rows || [];
		const batches = [];
		let currentBatchNo;
		let currentBatch = [];
		for (let i = 0; i < list.length; i++) {
			const item = pullItemFromRow(list[i]);
			if (!item)
				continue;
			if (currentBatchNo !== item.batchNo) {
				if (currentBatch.length > 0)
					batches.push(currentBatch);
				currentBatchNo = item.batchNo;
				currentBatch = [];
			}
			currentBatch.push(item);
		}
		if (currentBatch.length > 0)
			batches.push(currentBatch);
		return batches;
	}

	async function readPullJournalItemsPaged(db, scopeKey) {
		await ensurePullJournalTables(db);
		const items = [];
		let afterSeq = -1;
		for (;;) {
			const rows = await db.query([
				'SELECT "batch_no", "seq", "table_name", "pk_json", "key_json", "op", "row_json"',
				`FROM "${syncPullItemTable}"`,
				`WHERE "scope" = ${sqlStringLiteral(scopeKey)} AND "seq" > ${afterSeq}`,
				'ORDER BY "seq" ASC',
				`LIMIT ${pullJournalRecoveryPageSize}`
			].join(' '));
			const list = Array.isArray(rows) ? rows : rows?.rows || [];
			for (let i = 0; i < list.length; i++) {
				const item = pullItemFromRow(list[i]);
				if (item)
					items.push(item);
			}
			if (list.length < pullJournalRecoveryPageSize)
				return items;
			const last = list[list.length - 1];
			afterSeq = Number(last && (last.seq ?? last.SEQ));
			if (!Number.isFinite(afterSeq))
				return items;
		}
	}

	async function clearPullJournal(db, scopeKey) {
		const hasOtherSession = await hasOtherPullJournalSession(db, scopeKey);
		if (hasOtherSession) {
			await db.query(`DELETE FROM "${syncPullItemTable}" WHERE "scope" = ${sqlStringLiteral(scopeKey)}`);
			await db.query(`DELETE FROM "${syncPullSessionTable}" WHERE "scope" = ${sqlStringLiteral(scopeKey)}`);
			return;
		}
		await db.query(`DELETE FROM "${syncPullItemTable}"`);
		await db.query(`DELETE FROM "${syncPullSessionTable}"`);
	}

	async function clearIncompletePullJournalBatch(db, scopeKey, nextBatch) {
		const batchNo = Math.max(0, normalizeLimit(nextBatch, 0));
		await db.query([
			`DELETE FROM "${syncPullItemTable}"`,
			`WHERE "scope" = ${sqlStringLiteral(scopeKey)}`,
			`AND "batch_no" >= ${batchNo}`
		].join(' '));
	}

	async function hasOtherPullJournalSession(db, scopeKey) {
		const rows = await db.query([
			'SELECT "scope"',
			`FROM "${syncPullSessionTable}"`,
			`WHERE "scope" <> ${sqlStringLiteral(scopeKey)}`,
			'LIMIT 1'
		].join(' '));
		const list = Array.isArray(rows) ? rows : rows?.rows || [];
		return list.length > 0;
	}

	function isInternalTableEnsured(db, tableName) {
		const ensured = ensuredInternalTables.get(db);
		return ensured ? ensured.has(tableName) : false;
	}

	function markInternalTableEnsured(db, tableName) {
		let ensured = ensuredInternalTables.get(db);
		if (!ensured) {
			ensured = new Set();
			ensuredInternalTables.set(db, ensured);
		}
		ensured.add(tableName);
	}

	function clearInternalTableEnsured(db, tableName) {
		const ensured = ensuredInternalTables.get(db);
		if (ensured)
			ensured.delete(tableName);
	}

	function isMissingSqliteTableError(error, tableName) {
		const message = error && error.message || '';
		return message.includes(`no such table: ${tableName}`)
		|| message.includes(`no such table: ${quoteIdent(tableName)}`);
	}

	async function getClientId(db) {
		await ensureSyncClientTable(db);
		const rows = await db.query(`SELECT "id" FROM "${syncClientTable}" LIMIT 1`);
		const row = Array.isArray(rows) ? rows[0] : rows?.rows?.[0];
		const existing = row && (row.id ?? row.ID);
		if (typeof existing === 'string' && existing.length > 0)
			return existing;
		const id = randomUuid();
		await db.query(`INSERT INTO "${syncClientTable}" ("id") VALUES (${sqlStringLiteral(id)})`);
		return id;
	}

	async function readPendingMutations(db, limit) {
		const rows = await readPendingMutationRows(db, limit);
		const result = [];
		for (let i = 0; i < rows.length; i++) {
			const row = rows[i];
			const mutation = rowToMutation(row);
			if (mutation)
				result.push(mutation);
		}
		return result;
	}

	async function readPendingMutationRows(db, limit, excludeIds) {
		return readMutationRowsByStatus(db, ['pending'], limit, excludeIds);
	}

	async function readReplayMutationRows(db, limit, excludeIds) {
		return readMutationRowsByStatus(db, ['pending', 'pushed'], limit, excludeIds);
	}

	function clearOutboxOperationMemory(rows) {
		const list = Array.isArray(rows) ? rows : [];
		for (let i = 0; i < list.length; i++) {
			const id = list[i] && (list[i].mutation_id ?? list[i].MUTATION_ID);
			if (typeof id === 'string')
				deleteSyncOperationMemory(id);
		}
	}

	async function readMutationRowsByStatus(db, statuses, limit, excludeIds, after) {
		await ensureSyncOutboxTable(db);
		const allowedStatuses = (Array.isArray(statuses) ? statuses : [])
			.filter(status => typeof status === 'string' && status.length > 0);
		if (allowedStatuses.length === 0)
			return [];
		const statusSql = allowedStatuses.map(sqlStringLiteral).join(', ');
		const cursor = normalizeOutboxCursor(after);
		const cursorSql = cursor
			? [
				'AND (',
				`"created_at_ms" > ${cursor.createdAtMs}`,
				`OR ("created_at_ms" = ${cursor.createdAtMs} AND "mutation_id" > ${sqlStringLiteral(cursor.mutationId)})`,
				')'
			].join(' ')
			: '';
		const rows = await db.query([
			`SELECT "mutation_id", "table_name", "patch_json", "options_json", "created_at_ms", "operation_id", "operation_name", "operation_json", "status", "last_error", "attempts", "pushed_at_ms", "result_json" FROM "${syncOutboxTable}"`,
			`WHERE "status" IN (${statusSql})`,
			cursorSql,
			'ORDER BY "created_at_ms" ASC, "mutation_id" ASC',
			`LIMIT ${limit}`
		].join(' '));
		const list = Array.isArray(rows) ? rows : rows?.rows || [];
		if (!excludeIds || excludeIds.size === 0)
			return list;
		return list.filter(row => !excludeIds.has(row.mutation_id ?? row.MUTATION_ID));
	}

	async function deleteConfirmedPushedMutations(db, pullStartedAtMs) {
		await ensureSyncOutboxTable(db);
		const threshold = Number(pullStartedAtMs);
		if (!Number.isFinite(threshold))
			return;
		await db.query([
			`DELETE FROM "${syncOutboxTable}"`,
			'WHERE "status" = \'pushed\'',
			'AND "pushed_at_ms" IS NOT NULL',
			`AND "pushed_at_ms" <= ${threshold}`
		].join(' '));
	}

	function rowToMutation(row) {
		const id = row.mutation_id ?? row.MUTATION_ID;
		const table = row.table_name ?? row.TABLE_NAME;
		const patchJson = row.patch_json ?? row.PATCH_JSON;
		const optionsJson = row.options_json ?? row.OPTIONS_JSON;
		if (typeof id !== 'string' || typeof table !== 'string' || typeof patchJson !== 'string')
			return null;
		try {
			const parsedPatch = JSON.parse(patchJson);
			if (table === '*') {
				if (parsedPatch && parsedPatch === Object(parsedPatch) && !Array.isArray(parsedPatch)) {
					return withOutboxMetadata({
						id,
						patches: Array.isArray(parsedPatch.patches) ? parsedPatch.patches : [],
						commands: Array.isArray(parsedPatch.commands) ? parsedPatch.commands : [],
						options: optionsJson ? JSON.parse(optionsJson) : undefined
					}, row);
				}
				return withOutboxMetadata({
					id,
					patches: parsedPatch,
					options: optionsJson ? JSON.parse(optionsJson) : undefined
				}, row);
			}
			return withOutboxMetadata({
				id,
				table,
				patch: parsedPatch,
				options: optionsJson ? JSON.parse(optionsJson) : undefined
			}, row);
		}
		catch (_e) {
			return null;
		}
	}

	function withOutboxMetadata(mutation, row) {
		const operation = rowToOperation(row);
		Object.defineProperty(mutation, '__operation', {
			value: operation,
			enumerable: false,
			configurable: true
		});
		Object.defineProperty(mutation, '__outboxRow', {
			value: row,
			enumerable: false,
			configurable: true
		});
		return mutation;
	}

	function rowToOperation(row) {
		const mutationId = row.mutation_id ?? row.MUTATION_ID;
		const operationId = row.operation_id ?? row.OPERATION_ID;
		const operationName = row.operation_name ?? row.OPERATION_NAME;
		const operationJson = row.operation_json ?? row.OPERATION_JSON;
		if (typeof mutationId !== 'string' || typeof operationName !== 'string' || operationName.length === 0)
			return null;
		const context = parseOperationContext(operationJson);
		return {
			mutationId,
			operationId,
			operationName,
			context
		};
	}

	function parseOperationContext(operationJson) {
		if (typeof operationJson !== 'string' || operationJson.length === 0)
			return {};
		try {
			const parsed = JSON.parse(operationJson);
			return parsed && parsed === Object(parsed) && !Array.isArray(parsed) ? parsed : {};
		}
		catch (_e) {
			return {};
		}
	}

	function stripMutationForPush(mutation) {
		if (!mutation || mutation !== Object(mutation))
			return mutation;
		const result = {};
		const keys = Object.keys(mutation);
		for (let i = 0; i < keys.length; i++)
			result[keys[i]] = mutation[keys[i]];
		return result;
	}

	function mutationsById(mutations) {
		const result = new Map();
		if (!Array.isArray(mutations))
			return result;
		for (let i = 0; i < mutations.length; i++) {
			const mutation = mutations[i];
			if (mutation && typeof mutation.id === 'string')
				result.set(mutation.id, mutation);
		}
		return result;
	}

	function failedOutboxRow(mutation, error) {
		const row = mutation && mutation.__outboxRow;
		if (!row)
			return null;
		const attempts = Number(row.attempts ?? row.ATTEMPTS ?? 0);
		return {
			mutation_id: row.mutation_id ?? row.MUTATION_ID,
			table_name: row.table_name ?? row.TABLE_NAME,
			patch_json: row.patch_json ?? row.PATCH_JSON,
			options_json: row.options_json ?? row.OPTIONS_JSON,
			created_at_ms: row.created_at_ms ?? row.CREATED_AT_MS,
			operation_id: row.operation_id ?? row.OPERATION_ID,
			operation_name: row.operation_name ?? row.OPERATION_NAME,
			operation_json: row.operation_json ?? row.OPERATION_JSON,
			status: 'failed',
			last_error: syncOperationError(error).message,
			attempts: Number.isFinite(attempts) ? attempts + 1 : 1,
			pushed_at_ms: undefined,
			result_json: undefined
		};
	}

	async function markPendingMutationAttempts(db, mutations, error) {
		await ensureSyncOutboxTable(db);
		const message = syncOperationError(error).message;
		for (let i = 0; i < mutations.length; i++) {
			const id = mutations[i] && mutations[i].id;
			if (typeof id !== 'string')
				continue;
			await db.query([
				`UPDATE "${syncOutboxTable}"`,
				`SET "attempts" = "attempts" + 1, "last_error" = ${sqlStringLiteral(message)}`,
				`WHERE "mutation_id" = ${sqlStringLiteral(id)} AND "status" = 'pending'`
			].join(' '));
		}
	}

	function emitOperationSuccess(mutation, result) {
		const operation = mutation && mutation.__operation;
		if (!operation || !operation.operationName)
			return;
		emitOperationEvent({
			ok: true,
			operation: operation.operationName,
			mutationId: operation.mutationId || mutation.id,
			context: operation.context || {},
			result,
			retryable: false
		});
	}

	function emitOperationErrors(mutations, error, retryable) {
		const operationError = syncOperationError(error);
		for (let i = 0; i < mutations.length; i++) {
			const mutation = mutations[i];
			const operation = mutation && mutation.__operation;
			if (!operation || !operation.operationName)
				continue;
			emitOperationEvent({
				ok: false,
				operation: operation.operationName,
				mutationId: operation.mutationId || mutation.id,
				context: operation.context || {},
				retryable,
				error: operationError
			});
		}
	}

	function emitOperationEvent(event) {
		event = withSyncOperationMemory(event);
		emit('operation', event);
		emit(`operation:${event.operation}`, event);
		finalizeSyncOperationMemory(event);
		if (event.ok || event.retryable === false)
			deleteSyncOperationMemory(event.mutationId);
	}

	function syncOperationError(error) {
		const rawStatus = error && (error.status ?? (error.response && error.response.status));
		const status = Number(rawStatus);
		return {
			kind: syncOperationErrorKind(status, error),
			message: extractErrorMessage(error) || (error && error.message) || 'Sync operation failed',
			status: Number.isFinite(status) ? status : undefined
		};
	}

	function syncOperationErrorKind(status, error) {
		if (status === 409)
			return 'conflict';
		if (status === 401 || status === 403)
			return 'auth';
		if (Number.isFinite(status) && status >= 500)
			return 'server';
		if (!Number.isFinite(status))
			return 'network';
		if (error && error.name === 'AbortError')
			return 'network';
		return 'unknown';
	}

	async function markPushedMutations(db, result, attemptedMutations) {
		const results = Array.isArray(result && result.results) ? result.results : [];
		if (results.length === 0)
			return [];
		await ensureSyncOutboxTable(db);
		const now = Date.now();
		const attemptedById = mutationsById(attemptedMutations);
		const acceptedMutations = [];
		for (let i = 0; i < results.length; i++) {
			const item = results[i];
			if (!item || typeof item.id !== 'string')
				continue;
			const mutation = attemptedById.get(item.id);
			await db.query([
				`UPDATE "${syncOutboxTable}"`,
				`SET "status" = 'pushed', "pushed_at_ms" = ${now}, "result_json" = ${sqlStringLiteral(stringify(item))}`,
				`WHERE "mutation_id" = ${sqlStringLiteral(item.id)}`
			].join(' '));
			if (mutation)
				acceptedMutations.push(mutation);
			emitOperationSuccess(mutation, item);
		}
		return acceptedMutations;
	}

	function attachAcceptedPushMutations(result, mutations) {
		if (!result || result !== Object(result))
			return;
		Object.defineProperty(result, '__orangeAcceptedMutations', {
			value: Array.isArray(mutations) ? mutations : [],
			enumerable: false,
			configurable: true
		});
	}

	function getAcceptedPushMutations(result) {
		return result && Array.isArray(result.__orangeAcceptedMutations)
			? result.__orangeAcceptedMutations
			: [];
	}

	async function insertOutboxRow(db, row) {
		const mutationId = row.mutation_id ?? row.MUTATION_ID;
		const tableName = row.table_name ?? row.TABLE_NAME;
		const patchJson = row.patch_json ?? row.PATCH_JSON;
		const optionsJson = row.options_json ?? row.OPTIONS_JSON;
		const createdAtMs = Number(row.created_at_ms ?? row.CREATED_AT_MS ?? Date.now());
		const operationId = row.operation_id ?? row.OPERATION_ID;
		const operationName = row.operation_name ?? row.OPERATION_NAME;
		const operationJson = row.operation_json ?? row.OPERATION_JSON;
		const status = row.status ?? row.STATUS ?? 'pending';
		const lastError = row.last_error ?? row.LAST_ERROR;
		const attempts = Number(row.attempts ?? row.ATTEMPTS ?? 0);
		const pushedAtMs = row.pushed_at_ms ?? row.PUSHED_AT_MS;
		const resultJson = row.result_json ?? row.RESULT_JSON;
		if (typeof mutationId !== 'string' || typeof tableName !== 'string' || typeof patchJson !== 'string')
			return;
		await db.query([
			`INSERT INTO "${syncOutboxTable}" ("mutation_id", "table_name", "patch_json", "options_json", "created_at_ms", "operation_id", "operation_name", "operation_json", "status", "last_error", "attempts", "pushed_at_ms", "result_json")`,
			`VALUES (${sqlStringLiteral(mutationId)}, ${sqlStringLiteral(tableName)}, ${sqlStringLiteral(patchJson)}, ${sqlNullableStringLiteral(optionsJson)}, ${Number.isFinite(createdAtMs) ? createdAtMs : Date.now()}, ${sqlNullableStringLiteral(operationId)}, ${sqlNullableStringLiteral(operationName)}, ${sqlNullableStringLiteral(operationJson)}, ${sqlStringLiteral(status)}, ${sqlNullableStringLiteral(lastError)}, ${Number.isFinite(attempts) ? attempts : 0}, ${sqlNullableNumberLiteral(pushedAtMs)}, ${sqlNullableStringLiteral(resultJson)})`,
			'ON CONFLICT("mutation_id") DO UPDATE SET',
			'"table_name" = excluded."table_name",',
			'"patch_json" = excluded."patch_json",',
			'"options_json" = excluded."options_json",',
			'"created_at_ms" = excluded."created_at_ms",',
			'"operation_id" = excluded."operation_id",',
			'"operation_name" = excluded."operation_name",',
			'"operation_json" = excluded."operation_json",',
			'"status" = excluded."status",',
			'"last_error" = excluded."last_error",',
			'"attempts" = excluded."attempts",',
			'"pushed_at_ms" = excluded."pushed_at_ms",',
			'"result_json" = excluded."result_json"'
		].join(' '));
	}

	function normalizeReplayOutboxOptions(options = {}) {
		const statuses = normalizeOutboxStatuses(options.statuses);
		return {
			statuses,
			limit: normalizeLimit(options.limit, 10000),
			after: normalizeOutboxCursor(options.after),
			replay: options.replay !== false,
			replayExisting: !!options.replayExisting,
			replaceOpen: !!options.replaceOpen,
			ignoreReplayErrors: !!options.ignoreReplayErrors
		};
	}

	function normalizeOutboxCursor(value) {
		if (!value || value !== Object(value))
			return undefined;
		const createdAtMs = Number(value.createdAtMs ?? value.created_at_ms);
		const mutationId = value.mutationId ?? value.mutation_id;
		if (!Number.isFinite(createdAtMs) || typeof mutationId !== 'string' || mutationId.length === 0)
			return undefined;
		return { createdAtMs, mutationId };
	}

	function normalizeOutboxStatuses(value) {
		if (!Array.isArray(value) || value.length === 0)
			return ['pending', 'pushed'];
		const allowed = new Set(['pending', 'pushed', 'failed']);
		const result = value
			.filter(status => typeof status === 'string' && allowed.has(status));
		return result.length > 0 ? Array.from(new Set(result)) : ['pending', 'pushed'];
	}

	function normalizeOutboxReplayRows(rows) {
		if (!Array.isArray(rows))
			return [];
		return rows.filter(row => row && row === Object(row));
	}

	function normalizePullJournalItems(items) {
		if (!Array.isArray(items))
			return [];
		return items
			.map(normalizePullJournalItem)
			.filter(Boolean);
	}

	function normalizePullJournalItem(item) {
		if (!item || item !== Object(item))
			return null;
		if (typeof item.table !== 'string' || !Array.isArray(item.pk))
			return null;
		const normalized = {
			batchNo: Number(item.batchNo || 0),
			seq: Number(item.seq || 0),
			table: item.table,
			pk: item.pk,
			key: item.key,
			op: normalizeChangeOp(item.op)
		};
		if (item.row !== undefined)
			normalized.row = item.row;
		return normalized;
	}

	async function replaceOpenOutboxRows(db, rows, statuses) {
		const statusSql = normalizeOutboxStatuses(statuses).map(sqlStringLiteral).join(', ');
		const sql = [
			`DELETE FROM "${syncOutboxTable}"`,
			`WHERE "status" IN (${statusSql})`
		].join(' ');
		await db.query(sql);
	}

	async function hasOutboxRow(db, mutationId) {
		const rows = await db.query([
			`SELECT "mutation_id" FROM "${syncOutboxTable}"`,
			`WHERE "mutation_id" = ${sqlStringLiteral(mutationId)}`,
			'LIMIT 1'
		].join(' '));
		const list = Array.isArray(rows) ? rows : rows?.rows || [];
		return list.length > 0;
	}

	function outboxRowMutationId(row) {
		if (!row || row !== Object(row))
			return undefined;
		return row.mutation_id ?? row.MUTATION_ID;
	}

	function mutationIdsToSet(mutations) {
		const result = new Set();
		if (!Array.isArray(mutations))
			return result;
		for (let i = 0; i < mutations.length; i++) {
			const id = mutations[i] && mutations[i].id;
			if (typeof id === 'string')
				result.add(id);
		}
		return result;
	}

	async function readScopeSince(scopeKey, db) {
		const state = await readScopeState(scopeKey, db);
		return state && state.since;
	}

	async function readScopeState(scopeKey, db) {
		if (!db || typeof db.query !== 'function')
			return undefined;
		let rows;
		for (let attempt = 0; attempt < 2; attempt++) {
			await ensureSyncStateTable(db);
			try {
				rows = await db.query(
					`SELECT "since_value" FROM "${syncStateTable}" WHERE "scope" = ${sqlStringLiteral(scopeKey)} LIMIT 1`
				);
				break;
			}
			catch (e) {
				if (attempt === 0 && isMissingSqliteTableError(e, syncStateTable)) {
					clearInternalTableEnsured(db, syncStateTable);
					sinceByScope.clear();
					continue;
				}
				throw e;
			}
		}
		const row = Array.isArray(rows) ? rows[0] : rows?.rows?.[0];
		if (!row)
			return undefined;
		const raw = row.since_value ?? row.SINCE_VALUE;
		if (typeof raw !== 'string' || raw.length === 0)
			return undefined;
		try {
			const parsed = JSON.parse(raw);
			if (parsed && parsed === Object(parsed) && 'since' in parsed)
				return {
					since: parsed.since,
					updatedAtMs: parsed.updatedAtMs
				};
			return { since: parsed, updatedAtMs: undefined };
		}
		catch (_e) {
			return { since: raw, updatedAtMs: undefined };
		}
	}

	async function writeScopeState(scopeKey, state, db) {
		if (!db || typeof db.query !== 'function')
			return;
		const sinceSerialized = JSON.stringify(state);
		for (let attempt = 0; attempt < 2; attempt++) {
			await ensureSyncStateTable(db);
			try {
				await db.query(
					`INSERT INTO "${syncStateTable}" ("scope", "since_value") VALUES (${sqlStringLiteral(scopeKey)}, ${sqlStringLiteral(sinceSerialized)}) `
					+ 'ON CONFLICT("scope") DO UPDATE SET "since_value" = excluded."since_value"'
				);
				return;
			}
			catch (e) {
				if (attempt === 0 && isMissingSqliteTableError(e, syncStateTable)) {
					clearInternalTableEnsured(db, syncStateTable);
					sinceByScope.clear();
					continue;
				}
				throw e;
			}
		}
	}

	async function hasStableBase(db, tableNames) {
		if (!db || typeof db.query !== 'function')
			return false;
		try {
			await ensureSyncBaseTable(db);
			const requiredNames = stableBaseDbNames(tableNames);
			if (requiredNames.length > 0) {
				const entries = await readStableBaseEntries(db);
				const existing = new Set(entries.map(entry => entry.name));
				return requiredNames.every(name => existing.has(name));
			}
			const rows = await db.query(`SELECT "name" FROM "${syncBaseTable}" LIMIT 1`);
			const list = Array.isArray(rows) ? rows : rows?.rows || [];
			return list.length > 0;
		}
		catch (_e) {
			return false;
		}
	}

	function stableBaseDbNames(tableNames) {
		const names = normalizeConfiguredTables(tableNames) || [];
		const result = [];
		for (let i = 0; i < names.length; i++) {
			const table = client.tables && client.tables[names[i]];
			const dbName = table && (table._dbName || names[i]);
			if (typeof dbName === 'string' && dbName.length > 0)
				result.push(dbName);
		}
		return Array.from(new Set(result));
	}

	function getPrimaryColumns(table) {
		if (!table || !Array.isArray(table._primaryColumns))
			return [];
		return table._primaryColumns
			.map(column => column && (column._dbName || column.alias || column.name))
			.filter(name => typeof name === 'string' && name.length > 0);
	}

	async function cleanupSyncStorage(db, tableNames) {
		await cleanupLegacySyncState(db);
		await cleanupInactiveStableBase(db, tableNames);
	}

	async function cleanupLegacySyncState(db) {
		for (let attempt = 0; attempt < 2; attempt++) {
			await ensureSyncStateTable(db);
			try {
				await db.query([
					`DELETE FROM "${syncStateTable}"`,
					`WHERE "scope" = ${sqlStringLiteral(legacyStableBaseSnapshotPendingScope)}`
				].join(' '));
				return;
			}
			catch (e) {
				if (attempt === 0 && isMissingSqliteTableError(e, syncStateTable)) {
					clearInternalTableEnsured(db, syncStateTable);
					continue;
				}
				throw e;
			}
		}
	}

	async function cleanupInactiveStableBase(db, tableNames) {
		await ensureSyncBaseTable(db);
		const activeDbNames = stableBaseDbNames(tableNames);
		if (activeDbNames.length === 0)
			return;
		const activeNameSet = new Set(activeDbNames);
		const entries = await readStableBaseEntries(db);
		const entriesByName = new Map(entries.map(entry => [entry.name, entry]));
		const keepBaseNames = new Set();
		for (let i = 0; i < activeDbNames.length; i++) {
			const dbName = activeDbNames[i];
			const entry = entriesByName.get(dbName);
			keepBaseNames.add(entry && entry.baseName || toBaseTableName(dbName));
		}

		const droppedBaseNames = new Set();
		for (let i = 0; i < entries.length; i++) {
			const entry = entries[i];
			if (activeNameSet.has(entry.name)) {
				keepBaseNames.add(entry.baseName);
				continue;
			}
			await db.query(`DELETE FROM "${syncBaseTable}" WHERE "name" = ${sqlStringLiteral(entry.name)}`);
			if (isSyncBaseDataTable(entry.baseName)) {
				await db.query(`DROP TABLE IF EXISTS ${quoteIdent(entry.baseName)}`);
				droppedBaseNames.add(entry.baseName);
			}
		}

		const existingBaseTables = await readExistingBaseTableNames(db);
		for (let i = 0; i < existingBaseTables.length; i++) {
			const baseName = existingBaseTables[i];
			if (keepBaseNames.has(baseName) || droppedBaseNames.has(baseName))
				continue;
			await db.query(`DROP TABLE IF EXISTS ${quoteIdent(baseName)}`);
		}
	}

	async function ensureStableBaseTables(db, tableNames) {
		await ensureSyncBaseTable(db);
		const names = orderTablesByDependencies(client, normalizeConfiguredTables(tableNames) || []);
		if (names.length === 0)
			return;
		const existing = await readStableBaseEntries(db);
		const existingByName = new Map(existing.map(entry => [entry.name, entry]));
		for (let i = 0; i < names.length; i++) {
			const tableInfo = resolveStableBaseTableInfo(names[i], existingByName);
			if (!tableInfo)
				continue;
			await db.query([
				`CREATE TABLE IF NOT EXISTS ${quoteIdent(tableInfo.baseName)}`,
				`AS SELECT * FROM ${quoteIdent(tableInfo.dbName)} WHERE 0`
			].join(' '));
			await ensureStableBasePrimaryKeyIndex(db, tableInfo);
			await db.query([
				`INSERT INTO "${syncBaseTable}" ("name", "base_name", "schema_sql", "ordinal")`,
				`VALUES (${sqlStringLiteral(tableInfo.dbName)}, ${sqlStringLiteral(tableInfo.baseName)}, NULL, ${i})`,
				'ON CONFLICT("name") DO UPDATE SET',
				'"base_name" = excluded."base_name",',
				'"ordinal" = excluded."ordinal"'
			].join(' '));
		}
	}

	async function ensureStableBasePrimaryKeyIndex(db, tableInfo) {
		const primaryColumns = getPrimaryColumns(tableInfo && tableInfo.table);
		if (!tableInfo || primaryColumns.length === 0)
			return;
		await db.query([
			`CREATE INDEX IF NOT EXISTS ${quoteIdent(toBaseTableIndexName(tableInfo.dbName))}`,
			`ON ${quoteIdent(tableInfo.baseName)} (${primaryColumns.map(quoteIdent).join(', ')})`
		].join(' '));
	}

	function resolveStableBaseTableInfo(tableName, existingByName) {
		if (typeof tableName !== 'string')
			return null;
		const table = client.tables && client.tables[tableName];
		if (!table)
			return null;
		const dbName = table._dbName || tableName;
		const existing = existingByName && existingByName.get(dbName);
		return {
			name: tableName,
			table,
			dbName,
			baseName: existing && existing.baseName || toBaseTableName(dbName)
		};
	}

	async function readStableBaseEntriesByName(db) {
		const entries = await readStableBaseEntries(db);
		return new Map(entries.map(entry => [entry.name, entry]));
	}

	async function applyDeleteItemsToStableBase(db, items, knownBaseByName) {
		const deletes = Array.isArray(items) ? items : [];
		if (deletes.length === 0)
			return;
		const baseByName = knownBaseByName || await readStableBaseEntriesByName(db);
		const groups = stableBaseTargetGroupsForItems(deletes, baseByName);
		for (const group of groups)
			await applyStableBaseDeleteGroup(db, group);
	}

	async function applyRowsPayloadToStableBase(db, items, knownBaseByName) {
		const rows = Array.isArray(items) ? items : [];
		if (rows.length === 0)
			return;
		const baseByName = knownBaseByName || await readStableBaseEntriesByName(db);
		const groups = stableBaseTargetGroupsForItems(rows, baseByName);
		for (const group of groups)
			await applyStableBaseUpsertGroup(db, group);
	}

	async function applyPullJournalBatchOnTx(tx, items, patchOptions, knownBaseByName, applyOptions = {}) {
		const batch = Array.isArray(items) ? items : [];
		const deferStableBase = applyOptions.deferStableBase === true;
		const timings = applyOptions.timings;
		let baseByName = knownBaseByName;
		if (!deferStableBase && !baseByName) {
			const stableBaseStartedAtMs = Date.now();
			baseByName = await readStableBaseEntriesByName(tx);
			addPullTiming(timings, 'stableBaseMs', stableBaseStartedAtMs);
		}
		let applied = 0;
		for (let offset = 0; offset < batch.length;) {
			const batchNo = Number(batch[offset] && batch[offset].batchNo || 0);
			let end = offset + 1;
			while (end < batch.length && Number(batch[end] && batch[end].batchNo || 0) === batchNo)
				end += 1;
			applied += await applyPullJournalOperationBatchOnTx(
				tx,
				batch.slice(offset, end),
				patchOptions,
				baseByName,
				applyOptions
			);
			offset = end;
		}
		return applied;
	}

	async function applyPullJournalOperationBatchOnTx(tx, batch, patchOptions, baseByName, applyOptions = {}) {
		const deleteItems = batch.filter(x => x.op === 'D');
		const upsertItems = batch.filter(x => x.op !== 'D' && x.row !== undefined);
		const deferStableBase = applyOptions.deferStableBase === true;
		const timings = applyOptions.timings;
		let applied = 0;
		if (deleteItems.length > 0) {
			const dataApplyStartedAtMs = Date.now();
			applied += await applyDeleteItemsOnTx(tx, deleteItems, patchOptions);
			addPullTiming(timings, 'dataApplyMs', dataApplyStartedAtMs);
			if (!deferStableBase) {
				const stableBaseStartedAtMs = Date.now();
				await applyDeleteItemsToStableBase(tx, deleteItems, baseByName);
				addPullTiming(timings, 'stableBaseMs', stableBaseStartedAtMs);
			}
		}
		if (upsertItems.length > 0) {
			const dataApplyStartedAtMs = Date.now();
			applied += await applyRowsPayloadOnTx(tx, upsertItems, patchOptions);
			addPullTiming(timings, 'dataApplyMs', dataApplyStartedAtMs);
			if (!deferStableBase) {
				const stableBaseStartedAtMs = Date.now();
				await applyRowsPayloadToStableBase(tx, upsertItems, baseByName);
				addPullTiming(timings, 'stableBaseMs', stableBaseStartedAtMs);
			}
		}
		return applied;
	}

	async function copyTablesToStableBase(db, tableNames) {
		const names = normalizeConfiguredTables(tableNames) || [];
		if (names.length === 0)
			return;
		await ensureStableBaseTables(db, names);
		const baseByName = await readStableBaseEntriesByName(db);
		for (let i = 0; i < names.length; i++) {
			const tableInfo = resolveStableBaseTableInfo(names[i], baseByName);
			if (!tableInfo)
				continue;
			await db.query(`DELETE FROM ${quoteIdent(tableInfo.baseName)}`);
			await db.query(`INSERT INTO ${quoteIdent(tableInfo.baseName)} SELECT * FROM ${quoteIdent(tableInfo.dbName)}`);
		}
	}

	function stableBaseTargetGroupsForItems(items, baseByName) {
		const groups = new Map();
		for (let i = 0; i < items.length; i++) {
			const target = stableBaseTargetForItem(items[i], baseByName);
			if (!target)
				continue;
			const key = target.baseName;
			let group = groups.get(key);
			if (!group) {
				group = {
					dbName: target.dbName,
					baseName: target.baseName,
					primaryColumns: target.primaryColumns,
					keys: []
				};
				groups.set(key, group);
			}
			group.keys.push(target.key);
		}
		return Array.from(groups.values());
	}

	async function applyStableBaseDeleteGroup(db, group) {
		for (let offset = 0; offset < group.keys.length; offset += maxStableBaseKeysPerStatement) {
			const keys = group.keys.slice(offset, offset + maxStableBaseKeysPerStatement);
			const where = primaryKeyWhereAnySql(group.primaryColumns, keys);
			if (where)
				await db.query(`DELETE FROM ${quoteIdent(group.baseName)} WHERE ${where}`);
		}
	}

	async function applyStableBaseUpsertGroup(db, group) {
		for (let offset = 0; offset < group.keys.length; offset += maxStableBaseKeysPerStatement) {
			const keys = group.keys.slice(offset, offset + maxStableBaseKeysPerStatement);
			const where = primaryKeyWhereAnySql(group.primaryColumns, keys);
			if (!where)
				continue;
			await db.query(`DELETE FROM ${quoteIdent(group.baseName)} WHERE ${where}`);
			await db.query(`INSERT INTO ${quoteIdent(group.baseName)} SELECT * FROM ${quoteIdent(group.dbName)} WHERE ${where}`);
		}
	}

	function stableBaseTargetForItem(item, baseByName) {
		if (!item || typeof item.table !== 'string' || !Array.isArray(item.pk))
			return null;
		const table = client.tables && client.tables[item.table];
		if (!table)
			return null;
		const dbName = table._dbName || item.table;
		const baseEntry = baseByName && baseByName.get(dbName);
		const primaryColumns = getPrimaryColumns(table);
		if (!baseEntry || primaryColumns.length === 0 || item.pk.length !== primaryColumns.length)
			return null;
		return {
			dbName,
			baseName: baseEntry.baseName,
			primaryColumns,
			key: item.pk
		};
	}

	function primaryKeyWhereSql(primaryColumns, key) {
		if (!Array.isArray(key) || key.length !== primaryColumns.length)
			return '';
		return primaryColumns
			.map((column, index) => sqlValuePredicate(quoteIdent(column), key[index]))
			.join(' AND ');
	}

	function primaryKeyWhereAnySql(primaryColumns, keys) {
		if (!Array.isArray(keys) || keys.length === 0)
			return '';
		if (keys.length === 1)
			return primaryKeyWhereSql(primaryColumns, keys[0]);
		const validKeys = [];
		for (let i = 0; i < keys.length; i++) {
			const key = keys[i];
			if (!Array.isArray(key) || key.length !== primaryColumns.length)
				continue;
			if (key.some(value => value === null || value === undefined))
				return keys
					.map(current => primaryKeyWhereSql(primaryColumns, current))
					.filter(Boolean)
					.map(where => primaryColumns.length > 1 ? `(${where})` : where)
					.join(' OR ');
			validKeys.push(key);
		}
		if (validKeys.length === 0)
			return '';
		if (primaryColumns.length === 1) {
			return `${quoteIdent(primaryColumns[0])} IN (${validKeys
				.map(key => sqlValueLiteral(key[0]))
				.join(', ')})`;
		}
		const columns = primaryColumns.map(quoteIdent).join(', ');
		const values = validKeys
			.map(key => `(${key.map(sqlValueLiteral).join(', ')})`)
			.join(', ');
		return `(${columns}) IN (${values})`;
	}

	async function restoreStableBase(db) {
		if (!db || typeof db.query !== 'function')
			return;
		await client.transaction(async (tx) => {
			await ensureSyncBaseTable(tx);
			const entries = await readStableBaseEntries(tx);
			if (entries.length === 0)
				return;
			await tryDeferForeignKeys(tx);
			await tx.query('PRAGMA foreign_keys = OFF');
			try {
				for (let i = entries.length - 1; i >= 0; i--) {
					const entry = entries[i];
					await tx.query(`DELETE FROM ${quoteIdent(entry.name)}`);
				}
				for (let i = 0; i < entries.length; i++) {
					const entry = entries[i];
					await tx.query(`INSERT INTO ${quoteIdent(entry.name)} SELECT * FROM ${quoteIdent(entry.baseName)}`);
				}
			}
			finally {
				await tx.query('PRAGMA foreign_keys = ON');
			}
		}, { suppressSyncOutbox: true });
	}

	async function ensureSyncBaseTable(db) {
		await db.query([
			`CREATE TABLE IF NOT EXISTS "${syncBaseTable}" (`,
			'"name" TEXT PRIMARY KEY,',
			'"base_name" TEXT NOT NULL,',
			'"schema_sql" TEXT,',
			'"ordinal" INTEGER NOT NULL',
			');'
		].join(' '));
	}

	async function readStableBaseEntries(db) {
		const rows = await db.query([
			`SELECT "name", "base_name", "schema_sql", "ordinal" FROM "${syncBaseTable}"`,
			'ORDER BY "ordinal" ASC'
		].join(' '));
		const list = Array.isArray(rows) ? rows : rows?.rows || [];
		return list
			.map(row => ({
				name: row.name ?? row.NAME,
				baseName: row.base_name ?? row.BASE_NAME,
				schemaSql: row.schema_sql ?? row.SCHEMA_SQL,
				ordinal: row.ordinal ?? row.ORDINAL
			}))
			.filter(row => typeof row.name === 'string' && typeof row.baseName === 'string');
	}

	async function dropExistingBaseTables(db) {
		const list = await readExistingBaseTableNames(db);
		for (let i = 0; i < list.length; i++)
			await db.query(`DROP TABLE IF EXISTS ${quoteIdent(list[i])}`);
	}

	async function readExistingBaseTableNames(db) {
		const rows = await db.query([
			'SELECT "name" FROM sqlite_schema',
			'WHERE "type" = \'table\'',
			`AND "name" LIKE ${sqlStringLiteral(syncBasePrefix + '%')}`
		].join(' '));
		const list = Array.isArray(rows) ? rows : rows?.rows || [];
		return list
			.map(row => row.name ?? row.NAME)
			.filter(isSyncBaseDataTable);
	}

	function isSyncBaseDataTable(name) {
		return typeof name === 'string' && name.startsWith(syncBasePrefix);
	}

	function toBaseTableName(name) {
		return syncBasePrefix + toHexName(name);
	}

	function toBaseTableIndexName(name) {
		return syncBaseIndexPrefix + toHexName(name);
	}

	function toHexName(name) {
		let result = '';
		const value = String(name);
		for (let i = 0; i < value.length; i++) {
			let hex = value.charCodeAt(i).toString(16);
			while (hex.length < 4)
				hex = '0' + hex;
			result += hex;
		}
		return result || 'empty';
	}

	function on(event, listener) {
		if (typeof event !== 'string' || typeof listener !== 'function')
			return () => {};
		if (event === 'initial-ready') {
			initialReadyListeners.add(listener);
			void maybeEmitInitialReadyFromDb('persisted');
			return () => off(event, listener);
		}
		let listeners = eventListeners.get(event);
		if (!listeners) {
			listeners = new Set();
			eventListeners.set(event, listeners);
		}
		listeners.add(listener);
		return () => off(event, listener);
	}

	function off(event, listener) {
		if (event === 'initial-ready') {
			initialReadyListeners.delete(listener);
			return;
		}
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
		const unsubscribe = on(event, (payload) => {
			unsubscribe();
			listener(payload);
		});
		return unsubscribe;
	}

	async function waitForInitialSync() {
		const existing = await maybeEmitInitialReadyFromDb('persisted');
		if (existing)
			return;
		return new Promise((resolve) => {
			const unsubscribe = once('initial-ready', () => {
				unsubscribe();
				resolve();
			});
		});
	}

	async function maybeEmitInitialReadyFromDb(source) {
		const db = toSyncDb(await getDb());
		const syncConfig = normalizeSyncConfig(db && db.__sqliteSync);
		if (!syncConfig)
			return null;
		const pullConfig = resolvePullConfig(syncConfig);
		const configuredTables = resolveSyncTables(db, pullConfig.tables, client);
		if (!Array.isArray(configuredTables) || configuredTables.length === 0)
			return null;
		return maybeEmitInitialReady(syncConfig, configuredTables, db, source);
	}

	async function maybeEmitInitialReady(syncConfig, configuredTables, db, source) {
		const scopeKey = getScopeKey(configuredTables);
		const state = await readScopeState(scopeKey, db);
		const isReady = isInitialReadyState(state, syncConfig.initialReadyMaxAgeMs);
		if (!isReady) {
			initialReadyEmitted = false;
			return null;
		}
		const payload = {
			tables: configuredTables.slice(),
			since: state.since,
			updatedAtMs: state.updatedAtMs,
			source
		};
		if (!initialReadyEmitted) {
			initialReadyEmitted = true;
			emitInitialReady(payload);
		}
		return payload;
	}

	function emitInitialReady(payload) {
		for (const listener of Array.from(initialReadyListeners)) {
			listener(payload);
		}
	}
}

function normalizeSyncConfig(sync) {
	if (!sync)
		return null;

	if (typeof sync === 'string')
		return normalizePullConfig(sync, undefined, undefined);

	if (sync !== Object(sync))
		throw new Error('Invalid sqlite sync configuration');
	if ('endpoint' in sync)
		throw new Error('Invalid sqlite sync configuration: use "sync.url" (not "sync.endpoint").');

	const endpoint = normalizeEndpoint(sync.url ? sync : undefined);
	const tables = normalizeConfiguredTables(sync.tables);
	const initialReadyMaxAgeMs = normalizeInitialReadyMaxAgeMs(sync.initialReadyMaxAgeMs);
	return {
		...endpoint,
		pull: sync.pull === undefined ? undefined : normalizePullConfig(sync.pull, endpoint, tables),
		tables,
		initialReadyMaxAgeMs,
		schema: sync.schema,
		auto: sync.auto,
		push: sync.push === undefined ? undefined : normalizePushConfig(sync.push, endpoint),
		crossTabLock: normalizeCrossTabLockConfig(sync.crossTabLock)
	};
}

function withRuntimeCrossTabLockConfig(config, options) {
	if (!config || !config.enabled)
		return config;
	const timeoutMs = normalizePositiveInteger(options && options.timeoutMs);
	if (!timeoutMs || config.timeoutMs)
		return config;
	return {
		...config,
		timeoutMs
	};
}

async function resolveRuntimeCrossTabSyncLock(db, syncConfig) {
	const sqliteOPFS = resolveSqliteOPFSRuntime(db);
	if (!sqliteOPFS)
		return {
			name: resolveCrossTabLockName(db, syncConfig),
			config: syncConfig.crossTabLock
		};
	const vfs = await resolveSqliteOPFSVfs(sqliteOPFS);
	const forceWlLock = vfs === 'opfs-wl';
	const config = forceWlLock
		? { ...syncConfig.crossTabLock, enabled: true }
		: syncConfig.crossTabLock;
	return {
		name: resolveCrossTabLockName(db, syncConfig, vfs),
		config
	};
}

function resolveSqliteOPFSRuntime(db) {
	const pool = db && (db.poolFactory || db);
	if (!pool || typeof pool.__orangeSqliteOPFSConnectionString !== 'string')
		return null;
	return pool;
}

async function resolveSqliteOPFSVfs(pool) {
	if (pool.__orangeSqliteOPFSReady && typeof pool.__orangeSqliteOPFSReady.then === 'function') {
		const result = await pool.__orangeSqliteOPFSReady;
		return result && result.vfs || pool.__orangeSqliteOPFSVfs || pool.__orangeSqliteOPFSRequestedVfs;
	}
	return pool.__orangeSqliteOPFSVfs || pool.__orangeSqliteOPFSRequestedVfs;
}

function resolveCrossTabLockName(db, syncConfig, sqliteVfs) {
	const config = syncConfig && syncConfig.crossTabLock;
	if (config && typeof config.name === 'string' && config.name.length > 0 && !sqliteVfs)
		return config.name;
	const identity = db && (
		db.__orangeSyncLockName
		|| db.__orangeSyncIdentity
		|| db.poolFactory && (db.poolFactory.__orangeSyncLockName || db.poolFactory.__orangeSyncIdentity)
	);
	const endpoint = syncConfig && (syncConfig.url || syncConfig.pull && syncConfig.pull.url || syncConfig.push && syncConfig.push.url);
	const base = config && typeof config.name === 'string' && config.name.length > 0
		? config.name
		: identity || endpoint || 'default';
	const scoped = sqliteVfs ? `${base}:${sqliteVfs}` : base;
	return `orange-orm:sync:${normalizeLockNamePart(scoped)}`;
}

async function dropLocalSyncTables(db, client, tableNames) {
	const tableDbNames = tableNames
		.map(name => client && client.tables && client.tables[name])
		.filter(Boolean)
		.map(table => table._dbName)
		.filter(Boolean);
	const internalTables = [
		'orange_schema_state',
		'orange_sync_state',
		'orange_sync_client',
		'orange_sync_outbox',
		'orange_sync_pull_session',
		'orange_sync_pull_item'
	];
	const dropNames = Array.from(new Set(internalTables.concat(tableDbNames)));
	await db.query('PRAGMA foreign_keys = OFF');
	try {
		for (let i = 0; i < dropNames.length; i++)
			await db.query(`DROP TABLE IF EXISTS ${quoteIdent(dropNames[i])}`);
	}
	finally {
		await db.query('PRAGMA foreign_keys = ON');
	}
	return dropNames;
}

function normalizePullConfig(config, fallbackEndpoint, fallbackTables) {
	if (!config)
		return undefined;
	if (typeof config === 'string')
		return { ...normalizeEndpoint(config), tables: fallbackTables };
	if (config !== Object(config))
		throw new Error('Invalid sqlite sync pull configuration');

	const endpointOverrides = pickEndpointOverrides(config);
	const endpoint = config.url
		? normalizeEndpoint(config)
		: mergeEndpoint(fallbackEndpoint, endpointOverrides);
	const tables = normalizeConfiguredTables(config.tables) || fallbackTables;
	if (!endpoint)
		throw new Error('Sync pull endpoint requires "url" or sync.url');
	return {
		...endpoint,
		tables,
		patchOptions: config.patchOptions,
		apply: normalizePullApplyConfig(config.apply),
		maxKeysPerBatch: config.maxKeysPerBatch,
		maxRowsPerBatch: config.maxRowsPerBatch,
		maxConcurrentRowRequests: config.maxConcurrentRowRequests,
		maxJournalRowsPerInsert: config.maxJournalRowsPerInsert
	};
}

function normalizePullApplyConfig(config) {
	if (!config)
		return undefined;
	if (config !== Object(config))
		throw new Error('Invalid sqlite sync pull apply configuration');
	const maxRowsPerTransaction = normalizeOptionalPositiveInteger(config.maxRowsPerTransaction);
	if (!maxRowsPerTransaction)
		return undefined;
	return {
		maxRowsPerTransaction,
		yieldMs: normalizeNonNegativeInteger(config.yieldMs, 0),
		foreignKeyCheck: normalizePullApplyForeignKeyCheck(config.foreignKeyCheck)
	};
}

function normalizePullApplyForeignKeyCheck(value) {
	if (value === undefined || value === null || value === true)
		return 'final';
	if (value === false || value === 'none' || value === 'off')
		return 'none';
	if (value === 'final' || value === 'afterApply')
		return 'final';
	if (value === 'chunk' || value === 'perChunk' || value === 'perTransaction')
		return 'chunk';
	throw new Error('Invalid sqlite sync pull apply foreignKeyCheck configuration');
}

function normalizePushConfig(config, fallbackEndpoint) {
	if (!config)
		return undefined;
	if (typeof config === 'string')
		return normalizeEndpoint(config);
	if (config !== Object(config))
		throw new Error('Invalid sqlite sync push configuration');

	const endpointOverrides = pickEndpointOverrides(config);
	const endpoint = config.url
		? normalizeEndpoint(config)
		: mergeEndpoint(fallbackEndpoint, endpointOverrides);
	if (!endpoint)
		throw new Error('Sync push endpoint requires "url" or sync.url');
	return {
		...endpoint,
		maxMutationsPerBatch: config.maxMutationsPerBatch
	};
}

function normalizeConfiguredTables(value) {
	if (!Array.isArray(value))
		return undefined;
	const tables = value.filter(x => typeof x === 'string');
	if (tables.length === 0)
		return undefined;
	return Array.from(new Set(tables));
}

function quoteIdent(value) {
	return `"${String(value).replace(/"/g, '""')}"`;
}

function resolveSyncTables(db, configuredTables, client) {
	if (Array.isArray(configuredTables) && configuredTables.length > 0)
		return configuredTables;
	const tables = db && db.tables ? db.tables : client && client.tables;
	if (!tables)
		return configuredTables;
	const names = Object.keys(tables).filter(x => typeof x === 'string');
	if (names.length === 0)
		return configuredTables;
	return names;
}

function normalizeInitialReadyMaxAgeMs(value) {
	const parsed = Number.parseInt(value, 10);
	if (!Number.isFinite(parsed) || parsed <= 0)
		return undefined;
	return parsed;
}

function normalizeEndpoint(endpoint) {
	if (!endpoint)
		return undefined;
	if (typeof endpoint === 'string')
		return { url: endpoint };
	if (endpoint !== Object(endpoint))
		throw new Error('Invalid sqlite sync endpoint configuration');
	if (!endpoint.url)
		throw new Error('Sync endpoint requires "url"');
	return {
		url: endpoint.url,
		timeoutMs: endpoint.timeoutMs
	};
}

function mergeEndpoint(base, overrides) {
	if (!base)
		return undefined;
	return {
		...base,
		...overrides
	};
}

function pickEndpointOverrides(config) {
	if (!config || config !== Object(config))
		return {};
	const result = {};
	if (config.timeoutMs !== undefined)
		result.timeoutMs = config.timeoutMs;
	return result;
}

function resolvePullConfig(syncConfig, options = {}) {
	const preferred = syncConfig.pull || syncConfig;
	const pullConfig = normalizePullConfig(preferred, syncConfig, syncConfig.tables);
	if (!pullConfig || !pullConfig.url)
		throw new Error('No pull sync endpoint configured');
	if (options.timeoutMs === undefined)
		return pullConfig;
	return {
		...pullConfig,
		timeoutMs: options.timeoutMs
	};
}

function resolvePushConfig(syncConfig, options = {}) {
	const preferred = syncConfig.push || syncConfig;
	const pushConfig = normalizePushConfig(preferred, syncConfig);
	if (!pushConfig || !pushConfig.url)
		throw new Error('No push sync endpoint configured');
	if (options.timeoutMs === undefined)
		return pushConfig;
	return {
		...pushConfig,
		timeoutMs: options.timeoutMs
	};
}

function resolveMaxPushBatches() {
	return maxPushBatchesPerSync;
}

async function requestPayload(config, options) {
	const syncInterceptors = options && options._syncInterceptors;
	const axiosInterceptor = options && options._syncAxiosInterceptor;
	const axios = createFetchClient();
	if (axiosInterceptor && typeof axiosInterceptor.applyTo === 'function')
		axiosInterceptor.applyTo(axios);
	const requestBody = config.body !== undefined ? config.body : {
		since: options.since,
		tables: options.tables
	};

	const request = {
		url: appendQueryParam(config.url, 'sync', config.syncPhase || 'pull'),
		method: 'post',
		timeout: config.timeoutMs,
		headers: {},
		responseType: config.responseType
	};
	request.data = requestBody;

	const interceptedRequest = syncInterceptors && typeof syncInterceptors.applyRequest === 'function'
		? await syncInterceptors.applyRequest(request)
		: request;
	let response;
	try {
		response = await axios.request(interceptedRequest);
	}
	catch (error) {
		if (syncInterceptors && typeof syncInterceptors.applyResponseError === 'function') {
			const recovered = await syncInterceptors.applyResponseError(error);
			return recovered && recovered === Object(recovered) && 'data' in recovered
				? recovered.data
				: recovered;
		}
		throw error;
	}
	if (syncInterceptors && typeof syncInterceptors.applyResponse === 'function')
		response = await syncInterceptors.applyResponse(response);
	return response.data;
}

function createFetchClient() {
	return {
		request
	};

	async function request(config) {
		if (typeof fetch !== 'function')
			throw new Error('HTTP client requires fetch. Use a runtime with fetch support or provide a fetch polyfill.');

		const abortController = typeof AbortController === 'function' && config.timeout
			? new AbortController()
			: undefined;
		let timeout;
		if (abortController)
			timeout = setTimeout(() => abortController.abort(), config.timeout);

		try {
			const headers = {
				'Content-Type': 'application/json',
				'Accept': 'application/json',
				...(config.headers || {})
			};
			const fetchOptions = {
				method: config.method?.toUpperCase(),
				headers,
				body: config.data === undefined ? undefined : JSON.stringify(config.data),
				signal: abortController && abortController.signal
			};
			if (config.credentials !== undefined)
				fetchOptions.credentials = config.credentials;
			const response = await fetch(config.url, fetchOptions);
			const data = config.responseType === 'arraybuffer'
				? new Uint8Array(await response.arrayBuffer())
				: await readPayloadResponse(response);
			const payload = {
				data,
				status: response.status,
				statusText: response.statusText,
				headers: headersToObject(response.headers),
				config
			};
			if (!response.ok) {
				const error = new Error('Request failed with status code ' + response.status);
				error.response = payload;
				throw error;
			}
			return payload;
		}
		finally {
			if (timeout)
				clearTimeout(timeout);
		}
	}
}

function headersToObject(headers) {
	const result = {};
	if (!headers || typeof headers.forEach !== 'function')
		return result;
	headers.forEach((value, key) => {
		result[key] = value;
	});
	return result;
}

async function readPayloadResponse(response) {
	const text = await response.text();
	const contentType = response.headers.get('content-type') || '';
	if (text && (contentType.indexOf('application/json') !== -1 || looksLikeJson(text)))
		return JSON.parse(text);
	return text;
}

function looksLikeJson(text) {
	const value = text.trim();
	return value[0] === '{' || value[0] === '[';
}

function appendQueryParam(url, key, value) {
	if (typeof url !== 'string')
		return url;
	const encodedKey = encodeURIComponent(key);
	const encodedValue = encodeURIComponent(value);
	const pair = `${encodedKey}=${encodedValue}`;
	if (url.includes(`${encodedKey}=`))
		return url;
	return `${url}${url.includes('?') ? '&' : '?'}${pair}`;
}

function isStagedKeysPayload(payload) {
	return payload
		&& payload === Object(payload)
		&& payload.phase === 'keys'
		&& Array.isArray(payload.items)
		&& 'done' in payload;
}

function isSqliteSnapshotPayload(payload) {
	return isStagedKeysPayload(payload)
		&& isSqliteSnapshotDescriptor(payload.snapshot);
}

async function importSqliteSnapshot(descriptor, pullConfig, db, clientTables, tableNames, scopeKey, cursor, requestOptions) {
	const bytes = await requestPayload({
		...pullConfig,
		responseType: 'arraybuffer',
		body: { phase: 'snapshot', id: descriptor.id }
	}, requestOptions);
	let replayHandle;
	if (typeof requestOptions._stageSqliteSnapshot === 'function') {
		replayHandle = await requestOptions._stageSqliteSnapshot({
			descriptor: { ...descriptor },
			bytes: cloneSqliteSnapshotBytes(bytes),
			tables: Array.isArray(tableNames) ? tableNames.slice() : [],
			scopeKey,
			cursor
		});
	}
	let result;
	try {
		result = await importSqliteSnapshotBytes(
			descriptor,
			bytes,
			db,
			clientTables,
			tableNames,
			scopeKey,
			cursor
		);
	}
	catch (error) {
		if (replayHandle && typeof replayHandle.abort === 'function') {
			try {
				await replayHandle.abort();
			}
			catch (abortError) {
				const fatalError = abortError instanceof Error ? abortError : new Error(String(abortError));
				fatalError.cause = error;
				fatalError.__orangeSqliteSnapshotImported = true;
				throw fatalError;
			}
		}
		throw error;
	}
	if (replayHandle && typeof replayHandle.applied === 'function') {
		try {
			await replayHandle.applied();
		}
		catch (error) {
			const fatalError = error instanceof Error ? error : new Error(String(error));
			fatalError.__orangeSqliteSnapshotImported = true;
			throw fatalError;
		}
	}
	return result;
}

async function importSqliteSnapshotBytes(descriptor, bytes, db, clientTables, tableNames, scopeKey, cursor) {
	const importer = resolveSqliteSnapshotImporter(db);
	if (!importer) throw new Error('SQLite snapshot import is not available for this database.');
	if (!isSqliteSnapshotDescriptor(descriptor) || !isSqliteSnapshotBytes(bytes))
		throw new Error('Invalid SQLite snapshot payload.');
	const tables = Array.isArray(tableNames) ? tableNames : [];
	const schema = buildSyncSchema(clientTables, tables);
	const schemaChecksum = checksumString(stableStringify(schema));
	if (schemaChecksum !== descriptor.schemaChecksum)
		throw new Error('SQLite snapshot schema does not match the local map.');
	const baseEntries = await readSnapshotBaseEntries(db);
	const baseByDbName = new Map(baseEntries.map(entry => [entry.name, entry.baseName]));
	const statements = ['PRAGMA defer_foreign_keys=ON'];
	for (let i = schema.tables.length - 1; i >= 0; i--)
		statements.push(`DELETE FROM ${quoteIdent(schema.tables[i].dbName)}`);
	for (const table of schema.tables) {
		const columns = table.columns.map(column => quoteIdent(column.dbName)).join(', ');
		statements.push(`INSERT INTO ${quoteIdent(table.dbName)} (${columns}) SELECT ${columns} FROM orange_snapshot.${quoteIdent(table.dbName)}`);
		const baseName = baseByDbName.get(table.dbName);
		if (baseName) {
			statements.push(`DELETE FROM ${quoteIdent(baseName)}`);
			statements.push(`INSERT INTO ${quoteIdent(baseName)} SELECT * FROM ${quoteIdent(table.dbName)}`);
		}
	}
	statements.push([
		'INSERT INTO "orange_sync_state" ("scope", "since_value") VALUES (',
		sqlStringLiteral(scopeKey), ', ', sqlStringLiteral(JSON.stringify({ since: cursor, updatedAtMs: Date.now() })), ') ',
		'ON CONFLICT("scope") DO UPDATE SET "since_value" = excluded."since_value"'
	].join(''));
	const result = await importer(bytes, statements, {
		schemaChecksum: descriptor.schemaChecksum,
		rowCount: descriptor.rowCount
	});
	return result && result.result || result;
}

function isSqliteSnapshotDescriptor(value) {
	return value
		&& value === Object(value)
		&& typeof value.id === 'string'
		&& typeof value.schemaChecksum === 'string';
}

function isSqliteSnapshotBytes(value) {
	return value instanceof Uint8Array
		|| typeof ArrayBuffer === 'function' && value instanceof ArrayBuffer;
}

function cloneSqliteSnapshotBytes(value) {
	if (value instanceof Uint8Array)
		return value.slice();
	if (typeof ArrayBuffer === 'function' && value instanceof ArrayBuffer)
		return value.slice(0);
	throw new Error('SQLite snapshot response did not contain binary data.');
}

function resolveSqliteSnapshotImporter(db) {
	const pool = db && (db.poolFactory || db.pool || db);
	return pool && typeof pool.__orangeImportSqliteSnapshot === 'function'
		? pool.__orangeImportSqliteSnapshot.bind(pool)
		: null;
}

async function readSnapshotBaseEntries(db) {
	try {
		const rows = await db.query('SELECT "name", "base_name", "schema_sql", "ordinal" FROM "orange_sync_base_tables" ORDER BY "ordinal", "name"');
		return (Array.isArray(rows) ? rows : rows && rows.rows || []).map(row => ({
			name: row.name ?? row.NAME,
			baseName: row.base_name ?? row.BASE_NAME
		}));
	}
	catch (_error) { return []; }
}

function isRowsPayload(payload) {
	return payload
		&& payload === Object(payload)
		&& payload.phase === 'rows'
		&& Array.isArray(payload.items);
}

function chunkItems(items, chunkSize) {
	const source = Array.isArray(items) ? items : [];
	const size = normalizeLimit(chunkSize, 200);
	const chunks = [];
	for (let i = 0; i < source.length; i += size)
		chunks.push(source.slice(i, i + size));
	return chunks;
}

function getRowsAcceptedCount(payload, requestedCount) {
	if (!payload || payload !== Object(payload) || payload.truncated !== true)
		return requestedCount;
	const limit = normalizeLimit(payload.limit, requestedCount);
	return Math.max(0, Math.min(limit, requestedCount));
}

function getMissingRowItems(requestedItems, returnedItems) {
	const returnedKeys = new Set();
	const rows = Array.isArray(returnedItems) ? returnedItems : [];
	for (let i = 0; i < rows.length; i++) {
		const key = syncItemKey(rows[i]);
		if (key)
			returnedKeys.add(key);
	}
	const missing = [];
	const requested = Array.isArray(requestedItems) ? requestedItems : [];
	for (let i = 0; i < requested.length; i++) {
		const key = syncItemKey(requested[i]);
		if (key && !returnedKeys.has(key))
			missing.push(requested[i]);
	}
	return missing;
}

function enqueueMissingRows(queue, requestedItems, missingItems) {
	if (!Array.isArray(missingItems) || missingItems.length === 0)
		return false;
	if (missingItems.length === 1 && requestedItems.length === 1)
		return false;
	if (missingItems.length === requestedItems.length) {
		const midpoint = Math.ceil(missingItems.length / 2);
		queue.unshift(missingItems.slice(midpoint));
		queue.unshift(missingItems.slice(0, midpoint));
		return true;
	}
	queue.unshift(missingItems);
	return true;
}

function syncItemKey(item) {
	if (!item || typeof item.table !== 'string' || !Array.isArray(item.pk))
		return '';
	return `${item.table}|${stringify(item.pk)}`;
}

function pullSessionFromRow(row) {
	return {
		scope: row.scope ?? row.SCOPE,
		since: parseNullableJson(row.since_value ?? row.SINCE_VALUE),
		token: parseNullableJson(row.token_json ?? row.TOKEN_JSON),
		done: Number(row.done ?? row.DONE ?? 0) === 1,
		finalSince: parseNullableJson(row.final_since ?? row.FINAL_SINCE),
		payload: parseNullableJson(row.payload_json ?? row.PAYLOAD_JSON),
		reason: row.reason ?? row.REASON,
		status: row.status ?? row.STATUS,
		nextSeq: Number(row.next_seq ?? row.NEXT_SEQ ?? 0),
		nextBatch: Number(row.next_batch ?? row.NEXT_BATCH ?? 0)
	};
}

function isStreamPullSession(session) {
	return !!session && (
		session.status === streamPullPendingStatus
		|| session.status === streamPullReadyStatus
	);
}

function countApplicablePullJournalItems(items) {
	const list = Array.isArray(items) ? items : [];
	let count = 0;
	for (let i = 0; i < list.length; i++) {
		const item = list[i];
		if (item && (item.op === 'D' || item.row !== undefined))
			count += 1;
	}
	return count;
}

function pullItemFromRow(row) {
	const table = row.table_name ?? row.TABLE_NAME;
	const pk = parseNullableJson(row.pk_json ?? row.PK_JSON);
	if (typeof table !== 'string' || !Array.isArray(pk))
		return null;
	const rowJson = row.row_json ?? row.ROW_JSON;
	const item = {
		batchNo: Number(row.batch_no ?? row.BATCH_NO ?? 0),
		seq: Number(row.seq ?? row.SEQ ?? 0),
		table,
		pk,
		key: parseNullableJson(row.key_json ?? row.KEY_JSON),
		op: normalizeChangeOp(row.op ?? row.OP)
	};
	if (rowJson !== null && rowJson !== undefined)
		item.row = parseNullableJson(rowJson);
	return item;
}

function parseNullableJson(value) {
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

function normalizeKeyItems(items) {
	if (!Array.isArray(items))
		return [];
	const result = [];
	for (let i = 0; i < items.length; i++) {
		const item = items[i];
		if (!item || typeof item.table !== 'string')
			continue;
		if (!Array.isArray(item.pk))
			continue;
		result.push({
			table: item.table,
			pk: item.pk,
			key: item.key,
			op: normalizeChangeOp(item.op),
			...(item.row !== undefined ? { row: item.row } : {})
		});
	}
	return result;
}

function stripInlineRowsFromKeysPayload(payload) {
	if (!payload || !Array.isArray(payload.items) || !payload.items.some(item => item && item.row !== undefined))
		return payload;
	return {
		...payload,
		items: payload.items.map(item => {
			if (!item || item.row === undefined)
				return item;
			const { row, ...keyItem } = item;
			return keyItem;
		})
	};
}

async function applyDeleteItemsOnTx(tx, items, patchOptions) {
	const deletes = Array.isArray(items) ? items : [];
	const perTable = new Map();
	for (let i = 0; i < deletes.length; i++) {
		const item = deletes[i];
		if (!item || typeof item.table !== 'string' || !Array.isArray(item.pk))
			continue;
		if (!perTable.has(item.table))
			perTable.set(item.table, []);
		perTable.get(item.table).push({
			op: 'remove',
			path: `/${JSON.stringify(item.pk)}`
		});
	}

	const tableNames = orderTablesByDependencies(tx, Array.from(perTable.keys())).reverse();
	let applied = 0;
	for (let i = 0; i < tableNames.length; i++) {
		const table = tableNames[i];
		if (!tx[table] || typeof tx[table].patch !== 'function')
			throw new Error(`Table "${table}" does not exist in this client`);
		const patch = perTable.get(table);
		await tx[table].patch(patch, patchOptions);
		applied += patch.length;
	}
	return applied;
}

async function applyRowsPayloadOnTx(tx, items, patchOptions) {
	const rows = Array.isArray(items) ? items : [];
	const perTable = new Map();
	for (let i = 0; i < rows.length; i++) {
		const item = rows[i];
		if (!item || typeof item.table !== 'string' || !Array.isArray(item.pk) || item.row === undefined)
			continue;
		if (!perTable.has(item.table))
			perTable.set(item.table, []);
		perTable.get(item.table).push({
			op: 'add',
			path: `/${JSON.stringify(item.pk)}`,
			value: item.row
		});
	}
	const tableNames = orderTablesByDependencies(tx, Array.from(perTable.keys()));
	if (tableNames.length === 0)
		return 0;

	let applied = 0;
	for (let i = 0; i < tableNames.length; i++) {
		const table = tableNames[i];
		if (!tx[table] || typeof tx[table].patch !== 'function')
			throw new Error(`Table "${table}" does not exist in this client`);
		const patch = perTable.get(table);
		await tx[table].patch(patch, withInsertAndForgetStrategy(patchOptions));
		applied += patch.length;
	}
	return applied;
}

function flattenPullJournalBatches(batches) {
	if (!Array.isArray(batches))
		return [];
	const result = [];
	for (let i = 0; i < batches.length; i++) {
		const batch = batches[i];
		if (Array.isArray(batch))
			result.push(...batch);
	}
	return result;
}

function yieldPullApply(applyConfig) {
	const yieldMs = applyConfig && Number(applyConfig.yieldMs || 0);
	if (!Number.isFinite(yieldMs) || yieldMs <= 0)
		return Promise.resolve();
	return new Promise((resolve) => {
		setTimeout(resolve, yieldMs);
	});
}

function newPullBatchTimings() {
	return {
		journalInsertMs: 0,
		dataApplyMs: 0,
		stableBaseMs: 0,
		sessionUpdateMs: 0,
		transactionMs: 0,
		transactionFinalizeMs: 0
	};
}

function newPullStagingTimings(deferredStableBase) {
	return {
		batchCount: 0,
		keyCount: 0,
		rowCount: 0,
		rowsElapsedMs: 0,
		deltaPersistMs: 0,
		bulkStableBaseMs: 0,
		applied: 0,
		elapsedMs: 0,
		deferredStableBase,
		...newPullBatchTimings()
	};
}

function addPullBatchTimings(summary, batch) {
	if (!summary || !batch)
		return;
	summary.batchCount += 1;
	summary.keyCount += Number(batch.keyCount || 0);
	summary.rowCount += Number(batch.rowCount || 0);
	summary.rowsElapsedMs += Number(batch.rowsElapsedMs || 0);
	summary.deltaPersistMs += Number(batch.deltaPersistMs || 0);
	const timingKeys = Object.keys(newPullBatchTimings());
	for (let i = 0; i < timingKeys.length; i++) {
		const key = timingKeys[i];
		summary[key] += Number(batch[key] || 0);
	}
}

function addPullTiming(timings, key, startedAtMs) {
	if (!timings)
		return;
	timings[key] = Number(timings[key] || 0) + elapsedMs(startedAtMs);
}

function notifyPullDiagnostic(listener, payload) {
	if (typeof listener !== 'function')
		return;
	try {
		listener(payload);
	}
	catch (_e) {
		// Diagnostics must never interrupt sync.
	}
}

function elapsedMs(startedAtMs) {
	return Math.max(0, Date.now() - startedAtMs);
}

function withInsertAndForgetStrategy(options) {
	const strategy = options && options.strategy && options.strategy === Object(options.strategy)
		? options.strategy
		: undefined;
	if (strategy && strategy.insertAndForget === false)
		return options || {};
	return { ...(options || {}), strategy: { ...(strategy || {}), insertAndForget: true } };
}

function orderTablesByDependencies(client, tableNames) {
	if (!Array.isArray(tableNames) || tableNames.length <= 1)
		return tableNames || [];
	const dependencyMap = buildDependencyMap(client);
	const pending = new Set(tableNames);
	const ordered = [];
	while (pending.size > 0) {
		let progressed = false;
		for (let i = 0; i < tableNames.length; i++) {
			const name = tableNames[i];
			if (!pending.has(name))
				continue;
			const deps = dependencyMap.get(name) || new Set();
			let blocked = false;
			for (let dep of deps) {
				if (pending.has(dep)) {
					blocked = true;
					break;
				}
			}
			if (!blocked) {
				pending.delete(name);
				ordered.push(name);
				progressed = true;
			}
		}
		if (!progressed) {
			for (let i = 0; i < tableNames.length; i++) {
				const name = tableNames[i];
				if (pending.has(name)) {
					pending.delete(name);
					ordered.push(name);
				}
			}
		}
	}
	return ordered;
}

function buildDependencyMap(client) {
	const dependencyMap = new Map();
	const tables = client && client.tables ? client.tables : {};
	const names = Object.keys(tables);
	const nameByTableObject = new Map();
	for (let i = 0; i < names.length; i++) {
		const name = names[i];
		const table = tables[name];
		if (table)
			nameByTableObject.set(table, name);
		dependencyMap.set(name, new Set());
	}

	for (let i = 0; i < names.length; i++) {
		const table = tables[names[i]];
		if (!table || !table._relations)
			continue;
		const relations = table._relations;
		for (let relationName in relations) {
			const relation = relations[relationName];
			const join = extractJoinRelation(relation);
			if (!join)
				continue;
			const fromName = nameByTableObject.get(join.parentTable);
			const toName = nameByTableObject.get(join.childTable);
			if (!fromName || !toName || fromName === toName)
				continue;
			dependencyMap.get(fromName).add(toName);
		}
	}
	return dependencyMap;
}

function extractJoinRelation(relation) {
	if (!relation || typeof relation.accept !== 'function')
		return;
	let join;
	relation.accept({
		visitJoin: function(current) {
			join = current;
		},
		visitOne: function(current) {
			join = current && current.joinRelation;
		},
		visitMany: function(current) {
			join = current && current.joinRelation;
		}
	});
	return join;
}

function normalizeChangeOp(value) {
	if (typeof value !== 'string')
		return 'U';
	const op = value.toUpperCase();
	if (op === 'I' || op === 'U' || op === 'D')
		return op;
	return 'U';
}

async function tryDeferForeignKeys(tx) {
	if (!tx || typeof tx.query !== 'function')
		return;
	try {
		await tx.query('PRAGMA defer_foreign_keys = ON');
	}
	catch (_e) {
		// Non-sqlite engines can safely ignore this pragma.
	}
}

async function tryEnableForeignKeys(db) {
	if (!db || typeof db.query !== 'function')
		return;
	try {
		await db.query('PRAGMA foreign_keys = ON');
	}
	catch (_e) {
		// Non-sqlite engines can safely ignore this pragma.
	}
}

async function validateForeignKeys(tx) {
	if (!tx || typeof tx.query !== 'function')
		return;
	try {
		const rows = await tx.query('PRAGMA foreign_key_check');
		if (Array.isArray(rows) && rows.length > 0) {
			const first = rows[0];
			throw new Error(`Foreign key validation failed after sync apply (${first.table || 'unknown table'})`);
		}
	}
	catch (e) {
		if (e && typeof e.message === 'string' && e.message.startsWith('Foreign key validation failed'))
			throw e;
		// Ignore on engines that do not support pragma.
	}
}

function normalizeLimit(value, fallback) {
	const parsed = Number.parseInt(value, 10);
	if (!Number.isFinite(parsed) || parsed <= 0)
		return fallback;
	return Math.min(parsed, 10000);
}

function normalizeOptionalPositiveInteger(value) {
	const parsed = Number.parseInt(value, 10);
	if (!Number.isFinite(parsed) || parsed <= 0)
		return undefined;
	return Math.min(parsed, 10000);
}

function normalizeNonNegativeInteger(value, fallback) {
	const parsed = Number.parseInt(value, 10);
	if (!Number.isFinite(parsed) || parsed < 0)
		return fallback;
	return Math.min(parsed, 10000);
}

function normalizeConcurrency(value, fallback) {
	return Math.min(normalizeLimit(value, fallback), 8);
}

function extractTablePatches(payload) {
	if (!payload)
		return [];
	if (Array.isArray(payload))
		return payload.map(normalizeTablePatch);
	if (payload.table && payload.patch)
		return [normalizeTablePatch(payload)];
	if (payload.tables !== undefined)
		return normalizeTablePatchList(payload.tables);
	if (payload.patches !== undefined)
		return normalizeTablePatchList(payload.patches);
	return [];
}

function normalizeTablePatchList(input) {
	if (Array.isArray(input))
		return input.map(normalizeTablePatch);
	if (input !== Object(input))
		throw new Error('Invalid sync patch payload');
	const result = [];
	const names = Object.keys(input);
	for (let i = 0; i < names.length; i++) {
		const table = names[i];
		const value = input[table];
		if (Array.isArray(value))
			result.push(normalizeTablePatch({ table, patch: value }));
		else
			result.push(normalizeTablePatch({ table, ...value }));
	}
	return result;
}

function normalizeTablePatch(entry) {
	if (!entry || typeof entry.table !== 'string')
		throw new Error('Each sync patch entry must contain "table"');
	if (!Array.isArray(entry.patch))
		throw new Error(`Sync patch entry for "${entry.table}" must contain "patch" array`);
	return {
		table: entry.table,
		patch: entry.patch,
		options: entry.options
	};
}

function shouldFallbackToPatch(error) {
	const message = extractErrorMessage(error);
	if (!message)
		return false;
	return message.includes('staged keys payload')
		|| message.includes('staged rows payload')
		|| message.includes('Invalid sync phase');
}

function extractErrorMessage(error) {
	if (!error)
		return '';
	if (typeof error.message === 'string' && error.message)
		return error.message;
	if (typeof error.response?.data === 'string')
		return error.response.data;
	return '';
}

function isInitialReadyState(state, maxAgeMs) {
	if (!state || state.since === undefined || state.since === null)
		return false;
	if (maxAgeMs === undefined)
		return true;
	if (!Number.isFinite(state.updatedAtMs))
		return false;
	return Date.now() - state.updatedAtMs <= maxAgeMs;
}

function sqlStringLiteral(value) {
	return `'${String(value).replace(/'/g, '\'\'')}'`;
}

function sqlValuePredicate(columnSql, value) {
	if (value === null || value === undefined)
		return `${columnSql} IS NULL`;
	return `${columnSql} = ${sqlValueLiteral(value)}`;
}

function sqlValueLiteral(value) {
	if (typeof value === 'number' && Number.isFinite(value))
		return String(value);
	if (typeof value === 'bigint')
		return String(value);
	if (typeof value === 'boolean')
		return value ? '1' : '0';
	return sqlStringLiteral(value);
}

function sqlNullableStringLiteral(value) {
	if (value === undefined || value === null)
		return 'NULL';
	return sqlStringLiteral(value);
}

function sqlNullableJsonLiteral(value) {
	if (value === undefined || value === null)
		return 'NULL';
	return sqlStringLiteral(stringify(value));
}

function sqlNullableNumberLiteral(value) {
	if (value === undefined || value === null)
		return 'NULL';
	const parsed = Number(value);
	return Number.isFinite(parsed) ? String(parsed) : 'NULL';
}

module.exports = newSyncClient;
module.exports.ensureLocalSchemaReadySymbol = ensureLocalSchemaReadySymbol;
module.exports.syncAndCapturePullJournalSymbol = syncAndCapturePullJournalSymbol;
module.exports.readOutboxRowsSymbol = readOutboxRowsSymbol;
module.exports.applyOutboxRowsSymbol = applyOutboxRowsSymbol;
module.exports.applyPullJournalSymbol = applyPullJournalSymbol;
module.exports.applySqliteSnapshotSymbol = applySqliteSnapshotSymbol;
module.exports.pushPendingSymbol = pushPendingSymbol;
module.exports.setClientIdSymbol = setClientIdSymbol;
