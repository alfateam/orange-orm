var log = require('../table/log');
var replaceParamChar = require('../pg/replaceParamChar');

function wrapQuery(connection) {
	return runQuery;

	async function runQuery(query, onCompleted) {
		try {

			var params = query.parameters;
			var sql = replaceParamChar(query, params);
			log.emitQuery({sql, parameters: params});

			let result;
			if (query.parameters.length === 0)
				result =  await connection.unsafe(sql);
			else
				result =  await connection.unsafe(sql, query.parameters);
			if (Array.isArray(result))
				result = result[result.length-1];
			onCompleted(null, result);
		}
		catch(e) {
			onCompleted(e);
		}
	}

}

module.exports = wrapQuery;