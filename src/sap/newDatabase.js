let createDomain = require('../createDomain');
let newTransaction = require('./newTransaction');
let begin = require('../table/begin');
let commit = require('../table/commit');
let rollback = require('../table/rollback');
let newPool = require('./newPool');
let useHook = require('../useHook');
let promise = require('promise/domains');
let versionArray = process.version.replace('v', '').split('.');
let major = parseInt(versionArray[0]);
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
		pool = newPool.bind(null,connectionString, poolOptions);
	else
		pool = newPool(connectionString, poolOptions);

	let c = {poolFactory: pool, hostLocal, express};

	c.transaction = function(options, fn) {
		if ((arguments.length === 1) && (typeof options === 'function')) {
			fn = options;
			options = undefined;
		}
		let domain = createDomain();

		if (fn)
			return domain.run(runInTransaction);
		else if ((major >= 12) && useHook()) {
			domain.exitContext = true;
			return domain.start().then(run);
		}
		else
			return domain.run(run);

		async function runInTransaction() {
			let result;
			let transaction = newTransaction(domain, pool);
			await new Promise(transaction)
				.then(begin)
				.then(fn)
				.then((res) => result = res)
				.then(c.commit)
				.then(null, c.rollback);
			return result;
		}

		function run() {
			let p;
			let transaction = newTransaction(domain, pool);
			if (useHook())
				p = new Promise(transaction);
			else
				p = new promise(transaction);

			return p.then(begin);
		}

	};

	c.createTransaction = function() {
		let domain = createDomain();
		let transaction = newTransaction(domain, pool);
		let p = domain.run(() => new promise(transaction).then(begin));

		function run(fn) {
			return p.then(domain.run.bind(domain, fn));
		}
		return run;
	};

	c.bindTransaction = function() {
		// @ts-ignore
		var domain = process.domain;
		let p = domain.run(() => true);

		function run(fn) {
			return p.then(domain.run.bind(domain, fn));
		}
		return run;
	};

	c.query = function(query) {
		let domain = createDomain();
		let transaction = newTransaction(domain, pool);
		let p = domain.run(() => new Promise(transaction)
			.then(() => setSessionSingleton('changes', []))
			.then(() => doQuery(query).then(onResult, onError)));
		return p;

		function onResult(result) {
			releaseDbClient();
			return result;
		}

		function onError(e) {
			releaseDbClient();
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
		caller.visitSap();
	};

	return c;
}

module.exports = newDatabase;
