var stringToBase64 = require('../../../stringToBase64');

function _new(column) {
	
	return function(value) {
		if (value == null) {
			return '\'' + column.dbNull + '\'';
		}
		var encoded = stringToBase64(value);
		return 'decode(\'' + encoded + '\',\'base64\')';	
	}
}

module.exports = _new;