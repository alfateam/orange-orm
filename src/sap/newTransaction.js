var wrapQuery = require('./wrapQuery');
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
				rdb.dbClient = client;
				rdb.dbClientDone = done;
				rdb.encodeBoolean = encodeBoolean;
				rdb.encodeDate = encodeDate;
				rdb.decodeJSON = decodeJSON;
				rdb.encodeJSON = JSON.stringify;
				rdb.deleteFromSql = deleteFromSql;
				rdb.selectForUpdateSql = selectForUpdateSql;
				rdb.lastInsertedSql = lastInsertedSql;
				rdb.lastInsertedIsSeparate = true;
				rdb.multipleStatements = false;
				rdb.begin = 'BEGIN TRANSACTION';
				rdb.limit = 'TOP';
				rdb.accept = function(caller) {
					caller.visitSap();
				};
				domain.rdb = rdb;
				onSuccess();
			} catch (e) {
				onError(e);
			}
		}
	};
}

function decodeJSON(value) {
	return JSON.parse(value);
}

module.exports = newResolveTransaction;