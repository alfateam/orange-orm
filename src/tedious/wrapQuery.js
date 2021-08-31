let log = require('../table/log');
let replaceParamChar = require('./replaceParamChar');
const { Request, TYPES } = require('tedious');


function wrapQuery(connection) {
	return runQuery;

	function runQuery(query, onCompleted) {
		let params = query.parameters;
		let sql = replaceParamChar(query, params);
		let request = new Request(sql, (err, _rowCount, rows) => {
			if (err)
				onCompleted(err);
			else
				onCompleted(null, rows);

		});

		for (let i = 0; i < params.length; i++) {
			const param = params[i];
			const name = '@_' + i + 1;
			let type = TYPES.VarChar;
			if (!isNaN(param))
				type = TYPES.Numeric;
			else if (Buffer.isBuffer(param))
				type = TYPES.Binary;
			request.addParameter(name, type, param);
		}

		log(sql);
		log('parameters: ' + params);
		connection.execSql(request);
	}

}

module.exports = wrapQuery;