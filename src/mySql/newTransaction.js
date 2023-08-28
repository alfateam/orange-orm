let wrapQuery = require('./wrapQuery');
let encodeBoolean = require('./encodeBoolean');
let deleteFromSql = require('./deleteFromSql');
let selectForUpdateSql = require('./selectForUpdateSql');
let lastInsertedSql = require('./lastInsertedSql');
let limitAndOffset = require('./limitAndOffset');

function newResolveTransaction(domain, pool) {
	var rdb = {poolFactory: pool};
	if (!pool.connect) {
		pool = pool();
		rdb.pool = pool;
	}

	return function(onSuccess, onError) {
		pool.connect(onConnected);

		function onConnected(err, connection, done) {
			try {
				if (err) {
					onError(err);
					return;
				}
				connection.executeQuery = wrapQuery(connection);
				// connection.streamQuery = wrapQueryStream(connection);
				rdb.dbClient = connection;
				rdb.dbClientDone = done;
				rdb.encodeBoolean = encodeBoolean;
				rdb.deleteFromSql = deleteFromSql;
				rdb.insertDefault = 'VALUES ()';
				rdb.selectForUpdateSql = selectForUpdateSql;
				rdb.lastInsertedIsSeparate = true;
				rdb.lastInsertedSql = lastInsertedSql;
				rdb.multipleStatements = false;
				rdb.limitAndOffset = limitAndOffset;
				rdb.accept = function(caller) {
					caller.visitMySql();
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