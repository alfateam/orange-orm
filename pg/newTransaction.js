var wrapQuery = require('./wrapQuery');
var wrapQueryStream = require('./wrapQueryStream');
var encodeDate = require('./encodeDate');
var encodeBoolean = require('./encodeBoolean');
var deleteFromSql = require('./deleteFromSql');
var selectForUpdateSql = require('./selectForUpdateSql');

function newResolveTransaction(domain, pool) {

    return function (onSuccess, onError) {
        pool.connect(onConnected);

        function onConnected(err, client, done) {
            try {
                if (err) {
                    onError(err);
                    return;
                }
                var rdb = {};
                client.executeQuery = wrapQuery(client);
                client.streamQuery = wrapQueryStream(client);
                rdb.dbClient = client;
                rdb.dbClientDone = done;
                rdb.encodeBoolean = encodeBoolean;
                rdb.encodeDate = encodeDate;
                rdb.deleteFromSql = deleteFromSql;
                rdb.selectForUpdateSql = selectForUpdateSql;
                rdb.multipleStatements = true;
                rdb.accept = function (caller) {
                    caller.visitPg();
                };
                domain.rdb = rdb;
                onSuccess();
            } catch (e) {
                onError(e);
            }
        }
    };
}

module.exports = newResolveTransaction;