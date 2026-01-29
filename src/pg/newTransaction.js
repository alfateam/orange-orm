var wrapQuery = require('./wrapQuery');
var wrapCommand = require('./wrapCommand');
var encodeDate = require('./encodeDate');
var encodeBoolean = require('./encodeBoolean');
var deleteFromSql = require('./deleteFromSql');
var selectForUpdateSql = require('./selectForUpdateSql');
var limitAndOffset = require('./limitAndOffset');
var formatDateOut = require('./formatDateOut');
var encodeJSON = require('./encodeJSON');
var insertSql = require('./insertSql');
var insert = require('./insert');
var quote = require('./quote');

function newResolveTransaction(domain, pool, { readonly = false } = {}) {
	var rdb = { poolFactory: pool };
	if (!pool.connect) {
		pool = pool();
		rdb.pool = pool;
	}

	rdb.engine = 'pg';
	rdb.encodeBoolean = encodeBoolean;
	rdb.encodeDate = encodeDate;
	rdb.encodeJSON = encodeJSON;
	rdb.formatDateOut = formatDateOut;
	rdb.deleteFromSql = deleteFromSql;
	rdb.selectForUpdateSql = selectForUpdateSql;
	rdb.lastInsertedIsSeparate = false;
	rdb.insertSql = insertSql;
	rdb.insert = insert;
	rdb.multipleStatements = true;
	rdb.limitAndOffset = limitAndOffset;
	rdb.accept = function(caller) {
		caller.visitPg();
	};
	rdb.aggregateCount = 0;
	rdb.quote = quote;
	rdb.cache = {};
	rdb.changes = [];

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
			},
			executeCommand: function(query, callback) {
				pool.connect((err, client, done) => {
					if (err) {
						return callback(err);
					}
					try {
						wrapCommand(domain, client)(query, (err, res) => {
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
				client.executeCommand = wrapCommand(domain, client);
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

module.exports = newResolveTransaction;
