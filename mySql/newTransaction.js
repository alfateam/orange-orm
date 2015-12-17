var wrapQuery = require('./wrapQuery');
var wrapQueryStream = require('./wrapQueryStream');
var deleteFromSql = require('./deleteFromSql');
var encodeDate = require('./encodeDate');

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
            connection.streamQuery = wrapQueryStream(connection);

            rdb.dbClient = connection;
            rdb.dbClientDone = connection.release.bind(connection);
            rdb.encodeBuffer = connection.escape.bind(connection);
            rdb.encodeDate = encodeDate;
            rdb.deleteFromSql = deleteFromSql;
            domain.rdb = rdb;
            domain.rdb.domainExit = domain.domainExit;
            domain.domainExit = undefined;
            onSuccess();
        }
    };
}

module.exports = newResolveTransaction;
