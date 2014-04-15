var newPara = require('../../query/newParameterized');
var stringIsSafe = require('./stringIsSafe');
var purify = require('./purify');

function _new(column) {

	return function(value) {
		value = purify(value);
		if (value == null) {
			if (column.dbNull === null)
				return newPara('null');
			return newPara('\'' + column.dbNull + '\'');
		}
		if(stringIsSafe(value))
			return newPara('\'' + value + '\'');
		var para = newPara('$');
		return para.addParameter(value);
	}
}

module.exports = _new;