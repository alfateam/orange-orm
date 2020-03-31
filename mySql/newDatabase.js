var createDomain = require('../createDomain');
var newTransaction = require('./newTransaction');
var newPromise = require('../table/promise');
var begin = require('../table/begin');
var newPool = require('./newPool');
var commit = require('../table/commit');
var rollback = require('../table/rollback');
var lock = require('../lock');
var runInTransaction = require('../runInTransaction');
var hostExpress = require('../hostExpress');

function newDatabase(connectionString, poolOptions) {
    var c = {};
    var pool;
	if (!poolOptions)
		pool = newPool.bind(null,connectionString, poolOptions);
	else
		pool = newPool(connectionString, poolOptions);

    c.transaction = function(options, fn) {
        if ((arguments.length === 1) && (typeof options === 'function')) {
            return runInTransaction({db: c, fn: options});
        }
        if ((arguments.length > 1)) {
            return runInTransaction({db: c, options: options, fn: fn});
        }

        var domain = createDomain();
        return domain.run(onRun);

        function onRun() {
            var transaction = newTransaction(domain, pool);
            return newPromise(transaction).then(begin);
        }
    };

    c.rollback = rollback;
	c.commit = commit;

    c.lock = lock;

    c.end = function() {
		if (poolOptions)
			return pool.end();
		else
			return promise();
    };

    c.accept = function(caller) {
        caller.visitMySql();
    };

    c.express = function(options) {
		options = {...options, db: c};
		return hostExpress({db: c, table: options.table});
	};

    return c;
}

module.exports = newDatabase;