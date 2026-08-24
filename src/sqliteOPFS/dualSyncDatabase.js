const hostLocal = require('../hostLocal');
const express = require('../hostExpress');
const hono = require('../hostHono');
const randomUuid = require('../randomUuid');
const stringify = require('../client/stringify');
const createHttpInterceptor = require('../client/httpInterceptor');
const createManagedSyncWorkerClient = require('../client/managedSyncWorkerClient');
const newSyncClient = require('../client/syncClient');
const { createSyncAuto, syncAutoStartSymbol } = require('../client/syncAuto');
const {
	awaitWithSyncAbort,
	isSyncAbortError,
	syncAbortSignalSymbol,
	throwIfSyncAborted
} = require('../client/syncAbort');
const {
	acquireSyncRead,
	runSyncRead,
	runSyncSwap
} = require('../sync/writeGate');
const {
	normalizeCrossTabLockConfig,
	normalizeLockNamePart,
	runWithCrossTabLock
} = require('../sync/crossTabLock');

const {
	ensureLocalSchemaReadySymbol,
	syncAndCapturePullJournalSymbol,
	syncCheckpointedBootstrapSymbol,
	readInitialSyncStateSymbol,
	readOutboxRowsSymbol,
	applyOutboxRowsSymbol,
	applyPullJournalSymbol,
	pushPendingSymbol,
	setClientIdSymbol
} = newSyncClient;

