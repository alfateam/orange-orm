var createDomain = require('../createDomain');
var newTransaction = require('./newTransaction');
var promise = require('../table/promise');
var begin = require('../table/begin');
var commit = require('../table/commit');
var rollback = require('../table/rollback');
var newPool = require('./newPool');

function newDatabase(connectionString, poolOptions) {
    var pool = newPool(connectionString, poolOptions);
    var c = {};

    c.transaction = function() {
        var domain = createDomain();
        domain.enter();
        return promise().then(function() {
            var transaction = newTransaction(domain, pool);
            var p = promise(transaction).then(begin);
            return p;
        });
    };

    c.rollback = rollback;
    c.commit = commit;

    c.end = function() {
        return pool.end();
    };

    c.accept = function(caller) {
        caller.visitSqlite();
    };


    return c;
}

module.exports = newDatabase;
