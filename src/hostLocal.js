let executePath = require('./hostExpress/executePath');
let getMeta = require('./hostExpress/getMeta');
let setSessionSingleton = require('./table/setSessionSingleton');
let executeQuery = require('./query');
let executeSqliteFunction = require('./sqliteFunction');
let hostExpress = require('./hostExpress');
let hostHono = require('./hostHono');
let randomUuid = require('./randomUuid');
let stringify = require('./client/stringify');
let getSessionSingleton = require('./table/getSessionSingleton');
let outboxTableSql = require('./sync/outboxTableSql');
let { runSyncWrite } = require('./sync/writeGate');
const readonlyOps = ['getManyDto', 'getMany', 'aggregate', 'distinct', 'count'];
const syncOutboxEnsuredKey = typeof Symbol === 'function'
	? Symbol.for('orange-orm.syncOutboxEnsured')
	: '__orangeOrmSyncOutboxEnsured';
// { db, table, defaultConcurrency,
// 	concurrency,
// 	customFilters,
// 	baseFilter, strategy, transaction,
// 	readonly,
// 	disableBulkDeletes, isBrowser }
function hostLocal() {
	const _options = arguments[0];
	let { table, transaction, db, isHttp, hooks, client } = _options;
	const transactionHooks = hooks && hooks.transaction;
	const getTransactionHook = (name) =>
		(transactionHooks && transactionHooks[name]) || (hooks && hooks[name]);

	let c = { get, post, patch, syncCommand, query, sqliteFunction, express, hono };

	function get() {
		return getMeta(table);

	}
	async function patch(body, _req, _res) {
		if (!table) {
			const error = new Error('Table is not exposed');
			// @ts-ignore
			error.status = 400;
			throw error;
		}
		body = typeof body === 'string' ? JSON.parse(body) : body;
		let result;

		if (transaction)
			await transaction(fn);
		else {
			const resolvedDb = await resolveDb();
			await runSyncWrite(resolvedDb, undefined, () => resolvedDb.transaction(fn));
		}
		return result;

		async function fn(context) {
			setSessionSingleton(context, 'ignoreSerializable', true);
			let patch = body.patch;
			await captureSyncOutboxPatch(context, patch, body.options);
			result = await table.patch(context, patch, { ..._options, ...body.options, isHttp });
		}
	}

	async function syncCommand(body) {
		body = typeof body === 'string' ? JSON.parse(body) : body;
		if (!body || body !== Object(body))
			throw new Error('Invalid sync command payload');
		let result;

		if (transaction)
			await transaction(fn);
		else {
			const resolvedDb = await resolveDb();
			await runSyncWrite(resolvedDb, undefined, () => resolvedDb.transaction(fn));
		}
		return result;

		async function fn(context) {
			await captureSyncOutboxCommand(context, body.name, body.args);
			result = undefined;
		}
	}

	async function post(body, request, response) {
		body = typeof body === 'string' ? JSON.parse(body) : body;
		let result;

		if (transaction)
			await transaction(fn);
		else {
			const resolvedDb = await resolveDb();
			const beforeBegin = getTransactionHook('beforeBegin');
			const afterBegin = getTransactionHook('afterBegin');
			const beforeCommit = getTransactionHook('beforeCommit');
			const afterCommit = getTransactionHook('afterCommit');
			const afterRollback = getTransactionHook('afterRollback');
			const hasTransactionHooks = !!(beforeBegin
				|| afterBegin
				|| beforeCommit
				|| afterCommit
				|| afterRollback);
			if (!hasTransactionHooks && readonlyOps.includes(body.path))
				await resolvedDb.transaction({ readonly: true }, fn);
			else {
				await runSyncWrite(resolvedDb, undefined, () => resolvedDb.transaction(async (context) => {
					const hookDb = typeof client === 'function'
						? client({ transaction: (fn) => fn(context) })
						: (client || resolvedDb);
					if (afterCommit)
						setSessionSingleton(context, 'afterCommitHook', () =>
							afterCommit(hookDb, request, response)
						);
					if (afterRollback)
						setSessionSingleton(context, 'afterRollbackHook', (error) =>
							afterRollback(hookDb, request, response, error)
						);
					if (beforeBegin)
						await beforeBegin(hookDb, request, response);
					if (afterBegin)
						await afterBegin(hookDb, request, response);
					await fn(context);
					if (beforeCommit)
						await beforeCommit(hookDb, request, response);
				}));
			}

		}
		return result;

		async function fn(context) {
			setSessionSingleton(context, 'ignoreSerializable', true);
			const options = { ..._options, ...body.options, JSONFilter: body, request, response, isHttp };
			result = await executePath(context, options);
		}
	}
	async function query() {
		let args = arguments;
		let result;

		if (transaction)
			await transaction(fn);
		else {
			const resolvedDb = await resolveDb();
			result = await resolvedDb.query.apply(null, arguments);
		}

		return result;

		async function fn(...args1) {
			result = await executeQuery.apply(null, [...args1, ...args]);
		}

	}

	async function sqliteFunction() {
		let args = arguments;
		let result;

		if (transaction)
			await transaction(fn);
		else {
			const resolvedDb = await resolveDb();
			result = await resolvedDb.sqliteFunction.apply(null, arguments);
		}

		return result;

		async function fn(...args1) {
			result = await executeSqliteFunction.apply(null, [...args1, ...args]);
		}

	}

	function express(client, options) {
		return hostExpress(hostLocal, client, options);
	}

	function hono(client, options) {
		return hostHono(hostLocal, client, options);
	}

	return c;

	async function resolveDb() {
		if (typeof db !== 'function')
			return db;
		let dbPromise = db();
		if (dbPromise.then)
			db = await dbPromise;
		else
			db = dbPromise;
		return db;
	}

	async function captureSyncOutboxPatch(context, patch, options) {
		if (!Array.isArray(patch) || patch.length === 0)
			return;
		const tableName = _options.syncTableName;
		if (!tableName)
			return;
		let state = await getSyncOutboxCaptureState(context);
		if (!state)
			return;
		state.patches.push({
			table: tableName,
			patch,
			options: sanitizeSyncPatchOptions(options)
		});
		await updateSyncOutboxCaptureState(context, state);
	}

	async function captureSyncOutboxCommand(context, name, args) {
		if (typeof name !== 'string' || name.length === 0)
			throw new Error('Sync command requires a command name');
		const normalizedArgs = normalizeSyncCommandArgs(args);
		let state = await getSyncOutboxCaptureState(context);
		if (!state)
			return;
		state.commands.push({ name, args: normalizedArgs });
		await updateSyncOutboxCaptureState(context, state);
	}

	async function getSyncOutboxCaptureState(context) {
		if (getSessionSingleton(context, 'suppressSyncOutbox'))
			return null;
		const pool = getSessionSingleton(context, 'poolFactory');
		if (!pool || !pool.__sqliteSync)
			return null;
		let state = getSessionSingleton(context, 'syncOutboxCapture');
		if (!state) {
			state = { id: randomUuid(), patches: [], commands: [] };
			setSessionSingleton(context, 'syncOutboxCapture', state);
			await insertSyncOutboxPlaceholder(context, pool, state.id);
		}
		if (!Array.isArray(state.patches))
			state.patches = [];
		if (!Array.isArray(state.commands))
			state.commands = [];
		return state;
	}

	async function insertSyncOutboxPlaceholder(context, pool, id) {
		for (let attempt = 0; attempt < 2; attempt++) {
			await ensureSyncOutboxTable(context);
			try {
				await querySyncOutbox(context, [
					'INSERT INTO "orange_sync_outbox" ("mutation_id", "table_name", "patch_json", "options_json", "created_at_ms")',
					`VALUES (${sqlStringLiteral(id)}, '*', '[]', '{}', ${Date.now()})`,
					'ON CONFLICT("mutation_id") DO NOTHING'
				].join(' '));
				return;
			}
			catch (e) {
				if (attempt === 0 && isMissingSqliteTableError(e, 'orange_sync_outbox')) {
					delete pool[syncOutboxEnsuredKey];
					continue;
				}
				throw e;
			}
		}
	}

	async function updateSyncOutboxCaptureState(context, state) {
		await querySyncOutbox(context, [
			'UPDATE "orange_sync_outbox"',
			`SET "patch_json" = ${sqlStringLiteral(stringify(serializeSyncOutboxCaptureState(state)))}`,
			`WHERE "mutation_id" = ${sqlStringLiteral(state.id)}`
		].join(' '));
	}

	function serializeSyncOutboxCaptureState(state) {
		if (!Array.isArray(state.commands) || state.commands.length === 0)
			return state.patches;
		return {
			patches: state.patches,
			commands: state.commands
		};
	}

	function normalizeSyncCommandArgs(args) {
		if (args === undefined)
			return null;
		return JSON.parse(JSON.stringify(args));
	}

	async function ensureSyncOutboxTable(context) {
		const pool = getSessionSingleton(context, 'poolFactory');
		if (pool && pool[syncOutboxEnsuredKey])
			return;
		await querySyncOutbox(context, outboxTableSql());
		if (pool)
			pool[syncOutboxEnsuredKey] = true;
	}

	function querySyncOutbox(context, sql) {
		return executeQuery(context, sql);
	}

	function sqlStringLiteral(value) {
		return `'${String(value).replace(/'/g, '\'\'')}'`;
	}

	function isMissingSqliteTableError(error, tableName) {
		const message = error && error.message || '';
		return message.includes(`no such table: ${tableName}`)
			|| message.includes(`no such table: "${tableName}"`);
	}

	function sanitizeSyncPatchOptions(options) {
		if (!options || options !== Object(options))
			return undefined;
		const {
			db,
			transaction,
			client,
			syncTableName,
			strategy,
			deduceStrategy,
			...rest
		} = options;
		return Object.keys(rest).length > 0 ? rest : undefined;
	}
}

module.exports = hostLocal;
