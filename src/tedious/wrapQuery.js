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
		const results = []; // Array to hold multiple result sets
		let currentResult = []; // Current result set being built
		let hasResultSet = false; // Track if we're in an actual result set

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
			currentResult.push(tmp);
			hasResultSet = true; // We're definitely in a result set
		});

		// Handle column metadata - indicates a result set is starting
		request.on('columnMetadata', (_columns) => {
			hasResultSet = true; // A result set is starting (even if it ends up empty)
		});

		// Handle end of each result set
		request.on('doneInProc', (_rowCount, _more) => {
			// End of a result set within a stored procedure
			// Add to results if we had a result set (even if empty)
			if (hasResultSet) {
				results.push(currentResult);
				currentResult = [];
				keys = null; // Reset keys for next result set
				hasResultSet = false; // Reset for next potential result set
			}
		});

		request.on('doneProc', (_rowCount, _more) => {
			// End of stored procedure execution
			// Add to results if we had a result set (even if empty)
			if (hasResultSet) {
				results.push(currentResult);
				currentResult = [];
				hasResultSet = false; // Reset for next potential result set
			}
		});

		connection.execSql(request);

		function onInnerCompleted(err) {
			if (err) {
				onCompleted(extractError(err));
			} else {
				// If we have any remaining result set, add it
				if (hasResultSet) {
					results.push(currentResult);
				}

				// Return based on number of actual result sets
				if (results.length === 0) {
					// No result sets - return empty array
					onCompleted(null, []);
				} else {
					// Multiple result sets - return as array of arrays
					onCompleted(null, results);
				}
			}
		}
	}
}

// Helper functions remain the same
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
		else if (Number.isInteger(p)) {
			// Check if the integer is within the 32-bit signed integer range
			if (p >= -2147483648 && p <= 2147483647) {
				return TYPES.Int;
			} else {
				return TYPES.BigInt;
			}
		}
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