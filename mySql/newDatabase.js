var createDomain = require('domain').create;
var newTransaction = require('./newTransaction');
var newPromise = require('../table/promise');
var begin = require('../table/begin');
var mysql = require('mysql');
var commit = require('../table/commit');
var rollback = require('../table/rollback');


function newDatabase(connectionString) {
    var c = {};
    var pool = mysql.createPool(connectionString);

    c.transaction = function() {
        var domain = createDomain();
        return domain.run(onRun);

        function onRun() {
            var transaction = newTransaction(domain, pool);
            return newPromise(transaction).then(begin);
        }
    };

    c.commit = commit;
    c.rollback = rollback;

    return c;
}

module.exports = newDatabase;