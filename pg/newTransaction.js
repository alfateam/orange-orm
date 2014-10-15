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
                return
            }
            client.executeQuery = wrapQuery(client);
            domain.dbClient = client;
            domain.dbClientDone = done;
            domain.rdb = {};    
            domain.rdb.encodeBuffer = encodeBuffer;
            domain.rdb.deleteFromSql = deleteFromSql;
            onSuccess();
        }
    };
};

module.exports = newResolveTransaction;