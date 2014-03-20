var newPara = require('../../query/newParameterized');
var	stringIsSafe = require('./stringIsSafe');

function _new(value,column) {
		if (value == null)
			return newPara('' + column.dbNull + '');
		if(stringIsSafe(value))
			return newPara('' + value + '');
		var para = newPara('$');
		return para.addParameter(value);
}

module.exports = _new;