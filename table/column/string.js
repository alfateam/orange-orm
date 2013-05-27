var newEncode = require('./string/newEncode');
var newDecode = require('./string/newDecode');

function _new(column) {
	var c = {};

	c.encode = newEncode(column);
	c.decode = newDecode(column);
	
	return c;
}

module.exports = _new;