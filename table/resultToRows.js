var all = require('./promise').all;
var subResultToRows = _subResultToRows;
var dbRowsToRows = require('./resultToRows/dbRowsToRows');

function resultToRows(span,result) {
	var rowsPromise = result[0].then(onResult);

	function onResult(result) {
		return dbRowsToRows(span,result);
	}

	result.shift();
	return subResultToRows(span, result).then(onSubRows);

	function onSubRows() {
		return rowsPromise;
	}
}

function _subResultToRows(span,result) {
	subResultToRows = require('./resultToRows/subResultToRows');
	return subResultToRows(span,result);
}

module.exports = resultToRows;