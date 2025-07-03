var log = require('../table/log');

function wrapQuery(_context, connection) {
	let CachedRequest = null;
	let CachedTypes = null;

	return runQuery;

	function runQuery(query, onCompleted) {
		if (!CachedRequest || !CachedTypes) {
			import('tedious')
				.then(({ Request, TYPES }) => {
					CachedRequest = Request;
					CachedTypes = TYPES;
					doQuery(query, onCompleted);
				})
				.catch(err => onCompleted(extractError(err), []));
		}
		else {
			doQuery(query, onCompleted);
		}
	}

	function doQuery(query, onCompleted) {
		const result = [];

		log.emitQuery({ sql: query.sql(), parameters: query.parameters });
		const sql = replaceParamChar(query.sql(), query.parameters);

		// Transaction statements
		if (sql.length < 18 && query.parameters.length === 0) {
			if (sql === 'BEGIN TRANSACTION') {
				connection.beginTransaction((err) => {
					onCompleted(extractError(err), []);
				});
				return;
			}
			else if (sql === 'COMMIT') {
				connection.commitTransaction((err) => {
					onCompleted(extractError(err), []);
				});
				return;
			}
			else if (sql === 'ROLLBACK') {
				connection.rollbackTransaction((err) => {
					onCompleted(extractError(err), []);
				});
				return;
			}
		}

		let keys;
		// Now we can safely create Request using CachedRequest
		var request = new CachedRequest(sql, onInnerCompleted);
		addParameters(request, query.parameters, CachedTypes);

		request.on('row', rows => {
			const tmp = {};
			if (!keys) {
				keys = Object.keys(rows);
			}
			keys.forEach(cols => {
				tmp[cols] = rows[cols].value;
			});
			result.push(tmp);
		});

		connection.execSql(request);

		function onInnerCompleted(err) {
			if (err) {
				onCompleted(extractError(err));
			} else {
				onCompleted(null, result);
			}
		}
	}
}

// same helpers as before

function extractError(e) {
	if (e && e.errors) {
		return e.errors[0];
	}
	else {
		return e;
	}
}

function replaceParamChar(sql, params) {
	if (params.length === 0)
		return sql;
	var splitted = sql.split('?');
	sql = '';
	var lastIndex = splitted.length - 1;
	for (var i = 0; i < lastIndex; i++) {
		sql += splitted[i] + '@' + i;
	}
	sql += splitted[lastIndex];
	return sql;
}

function addParameters(request, params, TYPES) {
	const res = [];
	for (let i = 0; i < params.length; i++) {
		const p = [`${i}`, toType(params[i]), params[i]];
		request.addParameter.apply(request, p);
		res.push(p);
	}
	return res;

	function toType(p) {
		if (typeof p === 'string')
			return TYPES.VarChar;
		else if (Number.isInteger(p))
			return TYPES.Int;
		else if (typeof p === 'number')
			return TYPES.Money;
		else if (p instanceof Date && !isNaN(p))
			return TYPES.Date;
		else if (Array.isArray(p))
			return TYPES.NVarChar;
		else if (Buffer.isBuffer(p))
			return TYPES.VarBinary;
		else if (typeof p === 'object' && p instanceof Object)
			return TYPES.NVarChar;
		else
			throw new Error('Unknown data type');
	}
}

module.exports = wrapQuery;
