const wrapQuery = require('../mssql/wrapQuery');
const encodeBoolean = require('./encodeBoolean');
const deleteFromSql = require('./deleteFromSql');
const selectForUpdateSql = require('./selectForUpdateSql');
const lastInsertedSql = require('./lastInsertedSql');
const formatDateOut = require('./formatDateOut');
const insertSql = require('./insertSql');
const insert = require('./insert');
const limitAndOffset = require('./limitAndOffset');

function newResolveTransaction(domain, pool, { readonly } = {}) {
	var rdb = {poolFactory: pool};
	if (!pool.connect) {
		pool = pool();
		rdb.pool = pool;
	}
	rdb.engine = 'sap';
	rdb.encodeBoolean = encodeBoolean;
	rdb.decodeJSON = decodeJSON;
	rdb.encodeJSON = JSON.stringify;
	rdb.deleteFromSql = deleteFromSql;
	rdb.selectForUpdateSql = selectForUpdateSql;
	rdb.formatDateOut = formatDateOut;
	rdb.lastInsertedSql = lastInsertedSql;
	rdb.insertSql = insertSql;
	rdb.insert = insert;
	rdb.lastInsertedIsSeparate = true;
	rdb.multipleStatements = false;
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
		caller.visitSap();
	};
	rdb.aggregateCount = 0;
	rdb.quote = (name) => `[${name}]`;

	if (readonly) {
		rdb.dbClient = {
			executeQuery: function(query, callback) {
				pool.connect((err, client, done) => {
					if (err) {
						return callback(err);
					}
					try {
						client.executeQuery = wrapQuery(client);
						rdb.dbClient = client;
						wrapQuery(client)(query, (err, res) => {
							done();
							rdb.dbClient = undefined;
							callback(err, res);
						});
					} catch (e) {
						done();
						rdb.dbClient = undefined;
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

function decodeJSON(value) {
	return JSON.parse(value);
}

module.exports = newResolveTransaction;