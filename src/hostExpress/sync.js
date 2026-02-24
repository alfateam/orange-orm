const stringify = require('../client/stringify');

function newSyncHandler(client, options = {}) {
	const syncOptions = normalizeSyncOptions(options.sync);
	if (!syncOptions || syncOptions.enabled === false)
		return null;

	const tableMeta = createTableMeta(client, syncOptions);
	const queue = createQueue(syncOptions.queue);

	return async function handleSync(request, response) {
		try {
			const result = await queue.run(() => execute(request.body || {}));
			response.json(result);
		}
		catch (e) {
			if (e.status === undefined)
				response.status(500).send(e.message || e);
			else
				response.status(e.status).send(e.message);
		}
	};

	async function execute(body) {
		const phase = body.phase || body.action;
		if (phase === 'keys')
			return pullKeys(body);
		if (phase === 'rows')
			return pullRows(body);
		const error = new Error('Invalid sync phase. Use { phase: "keys" } or { phase: "rows" }.');
		error.status = 400;
		throw error;
	}

	async function pullKeys(body) {
		const requestedTables = normalizeRequestedTables(body.tables, tableMeta, syncOptions.limits.maxTablesPerRequest);
		const limit = normalizeLimit(body.limit, syncOptions.limits.maxKeysPerBatch);
		const token = normalizeToken(body.token, requestedTables);
		if (token && token.mode === 'changes')
			return pullKeysFromChanges(token, limit);
		if (token && token.mode === 'snapshot')
			return pullKeysFromSnapshot(token, limit);

		const startCursor = normalizeCursor(body.cursor ?? body.since);
		const bounds = await getChangeBounds(syncOptions.changeTable);
		const fallback = shouldUseSnapshot(startCursor, bounds, syncOptions.limits.maxChangeWindow);
		if (fallback.useSnapshot) {
			const snapshotToken = {
				v: 1,
				mode: 'snapshot',
				tables: requestedTables,
				tableIndex: 0,
				offset: 0,
				watermark: bounds.max
			};
			const result = await pullKeysFromSnapshot(snapshotToken, limit);
			result.reason = fallback.reason;
			return result;
		}

		const changeToken = {
			v: 1,
			mode: 'changes',
			tables: requestedTables,
			cursor: startCursor,
			watermark: bounds.max
		};
		return pullKeysFromChanges(changeToken, limit);
	}

	async function pullKeysFromSnapshot(token, limit) {
		const items = [];
		let tableIndex = normalizeInteger(token.tableIndex, 0);
		let offset = normalizeInteger(token.offset, 0);
		while (items.length < limit && tableIndex < token.tables.length) {
			const tableName = token.tables[tableIndex];
			const meta = tableMeta.byName.get(tableName);
			if (!meta) {
				tableIndex += 1;
				offset = 0;
				continue;
			}
			const remaining = limit - items.length;
			const keys = await fetchSnapshotKeys(meta, remaining, offset);
			for (let i = 0; i < keys.length; i++) {
				const pk = keys[i];
				items.push({ table: tableName, pk, key: toKeyObject(meta, pk), op: 'U' });
			}
			if (keys.length < remaining) {
				tableIndex += 1;
				offset = 0;
			}
			else {
				offset += keys.length;
			}
		}
		const done = tableIndex >= token.tables.length;
		return {
			phase: 'keys',
			mode: 'snapshot',
			done,
			cursor: token.watermark,
			token: done ? null : {
				v: 1,
				mode: 'snapshot',
				tables: token.tables,
				tableIndex,
				offset,
				watermark: token.watermark
			},
			items
		};
	}

	async function pullKeysFromChanges(token, limit) {
		const fromCursor = normalizeInteger(token.cursor, 0);
		const watermark = normalizeInteger(token.watermark, 0);
		if (fromCursor >= watermark) {
			return {
				phase: 'keys',
				mode: 'changes',
				done: true,
				cursor: watermark,
				token: null,
				items: []
			};
		}
		const whereTables = token.tables.length === 0
			? ''
			: ` AND table_name IN (${token.tables.map((name) => sqlStringLiteral(tableMeta.byName.get(name).dbName)).join(',')})`;
		const sql = [
			'SELECT id, table_name, op, pk_json',
			`FROM ${quoteQualified(syncOptions.changeTable)}`,
			`WHERE id > ${fromCursor} AND id <= ${watermark}${whereTables}`,
			'ORDER BY id ASC',
			`LIMIT ${limit}`
		].join(' ');
		const rows = await safeQuery(sql, []);
		const dedup = new Map();
		let nextCursor = fromCursor;
		for (let i = 0; i < rows.length; i++) {
			const row = rows[i];
			const id = normalizeInteger(row.id ?? row.ID, nextCursor);
			nextCursor = id > nextCursor ? id : nextCursor;
			const rawTableName = row.table_name ?? row.TABLE_NAME;
			const meta = tableMeta.byDbName.get(rawTableName);
			if (!meta)
				continue;
			let keyObject;
			try {
				keyObject = typeof row.pk_json === 'string'
					? JSON.parse(row.pk_json)
					: JSON.parse(row.PK_JSON);
			}
			catch (_e) {
				continue;
			}
			const pk = toPkArray(meta, keyObject);
			if (!pk)
				continue;
			const mapKey = `${meta.name}|${stringify(pk)}`;
			const op = normalizeOp(row.op ?? row.OP);
			if (dedup.has(mapKey))
				dedup.delete(mapKey);
			dedup.set(mapKey, { table: meta.name, pk, key: toKeyObject(meta, pk), op });
		}
		const items = Array.from(dedup.values());
		const done = rows.length === 0 || nextCursor >= watermark;
		return {
			phase: 'keys',
			mode: 'changes',
			done,
			cursor: watermark,
			token: done ? null : {
				v: 1,
				mode: 'changes',
				tables: token.tables,
				cursor: nextCursor,
				watermark
			},
			items
		};
	}

	async function pullRows(body) {
		const rawItems = Array.isArray(body.items) ? body.items : [];
		const limit = normalizeLimit(rawItems.length, syncOptions.limits.maxRowsPerBatch);
		const items = rawItems.slice(0, limit);
		const tableKeys = new Map();
		for (let i = 0; i < items.length; i++) {
			const item = items[i];
			if (!item || typeof item.table !== 'string')
				continue;
			const meta = tableMeta.byName.get(item.table);
			if (!meta)
				continue;
			if (normalizeOp(item.op) === 'D')
				continue;
			const pk = Array.isArray(item.pk) ? item.pk : toPkArray(meta, item.key);
			if (!pk || pk.length !== meta.pkColumns.length)
				continue;
			if (!tableKeys.has(meta.name))
				tableKeys.set(meta.name, []);
			tableKeys.get(meta.name).push(pk);
		}

		const rowMap = new Map();
		const tableNames = Array.from(tableKeys.keys());
		for (let i = 0; i < tableNames.length; i++) {
			const tableName = tableNames[i];
			const meta = tableMeta.byName.get(tableName);
			const keys = tableKeys.get(tableName);
			const rows = await fetchRowsByPrimaryKeys(meta, keys);
			const perTable = new Map();
			for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
				const row = rows[rowIndex];
				const pk = toPkArray(meta, row);
				perTable.set(stringify(pk), row);
			}
			rowMap.set(tableName, perTable);
		}

		const resolved = [];
		for (let i = 0; i < items.length; i++) {
			const item = items[i];
			if (!item || typeof item.table !== 'string')
				continue;
			const meta = tableMeta.byName.get(item.table);
			if (!meta)
				continue;
			const pk = Array.isArray(item.pk) ? item.pk : toPkArray(meta, item.key);
			if (!pk)
				continue;
			const row = rowMap.get(meta.name)?.get(stringify(pk));
			if (row !== undefined)
				resolved.push({ table: meta.name, pk, key: toKeyObject(meta, pk), row, op: normalizeOp(item.op) });
		}

		return {
			phase: 'rows',
			items: resolved
		};
	}

	async function fetchSnapshotKeys(meta, limit, offset) {
		const strategy = {};
		for (let i = 0; i < meta.pkColumns.length; i++) {
			strategy[meta.pkColumns[i].alias] = true;
		}
		strategy.orderBy = meta.pkColumns.map(x => x.alias);
		strategy.limit = limit;
		strategy.offset = offset;
		const rows = await client.transaction(async (tx) => {
			return tx[meta.name].getMany(undefined, strategy);
		}, { readonly: true });
		const result = [];
		for (let i = 0; i < rows.length; i++) {
			const pk = toPkArray(meta, rows[i]);
			if (pk)
				result.push(pk);
		}
		return result;
	}

	async function fetchRowsByPrimaryKeys(meta, keys) {
		if (!Array.isArray(keys) || keys.length === 0)
			return [];
		const where = [];
		const parameters = [];
		for (let i = 0; i < keys.length; i++) {
			const pk = keys[i];
			if (!Array.isArray(pk) || pk.length !== meta.pkColumns.length)
				continue;
			const parts = [];
			for (let colIndex = 0; colIndex < meta.pkColumns.length; colIndex++) {
				const col = meta.pkColumns[colIndex];
				parts.push(`${quoteIdent(col.dbName)} = ?`);
				parameters.push(pk[colIndex]);
			}
			where.push(`(${parts.join(' AND ')})`);
		}
		if (where.length === 0)
			return [];
		const filter = {
			sql: where.join(' OR '),
			parameters
		};
		return client.transaction(async (tx) => {
			return tx[meta.name].getMany(filter);
		}, { readonly: true });
	}

	async function getChangeBounds(changeTable) {
		try {
			const sql = [
				'SELECT',
				'COALESCE(MIN(id), 0) AS min_id,',
				'COALESCE(MAX(id), 0) AS max_id',
				`FROM ${quoteQualified(changeTable)}`
			].join(' ');
			const rows = await safeQuery(sql, []);
			const row = rows[0] || {};
			return {
				exists: true,
				min: normalizeInteger(row.min_id ?? row.MIN_ID, 0),
				max: normalizeInteger(row.max_id ?? row.MAX_ID, 0)
			};
		}
		catch (_error) {
			return { exists: false, min: 0, max: 0 };
		}
	}

	async function safeQuery(sql, fallback) {
		const result = await client.query(sql);
		if (Array.isArray(result))
			return result;
		if (Array.isArray(result?.rows))
			return result.rows;
		return fallback;
	}
}

