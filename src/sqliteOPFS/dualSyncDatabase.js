const hostLocal = require('../hostLocal');
const express = require('../hostExpress');
const hono = require('../hostHono');
const randomUuid = require('../randomUuid');
const stringify = require('../client/stringify');
const createHttpInterceptor = require('../client/httpInterceptor');
const newSyncClient = require('../client/syncClient');
const { createSyncAuto, syncAutoStartSymbol } = require('../client/syncAuto');
const connectSqliteOPFSWorker = require('./connectWorkerPort');
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
const roleC = 'c';
const allRoles = [roleA, roleB, roleC];
const stagingReady = 'ready';
const stagingRebuilding = 'rebuilding';
const outboxReplayPageSize = 1000;
const deltaItemsPerChunk = 1000;
const deltaChunkReadPageSize = 32;
const manifestCacheMaxAgeMs = 1000;

function newDualSyncDatabase(connectionString, poolOptions, createSingleDatabase) {
	const roleConnectionStrings = {
		[roleA]: connectionString,
		[roleB]: appendRoleSuffix(connectionString, 'b'),
		[roleC]: appendRoleSuffix(connectionString, 'c')
	};
	const cacheConnectionString = appendRoleSuffix(connectionString, 'delta');
	const primaryDataPoolOptions = withInternalWorkerBroker(
		connectionString,
		toDataPoolOptions(poolOptions)
	);
	const dataPoolOptionsByRole = {
		[roleA]: primaryDataPoolOptions,
		[roleB]: toSecondaryDataPoolOptions(primaryDataPoolOptions, roleConnectionStrings[roleB]),
		[roleC]: toSecondaryDataPoolOptions(primaryDataPoolOptions, roleConnectionStrings[roleC])
	};
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
	let activeSyncRun = null;
	let pendingSyncRequest = null;
	let stagingRebuildPromise = null;
	const stagingRebuildRuns = new Set();
	const syncAutos = new Set();
	let ending = false;
	let queuedSyncCount = 0;
	let nextProgressRequestId = 1;
	let initialReadyEmitted = false;
	const eventListeners = new Map();
	const roleEventSubscriptions = new Set();
	const schemaReadyRoles = new Set();
	const schemaReadyPromises = new Map();
	let schemaReadyGeneration = 0;
	const dualSyncLockName = `orange-orm:sqliteOPFS:dual-sync:${normalizeLockNamePart(connectionString)}`;
	const dualRebuildLockName = `orange-orm:sqliteOPFS:dual-rebuild:${normalizeLockNamePart(connectionString)}`;
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
		ending = true;
		await Promise.all(Array.from(syncAutos, auto => auto.stop()));
		await syncTail.catch(() => {});
		while (stagingRebuildRuns.size > 0)
			await Promise.allSettled(Array.from(stagingRebuildRuns));
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
		syncAutos.add(auto);
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
		return coalesceSync(normalizeSyncOptions(options));
	}

	function syncAutomatic(config) {
		return coalesceSync({}, {
			minimumIntervalMs: normalizeAutoSyncIntervalMs(config && config.intervalMs)
		});
	}

	function coalesceSync(normalizedOptions, schedule = {}) {
		if (ending)
			return Promise.reject(new Error('Dual sqliteOPFS database is closing.'));
		if (!activeSyncRun)
			return startSyncRun(normalizedOptions, schedule);
		if (pendingSyncRequest) {
			mergePendingSyncRequest(pendingSyncRequest, normalizedOptions, schedule);
			emitSyncProgress('coalesced-next', { queueDepth: 1 });
			return pendingSyncRequest.promise;
		}
		pendingSyncRequest = createPendingSyncRequest(normalizedOptions, schedule);
		emitSyncProgress('queued-next', { queueDepth: 1 });
		return pendingSyncRequest.promise;
	}

	function startSyncRun(normalizedOptions, schedule) {
		const run = queueSync(normalizedOptions, schedule);
		activeSyncRun = run;
		run.then(
			() => finishSyncRun(run),
			() => finishSyncRun(run)
		);
		return run;
	}

	function finishSyncRun(run) {
		if (activeSyncRun !== run)
			return;
		activeSyncRun = null;
		const pending = pendingSyncRequest;
		pendingSyncRequest = null;
		if (!pending)
			return;
		if (ending) {
			pending.reject(new Error('Dual sqliteOPFS database is closing.'));
			return;
		}
		const nextRun = startSyncRun(pending.normalizedOptions, pending.schedule);
		nextRun.then(pending.resolve, pending.reject);
	}

	function createPendingSyncRequest(normalizedOptions, schedule) {
		let resolve;
		let reject;
		const promise = new Promise((resolvePromise, rejectPromise) => {
			resolve = resolvePromise;
			reject = rejectPromise;
		});
		return {
			normalizedOptions,
			schedule,
			promise,
			resolve,
			reject
		};
	}

	function mergePendingSyncRequest(pending, normalizedOptions, schedule) {
		const pendingTimeoutMs = normalizeTimeoutMs(pending.normalizedOptions.timeoutMs);
		const requestedTimeoutMs = normalizeTimeoutMs(normalizedOptions.timeoutMs);
		const timeoutMs = Math.max(pendingTimeoutMs || 0, requestedTimeoutMs || 0);
		pending.normalizedOptions = timeoutMs > 0 ? { timeoutMs } : {};
		if (!(schedule && schedule.minimumIntervalMs > 0))
			pending.schedule = {};
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
		let manifest = await getManifest(true);
		manifest = await waitForReadyStaging(manifest, options);
		const activeRole = manifest.activeRole;
		const stagingRole = manifest.stagingRole;
		const stableRole = manifest.stableRole;
		const activeSync = getRoleSyncClient(activeRole);
		const stagingSync = getRoleSyncClient(stableRole);
		const nextStableSync = getRoleSyncClient(stagingRole);
		await ensureSharedClientId(manifest);

		emitSyncProgress('updating-staging', { activeRole, stagingRole: stableRole, stableRole: stagingRole });
		await applyPendingDeltasToRole(stableRole);
		await applyPendingDeltasToRole(stagingRole);

		const openRows = await readAllOutboxRows(activeSync, ['pending', 'pushed']);
		await stagingSync[applyOutboxRowsSymbol](openRows, {
			replay: false,
			replaceOpen: true
		});
		emitSyncProgress('pushing-staging', { activeRole, stagingRole: stableRole, stableRole: stagingRole });
		let stagingPushResult;
		let pushConflictError;
		let rejectedMutationIds = new Set();
		try {
			stagingPushResult = await stagingSync[pushPendingSymbol]({
				...options,
				_skipConflictRestore: true
			});
		}
		catch (error) {
			if (isConflictError(error)) {
				const failedIds = await recordActiveConflict(manifest, activeSync, stagingSync, openRows);
				if (failedIds.length === 0)
					throw error;
				pushConflictError = error;
				rejectedMutationIds = new Set(failedIds);
			}
			else {
				await mirrorActivePushAttempts(manifest, activeSync, stagingSync, openRows);
				throw error;
			}
		}
		if (!pushConflictError)
			await acknowledgeActivePushes(manifest, activeSync, stagingSync, stagingPushResult);
		await mirrorCandidateOutbox(stagingSync, nextStableSync, openRows);
		const needsInitialSwap = stagingPushResult && stagingPushResult.skipped === 'missing-stable-base';
		const deferStableBaseUntilComplete = needsInitialSwap && openRows.length === 0;

		emitSyncProgress('pulling-staging', { activeRole, stagingRole: stableRole, stableRole: stagingRole });
		const pullStagingStartedAtMs = Date.now();
		const deltaSink = await createDeltaJournalSink(stableRole);
		let result;
		let journal;
		let deltaId;
		let pullStagingSummary;
		try {
			result = await stagingSync[syncAndCapturePullJournalSymbol]({
				...options,
				_skipPushBeforePull: true,
				_capturePullJournalChunk: deltaSink.write,
				_deferStableBaseUntilComplete: deferStableBaseUntilComplete,
				_onPullBatchProgress(progress) {
					emitSyncProgress('pull-batch-complete', {
						activeRole,
						stagingRole: stableRole,
						...progress
					});
				},
				_onPullStagingSummary(summary) {
					pullStagingSummary = summary;
				}
			});
			journal = result && result.__orangePullJournal;
			const deltaFinalizeStartedAtMs = Date.now();
			deltaId = await deltaSink.commit(journal);
			emitSyncProgress('pull-staging-summary', {
				activeRole,
				stagingRole: stableRole,
				...(pullStagingSummary || {}),
				deltaFinalizeMs: Math.max(0, Date.now() - deltaFinalizeStartedAtMs),
				elapsedMs: Math.max(0, Date.now() - pullStagingStartedAtMs),
				deferredStableBase: deferStableBaseUntilComplete,
				failed: false
			});
		}
		catch (error) {
			await deltaSink.abort();
			emitSyncProgress('pull-staging-summary', {
				activeRole,
				stagingRole: stableRole,
				...(pullStagingSummary || {}),
				elapsedMs: Math.max(0, Date.now() - pullStagingStartedAtMs),
				deferredStableBase: deferStableBaseUntilComplete,
				failed: true
			});
			throw error;
		}
		if (deltaId)
			await applyPendingDeltasToRole(stagingRole, deltaId);
		let publishedManifest;

		emitSyncProgress('waiting-for-write-barrier', { activeRole, stagingRole: stableRole, stableRole: stagingRole });
		await runSyncSwap(router, async () => {
			const currentManifest = await getManifest(true);
			assertExpectedManifest(currentManifest, manifest);
			const finalPendingRows = (await readAllOutboxRows(activeSync, ['pending']))
				.filter(row => !rejectedMutationIds.has(outboxRowMutationId(row)));
			await stagingSync[applyOutboxRowsSymbol](finalPendingRows, {
				replay: true,
				replaceOpen: false
			});
			await nextStableSync[applyOutboxRowsSymbol](finalPendingRows, {
				replay: false,
				replaceOpen: false
			});
			emitSyncProgress('swapping', { activeRole, stagingRole: stableRole, stableRole: stagingRole });
			publishedManifest = await publishStableRole(manifest);
		});

		publishedManifest = await markSuccessfulSync();
		const newActiveRole = publishedManifest.activeRole;
		await maybeEmitInitialReady(newActiveRole);
		scheduleStagingRebuild(publishedManifest);
		emitSyncProgress('complete', {
			activeRole: publishedManifest.activeRole,
			stagingRole: publishedManifest.stagingRole,
			stableRole: publishedManifest.stableRole,
			swapped: true
		});
		const dualResult = withDualSyncResult(result, {
			...publishedManifest,
			deltaId,
			swapped: true
		});
		if (pushConflictError) {
			attachRecoveredConflict(pushConflictError, dualResult, rejectedMutationIds);
			throw pushConflictError;
		}
		return dualResult;
	}

	async function acknowledgeActivePushes(manifest, activeSync, stagingSync, pushResult) {
		const acceptedIds = pushResultMutationIds(pushResult);
		if (acceptedIds.size === 0)
			return;
		const pushedRows = await readAllOutboxRows(stagingSync, ['pushed']);
		const acknowledgedRows = pushedRows.filter(row => acceptedIds.has(outboxRowMutationId(row)));
		if (acknowledgedRows.length === 0)
			return;
		emitSyncProgress('acknowledging-active-pushes', {
			activeRole: manifest.activeRole,
			stagingRole: manifest.stagingRole,
			mutationCount: acknowledgedRows.length
		});
		await runSyncSwap(router, async () => {
			const currentManifest = await getManifest(true);
			assertExpectedManifest(currentManifest, manifest);
			await activeSync[applyOutboxRowsSymbol](acknowledgedRows, {
				replay: false,
				replaceOpen: false
			});
		});
	}

	async function mirrorCandidateOutbox(candidateSync, nextStableSync, openRows) {
		const openIds = new Set(openRows.map(outboxRowMutationId).filter(Boolean));
		const candidateRows = openIds.size === 0
			? []
			: (await readAllOutboxRows(candidateSync, ['pending', 'pushed', 'failed']))
				.filter(row => openIds.has(outboxRowMutationId(row)));
		await nextStableSync[applyOutboxRowsSymbol](candidateRows, {
			replay: false,
			replaceOpen: true
		});
	}

	async function recordActiveConflict(manifest, activeSync, stagingSync, openRows) {
		const stagedIds = new Set(openRows
			.filter(row => outboxRowStatus(row) === 'pending')
			.map(outboxRowMutationId)
			.filter(Boolean));
		if (stagedIds.size === 0)
			return [];
		const failedRows = await readAllOutboxRows(stagingSync, ['failed']);
		const rejectedRows = failedRows
			.filter(row => stagedIds.has(outboxRowMutationId(row)));
		const failedIds = rejectedRows.map(outboxRowMutationId);
		if (failedIds.length === 0)
			return [];
		emitSyncProgress('recording-active-conflict', {
			activeRole: manifest.activeRole,
			stagingRole: manifest.stagingRole,
			mutationCount: failedIds.length
		});
		await runSyncSwap(router, async () => {
			const currentManifest = await getManifest(true);
			assertExpectedManifest(currentManifest, manifest);
			await activeSync[applyOutboxRowsSymbol](rejectedRows, {
				replay: false,
				replaceOpen: false
			});
		});
		return failedIds;
	}

	async function mirrorActivePushAttempts(manifest, activeSync, stagingSync, openRows) {
		const activeAttempts = new Map(openRows
			.filter(row => outboxRowStatus(row) === 'pending')
			.map(row => [outboxRowMutationId(row), outboxRowAttempts(row)])
			.filter(([id]) => !!id));
		if (activeAttempts.size === 0)
			return;
		const pendingRows = await readAllOutboxRows(stagingSync, ['pending']);
		const attemptedRows = pendingRows.filter(row => {
			const id = outboxRowMutationId(row);
			return activeAttempts.has(id) && outboxRowAttempts(row) > activeAttempts.get(id);
		});
		if (attemptedRows.length === 0)
			return;
		emitSyncProgress('recording-active-push-attempts', {
			activeRole: manifest.activeRole,
			stagingRole: manifest.stagingRole,
			mutationCount: attemptedRows.length
		});
		await runSyncSwap(router, async () => {
			const currentManifest = await getManifest(true);
			assertExpectedManifest(currentManifest, manifest);
			await activeSync[applyOutboxRowsSymbol](attemptedRows, {
				replay: false,
				replaceOpen: false
			});
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
		for (const role of allRoles) {
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
			async () => {
				let manifest = await getManifest(true);
				manifest = await waitForReadyStaging(manifest, options);
				const candidateSync = getRoleSyncClient(manifest.stableRole);
				const nextStableSync = getRoleSyncClient(manifest.stagingRole);
				await candidateSync[applyOutboxRowsSymbol]([], {
					replay: false,
					replaceOpen: true
				});
				await nextStableSync[applyOutboxRowsSymbol]([], {
					replay: false,
					replaceOpen: true
				});
				let publishedManifest;
				await runSyncSwap(router, async () => {
					const current = await getManifest(true);
					assertExpectedManifest(current, manifest);
					publishedManifest = await publishStableRole(manifest);
				});
				scheduleStagingRebuild(publishedManifest);
			}
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
		for (const role of allRoles) {
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

	async function waitForReadyStaging(manifest, options = {}) {
		if (manifest.stagingStatus === stagingReady)
			return manifest;
		emitSyncProgress('waiting-for-staging', {
			activeRole: manifest.activeRole,
			stagingRole: manifest.stagingRole,
			stableRole: manifest.stableRole
		});
		await waitWithTimeout(
			scheduleStagingRebuild(manifest),
			normalizeTimeoutMs(options.timeoutMs),
			'Dual sync timed out waiting for staging rebuild.'
		);
		const readyManifest = await getManifest(true);
		if (readyManifest.stagingStatus !== stagingReady)
			throw new Error('Dual sync staging rebuild did not produce a ready staging role.');
		return readyManifest;
	}

	function scheduleStagingRebuild(manifest) {
		if (!manifest || manifest.stagingStatus === stagingReady)
			return Promise.resolve(manifest);
		if (stagingRebuildPromise)
			return stagingRebuildPromise;
		const run = runWithCrossTabLock(
			dualRebuildLockName,
			toDualSyncLockConfig(poolOptions && poolOptions.sync, {}),
			() => rebuildStaging(manifest)
		);
		stagingRebuildPromise = run;
		stagingRebuildRuns.add(run);
		run.then(
			() => finishStagingRebuild(run),
			() => finishStagingRebuild(run)
		);
		run.catch(() => {});
		return run;
	}

	function finishStagingRebuild(run) {
		stagingRebuildRuns.delete(run);
		if (stagingRebuildPromise === run)
			stagingRebuildPromise = null;
	}

	async function rebuildStaging(expectedManifest) {
		const manifest = await getManifest(true);
		if (manifest.stagingStatus === stagingReady)
			return manifest;
		if (manifest.generation !== expectedManifest.generation
			|| manifest.activeRole !== expectedManifest.activeRole
			|| manifest.stagingRole !== expectedManifest.stagingRole
			|| manifest.stableRole !== expectedManifest.stableRole) {
			throw new Error('Dual sync roles changed before staging rebuild started.');
		}
		const targetRole = manifest.stagingRole;
		const stableRole = manifest.stableRole;
		const targetSync = getRoleSyncClient(targetRole);
		const stableSync = getRoleSyncClient(stableRole);
		emitSyncProgress('staging-rebuild-start', {
			activeRole: manifest.activeRole,
			stagingRole: targetRole,
			stableRole
		});
		try {
			try {
				await targetSync.discardLocalChanges();
			}
			catch (error) {
				if (!isMissingStableBaseError(error))
					throw error;
				await targetSync.resetLocal();
			}
			await applyPendingDeltasToRole(targetRole);
			const stableOutboxRows = await readAllOutboxRows(stableSync, ['pending', 'pushed', 'failed']);
			await targetSync[applyOutboxRowsSymbol](stableOutboxRows, {
				replay: false,
				replaceOpen: true
			});
			await targetSync[setClientIdSymbol](manifest.clientId);
			const current = await getManifest(true);
			assertExpectedManifest(current, manifest);
			const readyManifest = await writeManifest({
				...current,
				stagingStatus: stagingReady,
				updatedAtMs: Date.now()
			}, {
				expectedGeneration: current.generation,
				expectedActiveRole: current.activeRole,
				expectedStagingRole: current.stagingRole,
				expectedStableRole: current.stableRole,
				expectedStagingStatus: stagingRebuilding
			});
			emitSyncProgress('staging-rebuild-complete', {
				activeRole: readyManifest.activeRole,
				stagingRole: readyManifest.stagingRole,
				stableRole: readyManifest.stableRole
			});
			return readyManifest;
		}
		catch (error) {
			emitSyncProgress('staging-rebuild-error', {
				activeRole: manifest.activeRole,
				stagingRole: targetRole,
				stableRole,
				error
			});
			throw error;
		}
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

	async function publishStableRole(manifest) {
		const now = Date.now();
		return writeManifest({
			activeRole: manifest.stableRole,
			stagingRole: manifest.activeRole,
			stableRole: manifest.stagingRole,
			stagingStatus: stagingRebuilding,
			updatedAtMs: now,
			generation: manifest.generation + 1,
			clientId: manifest.clientId
		}, {
			expectedGeneration: manifest.generation,
			expectedActiveRole: manifest.activeRole,
			expectedStagingRole: manifest.stagingRole,
			expectedStableRole: manifest.stableRole
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
		for (const role of allRoles) {
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
			|| current.stagingRole !== expected.stagingRole
			|| current.stableRole !== expected.stableRole
			|| current.stagingStatus !== expected.stagingStatus) {
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
					stableRole: roleC,
					stagingStatus: stagingReady,
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
			`SELECT "active_role", "staging_role", "stable_role", "staging_status", "updated_at_ms", "generation", "client_id", "last_successful_sync_at_ms" FROM "${manifestTable}"`,
			`WHERE "id" = ${sqlStringLiteral(manifestId)}`,
			'LIMIT 1'
		].join(' '));
		const row = firstRow(rows);
		const activeRole = row && (row.active_role ?? row.ACTIVE_ROLE);
		const stagingRole = row && (row.staging_role ?? row.STAGING_ROLE);
		const stableRole = row && (row.stable_role ?? row.STABLE_ROLE);
		const stagingStatus = row && (row.staging_status ?? row.STAGING_STATUS);
		if (!areDistinctRoles(activeRole, stagingRole, stableRole))
			return null;
		return {
			activeRole,
			stagingRole,
			stableRole,
			stagingStatus: normalizeStagingStatus(stagingStatus),
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
			const expectedStatusSql = options.expectedStagingStatus
				? `AND "staging_status" = ${sqlStringLiteral(options.expectedStagingStatus)}`
				: '';
			await db.query([
				`UPDATE "${manifestTable}" SET`,
				`"active_role" = ${sqlStringLiteral(normalized.activeRole)},`,
				`"staging_role" = ${sqlStringLiteral(normalized.stagingRole)},`,
				`"stable_role" = ${sqlStringLiteral(normalized.stableRole)},`,
				`"staging_status" = ${sqlStringLiteral(normalized.stagingStatus)},`,
				`"updated_at_ms" = ${normalized.updatedAtMs},`,
				`"generation" = ${normalized.generation},`,
				`"client_id" = ${sqlStringLiteral(normalized.clientId)}`,
				`WHERE "id" = ${sqlStringLiteral(manifestId)}`,
				`AND "generation" = ${normalizeGeneration(options.expectedGeneration)}`,
				`AND "active_role" = ${sqlStringLiteral(options.expectedActiveRole)}`,
				`AND "staging_role" = ${sqlStringLiteral(options.expectedStagingRole)}`,
				`AND "stable_role" = ${sqlStringLiteral(options.expectedStableRole)}`,
				expectedStatusSql
			].join(' '));
		}
		else {
			await db.query([
				`INSERT INTO "${manifestTable}" ("id", "active_role", "staging_role", "stable_role", "staging_status", "updated_at_ms", "generation", "client_id")`,
				`VALUES (${sqlStringLiteral(manifestId)}, ${sqlStringLiteral(normalized.activeRole)}, ${sqlStringLiteral(normalized.stagingRole)}, ${sqlStringLiteral(normalized.stableRole)}, ${sqlStringLiteral(normalized.stagingStatus)}, ${normalized.updatedAtMs}, ${normalized.generation}, ${sqlStringLiteral(normalized.clientId)})`,
				options.insertOnly ? 'ON CONFLICT("id") DO NOTHING' : [
					'ON CONFLICT("id") DO UPDATE SET',
					'"active_role" = excluded."active_role",',
					'"staging_role" = excluded."staging_role",',
					'"stable_role" = excluded."stable_role",',
					'"staging_status" = excluded."staging_status",',
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
				|| persisted.stagingRole !== normalized.stagingRole
				|| persisted.stableRole !== normalized.stableRole
				|| persisted.stagingStatus !== normalized.stagingStatus)) {
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
		if (allRoles.every(role => roles.includes(role))) {
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
			stableRole: roleC,
			stagingStatus: stagingReady,
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
					'"stable_role" TEXT NOT NULL,',
					'"staging_status" TEXT NOT NULL DEFAULT \'ready\',',
					'"updated_at_ms" INTEGER NOT NULL,',
					'"generation" INTEGER NOT NULL DEFAULT 0,',
					'"client_id" TEXT,',
					'"last_successful_sync_at_ms" INTEGER',
					');'
				].join(' '));
				await tryAddCacheColumn(db, manifestTable, 'generation', 'INTEGER NOT NULL DEFAULT 0');
				await tryAddCacheColumn(db, manifestTable, 'client_id', 'TEXT');
				await tryAddCacheColumn(db, manifestTable, 'last_successful_sync_at_ms', 'INTEGER');
				await tryAddCacheColumn(db, manifestTable, 'stable_role', `TEXT NOT NULL DEFAULT '${roleC}'`);
				await tryAddCacheColumn(db, manifestTable, 'staging_status', `TEXT NOT NULL DEFAULT '${stagingReady}'`);
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
		return dataPoolOptionsByRole[role];
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
			|| previous.stableRole !== manifest.stableRole
			|| previous.stagingStatus !== manifest.stagingStatus
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
		async function wrappedExternalSyncMethod(...args) {
			try {
				const result = await original.apply(this, args);
				await refreshManifestAfterExternalSync(method, result);
				return result;
			}
			catch (error) {
				try {
					await refreshManifestAfterExternalSync(method, error);
				}
				catch (_refreshError) {
					// Preserve the sync error after a best-effort manifest refresh.
				}
				throw error;
			}
		}
		Object.defineProperty(wrappedExternalSyncMethod, '__orangeDualSyncWrapped', {
			value: true
		});
		syncClient[method] = wrappedExternalSyncMethod;
	}

	async function refreshManifestAfterExternalSync(method, payload) {
		const info = extractDualSyncInfo(payload);
		if (info)
			updateManifestCache(info, method === 'resetLocal');
		else {
			const persisted = await readManifest();
			if (persisted)
				updateManifestCache(persisted, true);
		}
		if (method === 'resetLocal')
			clearSchemaReadyRoles();
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

function attachRecoveredConflict(error, result, mutationIds) {
	if (!error || error !== Object(error))
		return;
	const ids = Array.from(mutationIds || []);
	try {
		Object.defineProperties(error, {
			syncRecovered: {
				value: true,
				enumerable: true,
				configurable: true
			},
			syncResult: {
				value: result,
				enumerable: false,
				configurable: true
			},
			mutationIds: {
				value: ids,
				enumerable: true,
				configurable: true
			}
		});
	}
	catch (_error) {
		// Conflict recovery is complete even if a custom error object cannot be annotated.
	}
}

function pushResultMutationIds(result) {
	const ids = new Set();
	const items = Array.isArray(result && result.results) ? result.results : [];
	for (let i = 0; i < items.length; i++) {
		const id = items[i] && items[i].id;
		if (typeof id === 'string' && id.length > 0)
			ids.add(id);
	}
	return ids;
}

function outboxRowMutationId(row) {
	if (!row || row !== Object(row))
		return undefined;
	return row.mutation_id ?? row.MUTATION_ID;
}

function outboxRowStatus(row) {
	if (!row || row !== Object(row))
		return undefined;
	return row.status ?? row.STATUS;
}

function outboxRowAttempts(row) {
	if (!row || row !== Object(row))
		return 0;
	const attempts = Number(row.attempts ?? row.ATTEMPTS ?? 0);
	return Number.isFinite(attempts) ? attempts : 0;
}

function isConflictError(error) {
	return Number(error && error.response && error.response.status) === 409
		|| Number(error && error.status) === 409;
}

function extractDualSyncInfo(payload) {
	if (!payload || payload !== Object(payload))
		return null;
	const direct = normalizeManifestInfo(payload);
	if (direct)
		return direct;
	if (payload.__orangeDualSync)
		return payload.__orangeDualSync;
	const syncResult = payload.syncResult;
	if (syncResult && syncResult.__orangeDualSync)
		return syncResult.__orangeDualSync;
	const result = payload.result;
	if (result && result.__orangeDualSync)
		return result.__orangeDualSync;
	return null;
}

function normalizeManifestInfo(info) {
	if (!info || info !== Object(info))
		return null;
	const stableRole = info.stableRole || allRoles.find(role => role !== info.activeRole && role !== info.stagingRole);
	if (!areDistinctRoles(info.activeRole, info.stagingRole, stableRole))
		return null;
	return {
		activeRole: info.activeRole,
		stagingRole: info.stagingRole,
		stableRole,
		stagingStatus: normalizeStagingStatus(info.stagingStatus),
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

function withInternalWorkerBroker(connectionString, poolOptions) {
	const providedWorker = poolOptions.worker;
	const providedFactory = poolOptions.createWorker;
	if (!providedWorker && typeof providedFactory !== 'function')
		return poolOptions;
	const providedOptions = { ...poolOptions };
	let broker = providedWorker;
	let primaryClaimed = !!providedWorker;

	function createInternalWorker(requestedConnectionString) {
		if (!broker)
			broker = providedFactory(connectionString, providedOptions);
		if (!broker || typeof broker.postMessage !== 'function')
			throw new Error('sqliteOPFS worker factory must return a Worker-like object.');
		if (!primaryClaimed && requestedConnectionString === connectionString) {
			primaryClaimed = true;
			return broker;
		}
		return connectSqliteOPFSWorker(broker);
	}
	Object.defineProperty(createInternalWorker, '__orangeDualInternalWorkerBroker', {
		value: true
	});
	return {
		...poolOptions,
		createWorker: createInternalWorker
	};
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
	if (options.createWorker && options.createWorker.__orangeDualInternalWorkerBroker)
		options.closeDbOnClose = false;
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
	return value === roleA || value === roleB || value === roleC;
}

function areDistinctRoles(activeRole, stagingRole, stableRole) {
	return isRole(activeRole)
		&& isRole(stagingRole)
		&& isRole(stableRole)
		&& new Set([activeRole, stagingRole, stableRole]).size === allRoles.length;
}

function normalizeStagingStatus(value) {
	return value === stagingRebuilding ? stagingRebuilding : stagingReady;
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

function waitWithTimeout(promise, timeoutMs, message) {
	if (!timeoutMs)
		return promise;
	let timeoutId;
	const timeout = new Promise((_resolve, reject) => {
		timeoutId = setTimeout(() => reject(new Error(message)), timeoutMs);
	});
	return Promise.race([promise, timeout])
		.finally(() => clearTimeout(timeoutId));
}

function isMissingStableBaseError(error) {
	return /before initial sync has completed/u.test(error && error.message || '');
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
