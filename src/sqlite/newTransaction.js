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

		function onConnected(err, client, done) {
			try {
				if (err) {
					onError(err);
					return;
				}
				client.executeQuery = wrapQuery(client);
				rdb.engine = 'sqlite';
				rdb.dbClient = client;
				rdb.dbClientDone = done;
				rdb.encodeBoolean = encodeBoolean;
				rdb.decodeJSON = decodeJSON;
				rdb.encodeJSON = JSON.stringify;
				rdb.deleteFromSql = deleteFromSql;
				rdb.selectForUpdateSql = selectForUpdateSql;
				rdb.lastInsertedSql = lastInsertedSql;
				rdb.insertSql = insertSql;
				rdb.insert = insert;
				rdb.lastInsertedIsSeparate = true;
				rdb.multipleStatements = false;
				rdb.limitAndOffset = limitAndOffset;
				rdb.accept = function(caller) {
					caller.visitSqlite();
				};
				rdb.aggregateCount = 0;
				rdb.cache = {};
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