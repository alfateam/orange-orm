var wrapQuery = require('./wrapQuery');

function newResolveTransaction(domain, pool) {

    return function(onSuccess, onError) {
        pool.getConnection(onConnected);

        function onConnected(err, connection) {
            if (err) {
                onError(err);
                return
            }
            connection.query = wrapQuery(connection);
            domain.dbClient = connection;
            domain.dbClientDone = connection.release;
            domain.rdb = {};    
            onSuccess();
        }
    };
};

module.exports = newResolveTransaction;