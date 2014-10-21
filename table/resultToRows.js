var subResultToRows = _subResultToRows;
var dbRowsToRows = require('./resultToRows/dbRowsToRows');

function resultToRows(span,result) {
	var rows = dbRowsToRows(span,result);
	result.shift();
	_subResultToRows(span, result);
	return rows;
}

function _subResultToRows(span,result) {
	subResultToRows = require('./resultToRows/subResultToRows');
	subResultToRows(span,result);
}

module.exports = resultToRows;