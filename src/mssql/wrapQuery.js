var log = require('../table/log');
var getSessionSingleton = require('../table/getSessionSingleton');

function wrapQuery(_context, connection) {
	var runOriginalQuery = connection.query;
	return runQuery;

	function runQuery(query, onCompleted) {
		var params = query.parameters;
		var sql = query.sql();
		log.emitQuery({ sql, parameters: params });

		const replacements = [];
		const parametersToRemove = [];
		const engine = getSessionSingleton(_context, 'engine');

		if (engine === 'sap') {
			const sap = connection.msnodesqlv8;

			// Check if this is a stored procedure call
			const isStoredProcCall = /EXECUTE\s+/i.test(sql) || /EXEC\s+/i.test(sql);
			let hexVariables = [];

			// Non-ASCII UTF-8 characters workaround
			for (let i = 0; i < params.length; i++) {
				const parameter = params[i];

				if (typeof parameter === 'string') {
					const paramLength = parameter.length;
					const byteLength = Buffer.from(parameter, 'utf8').length;

					if (hasNonAsciiCharacters(parameter)) {
						const hexValue = stringToHex(parameter);

						if (isStoredProcCall) {
							// For stored procedures, create a variable with exact lengths
							const varName = `@hex_param_${i}`;
							const convertClause = `CONVERT(VARCHAR(${paramLength}), CONVERT(VARBINARY(${byteLength}), 0x${hexValue}))`;

							hexVariables.push({
								declaration: `DECLARE ${varName} VARCHAR(${paramLength})`,
								assignment: `SET ${varName} = ${convertClause}`
							});

							replacements.push({
								index: i,
								replacement: varName
							});
						} else {
							// For regular queries, use inline conversion with exact lengths
							const convertClause = `CONVERT(VARCHAR(${paramLength}), CONVERT(VARBINARY(${byteLength}), 0x${hexValue}))`;
							replacements.push({
								index: i,
								replacement: convertClause
							});
						}
						parametersToRemove.push(i);
					} else {
						// For ASCII strings, use VarChar with exact byte length
						params[i] = sap.VarChar(parameter, byteLength);
					}
				}
			}

			// Apply replacements
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

				// For stored procedures, inject hex variable declarations
				if (isStoredProcCall && hexVariables.length > 0) {
					const lines = sql.split('\n');
					let insertIndex = 0;

					// Find the last DECLARE statement
					for (let i = 0; i < lines.length; i++) {
						if (/^\s*DECLARE\s+/i.test(lines[i])) {
							insertIndex = i + 1;
						}
					}

					// Insert hex variable declarations and assignments
					const hexDeclarations = hexVariables.map(v => v.declaration);
					const hexAssignments = hexVariables.map(v => v.assignment);

					lines.splice(insertIndex, 0, ...hexDeclarations, ...hexAssignments);
					sql = lines.join('\n');
				}
			}

			// Remove parameters in reverse order to maintain correct indices
			parametersToRemove.reverse().forEach(index => {
				params.splice(index, 1);
			});
		}

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

function hasNonAsciiCharacters(str) {
	// Check if string contains any character with code point > 127 (non-ASCII)
	return /[\u0080-\uFFFF]/.test(str);
}

function stringToHex(str) {
	return Buffer.from(str, 'utf8').toString('hex');
}

module.exports = wrapQuery;