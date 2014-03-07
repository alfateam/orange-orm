var newPara = require('../../query/newParameterized');

function _new(column) {
	
	return function(value) {
		if (value == null) {
			return newPara('\'' + column.dbNull + '\'');
		}
		return newPara('\'' + value + '\'');	
	}
}

module.exports = _new;