const manifestTable = 'orange_sync_dual_manifest';
const deltaTable = 'orange_sync_dual_delta';
const deltaChunkTable = 'orange_sync_dual_delta_chunk';
const replayTable = 'orange_sync_dual_replay';
const recoveryTable = 'orange_sync_dual_recovery';
const manifestId = 'default';
const recoveryId = 'default';
const roleA = 'a';
const roleB = 'b';
const replicaReadyState = 'ready';
const replicaPendingState = 'replica-pending';
const dataFirstRecoveryMode = 'data-first-bootstrap';
const replicaCopyBatchSize = 1000;
const outboxReplayPageSize = 1000;
const deltaItemsPerChunk = 1000;
const deltaChunkReadPageSize = 32;
const manifestCacheMaxAgeMs = 1000;
const dualSyncFaultInjectorSymbol = typeof Symbol === 'function'
	? Symbol.for('orange-orm.sqliteOPFS.dualSync.faultInjector')
	: '__orangeOrmDualSyncFaultInjector';

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
	let managedSyncClient;
	const manifestChannel = createManifestChannel();
	let roleClientFactory;
	let roleHttpInterceptor;
	const syncInterceptors = createHttpInterceptor();
	let syncTail = Promise.resolve();
	let activeSyncRun = null;
	let pendingSyncRequest = null;
	let queuedSyncCount = 0;
	let nextProgressRequestId = 1;
	let initialReadyEmitted = false;
	const dataReadySyncResults = new WeakSet();
	const eventListeners = new Map();
	const roleEventSubscriptions = new Set();
	const schemaReadyRoles = new Set();
	const schemaReadyPromises = new Map();
	let schemaReadyGeneration = 0;
	let syncFaultInjector;
	const dualSyncLockName = `orange-orm:sqliteOPFS:dual-sync:${normalizeLockNamePart(connectionString)}`;
	const dualWriteLockName = `orange-orm:sqliteOPFS:dual-write:${normalizeLockNamePart(connectionString)}`;
	const dualReadLockName = `orange-orm:sqliteOPFS:dual-read:${normalizeLockNamePart(connectionString)}`;

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
		__orangeCrossTabReadLock: { enabled: true, name: dualReadLockName, timeoutMs: 300000 },
		__orangeBeforeSyncWrite: refreshManifestBeforeWrite
	};
	Object.defineProperty(router, dualSyncFaultInjectorSymbol, {
		value: setSyncFaultInjector
	});
	router.poolFactory = router;
	installSyncProgressInterceptors();

	return router;

	function transaction(options, fn) {
		if ((arguments.length === 1) && (typeof options === 'function')) {
			fn = options;
			options = undefined;
		}
		const run = () => getActiveReadyDb().then(db => db.transaction(options, fn));
		return options && options.readonly
			? runSyncRead(router, run)
			: run();
	}

	function createTransaction(options) {
		let releaseRead = () => {};
		let readReleased = false;
		const transactionPromise = Promise.resolve()
			.then(async () => {
				if (options && options.readonly)
					releaseRead = await acquireSyncRead(router);
				return getActiveReadyDb();
			})
			.then(db => db.createTransaction(options))
			.catch((error) => {
				releaseReadonlyTransaction();
				throw error;
			});

		function run(fn) {
			return transactionPromise.then(transaction => transaction(fn));
		}
		run.rollback = function(...args) {
			return transactionPromise
				.then(transaction => transaction.rollback(...args))
				.finally(releaseReadonlyTransaction);
		};
		run.commit = function(...args) {
			return transactionPromise
				.then(transaction => transaction.commit(...args))
				.finally(releaseReadonlyTransaction);
		};
		return run;

		function releaseReadonlyTransaction() {
			if (readReleased)
				return;
			readReleased = true;
			releaseRead();
		}
	}

	function query(sql, options) {
		return runSyncRead(router,
			() => getActiveReadyDb().then(db => db.query(sql, options))
		);
	}

	function sqliteFunction(...args) {
		return runSyncRead(router,
			() => getActiveReadyDb().then(db => db.sqliteFunction(...args))
		);
	}

	async function end() {
		if (managedSyncClient) {
			try {
				await managedSyncClient.stop();
			}
			catch (_e) {
				// Continue closing the SQLite workers after a failed or already closed sync worker.
			}
			if (typeof managedSyncClient.close === 'function')
				managedSyncClient.close();
		}
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
		if (isManagedSyncWorkerEnabled(poolOptions && poolOptions.sync)) {
			if (!managedSyncClient) {
				managedSyncClient = createManagedSyncWorkerClient({
					client: rootClient,
					connectionString,
					poolOptions,
					syncConfig: poolOptions.sync,
					databases: [
						{ connectionString: roleConnectionStrings[roleA], db: getRoleDb(roleA) },
						{ connectionString: roleConnectionStrings[roleB], db: getRoleDb(roleB) },
						{ connectionString: cacheConnectionString, db: getCacheDb() }
					]
				});
			}
			return managedSyncClient;
		}
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

	function syncAutomatic(config, syncOptions) {
		return coalesceSync(normalizeSyncOptions(syncOptions), {
			minimumIntervalMs: normalizeAutoSyncIntervalMs(config && config.intervalMs)
		});
	}

	function coalesceSync(normalizedOptions, schedule = {}) {
		if (!activeSyncRun)
			return startSyncRun(normalizedOptions, schedule);
		if (pendingSyncRequest) {
			mergePendingSyncRequest(pendingSyncRequest, normalizedOptions, schedule);
			emitSyncProgress('coalesced-next', { queueDepth: 1 });
			return awaitWithSyncAbort(pendingSyncRequest.promise, normalizedOptions[syncAbortSignalSymbol]);
		}
		pendingSyncRequest = createPendingSyncRequest(normalizedOptions, schedule);
		emitSyncProgress('queued-next', { queueDepth: 1 });
		return awaitWithSyncAbort(pendingSyncRequest.promise, normalizedOptions[syncAbortSignalSymbol]);
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
		const pendingSignal = pending.normalizedOptions[syncAbortSignalSymbol];
		const requestedSignal = normalizedOptions[syncAbortSignalSymbol];
		const signal = pendingSignal && pendingSignal === requestedSignal
			? pendingSignal
			: undefined;
		pending.normalizedOptions = timeoutMs > 0 ? { timeoutMs } : {};
		if (signal)
			pending.normalizedOptions[syncAbortSignalSymbol] = signal;
		if (!(schedule && schedule.minimumIntervalMs > 0))
			pending.schedule = {};
	}

	function queueSync(normalizedOptions, schedule = {}) {
		const signal = normalizedOptions[syncAbortSignalSymbol];
		queuedSyncCount += 1;
		emitSyncProgress('queued', { queueDepth: queuedSyncCount });
		let leftQueue = false;
		const run = awaitWithSyncAbort(syncTail, signal).then(() => {
			leftQueue = true;
			queuedSyncCount = Math.max(0, queuedSyncCount - 1);
			emitSyncProgress('waiting-for-sync-lock', { queueDepth: queuedSyncCount });
			return awaitWithSyncAbort(observe('sync', () => runWithCrossTabLock(
				dualSyncLockName,
				toDualSyncLockConfig(poolOptions && poolOptions.sync, normalizedOptions),
				() => {
					throwIfSyncAborted(signal);
					return syncScheduled(normalizedOptions, schedule);
				}
			)), signal);
		}).catch((error) => {
			if (!leftQueue)
				queuedSyncCount = Math.max(0, queuedSyncCount - 1);
			throw error;
		});
		syncTail = run.catch(() => {});
		return run;
	}

	async function syncScheduled(options, schedule) {
		throwIfSyncAborted(options[syncAbortSignalSymbol]);
		const minimumIntervalMs = schedule && schedule.minimumIntervalMs;
		const recovery = await readRecoveryState();
		if (!recovery && minimumIntervalMs > 0) {
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
		const signal = options[syncAbortSignalSymbol];
		throwIfSyncAborted(signal);
		emitSyncProgress('preparing');
		let manifest = await getManifest(true);
		throwIfSyncAborted(signal);
		const recovery = await readRecoveryState();
		if (recovery) {
			if (recovery.mode === dataFirstRecoveryMode) {
				if (manifest.replicaState === replicaReadyState && isPublishedRecovery(manifest, recovery)) {
					await cleanupRecoveryState(recovery);
					manifest = await getManifest(true);
				}
				else {
					return resumeDataFirstBootstrap(options, manifest, recovery);
				}
			}
			else if (isPublishedRecovery(manifest, recovery)) {
				await cleanupRecoveryState(recovery);
				manifest = await getManifest(true);
			}
			else {
				assertExpectedRecoveryManifest(manifest, recovery);
				return recoverInterruptedSync(options, manifest, recovery);
			}
		}
		const activeRole = manifest.activeRole;
		const stagingRole = manifest.stagingRole;
		const activeSync = getRoleSyncClient(activeRole);
		const stagingSync = getRoleSyncClient(stagingRole);
		await Promise.all([
			activeSync.ensureLocalSchema(options),
			stagingSync.ensureLocalSchema(options)
		]);
		throwIfSyncAborted(signal);
		await ensureSharedClientId(manifest);
		if (isDataFirstBootstrapEnabled(poolOptions && poolOptions.sync)
			&& !await roleHasInitialState(activeRole)) {
			return runDataFirstBootstrap(options, manifest);
		}

		emitSyncProgress('updating-staging', { activeRole, stagingRole });
		await applyPendingDeltasToRole(stagingRole, undefined, options);
		throwIfSyncAborted(signal);
		await recoverAcceptedReplayRows(activeRole, activeSync);

		emitSyncProgress('pushing-active', { activeRole, stagingRole });
		let pushConflictError;
		let rejectedMutationIds = new Set();
		let acceptedMutationCount = 0;
		try {
			await activeSync[pushPendingSymbol]({
				...options,
				_fileSnapshotRollback: true,
				_skipConflictRestore: true,
				_singleMutationBatch: true,
				async _onAcceptedBeforeCommit(pushResult, acceptedMutations) {
					await persistAcceptedReplayRows(activeRole, pushResult, acceptedMutations);
					acceptedMutationCount += acceptedMutations.length;
				}
			});
		}
		catch (error) {
			if (isConflictError(error)) {
				const failedIds = failedMutationIds(error);
				if (failedIds.size === 0)
					throw error;
				pushConflictError = error;
				rejectedMutationIds = failedIds;
			}
			else
				throw error;
		}

		await applyAcceptedReplayRows(stagingRole, stagingSync);
		await mirrorFailedOutboxMetadata(activeSync, stagingSync);
		throwIfSyncAborted(signal);

		await writeRecoveryState(manifest);
		const pullResult = await pullIntoStaging({
			activeRole,
			activeSync,
			manifest,
			options,
			stagingRole,
			stagingSync
		});
		const { result, deltaId } = pullResult;
		throwIfSyncAborted(signal);
		let publishedManifest = manifest;
		let swapped = false;
		let cloneMs = 0;
		let deferred;

		emitSyncProgress('waiting-for-write-barrier', { activeRole, stagingRole });
		await awaitWithSyncAbort(runSyncSwap(router, async () => {
			throwIfSyncAborted(signal);
			const currentManifest = await getManifest(true);
			assertExpectedManifest(currentManifest, manifest);
			const finalPendingRows = (await readAllOutboxRows(activeSync, ['pending']))
				.filter(row => !rejectedMutationIds.has(outboxRowMutationId(row)));
			if (pushConflictError) {
				const failedRows = (await readAllOutboxRows(activeSync, ['failed']))
					.filter(row => rejectedMutationIds.has(outboxRowMutationId(row)));
				const promotionId = randomUuid();
				await setRecoveryReplayKind(manifest, conflictReplayKind(promotionId));
				await persistConflictReplayRows(promotionId, finalPendingRows, failedRows);
				emitSyncProgress('cloning-clean-staging', {
					activeRole,
					stagingRole,
					mutationCount: finalPendingRows.length
				});
				const cloneStartedAtMs = Date.now();
				await cloneRoleDatabase(stagingRole, activeRole);
				cloneMs = Math.max(0, Date.now() - cloneStartedAtMs);
				emitSyncProgress('cloned-clean-staging', {
					activeRole,
					stagingRole,
					cloneMs
				});
				await markDeltaCopiedByClone(deltaId, activeRole);
				await applyConflictReplayRows(promotionId, activeRole, stagingRole, activeSync, stagingSync);
				throwIfSyncAborted(signal);
				emitSyncProgress('swapping', { activeRole, stagingRole });
				publishedManifest = await publishStagingRole(manifest);
				swapped = true;
				await deleteReplayKind(conflictReplayKind(promotionId));
				await clearRecoveryState();
				return;
			}
			if (finalPendingRows.length > 0) {
				deferred = 'pending-writes';
				emitSyncProgress('swap-deferred', {
					activeRole,
					stagingRole,
					mutationCount: finalPendingRows.length
				});
				await clearRecoveryState();
				return;
			}
			throwIfSyncAborted(signal);
			if (pullResult.shouldPublish || deltaId || acceptedMutationCount > 0 || Number(result && result.applied || 0) > 0) {
				emitSyncProgress('swapping', { activeRole, stagingRole });
				publishedManifest = await publishStagingRole(manifest);
				swapped = true;
			}
			await clearRecoveryState();
		}), signal);

		publishedManifest = await markSuccessfulSync();
		const newActiveRole = publishedManifest.activeRole;
		await maybeEmitInitialReady(newActiveRole, publishedManifest);
		emitSyncProgress('complete', {
			activeRole: publishedManifest.activeRole,
			stagingRole: publishedManifest.stagingRole,
			swapped,
			cloneMs,
			deferred
		});
		const dualResult = withDualSyncResult(result, {
			...publishedManifest,
			deltaId,
			swapped,
			cloneMs,
			deferred
		});
		if (pushConflictError) {
			attachRecoveredConflict(pushConflictError, dualResult, rejectedMutationIds);
			throw pushConflictError;
		}
		return dualResult;
	}

	async function resumeDataFirstBootstrap(options, manifest, recovery) {
		if (manifest.replicaState === replicaPendingState && isPublishedRecovery(manifest, recovery))
			return finishDataFirstReplica(options, manifest, recovery);
		assertExpectedRecoveryManifest(manifest, recovery);
		return runDataFirstBootstrap(options, manifest, recovery);
	}

	async function runDataFirstBootstrap(options, manifest, recovery) {
		const signal = options[syncAbortSignalSymbol];
		throwIfSyncAborted(signal);
		const activeRole = manifest.activeRole;
		const stagingRole = manifest.stagingRole;
		const activeSync = getRoleSyncClient(activeRole);
		const stagingSync = getRoleSyncClient(stagingRole);
		const schemaResults = await Promise.all([
			activeSync.ensureLocalSchema(options),
			stagingSync.ensureLocalSchema(options)
		]);
		await ensureSharedClientId(manifest);
		const resuming = !!recovery;
		if (!recovery) {
			await writeRecoveryState(manifest, dataFirstRecoveryMode);
			recovery = await readRecoveryState();
		}

		let result;
		const readyState = resuming ? await readRoleInitialState(stagingRole) : null;
		if (readyState) {
			result = {
				applied: 0,
				tables: schemaResults[1] && schemaResults[1].tables || [],
				since: readyState.since,
				checkpointApplied: true,
				resumedDataReady: true
			};
		}
		else {
			result = await pullCheckpointedBootstrap({
				activeRole,
				activeSync,
				manifest,
				options,
				stagingRole,
				stagingSync
			});
		}
		throwIfSyncAborted(signal);

		let replayKind = recovery && recovery.replayKind;
		let publishedManifest;
		emitSyncProgress('publishing-data-ready', { activeRole, stagingRole });
		await awaitWithSyncAbort(runSyncSwap(router, async () => {
			throwIfSyncAborted(signal);
			const currentManifest = await getManifest(true);
			assertExpectedManifest(currentManifest, manifest);
			if (!replayKind) {
				replayKind = `data-first:${randomUuid()}`;
				await setRecoveryReplayKind(manifest, replayKind);
			}
			const pendingRows = await readAllOutboxRows(activeSync, ['pending']);
			const failedRows = await readAllOutboxRows(activeSync, ['failed']);
			for (let i = 0; i < pendingRows.length; i++)
				await persistReplayRow(replayKind, pendingRows[i], true, []);
			for (let i = 0; i < failedRows.length; i++)
				await persistReplayRow(replayKind, failedRows[i], false, []);
			if (pendingRows.length > 0) {
				await stagingSync[applyOutboxRowsSymbol](pendingRows, {
					replay: true,
					replaceOpen: false
				});
			}
			if (failedRows.length > 0)
				await stagingSync[applyOutboxRowsSymbol](failedRows, { replaceOpen: false });
			publishedManifest = await publishStagingRole(manifest, replicaPendingState);
		}), signal);

		const dataReadyResult = withDualSyncResult(cloneSyncResult(result), {
			...publishedManifest,
			swapped: true,
			bootstrapMode: 'data-first',
			replicaReady: false
		});
		const emittedDataReadySync = await maybeEmitInitialReady(
			publishedManifest.activeRole,
			publishedManifest,
			{ method: 'sync', result: dataReadyResult }
		);
		if (emittedDataReadySync && result && result === Object(result))
			dataReadySyncResults.add(result);
		emitSyncProgress('data-ready', {
			activeRole: publishedManifest.activeRole,
			stagingRole: publishedManifest.stagingRole,
			replicaReady: false,
			bootstrapMode: 'data-first'
		});
		return finishDataFirstReplica(options, publishedManifest, {
			...(recovery || {}),
			replayKind
		}, result);
	}

	async function pullCheckpointedBootstrap(context) {
		const {
			activeRole,
			activeSync,
			manifest,
			options,
			stagingRole,
			stagingSync
		} = context;
		let stagingFresh = await hasCheckpointedPullSession(stagingRole);
		if (!stagingFresh) {
			emitSyncProgress('reloading-staging', {
				activeRole,
				stagingRole,
				reason: 'first_sync',
				bootstrapMode: 'data-first'
			});
			await resetStagingRole(stagingSync, activeSync, manifest, options);
			stagingFresh = true;
		}
		for (let attempt = 0; attempt < 2; attempt++) {
			emitSyncProgress('pulling-staging', {
				activeRole,
				stagingRole,
				stagingFresh,
				bootstrapMode: 'data-first'
			});
			const startedAtMs = Date.now();
			let pullStagingSummary;
			try {
				const result = await stagingSync[syncCheckpointedBootstrapSymbol]({
					...options,
					_skipPushBeforePull: true,
					_fileSnapshotRollback: true,
					_onPullBatchProgress(progress) {
						emitSyncProgress('pull-batch-complete', {
							activeRole,
							stagingRole,
							bootstrapMode: 'data-first',
							...progress
						});
					},
					_onPullSnapshot(snapshot) {
						if (!stagingFresh)
							throw new StagingReloadRequiredError(snapshot && snapshot.reason);
					},
					_onPullStagingSummary(summary) {
						pullStagingSummary = summary;
					}
				});
				emitSyncProgress('pull-staging-summary', {
					activeRole,
					stagingRole,
					...(pullStagingSummary || {}),
					elapsedMs: Math.max(0, Date.now() - startedAtMs),
					failed: false,
					stagingFresh,
					bootstrapMode: 'data-first'
				});
				return result;
			}
			catch (error) {
				if (error instanceof StagingReloadRequiredError && !stagingFresh) {
					emitSyncProgress('reloading-staging', {
						activeRole,
						stagingRole,
						reason: error.reason || 'snapshot',
						bootstrapMode: 'data-first'
					});
					await resetStagingRole(stagingSync, activeSync, manifest, options);
					stagingFresh = true;
					continue;
				}
				emitSyncProgress('pull-staging-summary', {
					activeRole,
					stagingRole,
					...(pullStagingSummary || {}),
					elapsedMs: Math.max(0, Date.now() - startedAtMs),
					failed: true,
					stagingFresh,
					bootstrapMode: 'data-first'
				});
				throw error;
			}
		}
		throw new Error('Data-first bootstrap could not prepare a fresh staging database.');
	}

	async function finishDataFirstReplica(options, manifest, recovery, pullResult) {
		const signal = options[syncAbortSignalSymbol];
		throwIfSyncAborted(signal);
		const activeRole = manifest.activeRole;
		const stagingRole = manifest.stagingRole;
		const activeSync = getRoleSyncClient(activeRole);
		const stagingSync = getRoleSyncClient(stagingRole);
		const schemaResults = await Promise.all([
			activeSync.ensureLocalSchema(options),
			stagingSync.ensureLocalSchema(options)
		]);
		await ensureSharedClientId(manifest);
		const activeState = await readRoleInitialState(activeRole);
		if (!activeState)
			throw new Error('Data-first recovery cannot rebuild the replica before the active database is complete.');
		const tables = schemaResults[0] && schemaResults[0].tables || [];
		const result = pullResult || {
			applied: 0,
			tables,
			since: activeState.since,
			checkpointApplied: true,
			resumedReplicaBuild: true
		};

		emitSyncProgress('replica-copy-start', {
			activeRole,
			stagingRole,
			bootstrapMode: 'data-first'
		});
		await resetStagingRole(stagingSync, activeSync, manifest, options);
		await copyRoleData(activeRole, stagingRole, tables, activeState.since, options);
		throwIfSyncAborted(signal);

		let readyManifest;
		await awaitWithSyncAbort(runSyncSwap(router, async () => {
			throwIfSyncAborted(signal);
			const currentManifest = await getManifest(true);
			if (currentManifest.activeRole !== activeRole
				|| currentManifest.stagingRole !== stagingRole
				|| currentManifest.generation !== manifest.generation
				|| currentManifest.replicaState !== replicaPendingState) {
				throw new Error('Dual sync manifest changed while the data-first replica was being built.');
			}
			const pendingRows = await readAllOutboxRows(activeSync, ['pending']);
			const failedRows = await readAllOutboxRows(activeSync, ['failed']);
			if (pendingRows.length > 0) {
				await stagingSync[applyOutboxRowsSymbol](pendingRows, {
					replay: true,
					replayExisting: true,
					replaceOpen: false
				});
			}
			if (failedRows.length > 0)
				await stagingSync[applyOutboxRowsSymbol](failedRows, { replaceOpen: false });
			await validateRoleForeignKeys(stagingRole);
			readyManifest = await writeManifest({
				...currentManifest,
				replicaState: replicaReadyState,
				updatedAtMs: Date.now()
			}, {
				expectedGeneration: currentManifest.generation,
				expectedActiveRole: currentManifest.activeRole,
				expectedStagingRole: currentManifest.stagingRole
			});
			if (recovery && recovery.replayKind)
				await deleteReplayKind(recovery.replayKind);
			await clearRecoveryState();
		}), signal);

		readyManifest = await markSuccessfulSync();
		emitSyncProgress('replica-ready', {
			activeRole: readyManifest.activeRole,
			stagingRole: readyManifest.stagingRole,
			bootstrapMode: 'data-first',
			replicaReady: true
		});
		emitSyncProgress('complete', {
			activeRole: readyManifest.activeRole,
			stagingRole: readyManifest.stagingRole,
			swapped: true,
			bootstrapMode: 'data-first',
			replicaReady: true
		});
		return withDualSyncResult(result, {
			...readyManifest,
			swapped: true,
			bootstrapMode: 'data-first',
			replicaReady: true
		});
	}

	async function pullIntoStaging(context) {
		const {
			activeRole,
			activeSync,
			manifest,
			options,
			stagingRole,
			stagingSync
		} = context;
		let stagingFresh = false;
		for (let attempt = 0; attempt < 2; attempt++) {
			emitSyncProgress('pulling-staging', { activeRole, stagingRole, stagingFresh });
			const pullStagingStartedAtMs = Date.now();
			const deltaSink = await createDeltaJournalSink(stagingRole);
			let pullStagingSummary;
			try {
				const result = await stagingSync[syncAndCapturePullJournalSymbol]({
					...options,
					_skipPushBeforePull: true,
					_fileSnapshotRollback: true,
					_capturePullJournalChunk: deltaSink.write,
					_onPullBatchProgress(progress) {
						emitSyncProgress('pull-batch-complete', {
							activeRole,
							stagingRole,
							...progress
						});
					},
					_onPullSnapshot(snapshot) {
						if (!stagingFresh)
							throw new StagingReloadRequiredError(snapshot && snapshot.reason);
					},
					_onPullStagingSummary(summary) {
						pullStagingSummary = summary;
					}
				});
				const journal = result && result.__orangePullJournal;
				const deltaFinalizeStartedAtMs = Date.now();
				const deltaId = await deltaSink.commit(journal);
				emitSyncProgress('pull-staging-summary', {
					activeRole,
					stagingRole,
					...(pullStagingSummary || {}),
					deltaFinalizeMs: Math.max(0, Date.now() - deltaFinalizeStartedAtMs),
					elapsedMs: Math.max(0, Date.now() - pullStagingStartedAtMs),
					failed: false,
					stagingFresh
				});
				return {
					result,
					journal,
					deltaId,
					shouldPublish: stagingFresh || hasPullJournalChanges(journal)
				};
			}
			catch (error) {
				await deltaSink.abort();
				if (error instanceof StagingReloadRequiredError && !stagingFresh) {
					emitSyncProgress('reloading-staging', {
						activeRole,
						stagingRole,
						reason: error.reason || 'snapshot'
					});
					await resetStagingRole(stagingSync, activeSync, manifest, options);
					stagingFresh = true;
					continue;
				}
				emitSyncProgress('pull-staging-summary', {
					activeRole,
					stagingRole,
					...(pullStagingSummary || {}),
					elapsedMs: Math.max(0, Date.now() - pullStagingStartedAtMs),
					failed: true,
					stagingFresh
				});
				if (canResumePullAfterError(error))
					await clearRecoveryState();
				throw error;
			}
		}
		throw new Error('Dual sync could not reload staging for an authoritative snapshot.');
	}

	async function resetStagingRole(stagingSync, activeSync, manifest, options) {
		await stagingSync.resetLocal(options);
		await stagingSync.ensureLocalSchema(options);
		await ensureSharedClientId(manifest);
		await mirrorFailedOutboxMetadata(activeSync, stagingSync);
	}

	async function copyRoleData(sourceRole, targetRole, tables, since, options) {
		const signal = options[syncAbortSignalSymbol];
		const sourceClient = getRoleClient(sourceRole);
		const targetSync = getRoleSyncClient(targetRole);
		const targetDb = getRoleDb(targetRole);
		await targetDb.query('PRAGMA foreign_keys = OFF');
		let processedItems = 0;
		for (let tableIndex = 0; tableIndex < tables.length; tableIndex++) {
			throwIfSyncAborted(signal);
			const tableName = tables[tableIndex];
			const sourceTable = sourceClient[tableName];
			const tableDefinition = sourceClient.tables && sourceClient.tables[tableName];
			if (!sourceTable || !tableDefinition)
				throw new Error(`Data-first replica cannot copy unknown table "${tableName}".`);
			const primaryColumns = Array.isArray(tableDefinition._primaryColumns)
				? tableDefinition._primaryColumns
				: [];
			if (primaryColumns.length === 0)
				throw new Error(`Data-first replica requires a primary key on table "${tableName}".`);
			const primaryAliases = primaryColumns.map(column => column.alias);
			const descendingOrder = primaryAliases.map(alias => `${alias} desc`);
			const upperRows = await sourceTable.getMany({
				orderBy: descendingOrder,
				limit: 1
			});
			if (!Array.isArray(upperRows) || upperRows.length === 0)
				continue;
			const upperPk = primaryAliases.map(alias => upperRows[0][alias]);
			let lastPk;
			let tableProcessedItems = 0;
			let batchNo = 0;
			for (;;) {
				throwIfSyncAborted(signal);
				const rows = await sourceTable.getMany({
					where: table => buildReplicaCopyFilter(table, primaryAliases, lastPk, upperPk),
					orderBy: primaryAliases,
					limit: replicaCopyBatchSize
				});
				if (!Array.isArray(rows) || rows.length === 0)
					break;
				const items = rows.map((row, index) => {
					const plainRow = {};
					for (let i = 0; i < tableDefinition._columns.length; i++) {
						const alias = tableDefinition._columns[i].alias;
						plainRow[alias] = row[alias];
					}
					const pk = primaryAliases.map(alias => plainRow[alias]);
					return {
						batchNo,
						seq: tableProcessedItems + index,
						table: tableName,
						pk,
						key: Object.fromEntries(primaryAliases.map((alias, pkIndex) => [alias, pk[pkIndex]])),
						op: 'U',
						row: plainRow
					};
				});
				await targetSync[applyPullJournalSymbol]({
					tables: [tableName],
					itemCount: items.length,
					items
				}, {
					[syncAbortSignalSymbol]: signal,
					_fileSnapshotRollback: true,
					_skipForeignKeyEnable: true,
					apply: {
						maxRowsPerTransaction: replicaCopyBatchSize,
						foreignKeyCheck: 'none'
					}
				});
				lastPk = primaryAliases.map(alias => rows[rows.length - 1][alias]);
				tableProcessedItems += rows.length;
				processedItems += rows.length;
				emitSyncProgress('replica-copy-batch', {
					sourceRole,
					targetRole,
					table: tableName,
					tableIndex,
					batchNo,
					processedItems,
					tableProcessedItems,
					bootstrapMode: 'data-first'
				});
				batchNo += 1;
				if (stringify(lastPk) === stringify(upperPk))
					break;
				await Promise.resolve();
			}
		}
		await targetSync[applyPullJournalSymbol]({
			tables,
			finalSince: since,
			itemCount: 0,
			items: []
		}, {
			[syncAbortSignalSymbol]: signal,
			_fileSnapshotRollback: true,
			_skipForeignKeyEnable: true
		});
		await validateRoleForeignKeys(targetRole);
		await targetDb.query('PRAGMA foreign_keys = ON');
	}

	function buildReplicaCopyFilter(table, primaryAliases, lastPk, upperPk) {
		const upperFilter = buildTupleFilter(table, primaryAliases, upperPk, 'upper');
		if (!lastPk)
			return upperFilter;
		return buildTupleFilter(table, primaryAliases, lastPk, 'after').and(upperFilter);
	}

	function buildTupleFilter(table, aliases, values, mode) {
		const branches = [];
		for (let i = 0; i < aliases.length; i++) {
			const comparisons = [];
			for (let equalIndex = 0; equalIndex < i; equalIndex++)
				comparisons.push(table[aliases[equalIndex]].eq(values[equalIndex]));
			comparisons.push(mode === 'after'
				? table[aliases[i]].greaterThan(values[i])
				: table[aliases[i]].lessThan(values[i]));
			branches.push(andReplicaFilters(comparisons));
		}
		if (mode === 'upper') {
			branches.push(andReplicaFilters(
				aliases.map((alias, index) => table[alias].eq(values[index]))
			));
		}
		let result = branches[0];
		for (let i = 1; i < branches.length; i++)
			result = result.or(branches[i]);
		return result;
	}

	function andReplicaFilters(filters) {
		let result = filters[0];
		for (let i = 1; i < filters.length; i++)
			result = result.and(filters[i]);
		return result;
	}

	async function readRoleInitialState(role) {
		const syncClient = getRoleSyncClient(role);
		if (typeof syncClient[readInitialSyncStateSymbol] === 'function')
			return syncClient[readInitialSyncStateSymbol]();
		try {
			const rows = toRows(await getRoleDb(role).query(
				'SELECT "since_value" FROM "orange_sync_state" ORDER BY "scope" LIMIT 1'
			));
			if (rows.length === 0)
				return null;
			const raw = rows[0].since_value ?? rows[0].SINCE_VALUE;
			const state = parseJson(raw);
			if (state && state === Object(state) && state.since !== undefined && state.since !== null)
				return state;
			if (state !== undefined && state !== null)
				return { since: state };
			return null;
		}
		catch (error) {
			if (/no such table/u.test(String(error && error.message || error)))
				return null;
			throw error;
		}
	}

	async function roleHasInitialState(role) {
		return !!await readRoleInitialState(role);
	}

	async function roleIsInitialReady(role) {
		const state = await readRoleInitialState(role);
		return !!state && state.ready !== false;
	}

	async function hasCheckpointedPullSession(role) {
		try {
			const rows = toRows(await getRoleDb(role).query([
				'SELECT "status" FROM "orange_sync_pull_session"',
				'WHERE "status" IN (\'direct-stream-pending\', \'direct-stream-ready\')',
				'LIMIT 1'
			].join(' ')));
			return rows.length > 0;
		}
		catch (error) {
			if (/no such table/u.test(String(error && error.message || error)))
				return false;
			throw error;
		}
	}

	async function validateRoleForeignKeys(role) {
		const violations = toRows(await getRoleDb(role).query('PRAGMA foreign_key_check'));
		if (violations.length > 0)
			throw new Error(`Data-first replica contains ${violations.length} foreign key violation(s).`);
	}

	async function recoverInterruptedSync(options, manifest, recovery) {
		const signal = options[syncAbortSignalSymbol];
		throwIfSyncAborted(signal);
		const activeRole = manifest.activeRole;
		const stagingRole = manifest.stagingRole;
		const activeSync = getRoleSyncClient(activeRole);
		const stagingSync = getRoleSyncClient(stagingRole);
		await Promise.all([
			activeSync.ensureLocalSchema(options),
			stagingSync.ensureLocalSchema(options)
		]);
		throwIfSyncAborted(signal);
		await ensureSharedClientId(manifest);

		const replayKind = recovery.replayKind || `recovery:${randomUuid()}`;
		await setRecoveryReplayKind(manifest, replayKind);
		await persistActiveRecoveryRows(replayKind, activeSync);
		emitSyncProgress('recovering-staging', { activeRole, stagingRole });
		await resetStagingRole(stagingSync, activeSync, manifest, options);
		let pullStagingSummary;
		const result = await stagingSync[syncAndCapturePullJournalSymbol]({
			...options,
			_skipPushBeforePull: true,
			_fileSnapshotRollback: true,
			_capturePullJournalChunk() {},
			_onPullBatchProgress(progress) {
				emitSyncProgress('pull-batch-complete', {
					activeRole,
					stagingRole,
					...progress
				});
			},
			_onPullStagingSummary(summary) {
				pullStagingSummary = summary;
			}
		});
		throwIfSyncAborted(signal);
		emitSyncProgress('pull-staging-summary', {
			activeRole,
			stagingRole,
			...(pullStagingSummary || {}),
			failed: false,
			recovered: true,
			stagingFresh: true
		});

		let publishedManifest;
		let cloneMs = 0;
		await awaitWithSyncAbort(runSyncSwap(router, async () => {
			throwIfSyncAborted(signal);
			const currentManifest = await getManifest(true);
			assertExpectedManifest(currentManifest, manifest);
			await persistActiveRecoveryRows(replayKind, activeSync);
			const cloneStartedAtMs = Date.now();
			await cloneRoleDatabase(stagingRole, activeRole);
			cloneMs = Math.max(0, Date.now() - cloneStartedAtMs);
			emitSyncProgress('cloned-clean-staging', {
				activeRole,
				stagingRole,
				cloneMs,
				recovered: true
			});
			await applyRecoveryReplayRows(replayKind, activeRole, stagingRole);
			throwIfSyncAborted(signal);
			await clearAllDeltas();
			await deleteReplayKind('accepted');
			emitSyncProgress('swapping', { activeRole, stagingRole, recovered: true });
			publishedManifest = await publishStagingRole(manifest);
			await deleteReplayKind(replayKind);
			await clearRecoveryState();
		}), signal);

		publishedManifest = await markSuccessfulSync();
		await maybeEmitInitialReady(publishedManifest.activeRole, publishedManifest);
		emitSyncProgress('complete', {
			activeRole: publishedManifest.activeRole,
			stagingRole: publishedManifest.stagingRole,
			swapped: true,
			cloneMs,
			recovered: true
		});
		return withDualSyncResult(result, {
			...publishedManifest,
			swapped: true,
			cloneMs,
			recovered: true
		});
	}

	async function persistActiveRecoveryRows(kind, activeSync) {
		const pendingRows = await readAllOutboxRows(activeSync, ['pending']);
		const failedRows = await readAllOutboxRows(activeSync, ['failed']);
		for (let i = 0; i < pendingRows.length; i++)
			await persistReplayRow(kind, pendingRows[i], true, []);
		for (let i = 0; i < failedRows.length; i++)
			await persistReplayRow(kind, failedRows[i], false, []);
	}

	async function recoverAcceptedReplayRows(activeRole, activeSync) {
		const pushedRows = await readAllOutboxRows(activeSync, ['pushed']);
		for (let i = 0; i < pushedRows.length; i++)
			await persistReplayRow('accepted', pushedRows[i], true, [activeRole]);
	}

	async function persistAcceptedReplayRows(activeRole, pushResult, mutations) {
		const resultsById = new Map((Array.isArray(pushResult && pushResult.results)
			? pushResult.results
			: [])
			.filter(item => item && typeof item.id === 'string')
			.map(item => [item.id, item]));
		const pushedAtMs = Date.now();
		for (let i = 0; i < mutations.length; i++) {
			const mutation = mutations[i];
			const row = mutation && mutation.__outboxRow;
			const id = mutation && mutation.id;
			const result = resultsById.get(id);
			if (!row || !result)
				continue;
			await persistReplayRow('accepted', {
				...row,
				status: 'pushed',
				last_error: undefined,
				pushed_at_ms: pushedAtMs,
				result_json: stringify(result)
			}, true, [activeRole]);
		}
	}

	async function applyAcceptedReplayRows(targetRole, targetSync) {
		const entries = await readReplayRows('accepted');
		for (let i = 0; i < entries.length; i++) {
			const entry = entries[i];
			if (entry.appliedRoles.includes(targetRole))
				continue;
			await targetSync[applyOutboxRowsSymbol]([entry.row], {
				replay: entry.replayData,
				replaceOpen: false
			});
			await markReplayRowApplied(entry, targetRole);
		}
	}

	async function mirrorFailedOutboxMetadata(activeSync, stagingSync) {
		const failedRows = await readAllOutboxRows(activeSync, ['failed']);
		if (failedRows.length === 0)
			return;
		await stagingSync[applyOutboxRowsSymbol](failedRows, {
			replay: false,
			replaceOpen: false
		});
	}

	async function persistConflictReplayRows(promotionId, pendingRows, failedRows) {
		const kind = conflictReplayKind(promotionId);
		for (let i = 0; i < pendingRows.length; i++)
			await persistReplayRow(kind, pendingRows[i], true, []);
		for (let i = 0; i < failedRows.length; i++)
			await persistReplayRow(kind, failedRows[i], false, []);
	}

	async function applyConflictReplayRows(promotionId, cleanRole, promotedRole) {
		return applyRecoveryReplayRows(conflictReplayKind(promotionId), cleanRole, promotedRole);
	}

	async function applyRecoveryReplayRows(kind, cleanRole, promotedRole) {
		const cleanSync = getRoleSyncClient(cleanRole);
		const promotedSync = getRoleSyncClient(promotedRole);
		const entries = await readReplayRows(kind);
		for (let i = 0; i < entries.length; i++) {
			const entry = entries[i];
			if (!entry.replayData) {
				await applyOutboxMetadataToBoth(entry.row);
				continue;
			}
			try {
				await promotedSync[applyOutboxRowsSymbol]([entry.row], {
					replay: true,
					replaceOpen: false
				});
			}
			catch (error) {
				await applyOutboxMetadataToBoth(toFailedReplayRow(entry.row, error));
			}
		}

		async function applyOutboxMetadataToBoth(row) {
			await cleanSync[applyOutboxRowsSymbol]([row], {
				replay: false,
				replaceOpen: false
			});
			await promotedSync[applyOutboxRowsSymbol]([row], {
				replay: false,
				replaceOpen: false
			});
		}
	}

	async function persistReplayRow(kind, row, replayData, appliedRoles) {
		const mutationId = outboxRowMutationId(row);
		if (typeof mutationId !== 'string' || mutationId.length === 0)
			return;
		const db = await getCacheDb();
		await ensureCacheSchema(db);
		const existing = firstRow(await db.query([
			`SELECT "applied_roles_json" FROM "${replayTable}"`,
			`WHERE "kind" = ${sqlStringLiteral(kind)}`,
			`AND "mutation_id" = ${sqlStringLiteral(mutationId)}`,
			'LIMIT 1'
		].join(' ')));
		const roles = new Set(parseJson(existing && (
			existing.applied_roles_json ?? existing.APPLIED_ROLES_JSON
		)) || []);
		for (const role of appliedRoles || []) {
			if (isRole(role))
				roles.add(role);
		}
		await db.query([
			`INSERT INTO "${replayTable}" ("kind", "mutation_id", "row_json", "replay_data", "created_at_ms", "applied_roles_json")`,
			`VALUES (${sqlStringLiteral(kind)}, ${sqlStringLiteral(mutationId)}, ${sqlStringLiteral(stringify(row))}, ${replayData ? 1 : 0}, ${Date.now()}, ${sqlStringLiteral(JSON.stringify(Array.from(roles)))})`,
			'ON CONFLICT("kind", "mutation_id") DO UPDATE SET',
			'"row_json" = excluded."row_json",',
			'"replay_data" = excluded."replay_data",',
			'"applied_roles_json" = excluded."applied_roles_json"'
		].join(' '));
	}

	async function readReplayRows(kind) {
		const db = await getCacheDb();
		await ensureCacheSchema(db);
		return toRows(await db.query([
			`SELECT "kind", "mutation_id", "row_json", "replay_data", "created_at_ms", "applied_roles_json" FROM "${replayTable}"`,
			`WHERE "kind" = ${sqlStringLiteral(kind)}`,
			'ORDER BY "created_at_ms" ASC, "mutation_id" ASC'
		].join(' ')))
			.map(row => ({
				kind: row.kind ?? row.KIND,
				mutationId: row.mutation_id ?? row.MUTATION_ID,
				row: parseJson(row.row_json ?? row.ROW_JSON),
				replayData: Number(row.replay_data ?? row.REPLAY_DATA) === 1,
				appliedRoles: parseJson(row.applied_roles_json ?? row.APPLIED_ROLES_JSON) || []
			}))
			.filter(entry => entry.row && entry.row === Object(entry.row));
	}

	async function markReplayRowApplied(entry, role) {
		const roles = new Set(entry.appliedRoles || []);
		roles.add(role);
		const db = await getCacheDb();
		if (roles.has(roleA) && roles.has(roleB)) {
			await db.query([
				`DELETE FROM "${replayTable}" WHERE "kind" = ${sqlStringLiteral(entry.kind)}`,
				`AND "mutation_id" = ${sqlStringLiteral(entry.mutationId)}`
			].join(' '));
			return;
		}
		await db.query([
			`UPDATE "${replayTable}"`,
			`SET "applied_roles_json" = ${sqlStringLiteral(JSON.stringify(Array.from(roles)))}`,
			`WHERE "kind" = ${sqlStringLiteral(entry.kind)}`,
			`AND "mutation_id" = ${sqlStringLiteral(entry.mutationId)}`
		].join(' '));
	}

	async function deleteReplayKind(kind) {
		const db = await getCacheDb();
		await db.query(`DELETE FROM "${replayTable}" WHERE "kind" = ${sqlStringLiteral(kind)}`);
	}

	async function cloneRoleDatabase(sourceRole, targetRole) {
		const sourceDb = getRoleDb(sourceRole);
		const targetDb = getRoleDb(targetRole);
		const sourcePool = sourceDb && sourceDb.poolFactory;
		const targetPool = targetDb && targetDb.poolFactory;
		if (!sourcePool || typeof sourcePool.__orangeCloneDatabaseTo !== 'function')
			throw new Error('Dual sync requires SQLite database cloning support.');
		const releaseTargetAccess = targetPool
			&& typeof targetPool.__orangeAcquireDatabaseAccess === 'function'
			? await targetPool.__orangeAcquireDatabaseAccess()
			: () => {};
		try {
			if (targetPool && typeof targetPool.__orangeSuspendDatabase === 'function')
				await targetPool.__orangeSuspendDatabase();
			await sourcePool.__orangeCloneDatabaseTo(
				roleConnectionStrings[targetRole],
				getRolePoolOptions(targetRole)
			);
		}
		finally {
			await releaseTargetAccess();
		}
		clientByRole.delete(targetRole);
		schemaReadyRoles.delete(targetRole);
	}

	async function markDeltaCopiedByClone(deltaId, role) {
		if (!deltaId)
			return;
		const deltas = await readDeltas();
		const delta = deltas.find(item => item.id === deltaId);
		if (delta && !delta.appliedRoles.includes(role))
			await markDeltaApplied(delta, role);
	}

	async function ensureLocalSchema(options = {}) {
		const manifest = await getManifest();
		return getRoleSyncClient(manifest.activeRole).ensureLocalSchema(options);
	}

	function ensureActiveLocalSchemaReady() {
		return runSyncRead(router, () => ensureLocalSchema());
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

	async function waitForInitialSync() {
		const manifest = await getManifest();
		if (await roleIsInitialReady(manifest.activeRole))
			return;
		return new Promise((resolve) => {
			const unsubscribe = once('initial-ready', () => {
				unsubscribe();
				resolve();
			});
			void Promise.resolve().then(async () => {
				const current = await getManifest(true);
				if (!await roleIsInitialReady(current.activeRole))
					return;
				unsubscribe();
				resolve();
			}).catch(() => {});
		});
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
			const dataReadySyncEmitted = method === 'sync'
				&& result && result === Object(result)
				&& dataReadySyncResults.delete(result);
			if (!dataReadySyncEmitted)
				emit(method, { method, result });
			if (method !== 'sync')
				emit('sync', { method, result });
			return result;
		}
		catch (error) {
			if (isSyncAbortError(error))
				throw error;
			emit(method + '-error', { method, error });
			emit('error', { method, error });
			throw error;
		}
	}

	function emit(event, payload) {
		const listeners = eventListeners.get(event);
		if (!listeners)
			return;
		for (const listener of Array.from(listeners)) {
			try {
				listener(payload);
			}
			catch (_error) {
				// Notifications must never change sync control flow or skip other listeners.
			}
		}
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
		await maybeEmitInitialReady(manifest.activeRole, manifest);
	}

	async function maybeEmitInitialReady(role, manifestInfo, syncPayload) {
		if (initialReadyEmitted)
			return false;
		const syncClient = getRoleSyncClient(role);
		try {
			if (typeof syncClient[readInitialSyncStateSymbol] === 'function') {
				const state = await syncClient[readInitialSyncStateSymbol]();
				if (!state || !state.ready)
					return false;
			}
			else {
				if (typeof syncClient.waitForInitialSync !== 'function')
					return false;
				await syncClient.waitForInitialSync();
			}
		}
		catch (_e) {
			return false;
		}
		if (initialReadyEmitted)
			return false;
		initialReadyEmitted = true;
		const manifest = normalizeManifestInfo(manifestInfo) || await getManifest(true);
		emit('initial-ready', {
			source: 'dual-swap',
			role,
			...manifest
		});
		if (syncPayload)
			emit('sync', syncPayload);
		return true;
	}

	async function applyPendingDeltasToRole(role, onlyDeltaId, syncOptions = {}) {
		const signal = syncOptions[syncAbortSignalSymbol];
		const deltas = await readDeltas();
		for (let i = 0; i < deltas.length; i++) {
			throwIfSyncAborted(signal);
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
				[syncAbortSignalSymbol]: signal,
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

	async function publishStagingRole(manifest, replicaState = replicaReadyState) {
		const now = Date.now();
		return writeManifest({
			activeRole: manifest.stagingRole,
			stagingRole: manifest.activeRole,
			updatedAtMs: now,
			generation: manifest.generation + 1,
			clientId: manifest.clientId,
			replicaState
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
		const event = {
			phase,
			atMs: Date.now(),
			...details
		};
		if (typeof syncFaultInjector === 'function')
			syncFaultInjector(event);
		emit('sync-progress', event);
	}

	function setSyncFaultInjector(injector) {
		syncFaultInjector = typeof injector === 'function' ? injector : undefined;
		return () => {
			if (syncFaultInjector === injector)
				syncFaultInjector = undefined;
		};
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
			roleClient.syncClient = newSyncClient(
				roleClient,
				getDb,
				roleHttpInterceptor,
				syncInterceptors,
				{ fileSnapshotRollback: true }
			);
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
		const unsubscribes = [];
		unsubscribes.push(syncClient.on('sync', payload => {
			const info = extractDualSyncInfo(payload);
			if (info)
				updateManifestCache(info);
		}));
		unsubscribes.push(syncClient.on('initial-ready', payload => {
			const info = extractDualSyncInfo(payload);
			if (info)
				updateManifestCache(info, true);
		}));
		externalSyncUnsubscribe = () => {
			for (let i = 0; i < unsubscribes.length; i++) {
				if (typeof unsubscribes[i] === 'function')
					unsubscribes[i]();
			}
		};
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
			`SELECT "active_role", "staging_role", "updated_at_ms", "generation", "client_id", "last_successful_sync_at_ms", "replica_state" FROM "${manifestTable}"`,
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
			replicaState: normalizeReplicaState(row.replica_state ?? row.REPLICA_STATE),
			lastSuccessfulSyncAtMs: normalizeTimestamp(
				row.last_successful_sync_at_ms ?? row.LAST_SUCCESSFUL_SYNC_AT_MS
			)
		};
	}

	async function readRecoveryState() {
		const db = await getCacheDb();
		await ensureCacheSchema(db);
		const row = firstRow(await db.query([
			`SELECT "expected_generation", "active_role", "staging_role", "replay_kind", "started_at_ms", "mode" FROM "${recoveryTable}"`,
			`WHERE "id" = ${sqlStringLiteral(recoveryId)}`,
			'LIMIT 1'
		].join(' ')));
		if (!row)
			return null;
		const activeRole = row.active_role ?? row.ACTIVE_ROLE;
		const stagingRole = row.staging_role ?? row.STAGING_ROLE;
		if (!isRole(activeRole) || !isRole(stagingRole) || activeRole === stagingRole)
			return null;
		return {
			expectedGeneration: normalizeGeneration(row.expected_generation ?? row.EXPECTED_GENERATION),
			activeRole,
			stagingRole,
			replayKind: nonEmptyString(row.replay_kind ?? row.REPLAY_KIND),
			mode: nonEmptyString(row.mode ?? row.MODE),
			startedAtMs: normalizeTimestamp(row.started_at_ms ?? row.STARTED_AT_MS)
		};
	}

	async function writeRecoveryState(manifest, mode) {
		const db = await getCacheDb();
		await ensureCacheSchema(db);
		await db.query([
			`INSERT INTO "${recoveryTable}" ("id", "expected_generation", "active_role", "staging_role", "replay_kind", "started_at_ms", "mode")`,
			`VALUES (${sqlStringLiteral(recoveryId)}, ${manifest.generation}, ${sqlStringLiteral(manifest.activeRole)}, ${sqlStringLiteral(manifest.stagingRole)}, NULL, ${Date.now()}, ${sqlNullableStringLiteral(mode)})`,
			'ON CONFLICT("id") DO UPDATE SET',
			'"expected_generation" = excluded."expected_generation",',
			'"active_role" = excluded."active_role",',
			'"staging_role" = excluded."staging_role",',
			'"replay_kind" = NULL,',
			'"mode" = excluded."mode",',
			'"started_at_ms" = excluded."started_at_ms"'
		].join(' '));
	}

	async function setRecoveryReplayKind(manifest, replayKind) {
		const db = await getCacheDb();
		await ensureCacheSchema(db);
		await db.query([
			`UPDATE "${recoveryTable}"`,
			`SET "replay_kind" = ${sqlStringLiteral(replayKind)}`,
			`WHERE "id" = ${sqlStringLiteral(recoveryId)}`,
			`AND "expected_generation" = ${manifest.generation}`,
			`AND "active_role" = ${sqlStringLiteral(manifest.activeRole)}`,
			`AND "staging_role" = ${sqlStringLiteral(manifest.stagingRole)}`
		].join(' '));
	}

	async function clearRecoveryState() {
		const db = await getCacheDb();
		await ensureCacheSchema(db);
		await db.query(`DELETE FROM "${recoveryTable}" WHERE "id" = ${sqlStringLiteral(recoveryId)}`);
	}

	async function cleanupRecoveryState(recovery) {
		if (recovery && recovery.replayKind)
			await deleteReplayKind(recovery.replayKind);
		await clearRecoveryState();
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
				`"client_id" = ${sqlStringLiteral(normalized.clientId)},`,
				`"replica_state" = ${sqlStringLiteral(normalized.replicaState)}`,
				`WHERE "id" = ${sqlStringLiteral(manifestId)}`,
				`AND "generation" = ${normalizeGeneration(options.expectedGeneration)}`,
				`AND "active_role" = ${sqlStringLiteral(options.expectedActiveRole)}`,
				`AND "staging_role" = ${sqlStringLiteral(options.expectedStagingRole)}`
			].join(' '));
		}
		else {
			await db.query([
				`INSERT INTO "${manifestTable}" ("id", "active_role", "staging_role", "updated_at_ms", "generation", "client_id", "replica_state")`,
				`VALUES (${sqlStringLiteral(manifestId)}, ${sqlStringLiteral(normalized.activeRole)}, ${sqlStringLiteral(normalized.stagingRole)}, ${normalized.updatedAtMs}, ${normalized.generation}, ${sqlStringLiteral(normalized.clientId)}, ${sqlStringLiteral(normalized.replicaState)})`,
				options.insertOnly ? 'ON CONFLICT("id") DO NOTHING' : [
					'ON CONFLICT("id") DO UPDATE SET',
					'"active_role" = excluded."active_role",',
					'"staging_role" = excluded."staging_role",',
					'"updated_at_ms" = excluded."updated_at_ms",',
					'"generation" = excluded."generation",',
					'"client_id" = excluded."client_id",',
					'"replica_state" = excluded."replica_state"'
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
				|| persisted.replicaState !== normalized.replicaState)) {
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

	async function clearAllDeltas() {
		const db = await getCacheDb();
		await ensureCacheSchema(db);
		await db.query(`DELETE FROM "${deltaChunkTable}"`);
		await db.query(`DELETE FROM "${deltaTable}"`);
	}

	async function resetCache() {
		const db = await getCacheDb();
		const currentManifest = await getManifest().catch(() => null);
		cacheSchemaReady = false;
		cacheSchemaPromise = null;
		await db.query(`DROP TABLE IF EXISTS "${deltaChunkTable}"`);
		await db.query(`DROP TABLE IF EXISTS "${deltaTable}"`);
		await db.query(`DROP TABLE IF EXISTS "${replayTable}"`);
		await db.query(`DROP TABLE IF EXISTS "${recoveryTable}"`);
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

	function getCacheDb() {
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
					`"replica_state" TEXT NOT NULL DEFAULT '${replicaReadyState}',`,
					'"last_successful_sync_at_ms" INTEGER',
					');'
				].join(' '));
				await tryAddCacheColumn(db, manifestTable, 'generation', 'INTEGER NOT NULL DEFAULT 0');
				await tryAddCacheColumn(db, manifestTable, 'client_id', 'TEXT');
				await tryAddCacheColumn(db, manifestTable, 'last_successful_sync_at_ms', 'INTEGER');
				await tryAddCacheColumn(db, manifestTable, 'replica_state', `TEXT NOT NULL DEFAULT '${replicaReadyState}'`);
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
				await db.query([
					`CREATE TABLE IF NOT EXISTS "${replayTable}" (`,
					'"kind" TEXT NOT NULL,',
					'"mutation_id" TEXT NOT NULL,',
					'"row_json" TEXT NOT NULL,',
					'"replay_data" INTEGER NOT NULL,',
					'"created_at_ms" INTEGER NOT NULL,',
					'"applied_roles_json" TEXT NOT NULL,',
					'PRIMARY KEY ("kind", "mutation_id")',
					');'
				].join(' '));
				await db.query([
					`CREATE TABLE IF NOT EXISTS "${recoveryTable}" (`,
					'"id" TEXT PRIMARY KEY,',
					'"expected_generation" INTEGER NOT NULL,',
					'"active_role" TEXT NOT NULL,',
					'"staging_role" TEXT NOT NULL,',
					'"replay_kind" TEXT,',
					'"mode" TEXT,',
					'"started_at_ms" INTEGER NOT NULL',
					');'
				].join(' '));
				await tryAddCacheColumn(db, recoveryTable, 'mode', 'TEXT');
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

class StagingReloadRequiredError extends Error {
	constructor(reason) {
		super('Dual sync staging must be reloaded before applying an authoritative snapshot.');
		this.name = 'StagingReloadRequiredError';
		this.reason = reason;
	}
}

function canResumePullAfterError(error) {
	const status = Number(error && error.response && error.response.status || error && error.status);
	if (Number.isFinite(status) && status > 0)
		return true;
	const name = String(error && error.name || '');
	if (/Abort|Timeout/u.test(name))
		return true;
	const message = String(error && error.message || error || '');
	return /network|fetch|timed? ?out|ECONN|socket|aborted/u.test(message);
}

function isPublishedRecovery(manifest, recovery) {
	return !!manifest && !!recovery
		&& manifest.generation > recovery.expectedGeneration
		&& manifest.activeRole === recovery.stagingRole
		&& manifest.stagingRole === recovery.activeRole;
}

function assertExpectedRecoveryManifest(manifest, recovery) {
	if (!manifest || !recovery
		|| manifest.generation !== recovery.expectedGeneration
		|| manifest.activeRole !== recovery.activeRole
		|| manifest.stagingRole !== recovery.stagingRole) {
		throw new Error('Dual sync recovery state does not match the persisted manifest. Reset local sync state before retrying.');
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

function cloneSyncResult(result) {
	if (!result || result !== Object(result))
		return {};
	return Array.isArray(result) ? result.slice() : { ...result };
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

function failedMutationIds(error) {
	const mutations = Array.isArray(error && error.__orangeFailedMutations)
		? error.__orangeFailedMutations
		: [];
	return new Set(mutations
		.map(mutation => mutation && mutation.id)
		.filter(id => typeof id === 'string' && id.length > 0));
}

function conflictReplayKind(promotionId) {
	return `conflict:${promotionId}`;
}

function toFailedReplayRow(row, error) {
	const attempts = outboxRowAttempts(row);
	return {
		...row,
		status: 'failed',
		last_error: error && error.message || String(error),
		attempts: attempts + 1,
		pushed_at_ms: undefined,
		result_json: undefined
	};
}

function outboxRowMutationId(row) {
	if (!row || row !== Object(row))
		return undefined;
	return row.mutation_id ?? row.MUTATION_ID;
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
		replicaState: normalizeReplicaState(info.replicaState),
		updatedAtMs: Number(info.updatedAtMs) || Date.now(),
		generation: normalizeGeneration(info.generation),
		clientId: nonEmptyString(info.clientId),
		lastSuccessfulSyncAtMs: normalizeTimestamp(info.lastSuccessfulSyncAtMs)
	};
}

function normalizeReplicaState(value) {
	return value === replicaPendingState ? replicaPendingState : replicaReadyState;
}

function manifestChannelName(connectionString) {
	return `orange-orm:sqliteOPFS:dual-manifest:${normalizeLockNamePart(connectionString || 'default')}`;
}

function toDataPoolOptions(poolOptions = {}) {
	const options = {
		...poolOptions,
		sync: stripRouterSyncOptions(poolOptions.sync)
	};
	if (isManagedSyncWorkerEnabled(poolOptions.sync))
		options.singleWorker = true;
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

function stripRouterSyncOptions(sync) {
	if (!sync || sync !== Object(sync) || Array.isArray(sync))
		return sync;
	const {
		dual,
		worker,
		...rest
	} = sync;
	return rest;
}

function isManagedSyncWorkerEnabled(sync) {
	return !!sync && sync === Object(sync) && !Array.isArray(sync) && !!sync.worker;
}

function isDataFirstBootstrapEnabled(sync) {
	return !!sync && sync === Object(sync) && !Array.isArray(sync)
		&& sync.dual && sync.dual === Object(sync.dual)
		&& sync.dual.bootstrap === 'data-first';
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
	const result = timeoutMs === undefined ? {} : { timeoutMs };
	if (input[syncAbortSignalSymbol])
		result[syncAbortSignalSymbol] = input[syncAbortSignalSymbol];
	return result;
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

function sqlNullableStringLiteral(value) {
	return value === undefined || value === null ? 'NULL' : sqlStringLiteral(value);
}

function sqlNullableJsonLiteral(value) {
	if (value === undefined || value === null)
		return 'NULL';
	return sqlStringLiteral(stringify(value));
}

module.exports = newDualSyncDatabase;
module.exports.dualSyncFaultInjectorSymbol = dualSyncFaultInjectorSymbol;
