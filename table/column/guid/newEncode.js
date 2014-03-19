var newPara = require('../../query/newParameterized');
var negotiateGuidFormat = require('./negotiateGuidFormat');

function _new(column) {
	
	return function(candidate) {
		var value = negotiateGuidFormat(candidate);
		if (value == null) {
			return newPara('\'' + column.dbNull + '\'');
		}
		return newPara('\'' + value + '\'');	
	}
}

module.exports = _new;