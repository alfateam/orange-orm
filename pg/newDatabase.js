let createDomain = require('../createDomain');
let newTransaction = require('./newTransaction');
let begin = require('../table/begin');
let commit = require('../table/commit');
let rollback = require('../table/rollback');
let newPool = require('./newPool');
let lock = require('../lock');
let executeSchema = require('./schema');
let useHook = require('../useHook');
let promise = require('promise/domains');
let versionArray = process.version.replace('v', '').split('.');
let major = parseInt(versionArray[0]);
let hostExpress = require('../hostExpress');

function newDatabase(connectionString, poolOptions) {
	var pool;
	if (!poolOptions)
		pool = newPool.bind(null,connectionString, poolOptions);
	else
		pool = newPool(connectionString, poolOptions);

	let c = {};

	c.transaction = function(options, fn) {
		if ((arguments.length === 1) && (typeof options === 'function')) {
			fn = options;
			options = undefined;
		}
		let domain = createDomain();

		if (fn)
			return domain.run(runInTransaction);
		else if ((major >= 12) && useHook) {
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
				.then(negotiateSchema)
				.then(fn)
				.then((res) => result = res)
				.then(c.commit)
				.then(null, c.rollback);
			return result;
		}

		function run() {
			let p;
			let transaction = newTransaction(domain, pool);
			if (useHook)
				p = new Promise(transaction);
			else
				p = new promise(transaction);

			return p.then(begin)
				.then(negotiateSchema);
		}

		function negotiateSchema(previous) {
			let schema = options && options.schema;
			if (!schema)
				return previous;
			return executeSchema(schema);
		}
	};

	c.rollback = rollback;
	c.commit = commit;
	c.lock = lock;
	c.schema = executeSchema;

	c.end = function() {
		if (poolOptions)
			return pool.end();
		else
			return promise();
	};

	c.accept = function(caller) {
		caller.visitPg();
	};
	c.express = hostExpress.bind(null,c);

	return c;
}

module.exports = newDatabase;