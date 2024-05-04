var wrapQuery = require('./wrapQuery');
var encodeBoolean = require('./encodeBoolean');
var deleteFromSql = require('./deleteFromSql');
var selectForUpdateSql = require('./selectForUpdateSql');
var outputInsertedSql = require('./outputInsertedSql');
const limitAndOffset = require('./limitAndOffset');
const getManyDto = require('./getManyDto');
const formatDateOut = require('./formatDateOut');
const formatJSONOut = require('./formatJSONOut');
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
				rdb.engine = 'mssql';
				rdb.getManyDto = getManyDto;
				rdb.dbClient = client;
				rdb.dbClientDone = done;
				rdb.encodeBoolean = encodeBoolean;
				rdb.decodeJSON = decodeJSON;
				rdb.encodeJSON = JSON.stringify;
				rdb.deleteFromSql = deleteFromSql;
				rdb.selectForUpdateSql = selectForUpdateSql;
				rdb.outputInsertedSql = outputInsertedSql;
				rdb.lastInsertedIsSeparate = false;
				rdb.insertSql = insertSql;
				rdb.insert = insert;
				rdb.formatDateOut = formatDateOut;
				rdb.formatJSONOut = formatJSONOut;
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
				rdb.aggregateCount = 0;
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