var newPara = require('../../query/newParameterized');
var purify = require('./purify');

function _new(column) {
	
	return function(candidate) {
		var value = purify(candidate);
		if (value == null) {
			if(column.dbNull === null)
				return newPara('null');
			return newPara('\'' + column.dbNull + '\'');
		}
		return newPara('?', [value]);	
	};
}

module.exports = _new;