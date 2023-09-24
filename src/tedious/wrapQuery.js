var log = require('../table/log');
var { Request, TYPES } = require('tedious');

function wrapQuery(connection) {
	return runQuery;

	function runQuery(query, onCompleted) {
		const result = [];
		const sql = replaceParamChar(query.sql(), query.parameters);
		if (sql.length < 18 && query.parameters.length === 0) {
			if (sql === 'BEGIN TRANSACTION') {
				log.emitQuery({ sql, parameters: [] });
				connection.beginTransaction((err) => {
					onCompleted(extractError(err), []);
				});
				return;
			}
			else if (sql === 'COMMIT') {
				log.emitQuery({ sql, parameters: [] });
				connection.commitTransaction((err) => {
					onCompleted(extractError(err), []);
				});
				return;
			}
			else if (sql === 'ROLLBACK') {
				log.emitQuery({ sql, parameters: [] });
				connection.rollbackTransaction((err) => {
					onCompleted(extractError(err), []);
				});
				return;
			}
		}
		let keys;
		var request = new Request(sql, onInnerCompleted);
		const params = addParameters(request, query.parameters);
		request.on('row', rows => {
			const tmp = {};
			if (!keys) {
				keys = Object.keys(rows);
			}
			keys.forEach((cols) => {
				tmp[cols] = rows[cols].value;
			});
			result.push(tmp);
		});
		log.emitQuery({ sql, parameters: params });
		connection.execSql(request);

		function onInnerCompleted(err) {
			if (err) {
				onCompleted(extractError(err));
			}
			else
				onCompleted(null, result);
		}
	}

	function extractError(e) {
		if (e && e.errors)
			return e.errors[0];
		else
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

function addParameters(request, params) {
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
		// @ts-ignore
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