function normalizeSyncOptions(sync) {
	if (!sync)
		return null;
	const queueOptions = sync.queue || {};
	const limits = sync.limits || {};
	return {
		enabled: sync.enabled !== false,
		changeTable: sync.changeTable || 'orange_changes',
		queue: {
			concurrency: clamp(normalizeInteger(queueOptions.concurrency, 4), 1, 100),
			maxPending: clamp(normalizeInteger(queueOptions.maxPending, 1000), 0, 100000)
		},
		limits: {
			maxTablesPerRequest: clamp(normalizeInteger(limits.maxTablesPerRequest, 50), 1, 1000),
			maxKeysPerBatch: clamp(normalizeInteger(limits.maxKeysPerBatch, 200), 1, 10000),
			maxRowsPerBatch: clamp(normalizeInteger(limits.maxRowsPerBatch, 200), 1, 10000),
			maxChangeWindow: clamp(normalizeInteger(limits.maxChangeWindow, 50000), 1, 100000000)
		}
	};
}

function createTableMeta(client, syncOptions) {
	const byName = new Map();
	const byDbName = new Map();
	for (let tableName in client.tables) {
		const table = client.tables[tableName];
		const pkColumns = Array.isArray(table?._primaryColumns) ? table._primaryColumns : [];
		if (pkColumns.length === 0)
			continue;
		const dbName = table._dbName;
		if (!dbName || dbName === syncOptions.changeTable)
			continue;
		const meta = {
			name: tableName,
			dbName,
			pkColumns: pkColumns.map((col) => ({ alias: col.alias, dbName: col._dbName || col.alias }))
		};
		byName.set(tableName, meta);
		byDbName.set(dbName, meta);
		const split = dbName.split('.');
		byDbName.set(split[split.length - 1], meta);
	}
	return { byName, byDbName };
}

