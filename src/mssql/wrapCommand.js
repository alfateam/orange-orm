var log = require('../table/log');
var getSessionSingleton = require('../table/getSessionSingleton');

function wrapCommand(_context, connection) {
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

			const isStoredProcCall = /EXECUTE\s+/i.test(sql) || /EXEC\s+/i.test(sql);
			let hexVariables = [];

			for (let i = 0; i < params.length; i++) {
				const parameter = params[i];

				if (typeof parameter === 'string') {
					const byteLength = Buffer.from(parameter, 'utf8').length;

					if (hasNonAsciiCharacters(parameter)) {
						const hexValue = stringToHex(parameter);

						if (isStoredProcCall) {
							const varName = `@hex_param_${i}`;
							const convertClause = `CONVERT(VARCHAR(${byteLength}), CONVERT(VARBINARY(${byteLength}), 0x${hexValue}))`;

							hexVariables.push({
								declaration: `DECLARE ${varName} VARCHAR(${byteLength})`,
								assignment: `SET ${varName} = ${convertClause}`
							});

							replacements.push({
								index: i,
								replacement: varName
							});
						} else {
							const convertClause = `CONVERT(VARCHAR(${byteLength}), CONVERT(VARBINARY(${byteLength}), 0x${hexValue}))`;
							replacements.push({
								index: i,
								replacement: convertClause
							});
						}
						parametersToRemove.push(i);
					} else {
						params[i] = sap.VarChar(parameter, byteLength);
					}
				}
			}

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

				if (isStoredProcCall && hexVariables.length > 0) {
					const lines = sql.split('\n');
					let insertIndex = 0;

					for (let i = 0; i < lines.length; i++) {
						if (/^\s*DECLARE\s+/i.test(lines[i])) {
							insertIndex = i + 1;
						}
					}

					const hexDeclarations = hexVariables.map(v => v.declaration);
					const hexAssignments = hexVariables.map(v => v.assignment);

					lines.splice(insertIndex, 0, ...hexDeclarations, ...hexAssignments);
					sql = lines.join('\n');
				}
			}

			parametersToRemove.reverse().forEach(index => {
				params.splice(index, 1);
			});
		}

		let affectedRows = 0;

		const q = runOriginalQuery.call(connection, sql, params, onInnerCompleted);

		if (q && typeof q.on === 'function') {
			q.on('rowcount', (count) => {
				if (typeof count === 'number') {
					affectedRows += count;
				}
			});
		}

		function onInnerCompleted(err, _rows, hasMore) {
			if (err) {
				if (err.code && err.code !== 3604) {
					onCompleted(err, { affectedRows: 0 });
					return;
				}
			}

			if (!hasMore) {
				onCompleted(null, { affectedRows });
			}
		}
	}
}

function hasNonAsciiCharacters(str) {
	return /[\u0080-\uFFFF]/.test(str);
}

function stringToHex(str) {
	return Buffer.from(str, 'utf8').toString('hex');
}

module.exports = wrapCommand;
