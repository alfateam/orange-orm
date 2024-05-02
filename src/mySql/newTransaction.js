const wrapQuery = require('./wrapQuery');
const encodeBoolean = require('./encodeBoolean');
const deleteFromSql = require('./deleteFromSql');
const selectForUpdateSql = require('./selectForUpdateSql');
const lastInsertedSql = require('./lastInsertedSql');
const limitAndOffset = require('./limitAndOffset');
const insertSql = require('./insertSql');
const insert = require('./insert');

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
				rdb.engine = 'mysql';
				rdb.dbClient = connection;
				rdb.dbClientDone = done;
				rdb.encodeBoolean = encodeBoolean;
				rdb.encodeJSON = JSON.stringify;
				rdb.deleteFromSql = deleteFromSql;
				rdb.selectForUpdateSql = selectForUpdateSql;
				rdb.lastInsertedIsSeparate = true;
				rdb.lastInsertedSql = lastInsertedSql;
				rdb.insertSql = insertSql;
				rdb.insert = insert;
				rdb.multipleStatements = false;
				rdb.limitAndOffset = limitAndOffset;
				rdb.accept = function(caller) {
					caller.visitMySql();
				};
				rdb.aggregateCount = 0;
				domain.rdb = rdb;
				onSuccess();
			} catch (e) {
				onError(e);
			}
		}
	};
}

module.exports = newResolveTransaction;