function createQueue({ concurrency, maxPending }) {
	let running = 0;
	const pending = [];
	return { run };

	function run(job) {
		return new Promise((resolve, reject) => {
			if (running >= concurrency && pending.length >= maxPending) {
				const error = new Error('Sync queue is full. Try again later.');
				error.status = 429;
				reject(error);
				return;
			}
			pending.push({ job, resolve, reject });
			drain();
		});
	}

	function drain() {
		while (running < concurrency && pending.length > 0) {
			const next = pending.shift();
			running += 1;
			Promise.resolve()
				.then(next.job)
				.then(next.resolve, next.reject)
				.finally(() => {
					running -= 1;
					drain();
				});
		}
	}
}

function shouldUseSnapshot(cursor, bounds, maxChangeWindow) {
	if (!Number.isFinite(cursor))
		return { useSnapshot: true, reason: 'first_sync' };
	if (!bounds.exists)
		return { useSnapshot: true, reason: 'change_table_unavailable' };
	if (cursor < bounds.min - 1)
		return { useSnapshot: true, reason: 'cursor_too_old' };
	if (bounds.max - cursor > maxChangeWindow)
		return { useSnapshot: true, reason: 'cursor_too_far_behind' };
	return { useSnapshot: false };
}

function normalizeRequestedTables(rawTables, tableMeta, maxTablesPerRequest) {
	if (!Array.isArray(rawTables) || rawTables.length === 0)
		return Array.from(tableMeta.byName.keys());
	const normalized = [];
	for (let i = 0; i < rawTables.length; i++) {
		const raw = rawTables[i];
		if (typeof raw !== 'string')
			continue;
		const byName = tableMeta.byName.get(raw);
		if (byName) {
			normalized.push(byName.name);
			continue;
		}
		const byDbName = tableMeta.byDbName.get(raw);
		if (byDbName)
			normalized.push(byDbName.name);
	}
	const deduped = Array.from(new Set(normalized));
	return deduped.slice(0, maxTablesPerRequest);
}

