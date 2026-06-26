const randomUuid = require('../randomUuid');
const stringify = require('./stringify');
const { createSyncAuto } = require('./syncAuto');
const outboxTableSql = require('../sync/outboxTableSql');
const { ensureSyncSchema, clearEnsuredSyncSchema } = require('./syncSchema');

function newSyncClient(client, getDb, axiosInterceptor) {
	const sinceByScope = new Map();
	const ensuredInternalTables = new WeakMap();
	const syncStateTable = 'orange_sync_state';
	const syncClientTable = 'orange_sync_client';
	const syncOutboxTable = 'orange_sync_outbox';
	const syncPullSessionTable = 'orange_sync_pull_session';
	const syncPullItemTable = 'orange_sync_pull_item';
	const syncBaseTable = 'orange_sync_base_tables';
	const syncBasePrefix = 'orange_sync_base_data_';
	const initialReadyListeners = new Set();
	const eventListeners = new Map();
	let initialReadyEmitted = false;
	const lockedSync = withCrossTabSyncLock(sync);
	const lockedResetLocal = withCrossTabSyncLock(resetLocal);
	const observedSync = observeSyncMethod('sync', lockedSync);
	const auto = createSyncAuto({
		sync: observedSync
	}, getConfig);

	return {
		sync: observedSync,
		resetLocal: lockedResetLocal,
		start: auto.start,
		stop: auto.stop,
		isRunning: auto.isRunning,
		getConfig,
		on,
		off,
		once,
		waitForInitialReady
	};

	function withCrossTabSyncLock(fn) {
		return async function lockedSyncMethod(options) {
			const db = await getDb();
			const syncConfig = normalizeSyncConfig(db && db.__sqliteSync);
			if (!syncConfig)
				return fn(options);
			const lockConfig = withRuntimeCrossTabLockConfig(syncConfig.crossTabLock, options);
			return runWithCrossTabLock(resolveCrossTabLockName(db, syncConfig), lockConfig, () => fn(options));
		};
	}

	async function sync(options = {}) {
		await pull(normalizeSyncOptions(options));
	}

	async function getConfig() {
		const db = await getDb();
		return normalizeSyncConfig(db && db.__sqliteSync);
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
		const db = await getDb();
		const syncConfig = normalizeSyncConfig(db && db.__sqliteSync);
		if (!syncConfig)
			throw new Error('Sync is not configured. Add sync in sqlite options: sqlite(connectionString, { sync: ... })');

		const pullOptions = normalizePullOptions(options);
		const pullConfig = resolvePullConfig(syncConfig, pullOptions);
		const configuredTables = resolveSyncTables(db, pullConfig.tables, client);
		if (!Array.isArray(configuredTables) || configuredTables.length === 0)
			throw new Error('Sync pull requires mapped tables or configured tables. Set sync.tables when the client has no table map.');
		await ensureSyncSchema(db, client, configuredTables, syncConfig.schema);
		const hadStableBase = await hasStableBase(db);
		const pushResult = await pushBeforePull(db, syncConfig, hadStableBase);
		await maybeEmitInitialReady(syncConfig, configuredTables, db, 'persisted');
		const currentSince = await getScopeSince(configuredTables, db);
		const scopeKey = getScopeKey(configuredTables);
		const requestOptions = {
			tables: configuredTables,
			since: currentSince,
			db,
			scopeKey,
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
		if (!hadStableBase)
			await clearPendingMutations(db);
		if (shouldSaveStableBase(hadStableBase, pushResult, result))
			await saveStableBase(db);
		await maybeEmitInitialReady(syncConfig, configuredTables, db, 'sync');
		return result;
	}

	async function resetLocal(options = {}) {
		const db = await getDb();
		const syncConfig = normalizeSyncConfig(db && db.__sqliteSync);
		if (!syncConfig)
			throw new Error('Sync is not configured. Add sync in sqlite options: sqlite(connectionString, { sync: ... })');
		if (!options || options.force !== true)
			throw new Error('resetLocal requires { force: true } because it deletes local sync data.');

		const configuredTables = resolveSyncTables(db, normalizeConfiguredTables(options.tables) || syncConfig.tables, client);
		if (!Array.isArray(configuredTables) || configuredTables.length === 0)
			throw new Error('Sync resetLocal requires mapped tables or configured tables.');
		const droppedTables = await dropLocalSyncTables(db, client, configuredTables);
		await dropExistingBaseTables(db);
		await db.query(`DROP TABLE IF EXISTS "${syncBaseTable}"`);
		sinceByScope.clear();
		ensuredInternalTables.delete(db);
		clearEnsuredSyncSchema(db);
		initialReadyEmitted = false;
		return {
			reset: true,
			tables: configuredTables,
			droppedTables
		};
	}

	async function pushPending(options = {}) {
		const db = await getDb();
		const syncConfig = options._syncConfig || normalizeSyncConfig(db && db.__sqliteSync);
		if (!syncConfig)
			throw new Error('Sync is not configured. Add sync in sqlite options: sqlite(connectionString, { sync: ... })');
		const pushConfig = options._pushConfig || resolvePushConfig(syncConfig, options);
		const configuredTables = resolveSyncTables(db, syncConfig.tables, client);
		await ensureSyncSchema(db, client, configuredTables, syncConfig.schema);
		const limit = 1;
		const pending = await readPendingMutations(db, limit);
		if (pending.length === 0)
			return { phase: 'push', applied: 0, duplicates: 0, results: [] };
		const clientId = typeof options.clientId === 'string' ? options.clientId : await getClientId(db);
		let result;
		try {
			result = await sendPush(pushConfig, clientId, pending);
		}
		catch (e) {
			if (isConflictError(e))
				await rollbackFailedPushBatch(db, pending);
			throw e;
		}
		await markPushedMutations(db, result);
		return result;
	}

	async function pushBeforePull(db, syncConfig, hasBase) {
		if (!hasBase)
			return;
		const pending = await readPendingMutations(db, 1);
		if (pending.length === 0)
			return;
		return pushPending({ _syncConfig: syncConfig, _pushConfig: resolvePushConfig(syncConfig) });
	}

	function shouldSaveStableBase(hadStableBase, pushResult, pullResult) {
		return !hadStableBase || didPushMutations(pushResult) || didPullRows(pullResult);
	}

	function didPushMutations(result) {
		if (!result)
			return false;
		if (Number(result.applied) > 0 || Number(result.duplicates) > 0)
			return true;
		return Array.isArray(result.results) && result.results.length > 0;
	}

	function didPullRows(result) {
		return Number(result && result.applied) > 0;
	}

	async function rollbackFailedPushBatch(db, attemptedMutations) {
		if (!await hasStableBase(db))
			return;
		const remaining = await readPendingMutationRows(db, 10000, mutationIdsToSet(attemptedMutations));
		await restoreStableBase(db);
		await ensureSyncOutboxTable(db);
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
				mutations
			}
		}, {
			_syncAxiosInterceptor: axiosInterceptor
		});
	}

	function isConflictError(error) {
		return Number(error && error.response && error.response.status) === 409
			|| Number(error && error.status) === 409;
	}

	async function pullStaged(pullConfig, options) {
		const maxKeysPerBatch = normalizeLimit(pullConfig.maxKeysPerBatch, 200);
		const maxRowsPerBatch = normalizeLimit(pullConfig.maxRowsPerBatch, 200);
		const maxJournalRowsPerInsert = normalizeLimit(pullConfig.maxJournalRowsPerInsert, maxRowsPerBatch);
		const defaultPatchOptions = { ...(pullConfig.patchOptions || {}), concurrency: 'overwrite', skipSelectAfterInsert: true };
		const db = options.db;
		const scopeKey = options.scopeKey || getScopeKey(options.tables);
		await ensurePullJournalTables(db);
		const session = await stagePullJournal();
		let applied = 0;
		const shouldApplyCheckpoint = session.finalSince !== undefined;
		await client.transaction(async (tx) => {
			await tryDeferForeignKeys(tx);
			const batches = await readPullJournalBatches(tx, scopeKey);
			const touchedTables = new Set();
			for (let i = 0; i < batches.length; i++) {
				const batch = batches[i];
				for (let itemIndex = 0; itemIndex < batch.length; itemIndex++)
					touchedTables.add(batch[itemIndex].table);
				const deleteItems = batch.filter(x => x.op === 'D');
				const upsertItems = batch.filter(x => x.op !== 'D' && x.row !== undefined);
				if (deleteItems.length > 0)
					applied += await applyDeleteItemsOnTx(tx, deleteItems, defaultPatchOptions);
				if (upsertItems.length > 0)
					applied += await applyRowsPayloadOnTx(tx, upsertItems, defaultPatchOptions);
			}
			await validateForeignKeys(tx);
			if (shouldApplyCheckpoint)
				await writeScopeState(scopeKey, { since: session.finalSince, updatedAtMs: Date.now() }, tx);
			await clearPullJournal(tx, scopeKey);
			session.tables = Array.from(touchedTables);
		}, { suppressSyncOutbox: true });
		if (shouldApplyCheckpoint)
			sinceByScope.set(scopeKey, session.finalSince);

		return {
			applied,
			tables: session.tables || [],
			since: session.finalSince,
			payload: session.payload,
			checkpointApplied: true
		};

		async function stagePullJournal() {
			let session = await readPullSession(db, scopeKey);
			let hasPersistedSession = !!session;
			if (!session)
				session = newPullSession(scopeKey, options.since);
			let reason = session.reason;
			for (let i = 0; i < 10000; i++) {
				if (session.done)
					return session;
				const keysPayload = await requestPayload({
					...pullConfig,
					body: {
						phase: 'keys',
						token: session.token,
						since: session.since,
						tables: options.tables,
						limit: maxKeysPerBatch
					}
				}, options);
				if (!isStagedKeysPayload(keysPayload))
					throw new Error('Sync endpoint did not return staged keys payload');
				if (reason === undefined && keysPayload.reason !== undefined)
					reason = keysPayload.reason;
				const keyItems = normalizeKeyItems(keysPayload.items);
				const upsertItems = keyItems.filter(x => x.op !== 'D');
				let rowItems = [];
				if (upsertItems.length > 0)
					rowItems = await fetchRowsItems(upsertItems);
				if (!hasPersistedSession) {
					session = await createPullSession(db, scopeKey, session.since);
					hasPersistedSession = true;
				}
				session = await persistPullJournalBatch(db, scopeKey, session, keysPayload, keyItems, rowItems, reason, maxJournalRowsPerInsert);
			}
			throw new Error('Sync failed: staged pull exceeded max iterations');
		}

		async function fetchRowsItems(items) {
			const queue = chunkItems(items, maxRowsPerBatch);
			const rows = [];
			let prefetched = null;
			while (queue.length > 0 || prefetched) {
				let currentItems;
				let currentRowsResult;
				if (prefetched) {
					currentItems = prefetched.items;
					currentRowsResult = await prefetched.promise;
					prefetched = null;
				}
				else {
					currentItems = queue.shift();
					currentRowsResult = await requestRowsItems(currentItems);
				}
				if (!Array.isArray(currentItems) || currentItems.length === 0)
					continue;
				if (currentRowsResult.error)
					throw currentRowsResult.error;
				const payload = currentRowsResult.payload;
				if (!isRowsPayload(payload))
					throw new Error('Sync endpoint did not return rows payload');
				for (let i = 0; i < payload.items.length; i++)
					rows.push(payload.items[i]);
				const acceptedCount = getRowsAcceptedCount(payload, currentItems.length);
				const acceptedItems = acceptedCount < currentItems.length
					? currentItems.slice(0, acceptedCount)
					: currentItems;
				const missingItems = getMissingRowItems(acceptedItems, payload.items);
				if (acceptedCount >= currentItems.length && missingItems.length === 0 && queue.length > 0) {
					const nextItems = queue.shift();
					prefetched = {
						items: nextItems,
						promise: requestRowsItems(nextItems)
					};
				}
				if (acceptedCount < currentItems.length) {
					const deferredItems = currentItems.slice(acceptedCount);
					enqueueMissingRows(queue, acceptedItems, missingItems);
					if (deferredItems.length > 0)
						queue.unshift(deferredItems);
					continue;
				}
				enqueueMissingRows(queue, currentItems, missingItems);
			}
			return rows;
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

	async function createPullSession(db, scopeKey, since) {
		await ensurePullJournalTables(db);
		const now = Date.now();
		await db.query([
			`INSERT INTO "${syncPullSessionTable}" ("scope", "since_value", "token_json", "done", "final_since", "payload_json", "reason", "status", "next_seq", "next_batch", "updated_at_ms")`,
			`VALUES (${sqlStringLiteral(scopeKey)}, ${sqlNullableJsonLiteral(since)}, NULL, 0, ${sqlNullableJsonLiteral(since)}, NULL, NULL, 'pending', 0, 0, ${now})`
		].join(' '));
		return newPullSession(scopeKey, since);
	}

	function newPullSession(scopeKey, since) {
		return {
			scope: scopeKey,
			since,
			token: undefined,
			done: false,
			finalSince: since,
			payload: undefined,
			reason: undefined,
			status: 'pending',
			nextSeq: 0,
			nextBatch: 0
		};
	}

	async function persistPullJournalBatch(db, scopeKey, session, keysPayload, keyItems, rowItems, reason, maxJournalRowsPerInsert) {
		let nextSession;
		await client.transaction(async (tx) => {
			const rowMap = rowsBySyncItemKey(rowItems);
			const batchNo = session.nextBatch || 0;
			let seq = session.nextSeq || 0;
			const journalRows = [];
			for (let i = 0; i < keyItems.length; i++) {
				const item = keyItems[i];
				const rowItem = item.op === 'D' ? undefined : rowMap.get(syncItemKey(item));
				journalRows.push([
					sqlStringLiteral(scopeKey),
					String(batchNo),
					String(seq),
					sqlStringLiteral(item.table),
					sqlStringLiteral(stringify(item.pk)),
					sqlNullableJsonLiteral(item.key),
					sqlStringLiteral(item.op),
					sqlNullableJsonLiteral(rowItem ? rowItem.row : undefined)
				]);
				seq += 1;
			}
			await insertPullJournalItems(tx, journalRows, maxJournalRowsPerInsert);
			const finalSince = keysPayload.cursor !== undefined ? keysPayload.cursor : session.finalSince;
			const payload = reason === undefined ? keysPayload : { ...keysPayload, reason };
			const token = keysPayload.done || !keysPayload.token ? null : keysPayload.token;
			const done = keysPayload.done || !keysPayload.token ? 1 : 0;
			await tx.query([
				`UPDATE "${syncPullSessionTable}"`,
				`SET "token_json" = ${sqlNullableJsonLiteral(token)},`,
				`"done" = ${done},`,
				`"final_since" = ${sqlNullableJsonLiteral(finalSince)},`,
				`"payload_json" = ${sqlNullableJsonLiteral(payload)},`,
				`"reason" = ${sqlNullableStringLiteral(reason)},`,
				`"status" = ${sqlStringLiteral(done ? 'ready' : 'pending')},`,
				`"next_seq" = ${seq},`,
				`"next_batch" = ${batchNo + 1},`,
				`"updated_at_ms" = ${Date.now()}`,
				`WHERE "scope" = ${sqlStringLiteral(scopeKey)}`
			].join(' '));
			nextSession = {
				...session,
				token: token || undefined,
				done: done === 1,
				finalSince,
				payload,
				reason,
				status: done ? 'ready' : 'pending',
				nextSeq: seq,
				nextBatch: batchNo + 1
			};
		}, { suppressSyncOutbox: true });
		return nextSession;
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

	async function clearPullJournal(db, scopeKey) {
		await db.query(`DELETE FROM "${syncPullItemTable}" WHERE "scope" = ${sqlStringLiteral(scopeKey)}`);
		await db.query(`DELETE FROM "${syncPullSessionTable}" WHERE "scope" = ${sqlStringLiteral(scopeKey)}`);
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
		await ensureSyncOutboxTable(db);
		const rows = await db.query([
			`SELECT "mutation_id", "table_name", "patch_json", "options_json", "created_at_ms", "status", "last_error", "attempts", "pushed_at_ms", "result_json" FROM "${syncOutboxTable}"`,
			'WHERE "status" = \'pending\'',
			'ORDER BY "created_at_ms" ASC',
			`LIMIT ${limit}`
		].join(' '));
		const list = Array.isArray(rows) ? rows : rows?.rows || [];
		if (!excludeIds || excludeIds.size === 0)
			return list;
		return list.filter(row => !excludeIds.has(row.mutation_id ?? row.MUTATION_ID));
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
					return {
						id,
						patches: Array.isArray(parsedPatch.patches) ? parsedPatch.patches : [],
						commands: Array.isArray(parsedPatch.commands) ? parsedPatch.commands : [],
						options: optionsJson ? JSON.parse(optionsJson) : undefined
					};
				}
				return {
					id,
					patches: parsedPatch,
					options: optionsJson ? JSON.parse(optionsJson) : undefined
				};
			}
			return {
				id,
				table,
				patch: parsedPatch,
				options: optionsJson ? JSON.parse(optionsJson) : undefined
			};
		}
		catch (_e) {
			return null;
		}
	}

	async function markPushedMutations(db, result) {
		const results = Array.isArray(result && result.results) ? result.results : [];
		if (results.length === 0)
			return;
		await ensureSyncOutboxTable(db);
		const now = Date.now();
		for (let i = 0; i < results.length; i++) {
			const item = results[i];
			if (!item || typeof item.id !== 'string')
				continue;
			await db.query([
				`UPDATE "${syncOutboxTable}"`,
				`SET "status" = 'pushed', "pushed_at_ms" = ${now}, "result_json" = ${sqlStringLiteral(stringify(item))}`,
				`WHERE "mutation_id" = ${sqlStringLiteral(item.id)}`
			].join(' '));
		}
	}

	async function insertOutboxRow(db, row) {
		const mutationId = row.mutation_id ?? row.MUTATION_ID;
		const tableName = row.table_name ?? row.TABLE_NAME;
		const patchJson = row.patch_json ?? row.PATCH_JSON;
		const optionsJson = row.options_json ?? row.OPTIONS_JSON;
		const createdAtMs = Number(row.created_at_ms ?? row.CREATED_AT_MS ?? Date.now());
		const status = row.status ?? row.STATUS ?? 'pending';
		const lastError = row.last_error ?? row.LAST_ERROR;
		const attempts = Number(row.attempts ?? row.ATTEMPTS ?? 0);
		const pushedAtMs = row.pushed_at_ms ?? row.PUSHED_AT_MS;
		const resultJson = row.result_json ?? row.RESULT_JSON;
		if (typeof mutationId !== 'string' || typeof tableName !== 'string' || typeof patchJson !== 'string')
			return;
		await db.query([
			`INSERT INTO "${syncOutboxTable}" ("mutation_id", "table_name", "patch_json", "options_json", "created_at_ms", "status", "last_error", "attempts", "pushed_at_ms", "result_json")`,
			`VALUES (${sqlStringLiteral(mutationId)}, ${sqlStringLiteral(tableName)}, ${sqlStringLiteral(patchJson)}, ${sqlNullableStringLiteral(optionsJson)}, ${Number.isFinite(createdAtMs) ? createdAtMs : Date.now()}, ${sqlStringLiteral(status)}, ${sqlNullableStringLiteral(lastError)}, ${Number.isFinite(attempts) ? attempts : 0}, ${sqlNullableNumberLiteral(pushedAtMs)}, ${sqlNullableStringLiteral(resultJson)})`,
			'ON CONFLICT("mutation_id") DO UPDATE SET',
			'"table_name" = excluded."table_name",',
			'"patch_json" = excluded."patch_json",',
			'"options_json" = excluded."options_json",',
			'"created_at_ms" = excluded."created_at_ms",',
			'"status" = excluded."status",',
			'"last_error" = excluded."last_error",',
			'"attempts" = excluded."attempts",',
			'"pushed_at_ms" = excluded."pushed_at_ms",',
			'"result_json" = excluded."result_json"'
		].join(' '));
	}

	async function clearPendingMutations(db) {
		await ensureSyncOutboxTable(db);
		await db.query(`DELETE FROM "${syncOutboxTable}" WHERE "status" = 'pending'`);
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

	async function hasStableBase(db) {
		if (!db || typeof db.query !== 'function')
			return false;
		try {
			await ensureSyncBaseTable(db);
			const rows = await db.query(`SELECT "name" FROM "${syncBaseTable}" LIMIT 1`);
			const list = Array.isArray(rows) ? rows : rows?.rows || [];
			return list.length > 0;
		}
		catch (_e) {
			return false;
		}
	}

	async function saveStableBase(db) {
		if (!db || typeof db.query !== 'function')
			return;
		await client.transaction(async (tx) => {
			await ensureSyncBaseTable(tx);
			const tables = await readSqliteTables(tx);
			await dropExistingBaseTables(tx);
			await tx.query(`DELETE FROM "${syncBaseTable}"`);
			for (let i = 0; i < tables.length; i++) {
				const table = tables[i];
				const baseName = toBaseTableName(table.name);
				await tx.query(`CREATE TABLE ${quoteIdent(baseName)} AS SELECT * FROM ${quoteIdent(table.name)}`);
				await tx.query([
					`INSERT INTO "${syncBaseTable}" ("name", "base_name", "schema_sql", "ordinal") VALUES (`,
					`${sqlStringLiteral(table.name)}, ${sqlStringLiteral(baseName)}, ${sqlNullableStringLiteral(table.sql)}, ${i}`,
					')'
				].join(' '));
			}
		}, { suppressSyncOutbox: true });
	}

	async function restoreStableBase(db) {
		if (!db || typeof db.query !== 'function')
			return;
		await client.transaction(async (tx) => {
			await ensureSyncBaseTable(tx);
			const entries = await readStableBaseEntries(tx);
			if (entries.length === 0)
				return;
			const entryNames = new Set(entries.map(x => x.name));
			const currentTables = await readSqliteTables(tx);
			await tx.query('PRAGMA foreign_keys = OFF');
			try {
				for (let i = 0; i < currentTables.length; i++) {
					const table = currentTables[i];
					if (entryNames.has(table.name))
						continue;
					await tx.query(`DROP TABLE IF EXISTS ${quoteIdent(table.name)}`);
				}
				const currentNames = new Set(currentTables.map(x => x.name));
				for (let i = 0; i < entries.length; i++) {
					const entry = entries[i];
					if (!currentNames.has(entry.name) && entry.schemaSql)
						await tx.query(entry.schemaSql);
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

	async function readSqliteTables(db) {
		const rows = await db.query([
			'SELECT "name", "sql" FROM sqlite_schema',
			'WHERE "type" = \'table\'',
			'ORDER BY "name" ASC'
		].join(' '));
		const list = Array.isArray(rows) ? rows : rows?.rows || [];
		return list
			.map(row => ({
				name: row.name ?? row.NAME,
				sql: row.sql ?? row.SQL
			}))
			.filter(table => shouldCheckpointTable(table.name));
	}

	async function dropExistingBaseTables(db) {
		const rows = await db.query([
			'SELECT "name" FROM sqlite_schema',
			'WHERE "type" = \'table\'',
			`AND "name" LIKE ${sqlStringLiteral(syncBasePrefix + '%')}`
		].join(' '));
		const list = Array.isArray(rows) ? rows : rows?.rows || [];
		for (let i = 0; i < list.length; i++) {
			const name = list[i].name ?? list[i].NAME;
			if (typeof name === 'string' && name.startsWith(syncBasePrefix))
				await db.query(`DROP TABLE IF EXISTS ${quoteIdent(name)}`);
		}
	}

	function shouldCheckpointTable(name) {
		return typeof name === 'string'
			&& !name.startsWith('sqlite_')
			&& name !== syncBaseTable
			&& name !== syncPullSessionTable
			&& name !== syncPullItemTable
			&& !name.startsWith(syncBasePrefix);
	}

	function toBaseTableName(name) {
		return syncBasePrefix + toHexName(name);
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

	async function waitForInitialReady() {
		const existing = await maybeEmitInitialReadyFromDb('persisted');
		if (existing)
			return existing;
		return new Promise((resolve) => {
			const unsubscribe = once('initial-ready', (payload) => {
				unsubscribe();
				resolve(payload);
			});
		});
	}

	async function maybeEmitInitialReadyFromDb(source) {
		const db = await getDb();
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
		push: normalizeEndpoint(sync.push),
		crossTabLock: normalizeCrossTabLockConfig(sync.crossTabLock)
	};
}

function normalizeCrossTabLockConfig(value) {
	if (value === false)
		return { enabled: false };
	if (value === true || value === undefined || value === null)
		return { enabled: true };
	if (typeof value === 'string')
		return { enabled: true, name: value };
	if (value !== Object(value))
		throw new Error('Invalid sqlite sync crossTabLock configuration');
	return {
		enabled: value.enabled !== false,
		name: typeof value.name === 'string' && value.name.length > 0 ? value.name : undefined,
		timeoutMs: normalizePositiveInteger(value.timeoutMs),
		maxHoldMs: normalizePositiveInteger(value.maxHoldMs),
		staleMs: normalizePositiveInteger(value.staleMs),
		pollMs: normalizePositiveInteger(value.pollMs)
	};
}

function withRuntimeCrossTabLockConfig(config, options) {
	if (!config || !config.enabled)
		return config;
	const timeoutMs = normalizePositiveInteger(options && options.timeoutMs);
	if (!timeoutMs || config.maxHoldMs)
		return config;
	return {
		...config,
		maxHoldMs: timeoutMs
	};
}

function resolveCrossTabLockName(db, syncConfig) {
	const config = syncConfig && syncConfig.crossTabLock;
	if (config && typeof config.name === 'string' && config.name.length > 0)
		return config.name;
	const identity = db && (
		db.__orangeSyncLockName
		|| db.__orangeSyncIdentity
		|| db.poolFactory && (db.poolFactory.__orangeSyncLockName || db.poolFactory.__orangeSyncIdentity)
	);
	const endpoint = syncConfig && (syncConfig.url || syncConfig.pull && syncConfig.pull.url || syncConfig.push && syncConfig.push.url);
	return `orange-orm:sync:${normalizeLockNamePart(identity || endpoint || 'default')}`;
}

async function runWithCrossTabLock(name, config, fn) {
	const lockConfig = config || { enabled: true };
	if (!lockConfig.enabled)
		return fn();
	const locks = getWebLocks();
	if (locks)
		return runWithWebLock(locks, name, lockConfig, fn);
	const storage = getLocalStorage();
	if (storage)
		return runWithLocalStorageLock(storage, name, lockConfig, fn);
	return fn();
}

function getWebLocks() {
	const nav = typeof globalThis !== 'undefined' ? globalThis.navigator : undefined;
	return nav && nav.locks && typeof nav.locks.request === 'function'
		? nav.locks
		: null;
}

async function runWithWebLock(locks, name, config, fn) {
	const options = { mode: 'exclusive' };
	const timeoutMs = config.timeoutMs;
	let timeoutId;
	let waiting = true;
	let timedOut = false;
	if (timeoutMs && typeof AbortController === 'function') {
		const controller = new AbortController();
		options.signal = controller.signal;
		timeoutId = setTimeout(() => {
			if (!waiting)
				return;
			timedOut = true;
			controller.abort();
		}, timeoutMs);
	}
	try {
		return await locks.request(name, options, async () => {
			waiting = false;
			if (timeoutId) {
				clearTimeout(timeoutId);
				timeoutId = undefined;
			}
			return runLockBody(name, config, fn);
		});
	}
	catch (e) {
		if (timedOut || e && e.name === 'AbortError')
			throw syncLockTimeoutError(name, timeoutMs);
		throw e;
	}
	finally {
		if (timeoutId)
			clearTimeout(timeoutId);
	}
}

function getLocalStorage() {
	if (typeof globalThis === 'undefined' || !globalThis.localStorage)
		return null;
	try {
		const key = 'orange-orm:sync-lock-probe';
		globalThis.localStorage.setItem(key, '1');
		globalThis.localStorage.removeItem(key);
		return globalThis.localStorage;
	}
	catch (_e) {
		return null;
	}
}

async function runWithLocalStorageLock(storage, name, config, fn) {
	const lock = await acquireLocalStorageLock(storage, name, config);
	const renewIntervalMs = Math.max(250, Math.floor(lock.staleMs / 3));
	const intervalId = setInterval(() => {
		try {
			renewLocalStorageLock(storage, lock);
		}
		catch (_e) {
			// A failed renewal will let another tab take the lock after staleMs.
		}
	}, renewIntervalMs);
	try {
		return await runLockBody(name, config, fn);
	}
	finally {
		clearInterval(intervalId);
		releaseLocalStorageLock(storage, lock);
	}
}

async function runLockBody(name, config, fn) {
	const operation = Promise.resolve().then(fn);
	operation.catch(() => {});
	const races = [operation];
	const cleanup = [];
	const maxHoldMs = normalizePositiveInteger(config && config.maxHoldMs);
	if (maxHoldMs) {
		races.push(new Promise((_resolve, reject) => {
			const timeoutId = setTimeout(() => reject(syncLockHoldTimeoutError(name, maxHoldMs)), maxHoldMs);
			cleanup.push(() => clearTimeout(timeoutId));
		}));
	}
	const pageHide = createPageHideLockRelease(name);
	if (pageHide) {
		races.push(pageHide.promise);
		cleanup.push(pageHide.cleanup);
	}
	try {
		return await Promise.race(races);
	}
	finally {
		for (let i = 0; i < cleanup.length; i++)
			cleanup[i]();
	}
}

function createPageHideLockRelease(name) {
	const target = typeof globalThis !== 'undefined' ? globalThis : undefined;
	if (!target || typeof target.addEventListener !== 'function' || typeof target.removeEventListener !== 'function')
		return null;
	let cleanup = () => {};
	const promise = new Promise((_resolve, reject) => {
		const release = () => reject(syncLockPageHiddenError(name));
		target.addEventListener('pagehide', release, { once: true });
		cleanup = () => target.removeEventListener('pagehide', release);
	});
	return { promise, cleanup };
}

async function acquireLocalStorageLock(storage, name, config) {
	const key = `orange-orm:sync-lock:${name}`;
	const owner = randomUuid();
	const staleMs = config.staleMs || 60000;
	const pollMs = config.pollMs || 100;
	const startedAt = Date.now();
	for (;;) {
		const now = Date.now();
		const current = readLocalStorageLock(storage, key);
		if (!current || current.expiresAt <= now || current.owner === owner) {
			writeLocalStorageLock(storage, key, { owner, expiresAt: now + staleMs });
			const next = readLocalStorageLock(storage, key);
			if (next && next.owner === owner)
				return { key, owner, staleMs };
		}
		if (config.timeoutMs && now - startedAt >= config.timeoutMs)
			throw syncLockTimeoutError(name, config.timeoutMs);
		await delay(pollMs);
	}
}

function renewLocalStorageLock(storage, lock) {
	const current = readLocalStorageLock(storage, lock.key);
	if (!current || current.owner !== lock.owner)
		return;
	writeLocalStorageLock(storage, lock.key, {
		owner: lock.owner,
		expiresAt: Date.now() + lock.staleMs
	});
}

function releaseLocalStorageLock(storage, lock) {
	try {
		const current = readLocalStorageLock(storage, lock.key);
		if (current && current.owner === lock.owner)
			storage.removeItem(lock.key);
	}
	catch (_e) {
		// Releasing a best-effort browser lock should not hide the sync result.
	}
}

function readLocalStorageLock(storage, key) {
	const raw = storage.getItem(key);
	if (!raw)
		return null;
	try {
		const parsed = JSON.parse(raw);
		if (!parsed || typeof parsed.owner !== 'string')
			return null;
		const expiresAt = Number(parsed.expiresAt);
		return Number.isFinite(expiresAt) ? { owner: parsed.owner, expiresAt } : null;
	}
	catch (_e) {
		return null;
	}
}

function writeLocalStorageLock(storage, key, value) {
	storage.setItem(key, JSON.stringify(value));
}

function delay(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

function syncLockTimeoutError(name, timeoutMs) {
	return new Error(`Timed out waiting for sync lock "${name}" after ${Math.round((timeoutMs || 0) / 1000)} seconds.`);
}

function syncLockHoldTimeoutError(name, timeoutMs) {
	return new Error(`Timed out while holding sync lock "${name}" after ${Math.round((timeoutMs || 0) / 1000)} seconds.`);
}

function syncLockPageHiddenError(name) {
	return new Error(`Released sync lock "${name}" because the page was hidden.`);
}

function normalizePositiveInteger(value) {
	const parsed = Number.parseInt(value, 10);
	return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

function normalizeLockNamePart(value) {
	return String(value).replace(/\s+/g, ' ').trim() || 'default';
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
		maxKeysPerBatch: config.maxKeysPerBatch,
		maxRowsPerBatch: config.maxRowsPerBatch,
		maxJournalRowsPerInsert: config.maxJournalRowsPerInsert
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
	const pushConfig = normalizeEndpoint(preferred);
	if (!pushConfig || !pushConfig.url)
		throw new Error('No push sync endpoint configured');
	if (options.timeoutMs === undefined)
		return pushConfig;
	return {
		...pushConfig,
		timeoutMs: options.timeoutMs
	};
}

async function requestPayload(config, options) {
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
		timeout: config.timeoutMs
	};
	request.data = requestBody;

	const response = await axios.request(request);
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
			const response = await fetch(config.url, {
				method: config.method?.toUpperCase(),
				headers: {
					'Content-Type': 'application/json',
					'Accept': 'application/json'
				},
				body: config.data === undefined ? undefined : JSON.stringify(config.data),
				signal: abortController && abortController.signal
			});
			const data = await readPayloadResponse(response);
			if (!response.ok) {
				const error = new Error('Request failed with status code ' + response.status);
				error.response = {
					data,
					status: response.status,
					statusText: response.statusText
				};
				throw error;
			}
			return { data };
		}
		finally {
			if (timeout)
				clearTimeout(timeout);
		}
	}
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
		return;
	if (missingItems.length === 1 && requestedItems.length === 1)
		return;
	if (missingItems.length === requestedItems.length) {
		const midpoint = Math.ceil(missingItems.length / 2);
		queue.unshift(missingItems.slice(midpoint));
		queue.unshift(missingItems.slice(0, midpoint));
		return;
	}
	queue.unshift(missingItems);
}

function syncItemKey(item) {
	if (!item || typeof item.table !== 'string' || !Array.isArray(item.pk))
		return '';
	return `${item.table}|${stringify(item.pk)}`;
}

function rowsBySyncItemKey(items) {
	const result = new Map();
	const rows = Array.isArray(items) ? items : [];
	for (let i = 0; i < rows.length; i++) {
		const key = syncItemKey(rows[i]);
		if (key)
			result.set(key, rows[i]);
	}
	return result;
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
			op: normalizeChangeOp(item.op)
		});
	}
	return result;
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
