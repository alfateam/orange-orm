function _new(column) {
	var c = 
//todo not create c
	//todo: convert, encode, decode, must handle dbNull and null
	c.encode = function(value) {
		if (value == null)
			return '' + column.dbNull;
		if (typeof(value) !== 'number') 
			throw new Error('\'' + value + '\' is not a number');		
		return encodeCore(value);
	};

	function encodeCore(value) {

		return '' + Math.floor(value);	
	}

	c.decode = function(value) {
		if (value == column.dbNull) {
			return null;
		}
		return value;
	};

	return c;
}

module.exports = _new;