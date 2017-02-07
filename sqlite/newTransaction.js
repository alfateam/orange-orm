var wrapQuery = require('./wrapQuery');
var wrapQueryStream = require('./wrapQueryStream');
var encodeBoolean = require('./encodeBoolean');
var encodeDate = require('./encodeDate');
var deleteFromSql = require('./deleteFromSql');
var selectForUpdateSql = require('./selectForUpdateSql');

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
            client.streamQuery = wrapQueryStream(client);            
            rdb.dbClient = client;
            rdb.dbClientDone = done;
            rdb.encodeBoolean = encodeBoolean;
            rdb.encodeDate = encodeDate;
            rdb.deleteFromSql = deleteFromSql;
            rdb.selectForUpdateSql = selectForUpdateSql;
            rdb.multipleStatements = false;
            domain.rdb = rdb;    
            onSuccess();
        }
    };
}

module.exports = newResolveTransaction;