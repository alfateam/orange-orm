let createDomain = require('../createDomain');
let newTransaction = require('./newTransaction');
let _begin = require('../table/begin');
let commit = require('../table/commit');
let rollback = require('../table/rollback');
let newPool = require('./newPool');
let express = require('../hostExpress');
let hostLocal = require('../hostLocal');
let doQuery = require('../query');
let releaseDbClient = require('../table/releaseDbClient');
let setSessionSingleton = require('../table/setSessionSingleton');

function newDatabase(connectionString, poolOptions) {
	if (!connectionString)
		throw new Error('Connection string cannot be empty');
	var pool;
	if (!poolOptions)
		pool = newPool.bind(null, connectionString, poolOptions);
	else
		pool = newPool(connectionString, poolOptions);

	let c = { poolFactory: pool, hostLocal, express };

	c.transaction = function(options, fn) {
		if ((arguments.length === 1) && (typeof options === 'function')) {
			fn = options;
			options = undefined;
		}
		let domain = createDomain();

		if (fn)
			return domain.run(runInTransaction);
		else
			return domain.run(run);

		function begin() {
			return _begin(domain, options);
		}

		async function runInTransaction() {
			let result;
			let transaction = newTransaction(domain, pool, options);
			await new Promise(transaction)
				.then(begin)
				.then(() => fn(domain))
				.then((res) => result = res)
				.then(() => c.commit(domain))
				.then(null, (e) => c.rollback(domain,e));
			return result;
		}


		function run() {
			let p;
			let transaction = newTransaction(domain, pool, options);
			p = new Promise(transaction);

			return p.then(begin);
		}

	};

	c.createTransaction = function(options) {
		let domain = createDomain();
		let transaction = newTransaction(domain, pool);
		let p = domain.run(() => new Promise(transaction).then(begin));

		function run(fn) {
			return p.then(domain.run.bind(domain, fn));
		}

		run.rollback = rollback.bind(null, domain);
		run.commit = commit.bind(null, domain);
		return run;


		function begin() {
			return _begin(domain, options);
		}

	};

	c.query = function(query) {
		let domain = createDomain();
		let transaction = newTransaction(domain, pool);
		let p = domain.run(() => new Promise(transaction)
			.then(() => setSessionSingleton(domain, 'changes', []))
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
