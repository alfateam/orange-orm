var createDomain = require('../createDomain');
var newTransaction = require('./newTransaction');
var promise = require('../table/promise');
var begin = require('../table/begin');
var commit = require('../table/commit');
var rollback = require('../table/rollback');
var newPool = require('./newPool');
var lock = require('../lock');
var executeSchema = require('./schema');
var runInTransaction = require('../runInTransaction');

function newDatabase(connectionString, poolOptions) {
	var pool;
	if (!poolOptions)
		pool = newPool.bind(null,connectionString, poolOptions);
	else
		pool = newPool(connectionString, poolOptions);

    var c = {};

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
            var p = promise(transaction).then(begin).then(negotiateSchema);
            return p;
        }

        function negotiateSchema(previous) {
            var schema = options && options.schema;
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

    return c;
}

module.exports = newDatabase;