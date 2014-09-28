var purify = require('./purify');
var newParam = require('../../query/newParameterized');

function _new(column) {
	
	return encode;

	function encode(value) {
		value = purify(value);
		if (value === null) {
			if (column.dbNull === null)
				return newParam('null');
			return newParam('\'' + column.dbNull + '\'');
		}
		if (value)
			return newParam('true');	
		return newParam('false');				
	}
}

module.exports = _new;