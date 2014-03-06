var newEncode = _newEncode

function _new(column) {
	var encodeNext = _encodeNext;
	
	return function(value) {
		if (value === null) {
			if (column.dbNull === null)
				return 'null';
			return '\'' + column.dbNull + '\'';
		}
		if(typeof(value) === 'undefined')
			return encodeNext(null);
		if (value)
			return 'TRUE';	
		return 'FALSE';				
	}

	function _encodeNext(value) {
		encodeUndefined = newEncode(column);
		return encodeUndefined(value)
	}

}

function _newEncode(column) {
	return newEncode = require('./newEncode')(column);
}

module.exports = _new;