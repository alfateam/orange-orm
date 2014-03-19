var newPara = require('../../query/newParameterized');
var stringIsSafe = require('./stringIsSafe');

function _new(column) {
	
	return function(value) {
		if (value == null)
			return newPara('\'' + column.dbNull + '\'');
		if(stringIsSafe(value))
			return newPara('\'' + value + '\'');
		var para = newPara('$');
		para.parameters().add(value);
		return para;
	}
}

module.exports = _new;