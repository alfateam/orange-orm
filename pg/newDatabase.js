var createDomain = require('../createDomain');
var newTransaction = require('./newTransaction');
var begin = require('../table/begin');
var commit = require('../table/commit');
var rollback = require('../table/rollback');
var newPool = require('./newPool');
var lock = require('../lock');
var executeSchema = require('./schema');
var runInTransaction = require('../runInTransaction');
var useHook = require('../useHook');

let versionArray = process.version.replace('v', '').split('.');
let major = parseInt(versionArray[0]);


function newDatabase(connectionString, poolOptions) {
    var pool = newPool(connectionString, poolOptions);
    var c = {};

    c.transaction = function(options, fn) {
        if ((arguments.length === 1) && (typeof options === 'function')) {
            return runInTransaction({db: c, fn: options});
        }
        if ((arguments.length > 1)) {
            return runInTransaction({db: c, options: options, fn: fn});
        }

        var domain = createDomain();
        if (useHook) {
            if (major < 12)
                return domain.run(onRun)
            else
                return domain.start().then(onRun);
        }
        else
            return domain.onRun(onRun);

        function onRun() {
            var transaction = newTransaction(domain, pool);
            return new Promise(transaction).then(begin).then(negotiateSchema);
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
        return pool.end();
    };

    c.accept = function(caller) {
        caller.visitPg();
    };

    return c;
}

module.exports = newDatabase;