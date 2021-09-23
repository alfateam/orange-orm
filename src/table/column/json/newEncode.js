var newPara = require('../../query/newParameterized');
var purify = require('./purify');
var getSessionSingleton = require('../../getSessionSingleton');

function _new(column) {

	return function(candidate) {
		var value = purify(candidate);
		if (value == null) {
			if(column.dbNull === null)
				return newPara('null');
			return newPara('\'' + column.dbNull + '\'');
		}
		var encodeCore = getSessionSingleton('encodeJSON');

		if (encodeCore) {
			value = encodeCore(value);
		}
		return newPara('?', [value]);

	};
}

module.exports = _new;