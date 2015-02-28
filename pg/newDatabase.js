var createDomain = require('domain').create;
var newTransaction = require('./newTransaction');
var promise = require('../table/promise');
var begin = require('../table/begin');
var commit = require('../table/commit');
var rollback = require('../table/rollback');
var newPool = require('./newPool');

function newDatabase(connectionString) {
    var pool = newPool(connectionString);
    var c = {};

    c.transaction = function() {
        var domain = createDomain();

        return domain.run(onRun);

        function onRun() {
            var transaction = newTransaction(domain, pool);
            var p = promise(transaction).then(begin);
            return p;
        }
    };

    c.rollback = rollback;
    c.commit = commit;

    return c;
}

module.exports = newDatabase;