const encodeBoolean = require('../sqlite/encodeBoolean');
const encodeBinary = require('../nodeSqlite/encodeBinary');
const decodeBinary = require('../nodeSqlite/decodeBinary');
const deleteFromSql = require('../sqlite/deleteFromSql');
const selectForUpdateSql = require('../sqlite/selectForUpdateSql');
const lastInsertedSql = require('../sqlite/lastInsertedSql');
const limitAndOffset = require('../sqlite/limitAndOffset');
const formatBigintOut = require('../sqlite/formatBigintOut');
const insertSql = require('../sqlite/insertSql');
const insert = require('../sqlite/insert');
const quote = require('../sqlite/quote');

function newResolveTransaction(domain, pool)  {
	var rdb = { poolFactory: pool };
	rdb.engine = 'sqlite';
	rdb.encodeBoolean = encodeBoolean;
	rdb.encodeBinary = encodeBinary;
	rdb.decodeBinary = decodeBinary;
	rdb.decodeJSON = decodeJSON;
	rdb.encodeJSON = JSON.stringify;
	rdb.formatBigintOut = formatBigintOut;
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
	rdb.quote = quote;
	rdb.cache = {};
	rdb.changes = [];

	return function(onSuccess, onError) {
		pool.connect(onConnected);

		function onConnected(err, client, done) {
			try {
				if (err) {
					onError(err);
					return;
				}
				rdb.dbClient = client;
				rdb.dbClientDone = done;
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
