const wrapQuery = require('./wrapQuery');
const encodeBoolean = require('../sqlite/encodeBoolean');
const deleteFromSql = require('../sqlite/deleteFromSql');
const selectForUpdateSql = require('../sqlite/selectForUpdateSql');
const lastInsertedSql = require('../sqlite/lastInsertedSql');
const limitAndOffset = require('../sqlite/limitAndOffset');
const formatBigintOut = require('../sqlite/formatBigintOut');
const insertSql = require('../sqlite/insertSql');
const insert = require('../sqlite/insert');
const quote = require('../sqlite/quote');

function newResolveTransaction(domain, pool, { readonly = false } = {})  {
	var rdb = {poolFactory: pool};
	if (!pool.connect) {
		pool = pool();
		rdb.pool = pool;
	}
	rdb.engine = 'sqlite';
	rdb.encodeBoolean = encodeBoolean;
	rdb.decodeJSON = decodeJSON;
	rdb.encodeJSON = JSON.stringify;
	rdb.deleteFromSql = deleteFromSql;
	rdb.selectForUpdateSql = selectForUpdateSql;
	rdb.lastInsertedSql = lastInsertedSql;
	rdb.formatBigintOut = formatBigintOut;
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

	if (readonly) {
		rdb.dbClient = {
			executeQuery: function(query, callback) {
				pool.connect((err, client, done) => {
					if (err) {
						return callback(err);
					}
					try {
						wrapQuery(domain, client)(query, (err, res) => {
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
				client.executeQuery = wrapQuery(domain, client);
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