let wrapQuery = require('./wrapQuery');
let wrapQueryStream = require('./wrapQueryStream');
let deleteFromSql = require('./deleteFromSql');
let selectForUpdateSql = require('./selectForUpdateSql');
let encodeDate = require('./encodeDate');
let lastInsertedSql = require('./lastInsertedSql');


function newResolveTransaction(domain, pool) {
	let rdb = {};
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
				rdb.insertDefault = 'VALUES ()';
				rdb.selectForUpdateSql = selectForUpdateSql;
				rdb.lastInsertedIsSeparate = true;
				rdb.lastInsertedSql = lastInsertedSql;
				rdb.multipleStatements = true;
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