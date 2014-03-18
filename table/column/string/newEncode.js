var newPara = require('../../query/newParameterized');
var stringIsSafePredicate = require('./stringIsSafePredicate');

function _new(column) {
	
	return function(value) {
		if (value == null)
			return newPara('\'' + column.dbNull + '\'');
		if(stringIsSafePredicate(value))
			return newPara('\'' + value + '\'');
		
	}
}

module.exports = _new;