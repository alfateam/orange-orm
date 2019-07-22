var wrapQuery = require('./wrapQuery');
var wrapQueryStream = require('./wrapQueryStream');
var deleteFromSql = require('./deleteFromSql');
var selectForUpdateSql = require('./selectForUpdateSql');
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
            rdb.encodeBoolean = connection.escape.bind(connection);
            rdb.encodeDate = encodeDate;
            rdb.deleteFromSql = deleteFromSql;
            rdb.selectForUpdateSql = selectForUpdateSql;
            rdb.multipleStatements = true;
            rdb.accept = function(caller) {
                caller.visitMysql();
            };
            domain.rdb = rdb;    
            onSuccess();
        }
    };
}

module.exports = newResolveTransaction;