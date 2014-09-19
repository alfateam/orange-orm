var newPara = require('../../query/newParameterized');
var	stringIsSafe = require('./stringIsSafe');
var purify = require('./purify');

function _new(value,column) {
		value = purify(value);
		if (value == null)
			return newPara('' + column.dbNull + '');
		if(stringIsSafe(value))
			return newPara('' + value + '');
		var para = newPara('?');
		return para.addParameter(value);
}

module.exports = _new;