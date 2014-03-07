var purify = require('./purify');

function _new(column) {
	
	return encode;

	function encode(value) {
		value = purify(value);
		if (value === null) {
			if (column.dbNull === null)
				return 'null';
			return '\'' + column.dbNull + '\'';
		}
		if (value)
			return 'TRUE';	
		return 'FALSE';				
	}
}

module.exports = _new;