function normalizeToken(token, requestedTables) {
	if (!token || token !== Object(token))
		return null;
	if (token.v !== 1)
		return null;
	if (token.mode === 'changes') {
		return {
			v: 1,
			mode: 'changes',
			tables: requestedTables,
			cursor: normalizeInteger(token.cursor, 0),
			watermark: normalizeInteger(token.watermark, 0)
		};
	}
	if (token.mode === 'snapshot') {
		return {
			v: 1,
			mode: 'snapshot',
			tables: requestedTables,
			tableIndex: normalizeInteger(token.tableIndex, 0),
			offset: normalizeInteger(token.offset, 0),
			watermark: normalizeInteger(token.watermark, 0)
		};
	}
	return null;
}

function normalizeCursor(cursor) {
	if (cursor === null || cursor === undefined || cursor === '')
		return NaN;
	if (typeof cursor === 'number' && Number.isFinite(cursor))
		return cursor;
	if (typeof cursor === 'string') {
		const parsed = Number.parseInt(cursor, 10);
		return Number.isFinite(parsed) ? parsed : NaN;
	}
	return NaN;
}

function normalizeLimit(limit, max) {
	return clamp(normalizeInteger(limit, max), 1, max);
}

function normalizeInteger(value, fallback) {
	if (typeof value === 'number' && Number.isFinite(value))
		return Math.floor(value);
	if (typeof value === 'string') {
		const parsed = Number.parseInt(value, 10);
		if (Number.isFinite(parsed))
			return parsed;
	}
	return fallback;
}

function normalizeOp(value) {
	if (typeof value !== 'string')
		return 'U';
	const op = value.toUpperCase();
	if (op === 'I' || op === 'U' || op === 'D')
		return op;
	return 'U';
}

function toPkArray(meta, row) {
	if (!row || row !== Object(row))
		return null;
	const result = [];
	for (let i = 0; i < meta.pkColumns.length; i++) {
		const key = meta.pkColumns[i].alias;
		if (!(key in row))
			return null;
		result.push(row[key]);
	}
	return result;
}

function toKeyObject(meta, pk) {
	const key = {};
	for (let i = 0; i < meta.pkColumns.length && i < pk.length; i++) {
		key[meta.pkColumns[i].alias] = pk[i];
	}
	return key;
}

function clamp(value, min, max) {
	return Math.max(min, Math.min(max, value));
}

function quoteQualified(name) {
	return String(name).split('.').map(quoteIdent).join('.');
}

function quoteIdent(name) {
	return `"${String(name).replace(/"/g, '""')}"`;
}

function sqlStringLiteral(value) {
	return `'${String(value).replace(/'/g, '\'\'')}'`;
}

module.exports = newSyncHandler;
