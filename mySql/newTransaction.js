var wrapQuery = require('./wrapQuery');
var deleteFromSql = require('./deleteFromSql');

function newResolveTransaction(domain, pool) {

    return function(onSuccess, onError) {
        pool.getConnection(onConnected);

        function onConnected(err, connection) {
            if (err) {
                onError(err);
                return
            }
            connection.executeQuery = wrapQuery(connection);
            domain.dbClient = connection;
            domain.dbClientDone = connection.release;
            domain.rdb = {};    
            domain.rdb.encodeBuffer = connection.escape.bind(connection);
            domain.rdb.deleteFromSql = deleteFromSql;
            onSuccess();
        }
    };
};

module.exports = newResolveTransaction;