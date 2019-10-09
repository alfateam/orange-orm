var wrapQuery = require('./wrapQuery');
var wrapQueryStream = require('./wrapQueryStream');
var deleteFromSql = require('./deleteFromSql');
var selectForUpdateSql = require('./selectForUpdateSql');
var encodeDate = require('./encodeDate');

function newResolveTransaction(domain, pool) {
    var rdb = {};
    if (!pool.connect) {
        pool = pool();
        rdb.pool = pool;
    }

	return function(onSuccess, onError) {
		pool.connect(onConnected);

		function onConnected(err, connection) {
			try {
				if (err) {
					onError(err);
					return;
				}
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
			} catch (e) {
				onError(e);
			}
		}
	};
}

module.exports = newResolveTransaction;