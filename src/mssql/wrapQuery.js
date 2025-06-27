var log = require('../table/log');
var getSessionSingleton = require('../table/getSessionSingleton');

function wrapQuery(_context, connection) {
	var runOriginalQuery = connection.query;
	return runQuery;

	function runQuery(query, onCompleted) {
		var params = query.parameters;
		var sql = query.sql();
		log.emitQuery({ sql, parameters: params });

		// Helper function to check for non-ASCII UTF-8 characters
		function hasNonAsciiCharacters(str) {
			// Check if string contains any character with code point > 127 (non-ASCII)
			return /[\u0080-\uFFFF]/.test(str);
		}

		function stringToHex(str) {
			return Buffer.from(str, 'utf8').toString('hex');
		}

		const replacements = [];
		const parametersToRemove = [];
		const engine = getSessionSingleton(_context, 'engine');

		if (engine === 'sap') {
			//non-ASCII UTF-8 characters workaround
			for (let i = 0; i < params.length; i++) {
				const parameter = params[i];

				if (typeof parameter === 'string' && hasNonAsciiCharacters(parameter)) {
					const hexValue = stringToHex(parameter);
					const convertClause = `CONVERT(VARCHAR(255), CONVERT(VARBINARY(127), 0x${hexValue}))`;

					replacements.push({
						index: i,
						replacement: convertClause
					});

					parametersToRemove.push(i);
				}
			}
		}

		// Second pass: replace the ? placeholders at specific positions
		if (replacements.length > 0) {
			let questionMarkIndex = 0;
			sql = sql.replace(/\?/g, (match) => {
				const replacement = replacements.find(r => r.index === questionMarkIndex);
				questionMarkIndex++;

				if (replacement) {
					return replacement.replacement;
				}
				return match;
			});
		}

		// Remove parameters in reverse order to maintain correct indices
		parametersToRemove.reverse().forEach(index => {
			params.splice(index, 1);
		});

		runOriginalQuery.call(connection, sql, params, onInnerCompleted);
		let result = [];

		function onInnerCompleted(err, rows, hasMore) {
			if (err) {
				if (err.code && err.code !== 3604)
					onCompleted(err);
				if (rows)
					result.push(rows);
				return;
			}
			result.push(rows);
			if (!hasMore) {

				if (result.length === 1)
					onCompleted(null, result[0]);
				else
					onCompleted(null, result);
			}
		}
	}

}

module.exports = wrapQuery;