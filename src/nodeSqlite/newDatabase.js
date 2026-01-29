let createDomain = require('../createDomain');
let newTransaction = require('./newTransaction');
let _begin = require('../table/begin');
let commit = require('../table/commit');
let rollback = require('../table/rollback');
let newPool = require('./newPool');
let express = require('../hostExpress');
let hostLocal = require('../hostLocal');
let doQuery = require('../query');
let doSqliteFunction = require('../sqliteFunction');
let releaseDbClient = require('../table/releaseDbClient');

function newDatabase(connectionString, poolOptions, hooks) {
	if (!connectionString)
		throw new Error('Connection string cannot be empty');
	poolOptions = poolOptions || { min: 1 };
	var pool = newPool(connectionString, poolOptions);

	// Normalize hooks with safe no-ops
	hooks = hooks || {};
	const callHook = async (name, ...args) => {
		try {
			const fn = hooks && hooks[name];
			if (typeof fn === 'function') {
				return await fn(...args);
			}
		} catch (e) {
			// Hooks should not break core flow; log and continue
			// Using console.error to avoid introducing new deps
			console.error(`[orange-orm] Hook ${name} failed:`, e);
		}
	};

	let c = {poolFactory: pool, hostLocal, express};

	c.transaction = function(options, fn) {
		console.dir('trancation.........yes');
		if ((arguments.length === 1) && (typeof options === 'function')) {
			fn = options;
			options = undefined;
		}
		let domain = createDomain();
		const req = domain && domain.req;

		if (!fn)
			throw new Error('transaction requires a function');
		console.dir('run fn in trans........');
		return domain.run(runInTransaction);

		function begin() {
			return Promise.resolve()
				.then(() => callHook('beforeTransactionBegin', c, req))
				.then(() => _begin(domain, options))
				.then((res) => Promise.resolve(callHook('afterTransactionBegin', c, req)).then(() => res));
		}

		async function runInTransaction() {
			let result;
			let transaction = newTransaction(domain, pool, options);
			await new Promise(transaction)
				.then(begin)
				.then(() => fn(domain))
				.then((res) => result = res)
				.then(() => Promise.resolve(callHook('beforeTransactionCommit', c, req)))
				.then(() => commit(domain))
				.then(() => callHook('afterTransactionCommit', c, req))
				.then(null, (e) => Promise.resolve(rollback(domain, e))
					.then(() => callHook('afterTransactionRollback', c, req, e))
				);
			return result;
		}


	};

	c.createTransaction = function(options) {
		console.dir('create transaction');
		let domain = createDomain();
		let transaction = newTransaction(domain, pool);
		let p = domain.run(() => new Promise(transaction).then(begin));
		const req = domain && domain.req;

		function run(fn) {
			return p.then(() => fn(domain));
		}
		run.rollback = function(error) {
			return Promise.resolve(rollback(domain, error))
				.then(() => callHook('afterTransactionRollback', c, req, error));
		};
		run.commit = function() {
			return Promise.resolve(callHook('beforeTransactionCommit', c, req))
				.then(() => commit(domain))
				.then(() => callHook('afterTransactionCommit', c, req));
		};
		return run;

		function begin() {
			return Promise.resolve()
				.then(() => callHook('beforeTransactionBegin', c, req))
				.then(() => _begin(domain, options))
				.then((res) => Promise.resolve(callHook('afterTransactionBegin', c, req)).then(() => res));
		}
	};

	c.query = function(query) {
		let domain = createDomain();
		let transaction = newTransaction(domain, pool);
		let p = domain.run(() => new Promise(transaction)
			.then(() => doQuery(domain, query).then(onResult, onError)));
		return p;

		function onResult(result) {
			releaseDbClient(domain);
			return result;
		}

		function onError(e) {
			releaseDbClient(domain);
			throw e;
		}
	};

	c.sqliteFunction = function(...args) {
		let domain = createDomain();
		let transaction = newTransaction(domain, pool);
		let p = domain.run(() => new Promise(transaction)
			.then(() => doSqliteFunction(domain, ...args).then(onResult, onError)));
		return p;

		function onResult(result) {
			releaseDbClient(domain);
			return result;
		}

		function onError(e) {
			releaseDbClient(domain);
			throw e;
		}
	};

	c.rollback = rollback;
	c.commit = commit;

	c.end = function() {
		if (poolOptions)
			return pool.end();
		else
			return Promise.resolve();
	};

	c.accept = function(caller) {
		caller.visitSqlite();
	};

	return c;
}

module.exports = newDatabase;
