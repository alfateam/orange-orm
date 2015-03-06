var wrapQuery = require('./wrapQuery');
var deleteFromSql = require('./deleteFromSql');

function newResolveTransaction(domain, pool) {

    return function(onSuccess, onError) {
        pool.connect(onConnected);

        function onConnected(err, connection) {
            if (err) {
                onError(err);
                return;
            }
            var rdb = {};
            connection.executeQuery = wrapQuery(connection);
            rdb.dbClient = connection;
            rdb.dbClientDone = connection.release.bind(connection);
            rdb.encodeBuffer = connection.escape.bind(connection);
            rdb.deleteFromSql = deleteFromSql;
            domain.rdb = rdb;    
            onSuccess();
        }
    };
}

module.exports = newResolveTransaction;