var wrapQuery = require('./wrapQuery');
var encodeBoolean = require('../tedious/encodeBoolean');
var deleteFromSql = require('../tedious/deleteFromSql');
var selectForUpdateSql = require('../tedious/selectForUpdateSql');
var outputInsertedSql = require('../tedious/outputInsertedSql');
const limitAndOffset = require('../tedious/limitAndOffset');
const formatDateOut = require('../tedious/formatDateOut');
const insertSql = require('../tedious/insertSql');
const insert = require('../tedious/insert');

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
				client.setUseUTC(false);
				client.executeQuery = wrapQuery(client);
				rdb.engine = 'mssql';
				rdb.dbClient = client;
				rdb.dbClientDone = done;
				rdb.encodeBoolean = encodeBoolean;
				rdb.decodeJSON = decodeJSON;
				rdb.encodeJSON = JSON.stringify;
				rdb.formatDateOut = formatDateOut;
				rdb.deleteFromSql = deleteFromSql;
				rdb.selectForUpdateSql = selectForUpdateSql;
				rdb.outputInsertedSql = outputInsertedSql;
				rdb.insertSql = insertSql;
				rdb.insert = insert;
				rdb.lastInsertedIsSeparate = false;
				rdb.multipleStatements = true;
				rdb.begin = 'BEGIN TRANSACTION';
				rdb.limit = (span) => {
					if (span.offset)
						return '';
					else if (span.limit || span.limit === 0)
						return 'TOP ' + span.limit;
					else
						return '';
				};
				rdb.limitAndOffset = limitAndOffset;
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
function decodeJSON(value){
	return JSON.parse(value);
}

module.exports = newResolveTransaction;