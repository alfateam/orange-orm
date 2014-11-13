var createDomain = require('domain').create;
var newTransaction = require('./newTransaction');
var newPromise = require('../table/promise');
var begin = require('../table/begin');

function newDatabase(connectionString) {
    var c = {};

    c.transaction = function() {
        var domain = createDomain();

        return domain.run(onRun);

        function onRun() {
            var transaction = newTransaction(domain, connectionString);
            var p = newPromise(transaction).then(begin);
            return p;
        }
    };

    return c;
}

module.exports = newDatabase;