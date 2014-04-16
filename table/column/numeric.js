var newEncode = require('./numeric/newEncode');
var newDecode = require('./newDecodeCore');

function _new(column) {
	column.default = 0;
	column.encode = newEncode(column);
	column.decode = newDecode(column);
}

module.exports = _new;