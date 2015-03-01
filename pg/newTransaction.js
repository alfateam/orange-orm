var wrapQuery = require('./wrapQuery');
var encodeBuffer = require('./encodeBuffer');
var deleteFromSql = require('./deleteFromSql');

function newResolveTransaction(domain, pool) {

    return function(onSuccess, onError) {
        pool.connect(onConnected);

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