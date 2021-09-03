var newPara = require('../../query/newParameterized');
var purify = require('./purify');
var getSessionSingleton = require('../../getSessionSingleton');

function _new(column) {
	var encode = function(value) {
		value = purify(value);
		if (value == null) {
			if (column.dbNull === null)
				return newPara('null');
			return newPara('\'' + column.dbNull + '\'');
		}
		var encodeCore = getSessionSingleton('encodeDate');
		return newPara(encodeCore(value));
	};

	return encode;

}

module.exports = _new;
