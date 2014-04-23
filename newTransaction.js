var pg = require('pg.js');
var begin = require('./table/begin');

function newResolveTransaction(domain, connectionString) {

    return function(onSuccess, onError) {
        var connectionError;
        domain.run(onRun);

        function onRun() {
            begin();
            pg.connect(connectionString, onConnected);
        }

        function onConnected(err, client, done) {
            if (err) {
                onError(err);
                return
            }
            domain.dbClient = client;
            domain.dbClientDone = done;
            onSuccess();
        }
    };
};

module.exports = newResolveTransaction;
