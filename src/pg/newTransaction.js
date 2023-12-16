var wrapQuery = require('./wrapQuery');
var wrapQueryStream = require('./wrapQueryStream');
var encodeDate = require('./encodeDate');
var encodeBoolean = require('./encodeBoolean');
var deleteFromSql = require('./deleteFromSql');
var selectForUpdateSql = require('./selectForUpdateSql');
var limitAndOffset = require('./limitAndOffset');
var formatDateColumn = require('./formatDateColumn');
var encodeJSON = require('./encodeJSON');
var insertSql = require('./insertSql');
var getManyDto = require('./getManyDto');


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
				client.streamQuery = wrapQueryStream(client);
				rdb.engine = 'pg';
				rdb.getManyDto = getManyDto;
				rdb.dbClient = client;
				rdb.dbClientDone = done;
				rdb.encodeBoolean = encodeBoolean;
				rdb.encodeDate = encodeDate;
				rdb.encodeJSON = encodeJSON;
				rdb.formatDateColumn = formatDateColumn;
				rdb.deleteFromSql = deleteFromSql;
				rdb.selectForUpdateSql = selectForUpdateSql;
				rdb.lastInsertedIsSeparate = false;
				rdb.insertSql = insertSql;
				rdb.multipleStatements = true;
				rdb.limitAndOffset = limitAndOffset;
				rdb.accept = function(caller) {
					caller.visitPg();
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