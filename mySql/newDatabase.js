var createDomain = require('domain').create;
var newTransaction = require('./newTransaction');
var newPromise = require('../table/promise');
var begin = require('../table/begin');
var mysql = require('mysql');

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

    return c;
};

module.exports = newDatabase;