var newEncode = require('./float/newEncode');
var newDecode = require('./float/newDecode');

function _new(column) {
	column.encode = newEncode(column);
	column.decode = newDecode(column);
}

module.exports = _new;