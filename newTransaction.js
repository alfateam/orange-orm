var pg = require('pg.js');

function newResolveTransaction(domain, connectionString) {

    return function(onSuccess, onError) {
        var connectionError;
        pg.connect(connectionString, onConnected);

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