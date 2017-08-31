var all = require('./promise').all;
var dbRowsToRows = require('./resultToRows/dbRowsToRows');

function resultToRows(span,result) {
	return result[0].then(onResult);

	function onResult(result) {
		return dbRowsToRows(span,result);
	}

}

module.exports = resultToRows;