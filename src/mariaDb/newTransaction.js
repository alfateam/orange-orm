const wrapQuery = require('../mySql/wrapQuery');
const wrapCommand = require('../mySql/wrapCommand');
const encodeBoolean = require('../mySql/encodeBoolean');
const deleteFromSql = require('../mySql/deleteFromSql');
const selectForUpdateSql = require('../mySql/selectForUpdateSql');
const lastInsertedSql = require('../mySql/lastInsertedSql');
const limitAndOffset = require('../mySql/limitAndOffset');
const formatBigintOut = require('../mySql/formatBigintOut');
const insertSql = require('../mySql/insertSql');
const insert = require('../mySql/insert');
const quote = require('../mySql/quote');

function newResolveTransaction(domain, pool, { readonly = false } = {}) {
	var rdb = { poolFactory: pool };
	if (!pool.connect) {
		pool = pool();
		rdb.pool = pool;
	}
	rdb.engine = 'mariadb';
	rdb.encodeBoolean = encodeBoolean;
	rdb.decodeJSON = decodeJSON;
	rdb.encodeDate = encodeDate;
	rdb.encodeDateTz = encodeDateTz;
	rdb.encodeJSON = JSON.stringify;
	rdb.deleteFromSql = deleteFromSql;
	rdb.selectForUpdateSql = selectForUpdateSql;
	rdb.lastInsertedIsSeparate = true;
	rdb.lastInsertedSql = lastInsertedSql;
	rdb.formatBigintOut = formatBigintOut;
	rdb.insertSql = insertSql;
	rdb.insert = insert;
	rdb.multipleStatements = false;
	rdb.limitAndOffset = limitAndOffset;
	rdb.accept = function(caller) {
		caller.visitMySql();
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

function decodeJSON(value) {
	return JSON.parse(value);
}

function encodeDate(date) {
	date = date.toISOString ? removeTimezone(date.toISOString()) : removeTimezone(date);
	return date;
}

function removeTimezone(isoString) {
	let dateTimePattern = /[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}(.[0-9]{3})?/;
	let match = isoString.match(dateTimePattern);
	return match ? match[0] : isoString;
}

function encodeDateTz(date) {
	if (date && date.toISOString)
		return removeTimezone(date.toISOString());
	if (typeof date === "string" && /(Z|[+-][0-9]{2}:[0-9]{2})$/.test(date))
		return removeTimezone(new Date(date).toISOString());
	return date;
}

module.exports = newResolveTransaction;
