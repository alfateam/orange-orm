var wrapQuery = require('../mssql/wrapQuery');
var encodeBoolean = require('./encodeBoolean');
var deleteFromSql = require('./deleteFromSql');
var selectForUpdateSql = require('./selectForUpdateSql');
var lastInsertedSql = require('./lastInsertedSql');
var formatDateColumn = require('./formatDateColumn');

function newResolveTransaction(domain, pool) {
	var rdb = {poolFactory: pool};
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
				rdb.decodeJSON = decodeJSON;
				rdb.encodeJSON = JSON.stringify;
				rdb.deleteFromSql = deleteFromSql;
				rdb.selectForUpdateSql = selectForUpdateSql;
				rdb.formatDateColumn = formatDateColumn;
				rdb.lastInsertedSql = lastInsertedSql;
				rdb.lastInsertedIsSeparate = true;
				rdb.multipleStatements = false;
				rdb.begin = 'BEGIN TRANSACTION';
				rdb.limit = (span) => {
					if (span.limit || span.limit == 0)
						return 'TOP ' + span.limit;
					else
						return '';
				};
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