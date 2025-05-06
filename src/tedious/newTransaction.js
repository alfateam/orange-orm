var wrapQuery = require('./wrapQuery');
var encodeBoolean = require('./encodeBoolean');
var deleteFromSql = require('./deleteFromSql');
var selectForUpdateSql = require('./selectForUpdateSql');
const limitAndOffset = require('./limitAndOffset');
const insertSql = require('./insertSql');
const getManyDto = require('./getManyDto');
const formatDateOut = require('./formatDateOut');
const formatJSONOut = require('./formatJSONOut');
const insert = require('./insert');
const quote = require('./quote');

function newResolveTransaction(domain, pool, { readonly = false } = {}) {
	var rdb = {poolFactory: pool};
	if (!pool.connect) {
		pool = pool();
		rdb.pool = pool;
	}
	rdb.engine = 'mssql';
	rdb.getManyDto = getManyDto;
	rdb.encodeBoolean = encodeBoolean;
	rdb.decodeJSON = decodeJSON;
	rdb.encodeJSON = JSON.stringify;
	rdb.deleteFromSql = deleteFromSql;
	rdb.selectForUpdateSql = selectForUpdateSql;
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
	rdb.quote = quote;

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
function decodeJSON(value){
	return JSON.parse(value);
}

module.exports = newResolveTransaction;