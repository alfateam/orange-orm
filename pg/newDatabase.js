var createDomain = require('../createDomain');
var newTransaction = require('./newTransaction');
var promise = require('../table/promise');
var begin = require('../table/begin');
var commit = require('../table/commit');
var rollback = require('../table/rollback');
var newPool = require('./newPool');
var lock = require('../lock');
var executeSchema = require('./schema');

function newDatabase(connectionString, poolOptions) {
    var pool = newPool(connectionString, poolOptions);
    var c = {};

    c.transaction = function(options) {
        var domain = createDomain();
        domain.enter();
        return promise().then(function() {
            var transaction = newTransaction(domain, pool);
            var p = promise(transaction).then(begin).then(negotiateSchema);
            return p;

            function negotiateSchema(previous) {
                var schema = options && options.schema;
                if (!schema)
                    return previous;
                return executeSchema(schema);
            }
        });
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