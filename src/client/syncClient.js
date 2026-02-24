const _axios = require('axios');

function newSyncClient(client, getDb, axiosInterceptor) {
	const sinceByScope = new Map();
	const syncStateTable = 'orange_sync_state';

	return {
		pull,
		getConfig
	};

	async function getConfig() {
		const db = await getDb();
		return normalizeSyncConfig(db && db.__sqliteSync);
	}

	async function pull(options = {}) {
		const db = await getDb();
		const syncConfig = normalizeSyncConfig(db && db.__sqliteSync);
		if (!syncConfig)
			throw new Error('Sync is not configured. Add sync in sqlite options: sqlite(connectionString, { sync: ... })');

		const pullOptions = normalizePullOptions(options);
		const pullConfig = resolvePullConfig(syncConfig, pullOptions);
		const configuredTables = pullConfig.tables;
		if (!Array.isArray(configuredTables) || configuredTables.length === 0)
			throw new Error('Sync pull requires configured tables. Set sync.pull.tables (or sync.tables).');
		const currentSince = await getScopeSince(configuredTables, db);
		const requestOptions = {
			tables: configuredTables,
			since: currentSince,
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
		if (result && result.since !== undefined)
			await setScopeSince(configuredTables, result.since, db);
		return result;
	}

	async function pullStaged(pullConfig, options) {
		const maxKeysPerBatch = normalizeLimit(pullConfig.maxKeysPerBatch, 200);
		const maxRowsPerBatch = normalizeLimit(pullConfig.maxRowsPerBatch, 200);
		const defaultPatchOptions = { ...(pullConfig.patchOptions || {}), concurrency: 'overwrite' };
		let applied = 0;
		let stagedResult;
		await client.transaction(async (tx) => {
			await tryDeferForeignKeys(tx);
			stagedResult = await iterateStagedPull(tx);
			await validateForeignKeys(tx);
		});

		return {
			applied,
			tables: stagedResult.tables,
			since: stagedResult.since,
			payload: stagedResult.payload
		};

		async function iterateStagedPull(tx) {
			let token = options.token;
			let finalSince = options.since;
			const touchedTables = new Set();
			let reason;
			for (let i = 0; i < 10000; i++) {
				const keysPayload = await requestPayload({
					...pullConfig,
					body: {
						phase: 'keys',
						token,
						since: options.since,
						tables: options.tables,
						limit: maxKeysPerBatch
					}
				}, options);
				if (!isStagedKeysPayload(keysPayload))
					throw new Error('Sync endpoint did not return staged keys payload');
				if (reason === undefined && keysPayload.reason !== undefined)
					reason = keysPayload.reason;
				if (keysPayload.cursor !== undefined)
					finalSince = keysPayload.cursor;
				const keyItems = normalizeKeyItems(keysPayload.items);
				for (let keyIndex = 0; keyIndex < keyItems.length; keyIndex++) {
					touchedTables.add(keyItems[keyIndex].table);
				}

				const deleteItems = keyItems.filter(x => x.op === 'D');
				const upsertItems = keyItems.filter(x => x.op !== 'D');
				if (tx && deleteItems.length > 0)
					applied += await applyDeleteItemsOnTx(tx, deleteItems, defaultPatchOptions);

				let nextRowsOffset = 0;
				let nextRowsPromise = upsertItems.length > 0
					? requestRowsChunk(upsertItems, nextRowsOffset)
					: null;
				nextRowsOffset += maxRowsPerBatch;
				while (nextRowsPromise) {
					const currentRowsResult = await nextRowsPromise;
					if (nextRowsOffset < upsertItems.length) {
						nextRowsPromise = requestRowsChunk(upsertItems, nextRowsOffset);
						nextRowsOffset += maxRowsPerBatch;
					}
					else
						nextRowsPromise = null;
					if (currentRowsResult.error)
						throw currentRowsResult.error;
					if (!isRowsPayload(currentRowsResult.payload))
						throw new Error('Sync endpoint did not return rows payload');
					if (tx)
						applied += await applyRowsPayloadOnTx(tx, currentRowsResult.payload.items, defaultPatchOptions);
				}
				if (keysPayload.done || !keysPayload.token) {
					return {
						tables: Array.from(touchedTables),
						since: finalSince,
						payload: reason === undefined ? keysPayload : { ...keysPayload, reason }
					};
				}
				token = keysPayload.token;
			}
			throw new Error('Sync failed: staged pull exceeded max iterations');

				function requestRowsChunk(items, offset) {
					const chunk = items.slice(offset, offset + maxRowsPerBatch);
					return requestPayload({
						...pullConfig,
						body: {
							phase: 'rows',
							items: chunk
						}
				}, options)
					.then(
						(payload) => ({ payload, error: null }),
						(error) => ({ payload: null, error })
					);
			}
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
			});
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
		await writeScopeSince(scopeKey, since, db);
	}

	function getScopeKey(tables) {
		if (!Array.isArray(tables) || tables.length === 0)
			return '*';
		const dedup = Array.from(new Set(tables.filter(x => typeof x === 'string')));
		dedup.sort();
		return dedup.join('|');
	}

	async function ensureSyncStateTable(db) {
		await db.query([
			`CREATE TABLE IF NOT EXISTS "${syncStateTable}" (`,
			'"scope" TEXT PRIMARY KEY,',
			'"since_value" TEXT NOT NULL',
			');'
		].join(' '));
	}

	async function readScopeSince(scopeKey, db) {
		if (!db || typeof db.query !== 'function')
			return undefined;
		await ensureSyncStateTable(db);
		const rows = await db.query(
			`SELECT "since_value" FROM "${syncStateTable}" WHERE "scope" = ${sqlStringLiteral(scopeKey)} LIMIT 1`
		);
		const row = Array.isArray(rows) ? rows[0] : rows?.rows?.[0];
		if (!row)
			return undefined;
		const raw = row.since_value ?? row.SINCE_VALUE;
		if (typeof raw !== 'string' || raw.length === 0)
			return undefined;
		try {
			return JSON.parse(raw);
		}
		catch (_e) {
			return raw;
		}
	}

	async function writeScopeSince(scopeKey, since, db) {
		if (!db || typeof db.query !== 'function')
			return;
		await ensureSyncStateTable(db);
		const sinceSerialized = JSON.stringify(since);
		await db.query(
			`INSERT INTO "${syncStateTable}" ("scope", "since_value") VALUES (${sqlStringLiteral(scopeKey)}, ${sqlStringLiteral(sinceSerialized)}) `
			+ 'ON CONFLICT("scope") DO UPDATE SET "since_value" = excluded."since_value"'
		);
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
	return {
		...endpoint,
		pull: sync.pull === undefined ? undefined : normalizePullConfig(sync.pull, endpoint, tables),
		tables,
		push: normalizeEndpoint(sync.push)
	};
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
		maxRowsPerBatch: config.maxRowsPerBatch
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

async function requestPayload(config, options) {
	const axiosRoot = _axios.default || _axios;
	const axios = typeof axiosRoot.create === 'function' ? axiosRoot.create() : axiosRoot;
	const axiosInterceptor = options && options._syncAxiosInterceptor;
	if (axiosInterceptor && typeof axiosInterceptor.applyTo === 'function')
		axiosInterceptor.applyTo(axios);
	const requestBody = config.body !== undefined ? config.body : {
		since: options.since,
		tables: options.tables
	};

	const request = {
		url: appendQueryParam(config.url, 'sync', 'pull'),
		method: 'post',
		timeout: config.timeoutMs
	};
	request.data = requestBody;

	const response = await axios.request(request);
	return response.data;
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
			op: 'replace',
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
		await tx[table].patch(patch, patchOptions);
		applied += patch.length;
	}
	return applied;
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

function sqlStringLiteral(value) {
	return `'${String(value).replace(/'/g, '\'\'')}'`;
}

module.exports = newSyncClient;
