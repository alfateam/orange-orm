var wrapQuery = require('./wrapQuery');
var wrapQueryStream = require('./wrapQueryStream');
var encodeBoolean = require('./encodeBoolean');
var encodeDate = require('./encodeDate');
var deleteFromSql = require('./deleteFromSql');
var selectForUpdateSql = require('./selectForUpdateSql');
var lastInsertedSql = require('./lastInsertedSql');

function newResolveTransaction(domain, pool) {
	var rdb = {};
	if (!pool.connect) {
		pool = pool();
		rdb.pool = pool;
	}

	return function(onSuccess, onError) {
		pool.connect(onConnected);

		function onConnected(err, client, done) {
			try {
				if (err) {
					onError(err);
					return;
				}
				client.executeQuery = wrapQuery(client);
				client.streamQuery = wrapQueryStream(client);
				rdb.dbClient = client;
				rdb.dbClientDone = done;
				rdb.encodeBoolean = encodeBoolean;
				rdb.encodeDate = encodeDate;
				rdb.deleteFromSql = deleteFromSql;
				rdb.selectForUpdateSql = selectForUpdateSql;
				rdb.lastInsertedSql = lastInsertedSql;
				rdb.lastInsertedIsSeparate = true;
				rdb.multipleStatements = false;
				rdb.accept = function(caller) {
					caller.visitSqlite();
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