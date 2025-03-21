var wrapQuery = require('./wrapQuery');
var encodeBoolean = require('../tedious/encodeBoolean');
var deleteFromSql = require('../tedious/deleteFromSql');
var selectForUpdateSql = require('../tedious/selectForUpdateSql');
const limitAndOffset = require('../tedious/limitAndOffset');
const formatDateOut = require('../tedious/formatDateOut');
const formatJSONOut = require('../tedious/formatJSONOut');
const insertSql = require('../tedious/insertSql');
const insert = require('../tedious/insert');
const quote = require('../tedious/quote');

function newResolveTransaction(domain, pool, { readonly = false } = {}) {
	var rdb = {poolFactory: pool};
	if (!pool.connect) {
		pool = pool();
		rdb.pool = pool;
	}
	rdb.engine = 'mssqlNative';
	rdb.encodeBoolean = encodeBoolean;
	rdb.decodeJSON = decodeJSON;
	rdb.encodeJSON = JSON.stringify;
	rdb.formatDateOut = formatDateOut;
	rdb.formatJSONOut = formatJSONOut;
	rdb.deleteFromSql = deleteFromSql;
	rdb.selectForUpdateSql = selectForUpdateSql;
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
	rdb.aggregateCount = 0;
	rdb.quote = quote;
	rdb.cache = {};

	if (readonly) {
		rdb.dbClient = {
			executeQuery: function(query, callback) {
				pool.connect((err, client, done) => {
					if (err) {
						return callback(err);
					}
					try {
						client.setUseUTC(false);
						wrapQuery(client)(query, (err, res) => {
							done();
							callback(err, res);
						});
					} catch (e) {
						done();
						callback(e);
					}
				});
			}
		};
		domain.rdb = rdb;
		return (onSuccess) => onSuccess();
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
function decodeJSON(value){
	return JSON.parse(value);
}

module.exports = newResolveTransaction;