var pg = require('pg.js');
var wrapQuery = require('./wrapQuery');
var encodeBuffer = require('./encodeBuffer');
var deleteFromSql = require('./deleteFromSql');

function newResolveTransaction(domain, connectionString) {

    return function(onSuccess, onError) {
        var connectionError;
        pg.connect(connectionString, onConnected);

        function onConnected(err, client, done) {
            if (err) {
                onError(err);
                return;
            }
            var rdb = {};
            client.executeQuery = wrapQuery(client);
            rdb.dbClient = client;
            rdb.dbClientDone = done;
            rdb.encodeBuffer = encodeBuffer;
            rdb.deleteFromSql = deleteFromSql;
            domain.rdb = rdb;    
            onSuccess();
        }
    };
}

module.exports = newResolveTransaction;